import mongoose, { Schema } from "mongoose";

const ProjectPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    docLink: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      default: "Planning",
      enum: ["Planning", "Working", "Implementation", "Completed"],
      trim: true,
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.ProjectPlan;
}

export default mongoose.models.ProjectPlan || mongoose.model("ProjectPlan", ProjectPlanSchema);
