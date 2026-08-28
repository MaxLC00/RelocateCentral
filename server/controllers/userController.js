const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { USER_ROLES } = require("../models/User");

async function listUsers(req, res) {
  const users = await User.find().sort({ username: 1 });
  res.json(users);
}

async function createUser(req, res) {
  const { username, password, role, displayName } = req.body;

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ message: "Username, password, and role are required." });
  }
  if (!USER_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${USER_ROLES.join(", ")}.` });
  }

  const normalized = String(username).trim().toLowerCase();

  const existing = await User.findOne({ username: normalized });
  if (existing) {
    return res.status(409).json({ message: "A user with that username already exists." });
  }

  const user = await User.create({
    username: normalized,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    displayName: displayName || "",
  });

  res.status(201).json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  res.json({ message: "User deleted.", id });
}

module.exports = { listUsers, createUser, deleteUser };
