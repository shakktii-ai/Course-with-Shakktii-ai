import { AuditLog } from '../models/index.js';
import { executePaginatedQuery, parsePaginationParams, parseSortParams } from '../lib/pagination.js';
import { logger } from '../lib/logger.js';

export class AuditService {
  /**
   * Log a security or business event to the immutable AuditLog collection
   */
  static async logEvent({
    tenantId = null,
    userId = null,
    userEmail = null,
    userType = 'TENANT',
    action,
    resourceType,
    resourceId = null,
    details = {},
    ipAddress = 'Unknown',
    userAgent = 'Unknown',
    status = 'SUCCESS',
  }) {
    try {
      return await AuditLog.create({
        tenantId,
        userId,
        userEmail,
        userType,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
        status,
      });
    } catch (err) {
      // Audit logging failures should not crash user operations, but must be logged
      logger.error('[AuditService] Failed to record audit log', {
        action,
        error: err.message,
      });
      return null;
    }
  }

  /**
   * Retrieve paginated audit logs scoped by tenant or platform
   */
  static async getLogs(tenantId, inputParams = {}) {
    const { page, limit } = parsePaginationParams(inputParams);
    const sort = parseSortParams(inputParams, ['createdAt', 'action', 'status'], { createdAt: -1 });

    const query = {};
    if (tenantId) {
      query.tenantId = tenantId;
    }

    if (inputParams.action) {
      query.action = inputParams.action;
    }
    if (inputParams.status) {
      query.status = inputParams.status;
    }
    if (inputParams.resourceType) {
      query.resourceType = inputParams.resourceType;
    }

    return executePaginatedQuery(AuditLog, query, { page, limit, sort });
  }
}

export default AuditService;

