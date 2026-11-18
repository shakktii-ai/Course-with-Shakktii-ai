import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { TutorAnalyticsService } from '@/services/tutor-analytics.service';
import { PERMISSIONS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_ANALYTICS_VIEW,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const query = {
      courseId: searchParams.get('courseId') || undefined,
      severity: searchParams.get('severity') || undefined,
      resolved: searchParams.get('resolved') || undefined,
    };

    const topics = await TutorAnalyticsService.getConfusionTopics(tenantId, query);
    return successResponse(topics, 'Confusion topics retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetConfusionTopics');
  }
}

export async function PATCH(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CONFUSION_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.topicId) {
      throw new BadRequestError('topicId is required to resolve a confusion topic');
    }

    const resolved = await TutorAnalyticsService.resolveConfusionTopic(tenantId, body.topicId);
    return successResponse(resolved, 'Confusion topic resolved successfully');
  } catch (error) {
    return handleApiError(error, 'ResolveConfusionTopic');
  }
}

