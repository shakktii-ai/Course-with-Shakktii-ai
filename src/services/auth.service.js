import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  User,
  PlatformUser,
  Session,
  PasswordResetToken,
  EmailVerificationToken,
} from '../models/index.js';
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../lib/errors.js';
import { USER_STATUS, PLATFORM_ROLES, ORG_ROLES } from '../constants/index.js';
import { AuditService } from './audit.service.js';
import { SessionService } from './session.service.js';

const SESSION_EXPIRATION_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_CACHE_TTL_MS = 30 * 1000; // 30s in-memory session cache across parallel API calls
const LAST_ACTIVE_TOUCH_INTERVAL_MS = 5 * 60 * 1000; // Throttle lastActiveAt DB writes to every 5m

const sessionCache =
  globalThis.__aiAcademySessionCache || (globalThis.__aiAcademySessionCache = new Map());

function setCachedSession(token, userContext) {
  if (sessionCache.size > 500) {
    const oldestKey = sessionCache.keys().next().value;
    sessionCache.delete(oldestKey);
  }
  sessionCache.set(token, {
    userContext,
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
  });
}

export class AuthService {
  /**
   * Authenticate a user (PlatformUser or Organization User)
   */
  static async login({
    email,
    password,
    userType = 'TENANT',
    ipAddress = 'Unknown',
    userAgent = 'Unknown',
  }) {
    const normalizedEmail = email.toLowerCase().trim();

    let userModel = userType === 'PLATFORM' ? PlatformUser : User;
    const user = await userModel
      .findOne({ email: normalizedEmail })
      .select('+password')
      .exec();

    if (!user) {
      await AuditService.logEvent({
        userEmail: normalizedEmail,
        userType,
        action: 'FAILED_LOGIN',
        resourceType: 'USER',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: { reason: 'User not found' },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      throw new UnauthorizedError(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${waitMinutes} minutes.`
      );
    }

    // Check account status
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }
    if (user.status === USER_STATUS.INACTIVE) {
      throw new UnauthorizedError('Your account is currently inactive.');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }
      await user.save();

      await AuditService.logEvent({
        tenantId: user.tenantId,
        userId: user._id,
        userEmail: user.email,
        userType,
        action: 'FAILED_LOGIN',
        resourceType: 'USER',
        resourceId: String(user._id),
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: { attempts: user.failedLoginAttempts },
      });

      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts upon successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    // Create secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    const deviceInfo = SessionService.parseDeviceInfo(userAgent);

    const session = await Session.create({
      sessionToken,
      userId: user._id,
      userType,
      tenantId: user.tenantId || null,
      userAgent,
      ipAddress,
      deviceInfo,
      expiresAt,
      isValid: true,
      lastActiveAt: new Date(),
    });

    await AuditService.logEvent({
      tenantId: user.tenantId,
      userId: user._id,
      userEmail: user.email,
      userType,
      action: 'LOGIN',
      resourceType: 'SESSION',
      resourceId: String(session._id),
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: { deviceInfo },
    });

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      session: {
        id: session._id,
        token: sessionToken,
        expiresAt,
      },
    };
  }

  /**
   * Log out and terminate the current session
   */
  static async logout({ sessionToken, ipAddress = 'Unknown', userAgent = 'Unknown' }) {
    if (!sessionToken) return null;

    sessionCache.delete(sessionToken);

    const session = await Session.findOne({ sessionToken, isValid: true });
    if (!session) return null;

    session.isValid = false;
    session.revokedAt = new Date();
    session.revokedReason = 'User logout';
    await session.save();

    await AuditService.logEvent({
      tenantId: session.tenantId,
      userId: session.userId,
      userType: session.userType,
      action: 'LOGOUT',
      resourceType: 'SESSION',
      resourceId: String(session._id),
      status: 'SUCCESS',
      ipAddress,
      userAgent,
    });

    return true;
  }

  /**
   * Register a new organization learner or owner
   */
  static async register({
    email,
    password,
    name,
    phone = null,
    tenantId = null,
    initialRole = ORG_ROLES.STUDENT,
  }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Verify uniqueness within tenant (or globally if tenantId is null)
    const existing = await User.findOne({
      email: normalizedEmail,
      tenantId: tenantId || null,
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      tenantId: tenantId || null,
      roles: [initialRole],
      status: USER_STATUS.ACTIVE,
      isEmailVerified: false,
    });

    // Create email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await EmailVerificationToken.create({
      userId: user._id,
      userType: 'TENANT',
      email: user.email,
      token: verifyToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await AuditService.logEvent({
      tenantId: user.tenantId,
      userId: user._id,
      userEmail: user.email,
      userType: 'TENANT',
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: String(user._id),
      details: { role: initialRole, method: 'SELF_REGISTRATION' },
    });

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      verificationToken: verifyToken,
    };
  }

  /**
   * Request password reset token
   */
  static async forgotPassword({ email, userType = 'TENANT' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const userModel = userType === 'PLATFORM' ? PlatformUser : User;

    const user = await userModel.findOne({ email: normalizedEmail });

    // For security reasons, do not reveal whether user exists
    if (!user) {
      return { message: 'If an account exists with that email, a password reset link has been issued.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      userType,
      email: user.email,
      token: resetToken,
      expiresAt,
    });

    await AuditService.logEvent({
      tenantId: user.tenantId,
      userId: user._id,
      userEmail: user.email,
      userType,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'USER',
      resourceId: String(user._id),
    });

    return {
      message: 'If an account exists with that email, a password reset link has been issued.',
      resetToken, // Returned for programmatic confirmation/testing
    };
  }

  /**
   * Reset password with valid token
   */
  static async resetPassword({ token, newPassword }) {
    const tokenDoc = await PasswordResetToken.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new BadRequestError('Password reset link is invalid or has expired');
    }

    const userModel = tokenDoc.userType === 'PLATFORM' ? PlatformUser : User;
    const user = await userModel.findById(tokenDoc.userId);

    if (!user) {
      throw new NotFoundError('User associated with token not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    tokenDoc.isUsed = true;
    await tokenDoc.save();

    // Revoke all active sessions upon password reset for security
    await SessionService.revokeAllUserSessions(user._id);

    await AuditService.logEvent({
      tenantId: user.tenantId,
      userId: user._id,
      userEmail: user.email,
      userType: tokenDoc.userType,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'USER',
      resourceId: String(user._id),
    });

    return { success: true, message: 'Password updated successfully. Please log in.' };
  }

  /**
   * Verify email address with verification token
   */
  static async verifyEmail({ token }) {
    const tokenDoc = await EmailVerificationToken.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new BadRequestError('Email verification link is invalid or has expired');
    }

    const userModel = tokenDoc.userType === 'PLATFORM' ? PlatformUser : User;
    const user = await userModel.findById(tokenDoc.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    tokenDoc.isUsed = true;
    await tokenDoc.save();

    await AuditService.logEvent({
      tenantId: user.tenantId,
      userId: user._id,
      userEmail: user.email,
      userType: tokenDoc.userType,
      action: 'EMAIL_VERIFIED',
      resourceType: 'USER',
      resourceId: String(user._id),
    });

    return { success: true, message: 'Email address verified successfully' };
  }

  /**
   * Validate session token and return authenticated user context
   */
  static async getCurrentUser(sessionToken) {
    if (!sessionToken) {
      throw new UnauthorizedError('Authentication token missing');
    }

    // Fast-path: return cached session user context for rapid parallel API calls
    const cached = sessionCache.get(sessionToken);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.userContext;
    }

    const session = await Session.findOne({
      sessionToken,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) {
      sessionCache.delete(sessionToken);
      throw new UnauthorizedError('Session expired or invalidated. Please log in again.');
    }

    // Non-blocking, throttled lastActiveAt update (avoids a blocking DB write on every GET)
    const lastActiveMs = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
    if (Date.now() - lastActiveMs > LAST_ACTIVE_TOUCH_INTERVAL_MS) {
      Session.updateOne({ _id: session._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
    }

    const userModel = session.userType === 'PLATFORM' ? PlatformUser : User;
    const user = await userModel.findById(session.userId).lean();

    if (!user) {
      sessionCache.delete(sessionToken);
      throw new UnauthorizedError('User account associated with this session no longer exists');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      sessionCache.delete(sessionToken);
      throw new UnauthorizedError('Account has been suspended');
    }

    delete user.password;

    const userContext = {
      ...user,
      userType: session.userType,
      sessionId: session._id,
    };

    setCachedSession(sessionToken, userContext);
    return userContext;
  }
}

export default AuthService;

