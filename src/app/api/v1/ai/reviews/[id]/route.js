/**
 * AI Academy - AI Review Details API
 * GET /api/v1/ai/reviews/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { AIReviewService } from '@/services/ai-review.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_REVIEW_CONTENT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const reviewData = await AIReviewService.getReviewById(tenantId, id);
    return successResponse(reviewData, 'AI Review details retrieved');
  } catch (error) {
    return handleApiError(error, 'GetAIReview');
  }
}

