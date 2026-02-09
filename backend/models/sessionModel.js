import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // ✅ small t
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
