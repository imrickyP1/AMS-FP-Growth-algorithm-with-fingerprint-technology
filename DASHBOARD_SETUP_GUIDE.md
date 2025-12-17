# Attendance Monitoring System - Setup Guide

## Current Status

### ✅ What's Working
- **Dashboard displays**:
  - Total Officials
  - Total Staff  
  - On Time count
  - Late count
  - Undertime count
  - Overtime count
  - Enrolled Users count
  - Attendance Overview Chart

- **Scanner Integration**:
  - SDK initialized successfully
  - 1 device detected and connected
  - Scanner Status widget shows real-time connection

- **Records Page**:
  - Now shows MONTHLY attendance records by default
  - Date range: First day of current month to last day
  - Search by employee name
  - Filter by custom date range
  - View attendance trend charts

### 🔧 How to Run the System

#### 1. Start the Backend (.NET API)
```powershell
cd C:\AMS\netcore9\ams.api
dotnet run --project AMS.API.csproj
```
The API will start on: http://localhost:5002

#### 2. Start the Frontend
```powershell
cd C:\AMS
npm run frontend
```
The frontend will be available at: http://127.0.0.1:8000

#### 3. Access the Dashboard
- URL: http://127.0.0.1:8000/dashboard.html
- Login with: Admin / default0

### 📊 Dashboard Features

**Today's Attendance Summary:**
- Shows count of officials who attended today
- Shows count of staff who attended today
- Breakdown by attendance status (On Time, Late, Undertime, Overtime)
- Visual chart showing attendance distribution

**Scanner Status:**
- API Service status (Online/Offline)
- Database connection status
- SDK Initialization status
- Scanner Device availability
- Number of enrolled users

**Auto-Refresh:**
- Dashboard automatically refreshes every 30 seconds
- Scanner status checked every 30 seconds

### 📋 Records Page Features

**Monthly View:**
- Automatically loads current month's records
- Shows all attendance from the 1st to last day of the month

**Search & Filter:**
- Search by employee name
- Custom date range filtering
- View attendance trends per employee

**Columns Displayed:**
- Employee Name
- Position
- Date
- AM Time In / Out
- PM Time In / Out
- Remarks (Ontime, Late, Undertime, Overtime)

### 📝 Adding Test Data

To add sample attendance data for today (December 17, 2025):

1. **Using MySQL Workbench or Command Line:**
   Run the SQL file: `C:\AMS\insert_test_data.sql`

2. **Manual SQL:**
```sql
USE ams_db;

INSERT INTO attendance (user_id, position, am_time_in, am_time_out, pm_time_in, pm_time_out, date, remarks)
VALUES 
    (1, 'official', '08:00:00', '12:00:00', '13:00:00', '17:00:00', CURDATE(), 'Ontime'),
    (22, 'staff', '08:45:00', '12:00:00', '13:00:00', '17:00:00', CURDATE(), 'LATE'),
    (1, 'official', '08:05:00', '12:00:00', '13:00:00', '16:30:00', CURDATE(), 'Ontime');
```

3. **Using Fingerprint Scanner:**
   - Go to Scanner Utility page
   - Capture fingerprint for registered users
   - System will automatically record attendance with timestamp

### 🔍 Troubleshooting

**Dashboard shows "--" for all stats:**
- This means there's no attendance data for today's date
- Add test data using the SQL above
- Or use the fingerprint scanner to record attendance

**Scanner shows "Not Available":**
- Check if the ZK Live20R device is connected via USB
- Click "Init SDK" button on the dashboard
- Click "Refresh" to check status again

**Records page shows "No attendance records found":**
- Check your date range filter
- Make sure there's data in the database for that period
- Try searching for the current month

**API offline:**
- Make sure the .NET API is running on port 5002
- Check terminal for any error messages
- Restart the API if needed

### 📂 File Locations

**Backend:**
- API: `C:\AMS\netcore9\ams.api\`
- Controllers: `C:\AMS\netcore9\ams.api\Controllers\`
- Services: `C:\AMS\netcore9\ams.api\Services\`

**Frontend:**
- Dashboard: `C:\AMS\frontend\dashboard.html`
- Records: `C:\AMS\frontend\records.html`
- JavaScript: `C:\AMS\frontend\js\`

**Database:**
- Database Name: `ams_db`
- Tables: users, attendance, fingerprints, reports

### 🎯 Key Endpoints

**Dashboard:**
- GET `/api/attendance/home/dashboard-summary` - Today's summary

**Records:**
- GET `/api/attendance/records?searchName=&fromDate=&toDate=` - Get records

**Scanner:**
- GET `/api/scanner/status` - Scanner status
- POST `/api/scanner/initialize` - Init SDK
- POST `/api/scanner/capture` - Capture fingerprint

### 📌 Important Notes

1. **Date Handling:** The system uses the server's current date. Make sure your system date is correct.

2. **Position Field:** The attendance table has a position field. Valid values are:
   - `official` (or `offical` due to typo in schema)
   - `staff`
   - `admin`

3. **Remarks:** Valid values are:
   - `Ontime` (or `On Time`)
   - `LATE`
   - `Undertime`
   - `Overtime`

4. **Enrolled Users:** Shows count of users who have fingerprint templates registered in the system.

### 🚀 Next Steps

To see data on the dashboard:
1. Run the SQL script to insert test data: `C:\AMS\insert_test_data.sql`
2. Refresh the dashboard page
3. You should now see:
   - Total Officials: 2
   - Total Staff: 2
   - Ontime: 2
   - Late: 1
   - Overtime: 1

Or use the fingerprint scanner to register real attendance!
