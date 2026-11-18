/**
 * AI Academy - Auth & Permission Helper Foundation
 * Prepares server-side authorization, tenant boundary enforcement, and RBAC helpers.
 */

import { PLATFORM_ROLES, PERMISSIONS } from '../constants/index.js';
import { UnauthorizedError, ForbiddenError, TenantIsolationError } from './errors.js';

/**
 * Standard Role-to-Permissions Mapping for Default RBAC
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  [PLATFORM_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [PLATFORM_ROLES.PLATFORM_ADMIN]: [
    PERMISSIONS.ORGANIZATION_CREATE,
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.ORGANIZATION_SUSPEND,
    PERMISSIONS.USER_READ,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.TUTOR_CHAT,
    PERMISSIONS.TUTOR_ANALYTICS_VIEW,
    PERMISSIONS.TUTOR_CONFUSION_MANAGE,
    PERMISSIONS.PLATFORM_MANAGE,
    PERMISSIONS.REPORT_SCHEDULE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  ORG_OWNER: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ASSIGN_ROLE,
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.ACADEMY_MANAGE,
    PERMISSIONS.ACADEMY_SETTINGS,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.COURSE_DELETE,
    PERMISSIONS.COURSE_PUBLISH,
    PERMISSIONS.COURSE_ARCHIVE,
    PERMISSIONS.COURSE_ASSIGN,
    PERMISSIONS.AI_GENERATE_COURSE,
    PERMISSIONS.AI_GENERATE_LESSON,
    PERMISSIONS.AI_REVIEW_CONTENT,
    PERMISSIONS.AI_APPROVE_CONTENT,
    PERMISSIONS.VIDEO_GENERATE,
    PERMISSIONS.VIDEO_PUBLISH,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.ASSESSMENT_EVALUATE,
    PERMISSIONS.CERTIFICATE_ISSUE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.TUTOR_CHAT,
    PERMISSIONS.TUTOR_ANALYTICS_VIEW,
    PERMISSIONS.TUTOR_CONFUSION_MANAGE,
    PERMISSIONS.REPORT_SCHEDULE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  ORG_ADMIN: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.COURSE_PUBLISH,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.ASSESSMENT_EVALUATE,
    PERMISSIONS.CERTIFICATE_ISSUE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.TUTOR_CHAT,
    PERMISSIONS.TUTOR_ANALYTICS_VIEW,
    PERMISSIONS.TUTOR_CONFUSION_MANAGE,
    PERMISSIONS.REPORT_SCHEDULE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  INSTRUCTOR: [
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.LESSON_CREATE,
    PERMISSIONS.LESSON_UPDATE,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.ASSESSMENT_EVALUATE,
    PERMISSIONS.CERTIFICATE_ISSUE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.TUTOR_CHAT,
    PERMISSIONS.TUTOR_ANALYTICS_VIEW,
    PERMISSIONS.TUTOR_CONFUSION_MANAGE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  COURSE_CREATOR: [
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.LESSON_CREATE,
    PERMISSIONS.LESSON_UPDATE,
    PERMISSIONS.AI_GENERATE_COURSE,
    PERMISSIONS.AI_GENERATE_LESSON,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.TUTOR_CHAT,
    PERMISSIONS.TUTOR_ANALYTICS_VIEW,
  ],
  STUDENT: [
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.ASSESSMENT_SUBMIT,
    PERMISSIONS.CERTIFICATE_VERIFY,
    PERMISSIONS.TUTOR_CHAT,
  ],
};

/**
 * Checks if a given set of user roles includes the required permission
 * @param {Array<string>} userRoles
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(userRoles = [], permission) {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes(PLATFORM_ROLES.SUPER_ADMIN)) return true;

  return userRoles.some((role) => {
    const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
    return rolePerms.includes(permission);
  });
}

/**
 * Checks if a user has any of the specified roles
 * @param {Array<string>} userRoles
 * @param {Array<string>|string} allowedRoles
 * @returns {boolean}
 */
export function hasRole(userRoles = [], allowedRoles) {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes(PLATFORM_ROLES.SUPER_ADMIN)) return true;

  const checkList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return userRoles.some((role) => checkList.includes(role));
}

/**
 * Strict server-side tenant isolation check.
 * Never trust tenantId provided by client.
 * Enforces that user's session tenant matches target tenant.
 * @param {object} user - Authenticated user context
 * @param {string} targetTenantId - The tenant ID of the resource being accessed
 */
export function verifyTenantAccess(user, targetTenantId) {
  if (!user) {
    throw new UnauthorizedError('Authentication required to access tenant data');
  }

  // Super Admin can access with platform scope
  if (user.roles?.includes(PLATFORM_ROLES.SUPER_ADMIN)) {
    return true;
  }

  if (!user.tenantId || !targetTenantId) {
    throw new TenantIsolationError('Missing tenant context in access validation');
  }

  const userTenantStr = String(user.tenantId);
  const targetTenantStr = String(targetTenantId);

  if (userTenantStr !== targetTenantStr) {
    throw new TenantIsolationError('Cross-tenant data access is strictly prohibited');
  }

  return true;
}

/**
 * Extracts bearer token or session cookie from Request
 * @param {Request} request
 * @returns {string|null}
 */
export function extractAuthToken(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check Cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map((c) => {
        const [k, ...v] = c.split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies.session_token) return cookies.session_token;
    if (cookies.auth_token) return cookies.auth_token;
  }

  return null;
}
