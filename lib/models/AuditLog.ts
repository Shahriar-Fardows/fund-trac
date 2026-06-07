import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema(
  {
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
