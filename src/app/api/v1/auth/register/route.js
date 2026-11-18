/**
 * AI Academy - Registration API
 * POST /api/v1/auth/register
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate, EMAIL_REGEX } from '@/lib/validation';
import { AuthService } from '@/services/auth.service';
import { connectToDatabase } from '@/lib/mongodb';
import { HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const registerSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 60, message: 'Full name is required (2-60 chars)' },
  email: { type: 'string', required: true, pattern: EMAIL_REGEX, message: 'Valid email is required' },
  password: { type: 'string', required: true, minLength: 8, message: 'Password must have at least 8 characters' },
  phone: { type: 'string', minLength: 6, maxLength: 20 },
  tenantId: { type: 'string' },
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, registerSchema, { throwOnError: true });

    const result = await AuthService.register({
      name: sanitized.name,
      email: sanitized.email,
      password: sanitized.password,
      phone: sanitized.phone,
      tenantId: sanitized.tenantId || null,
    });

    return successResponse(
      {
        user: result.user,
        verificationToken: result.verificationToken,
      },
      'User registered successfully. Verification email sent.',
      {},
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return handleApiError(error, 'AuthRegister');
  }
}

