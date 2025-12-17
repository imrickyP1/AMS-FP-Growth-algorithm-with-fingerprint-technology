const express = require("express");
const router = express.Router();
const db = require("../../db");
const dbp = db.promise();

// ======================================================================
// TREND API
// ======================================================================
router.get("/", async (req, res) => {
  try {
    let { employee, month } = req.query;

    // Default month → current month
    if (!month) {
      const now = new Date();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      month = `${y}-${m.toString().padStart(2, "0")}`;
    }

    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // USER FILTER (employee = username)
    let filterUser = "";
    let params = [];

    if (employee) {
      filterUser = "AND u.username = ?";
      params.push(employee);
    }

    // FINAL QUERY
    const sql = `
      SELECT 
        DATE(a.date) AS date,
        SUM(CASE WHEN LOWER(a.remarks) LIKE '%ontime%' THEN 1 ELSE 0 END) AS ontime,
        SUM(CASE WHEN LOWER(a.remarks) LIKE '%late%' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN LOWER(a.remarks) LIKE '%undertime%' THEN 1 ELSE 0 END) AS undertime,
        SUM(CASE WHEN LOWER(a.remarks) LIKE '%overtime%' THEN 1 ELSE 0 END) AS overtime
      FROM attendance a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE DATE(a.date) BETWEEN ? AND ?
      ${filterUser}
      GROUP BY DATE(a.date)
      ORDER BY DATE(a.date)
    `;

    const [rows] = await dbp.query(sql, [startDate, endDate, ...params]);

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Trend API Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
