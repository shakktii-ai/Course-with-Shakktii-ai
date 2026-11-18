/**
 * AI Academy - Start Assessment Attempt API
 * POST /api/v1/assessments/[id]/start
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { GradingService } from '@/services/grading.service';
import { HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await GradingService.startAttempt(tenantId, id, user);
    return successResponse(result, 'Assessment attempt started', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'StartAssessmentAttempt');
  }
}

