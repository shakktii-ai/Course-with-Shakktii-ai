import mongoose from 'mongoose';

const domainMappingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    academyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'FAILED', 'DISABLED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    verificationToken: {
      type: String,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    sslStatus: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'ERROR'],
      default: 'PENDING',
    },
    dnsRecords: [
      {
        recordType: { type: String, default: 'CNAME' },
        name: String,
        value: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const DomainMapping =
  mongoose.models.DomainMapping || mongoose.model('DomainMapping', domainMappingSchema);
export default DomainMapping;

