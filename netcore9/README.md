# AMS API - .NET Core 9 Backend

## ZK Live20R Fingerprint Scanner Integration

This is the .NET Core 9 API backend for the Attendance Monitoring System (AMS) with ZKTeco Live20R fingerprint scanner integration.

## Features

- ✅ **Authentication** - JWT-based auth with login/register
- ✅ **Native SDK Integration** - Direct P/Invoke to ZKFinger SDK
- ✅ **Scanner Detection** - USB device detection and connection management
- ✅ **Fingerprint Capture** - Real-time capture from scanner hardware
- ✅ **Fingerprint Enrollment** - Register fingerprints with 3-capture merge
- ✅ **SDK Matching** - Use native ZKTeco algorithm for accurate matching
- ✅ **Attendance Tracking** - Automatic Time In/Out with AM/PM detection
- ✅ **MySQL Database** - Same database as Node.js backend
- ✅ **Swagger UI** - API documentation and testing

## Prerequisites

- .NET 9 SDK
- MySQL Server (same as existing setup)
- **Windows OS** (required for ZKFinger SDK)
- ZK Live20R Scanner connected via USB
- ZKFinger SDK installed (run `setup.exe` from SDK folder)

## Quick Start

### 1. Install ZKFinger SDK

```powershell
# Run the SDK installer from:
# ZKFinger SDK V10.0-Windows-Lite/setup.exe
```

### 2. Navigate to the API folder
```bash
cd netcore9/ams.api
```

### 3. Restore packages
```bash
dotnet restore
```

### 4. Run the API
```bash
dotnet run
```

The API will start on `http://localhost:5002`

### 5. Open Swagger UI
Navigate to: `http://localhost:5002/swagger`

## Configuration

The API reads from the existing `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root2
DB_PASS=blaise
DB_NAME=ams_db
API_PORT=5002
JWT_SECRET=your-secret-key
MATCH_THRESHOLD=50
```

## API Endpoints

### Scanner (Hardware Management)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scanner/status` | Get scanner status and SDK info |
| GET | `/api/scanner/detect` | Detect connected scanners |
| POST | `/api/scanner/initialize` | Initialize the SDK |
| POST | `/api/scanner/connect` | Connect to a scanner |
| POST | `/api/scanner/disconnect` | Disconnect from scanner |
| POST | `/api/scanner/capture` | Capture single fingerprint |
| POST | `/api/scanner/enroll` | Enroll fingerprint (3 captures) |
| POST | `/api/scanner/match` | Match two templates |
| GET | `/api/scanner/health` | Health check |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/fingerprint-login` | Login with fingerprint |
| GET | `/api/auth/status` | API health check |

### Fingerprint
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fingerprint/verify` | Verify/identify fingerprint |
| POST | `/api/fingerprint/enroll` | Enroll fingerprint for user |
| GET | `/api/fingerprint/templates` | Get all fingerprint templates |
| GET | `/api/fingerprint/user/{id}` | Get user's fingerprint |
| DELETE | `/api/fingerprint/user/{id}` | Delete user's fingerprint |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/fingerprint` | Record via fingerprint (auto AM/PM) |
| POST | `/api/attendance/timelog/{userId}` | Record by user ID |
| GET | `/api/attendance/today` | Get today's logs |
| GET | `/api/attendance/user/{id}` | Get user's attendance |
| GET | `/api/attendance/list` | Get all attendance |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (admin) |
| GET | `/api/users/{id}` | Get user by ID |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user (admin) |
| POST | `/api/users/{id}/fingerprint` | Enroll fingerprint |

## Fingerprint Matching

The API includes native ZKTeco SDK integration for accurate fingerprint matching:

1. **SDK Matching** (Windows): Uses the native `libzkfp.dll` for hardware-accelerated matching
2. **Fallback Matching** (Non-Windows): Basic byte comparison for testing/development
3. **Threshold**: Default match threshold is 50 (configurable via `MATCH_THRESHOLD`)

## Database

Uses the same MySQL database as the Node.js backend:
- Database: `ams_db`
- Tables: `users`, `attendance`, `fingerprints`, `reports`

## Project Structure

```
netcore9/
├── AMS.sln
├── ams.api/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── AttendanceController.cs
│   │   ├── FingerprintController.cs
│   │   ├── ScannerController.cs      # NEW: Hardware management
│   │   └── UsersController.cs
│   ├── Data/
│   │   └── DatabaseContext.cs
│   ├── Interop/                       # NEW: SDK Integration
│   │   └── ZKFinger/
│   │       ├── ZKFPInterop.cs        # P/Invoke declarations
│   │       └── ZKFPWrapper.cs        # High-level managed wrapper
│   ├── Models/
│   │   ├── Auth.cs
│   │   ├── Attendance.cs
│   │   ├── Fingerprint.cs
│   │   └── User.cs
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── AttendanceService.cs
│   │   ├── FingerprintService.cs
│   │   ├── ScannerService.cs         # NEW: Scanner management
│   │   └── UserService.cs
│   ├── Middleware/
│   │   └── ErrorHandlingMiddleware.cs
│   ├── runtimes/                      # Native DLL location
│   │   ├── win-x64/native/
│   │   └── win-x86/native/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── AMS.API.csproj
│   └── ZKFINGER_SETUP.md             # SDK setup instructions
└── README.md
```

## Scanner Setup

For detailed ZKFinger SDK setup instructions, see `ams.api/ZKFINGER_SETUP.md`.

Quick steps:
1. Run `ZKFinger SDK V10.0-Windows-Lite/setup.exe`
2. Copy `libzkfp.dll` to `runtimes/win-x64/native/` (or win-x86)
3. Start the API and call `/api/scanner/initialize`

## Running Both Backends

You can run both Node.js and .NET backends simultaneously:

- Node.js: `http://localhost:5001`
- .NET Core: `http://localhost:5002`

Update the frontend `api-config.js` to point to the .NET API:
```javascript
const API_BASE = "http://localhost:5002/api";
```

## License

MIT

