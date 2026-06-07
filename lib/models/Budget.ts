import mongoose, { Schema } from "mongoose";

const BudgetSchema = new Schema(
  {
    month: { type: String, required: true }, // Format: "YYYY-MM"
    category: { type: String, required: true },
    limit: { type: Number, required: true },
  },
  { timestamps: true }
);

BudgetSchema.index({ month: 1, category: 1 }, { unique: true });

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
