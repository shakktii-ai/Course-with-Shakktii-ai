/**
 * AI Academy - Trigger Video Render Pipeline API
 * POST /api/v1/video/projects/[id]/render
 * Direct server-side execution: processes rendering stages synchronously in Next.js
 * and persists progress and results directly into MongoDB.
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoRenderingService } from '@/services/video-rendering.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    // Queue and initialize job record in MongoDB
    const { job } = await VideoRenderingService.queueRenderingJob(tenantId, id, user);

    // Direct server-side execution (no Redis / BullMQ worker required)
    const processed = await VideoRenderingService.processRenderingJob(job._id);

    return successResponse(
      processed,
      'Video rendered successfully via direct pipeline execution',
      HTTP_STATUS.OK
    );
  } catch (error) {
    return handleApiError(error, 'RenderVideoProject');
  }
}
