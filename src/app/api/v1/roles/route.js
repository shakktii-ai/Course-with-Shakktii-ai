/**
 * AI Academy - Roles Collection API
 * GET /api/v1/roles
 * POST /api/v1/roles
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { roleService } from '@/services/role.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const createRoleSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  slug: { type: 'string', required: true, minLength: 2, maxLength: 40 },
  description: { type: 'string', maxLength: 200 },
  permissions: { type: 'array', itemType: 'string' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const roles = await roleService.getAvailableRoles(user.tenantId);
    return successResponse(roles, 'Roles retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetRoles');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_ASSIGN_ROLE,
    });

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, createRoleSchema, { throwOnError: true });

    const newRole = await roleService.createTenantRole(
      user.tenantId,
      sanitized,
      user._id
    );

    return successResponse(newRole, 'Role created successfully', {}, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateRole');
  }
}

