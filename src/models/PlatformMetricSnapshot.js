import mongoose from 'mongoose';

const platformMetricSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalTenants: {
      type: Number,
      default: 0,
    },
    activeTenants: {
      type: Number,
      default: 0,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    totalCourses: {
      type: Number,
      default: 0,
    },
    totalEnrollments: {
      type: Number,
      default: 0,
    },
    totalCertificatesIssued: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    totalStorageBytes: {
      type: Number,
      default: 0,
    },
    breakdownByTier: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

platformMetricSnapshotSchema.index({ date: -1 });

const PlatformMetricSnapshot =
  mongoose.models.PlatformMetricSnapshot ||
  mongoose.model('PlatformMetricSnapshot', platformMetricSnapshotSchema);

export default PlatformMetricSnapshot;
export { PlatformMetricSnapshot };

