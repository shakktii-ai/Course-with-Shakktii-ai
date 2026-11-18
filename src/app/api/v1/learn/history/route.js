/**
 * AI Academy - Learner History API
 * GET /api/v1/learn/history
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { LearnerFeaturesService } from '@/services/learner-features.service';
import { TenantService } from '@/services/tenant.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const history = await LearnerFeaturesService.getLearningHistory(tenantId, user._id);
    return successResponse(history, 'Learning history retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLearningHistory');
  }
}

