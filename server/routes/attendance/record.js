const express = require("express");
const router = express.Router();
const db = require("../../db");

router.get("/", async (req, res) => {
  try {
    const { username, searchName, fromDate, toDate, page, limit } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Missing admin username.",
      });
    }

    // Validate admin
    const [admin] = await db
      .promise()
      .query("SELECT id, position FROM users WHERE username = ?", [username]);

    if (!admin.length || admin[0].position !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Admin access only.",
      });
    }

    // Build SQL
    let sql = `
      SELECT 
        u.username AS employee,
        u.position,
        a.date,
        a.am_time_in,
        a.am_time_out,
        a.pm_time_in,
        a.pm_time_out,
        a.remarks
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1 = 1
    `;

    const params = [];

    if (searchName) {
      sql += " AND u.username LIKE ? ";
      params.push(`%${searchName}%`);
    }

    if (fromDate) {
      sql += " AND a.date >= ? ";
      params.push(fromDate);
    }

    if (toDate) {
      sql += " AND a.date <= ? ";
      params.push(toDate);
    }

    sql += " ORDER BY a.date DESC, a.id DESC ";

    // 5. PAGINATION SUPPORT
    let finalSql = sql;
    if (page && limit) {
      const pageNum = parseInt(page,10) || 1;
      const pageLimit = parseInt(limit, 10) || 20;
      const offset = (pageNum - 1) * pageLimit;
      
      finalSql = `${sql} LIMIT ? OFFSET ?`;
      params.push(pageLimit, offset);
    }

    // 6. EXECUTE QUERY

    const [rows] = await db.promise().query(finalSql, params);

    return res.json({
      success: true,
      totalRecords: rows.length,
      data: rows,
    });

  } catch (err) {
    console.error("❌ ERROR @ GET /attendance/records:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching attendance records.",
    });
  }
});

module.exports = router;
