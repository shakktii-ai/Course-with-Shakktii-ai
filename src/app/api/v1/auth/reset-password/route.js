/**
 * AI Academy - Reset Password API
 * POST /api/v1/auth/reset-password
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { AuthService } from '@/services/auth.service';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = {
  token: { type: 'string', required: true, message: 'Reset token is required' },
  password: { type: 'string', required: true, minLength: 8, message: 'New password must have at least 8 characters' },
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, resetPasswordSchema, { throwOnError: true });

    const result = await AuthService.resetPassword({
      token: sanitized.token,
      newPassword: sanitized.password,
    });

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'AuthResetPassword');
  }
}

