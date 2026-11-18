/**
 * AI Academy - Course Versions API
 * GET /api/v1/courses/[id]/versions
 * POST /api/v1/courses/[id]/versions
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CourseService } from '@/services/course.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const versionSchema = {
  changelog: { type: 'string', maxLength: 500 },
};

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const versions = await CourseService.getCourseVersions(tenantId, id);
    return successResponse(versions, 'Course versions retrieved');
  } catch (error) {
    return handleApiError(error, 'GetCourseVersions');
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
    const { sanitized } = validate(body, versionSchema, { throwOnError: true });

    const version = await CourseService.createVersion(
      tenantId,
      id,
      sanitized.changelog || 'Manual snapshot',
      user._id
    );

    return successResponse(version, 'Version snapshot created', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateCourseVersion');
  }
}

