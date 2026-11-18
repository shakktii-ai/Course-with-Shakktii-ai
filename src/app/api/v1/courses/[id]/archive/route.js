/**
 * AI Academy - Archive Course API
 * POST /api/v1/courses/[id]/archive
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
      permissions: PERMISSIONS.COURSE_ARCHIVE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await CourseService.archiveCourse(tenantId, id, user._id);
    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'ArchiveCourse');
  }
}

