/**
 * AI Academy - Audit Logs API
 * GET /api/v1/audit-logs
 */

import { paginatedResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { AuditService } from '@/services/audit.service';
import { PERMISSIONS } from '@/constants';
import { parsePaginationParams } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.AUDIT_VIEW,
    });

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());

    const result = await AuditService.getLogs(user.tenantId, params);
    const { page, limit } = parsePaginationParams(request);

    return paginatedResponse(
      result.items,
      result.pagination.total,
      page,
      limit,
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error, 'GetAuditLogs');
  }
}

