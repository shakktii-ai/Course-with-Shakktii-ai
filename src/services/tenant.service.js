import { Organization, Academy, DomainMapping } from '../models/index.js';
import { TenantIsolationError, NotFoundError } from '../lib/errors.js';
import { PLATFORM_ROLES, ORG_STATUS } from '../constants/index.js';

export class TenantService {
  /**
   * Securely resolves tenant context from request headers, hostname, and authenticated user.
   * Priority:
   * 1. Verified Custom Domain or Subdomain from Host header
   * 2. Authenticated user's session tenantId
   * 3. Rejects client-supplied unverified tenantId headers
   */
  static async resolveTenant(request, user = null) {
    const host = request.headers.get('host') || '';
    const cleanHost = host.split(':')[0].toLowerCase();

    // 1. Check custom domain mapping
    if (cleanHost && cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
      const domainMap = await DomainMapping.findOne({
        domain: cleanHost,
        status: 'VERIFIED',
      }).lean();

      if (domainMap) {
        return domainMap.tenantId;
      }

      // Check academy subdomain (e.g., mit.aiacademy.local or mit.aiacademy.com)
      const parts = cleanHost.split('.');
      if (parts.length > 2) {
        const subdomain = parts[0];
        const academy = await Academy.findOne({ subdomain }).lean();
        if (academy) {
          return academy.tenantId;
        }
      }
    }

    // 2. Resolve via authenticated user session
    if (user && user.tenantId) {
      const org = await Organization.findById(user.tenantId).lean();
      if (!org) {
        throw new NotFoundError('Organization associated with session not found');
      }
      if (org.status === ORG_STATUS.SUSPENDED) {
        throw new TenantIsolationError('This organization has been suspended. Please contact support.');
      }
      return org._id;
    }

    // 3. Super Admin can specify organization context via authorized platform query param
    if (user && user.roles?.includes(PLATFORM_ROLES.SUPER_ADMIN)) {
      const url = new URL(request.url);
      const queryTenant = url.searchParams.get('tenantId');
      if (queryTenant) {
        return queryTenant;
      }
    }

    return null;
  }

  /**
   * Enforce tenant boundary: verifies that targetTenant matches authenticated user's organization
   */
  static verifyTenantAccess(user, targetTenantId) {
    if (!user) {
      throw new TenantIsolationError('Authentication required for tenant data access');
    }

    if (user.roles?.includes(PLATFORM_ROLES.SUPER_ADMIN)) {
      return true;
    }

    if (!user.tenantId || !targetTenantId) {
      throw new TenantIsolationError('Missing tenant context');
    }

    if (String(user.tenantId) !== String(targetTenantId)) {
      throw new TenantIsolationError('Strict tenant isolation violation: Cross-tenant operation blocked');
    }

    return true;
  }
}

export default TenantService;

