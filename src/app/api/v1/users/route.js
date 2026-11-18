/**
 * AI Academy - Users Collection API
 * GET /api/v1/users
 * POST /api/v1/users
 */

import { successResponse, paginatedResponse, handleApiError } from '@/lib/response';
import { validate, EMAIL_REGEX } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { userService } from '@/services/user.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { parsePaginationParams, parseSortParams } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

const createUserSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 60 },
  email: { type: 'string', required: true, pattern: EMAIL_REGEX },
  password: { type: 'string', minLength: 8 },
  phone: { type: 'string' },
  roles: { type: 'array', itemType: 'string' },
  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_READ,
    });

    const { page, limit } = parsePaginationParams(request);
    const sort = parseSortParams(request, ['createdAt', 'name', 'email', 'status']);

    const result = await userService.getTenantUsers(user.tenantId, {
      page,
      limit,
      sort,
      select: '-password',
    });

    return paginatedResponse(result.items, result.pagination.total, page, limit, 'Users retrieved');
  } catch (error) {
    return handleApiError(error, 'GetUsers');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.USER_CREATE,
    });

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, createUserSchema, { throwOnError: true });

    const newUser = await userService.createUser(
      user.tenantId,
      sanitized,
      user._id
    );

    return successResponse(newUser, 'User created successfully', {}, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateUser');
  }
}

