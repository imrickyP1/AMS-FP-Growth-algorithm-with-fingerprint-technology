const express = require("express");
const router = express.Router();
const db = require("../../db");

// ===============================================
// 🔐 FINGERPRINT-BASED TIME LOG SYSTEM
// ===============================================
// Auto-detects AM/PM session
// AM: Before 12:00 = Time In, After = Time Out
// PM: 12:00-17:00 = Time In, After 17:00 = Time Out

//
// ✅ Record Time Log via Fingerprint Scan
// POST /api/attendance/fingerprint
//
router.post("/", async (req, res) => {
  const { fingerprintTemplate } = req.body;

  if (!fingerprintTemplate) {
    return res.status(400).json({
      success: false,
      message: "Fingerprint template is required.",
    });
  }

  try {
    // ===============================================
    // Step 1: Find user by fingerprint template
    // ===============================================
    const [users] = await db
      .promise()
      .query(
        "SELECT id, username, position, fingerprint_template FROM users WHERE fingerprint_template IS NOT NULL"
      );

    if (!users.length) {
      return res.json({
        success: false,
        message: "No registered fingerprints found in system.",
      });
    }

    // Find matching user (exact match or prefix match for demo)
    let matchedUser = null;
    
    for (const user of users) {
      if (user.fingerprint_template === fingerprintTemplate) {
        matchedUser = user;
        break;
      }
    }

    // Fallback: prefix matching for testing
    if (!matchedUser) {
      const templatePrefix = fingerprintTemplate.substring(0, 100);
      for (const user of users) {
        if (user.fingerprint_template && 
            user.fingerprint_template.substring(0, 100) === templatePrefix) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      return res.json({
        success: false,
        message: "Fingerprint not recognized. Please register first.",
      });
    }

    // ===============================================
    // Step 2: Determine Time In or Time Out
    // ===============================================
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isAM = hour < 12;

    // Check for existing attendance today
    const [existing] = await db
      .promise()
      .query(
        "SELECT * FROM attendance WHERE user_id = ? AND date = CURDATE()",
        [matchedUser.id]
      );

    // ===============================================
    // Determine remarks based on time
    // ===============================================
    let remarks = "Ontime";
    
    // AM Session timing
    // 8:00 AM - On time for Time In
    // Before 12:00 PM - Normal for Time Out
    if (isAM) {
      if (hour < 8) {
        remarks = "Ontime"; // Early
      } else if (hour === 8 && minute <= 15) {
        remarks = "Ontime";
      } else if (hour === 8 && minute <= 30) {
        remarks = "LATE";
      } else {
        remarks = "LATE";
      }
    } else {
      // PM Session timing
      // 1:00 PM - On time for PM Time In
      // 5:00 PM onwards - Normal for Time Out
      if (hour === 12 || (hour === 13 && minute === 0)) {
        remarks = "Ontime";
      } else if (hour === 13 && minute <= 15) {
        remarks = "Ontime";
      } else if (hour === 13 && minute <= 30) {
        remarks = "LATE";
      } else if (hour < 17) {
        remarks = "LATE";
      } else if (hour >= 17 && hour < 18) {
        remarks = "Ontime"; // Normal end time
      } else if (hour >= 18) {
        remarks = "Overtime";
      }
    }

    let attendanceType = "";
    let message = "";
    let logType = "";

    // ===============================================
    // Step 3: Record attendance based on session
    // ===============================================
    if (!existing.length) {
      // ===============================================
      // First scan of the day - Create new record with Time In
      // ===============================================
      const timeColumn = isAM ? "am_time_in" : "pm_time_in";
      
      await db
        .promise()
        .query(
          `INSERT INTO attendance (user_id, position, date, ${timeColumn}, remarks) VALUES (?, ?, CURDATE(), ?, ?)`,
          [matchedUser.id, matchedUser.position, currentTime, remarks]
        );

      attendanceType = isAM ? "AM Time In" : "PM Time In";
      logType = "Time In";
      message = `Good ${isAM ? 'morning' : 'afternoon'}, ${matchedUser.username}! Time In recorded.`;

      console.log(`🟢 [TimeLog] ${matchedUser.username} - ${attendanceType} (${remarks}) at ${currentTime}`);

    } else {
      // ===============================================
      // Existing record - Determine next action
      // ===============================================
      const record = existing[0];

      if (isAM) {
        // ===== AM SESSION =====
        if (!record.am_time_in) {
          // AM Time In
          await db.promise().query(
            `UPDATE attendance SET am_time_in = ?, remarks = ? WHERE id = ?`,
            [currentTime, remarks, record.id]
          );
          attendanceType = "AM Time In";
          logType = "Time In";
          message = `Good morning, ${matchedUser.username}! AM Time In recorded.`;
          
        } else if (!record.am_time_out) {
          // AM Time Out
          const outRemarks = hour < 11 ? "Undertime" : "Ontime";
          await db.promise().query(
            `UPDATE attendance SET am_time_out = ? WHERE id = ?`,
            [currentTime, record.id]
          );
          attendanceType = "AM Time Out";
          logType = "Time Out";
          remarks = outRemarks;
          message = `See you later, ${matchedUser.username}! AM Time Out recorded.`;
          
        } else {
          // AM session complete
          attendanceType = "AM Complete";
          logType = "Already Logged";
          message = `${matchedUser.username}, AM session already complete. Wait for PM session.`;
        }
        
      } else {
        // ===== PM SESSION =====
        if (!record.pm_time_in) {
          // PM Time In
          await db.promise().query(
            `UPDATE attendance SET pm_time_in = ?, remarks = ? WHERE id = ?`,
            [currentTime, remarks, record.id]
          );
          attendanceType = "PM Time In";
          logType = "Time In";
          message = `Welcome back, ${matchedUser.username}! PM Time In recorded.`;
          
        } else if (!record.pm_time_out) {
          // PM Time Out
          let outRemarks = "Ontime";
          if (hour < 17) {
            outRemarks = "Undertime";
          } else if (hour >= 18) {
            outRemarks = "Overtime";
          }
          
          await db.promise().query(
            `UPDATE attendance SET pm_time_out = ?, remarks = ? WHERE id = ?`,
            [currentTime, outRemarks, record.id]
          );
          attendanceType = "PM Time Out";
          logType = "Time Out";
          remarks = outRemarks;
          message = `Goodbye, ${matchedUser.username}! Have a great evening.`;
          
        } else {
          // PM session complete
          attendanceType = "Day Complete";
          logType = "Already Logged";
          message = `${matchedUser.username}, today's attendance is complete.`;
        }
      }

      console.log(`🟡 [TimeLog] ${matchedUser.username} - ${attendanceType} at ${currentTime}`);
    }

    // ===============================================
    // Step 4: Return response
    // ===============================================
    return res.json({
      success: true,
      message: message,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        position: matchedUser.position,
      },
      attendanceType: attendanceType,
      logType: logType,
      time: currentTime,
      remarks: remarks,
      session: isAM ? "AM" : "PM",
    });

  } catch (err) {
    console.error("❌ Time Log Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error processing time log.",
    });
  }
});

