/**
 * AI Academy - Public Certificate Verification API
 * GET /api/v1/certificates/verify/[code]
 * Open/Public endpoint - No authentication required
 */
import { successResponse, handleApiError } from '@/lib/response';
import { connectToDatabase } from '@/lib/mongodb';
import { CertificateService } from '@/services/certificate.service';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { code } = await params;

    const result = await CertificateService.verifyCertificate(code);
    return successResponse(result, 'Certificate verification processed');
  } catch (error) {
    return handleApiError(error, 'VerifyCertificatePublic');
  }
}

