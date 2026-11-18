import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AITutorService } from '@/services/ai-tutor.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await AITutorService.getSocraticHint(tenantId, user._id, id, {
      code: body.code,
      problemStatement: body.problemStatement,
      currentHintLevel: body.currentHintLevel,
    });

    return successResponse(result, 'Socratic hint generated successfully');
  } catch (error) {
    return handleApiError(error, 'GetSocraticHint');
  }
}

