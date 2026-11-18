/**
 * AI Academy - Enrollments API
 * GET /api/v1/enrollments
 * POST /api/v1/enrollments
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { EnrollmentService } from '@/services/enrollment.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS, ENROLLMENT_TYPE } from '@/constants';

export const dynamic = 'force-dynamic';

const enrollSchema = {
  courseId: { type: 'string', required: true },
  userId: { type: 'string' },
  userIds: { type: 'array' },
  departmentId: { type: 'string' },
  groupId: { type: 'string' },
  enrollmentType: { type: 'string' },
  isMandatory: { type: 'boolean' },
  expiresAt: { type: 'string' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      courseId: searchParams.get('courseId') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') || undefined,
      enrollmentType: searchParams.get('enrollmentType') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    // If student, scope to own enrollments unless manager/admin
    const hasAdminPermission = user.roles.some((r) =>
      ['SUPER_ADMIN', 'ORG_OWNER', 'ORG_ADMIN', 'ACADEMY_MANAGER', 'INSTRUCTOR'].includes(r)
    );

    if (!hasAdminPermission) {
      filters.userId = String(user._id);
    }

    const result = await EnrollmentService.getEnrollments(tenantId, filters, pagination);
    return successResponse(result, 'Enrollments retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetEnrollments');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, enrollSchema, { throwOnError: true });

    // 1. Department Enrollment
    if (sanitized.departmentId) {
      const result = await EnrollmentService.enrollDepartment(tenantId, {
        departmentId: sanitized.departmentId,
        courseId: sanitized.courseId,
        isMandatory: Boolean(sanitized.isMandatory),
        enrolledBy: user._id,
      });
      return successResponse(result, 'Department enrollment initiated', HTTP_STATUS.CREATED);
    }

    // 2. Group / Cohort Enrollment
    if (sanitized.groupId) {
      const result = await EnrollmentService.enrollGroup(tenantId, {
        groupId: sanitized.groupId,
        courseId: sanitized.courseId,
        isMandatory: Boolean(sanitized.isMandatory),
        enrolledBy: user._id,
      });
      return successResponse(result, 'Group enrollment initiated', HTTP_STATUS.CREATED);
    }

    // 3. Bulk Enrollment by userIds
    if (sanitized.userIds && sanitized.userIds.length > 0) {
      const result = await EnrollmentService.bulkEnrollUsers(tenantId, {
        userIds: sanitized.userIds,
        courseId: sanitized.courseId,
        enrollmentType: ENROLLMENT_TYPE.BULK,
        enrolledBy: user._id,
      });
      return successResponse(result, 'Bulk enrollment processed', HTTP_STATUS.CREATED);
    }

    // 4. Single Enrollment (either self or specified user)
    const targetUserId = sanitized.userId || user._id;

    const enrollment = await EnrollmentService.enrollUser(tenantId, {
      userId: targetUserId,
      courseId: sanitized.courseId,
      enrollmentType: sanitized.enrollmentType || ENROLLMENT_TYPE.INDIVIDUAL,
      isMandatory: Boolean(sanitized.isMandatory),
      expiresAt: sanitized.expiresAt ? new Date(sanitized.expiresAt) : null,
      enrolledBy: user._id,
    });

    return successResponse(enrollment, 'Enrolled successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateEnrollment');
  }
}

