/**
 * AI Academy - Learner Progress API
 * GET /api/v1/learn/progress
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { ProgressService } from '@/services/progress.service';
import { TenantService } from '@/services/tenant.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (courseId) {
      const progressData = await ProgressService.getCourseProgress(tenantId, user._id, courseId);
      return successResponse(progressData, 'Course progress retrieved');
    }

    const summary = await ProgressService.getLearnerDashboardSummary(tenantId, user._id);
    return successResponse(summary, 'Learner progress summary retrieved');
  } catch (error) {
    return handleApiError(error, 'GetLearnerProgress');
  }
}

