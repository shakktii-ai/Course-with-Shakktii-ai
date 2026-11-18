/**
 * AI Academy - Departments API
 * GET /api/v1/departments
 * POST /api/v1/departments
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { departmentService } from '@/services/department.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const departmentSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 80 },
  code: { type: 'string', maxLength: 20 },
  description: { type: 'string', maxLength: 300 },
  managerId: { type: 'string' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const departments = await departmentService.getDepartments(tenantId);
    return successResponse(departments, 'Departments retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetDepartments');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.SETTINGS_MANAGE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, departmentSchema, { throwOnError: true });

    const department = await departmentService.createDepartment(
      tenantId,
      sanitized,
      user._id
    );

    return successResponse(department, 'Department created successfully', {}, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateDepartment');
  }
}

