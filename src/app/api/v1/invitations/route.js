/**
 * AI Academy - Send Invitation API
 * POST /api/v1/invitations
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate, EMAIL_REGEX } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { InvitationService } from '@/services/invitation.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const inviteSchema = {
  email: { type: 'string', required: true, pattern: EMAIL_REGEX, message: 'Valid email is required' },
  roles: { type: 'array', itemType: 'string' },
  departmentId: { type: 'string' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_INVITE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, inviteSchema, { throwOnError: true });

    const invitation = await InvitationService.createInvitation({
      tenantId,
      email: sanitized.email,
      roles: sanitized.roles || ['STUDENT'],
      departmentId: sanitized.departmentId || null,
      invitedBy: user._id,
    });

    return successResponse(
      invitation,
      'Invitation issued successfully',
      {},
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return handleApiError(error, 'CreateInvitation');
  }
}

