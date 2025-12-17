using MySqlConnector;
using Dapper;

namespace AMS.API.Data;

public class DatabaseContext
{
    private readonly string _connectionString;
    private readonly string _database;

    public DatabaseContext()
    {
        var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
        var user = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
        var password = Environment.GetEnvironmentVariable("DB_PASS") ?? "";
        _database = Environment.GetEnvironmentVariable("DB_NAME") ?? "ams_db";

        _connectionString = $"Server={host};User={user};Password={password};Database={_database};AllowUserVariables=true;";
    }

    public MySqlConnection CreateConnection()
    {
        return new MySqlConnection(_connectionString);
    }

    public async Task InitializeDatabaseAsync()
    {
        // Connection without database for initial setup
        var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
        var user = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
        var password = Environment.GetEnvironmentVariable("DB_PASS") ?? "";
        
        var setupConnection = $"Server={host};User={user};Password={password};";

        try
        {
            // Create database if not exists
            using (var conn = new MySqlConnection(setupConnection))
            {
                await conn.OpenAsync();
                await conn.ExecuteAsync($"CREATE DATABASE IF NOT EXISTS `{_database}`");
                Console.WriteLine($"✅ Database '{_database}' is ready.");
            }

            // Create tables
            using var connection = CreateConnection();
            await connection.OpenAsync();

            // Users table
            await connection.ExecuteAsync(@"
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
            ");
            Console.WriteLine("✅ Table 'users' is ready.");

            // Attendance table
            await connection.ExecuteAsync(@"
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
            ");
            Console.WriteLine("✅ Table 'attendance' is ready.");

            // Reports table
            await connection.ExecuteAsync(@"
                CREATE TABLE IF NOT EXISTS reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    report_month VARCHAR(20) NOT NULL,
                    generated_by INT,
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
                )
            ");
            Console.WriteLine("✅ Table 'reports' is ready.");

            // Fingerprints table
            await connection.ExecuteAsync(@"
                CREATE TABLE IF NOT EXISTS fingerprints (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    fingerprint_template TEXT NOT NULL,
                    finger_index INT DEFAULT 0,
                    quality INT NULL,
                    capture_count INT DEFAULT 1,
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ");
            Console.WriteLine("✅ Table 'fingerprints' is ready.");
            
            // Add columns if they don't exist (for existing databases)
            try
            {
                // Check and add finger_index column
                var hasFingerIndex = await connection.ExecuteScalarAsync<long>(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'fingerprints' AND column_name = 'finger_index'");
                if (hasFingerIndex == 0)
                {
                    await connection.ExecuteAsync("ALTER TABLE fingerprints ADD COLUMN finger_index INT DEFAULT 0");
                    Console.WriteLine("✅ Added finger_index column to fingerprints table");
                }

                // Check and add quality column
                var hasQuality = await connection.ExecuteScalarAsync<long>(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'fingerprints' AND column_name = 'quality'");
                if (hasQuality == 0)
                {
                    await connection.ExecuteAsync("ALTER TABLE fingerprints ADD COLUMN quality INT NULL");
                    Console.WriteLine("✅ Added quality column to fingerprints table");
                }

                // Check and add capture_count column
                var hasCaptureCount = await connection.ExecuteScalarAsync<long>(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'fingerprints' AND column_name = 'capture_count'");
                if (hasCaptureCount == 0)
                {
                    await connection.ExecuteAsync("ALTER TABLE fingerprints ADD COLUMN capture_count INT DEFAULT 1");
                    Console.WriteLine("✅ Added capture_count column to fingerprints table");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️  Could not add optional columns: {ex.Message}");
            }

            Console.WriteLine("✅ All database tables initialized successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Database initialization failed: {ex.Message}");
            throw;
        }
    }
}
