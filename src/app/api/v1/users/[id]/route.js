/**
 * AI Academy - Single User API
 * GET /api/v1/users/:id
 * PATCH /api/v1/users/:id
 * DELETE /api/v1/users/:id
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { userService } from '@/services/user.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateUserSchema = {
  name: { type: 'string', minLength: 2, maxLength: 60 },
  phone: { type: 'string' },
  avatarUrl: { type: 'string' },
  roles: { type: 'array', itemType: 'string' },
  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] },
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const currentUser = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_READ,
    });

    const user = await userService.findById(currentUser.tenantId, id);
    return successResponse(user, 'User details retrieved');
  } catch (error) {
    return handleApiError(error, 'GetUserById');
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const currentUser = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_UPDATE,
    });

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateUserSchema, { throwOnError: true });

    const updatedUser = await userService.updateUser(
      currentUser.tenantId,
      id,
      sanitized,
      currentUser._id
    );

    return successResponse(updatedUser, 'User updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateUser');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const currentUser = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_DELETE,
    });

    const result = await userService.deleteUser(
      currentUser.tenantId,
      id,
      currentUser._id
    );

    return successResponse(result, 'User deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteUser');
  }
}

