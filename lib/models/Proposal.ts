import mongoose, { Schema } from "mongoose";

const ProposalSchema = new Schema(
  {
    // Auto-generated readable id, e.g. PROP-2026-0001
    proposalNumber: { type: String, index: true },

    // Client / project info entered by admin
    clientName: { type: String, required: true },
    companyName: { type: String },
    clientPhone: { type: String },
    clientEmail: { type: String, required: true },
    projectName: { type: String },
    totalPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    currency: { type: String, enum: ["BDT", "USD"], default: "USD" },
    refundPolicy: { type: String },

    // The uploaded proposal PDF (base64 data URL)
    pdfFile: { type: String },
    pdfName: { type: String },

    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "signed", "rejected"],
      default: "draft",
    },

    // Public signing token
    token: { type: String, required: true, unique: true, index: true },

    // E-signature
    signerName: { type: String },
    signatureImage: { type: String }, // base64 data URL from signature pad
    signerIp: { type: String },

    // Tracking
    sentAt: { type: Date },
    openedAt: { type: Date },
    viewedAt: { type: Date },
    signedAt: { type: Date },

    // Ledger link + audit
    transactionId: { type: String },
    createdByEmail: { type: String },
    createdByName: { type: String },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Proposal;
}

export default mongoose.models.Proposal ||
  mongoose.model("Proposal", ProposalSchema);
