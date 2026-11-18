/**
 * AI Academy - Custom Domains API
 * POST /api/v1/academy/domains
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AcademyService } from '@/services/academy.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const domainSchema = {
  domain: { type: 'string', required: true, minLength: 3, maxLength: 253, message: 'Valid domain name is required' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ACADEMY_SETTINGS,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, domainSchema, { throwOnError: true });

    const domainMapping = await AcademyService.addCustomDomain(
      tenantId,
      sanitized.domain,
      user._id
    );

    return successResponse(domainMapping, 'Custom domain configured successfully');
  } catch (error) {
    return handleApiError(error, 'AddCustomDomain');
  }
}

