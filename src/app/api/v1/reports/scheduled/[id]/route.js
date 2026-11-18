import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { ReportGeneratorService } from '@/services/report-generator.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function DELETE(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.REPORT_SCHEDULE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const deleted = await ReportGeneratorService.deleteScheduledReport(tenantId, id);

    return successResponse(deleted, 'Scheduled report deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteScheduledReport');
  }
}

export async function POST(request, context) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.REPORT_SCHEDULE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { id } = await context.params;
    const result = await ReportGeneratorService.executeScheduledReport(tenantId, id);

    return successResponse(result, 'Scheduled report executed successfully');
  } catch (error) {
    return handleApiError(error, 'ExecuteScheduledReport');
  }
}

