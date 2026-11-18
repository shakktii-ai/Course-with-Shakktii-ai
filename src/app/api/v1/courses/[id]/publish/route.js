/**
 * AI Academy - Publish Course API
 * POST /api/v1/courses/[id]/publish
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
      permissions: PERMISSIONS.COURSE_PUBLISH,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await CourseService.publishCourse(tenantId, id, user._id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'PublishCourse');
  }
}

