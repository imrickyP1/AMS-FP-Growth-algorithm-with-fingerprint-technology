# FIX: Dashboard API Offline & Not Showing Data

## Problem Summary
- Dashboard shows "API Service: Offline" (red dot)
- All stats show "--" instead of actual numbers
- BUT Records page shows data correctly
- There IS data in database for today (Rick, staff, Late, 12/17/2025)

## Root Causes Fixed

### 1. Wrong Scanner Status Endpoint ✅ FIXED
**Problem:** Dashboard was calling `/scanner/health` which doesn't exist
**Fix:** Changed to `/scanner/status` in dashboard.html line ~493

### 2. Wrong Response Property Names ✅ FIXED
**Problem:** Code was checking `healthData.scanner.sdkInitialized` but API returns `healthData.sdk.initialized`
**Fix:** Updated property paths to match API response structure

## Verification Steps

### Step 1: Test API Directly
Open this URL in browser: http://localhost:5002/api/attendance/home/dashboard-summary

Expected response:
```json
{
  "success": true,
  "date": "2025-12-17",
  "totalOfficials": 0,
  "totalStaff": 1,
  "ontime": 0,
  "late": 1,
  "undertime": 0,
  "overtime": 0,
  "enrolledUsers": 1
}
```

### Step 2: Test with Test Page
Open: http://127.0.0.1:8000/test-dashboard-api.html
- Should show "✅ API Connected!"
- Should display all stats correctly

### Step 3: Clear Browser Cache
1. Open Dashboard: http://127.0.0.1:8000/dashboard.html
2. Press `Ctrl + Shift + R` (hard refresh)
3. Or press `F12` → Network tab → Check "Disable cache"

### Step 4: Check Browser Console
1. Press `F12` to open Developer Tools
2. Go to Console tab
3. Refresh the page
4. Look for these messages:
   - ✅ `📊 Fetching dashboard data from: http://localhost:5002/api/attendance/home/dashboard-summary`
   - ✅ `✅ Dashboard data received:` (shows the data object)
   - ✅ `✅ Dashboard updated successfully`

If you see errors instead:
- ❌ CORS error → API needs restart
- ❌ 404 error → Wrong URL
- ❌ Network error → API not running

## Quick Fix Commands

### Restart API (if needed)
```powershell
# Stop existing API
Get-Process -Name "AMS.API" -ErrorAction SilentlyContinue | Stop-Process -Force

# Start API
cd C:\AMS\netcore9\ams.api
dotnet run --project AMS.API.csproj
```

### Restart Frontend (if needed)
```powershell
cd C:\AMS
npm run frontend
```

## What Should Happen Now

After hard refresh on dashboard:

✅ **Scanner Status Widget:**
- API Service: **Online** (green)
- Database: **Online** (green)
- SDK Initialized: **Yes** (green)
- Scanner Device: **Available** (green)
- Enrolled Users: **2 enrolled**

✅ **Stats Cards:**
- Total Officials: **0**
- Total Staff: **1** (Rick)
- On Time: **0**
- Late: **1** (Rick's late entry)
- Undertime: **0**
- Overtime: **0**
- Enrolled Users: **1**

✅ **Attendance Overview Chart:**
- Bar chart with 1 bar for "Late"

## If Still Not Working

### Check #1: API Actually Running?
```powershell
netstat -ano | findstr :5002
```
Should show `LISTENING` on port 5002

### Check #2: CORS Issue?
Open browser console, if you see:
```
Access to fetch at 'http://localhost:5002/...' from origin 'http://127.0.0.1:8000' has been blocked by CORS
```

**Fix:** Restart the API

### Check #3: Wrong API URL?
Check: `C:\AMS\frontend\js\api-config.js`

Should show:
```javascript
const API_CHOICE = {
  backend: 'netcore9'  // ← Make sure this is 'netcore9'
};

const API_URLS = {
  nodejs: 'http://localhost:5005/api',
  netcore9: 'http://localhost:5002/api'  // ← Port 5002
};
```

### Check #4: Authorization Token Missing?
Dashboard should work without token for the dashboard-summary endpoint.
But if you see 401 errors, try logging out and back in:
1. Click Logout
2. Login with: Admin / default0

## Files Modified

1. `C:\AMS\frontend\dashboard.html` - Fixed scanner status endpoint
2. `C:\AMS\frontend\js\dashboard.js` - Added console logging
3. `C:\AMS\frontend\test-dashboard-api.html` - NEW test page

## Final Test

1. Hard refresh dashboard: `Ctrl + Shift + R`
2. Check API status should be **Green (Online)**
3. Stats should show: Staff=1, Late=1, others=0
4. Chart should show 1 bar for Late

If this still doesn't work, check the browser console (F12) and look for the error messages.
