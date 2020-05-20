import { Schema, model } from "mongoose";

const userSchema = Schema({
  otp: {
    type: String,
    required: true,
    min: 6,
  },

  phone: {
    type: String,
    required: true,
    min: 6,
  },
});

module.exports = model("Otp", userSchema);
