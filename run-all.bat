@echo off
setlocal enabledelayedexpansion

REM ============================================
REM AMS - Attendance Monitoring System
REM Complete Startup Script
REM Runs both Frontend and .NET Core 9 API
REM ============================================

cls
echo.
echo ============================================
echo    AMS - Attendance Monitoring System
echo    Complete Startup Script
echo ============================================
echo.
echo This script will start:
echo  [1] Frontend (http-server) on port 8000
echo  [2] .NET Core 9 API on port 5002
echo.
echo Checking prerequisites...

REM Set working directory to C:\AMS_Dev
cd /d C:\AMS_Dev

if errorlevel 1 (
    echo ERROR: Cannot access C:\AMS_Dev directory
    echo Please ensure the project is properly installed
    pause
    exit /b 1
)

REM Add Node.js to PATH
set PATH=C:\Program Files\nodejs;%PATH%

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found - Node.js is required
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check dotnet
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] dotnet not found - .NET Core 9 is required
    echo Please install .NET Core 9 from https://dotnet.microsoft.com
    echo.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend\" (
    echo [ERROR] Frontend directory not found
    pause
    exit /b 1
)

REM Check if API directory exists
if not exist "netcore9\ams.api\" (
    echo [ERROR] API directory not found
    pause
    exit /b 1
)

REM Kill previous processes on ports
netstat -ano | findstr ":8000" >nul 2>&1
if errorlevel 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr ":5002" >nul 2>&1
if errorlevel 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5002"') do taskkill /PID %%a /F >nul 2>&1
)

timeout /t 1 /nobreak

REM ============================================
REM Start Services
REM ============================================
cls
echo.
echo ============================================
echo    Starting AMS Services
echo ============================================
echo.

echo [1/2] Starting Frontend Server...
echo        URL: http://localhost:8000
echo.
start "AMS Frontend - http://localhost:8000" cmd.exe /k "title AMS Frontend - http://localhost:8000 && cd /d C:\AMS_Dev && npm start frontend"

timeout /t 4 /nobreak

echo [2/2] Starting .NET Core 9 API...
echo        URL: http://localhost:5002
echo.
start "AMS API - .NET Core 9 - http://localhost:5002" cmd.exe /k "title AMS API - .NET Core 9 - http://localhost:5002 && cd /d C:\AMS_Dev\netcore9\ams.api && dotnet run --urls http://localhost:5002"

timeout /t 3 /nobreak

cls
echo.
echo ============================================
echo    ✓ AMS Services Started Successfully!
echo ============================================
echo.
echo FRONTEND:
echo   URL: http://localhost:8000
echo   Splash: http://localhost:8000/splash.html
echo.
echo API:
echo   URL: http://localhost:5002
echo   Swagger: http://localhost:5002/swagger
echo.
echo WINDOWS:
echo   [Frontend] AMS Frontend - http://localhost:8000
echo   [API]      AMS API - .NET Core 9 - http://localhost:5002
echo.
echo ============================================
echo    To Stop Services:
echo    Close the Frontend and API windows
echo ============================================
echo.

REM Wait a moment before opening browser
timeout /t 2 /nobreak

REM Open frontend in default browser
echo Opening application in browser...
start "" "http://localhost:8000/splash.html"

echo.
echo Application launched! Press any key to view this window again...
pause

endlocal
