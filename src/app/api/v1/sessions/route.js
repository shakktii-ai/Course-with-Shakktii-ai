/**
 * AI Academy - Sessions Management API
 * GET /api/v1/sessions
 * DELETE /api/v1/sessions
 */

import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { SessionService } from '@/services/session.service';
import { extractAuthToken } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const sessions = await SessionService.getUserSessions(user._id);

    return successResponse(sessions, 'Active user sessions retrieved');
  } catch (error) {
    return handleApiError(error, 'GetSessions');
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticateRequest(request);
    const currentToken = extractAuthToken(request);

    const result = await SessionService.revokeAllUserSessions(user._id, currentToken);
    return successResponse(result, 'All other sessions have been terminated');
  } catch (error) {
    return handleApiError(error, 'RevokeAllSessions');
  }
}

