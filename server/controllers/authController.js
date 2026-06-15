const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const validUsername =
    username === process.env.TEAM_USERNAME;
  const validPassword =
    validUsername &&
    bcrypt.compareSync(password, process.env.TEAM_PASSWORD_HASH);

  if (!validUsername || !validPassword) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, username });
}

module.exports = { login };
