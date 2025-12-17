// server/routes/admin.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Admin route is working",
  });
});

module.exports = router;
