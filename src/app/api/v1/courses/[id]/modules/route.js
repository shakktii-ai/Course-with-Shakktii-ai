/**
 * AI Academy - Course Modules API
 * GET /api/v1/courses/[id]/modules
 * POST /api/v1/courses/[id]/modules
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const moduleSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 200 },
  description: { type: 'string', maxLength: 1000 },
  order: { type: 'number' },
  durationMinutes: { type: 'number' },
  isOptional: { type: 'boolean' },
};

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const modules = await CurriculumService.getModules(tenantId, id);
    return successResponse(modules, 'Course modules retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetModules');
  }
}

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, moduleSchema, { throwOnError: true });

    const newModule = await CurriculumService.createModule(tenantId, id, sanitized, user._id);
    return successResponse(newModule, 'Module created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateModule');
  }
}

