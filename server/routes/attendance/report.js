const express = require("express");
const router = express.Router();
const db = require("../../db");
const { FPGrowth } = require("node-fpgrowth");

const dbp = db.promise();

// ======================================================================
// SUMMARY REPORT
// ======================================================================
router.get("/summary", async (req, res) => {
  try {
    const { month, position, searchName } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required." });
    }

    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // ==================================================================
    // 1) Build SQL Query
    // ==================================================================
    let query = `
      SELECT 
        u.username AS employee,
        u.position AS position,
        DATE(a.date) AS day,
        CASE 
          WHEN a.remarks LIKE '%ONTIME%' THEN 'ONTIME'
          WHEN a.remarks LIKE '%LATE%' THEN 'LATE'
          WHEN a.remarks LIKE '%UNDERTIME%' THEN 'UNDERTIME'
          WHEN a.remarks LIKE '%OVERTIME%' THEN 'OVERTIME'
          ELSE 'UNKNOWN'
        END AS remarks
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE DATE(a.date) BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (position && position !== "All Position") {
      query += " AND u.position = ? ";
      params.push(position);
    }

    if (searchName && searchName.trim() !== "") {
      query += " AND u.username LIKE ? ";
      params.push(`%${searchName.trim()}%`);
    }

    query += " ORDER BY day ASC, employee ASC";

    const [rows] = await dbp.query(query, params);

    if (rows.length === 0) {
      return res.json({
        patterns: [],
        chart: {
          labels: [],
          ontime: [],
          late: [],
          undertime: [],
          overtime: [],
          maxEmployees: 1
        }
      });
    }

    rows.forEach(r => {
      r.day = new Date(r.day).toISOString().split("T")[0];
    });

    // ==================================================================
    // 2) Group daily totals
    // ==================================================================
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.day]) {
        grouped[r.day] = { ONTIME: 0, LATE: 0, UNDERTIME: 0, OVERTIME: 0 };
      }
      grouped[r.day][r.remarks]++;
    });

    const labels = Object.keys(grouped);
    const ontimeArr = labels.map(d => grouped[d].ONTIME);
    const lateArr = labels.map(d => grouped[d].LATE);
    const undertimeArr = labels.map(d => grouped[d].UNDERTIME);
    const overtimeArr = labels.map(d => grouped[d].OVERTIME);

    // ==================================================================
    // 3) FP-Growth (frequent patterns)
    // ==================================================================
    const transactions = rows.map(r => [r.remarks]);

    let patterns = [];
    try {
      const fpg = new FPGrowth(0.1);
      patterns = await fpg.exec(transactions);
    } catch (err) {
      console.error("FP-Growth error", err);
    }

    patterns = patterns.map(p => ({
      items: p.items,
      support: p.support
    }));

    // ==================================================================
    // 4) Calculate Y-axis max
    // ==================================================================
    const safeMax = (...values) => {
      const flat = values.flat();
      const nums = flat.filter(n => typeof n === "number");
      return nums.length ? Math.max(...nums) : 1;
    };

    let maxEmployees = 1;

    if (searchName && searchName.trim() !== "") {
      // Y-axis for single employee
      maxEmployees = safeMax(ontimeArr, lateArr, undertimeArr, overtimeArr);
    } else {
      // Y-axis for all employees
      maxEmployees = new Set(rows.map(r => r.employee)).size;
      if (maxEmployees < 1) maxEmployees = 1;
    }

    // ==================================================================
    // 5) Filter patterns IF searching by employee
    // ==================================================================
    let finalPatterns = patterns;

    if (searchName && searchName.trim() !== "") {
      const user = searchName.trim().toLowerCase();

      // Extract only rows belonging to the searched employee
      const userRemarks = rows
        .filter(r => r.employee.toLowerCase().includes(user))
        .map(r => r.remarks);

      finalPatterns = patterns.filter(p =>
        p.items.every(item => userRemarks.includes(item))
      );
    }

    // ==================================================================
    // 6) Return final response
    // ==================================================================
    return res.json({
      patterns: finalPatterns,
      chart: {
        labels,
        ontime: ontimeArr,
        late: lateArr,
        undertime: undertimeArr,
        overtime: overtimeArr,
        maxEmployees
      }
    });

  } catch (error) {
    console.error("Report API Error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
