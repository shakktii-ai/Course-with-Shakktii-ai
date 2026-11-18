/**
 * AI Academy - Revoke Single Session API
 * DELETE /api/v1/sessions/:id
 */

import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { SessionService } from '@/services/session.service';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(request);

    const revoked = await SessionService.revokeSession(user._id, id, 'Revoked via User Portal');
    return successResponse(revoked, 'Session terminated successfully');
  } catch (error) {
    return handleApiError(error, 'RevokeSessionById');
  }
}

