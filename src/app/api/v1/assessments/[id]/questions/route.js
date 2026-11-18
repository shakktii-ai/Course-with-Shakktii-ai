/**
 * AI Academy - Assessment Questions API
 * POST /api/v1/assessments/[id]/questions (Add Question)
 * PUT /api/v1/assessments/[id]/questions (Reorder Questions)
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AssessmentService } from '@/services/assessment.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const question = await AssessmentService.addQuestion(tenantId, id, body);

    return successResponse(question, 'Question added successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'AddAssessmentQuestion');
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.questionIds)) {
      throw new BadRequestError('questionIds array is required');
    }

    const reordered = await AssessmentService.reorderQuestions(tenantId, id, body.questionIds);
    return successResponse(reordered, 'Questions reordered successfully');
  } catch (error) {
    return handleApiError(error, 'ReorderAssessmentQuestions');
  }
}

