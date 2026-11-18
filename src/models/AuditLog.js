import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    userEmail: {
      type: String,
      default: null,
    },
    userType: {
      type: String,
      enum: ['PLATFORM', 'TENANT', 'ANONYMOUS'],
      default: 'TENANT',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'FAILED_LOGIN',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'EMAIL_VERIFIED',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_STATUS_CHANGED',
        'ROLE_CREATED',
        'ROLE_UPDATED',
        'ROLE_DELETED',
        'ROLE_ASSIGNED',
        'ROLE_REVOKED',
        'PERMISSION_CHANGED',
        'SESSION_REVOKED',
        'SESSION_REVOKED_ALL',
      ],
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit logs are immutable
  }
);

auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

