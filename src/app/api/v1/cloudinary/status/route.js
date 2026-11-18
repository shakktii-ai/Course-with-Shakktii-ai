/**
 * AI Academy - Cloudinary Status & Diagnostics API
 * GET /api/v1/cloudinary/status
 */

import { successResponse, handleApiError } from '@/lib/response';
import { CloudinaryService } from '@/services/cloudinary.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isConfigured = CloudinaryService.isConfigured();
    const config = CloudinaryService.getConfig();

    return successResponse(
      {
        configured: isConfigured,
        cloudName: config.cloudName || null,
        provider: 'Cloudinary CDN',
        features: [
          'Automated Visual Architecture Diagrams',
          'Component Workflow Infographics',
          'PDF Source Document Explanations',
          'Auto Format & Quality Optimization (f_auto, q_auto)',
          'Full-Screen Interactive Lightbox',
        ],
      },
      isConfigured
        ? 'Cloudinary CDN is successfully connected and operational'
        : 'Cloudinary credentials pending in .env.local'
    );
  } catch (error) {
    return handleApiError(error, 'GetCloudinaryStatus');
  }
}

