const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

//
// ✅ REGISTER USER
//
router.post("/register", async (req, res) => {
  const { username, password, gender, position, fingerprintTemplate } = req.body;

  // Validate inputs
  if (!username || !password || !gender || !position) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    // Check if username already exists
    const [existing] = await db
      .promise()
      .query("SELECT id FROM users WHERE username = ?", [username]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with fingerprint template
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO users (username, password, gender, position, fingerprint_template) VALUES (?, ?, ?, ?, ?)",
        [username, hashedPassword, gender, position, fingerprintTemplate || null]
      );

    // If fingerprint provided, also store in fingerprints table for backup/history
    if (fingerprintTemplate && result.insertId) {
      await db
        .promise()
        .query(
          "INSERT INTO fingerprints (user_id, fingerprint_template) VALUES (?, ?)",
          [result.insertId, fingerprintTemplate]
        );
    }

    return res.json({
      success: true,
      message: fingerprintTemplate 
        ? "Registered successfully with fingerprint! You can now log in."
        : "Registered successfully! You can now log in.",
    });

  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

//
// ✅ LOGIN USER + AUTO ATTENDANCE LOGGING
//
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db
      .promise()
      .query("SELECT * FROM users WHERE username = ?", [username]);

    if (!users.length)
      return res.json({
        success: false,
        message: "Invalid username or password.",
      });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({
        success: false,
        message: "Invalid username or password.",
      });

    // ✅ Determine redirect target
    const redirectTo = user.position === "admin" ? "dashboard.html" : "splash.html";

    // ✅ Auto attendance for staff/official only
    if (user.position === "official" || user.position === "staff") {
      const [existing] = await db
        .promise()
        .query(
          "SELECT * FROM attendance WHERE user_id = ? AND date = CURDATE()",
          [user.id]
        );

      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
      const hour = now.getHours();
      const minute = now.getMinutes();
      const session = hour < 12 ? "AM" : "PM";

      // ✅ Determine remarks
      let remarks = "";
      if (session === "AM") {
        if (hour < 8 || (hour === 8 && minute <= 0)) remarks = "Ontime";
        else if (hour === 8 && minute <= 30) remarks = "LATE";
        else remarks = "Undertime";
      } else {
        if (hour < 13 || (hour === 13 && minute <= 0)) remarks = "Ontime";
        else if (hour === 13 && minute <= 30) remarks = "LATE";
        else remarks = "Undertime";
      }

      const timeColumn = session === "AM" ? "am_time_in" : "pm_time_in";
      const timeOutColumn = session === "AM" ? "am_time_out" : "pm_time_out";

      if (!existing.length) {
        // Insert new attendance record
        await db
          .promise()
          .query(
            `INSERT INTO attendance (user_id, position, date, ${timeColumn}, remarks) VALUES (?, ?, CURDATE(), ?, ?)`,
            [user.id, user.position, currentTime, remarks]
          );

        console.log(`🟢 ${user.position} ${user.username} ${session} Time-in (${remarks}) at ${currentTime}`);
      } else if (!existing[0][timeOutColumn]) {
        // Update time_out for existing record
        await db
          .promise()
          .query(
            `UPDATE attendance SET ${timeOutColumn} = ?, remarks = ? WHERE id = ?`,
            [currentTime, remarks, existing[0].id]
          );

        console.log(`🟠 ${user.position} ${user.username} ${session} Time-out at ${currentTime}`);
      }
    }

    // ✅ Send response to frontend
    res.json({
      success: true,
      message: "Login successful!",
      redirectTo,
      user: {
        id: user.id,
        username: user.username,
        position: user.position,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, error: "Server error." });
  }
});

module.exports = router;
