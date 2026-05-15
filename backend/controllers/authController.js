const User = require("../models/userSchema");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, age } = req.body;

    // validation
    if (!username || !email || !password || age === undefined) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and age are required."
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
      role: "user",
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

    // include password
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

    //basic check
    const isPasswordCorrect = user.password === password;

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        eloRating: user.eloRating
      },
      auth: {
        //NOT ACTUAL TOKEN just a variable for later
        mockToken: `mock-token-${user._id}`,
        role: user.role
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
  getCurrentUser
};