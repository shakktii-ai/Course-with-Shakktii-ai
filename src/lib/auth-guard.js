/**
 * AI Academy - Server-Side Auth & RBAC Route Guard
 * Enforces session validity, user active status, tenant isolation, and RBAC permissions.
 */

import { extractAuthToken, hasPermission, verifyTenantAccess } from './auth-helpers.js';
import { AuthService } from '../services/auth.service.js';
import { UnauthorizedError, ForbiddenError } from './errors.js';
import { connectToDatabase } from './mongodb.js';

/**
 * Validates request authentication and returns authenticated user context.
 * @param {Request} request
 * @param {object} options
 * @param {Array<string>|string} [options.permissions] - Required permission(s)
 * @param {string} [options.targetTenantId] - Specific tenant ID target to verify
 * @returns {Promise<object>} Authenticated user object
 */
export async function authenticateRequest(request, options = {}) {
  await connectToDatabase();

  const token = extractAuthToken(request);
  if (!token) {
    throw new UnauthorizedError('Authentication token or session cookie missing');
  }

  const user = await AuthService.getCurrentUser(token);

  // If specific tenant verification is requested
  if (options.targetTenantId) {
    verifyTenantAccess(user, options.targetTenantId);
  }

  // If permissions are required
  if (options.permissions) {
    const requiredPerms = Array.isArray(options.permissions)
      ? options.permissions
      : [options.permissions];

    const hasAll = requiredPerms.every((perm) => hasPermission(user.roles || [user.role], perm));
    if (!hasAll) {
      throw new ForbiddenError(
        `Insufficient permissions. Required: ${requiredPerms.join(', ')}`
      );
    }
  }

  return user;
}

