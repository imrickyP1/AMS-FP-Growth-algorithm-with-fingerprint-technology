const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

// ✅ Create MySQL connection pool (without database initially for setup)
const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true, // Enable multiple SQL statements
};

// Pool for initial database creation (no database selected)
const setupPool = mysql.createPool(poolConfig);

// Pool for application use (with database selected)
const db = mysql.createPool({
  ...poolConfig,
  database: process.env.DB_NAME || "ams_db",
});

// ✅ Promise-based pool for async/await support
const promiseDb = db.promise();

// ✅ Initialize database and tables
const initializeDatabase = async () => {
  const dbName = process.env.DB_NAME || "ams_db";

  try {
    // Create database if not exists
    await setupPool.promise().query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is ready.`);

    // Create users table
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        position ENUM('admin', 'official', 'staff') NOT NULL DEFAULT 'staff',
        gender ENUM('Male', 'Female') NULL,
        fingerprint_template TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'users' is ready.");

    // Create attendance table
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        position ENUM('admin','official','staff') NOT NULL,
        am_time_in TIME DEFAULT NULL,
        am_time_out TIME DEFAULT NULL,
        pm_time_in TIME DEFAULT NULL,
        pm_time_out TIME DEFAULT NULL,
        date DATE NOT NULL,
        remarks ENUM('LATE', 'Ontime', 'Undertime', 'Overtime') DEFAULT 'Ontime',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    console.log("✅ Table 'attendance' is ready.");

    // Create reports table
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_month VARCHAR(20) NOT NULL,
        generated_by INT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Table 'reports' is ready.");

    // Create fingerprints table
    await promiseDb.query(`
      CREATE TABLE IF NOT EXISTS fingerprints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        fingerprint_template TEXT NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'fingerprints' is ready.");

    console.log("✅ All database tables initialized successfully!");

    // Close the setup pool after initialization
    setupPool.end();

  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
    throw err;
  }
};

// Run initialization
initializeDatabase().catch((err) => {
  console.error("❌ Failed to initialize database:", err.message);
});

// ✅ Export both callback-based and promise-based pools
// The db pool already has .promise() method from mysql2
module.exports = db;
