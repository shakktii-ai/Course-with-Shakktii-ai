import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AdaptivePracticeService } from '@/services/adaptive-practice.service';
import { PERMISSIONS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      throw new BadRequestError('Course ID query parameter is required');
    }

    const profile = await AdaptivePracticeService.getLearnerProfile(tenantId, user._id, courseId);
    return successResponse(profile, 'Learner knowledge profile retrieved');
  } catch (error) {
    return handleApiError(error, 'GetLearnerProfile');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.TUTOR_CHAT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.attemptId) {
      throw new BadRequestError('Assessment attemptId is required for remediation');
    }

    const result = await AdaptivePracticeService.generateRemediation(tenantId, user._id, body.attemptId);
    return successResponse(result, 'Remediation plan generated successfully');
  } catch (error) {
    return handleApiError(error, 'GenerateRemediation');
  }
}

