import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ["BDT", "USD"], default: "BDT" },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    receiptImage: { type: String }, // Base64 image
    client: { type: String },
    project: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
