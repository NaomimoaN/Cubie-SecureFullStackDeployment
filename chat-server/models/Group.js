import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [50, "Group name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    // Creator must have the 'teacher' role. This should be enforced in the controller.
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Group creator is required"],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["teacher", "student"],
          default: "student",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better query performance
groupSchema.index({ name: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ "members.user": 1 });
groupSchema.index({ isActive: 1 });

// Virtual for member count
groupSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

// Method to check if user is member
groupSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

// Method to check if a user is a teacher in the group
groupSchema.methods.isTeacher = function (userId) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  return member && member.role === "teacher";
};

// Static method to find groups by user
groupSchema.statics.findByUser = function (userId) {
  return this.find({
    "members.user": userId,
    isActive: true,
  })
    .populate("creator", "profile.firstName profile.lastName")
    .populate("lastMessage", "content sender createdAt")
    .populate("members.user", "profile.firstName profile.lastName role")
    .sort({ "lastMessage.createdAt": -1, updatedAt: -1 });
};

// Static method to find groups created by user
groupSchema.statics.findByCreator = function (userId) {
  return this.find({
    creator: userId,
    isActive: true,
  });
};

const Group = mongoose.model("Group", groupSchema);

export default Group;
