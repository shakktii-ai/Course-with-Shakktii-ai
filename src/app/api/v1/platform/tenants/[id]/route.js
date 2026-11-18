import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { PlatformAdminService } from '@/services/platform-admin.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    await authenticateRequest(request, {
      permissions: PERMISSIONS.PLATFORM_MANAGE,
    });

    const { id } = await context.params;
    const details = await PlatformAdminService.getTenantDetails(id);

    return successResponse(details, 'Organization details retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetPlatformTenantDetails');
  }
}

export async function PATCH(request, context) {
  try {
    await authenticateRequest(request, {
      permissions: PERMISSIONS.PLATFORM_MANAGE,
    });

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    let updatedTenant = null;
    if (body.status) {
      updatedTenant = await PlatformAdminService.updateTenantStatus(id, body.status, body.reason);
    }

    let updatedSubscription = null;
    if (body.subscription || body.tier || body.quotas) {
      updatedSubscription = await PlatformAdminService.updateTenantSubscription(id, {
        tier: body.tier || body.subscription?.tier,
        status: body.subscription?.status,
        billingCycle: body.billingCycle || body.subscription?.billingCycle,
        amount: body.amount || body.subscription?.amount,
        quotas: body.quotas || body.subscription?.quotas,
      });
    }

    return successResponse(
      {
        organization: updatedTenant,
        subscription: updatedSubscription,
      },
      'Organization updated successfully'
    );
  } catch (error) {
    return handleApiError(error, 'UpdatePlatformTenant');
  }
}

