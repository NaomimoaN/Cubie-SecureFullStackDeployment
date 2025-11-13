// server/controllers/model/authController.js
/**
 * @purpose Manages user authentication routes, including login, profile retrieval, and logout.
 * It handles user validation, token generation, and ensures role-based access control for admin logins.
 */

// asyncHandler is a middleware and is in your node_modules;
import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
// utility functions create a JWT for authentication;
import generateToken from "../../utils/jwtUtils.js";
import { generateSignedUrl } from "../../services/s3Service.js";

// authUser handles user login, validating credentials, checking admin access (if applicable), generating a JWT, and setting it in a cookie
const authUser = asyncHandler(async (req, res) => {
  // req is a JSON data which likely contains {"email": "user@example.com", "password": "pass123"}
  // express.json is already in app.js
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);

  // User collection and findOne is a mongoose method;
  // search a document where email field matches;
  // the user (= variable name) is either a null or a user document;
  const user = await User.findOne({ email });
  console.log("User found:", user ? "Yes" : "No");

  // To tell if the user tries to login as admit by its url;
  const isAdminLoginAttempt = req.originalUrl === "/api/auth/admin/login";
  // user document is found and matchPassword is a method to compare the hashed password;
  if (user && (await user.matchPassword(password))) {
    if (isAdminLoginAttempt && user.role !== "admin") {
      res.status(401);
      throw new Error("Not authorized as an admin");
    }
    // token will be a string;
    // JWT payload includes {id: user._id, role: user.role}
    const token = generateToken(user._id, user.role);
    // set jwt in a cookie named jwt (for cookie-based authentication);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    // Return token in response body for Authorization header usage (Bearer token)
    res.json({
      userId: user._id,
      email: user.email,
      name: `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.trim(),
      role: user.role,
      token: token, // Include token in response for Authorization header
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  let query = User.findById(req.user._id).select("-password");

  if (req.user.role === "student") {
    query = query.populate({
      path: "registeredSubjects",
      select: "name",
    });
  } else if (req.user.role === "teacher") {
    query = query.populate({
      path: "assignedSubjects",
      select: "name",
    });
  } else if (req.user.role === "parent") {
    query = query.populate({
      path: "familyStudents",
      select: "email profile.firstName profile.lastName profile.grade role",
    });
  }

  const user = await query.exec();

  if (user) {
    let registeredSubjectsDataForFrontend = [];
    if (user.role === "student" && user.registeredSubjects) {
      registeredSubjectsDataForFrontend = user.registeredSubjects.map(
        (subject) => ({
          _id: subject._id,
          name: subject.name,
        })
      );
    }

    let assignedSubjectsDataForFrontend = [];
    if (user.role === "teacher" && user.assignedSubjects) {
      assignedSubjectsDataForFrontend = user.assignedSubjects.map(
        (subject) => ({
          _id: subject._id,
          name: subject.name,
        })
      );
    }

    let familyStudentsDataForFrontend = [];
    if (user.role === "parent" && user.familyStudents) {
      familyStudentsDataForFrontend = user.familyStudents.map((student) => ({
        userId: student._id,
        name: `${student.profile?.firstName || ""} ${
          student.profile?.lastName || ""
        }`.trim(),
        role: student.role,
        profile: {
          firstName: student.profile?.firstName,
          lastName: student.profile?.lastName,
          grade: student.profile?.grade,
        },
      }));
    }

    // Generate signed URL for profile picture if it exists
    let profilePictureUrl = user.profile?.profilePictureUrl || "";
    if (user.profile?.profilePictureKey) {
      try {
        profilePictureUrl = await generateSignedUrl(
          user.profile.profilePictureKey
        );
        console.log("Generated signed URL for profile:", profilePictureUrl);
      } catch (error) {
        console.error(
          "Error generating signed URL for profile picture:",
          error
        );
        // Fallback to original URL or empty string
        profilePictureUrl = user.profile?.profilePictureUrl || "";
      }
    } else {
      console.log(
        "No profile picture key found, using original URL:",
        profilePictureUrl
      );
    }
    res.json({
      userId: user._id,
      email: user.email,
      name: `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.trim(),
      role: user.role,
      profile: {
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        profilePictureUrl: profilePictureUrl,
        avatarUrl: user.profile?.avatarUrl || "",
        grade: user.profile?.grade || "",
      },
      notificationSettings: user.notificationSettings || {
        systemUpdate: false,
        schoolUpdate: true,
        calendar: true,
        groupChat: true,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.role === "student" && {
        registeredSubjects: registeredSubjectsDataForFrontend,
      }),
      ...(user.role === "teacher" && {
        assignedSubjects: assignedSubjectsDataForFrontend,
      }),
      ...(user.role === "parent" && {
        familyStudents: familyStudentsDataForFrontend,
      }),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  res.status(200).json({ message: "User logged out successfully" });
});

// registerUser handles user registration (sign-up)
// This is a test/development feature for the assignment
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, grade } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName || !role) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: email, password, firstName, lastName, role"
    );
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Validate role
  const validRoles = ["admin", "teacher", "student", "parent"];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // Create user
  // Password will be automatically hashed by the pre-save hook in userModel
  const user = await User.create({
    email,
    password, // Will be hashed automatically
    role,
    profile: {
      firstName,
      lastName,
      ...(role === "student" && grade && { grade }),
    },
  });

  if (user) {
    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Set token in cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    // Return user data and token
    res.status(201).json({
      userId: user._id,
      email: user.email,
      name: `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.trim(),
      role: user.role,
      token: token, // Include token in response for Authorization header
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

export { authUser, getUserProfile, logoutUser, registerUser };
