/**
 * AI Academy - Suspend Organization API
 * POST /api/v1/organizations/:id/suspend
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
      permissions: PERMISSIONS.ORGANIZATION_SUSPEND,
    });

    const body = await request.json().catch(() => ({}));
    const suspended = await organizationService.suspendOrganization(
      id,
      body.reason || 'Suspended by platform administrator',
      user._id
    );

    return successResponse(suspended, 'Organization suspended successfully');
  } catch (error) {
    return handleApiError(error, 'SuspendOrganization');
  }
}

