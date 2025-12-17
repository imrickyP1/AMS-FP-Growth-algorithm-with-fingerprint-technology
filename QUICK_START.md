# Quick Start Guide - AMS Frontend Configuration

## ⚡ TL;DR - Get Started in 2 Minutes

### 1️⃣ Start the .NET Core 9 API (Recommended)
```bash
cd /Users/kirkeypsalms/Downloads/AMS/netcore9/ams.api
dotnet run
```
✅ API running on `http://localhost:5002`

### 2️⃣ Serve the Frontend
```bash
cd /Users/kirkeypsalms/Downloads/AMS/frontend
python3 -m http.server 8000
```
✅ Frontend available at `http://localhost:8000`

### 3️⃣ Open in Browser
- Go to `http://localhost:8000/splash.html`
- Click **⚙️ Server Settings** button (bottom-right)
- Confirm `.NET Core 9` is selected
- Status should show **"Online"** with green dot

### 4️⃣ Test Fingerprint Time Log
- Click **"Time Log (Fingerprint)"**
- If fingerprint scanner is connected, use it
- Otherwise, use credentials fallback

---

## 🔄 Switching Between APIs

### Quick Switch Method:
1. Open any page
2. Click **⚙️ Server Settings** button
3. Select backend:
   - **Node.js Express** → http://localhost:5001
   - **.NET Core 9** → http://localhost:5002
4. Click **Apply** → Page reloads with new API

### Console Command:
```javascript
// Switch to Node.js
window.switchAPI('nodejs');

// Switch to .NET Core 9
window.switchAPI('netcore9');
```

---

## 🎯 Default Configuration

**Current Default**: `.NET Core 9` (Port 5002)

To change:
```bash
# Edit api-config.js
nano /Users/kirkeypsalms/Downloads/AMS/frontend/js/api-config.js

# Line 12: Change backend choice
const API_CHOICE = { backend: 'netcore9' };  # ← Edit this
```

---

## 📋 API Endpoints (Both Backends Support)

| Feature | Endpoint | Port |
|---------|----------|------|
| **Login** | POST `/api/auth/login` | 5001 or 5002 |
| **Register** | POST `/api/auth/register` | 5001 or 5002 |
| **Fingerprint Verify** | POST `/api/fingerprint/verify` | 5001 or 5002 |
| **Time Log** | POST `/api/attendance/timelog` | 5001 or 5002 |
| **Dashboard** | GET `/api/attendance/home/dashboard-summary` | 5001 or 5002 |
| **Records** | GET `/api/attendance/records` | 5001 or 5002 |

---

## 🔧 Troubleshooting Quick Fixes

### Problem: "API: Offline"
```bash
# Check if server is running
lsof -i :5002    # For .NET Core
lsof -i :5001    # For Node.js

# Kill any stuck processes
killall dotnet    # Kill .NET processes
killall node      # Kill Node processes
```

### Problem: Can't find api-config.js
✅ Already included in all HTML files. If missing:
```html
<!-- Add this BEFORE your script -->
<script src="js/api-config.js"></script>
```

### Problem: Fingerprint not connecting
1. Verify scanner is plugged in
2. Check if ZKTeco service is running
3. Try fallback credentials login
4. Check browser console for errors (F12)

---

## 📊 File Structure

```
/AMS/
├── frontend/
│   ├── js/
│   │   ├── api-config.js          ← Central API configuration
│   │   ├── login.js               ← Updated to use API_BASE_URL
│   │   ├── register.js            ← Updated to use API_BASE_URL
│   │   ├── dashboard.js           ← Updated to use API_BASE_URL
│   │   ├── timelog.js             ← Updated to use API_BASE_URL
│   │   └── ... (all updated)
│   ├── css/
│   │   └── splash_screen.css      ← Added API modal styles
│   ├── splash.html                ← Added API settings modal
│   ├── login.html                 ← Includes api-config.js
│   ├── timelog.html               ← Includes api-config.js
│   └── ... (all updated)
│
├── netcore9/
│   ├── ams.api/
│   │   ├── Program.cs             ← Main entry point
│   │   ├── appsettings.json       ← Database config
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── FingerprintController.cs
│   │   │   └── AttendanceController.cs
│   │   └── Services/              ← Business logic
│   └── AMS.sln                    ← Solution file
│
├── server/
│   ├── server.js                  ← Node.js backend (port 5001)
│   ├── routes/
│   │   └── auth.js, attendance/
│   └── ...
│
└── FRONTEND_API_CONFIGURATION.md  ← Detailed guide (this file)
```

---

## ✅ Verification Checklist

- [ ] .NET Core API starts without errors
- [ ] Frontend loads without console errors
- [ ] API Settings modal appears on splash.html
- [ ] Status shows "Online" with green dot
- [ ] Can switch between APIs without errors
- [ ] Page reload works correctly after switching
- [ ] All API calls use correct port (5001 or 5002)
- [ ] Fingerprint time log loads (or credentials login)
- [ ] Can login and view dashboard
- [ ] Attendance records save correctly

---

## 📞 Common Commands

```bash
# Start .NET Core API
cd /Users/kirkeypsalms/Downloads/AMS/netcore9/ams.api && dotnet run

# Start Node.js API
cd /Users/kirkeypsalms/Downloads/AMS/server && npm start

# Serve frontend
cd /Users/kirkeypsalms/Downloads/AMS/frontend && python3 -m http.server 8000

# Check port usage
lsof -i :5002    # .NET Core
lsof -i :5001    # Node.js
lsof -i :8000    # Frontend HTTP

# Kill process on port
lsof -i :5002 | grep LISTEN | awk '{print $2}' | xargs kill -9

# View .NET logs
tail -f /Users/kirkeypsalms/Downloads/AMS/netcore9/ams.api/log.txt
```

---

## 🎓 How to Test Both Backends

1. **Open Firefox + Chrome** (or two browser windows)

2. **Firefox Window**:
   - Go to `http://localhost:8000`
   - Click Settings → Select Node.js (5001)
   - Apply
   - Login with test account

3. **Chrome Window**:
   - Go to `http://localhost:8000`
   - Click Settings → Select .NET Core (5002)
   - Apply
   - Login with SAME test account

4. **Verify Sync**:
   - Both backends should show same user data
   - Attendance records should be identical
   - Fingerprint data should match

---

## 🚀 Production Deployment Notes

### For .NET Core 9:
```bash
# Build for production
dotnet publish -c Release -o ./publish

# Run optimized build
cd ./publish && dotnet AMS.API.dll
```

### For Frontend:
```bash
# Copy frontend folder to web server
cp -r /Users/kirkeypsalms/Downloads/AMS/frontend /var/www/ams/

# Change default API in api-config.js if needed
sed -i "s/backend: 'netcore9'/backend: 'nodejs'/g" /var/www/ams/js/api-config.js
```

---

**Last Updated**: December 8, 2024  
**Status**: ✅ Ready for Testing & Production
