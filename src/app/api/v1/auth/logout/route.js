/**
 * AI Academy - Logout API
 * POST /api/v1/auth/logout
 */

import { successResponse, handleApiError } from '@/lib/response';
import { extractAuthToken } from '@/lib/auth-helpers';
import { AuthService } from '@/services/auth.service';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectToDatabase();

    const token = extractAuthToken(request);
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (token) {
      await AuthService.logout({ sessionToken: token, ipAddress, userAgent });
    }

    const response = successResponse({}, 'Logged out successfully');

    // Clear session cookie
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return handleApiError(error, 'AuthLogout');
  }
}

