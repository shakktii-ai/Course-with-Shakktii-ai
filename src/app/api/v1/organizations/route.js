/**
 * AI Academy - Organizations Collection API
 * GET /api/v1/organizations
 * POST /api/v1/organizations
 */

import { successResponse, paginatedResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { organizationService } from '@/services/organization.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { parsePaginationParams } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

const createOrgSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  slug: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  type: {
    type: 'string',
    enum: [
      'EDUCATIONAL_INSTITUTION',
      'COLLEGE_UNIVERSITY',
      'CORPORATE',
      'TRAINING_PROVIDER',
      'ONLINE_ACADEMY',
      'PROFESSIONAL_CERTIFIER',
      'INDIVIDUAL',
    ],
    default: 'CORPORATE',
  },
  website: { type: 'string' },
  contact: { type: 'object' },
};

export async function GET(request) {
  try {
    await authenticateRequest(request, {
      permissions: PERMISSIONS.ORGANIZATION_READ,
    });

    const { page, limit } = parsePaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const result = await organizationService.listOrganizations({ page, limit, status });
    return paginatedResponse(result.items, result.pagination.total, page, limit, 'Organizations retrieved');
  } catch (error) {
    return handleApiError(error, 'GetOrganizations');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.ORGANIZATION_CREATE,
    });

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, createOrgSchema, { throwOnError: true });

    const result = await organizationService.onboardOrganization({
      name: sanitized.name,
      slug: sanitized.slug,
      type: sanitized.type,
      ownerId: user._id,
      contact: sanitized.contact || {},
      creatorId: user._id,
    });

    return successResponse(result, 'Organization onboarded successfully', {}, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateOrganization');
  }
}

