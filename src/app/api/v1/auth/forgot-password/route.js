/**
 * AI Academy - Forgot Password API
 * POST /api/v1/auth/forgot-password
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate, EMAIL_REGEX } from '@/lib/validation';
import { AuthService } from '@/services/auth.service';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const forgotPasswordSchema = {
  email: { type: 'string', required: true, pattern: EMAIL_REGEX, message: 'Valid email is required' },
  userType: { type: 'string', enum: ['PLATFORM', 'TENANT'], default: 'TENANT' },
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, forgotPasswordSchema, { throwOnError: true });

    const result = await AuthService.forgotPassword({
      email: sanitized.email,
      userType: sanitized.userType,
    });

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'AuthForgotPassword');
  }
}

