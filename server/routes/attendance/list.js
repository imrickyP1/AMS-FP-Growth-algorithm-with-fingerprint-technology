const express = require("express");
const router = express.Router();
const db = require("../../db");

// =============================================
// 🔹 GET /api/attendance/list/users
//     → Fetch all registered users
// =============================================
router.get("/users", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        id,
        username,
        gender,
        position
      FROM users
      ORDER BY id ASC
    `);

    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Error loading users:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users."
    });
  }
});

// =============================================
// 🔥 DELETE /api/attendance/list/users/:id
//     → Delete a user + their attendance records
// =============================================
router.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Check if user exists
    const [user] = await db.promise().query(
      `SELECT id FROM users WHERE id = ?`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // OPTIONAL: Delete attendance records first
    await db.promise().query(
      `DELETE FROM attendance WHERE user_id = ?`,
      [userId]
    );

    // Delete the user
    await db.promise().query(
      `DELETE FROM users WHERE id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: "User deleted successfully."
    });

  } catch (error) {
    console.error("❌ Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user."
    });
  }
});

module.exports = router;
