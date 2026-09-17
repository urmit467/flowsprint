const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // The very first person to register becomes admin automatically - no
    // manual DB editing needed to bootstrap a workspace. Everyone after
    // that defaults to member; managers get promoted by an admin.
    const adminExists = await User.exists({ role: "admin" });
    const assignedRole = adminExists ? "member" : "admin";

    const user = await User.create({ name, email, password, role: assignedRole });

    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

// GET /api/auth/me
const getMe = (req, res) => {
  res.json(req.user);
};

// GET /api/auth/users (for assigning members to projects/tasks)
const listUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

module.exports = { register, login, logout, getMe, listUsers };
