import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    lastSeen: { type: Date, default: Date.now }, // <--- ADD THIS
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
