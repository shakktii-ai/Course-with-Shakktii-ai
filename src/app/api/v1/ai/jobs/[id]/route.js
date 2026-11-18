/**
 * AI Academy - AI Job Details API
 * GET /api/v1/ai/jobs/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import AIGenerationJob from '@/models/AIGenerationJob';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const job = await AIGenerationJob.findOne({ _id: id, tenantId })
      .populate('generatedCourseId', 'title slug status')
      .lean();

    if (!job) {
      throw new NotFoundError('AI Generation job not found');
    }

    return successResponse(job, 'Job retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetAIJob');
  }
}

