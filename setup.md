# AMS Setup Instructions

## 1. Install ZKFinger SDK Driver (REQUIRED FIRST TIME)
Run this installer to install the native libzkfp.dll driver:
```
\\mac\Home\Downloads\AMS\ZKFinger SDK V10.0-Windows-Lite\setup.exe
```
This installs the ZKTeco fingerprint driver to your system.

## 2. Start API Server
```powershell
C:\Users\pitar\Downloads\AMS\AMS\netcore9\ams.api; dotnet run --urls http://localhost:5002
dotnet run --project "C:\Users\pitar\Downloads\AMS\AMS\netcore9\ams.api\AMS.API.csproj
```

## 3. Start Frontend Server
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"; cd C:\AMS_Dev; &"C:\Program Files\nodejs\npm.cmd" run frontend
```

## Troubleshooting

### Error: "Unable to load DLL 'libzkfp'"
- Run the SDK setup.exe installer from step 1
- Restart your computer after installation
- The native libzkfp.dll driver must be installed system-wide
