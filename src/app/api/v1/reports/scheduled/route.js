import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { ReportGeneratorService } from '@/services/report-generator.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.REPORT_SCHEDULE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const list = await ReportGeneratorService.listScheduledReports(tenantId);
    return successResponse(list, 'Scheduled reports retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetScheduledReports');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.REPORT_SCHEDULE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const created = await ReportGeneratorService.createScheduledReport(tenantId, user._id, body);

    return successResponse(created, 'Scheduled report created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateScheduledReport');
  }
}

