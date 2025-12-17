# ZKFinger SDK Integration for AMS API

## Overview

This document describes how to set up the ZKFinger SDK for the AMS API to enable fingerprint scanning with the **ZK Live20R** device.

## Prerequisites

1. **Windows OS** - The ZKFinger SDK only supports Windows (Windows 7/8/10/11)
2. **.NET 9.0 Runtime** - For running the API
3. **ZK Live20R** fingerprint scanner connected via USB

## SDK Installation

### Step 1: Install the ZKFinger SDK

1. Navigate to `ZKFinger SDK V10.0-Windows-Lite` folder
2. Run `setup.exe` as Administrator
3. Follow the installation wizard
4. The installer will:
   - Install the native `libzkfp.dll` to the system
   - Install USB drivers for the fingerprint scanner
   - Register necessary COM components

### Step 2: Copy Native DLLs

After installing the SDK, you need to copy the native DLLs to the API project:

#### For x64 (64-bit Windows - Recommended)

Copy from the SDK installation folder to the API project:

```powershell
# From your SDK installation (typically C:\Program Files\ZKTeco\ZKFinger SDK)
# Copy to the API project runtime folder

# Required files:
# - libzkfp.dll (Native fingerprint library)

# Copy to:
# netcore9/ams.api/runtimes/win-x64/native/
```

#### For x86 (32-bit Windows)

```powershell
# Copy to:
# netcore9/ams.api/runtimes/win-x86/native/
```

### Step 3: Copy Managed DLL

The managed wrapper DLL is included in the SDK C# folder:

```powershell
# From: ZKFinger SDK V10.0-Windows-Lite/C#/lib/x64/libzkfpcsharp.dll
# To: netcore9/ams.api/runtimes/win-x64/native/libzkfpcsharp.dll

# For x86:
# From: ZKFinger SDK V10.0-Windows-Lite/C#/lib/x86/libzkfpcsharp.dll
# To: netcore9/ams.api/runtimes/win-x86/native/libzkfpcsharp.dll
```

## API Endpoints

Once configured, the following endpoints are available:

### Scanner Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scanner/status` | GET | Get scanner status and SDK info |
| `/api/scanner/detect` | GET | Detect connected scanners |
| `/api/scanner/initialize` | POST | Initialize the SDK |
| `/api/scanner/connect` | POST | Connect to a scanner |
| `/api/scanner/disconnect` | POST | Disconnect from scanner |
| `/api/scanner/capture` | POST | Capture single fingerprint |
| `/api/scanner/enroll` | POST | Enroll fingerprint (3 captures) |
| `/api/scanner/match` | POST | Match two templates |
| `/api/scanner/health` | GET | Health check |

### Fingerprint Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fingerprint/verify` | POST | Identify user by fingerprint (1:N) |
| `/api/fingerprint/enroll` | POST | Enroll fingerprint for user |
| `/api/fingerprint/templates` | GET | Get all stored templates |
| `/api/fingerprint/user/{id}` | GET | Get user's fingerprint |
| `/api/fingerprint/user/{id}` | DELETE | Delete user's fingerprint |

## Usage Flow

### 1. Initialize Scanner

```bash
# Initialize the SDK
curl -X POST http://localhost:5002/api/scanner/initialize

# Response:
# { "success": true, "sdkInitialized": true, "deviceCount": 1 }
```

### 2. Detect and Connect

```bash
# Detect connected devices
curl http://localhost:5002/api/scanner/detect

# Connect to first device
curl -X POST http://localhost:5002/api/scanner/connect?deviceIndex=0
```

### 3. Capture Fingerprint

```bash
# Single capture
curl -X POST http://localhost:5002/api/scanner/capture

# Response:
# { 
#   "success": true, 
#   "template": "BASE64_TEMPLATE_DATA...",
#   "image": "BASE64_IMAGE_DATA..."
# }
```

### 4. Enroll User

```bash
# Enroll with 3 captures (recommended)
curl -X POST http://localhost:5002/api/scanner/enroll?captures=3

# Save to database
curl -X POST http://localhost:5002/api/fingerprint/enroll \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "fingerprintTemplate": "BASE64_TEMPLATE...", "fingerIndex": 0}'
```

### 5. Verify/Identify

```bash
# Identify user by fingerprint
curl -X POST http://localhost:5002/api/fingerprint/verify \
  -H "Content-Type: application/json" \
  -d '{"fingerprintTemplate": "BASE64_TEMPLATE..."}'

# Response:
# {
#   "success": true,
#   "matched": true,
#   "userId": 1,
#   "username": "John",
#   "score": 78.5
# }
```

## Troubleshooting

### "No device connected"

1. Ensure the ZK Live20R is connected via USB
2. Check Device Manager for driver installation
3. Try running the SDK setup.exe again

### "Failed to initialize SDK"

1. Ensure libzkfp.dll is in the correct location
2. Check if the DLL is the correct architecture (x64 vs x86)
3. Run the application as Administrator

### "SDK matching failed"

1. The SDK may not be fully initialized
2. Templates may be from different SDK versions
3. Fallback to byte comparison is automatically used

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MATCH_THRESHOLD` | 50 | Minimum score for fingerprint match (0-100) |

## Architecture Notes

The integration consists of:

1. **ZKFPInterop.cs** - Low-level P/Invoke declarations
2. **ZKFPWrapper.cs** - High-level managed wrapper with memory handling
3. **ScannerService.cs** - Business logic service for scanner operations
4. **ScannerController.cs** - REST API endpoints
5. **FingerprintService.cs** - Fingerprint database operations with SDK matching

The SDK uses a "cache" model where templates are loaded into memory for fast matching. For persistence, templates are stored in the database as Base64 strings.
