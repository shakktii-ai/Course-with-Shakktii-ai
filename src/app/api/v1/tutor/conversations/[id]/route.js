import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AITutorService } from '@/services/ai-tutor.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const result = await AITutorService.getConversationById(tenantId, user._id, id);

    return successResponse(result, 'Conversation details retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetTutorConversationDetails');
  }
}

export async function DELETE(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const result = await AITutorService.archiveConversation(tenantId, user._id, id);

    return successResponse(result, 'Conversation archived successfully');
  } catch (error) {
    return handleApiError(error, 'ArchiveTutorConversation');
  }
}

