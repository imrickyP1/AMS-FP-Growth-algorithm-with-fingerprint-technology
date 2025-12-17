const express = require("express");
const router = express.Router();
const db = require("../../db");

router.get("/dashboard-summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // TOTAL OFFICIALS - Use attendance table position directly
    const [officials] = await db.promise().query(
      `
      SELECT COUNT(DISTINCT user_id) AS total
      FROM attendance
      WHERE LOWER(TRIM(position)) IN ('official', 'offical')
      AND date = ?
      `,
      [today]
    );

    // TOTAL STAFF - Use attendance table position directly
    const [staff] = await db.promise().query(
      `
      SELECT COUNT(DISTINCT user_id) AS total
      FROM attendance
      WHERE LOWER(TRIM(position)) = 'staff'
      AND date = ?
      `,
      [today]
    );

    // REMARKS SUMMARY — Count all attendance records for today
    const [summary] = await db.promise().query(
      `
      SELECT 
        SUM(CASE WHEN LOWER(TRIM(remarks)) IN ('ontime', 'on time') THEN 1 ELSE 0 END) AS ontime,
        SUM(CASE WHEN LOWER(TRIM(remarks)) = 'late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN LOWER(TRIM(remarks)) = 'undertime' THEN 1 ELSE 0 END) AS undertime,
        SUM(CASE WHEN LOWER(TRIM(remarks)) = 'overtime' THEN 1 ELSE 0 END) AS overtime,
        COUNT(*) AS total_records
      FROM attendance
      WHERE date = ?
      `,
      [today]
    );

    // ENROLLED USERS COUNT
    const [enrolledUsers] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM users WHERE fingerprint_template IS NOT NULL`
    );

    // Debug logging
    console.log('📊 Dashboard Summary for', today);
    console.log('Officials:', officials[0].total);
    console.log('Staff:', staff[0].total);
    console.log('Summary:', summary[0]);
    console.log('Enrolled Users:', enrolledUsers[0].total);

    res.json({
      success: true,
      date: today,
      totalOfficials: officials[0].total || 0,
      totalStaff: staff[0].total || 0,
      ontime: summary[0].ontime || 0,
      late: summary[0].late || 0,
      undertime: summary[0].undertime || 0,
      overtime: summary[0].overtime || 0,
      enrolledUsers: enrolledUsers[0].total || 0,
      totalRecords: summary[0].total_records || 0
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

module.exports = router;
