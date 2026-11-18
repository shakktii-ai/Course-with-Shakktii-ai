import { Organization, Academy, DomainMapping } from '../models/index.js';
import { TenantIsolationError, NotFoundError } from '../lib/errors.js';
import { PLATFORM_ROLES, ORG_STATUS } from '../constants/index.js';

const TENANT_CACHE_TTL_MS = 60 * 1000; // 60s cache for host/org resolution
const tenantHostCache =
  globalThis.__aiAcademyTenantHostCache || (globalThis.__aiAcademyTenantHostCache = new Map());
const orgStatusCache =
  globalThis.__aiAcademyOrgStatusCache || (globalThis.__aiAcademyOrgStatusCache = new Map());

function isDefaultHostingDomain(cleanHost) {
  return (
    !cleanHost ||
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.endsWith('.vercel.app') ||
    cleanHost.endsWith('.netlify.app') ||
    cleanHost.endsWith('.onrender.com') ||
    cleanHost.endsWith('.railway.app')
  );
}

export class TenantService {
  /**
   * Securely resolves tenant context from request headers, hostname, and authenticated user.
   * Priority:
   * 1. Verified Custom Domain or Subdomain from Host header (cached, skipped on standard PaaS preview hosts)
   * 2. Authenticated user's session tenantId (cached org status check)
   * 3. Rejects client-supplied unverified tenantId headers
   */
  static async resolveTenant(request, user = null) {
    const host = request.headers.get('host') || '';
    const cleanHost = host.split(':')[0].toLowerCase();

    // 1. Check custom domain mapping (only on real custom domains, with 60s cache)
    if (!isDefaultHostingDomain(cleanHost)) {
      const cachedHost = tenantHostCache.get(cleanHost);
      if (cachedHost && cachedHost.expiresAt > Date.now()) {
        if (cachedHost.tenantId) return cachedHost.tenantId;
      } else {
        const domainMap = await DomainMapping.findOne({
          domain: cleanHost,
          status: 'VERIFIED',
        })
          .select('tenantId')
          .lean();

        if (domainMap) {
          tenantHostCache.set(cleanHost, {
            tenantId: domainMap.tenantId,
            expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
          });
          return domainMap.tenantId;
        }

        const parts = cleanHost.split('.');
        if (parts.length > 2) {
          const subdomain = parts[0];
          const academy = await Academy.findOne({ subdomain }).select('tenantId').lean();
          if (academy) {
            tenantHostCache.set(cleanHost, {
              tenantId: academy.tenantId,
              expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
            });
            return academy.tenantId;
          }
        }

        tenantHostCache.set(cleanHost, {
          tenantId: null,
          expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
        });
      }
    }

    // 2. Resolve via authenticated user session (with 60s org status cache)
    if (user && user.tenantId) {
      const key = String(user.tenantId);
      const cachedOrg = orgStatusCache.get(key);
      if (cachedOrg && cachedOrg.expiresAt > Date.now()) {
        if (cachedOrg.status === ORG_STATUS.SUSPENDED) {
          throw new TenantIsolationError('This organization has been suspended. Please contact support.');
        }
        return cachedOrg.id;
      }

      const org = await Organization.findById(user.tenantId).select('_id status').lean();
      if (!org) {
        throw new NotFoundError('Organization associated with session not found');
      }
      orgStatusCache.set(key, {
        id: org._id,
        status: org.status,
        expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
      });
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

