import { Session } from '../models/index.js';
import { NotFoundError } from '../lib/errors.js';
import { AuditService } from './audit.service.js';

export class SessionService {
  /**
   * Parse simple device info from user-agent
   */
  static parseDeviceInfo(userAgent = '') {
    const ua = userAgent.toLowerCase();
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = 'Tablet';
    }

    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';

    return { browser, os, device };
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId) {
    return Session.find({
      userId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActiveAt: -1 })
      .lean()
      .exec();
  }

  /**
   * Revoke an active session by session ID
   */
  static async revokeSession(userId, sessionId, reason = 'User requested revocation') {
    const session = await Session.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw new NotFoundError('Session not found or already terminated');
    }

    session.isValid = false;
    session.revokedAt = new Date();
    session.revokedReason = reason;
    await session.save();

    await AuditService.logEvent({
      tenantId: session.tenantId,
      userId,
      action: 'SESSION_REVOKED',
      resourceType: 'SESSION',
      resourceId: String(sessionId),
      details: { reason },
    });

    return session;
  }

  /**
   * Revoke all sessions for a user (e.g. password change, security reset)
   */
  static async revokeAllUserSessions(userId, keepSessionToken = null) {
    const filter = {
      userId,
      isValid: true,
    };

    if (keepSessionToken) {
      filter.sessionToken = { $ne: keepSessionToken };
    }

    const result = await Session.updateMany(filter, {
      $set: {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: 'Bulk session revocation',
      },
    });

    await AuditService.logEvent({
      userId,
      action: 'SESSION_REVOKED_ALL',
      resourceType: 'SESSION',
      details: { count: result.modifiedCount },
    });

    return result;
  }
}

export default SessionService;

