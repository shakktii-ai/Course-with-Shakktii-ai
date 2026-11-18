/**
 * AI Academy - Course Details API
 * GET /api/v1/courses/[id]
 * PATCH /api/v1/courses/[id]
 * DELETE /api/v1/courses/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CourseService } from '@/services/course.service';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateCourseSchema = {
  title: { type: 'string', minLength: 3, maxLength: 200 },
  headline: { type: 'string', maxLength: 300 },
  description: { type: 'string', maxLength: 5000 },
  thumbnail: { type: 'string' },
  categoryId: { type: 'string' },
  difficulty: { type: 'string' },
  visibility: { type: 'string' },
  durationHours: { type: 'number' },
  objectives: { type: 'array' },
  targetAudience: { type: 'array' },
  prerequisitesText: { type: 'array' },
  instructorId: { type: 'string' },
  scheduledPublishDate: { type: 'string' },
};

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === 'true';

    if (full) {
      const fullCurriculum = await CurriculumService.getFullCurriculum(tenantId, id);
      return successResponse(fullCurriculum, 'Full curriculum retrieved');
    }

    const course = await CourseService.getCourseById(tenantId, id);
    return successResponse(course, 'Course retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetCourse');
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateCourseSchema, { throwOnError: true });

    const updated = await CourseService.updateCourse(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Course updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateCourse');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await CourseService.deleteCourse(tenantId, id);
    return successResponse(result, 'Course deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteCourse');
  }
}

