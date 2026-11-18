import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AITutorService } from '@/services/ai-tutor.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await AITutorService.sendMessage(tenantId, user._id, id, {
      content: body.content,
      hintLevel: body.hintLevel,
      mode: body.mode,
    });

    return successResponse(result, 'Message processed successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'SendTutorMessage');
  }
}

