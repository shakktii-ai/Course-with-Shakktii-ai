/**
 * AI Academy - Module Details API
 * PATCH /api/v1/modules/[id]
 * DELETE /api/v1/modules/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateModuleSchema = {
  title: { type: 'string', minLength: 2, maxLength: 200 },
  description: { type: 'string', maxLength: 1000 },
  order: { type: 'number' },
  durationMinutes: { type: 'number' },
  isOptional: { type: 'boolean' },
};

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateModuleSchema, { throwOnError: true });

    const updated = await CurriculumService.updateModule(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Module updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateModule');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await CurriculumService.deleteModule(tenantId, id);
    return successResponse(result, 'Module deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteModule');
  }
}