//
// ✅ Get Today's Logs
// GET /api/attendance/fingerprint/today
//
router.get("/today", async (req, res) => {
  try {
    const [logs] = await db
      .promise()
      .query(`
        SELECT 
          a.id,
          a.user_id,
          u.username,
          u.position,
          a.am_time_in,
          a.am_time_out,
          a.pm_time_in,
          a.pm_time_out,
          a.remarks,
          a.date
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = CURDATE()
        ORDER BY a.id DESC
      `);

    // Transform into individual log entries
    const logEntries = [];
    
    for (const record of logs) {
      if (record.pm_time_out) {
        logEntries.push({
          username: record.username,
          position: record.position,
          type: "PM Out",
          time: record.pm_time_out,
          remarks: record.remarks
        });
      }
      if (record.pm_time_in) {
        logEntries.push({
          username: record.username,
          position: record.position,
          type: "PM In",
          time: record.pm_time_in,
          remarks: record.remarks
        });
      }
      if (record.am_time_out) {
        logEntries.push({
          username: record.username,
          position: record.position,
          type: "AM Out",
          time: record.am_time_out,
          remarks: record.remarks
        });
      }
      if (record.am_time_in) {
        logEntries.push({
          username: record.username,
          position: record.position,
          type: "AM In",
          time: record.am_time_in,
          remarks: record.remarks
        });
      }
    }

    // Sort by time (most recent first)
    logEntries.sort((a, b) => b.time.localeCompare(a.time));

    return res.json({
      success: true,
      logs: logEntries.slice(0, 20), // Return last 20 entries
      total: logEntries.length
    });

  } catch (err) {
    console.error("❌ Get Today Logs Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

//
// ✅ Get all fingerprint templates for client-side matching
// GET /api/attendance/fingerprint/templates
//
router.get("/templates", async (req, res) => {
  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT id, username, position, fingerprint_template FROM users WHERE fingerprint_template IS NOT NULL"
      );

    return res.json({
      success: true,
      templates: users.map(u => ({
        userId: u.id,
        username: u.username,
        position: u.position,
        template: u.fingerprint_template
      }))
    });

  } catch (err) {
    console.error("❌ Get Templates Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

//
// ✅ Verify fingerprint matches a specific user
// POST /api/attendance/fingerprint/verify
//
router.post("/verify", async (req, res) => {
  const { userId, fingerprintTemplate } = req.body;

  if (!userId || !fingerprintTemplate) {
    return res.status(400).json({
      success: false,
      message: "User ID and fingerprint template are required.",
    });
  }

  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT fingerprint_template FROM users WHERE id = ?",
        [userId]
      );

    if (!users.length || !users[0].fingerprint_template) {
      return res.json({
        success: false,
        match: false,
        message: "User has no registered fingerprint.",
      });
    }

    const match = users[0].fingerprint_template === fingerprintTemplate;

    return res.json({
      success: true,
      match: match,
      message: match ? "Fingerprint verified." : "Fingerprint does not match.",
    });

  } catch (err) {
    console.error("❌ Verify Fingerprint Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

module.exports = router;
