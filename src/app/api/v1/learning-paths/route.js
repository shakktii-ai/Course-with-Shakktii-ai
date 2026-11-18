/**
 * AI Academy - Learning Paths API
 * GET /api/v1/learning-paths
 * POST /api/v1/learning-paths
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { LearningPathService } from '@/services/learning-path.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const learningPathSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 200 },
  slug: { type: 'string', maxLength: 220 },
  description: { type: 'string', maxLength: 2000 },
  thumbnail: { type: 'string' },
  courses: { type: 'array' },
  estimatedHours: { type: 'number' },
  isActive: { type: 'boolean' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const paths = await LearningPathService.getLearningPaths(tenantId);
    return successResponse(paths, 'Learning paths retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetLearningPaths');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, learningPathSchema, { throwOnError: true });

    const newPath = await LearningPathService.createLearningPath(tenantId, sanitized, user._id);
    return successResponse(newPath, 'Learning path created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateLearningPath');
  }
}

