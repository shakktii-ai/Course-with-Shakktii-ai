/**
 * AI Academy - Academy Settings & Branding API
 * GET /api/v1/academy
 * PATCH /api/v1/academy
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AcademyService } from '@/services/academy.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateAcademySchema = {
  name: { type: 'string', minLength: 2, maxLength: 100 },
  tagline: { type: 'string' },
  description: { type: 'string' },
  logoUrl: { type: 'string' },
  faviconUrl: { type: 'string' },
  isPublic: { type: 'boolean' },
  theme: { type: 'object' },
  landingPage: { type: 'object' },
  settings: { type: 'object' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const config = await AcademyService.getAcademy(tenantId);
    return successResponse(config, 'Academy configuration retrieved');
  } catch (error) {
    return handleApiError(error, 'GetAcademy');
  }
}

export async function PATCH(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ACADEMY_SETTINGS,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateAcademySchema, { throwOnError: true });

    const updated = await AcademyService.updateAcademy(tenantId, sanitized, user._id);

    if (sanitized.settings) {
      await AcademyService.updateSettings(tenantId, sanitized.settings, user._id);
    }

    return successResponse(updated, 'Academy branding updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateAcademy');
  }
}

