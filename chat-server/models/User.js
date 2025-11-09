import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  profile: {
    firstName: String,
    lastName: String,
  },
  role: String,
});

const User = mongoose.model("User", userSchema);
export default User;
