import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { BaseService } from './base.service.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../lib/errors.js';
import { USER_STATUS } from '../constants/index.js';
import { AuditService } from './audit.service.js';
import { SessionService } from './session.service.js';

export class UserService extends BaseService {
  constructor() {
    super(User, 'User');
  }

  /**
   * Get paginated users scoped by tenant
   */
  async getTenantUsers(tenantId, options = {}) {
    return this.findPaginated(tenantId, {}, options);
  }

  /**
   * Create user with tenant isolation and audit logging
   */
  async createUser(tenantId, userData, creatorId = null) {
    const normalizedEmail = userData.email.toLowerCase().trim();

    const existing = await User.findOne({
      tenantId,
      email: normalizedEmail,
    });

    if (existing) {
      throw new ConflictError('A user with this email already exists in this organization');
    }

    const hashedPassword = await bcrypt.hash(userData.password || 'TemporaryPassword123!', 10);

    const user = await User.create({
      tenantId,
      email: normalizedEmail,
      password: hashedPassword,
      name: userData.name.trim(),
      phone: userData.phone || null,
      roles: userData.roles || ['STUDENT'],
      status: userData.status || USER_STATUS.ACTIVE,
      isEmailVerified: userData.isEmailVerified || false,
      createdBy: creatorId,
      updatedBy: creatorId,
    });

    await AuditService.logEvent({
      tenantId,
      userId: creatorId,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: String(user._id),
      details: { email: user.email, roles: user.roles },
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  /**
   * Update user details with tenant isolation
   */
  async updateUser(tenantId, userId, updateData, modifierId = null) {
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (updateData.name) user.name = updateData.name.trim();
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.avatarUrl !== undefined) user.avatarUrl = updateData.avatarUrl;
    if (updateData.roles && Array.isArray(updateData.roles)) user.roles = updateData.roles;
    if (updateData.status) user.status = updateData.status;

    user.updatedBy = modifierId;
    await user.save();

    await AuditService.logEvent({
      tenantId,
      userId: modifierId,
      action: 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: String(user._id),
      details: { updatedFields: Object.keys(updateData) },
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  /**
   * Change user password with current password verification
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Revoke other active sessions for security
    await SessionService.revokeAllUserSessions(userId);

    await AuditService.logEvent({
      tenantId: user.tenantId,
      userId,
      action: 'PASSWORD_CHANGE',
      resourceType: 'USER',
      resourceId: String(userId),
    });

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Activate or deactivate user status
   */
  async setUserStatus(tenantId, userId, status, modifierId = null) {
    if (!Object.values(USER_STATUS).includes(status)) {
      throw new BadRequestError(`Invalid user status: ${status}`);
    }

    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.status = status;
    user.updatedBy = modifierId;
    await user.save();

    // If suspended or deactivated, revoke all active sessions immediately
    if (status === USER_STATUS.SUSPENDED || status === USER_STATUS.INACTIVE) {
      await SessionService.revokeAllUserSessions(userId);
    }

    await AuditService.logEvent({
      tenantId,
      userId: modifierId,
      action: 'USER_STATUS_CHANGED',
      resourceType: 'USER',
      resourceId: String(userId),
      details: { newStatus: status },
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  /**
   * Delete user document with tenant isolation
   */
  async deleteUser(tenantId, userId, modifierId = null) {
    const user = await User.findOneAndDelete({ _id: userId, tenantId });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Revoke all sessions
    await SessionService.revokeAllUserSessions(userId);

    await AuditService.logEvent({
      tenantId,
      userId: modifierId,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: String(userId),
      details: { email: user.email },
    });

    return { success: true, message: 'User deleted successfully' };
  }
}

export const userService = new UserService();
export default userService;

