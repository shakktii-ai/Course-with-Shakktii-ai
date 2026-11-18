/**
 * AI Academy - Course Category Details API
 * PATCH /api/v1/categories/[id]
 * DELETE /api/v1/categories/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CategoryService } from '@/services/category.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const updateSchema = {
  name: { type: 'string', minLength: 2, maxLength: 80 },
  description: { type: 'string', maxLength: 500 },
  icon: { type: 'string', maxLength: 50 },
  color: { type: 'string', maxLength: 20 },
  order: { type: 'number' },
  isActive: { type: 'boolean' },
};

export async function PATCH(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, updateSchema, { throwOnError: true });

    const updated = await CategoryService.updateCategory(tenantId, id, sanitized, user._id);
    return successResponse(updated, 'Category updated successfully');
  } catch (error) {
    return handleApiError(error, 'UpdateCategory');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const result = await CategoryService.deleteCategory(tenantId, id);
    return successResponse(result, 'Category deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteCategory');
  }
}

