/**
 * AI Academy - Single Group API
 * PATCH /api/v1/groups/:id
 * DELETE /api/v1/groups/:id
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { groupService } from '@/services/group.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateGroupSchema = {
  name: { type: 'string', minLength: 2, maxLength: 80 },
  description: { type: 'string', maxLength: 300 },
  departmentId: { type: 'string' },
  memberIds: { type: 'array' },
  courseIds: { type: 'array' },
};

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.SETTINGS_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateGroupSchema, { throwOnError: true });

    const updated = await groupService.updateGroup(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Group updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateGroup');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.SETTINGS_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const result = await groupService.deleteGroup(tenantId, id);
    return successResponse(result, 'Group deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteGroup');
  }
}

