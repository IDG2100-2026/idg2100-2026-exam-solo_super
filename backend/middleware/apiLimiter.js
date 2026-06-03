const rateLimit = require("express-rate-limit");
const SecurityIncident = require("../models/securityIncidentSchema");

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,

  handler: async (req, res) => {
    try {
      await SecurityIncident.create({
        type: "rate_limit",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        details: "More than 100 requests per minute.",
      });
    } catch (error) {
      console.error("Rate limit incident error:", error);
    }

    return res.status(429).json({
      success: false,
      message: "Too many requests.",
    });
  },
});

module.exports = apiLimiter;