/**
 * AI Academy - Bulk Import Users API
 * POST /api/v1/users/bulk-import
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { InvitationService } from '@/services/invitation.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const bulkImportSchema = {
  csv: { type: 'string', required: true, message: 'CSV text content is required' },
  defaultRole: { type: 'string', default: 'STUDENT' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, bulkImportSchema, { throwOnError: true });

    const summary = await InvitationService.bulkImportUsers(
      tenantId,
      sanitized.csv,
      sanitized.defaultRole,
      user._id
    );

    return successResponse(summary, `Bulk import completed: ${summary.created} users imported`);
  } catch (error) {
    return handleApiError(error, 'BulkImportUsers');
  }
}

