import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AITutorService } from '@/services/ai-tutor.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const query = {
      courseId: searchParams.get('courseId') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
      status: searchParams.get('status') || undefined,
      mode: searchParams.get('mode') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await AITutorService.getConversations(tenantId, user._id, query);
    return successResponse(result, 'Conversations retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetTutorConversations');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const result = await AITutorService.createConversation(tenantId, user._id, body);

    return successResponse(result, 'Conversation created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateTutorConversation');
  }
}

