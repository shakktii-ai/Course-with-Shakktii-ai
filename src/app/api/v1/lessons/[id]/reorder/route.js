/**
 * AI Academy - Reorder Lessons API
 * POST /api/v1/lessons/[id]/reorder
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { CurriculumService } from '@/services/curriculum.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.LESSON_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params; // moduleId

    const body = await request.json().catch(() => ({}));
    const result = await CurriculumService.reorderLessons(tenantId, id, body.lessonIds);

    return successResponse(result, result.message);
  } catch (error) {
    return handleApiError(error, 'ReorderLessons');
  }
}

