import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { TutorAnalyticsService } from '@/services/tutor-analytics.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_ANALYTICS_VIEW,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      courseId: searchParams.get('courseId') || undefined,
    };

    const overview = await TutorAnalyticsService.getTutorOverview(tenantId, filters);
    const contentGaps = await TutorAnalyticsService.getContentGaps(tenantId, filters.courseId);

    return successResponse(
      {
        ...overview,
        contentGaps,
      },
      'Tutor analytics retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error, 'GetTutorAnalyticsOverview');
  }
}

