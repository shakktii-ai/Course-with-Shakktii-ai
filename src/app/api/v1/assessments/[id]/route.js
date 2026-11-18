/**
 * AI Academy - Assessment By ID API
 * GET /api/v1/assessments/[id]
 * PATCH /api/v1/assessments/[id]
 * DELETE /api/v1/assessments/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { AssessmentService } from '@/services/assessment.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const learnerMode = searchParams.get('learnerMode') === 'true';

    const result = await AssessmentService.getAssessmentById(tenantId, id, { learnerMode });
    return successResponse(result, 'Assessment retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetAssessment');
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const updated = await AssessmentService.updateAssessment(tenantId, id, body, user);

    return successResponse(updated, 'Assessment updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateAssessment');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ASSESSMENT_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await AssessmentService.deleteAssessment(tenantId, id);
    return successResponse(result, 'Assessment deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteAssessment');
  }
}

