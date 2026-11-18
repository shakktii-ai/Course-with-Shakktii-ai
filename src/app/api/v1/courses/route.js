/**
 * AI Academy - Courses Collection API
 * GET /api/v1/courses
 * POST /api/v1/courses
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CourseService } from '@/services/course.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const createCourseSchema = {
  title: { type: 'string', required: true, minLength: 3, maxLength: 200 },
  slug: { type: 'string', maxLength: 220 },
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
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      visibility: searchParams.get('visibility') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      instructorId: searchParams.get('instructorId') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await CourseService.getCourses(tenantId, filters, pagination);
    return successResponse(result, 'Courses retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetCourses');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, createCourseSchema, { throwOnError: true });

    const course = await CourseService.createCourse(tenantId, sanitized, user._id);
    return successResponse(course, 'Course created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateCourse');
  }
}

