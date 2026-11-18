/**
 * AI Academy - Enrollment Record API
 * PATCH /api/v1/enrollments/[id]
 * DELETE /api/v1/enrollments/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { EnrollmentService } from '@/services/enrollment.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';
import Enrollment from '@/models/Enrollment';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const updateSchema = {
  status: { type: 'string' },
  expiresAt: { type: 'string' },
  isMandatory: { type: 'boolean' },
};

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_ASSIGN,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateSchema, { throwOnError: true });

    const enrollment = await Enrollment.findOne({ _id: id, tenantId });
    if (!enrollment) {
      throw new NotFoundError('Enrollment record not found');
    }

    if (sanitized.status) enrollment.status = sanitized.status;
    if (sanitized.expiresAt !== undefined) {
      enrollment.expiresAt = sanitized.expiresAt ? new Date(sanitized.expiresAt) : null;
    }
    if (sanitized.isMandatory !== undefined) enrollment.isMandatory = sanitized.isMandatory;

    await enrollment.save();
    return successResponse(enrollment, 'Enrollment updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateEnrollment');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await EnrollmentService.cancelEnrollment(tenantId, id);
    return successResponse(result, 'Enrollment dropped successfully');
  } catch (error) {
    return handleApiError(error, 'CancelEnrollment');
  }
}

