import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { ReportGeneratorService } from '@/services/report-generator.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.REPORT_EXPORT,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const report = await ReportGeneratorService.generateReport(tenantId, {
      reportType: body.reportType,
      format: body.format,
      filters: body.filters,
      userId: user._id,
      title: body.title,
    });

    return successResponse(report, 'Report generated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'GenerateReport');
  }
}

