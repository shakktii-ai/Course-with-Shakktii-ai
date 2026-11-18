import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AdaptivePracticeService } from '@/services/adaptive-practice.service';
import { PERMISSIONS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.courseId) {
      throw new BadRequestError('Course ID is required for adaptive practice generation');
    }

    const result = await AdaptivePracticeService.generateAdaptivePracticeQuestions(
      tenantId,
      user._id,
      body.courseId
    );

    return successResponse(result, 'Adaptive practice questions generated successfully');
  } catch (error) {
    return handleApiError(error, 'GenerateAdaptivePractice');
  }
}

