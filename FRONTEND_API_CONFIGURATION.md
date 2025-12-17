# Frontend API Configuration Guide

## Overview
The AMS (Attendance Monitoring System) frontend has been configured to support switching between two backend APIs:
1. **Node.js Express** (port 5001)
2. **.NET Core 9** (port 5002)

This allows for flexible deployment and testing without changing frontend code.

---

## 📋 Configuration Architecture

### Centralized API Configuration (`frontend/js/api-config.js`)

All frontend API calls now use a centralized configuration file that:
- Defines API endpoints for both backends
- Provides runtime switching capability
- Automatically loads the configured API across all pages

```javascript
// API Configuration
const API_CHOICE = { backend: 'netcore9' };  // Change to 'nodejs' for Node.js backend

const API_URLS = {
  nodejs: 'http://localhost:5001',
  netcore9: 'http://localhost:5002'
};

const API_BASE_URL = API_URLS[API_CHOICE.backend] || API_URLS.netcore9;

// Runtime switching function
window.switchAPI = function(backend) {
  if (API_URLS[backend]) {
    API_CHOICE.backend = backend;
    console.log(`✅ API switched to ${backend} (${API_URLS[backend]})`);
    localStorage.setItem('API_BACKEND', backend);
    location.reload();
  }
};
```

---

## 🎯 How It Works

### 1. **Switching Backends at Runtime**

The API can be switched in three ways:

#### Method A: Via API Settings Modal (Recommended)
- Click the **Server Settings** button (⚙️ gear icon) in the bottom-right corner of splash.html
- Select the desired backend (Node.js Express or .NET Core 9)
- The page will automatically reload and use the selected API

#### Method B: Via JavaScript Console
```javascript
// Switch to Node.js backend
window.switchAPI('nodejs');

// Switch to .NET Core 9 backend
window.switchAPI('netcore9');
```

#### Method C: Via Code Configuration
Edit `/frontend/js/api-config.js` and change:
```javascript
const API_CHOICE = { backend: 'netcore9' };  // or 'nodejs'
```

### 2. **API Endpoint Compatibility**

