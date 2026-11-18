/**
 * AI Academy - Assessment Single Question API
 * PATCH /api/v1/assessments/[id]/questions/[questionId]
 * DELETE /api/v1/assessments/[id]/questions/[questionId]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AssessmentService } from '@/services/assessment.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id, questionId } = await params;

    const body = await request.json().catch(() => ({}));
    const updated = await AssessmentService.updateQuestion(tenantId, id, questionId, body);

    return successResponse(updated, 'Question updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateAssessmentQuestion');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id, questionId } = await params;

    const result = await AssessmentService.deleteQuestion(tenantId, id, questionId);
    return successResponse(result, 'Question deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteAssessmentQuestion');
  }
}

