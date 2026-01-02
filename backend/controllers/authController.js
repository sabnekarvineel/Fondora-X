import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  try {
    const { name, email, password, mobile, role, companyName, founderName, founderNumber, coFounderName, coFounderNumber } = req.body;

    // ✅ validate all required fields
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // ✅ check email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ check mobile
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile number already exists" });
    }

    // ✅ role validation
    const allowedRoles = ["student", "freelancer", "startup", "investor", "admin"];
    const finalRole = allowedRoles.includes(role) ? role : undefined;

    // ✅ Build user object
    const userData = {
      name,
      email,
      password,
      mobile,
      ...(finalRole && { role: finalRole }),
    };

    // ✅ Add startup profile data if role is startup
    if (finalRole === "startup") {
      userData.startupProfile = {
        companyName: companyName || "",
        founderName: founderName || "",
        founderNumber: founderNumber || "",
        coFounderName: coFounderName || "",
        coFounderNumber: coFounderNumber || "",
      };
    }

    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      startupProfile: user.role === "startup" ? user.startupProfile : undefined,
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ❌ mobile should NOT be required during login (unless OTP)
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned",
        reason: user.bannedReason || "Violated platform policies",
        isBanned: true,
      });
    }

    if (!user.isActive) {
      user.isActive = true;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isVerified: user.isVerified,
      profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
};

/* =========================
   GET CURRENT USER
========================= */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      isActive: user.isActive,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      location: user.location,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Forgot password request for email:", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Convert to lowercase to match schema
    const normalizedEmail = email.toLowerCase().trim();
    console.log("Normalized email:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });

    console.log("User found:", user);
    if (user) {
      console.log("User email:", user.email);
      console.log("User email type:", typeof user.email);
      console.log("User email length:", user.email?.length);
    } else {
      console.log("No user found with email:", normalizedEmail);
      console.log("Checking all users in DB...");
      const allUsers = await User.find().select("email");
      console.log("All users:", allUsers);
    }

    // 🔐 security: same response
    if (!user) {
      return res.status(200).json({
        message: "If an account exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    if (!user.email) {
      return res.status(400).json({ message: "User email not found" });
    }

    await sendEmail({
      to: user.email,
      subject: "Password Reset - InnovateX Hub",
      text: `You requested a password reset.

Click the link below to reset your password:
${resetUrl}

This link will expire in 15 minutes.`,
    });

    res.status(200).json({
      message: "Password reset link has been sent to your email address.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error in forgot password" });
  }
};
