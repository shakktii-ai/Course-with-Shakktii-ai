/**
 * AI Academy - Accept Invitation API
 * POST /api/v1/invitations/accept
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { InvitationService } from '@/services/invitation.service';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const acceptSchema = {
  token: { type: 'string', required: true, message: 'Invitation token is required' },
  name: { type: 'string', minLength: 2, maxLength: 60 },
  password: { type: 'string', minLength: 8 },
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, acceptSchema, { throwOnError: true });

    const result = await InvitationService.acceptInvitation({
      token: sanitized.token,
      name: sanitized.name,
      password: sanitized.password,
    });

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'AcceptInvitation');
  }
}

