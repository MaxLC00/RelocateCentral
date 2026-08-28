const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function issueToken(res, { username, role, displayName }) {
  const token = jwt.sign(
    { username, role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
  res.json({ token, username, role, displayName: displayName || "" });
}

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const normalized = String(username).trim().toLowerCase();

  // 1. Bootstrap admin from environment (keeps the original single login working
  //    so an admin can always get in even before/if DB users are seeded).
  if (
    process.env.TEAM_USERNAME &&
    process.env.TEAM_PASSWORD_HASH &&
    normalized === process.env.TEAM_USERNAME.trim().toLowerCase() &&
    bcrypt.compareSync(password, process.env.TEAM_PASSWORD_HASH)
  ) {
    return issueToken(res, {
      username: process.env.TEAM_USERNAME,
      role: "Admin",
      displayName: "Administrator",
    });
  }

  // 2. Database-backed users.
  try {
    const user = await User.findOne({ username: normalized });
    if (user && user.checkPassword(password)) {
      return issueToken(res, {
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      });
    }
  } catch (err) {
    console.error("Login lookup failed:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }

  return res.status(401).json({ message: "Invalid username or password." });
}

module.exports = { login };
