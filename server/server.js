require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const announcementRoutes = require("./routes/announcements");
const unitRoutes = require("./routes/units");
const contactRoutes = require("./routes/contacts");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow one or more comma-separated front-end origins.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

// Serve the base landing page and other root-level static assets
app.use(express.static(path.join(__dirname, "public")));

// Serve the built React app under /allerton
const clientDist = path.join(__dirname, "../client/dist");
app.use("/allerton", express.static(clientDist));
// SPA fallback — any /allerton/* path that isn't a file returns index.html
app.get("/allerton/*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "allerton-info-api" });
});

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/contacts", contactRoutes);

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
