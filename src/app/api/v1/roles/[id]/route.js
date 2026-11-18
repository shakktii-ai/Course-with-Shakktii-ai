/**
 * AI Academy - Single Role API
 * GET /api/v1/roles/:id
 * PATCH /api/v1/roles/:id
 * DELETE /api/v1/roles/:id
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { roleService } from '@/services/role.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateRoleSchema = {
  name: { type: 'string', minLength: 2, maxLength: 50 },
  description: { type: 'string', maxLength: 200 },
  permissions: { type: 'array', itemType: 'string' },
  isActive: { type: 'boolean' },
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request);
    const role = await roleService.findById(user.tenantId, id);
    return successResponse(role, 'Role details retrieved');
  } catch (error) {
    return handleApiError(error, 'GetRoleById');
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_ASSIGN_ROLE,
    });

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateRoleSchema, { throwOnError: true });

    const updated = await roleService.updateRole(user.tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Role updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateRole');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_ASSIGN_ROLE,
    });

    const result = await roleService.deleteRole(user.tenantId, id, user._id);
    return successResponse(result, 'Role deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteRole');
  }
}

