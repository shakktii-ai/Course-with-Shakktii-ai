/**
 * AI Academy - Assessments Collection API
 * GET /api/v1/assessments
 * POST /api/v1/assessments
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AssessmentService } from '@/services/assessment.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      lessonId: searchParams.get('lessonId') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await AssessmentService.listAssessments(tenantId, filters, pagination);
    return successResponse(result, 'Assessments retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetAssessments');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.title) {
      throw new BadRequestError('Assessment title is required');
    }

    const assessment = await AssessmentService.createAssessment(tenantId, body, user);
    return successResponse(assessment, 'Assessment created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateAssessment');
  }
}

