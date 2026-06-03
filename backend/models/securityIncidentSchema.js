const mongoose = require("mongoose");

const securityIncidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["rate_limit", "ip_mismatch"],
      required: true,
    },
    ip: String,
    userAgent: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    details: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityIncident", securityIncidentSchema);