/**
 * AI Academy - Single Department API
 * PATCH /api/v1/departments/:id
 * DELETE /api/v1/departments/:id
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { departmentService } from '@/services/department.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateDeptSchema = {
  name: { type: 'string', minLength: 2, maxLength: 80 },
  code: { type: 'string', maxLength: 20 },
  description: { type: 'string', maxLength: 300 },
  managerId: { type: 'string' },
};

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.SETTINGS_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateDeptSchema, { throwOnError: true });

    const updated = await departmentService.updateDepartment(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Department updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateDepartment');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.SETTINGS_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const result = await departmentService.deleteDepartment(tenantId, id, user._id);
    return successResponse(result, 'Department deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteDepartment');
  }
}

