const express = require("express");
const router = express.Router();
const db = require("../db");

// ===============================================
// 🔐 FINGERPRINT API ROUTES
// ===============================================

//
// ✅ Get Fingerprint by User ID
//
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await db
      .promise()
      .query("SELECT fingerprint_template FROM users WHERE id = ?", [userId]);

    if (!users.length || !users[0].fingerprint_template) {
      return res.status(404).json({
        success: false,
        message: "Fingerprint not found for this user.",
      });
    }

    return res.json({
      success: true,
      template: users[0].fingerprint_template,
    });

  } catch (err) {
    console.error("❌ Get Fingerprint Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

//
// ✅ Update Fingerprint for User
//
router.put("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { fingerprintTemplate } = req.body;

  if (!fingerprintTemplate) {
    return res.status(400).json({
      success: false,
      message: "Fingerprint template is required.",
    });
  }

  try {
    // Update user's fingerprint
    await db
      .promise()
      .query(
        "UPDATE users SET fingerprint_template = ? WHERE id = ?",
        [fingerprintTemplate, userId]
      );

    // Also add to fingerprints table for history
    await db
      .promise()
      .query(
        "INSERT INTO fingerprints (user_id, fingerprint_template) VALUES (?, ?)",
        [userId, fingerprintTemplate]
      );

    return res.json({
      success: true,
      message: "Fingerprint updated successfully.",
    });

  } catch (err) {
    console.error("❌ Update Fingerprint Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

//
// ✅ Get All Users with Fingerprints (for attendance matching)
//
router.get("/all", async (req, res) => {
  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT id, username, position, fingerprint_template FROM users WHERE fingerprint_template IS NOT NULL"
      );

    return res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        position: u.position,
        template: u.fingerprint_template
      }))
    });

  } catch (err) {
    console.error("❌ Get All Fingerprints Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

//
// ✅ Delete Fingerprint
//
router.delete("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Clear from users table
    await db
      .promise()
      .query(
        "UPDATE users SET fingerprint_template = NULL WHERE id = ?",
        [userId]
      );

    // Remove from fingerprints table
    await db
      .promise()
      .query(
        "DELETE FROM fingerprints WHERE user_id = ?",
        [userId]
      );

    return res.json({
      success: true,
      message: "Fingerprint deleted successfully.",
    });

  } catch (err) {
    console.error("❌ Delete Fingerprint Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

module.exports = router;
