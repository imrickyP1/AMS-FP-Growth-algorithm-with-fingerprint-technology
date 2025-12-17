const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5005;

// ✅ Swagger Documentation Setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AMS API - Node.js/Express Backend",
      version: "1.0.0",
      description: "Attendance Monitoring System API with ZKTeco Live20R Fingerprint Integration",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ✅ Enable CORS and JSON parsing
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow Electron file:// protocol and localhost variants
      const allowedOrigins = [
        "http://localhost:5005",
        "http://127.0.0.1:5005",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("file://")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Serve frontend folder
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// ✅ Serve favicon.ico to stop the log error
app.get("/favicon.ico", (req, res) => res.status(204).end());

// ✅ Swagger UI Endpoint
app.use("/swagger", swaggerUi.serve);
app.get("/swagger", swaggerUi.setup(swaggerSpec));

// ✅ API Status Endpoint
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "AMS Node.js API is running",
    version: "1.0.0",
    backend: "Express",
    device: "ZK Live20R",
  });
});
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const fingerprintRoutes = require("./routes/fingerprint");
const attendanceRecordRouters = require("./routes/attendance/record");
const attendanceListRoutes = require("./routes/attendance/list");
const attendanceHomeRoutes = require("./routes/attendance/home");
const attendanceReportRoutes = require("./routes/attendance/report");
const attendanceTrendRoutes = require("./routes/attendance/trend");
const attendanceFingerprintRoutes = require("./routes/attendance/fingerprint");

// ✅ ROUTE REGISTRATION (no duplication, clear hierarchy)
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fingerprint", fingerprintRoutes);
app.use("/api/attendance/records", attendanceRecordRouters);
app.use("/api/attendance/list", attendanceListRoutes);
app.use("/api/attendance/home", attendanceHomeRoutes);
app.use("/api/attendance/report", attendanceReportRoutes);
app.use("/api/attendance/trend", attendanceTrendRoutes);
app.use("/api/attendance/fingerprint", attendanceFingerprintRoutes);


// ✅ Frontend navigation
app.get("/", (req, res) =>
  res.sendFile(path.join(frontendPath, "splash.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(frontendPath, "login.html"))
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(frontendPath, "register.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(frontendPath, "dashboard.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(frontendPath, "admin.html"))
);
app.get("/fingerprint-attendance", (req, res) =>
  res.sendFile(path.join(frontendPath, "fingerprint-attendance.html"))
);
app.get("/timelog", (req, res) =>
  res.sendFile(path.join(frontendPath, "timelog.html"))
);

// ✅ Catch-all for missing routes
app.use((req, res) => {
  console.log("❌ Route not found:", req.originalUrl);
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

// ✅ Initialize default admin user if no users exist
async function initializeDefaultUser() {
  try {
    const bcrypt = require("bcrypt");
    
    // Check if users table has any records
    const [users] = await db.promise().query("SELECT COUNT(*) as count FROM users");
    
    if (users[0].count === 0) {
      // Hash the default password
      const hashedPassword = await bcrypt.hash("default0", 10);
      
      // Insert default admin user
      await db.promise().query(
        "INSERT INTO users (username, password, position, gender) VALUES (?, ?, ?, ?)",
        ["Admin", hashedPassword, "admin", "Male"]
      );
      
      console.log("✅ Default admin user created:");
      console.log("   Username: Admin");
      console.log("   Password: default0");
      console.log("   Position: admin");
    }
  } catch (error) {
    console.warn("⚠️  Could not initialize default user:", error.message);
  }
}

// ✅ Start server with fallback port handling
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize default user if needed
  await initializeDefaultUser();
});

// Handle port already in use (macOS ControlCenter uses port 5000)
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️  Port ${PORT} is already in use (likely macOS AirPlay).`);
    const fallbackPort = 5001;
    console.log(`🔄 Trying fallback port ${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      console.log(`🚀 Server running on http://localhost:${fallbackPort}`);
      console.log(`⚠️  Update your frontend API calls to use port ${fallbackPort}`);
    });
  }
});

