/**
 * AI Academy - Authenticated User Profile API
 * GET /api/v1/auth/me
 */

import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    return successResponse(user, 'Current user context retrieved');
  } catch (error) {
    return handleApiError(error, 'AuthMe');
  }
}

