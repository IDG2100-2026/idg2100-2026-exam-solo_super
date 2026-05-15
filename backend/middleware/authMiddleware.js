const User = require("../models/userSchema");

/*
  Authentication:
  optional headers:
  - x-user-id
  - x-user-role
*/
const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.header("x-user-id");
    const roleHeader = req.header("x-user-role");

    // No headers -> anonymous
    if (!userId && !roleHeader) {
      req.user = {
        userId: null,
        role: "anonymous"
      };
      return next();
    }

    // If a userId is provided, try to fetch the user
    if (userId) {
      const user = await User.findById(userId).select("-password");

      // If user does not exist, do NOT block the request
      // Just treat the request as anonymous
      if (!user) {
        req.user = {
          userId: null,
          role: roleHeader || "anonymous"
        };
        return next();
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: "User is banned."
        });
      }

      req.user = {
        userId: user._id.toString(),
        role: user.role,
        username: user.username
      };

      return next();
    }

    // Fallback: role only
    req.user = {
      userId: null,
      role: roleHeader || "anonymous"
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;