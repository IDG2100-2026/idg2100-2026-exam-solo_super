const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    targetType: {type: String, required: true, enum: ["match", "tournament"]},
    targetId: {type: mongoose.Schema.Types.ObjectId, required: true},
    content: {type: String, required: true, trim: true, minlength: 1, maxlength: 1000}
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Comment", commentSchema);