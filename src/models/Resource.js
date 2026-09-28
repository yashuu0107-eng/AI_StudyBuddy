const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
    type: { type: String, enum: ["summary", "flashcards", "quiz", "study-plan"], required: true },
    options: { type: mongoose.Schema.Types.Mixed, default: {} },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