Both backends expose identical API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/fingerprint-login` | POST | Fingerprint authentication |
| `/api/fingerprint/verify` | POST | Verify fingerprint |
| `/api/fingerprint/enroll` | POST | Enroll new fingerprint |
| `/api/fingerprint/templates` | GET | Get enrolled templates |
| `/api/attendance/timelog` | POST | Record time in/out |
| `/api/attendance/home/dashboard-summary` | GET | Get dashboard data |
| `/api/attendance/list/users` | GET | Get users list |
| `/api/attendance/records` | GET | Get attendance records |
| `/api/attendance/trend` | GET | Get trend analysis |
| `/api/attendance/report` | POST | Generate report |

---

## 📝 Updated Frontend Files

All frontend JavaScript files have been updated to use the centralized `API_BASE_URL`:

### Files Modified
- ✅ `frontend/js/login.js`
- ✅ `frontend/js/register.js`
- ✅ `frontend/js/dashboard.js`
- ✅ `frontend/js/timelog.js`
- ✅ `frontend/js/list.js`
- ✅ `frontend/js/report.js`
- ✅ `frontend/js/records.js`
- ✅ `frontend/js/fingerprint-attendance.js`

### HTML Pages Updated
All main HTML pages now include `api-config.js` before their respective JavaScript files:

- ✅ `frontend/splash.html` - Home page with API settings modal
- ✅ `frontend/login.html` - User login page
- ✅ `frontend/register.html` - User registration with fingerprint enrollment
- ✅ `frontend/dashboard.html` - Admin dashboard
- ✅ `frontend/timelog.html` - Fingerprint time log
- ✅ `frontend/list.html` - Users list
- ✅ `frontend/report.html` - Reports and analytics
- ✅ `frontend/records.html` - Attendance records

---

## 🚀 Starting the Servers

### Backend 1: Node.js Express (Port 5001)
```bash
cd /Users/kirkeypsalms/Downloads/AMS/server
npm install  # If not already installed
npm start
```

Expected output:
```
✅ Database connected
🚀 Server running on port 5001
```

### Backend 2: .NET Core 9 (Port 5002)
```bash
cd /Users/kirkeypsalms/Downloads/AMS/netcore9/ams.api
dotnet restore
dotnet run
```

Expected output:
```
✅ Database 'ams_db' is ready.
✅ All database tables initialized successfully!
🚀 AMS API (.NET Core 9) running on port 5002
📡 Swagger UI: http://localhost:5002/swagger
```

---

## 🌐 Frontend Access

Once the servers are running, access the frontend:
- **URL**: Open any browser and navigate to the project folder or serve via HTTP

Example using Python:
```bash
cd /Users/kirkeypsalms/Downloads/AMS/frontend
python3 -m http.server 8000
# Then open http://localhost:8000
```

---

## 📊 API Settings Modal (splash.html)

The splash page includes an interactive API settings panel:

### Features:
- **Server Selection**: Radio buttons for Node.js Express and .NET Core 9
- **Connection Status**: Real-time indicator showing if API is online/offline
- **One-Click Switching**: Apply button reloads the page with the new API

### Usage:
1. Click the **⚙️ Server Settings** button (bottom-right corner)
2. Select your preferred backend
3. Check the connection status (green dot = online)
4. Click **Apply** to reload with the new API

---

## 🔄 How API Selection Persists

The selected API is saved in browser storage and remembered across sessions:
```javascript
localStorage.setItem('API_BACKEND', backend);
```

On page load, `api-config.js` checks localStorage and restores the last selected API.

---

## 🐛 Troubleshooting

### Issue: "API: Offline" Status
**Cause**: The selected backend server is not running

**Solution**:
1. Verify the Node.js server is running on port 5001: `lsof -i :5001`
2. Verify the .NET Core API is running on port 5002: `lsof -i :5002`
3. Start the appropriate server (see "Starting the Servers" section)

### Issue: API Calls Failing
**Cause**: Using wrong API base URL

**Solution**:
1. Open browser DevTools (F12)
2. Check console for error messages
3. Verify `API_BASE_URL` is correct: `console.log(API_BASE_URL)`
4. Switch backends and retry

### Issue: CORS Errors
**Cause**: Backend CORS configuration doesn't allow frontend origin

**Solution**:
- **For Node.js**: Check `cors` middleware in `/server/server.js`
- **For .NET Core**: Check CORS policy in `/netcore9/ams.api/Program.cs`

---

## 🔐 Database Configuration

Both backends use the **same MySQL database** for consistency:

```
Host: localhost
User: root2
Password: blaise
Database: ams_db
```

### Benefits:
- **User data synchronization**: Users created in Node.js can login via .NET Core 9
- **Fingerprint compatibility**: Fingerprints enrolled in one backend work in the other
- **Attendance records**: Time logs created in one backend are visible in the other

---

## ✨ API Settings Modal CSS

Custom styles have been added to `frontend/css/splash_screen.css`:

- `.api-settings-btn` - Floating settings button
- `.api-modal` - Modal backdrop and container
- `.api-modal-content` - Modal dialog box
- `.api-option` - Radio button options
- `.status-dot` - Online/offline indicator with pulse animation

---

## 📱 User Experience Flow

1. **Home Page** (`splash.html`): Choose between Fingerprint Time Log or Credentials Login
2. **API Settings**: Click the server button to switch backends anytime
3. **Login** (`login.html`): Authenticate with credentials or fingerprint
4. **Time Log** (`timelog.html`): Record attendance with fingerprint scanner
5. **Dashboard** (`dashboard.html`): View analytics and reports
6. **Admin Panel** (`list.html`, `report.html`): Manage users and view attendance

All pages seamlessly work with the selected backend without any changes needed.

---

## 🔄 Switching Between APIs in Production

To change the default API:

**Option 1**: Edit the configuration file
```bash
# Edit api-config.js
nano /Users/kirkeypsalms/Downloads/AMS/frontend/js/api-config.js

# Change line 12:
const API_CHOICE = { backend: 'nodejs' };  # Switch to 'netcore9' as needed
```

**Option 2**: Use the UI (Recommended)
- Users can self-select via the API Settings modal
- No code changes required
- Selection persists via localStorage

---

## 📈 Performance Considerations

### .NET Core 9 (Recommended for Production)
- **Advantages**: 
  - Faster execution (compiled C#)
  - Better concurrency handling
  - Lower memory footprint
  - Native Dapper ORM for efficient queries
- **Port**: 5002

### Node.js Express (Good for Development)
- **Advantages**:
  - Quick development and testing
  - JavaScript ecosystem
  - Easy rapid prototyping
- **Port**: 5001

---

## 🎓 Development Tips

### To Test API Compatibility:
1. Start both servers (ports 5001 and 5002)
2. Switch between them using the API Settings modal
3. Perform same actions in both backends
4. Verify identical responses and behavior

### To Debug API Calls:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for API requests showing port 5001 or 5002
4. Check response status and content

### To Add New API Endpoints:
1. Add endpoint to both backends (keep them identical)
2. Update frontend JS file to use `API_BASE_URL`
3. No additional configuration needed - works for both backends

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Verify database connection
3. Ensure both backends are properly built/configured
4. Check backend logs for error messages
5. Use browser DevTools to inspect API calls

---

**Last Updated**: December 8, 2024
**Status**: ✅ Fully Configured and Tested
