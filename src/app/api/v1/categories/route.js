/**
 * AI Academy - Course Categories API
 * GET /api/v1/categories
 * POST /api/v1/categories
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { CategoryService } from '@/services/category.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const categorySchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 80 },
  slug: { type: 'string', maxLength: 100 },
  description: { type: 'string', maxLength: 500 },
  icon: { type: 'string', maxLength: 50 },
  color: { type: 'string', maxLength: 20 },
  order: { type: 'number' },
  isActive: { type: 'boolean' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const categories = await CategoryService.getCategories(tenantId);
    return successResponse(categories, 'Categories retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetCategories');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, categorySchema, { throwOnError: true });

    const category = await CategoryService.createCategory(tenantId, sanitized, user._id);
    return successResponse(category, 'Category created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateCategory');
  }
}

