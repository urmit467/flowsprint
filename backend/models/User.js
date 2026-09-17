const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Generates a short, human-shareable code like "FS-7K2P9X" that other users
// can type in to add someone to a project - much friendlier than a Mongo _id.
const generateSpecialId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return `FS-${code}`;
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "member",
    },
    specialId: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Assign a specialId once, on creation, retrying on the rare collision.
userSchema.pre("save", async function (next) {
  if (!this.isNew || this.specialId) return next();
  let code, exists;
  do {
    code = generateSpecialId();
    exists = await mongoose.models.User.exists({ specialId: code });
  } while (exists);
  this.specialId = code;
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
