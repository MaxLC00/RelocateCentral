require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const User = require("./models/User");
const { USER_ROLES } = require("./models/User");

// User list source, in priority order:
//   1. SEED_USERS_JSON env var (a JSON array string) — ideal for Render Shell,
//      since the users.json file is gitignored and not deployed.
//   2. server/users.json — a list of { username, password, role, displayName? }.
//      This file is gitignored because it contains plaintext passwords.
const USERS_FILE = path.join(__dirname, "users.json");

function loadUsers() {
  let raw;
  let source;

  if (process.env.SEED_USERS_JSON) {
    source = "SEED_USERS_JSON env var";
    try {
      raw = JSON.parse(process.env.SEED_USERS_JSON);
    } catch (err) {
      console.error("Could not parse SEED_USERS_JSON:", err.message);
      process.exit(1);
    }
  } else if (fs.existsSync(USERS_FILE)) {
    source = USERS_FILE;
    try {
      raw = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    } catch (err) {
      console.error("Could not parse users.json:", err.message);
      process.exit(1);
    }
  } else {
    console.error(
      "No user list found.\n" +
        "Set the SEED_USERS_JSON env var (JSON array), or create server/users.json " +
        "from server/users.example.json."
    );
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error(`User list from ${source} must be a JSON array of user objects.`);
    process.exit(1);
  }
  console.log(`Loading users from ${source}.`);
  return raw;
}

function validate(users) {
  const seen = new Set();
  users.forEach((u, i) => {
    const where = `Entry ${i + 1}`;
    if (!u.username || !u.password || !u.role) {
      throw new Error(`${where}: username, password, and role are all required.`);
    }
    if (!USER_ROLES.includes(u.role)) {
      throw new Error(
        `${where} (${u.username}): role "${u.role}" is invalid. Use one of: ${USER_ROLES.join(", ")}.`
      );
    }
    const key = String(u.username).trim().toLowerCase();
    if (seen.has(key)) {
      throw new Error(`${where}: duplicate username "${u.username}".`);
    }
    seen.add(key);
  });
}

async function seedUsers() {
  const users = loadUsers();
  try {
    validate(users);
  } catch (err) {
    console.error("Validation failed:", err.message);
    process.exit(1);
  }

  try {
    await connectDB();

    let created = 0;
    let updated = 0;

    for (const u of users) {
      const username = String(u.username).trim().toLowerCase();
      const passwordHash = bcrypt.hashSync(String(u.password), 10);
      const result = await User.updateOne(
        { username },
        {
          $set: {
            username,
            passwordHash,
            role: u.role,
            displayName: u.displayName || "",
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
      else if (result.modifiedCount || result.matchedCount) updated += 1;
    }

    console.log(
      `User seed complete: ${created} created, ${updated} updated (from ${users.length} entries).`
    );
  } catch (err) {
    console.error("User seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedUsers();
