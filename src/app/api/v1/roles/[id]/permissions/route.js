/**
 * AI Academy - Role Permissions Management API
 * POST /api/v1/roles/:id/permissions
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { roleService } from '@/services/role.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const permissionsSchema = {
  permissions: { type: 'array', required: true, itemType: 'string' },
};

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_ASSIGN_ROLE,
    });

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, permissionsSchema, { throwOnError: true });

    const role = await roleService.assignPermissions(
      user.tenantId,
      id,
      sanitized.permissions,
      user._id
    );

    return successResponse(role, 'Permissions assigned successfully');
  } catch (error) {
    return handleApiError(error, 'AssignRolePermissions');
  }
}

