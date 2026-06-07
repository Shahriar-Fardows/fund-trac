import mongoose, { Schema } from "mongoose";

const ContributionSchema = new Schema(
  {
    partnerName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Contribution || mongoose.model("Contribution", ContributionSchema);
