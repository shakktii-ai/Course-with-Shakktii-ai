/**
 * AI Academy - Login API
 * POST /api/v1/auth/login
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate, EMAIL_REGEX } from '@/lib/validation';
import { AuthService } from '@/services/auth.service';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const loginSchema = {
  email: { type: 'string', required: true, pattern: EMAIL_REGEX, message: 'Valid email is required' },
  password: { type: 'string', required: true, minLength: 6, message: 'Password must have at least 6 characters' },
  userType: { type: 'string', enum: ['PLATFORM', 'TENANT'], default: 'TENANT' },
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, loginSchema, { throwOnError: true });

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await AuthService.login({
      email: sanitized.email,
      password: sanitized.password,
      userType: sanitized.userType,
      ipAddress,
      userAgent,
    });

    const response = successResponse(
      {
        user: result.user,
        expiresAt: result.session.expiresAt,
      },
      'Authentication successful'
    );

    // Set secure HTTP-only cookie
    response.cookies.set('session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.session.expiresAt,
    });

    return response;
  } catch (error) {
    return handleApiError(error, 'AuthLogin');
  }
}

