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
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      throw new BadRequestError('conversationId query parameter is required');
    }

    const auditData = await TutorAnalyticsService.exportConversationAudit(tenantId, conversationId);
    return successResponse(auditData, 'Conversation audit export generated');
  } catch (error) {
    return handleApiError(error, 'ExportConversationAudit');
  }
}

