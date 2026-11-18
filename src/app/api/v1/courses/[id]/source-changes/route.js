/**
 * AI Academy - Course Source Changes API
 * GET /api/v1/courses/[id]/source-changes
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import CourseSourceMapping from '@/models/CourseSourceMapping';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const mappings = await CourseSourceMapping.find({ courseId: id, tenantId })
      .populate('documentId', 'title originalFilename currentVersion')
      .lean();

    return successResponse(mappings, 'Source mappings and change reports retrieved');
  } catch (error) {
    return handleApiError(error, 'GetCourseSourceChanges');
  }
}

