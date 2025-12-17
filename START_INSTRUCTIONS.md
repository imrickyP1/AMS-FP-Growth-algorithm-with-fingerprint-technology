# AMS - Quick Start Instructions

## Prerequisites
- Node.js installed (with npm)
- .NET Core 9 SDK installed
- ZKFinger SDK driver installed (run `ZKFinger SDK V10.0-Windows-Lite\setup.exe`)

## Starting the Application

### Option 1: Using the Automated Script (Easiest)
Simply double-click or run:
```
run-all.bat
```
This will automatically start both the frontend and API in separate windows.

### Option 2: Manual Startup

#### Step 1: Start the .NET Core API
Open a terminal and run:
```powershell
cd C:\AMS_Dev\netcore9\ams.api
dotnet run --urls http://localhost:5002
```
The API will be available at: **http://localhost:5002**

#### Step 2: Start the Frontend (in a new terminal)
Open another terminal and run:
```powershell
cd C:\AMS_Dev
npm run frontend
cmd /c "cd C:\AMS_Dev && npm run frontend"
```
The frontend will be available at: **http://localhost:8000**

### Option 3: Using npm Scripts

Start API:
```powershell
cd C:\AMS_Dev
npm run api
```

Start Frontend:
```powershell
cd C:\AMS_Dev
npm run frontend
```

Start Both (separate terminals):
```powershell
cd C:\AMS_Dev
npm run dev
```

## Accessing the Application

- **Login Page**: http://localhost:8000/login.html
- **Dashboard**: http://localhost:8000/dashboard.html
- **API Swagger**: http://localhost:5002/swagger

## Default Login Credentials

- **Username**: `Admin`
- **Password**: `default0`

## Stopping the Application

Press `Ctrl+C` in each terminal window to stop the services, or close the command windows.

## Troubleshooting

### Error: "Unable to load DLL 'libzkfp'"
- Run the ZKFinger SDK installer: `ZKFinger SDK V10.0-Windows-Lite\setup.exe`
- Restart your computer after installation

### Port Already in Use
Run the cleanup batch file:
```
run-all.bat
```
It will automatically kill processes using ports 8000 and 5002.

### SDK Initialization Failed
1. Ensure the ZK Live20R scanner is connected via USB
2. Check Device Manager to verify the device is recognized
3. Click "Init SDK" button on the dashboard
4. Try running the API as Administrator if needed
