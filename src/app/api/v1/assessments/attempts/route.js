/**
 * AI Academy - Gradebook Assessment Attempts Collection API
 * GET /api/v1/assessments/attempts
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { GradingService } from '@/services/grading.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      assessmentId: searchParams.get('assessmentId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') || undefined,
      passed: searchParams.get('passed') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await GradingService.listAttempts(tenantId, filters, pagination);
    return successResponse(result, 'Gradebook attempts retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetGradebookAttempts');
  }
}

