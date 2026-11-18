/**
 * AI Academy - Analyze Uploaded Video & Generate Short Clips + Explanations
 * POST /api/v1/video-clips/analyze
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VideoClipAnalyzerService } from '@/services/video-clip-analyzer.service';
import { HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes for large video AI processing

export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.sourceVideoUrl) {
      throw new BadRequestError('sourceVideoUrl is required');
    }

    const breakdown = await VideoClipAnalyzerService.analyzeAndCreateClips(
      tenantId,
      user._id,
      {
        title: body.title,
        originalFileName: body.originalFileName,
        sourceVideoUrl: body.sourceVideoUrl,
        cloudinaryPublicId: body.cloudinaryPublicId,
        durationSeconds: body.durationSeconds,
        fileSizeBytes: body.fileSizeBytes,
        language: body.language || 'Marathi-English',
        clipStyle: body.clipStyle || 'AUTO',
      }
    );

    return successResponse(
      breakdown,
      `Generated ${breakdown.clips?.length || 0} short clips with AI explanations`,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return handleApiError(error, 'AnalyzeVideoToClips');
  }
}
