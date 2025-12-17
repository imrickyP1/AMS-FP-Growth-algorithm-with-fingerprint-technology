# Quick Start - Add Test Data to See Dashboard Working

## Step 1: Run this SQL in MySQL

Open MySQL Workbench or command line and run:

```sql
USE ams_db;

-- Clear existing data for today (optional)
DELETE FROM attendance WHERE date = '2025-12-17';

-- Insert sample attendance records for December 17, 2025
INSERT INTO attendance (user_id, position, am_time_in, am_time_out, pm_time_in, pm_time_out, date, remarks)
VALUES 
    -- Officials
    (1, 'official', '07:55:00', '12:00:00', '13:00:00', '17:00:00', '2025-12-17', 'Ontime'),
    (2, 'official', '08:15:00', '12:00:00', '13:00:00', '17:00:00', '2025-12-17', 'LATE'),
    
    -- Staff
    (22, 'staff', '08:45:00', '12:00:00', '13:00:00', '17:00:00', '2025-12-17', 'LATE'),
    (23, 'staff', '08:00:00', '12:00:00', '13:00:00', '16:30:00', '2025-12-17', 'Undertime'),
    (24, 'staff', '07:58:00', '12:00:00', '13:00:00', '18:30:00', '2025-12-17', 'Overtime'),
    (25, 'staff', '08:00:00', '12:00:00', '13:00:00', '17:00:00', '2025-12-17', 'Ontime');

-- Verify the data
SELECT * FROM attendance WHERE date = '2025-12-17' ORDER BY position, user_id;
```

## Step 2: Refresh the Dashboard

Go to: http://127.0.0.1:8000/dashboard.html

You should now see:
- **Total Officials**: 2
- **Total Staff**: 4
- **On Time**: 2
- **Late**: 2
- **Undertime**: 1
- **Overtime**: 1
- **Enrolled Users**: 1 (from users table)

## Step 3: Check Records Page

Go to: http://127.0.0.1:8000/records.html

You should see:
- Monthly view (December 1-31, 2025)
- All 6 attendance records from today
- Search and filter capabilities

## Creating Users (if needed)

If users with IDs 2, 23, 24, 25 don't exist, create them first:

```sql
USE ams_db;

INSERT INTO users (id, username, password, position, gender) VALUES
    (2, 'John Doe', '$2a$10$dummy', 'official', 'Male'),
    (23, 'Jane Smith', '$2a$10$dummy', 'staff', 'Female'),
    (24, 'Bob Wilson', '$2a$10$dummy', 'staff', 'Male'),
    (25, 'Alice Brown', '$2a$10$dummy', 'staff', 'Female')
ON DUPLICATE KEY UPDATE username = VALUES(username);
```

## Expected Dashboard Result

After inserting the data and refreshing:

✅ **Scanner Status Widget:**
- API Service: Online (green)
- Database: Online (green)
- SDK Initialized: Yes (green)
- Scanner Device: Available (green)
- Enrolled Users: 1 enrolled

✅ **Stats Cards:**
- Total Officials: 2
- Total Staff: 4
- On Time: 2
- Late: 2
- Undertime: 1
- Overtime: 1
- Enrolled Users: 1

✅ **Attendance Overview Chart:**
- Bar chart showing distribution of Ontime, Late, Undertime, Overtime

## Troubleshooting

**Still showing zeros?**
1. Check if API is running on port 5002
2. Open browser console (F12) and check for errors
3. Verify the date in database matches today's date
4. Make sure you're using the .NET backend (check api-config.js)

**Records page empty?**
1. The page now shows the entire current month
2. If no December records exist, it will show "No attendance records found"
3. Add the test data above to see records
4. Use the date filter to search specific dates
