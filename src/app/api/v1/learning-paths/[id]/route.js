/**
 * AI Academy - Learning Path Details API
 * GET /api/v1/learning-paths/[id]
 * PATCH /api/v1/learning-paths/[id]
 * DELETE /api/v1/learning-paths/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { LearningPathService } from '@/services/learning-path.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateSchema = {
  title: { type: 'string', minLength: 2, maxLength: 200 },
  description: { type: 'string', maxLength: 2000 },
  thumbnail: { type: 'string' },
  courses: { type: 'array' },
  estimatedHours: { type: 'number' },
  isActive: { type: 'boolean' },
};

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const path = await LearningPathService.getLearningPathById(tenantId, id);
    return successResponse(path, 'Learning path retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLearningPath');
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateSchema, { throwOnError: true });

    const updated = await LearningPathService.updateLearningPath(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Learning path updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateLearningPath');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await LearningPathService.deleteLearningPath(tenantId, id);
    return successResponse(result, 'Learning path deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteLearningPath');
  }
}

