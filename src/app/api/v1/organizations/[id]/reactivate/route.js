/**
 * AI Academy - Reactivate Organization API
 * POST /api/v1/organizations/:id/reactivate
 */

import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { organizationService } from '@/services/organization.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ORGANIZATION_REACTIVATE,
    });

    const reactivated = await organizationService.reactivateOrganization(id, user._id);
    return successResponse(reactivated, 'Organization reactivated successfully');
  } catch (error) {
    return handleApiError(error, 'ReactivateOrganization');
  }
}

