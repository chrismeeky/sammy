import { Schema, model } from "mongoose";

const userSchema = Schema({
  name: {
    type: String,
    required: true,
    max: 50,
    min: 2,
  },
  id: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
    max: 255,
    min: 6,
  },

  password: {
    type: String,
    required: true,
    max: 1024,
    min: 6,
  },

  phone: {
    type: String,
    min: 8,
    max: 12,
    required: true,
  },
  role: {
    type: String,
    default: "member",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("User", userSchema);
