/**
 * AI Academy - AI Reviews Collection API
 * GET /api/v1/ai/reviews
 * POST /api/v1/ai/reviews (Add comment)
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AIReviewService } from '@/services/ai-review.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const commentSchema = {
  reviewId: { type: 'string', required: true },
  lessonId: { type: 'string' },
  comment: { type: 'string', required: true, maxLength: 2000 },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_REVIEW_CONTENT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const reviews = await AIReviewService.getReviews(tenantId, { status });
    return successResponse(reviews, 'AI reviews retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetAIReviews');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_REVIEW_CONTENT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, commentSchema, { throwOnError: true });

    const comment = await AIReviewService.addComment(
      tenantId,
      sanitized.reviewId,
      {
        lessonId: sanitized.lessonId || null,
        comment: sanitized.comment,
      },
      user._id
    );

    return successResponse(comment, 'Review comment added', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'AddReviewComment');
  }
}

