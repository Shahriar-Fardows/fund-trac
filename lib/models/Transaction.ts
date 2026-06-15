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
    status: {
      type: String,
      enum: ["pending", "partial", "completed", "refunded"],
      default: "completed",
    },
    receivedAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Transaction;
}

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
