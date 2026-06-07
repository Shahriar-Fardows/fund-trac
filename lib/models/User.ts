import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "viewer"], default: "viewer" },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
