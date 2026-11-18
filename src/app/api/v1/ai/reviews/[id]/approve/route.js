/**
 * AI Academy - Approve AI Course API
 * POST /api/v1/ai/reviews/[id]/approve
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { AIReviewService } from '@/services/ai-review.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AI_APPROVE_CONTENT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await AIReviewService.approveReview(tenantId, id, user._id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'ApproveAIReview');
  }
}

