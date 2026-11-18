/**
 * AI Academy - Groups API
 * GET /api/v1/groups
 * POST /api/v1/groups
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { groupService } from '@/services/group.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const groupSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 80 },
  description: { type: 'string', maxLength: 300 },
  departmentId: { type: 'string' },
  memberIds: { type: 'array' },
  courseIds: { type: 'array' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const groups = await groupService.getGroups(tenantId);
    return successResponse(groups, 'Groups retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetGroups');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.SETTINGS_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, groupSchema, { throwOnError: true });

    const group = await groupService.createGroup(
      tenantId,
      sanitized,
      user._id
    );

    return successResponse(group, 'Group created successfully', {}, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateGroup');
  }
}

