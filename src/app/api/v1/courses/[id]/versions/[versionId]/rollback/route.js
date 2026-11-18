/**
 * AI Academy - Course Version Rollback API
 * POST /api/v1/courses/[id]/versions/[versionId]/rollback
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { CourseService } from '@/services/course.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id, versionId } = await params;

    const result = await CourseService.rollbackVersion(tenantId, id, versionId, user._id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'RollbackCourseVersion');
  }
}

