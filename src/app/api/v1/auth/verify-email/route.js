/**
 * AI Academy - Email Verification API
 * POST /api/v1/auth/verify-email
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { AuthService } from '@/services/auth.service';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const verifyEmailSchema = {
  token: { type: 'string', required: true, message: 'Verification token is required' },
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, verifyEmailSchema, { throwOnError: true });

    const result = await AuthService.verifyEmail({ token: sanitized.token });

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'AuthVerifyEmail');
  }
}

