import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { OAuth2Client } from "google-auth-library";

/* =========================
   REGISTER - DISABLED (Google OAuth Only)
========================= */
export const register = async (req, res) => {
  try {
    return res.status(403).json({
      message: "Registration with email and password is not allowed. Please register using Google Sign-In.",
      requireGoogle: true
    });
  } catch (error) {
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

    // Use production URL for password reset link
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://fondora-x.vercel.app'
      : process.env.CLIENT_URL || 'http://localhost:3000';
    
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    if (!user.email) {
      return res.status(400).json({ message: "User email not found" });
    }

    await sendEmail({
      to: user.email,
      subject: "Password Reset - Fondora-X",
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

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log("✅ Password reset successfully for:", user.email);

    res.status(200).json({
      message: "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

/* =========================
   GOOGLE AUTH VERIFICATION
   Handles both Login and Registration via Google OAuth
========================= */
export const verifyGoogleToken = async (req, res) => {
  try {
    console.log("🔐 Google token verification started");
    const { token, role, mobile, password, companyName } = req.body;

    console.log("📝 Received:", { hasToken: !!token, role, mobile, hasCompanyName: !!companyName });

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("❌ GOOGLE_CLIENT_ID not set in environment");
      return res.status(500).json({ message: "Google OAuth not configured" });
    }

    console.log("✅ GOOGLE_CLIENT_ID found:", process.env.GOOGLE_CLIENT_ID.substring(0, 20) + "...");

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    console.log("✅ Token verified successfully for:", email);

    // Check if user exists
    let user = await User.findOne({ email });
    console.log("👤 User exists:", !!user);

    if (!user) {
      // 🆕 NEW USER REGISTRATION via Google
      // For registration, role and mobile are required
      if (!role) {
        return res.status(400).json({ 
          message: "Role is required for registration",
          isNewUser: true 
        });
      }

      if (!mobile) {
        return res.status(400).json({ 
          message: "Mobile number is required for registration",
          isNewUser: true 
        });
      }

      // Validate role
      const allowedRoles = ["student", "freelancer", "startup", "investor"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role selected",
          isNewUser: true 
        });
      }

      // Validate mobile (Indian mobile format)
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ 
          message: "Please enter a valid 10-digit Indian mobile number",
          isNewUser: true 
        });
      }

      // Check if mobile already exists
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ 
          message: "Mobile number already registered",
          isNewUser: true 
        });
      }

      // Build user data
      const userData = {
        name,
        email,
        mobile,
        googleId: sub,
        profilePhoto: picture,
        isVerified: true, // Google verified emails
        password: password || Math.random().toString(36).slice(-20), // Use provided password or generate random for OAuth users
        role: role,
      };

      // Add startup profile if role is startup
      if (role === "startup" && companyName) {
        userData.startupProfile = {
          companyName: companyName,
        };
      }

      user = await User.create(userData);
    } else {
      // 👤 EXISTING USER LOGIN via Google
      if (!user.googleId) {
        // Link Google account to existing user
        user.googleId = sub;
        if (picture && !user.profilePhoto) {
          user.profilePhoto = picture;
        }
        await user.save();
      }
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
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};
