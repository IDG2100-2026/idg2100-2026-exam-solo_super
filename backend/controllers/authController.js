const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, age, role } = req.body;

    // validation
    if (!username || !email || !password || age === undefined) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and age are required."
      });
    }
    if (username.length < 3) {
  return res.status(400).json({
    success: false,
    message: "Username must be at least 3 characters long."
  });
}

if (username.length > 20) {
  return res.status(400).json({
    success: false,
    message: "Username cannot be longer than 20 characters."
  });
}

if (password.length < 8) {
  return res.status(400).json({
    success: false,
    message: "Password must be at least 8 characters long."
  });
}

if (!email.includes("@")) {
  return res.status(400).json({
    success: false,
    message: "Please enter a valid email address."
  });
}

if (age < 18) {
  return res.status(400).json({
    success: false,
    message: "You must be at least 18 years old to register."
  });
}

    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old to register."
      });
    }

    // if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username is already in use."
      });
    }

    // if email already exists.
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use."
      });
    }

    // create the user
    const newUser = await User.create({
      username,
      email,
      password,
      age,
      role: role === "admin" ? "admin" : "user",
      eloRating: 1200,
      isBanned: false,
      trophies: []
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        age: newUser.age,
        role: newUser.role,
        eloRating: newUser.eloRating,
        isBanned: newUser.isBanned,
        trophies: newUser.trophies,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
      error: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "This account has been banned."
      });
    }

    const isPasswordCorrect = user.password === password;

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h"
      }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        eloRating: user.eloRating
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to log in.",
      error: error.message
    });
  }
};
const logoutUser = async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

const getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "No authenticated user found."
      });
    }

    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Authenticated user not found."
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "This account has been banned."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current user retrieved successfully.",
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve current user.",
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser
};