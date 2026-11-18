/**
 * AI Academy - Signed Video Upload Parameters API
 * POST /api/v1/video-clips/upload-signature
 * Generates secure signed Cloudinary parameters for direct browser-to-Cloudinary video uploads.
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { CloudinaryService } from '@/services/cloudinary.service';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await authenticateRequest(request);

    const params = CloudinaryService.getSignedVideoUploadParams({
      folder: 'ai-academy/video-uploads',
    });

    if (!params.isConfigured) {
      throw new BadRequestError(
        'Cloudinary is not configured in .env.local. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
      );
    }

    return successResponse(params, 'Signed video upload parameters generated');
  } catch (error) {
    return handleApiError(error, 'VideoUploadSignature');
  }
}
