import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AITutorService } from '@/services/ai-tutor.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const result = await AITutorService.submitFeedback(tenantId, user._id, {
      conversationId: body.conversationId,
      messageId: body.messageId,
      rating: body.rating,
      comment: body.comment,
    });

    return successResponse(result, 'Feedback submitted successfully');
  } catch (error) {
    return handleApiError(error, 'SubmitTutorFeedback');
  }
}

