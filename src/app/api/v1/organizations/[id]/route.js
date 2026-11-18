/**
 * AI Academy - Single Organization API
 * GET /api/v1/organizations/:id
 * PATCH /api/v1/organizations/:id
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { organizationService } from '@/services/organization.service';
import { PERMISSIONS } from '@/constants';
import { TenantService } from '@/services/tenant.service';

export const dynamic = 'force-dynamic';

const updateOrgSchema = {
  name: { type: 'string', minLength: 2, maxLength: 100 },
  logoUrl: { type: 'string' },
  website: { type: 'string' },
  type: { type: 'string' },
  contact: { type: 'object' },
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ORGANIZATION_READ,
    });

    TenantService.verifyTenantAccess(user, id);

    const org = await organizationService.findById(id, id);
    return successResponse(org, 'Organization details retrieved');
  } catch (error) {
    return handleApiError(error, 'GetOrganizationById');
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ORGANIZATION_UPDATE,
    });

    TenantService.verifyTenantAccess(user, id);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateOrgSchema, { throwOnError: true });

    const updated = await organizationService.updateOrganization(id, sanitized, user._id);
    return successResponse(updated, 'Organization updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateOrganization');
  }
}

