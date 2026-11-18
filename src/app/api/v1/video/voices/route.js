/**
 * AI Academy - Voice Profiles API
 * GET /api/v1/video/voices
 * POST /api/v1/video/voices
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { VoiceSynthesisService } from '@/services/voice-synthesis.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      language: searchParams.get('language') || undefined,
      gender: searchParams.get('gender') || undefined,
      provider: searchParams.get('provider') || undefined,
    };

    const voices = await VoiceSynthesisService.listVoiceProfiles(tenantId, filters);
    return successResponse(voices, 'Voice profiles retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetVoiceProfiles');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.VIDEO_GENERATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    if (!body.name) {
      throw new BadRequestError('Voice profile name is required');
    }

    const voice = await VoiceSynthesisService.createCustomVoiceProfile(tenantId, body);
    return successResponse(voice, 'Custom voice profile created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateVoiceProfile');
  }
}

