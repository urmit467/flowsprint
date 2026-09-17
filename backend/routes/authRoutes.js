const express = require("express");
const router = express.Router();
const { register, login, logout, getMe, listUsers } = require("../controllers/authController");
const protect = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get("/users", protect, listUsers);

module.exports = router;
