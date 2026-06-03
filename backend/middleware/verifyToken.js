const jwt = require("jsonwebtoken");
const SecurityIncident = require("../models/securityIncidentSchema");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.ip && decoded.ip !== req.ip) {
      await SecurityIncident.create({
        type: "ip_mismatch",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        userId: decoded.userId,
        details: `Token IP ${decoded.ip} did not match request IP ${req.ip}.`,
      });

      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = verifyToken;