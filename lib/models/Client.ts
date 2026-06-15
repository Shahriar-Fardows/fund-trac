import mongoose, { Schema } from "mongoose";

const ClientSchema = new Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, default: "" },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "lead", "active", "inactive"],
      default: "lead",
    },
    notes: { type: String, default: "" },
    services: { type: [String], default: [] },
    projectBudget: { type: Number, default: 0 },
    onboardedVia: {
      type: String,
      enum: ["admin", "public_form"],
      default: "admin",
    },
    onboardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Client;
}

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);
