/**
 * AI Academy - Reject AI Course API
 * POST /api/v1/ai/reviews/[id]/reject
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AIReviewService } from '@/services/ai-review.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const rejectSchema = {
  reason: { type: 'string', required: true, minLength: 3, maxLength: 2000 },
};

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_APPROVE_CONTENT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, rejectSchema, { throwOnError: true });

    const result = await AIReviewService.rejectReview(tenantId, id, sanitized.reason, user._id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'RejectAIReview');
  }
}

