import mongoose, { Schema } from "mongoose";

const RecurringTransactionSchema = new Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    project: { type: String },
    client: { type: String },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    startDate: { type: Date, required: true },
    nextRunDate: { type: Date, required: true },
    lastRun: { type: Date },
    active: { type: Boolean, default: true },
    createdBy: { type: String }, // user email
  },
  { timestamps: true }
);

export default mongoose.models.RecurringTransaction ||
  mongoose.model("RecurringTransaction", RecurringTransactionSchema);
