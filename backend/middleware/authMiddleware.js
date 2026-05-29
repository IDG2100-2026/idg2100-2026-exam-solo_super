const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      req.user = {
        userId: null,
        role: "anonymous"
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.isBanned) {
      req.user = {
        userId: null,
        role: "anonymous"
      };
      return next();
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      username: user.username
    };

    next();
  } catch (error) {
    req.user = {
      userId: null,
      role: "anonymous"
    };
    next();
  }
};

module.exports = authMiddleware;