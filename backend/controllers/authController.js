const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../config/auth");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    return res.json({ token: generateToken(user._id), username: user.username });
  } catch (err) {
    // Handle duplicate key error just in case schema unique throws after the checks
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Duplicate field", keyValue: err.keyValue });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({ token: generateToken(user._id), username: user.username });
    }
    return res.status(401).json({ message: "Invalid credentials" });
  } catch (_) {
    return res.status(500).json({ message: "Login failed" });
  }
};
