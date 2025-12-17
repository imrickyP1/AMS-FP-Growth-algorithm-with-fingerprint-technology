using System.Runtime.InteropServices;
using System.Text;

namespace AMS.API.Interop.ZKFinger;

/// <summary>
/// High-level wrapper for ZKFinger SDK operations
/// Provides managed memory handling and simplified API
/// </summary>
public class ZKFPWrapper : IDisposable
{
    private IntPtr _deviceHandle = IntPtr.Zero;
    private IntPtr _dbHandle = IntPtr.Zero;
    private bool _isInitialized = false;
    private bool _isDisposed = false;
    
    private int _imageWidth = 0;
    private int _imageHeight = 0;
    private int _imageDpi = 0;
    
    private readonly object _syncLock = new();
    
    public const int MAX_TEMPLATE_SIZE = 2048;
    public const int REGISTER_FINGER_COUNT = 3;
    
    public int ImageWidth => _imageWidth;
    public int ImageHeight => _imageHeight;
    public int ImageDpi => _imageDpi;
    public bool IsInitialized => _isInitialized;
    public bool IsDeviceOpen => _deviceHandle != IntPtr.Zero;
    public bool IsDBInitialized => _dbHandle != IntPtr.Zero;

    /// <summary>
    /// Initialize the ZKFinger SDK
    /// </summary>
    public ZKFPResult Initialize()
    {
        lock (_syncLock)
        {
            if (_isInitialized)
                return ZKFPResult.FromSuccess("SDK already initialized");

            var ret = ZKFPInterop.Init();
            if (ret == ZKFPInterop.ZKFP_ERR_OK || ret == ZKFPInterop.ZKFP_ERR_ALREADY_INIT)
            {
                _isInitialized = true;
                return ZKFPResult.FromSuccess("SDK initialized successfully");
            }

            return ZKFPResult.FromError(ret, "Failed to initialize SDK");
        }
    }

    /// <summary>
    /// Terminate the SDK and release resources
    /// </summary>
    public ZKFPResult Terminate()
    {
        lock (_syncLock)
        {
            if (!_isInitialized)
                return ZKFPResult.FromSuccess("SDK not initialized");

            CloseDevice();
            CloseDB();

            var ret = ZKFPInterop.Terminate();
            _isInitialized = false;
            
            return ret == ZKFPInterop.ZKFP_ERR_OK 
                ? ZKFPResult.FromSuccess("SDK terminated") 
                : ZKFPResult.FromError(ret, "Failed to terminate SDK");
        }
    }

    /// <summary>
    /// Get the number of connected fingerprint scanners
    /// </summary>
    public int GetDeviceCount()
    {
        if (!_isInitialized)
            return 0;

        return ZKFPInterop.GetDeviceCount();
    }

    /// <summary>
    /// Open a fingerprint device by index
    /// </summary>
    public ZKFPResult OpenDevice(int index = 0)
    {
        lock (_syncLock)
        {
            if (!_isInitialized)
                return ZKFPResult.FromError(ZKFPInterop.ZKFP_ERR_NOT_INIT, "SDK not initialized");

            if (_deviceHandle != IntPtr.Zero)
                return ZKFPResult.FromSuccess("Device already open");

            _deviceHandle = ZKFPInterop.OpenDevice(index);
            if (_deviceHandle == IntPtr.Zero)
                return ZKFPResult.FromError(ZKFPInterop.ZKFP_ERR_OPEN, "Failed to open device");

            // Get device parameters
            var ret = ZKFPInterop.GetCaptureParamsEx(_deviceHandle, ref _imageWidth, ref _imageHeight, ref _imageDpi);
            if (ret != ZKFPInterop.ZKFP_ERR_OK)
            {
                CloseDevice();
                return ZKFPResult.FromError(ret, "Failed to get device parameters");
            }

            return ZKFPResult.FromSuccess($"Device opened: {_imageWidth}x{_imageHeight} @ {_imageDpi}dpi");
        }
    }

    /// <summary>
    /// Close the open device
    /// </summary>
    public ZKFPResult CloseDevice()
    {
        lock (_syncLock)
        {
            if (_deviceHandle == IntPtr.Zero)
                return ZKFPResult.FromSuccess("No device to close");

            var ret = ZKFPInterop.CloseDevice(_deviceHandle);
            _deviceHandle = IntPtr.Zero;
            _imageWidth = 0;
            _imageHeight = 0;
            _imageDpi = 0;

            return ret == ZKFPInterop.ZKFP_ERR_OK 
                ? ZKFPResult.FromSuccess("Device closed") 
                : ZKFPResult.FromError(ret, "Failed to close device");
        }
    }

    /// <summary>
    /// Initialize the fingerprint database for matching
    /// </summary>
    public ZKFPResult InitializeDB()
    {
        lock (_syncLock)
        {
            if (_dbHandle != IntPtr.Zero)
                return ZKFPResult.FromSuccess("Database already initialized");

            _dbHandle = ZKFPInterop.DBInit();
            if (_dbHandle == IntPtr.Zero)
                return ZKFPResult.FromError(ZKFPInterop.ZKFP_ERR_FAIL, "Failed to initialize database");

            return ZKFPResult.FromSuccess("Database initialized");
        }
    }

    /// <summary>
    /// Close the database
    /// </summary>
    public ZKFPResult CloseDB()
    {
        lock (_syncLock)
        {
            if (_dbHandle == IntPtr.Zero)
                return ZKFPResult.FromSuccess("No database to close");

            var ret = ZKFPInterop.DBFree(_dbHandle);
            _dbHandle = IntPtr.Zero;

            return ret == ZKFPInterop.ZKFP_ERR_OK 
                ? ZKFPResult.FromSuccess("Database closed") 
                : ZKFPResult.FromError(ret, "Failed to close database");
        }
    }

    /// <summary>
    /// Capture fingerprint and extract template
    /// </summary>
    public ZKFPCaptureResult CaptureFingerprint()
    {
        if (_deviceHandle == IntPtr.Zero)
            return new ZKFPCaptureResult { Success = false, ErrorCode = ZKFPInterop.ZKFP_ERR_NOT_OPENED, Message = "Device not opened" };

        int imageSize = _imageWidth * _imageHeight;
        if (imageSize <= 0)
            return new ZKFPCaptureResult { Success = false, ErrorCode = ZKFPInterop.ZKFP_ERR_INVALID_PARAM, Message = "Invalid image dimensions" };

        IntPtr imagePtr = IntPtr.Zero;
        IntPtr templatePtr = IntPtr.Zero;

        try
        {
            imagePtr = Marshal.AllocHGlobal(imageSize);
            templatePtr = Marshal.AllocHGlobal(MAX_TEMPLATE_SIZE);
            int templateSize = MAX_TEMPLATE_SIZE;

            var ret = ZKFPInterop.AcquireFingerprint(_deviceHandle, imagePtr, (uint)imageSize, templatePtr, ref templateSize);
            
            if (ret != ZKFPInterop.ZKFP_ERR_OK)
                return new ZKFPCaptureResult { Success = false, ErrorCode = ret, Message = ZKFPInterop.GetErrorMessage(ret) };

            // Copy template to managed array
            byte[] template = new byte[templateSize];
            Marshal.Copy(templatePtr, template, 0, templateSize);

            // Copy image to managed array
            byte[] image = new byte[imageSize];
            Marshal.Copy(imagePtr, image, 0, imageSize);

            return new ZKFPCaptureResult
            {
                Success = true,
                Template = template,
                Image = image,
                ImageWidth = _imageWidth,
                ImageHeight = _imageHeight,
                Message = "Fingerprint captured successfully"
            };
        }
        finally
        {
            if (imagePtr != IntPtr.Zero) Marshal.FreeHGlobal(imagePtr);
            if (templatePtr != IntPtr.Zero) Marshal.FreeHGlobal(templatePtr);
        }
    }

    /// <summary>
    /// Merge 3 templates into a registration template
    /// </summary>
    public ZKFPMergeResult MergeTemplates(byte[] template1, byte[] template2, byte[] template3)
    {
        if (_dbHandle == IntPtr.Zero)
            return new ZKFPMergeResult { Success = false, ErrorCode = ZKFPInterop.ZKFP_ERR_NOT_INIT, Message = "Database not initialized" };

        IntPtr ptr1 = IntPtr.Zero, ptr2 = IntPtr.Zero, ptr3 = IntPtr.Zero, ptrReg = IntPtr.Zero;

        try
        {
            ptr1 = Marshal.AllocHGlobal(template1.Length);
            ptr2 = Marshal.AllocHGlobal(template2.Length);
            ptr3 = Marshal.AllocHGlobal(template3.Length);
            ptrReg = Marshal.AllocHGlobal(MAX_TEMPLATE_SIZE);

            Marshal.Copy(template1, 0, ptr1, template1.Length);
            Marshal.Copy(template2, 0, ptr2, template2.Length);
            Marshal.Copy(template3, 0, ptr3, template3.Length);

            int regSize = MAX_TEMPLATE_SIZE;
            var ret = ZKFPInterop.DBMerge(_dbHandle, ptr1, ptr2, ptr3, ptrReg, ref regSize);

            if (ret != ZKFPInterop.ZKFP_ERR_OK)
                return new ZKFPMergeResult { Success = false, ErrorCode = ret, Message = ZKFPInterop.GetErrorMessage(ret) };

            byte[] regTemplate = new byte[regSize];
            Marshal.Copy(ptrReg, regTemplate, 0, regSize);

            return new ZKFPMergeResult
            {
                Success = true,
                RegisteredTemplate = regTemplate,
                Message = "Templates merged successfully"
            };
        }
        finally
        {
            if (ptr1 != IntPtr.Zero) Marshal.FreeHGlobal(ptr1);
            if (ptr2 != IntPtr.Zero) Marshal.FreeHGlobal(ptr2);
            if (ptr3 != IntPtr.Zero) Marshal.FreeHGlobal(ptr3);
            if (ptrReg != IntPtr.Zero) Marshal.FreeHGlobal(ptrReg);
        }
    }

    /// <summary>
    /// Add a template to the database cache
    /// </summary>
    public ZKFPResult AddTemplateToCache(uint fingerId, byte[] template)
    {
        if (_dbHandle == IntPtr.Zero)
            return ZKFPResult.FromError(ZKFPInterop.ZKFP_ERR_NOT_INIT, "Database not initialized");

        IntPtr ptr = IntPtr.Zero;
        try
        {
            ptr = Marshal.AllocHGlobal(template.Length);
            Marshal.Copy(template, 0, ptr, template.Length);

            var ret = ZKFPInterop.DBAdd(_dbHandle, fingerId, ptr, (uint)template.Length);
            return ret == ZKFPInterop.ZKFP_ERR_OK 
                ? ZKFPResult.FromSuccess($"Template added with ID {fingerId}") 
                : ZKFPResult.FromError(ret, $"Failed to add template: {ZKFPInterop.GetErrorMessage(ret)}");
        }
        finally
        {
            if (ptr != IntPtr.Zero) Marshal.FreeHGlobal(ptr);
        }
    }

    /// <summary>
    /// Remove a template from the database cache
    /// </summary>
    public ZKFPResult RemoveTemplateFromCache(uint fingerId)
    {
        if (_dbHandle == IntPtr.Zero)
            return ZKFPResult.FromError(ZKFPInterop.ZKFP_ERR_NOT_INIT, "Database not initialized");

        var ret = ZKFPInterop.DBDel(_dbHandle, fingerId);
        return ret == ZKFPInterop.ZKFP_ERR_OK 
            ? ZKFPResult.FromSuccess($"Template {fingerId} removed") 
            : ZKFPResult.FromError(ret, $"Failed to remove template: {ZKFPInterop.GetErrorMessage(ret)}");
    }

    /// <summary>
    /// Clear all templates from cache
    /// </summary>
    public ZKFPResult ClearCache()
    {
        if (_dbHandle == IntPtr.Zero)
            return ZKFPResult.FromError(ZKFPInterop.ZKFP_ERR_NOT_INIT, "Database not initialized");

        var ret = ZKFPInterop.DBClear(_dbHandle);
        return ret == ZKFPInterop.ZKFP_ERR_OK 
            ? ZKFPResult.FromSuccess("Cache cleared") 
            : ZKFPResult.FromError(ret, $"Failed to clear cache: {ZKFPInterop.GetErrorMessage(ret)}");
    }

    /// <summary>
    /// Identify a fingerprint (1:N matching)
    /// </summary>
    public ZKFPIdentifyResult Identify(byte[] template)
    {
        if (_dbHandle == IntPtr.Zero)
            return new ZKFPIdentifyResult { Success = false, ErrorCode = ZKFPInterop.ZKFP_ERR_NOT_INIT, Message = "Database not initialized" };

        IntPtr ptr = IntPtr.Zero;
        try
        {
            ptr = Marshal.AllocHGlobal(template.Length);
            Marshal.Copy(template, 0, ptr, template.Length);

            uint fid = 0;
            int score = 0;
            var ret = ZKFPInterop.DBIdentify(_dbHandle, ptr, (uint)template.Length, ref fid, ref score);

            if (ret == ZKFPInterop.ZKFP_ERR_OK)
            {
                return new ZKFPIdentifyResult
                {
                    Success = true,
                    Matched = true,
                    FingerId = fid,
                    Score = score,
                    Message = "Fingerprint identified"
                };
            }

            return new ZKFPIdentifyResult
            {
                Success = true,
                Matched = false,
                Message = "No matching fingerprint found"
            };
        }
        finally
        {
            if (ptr != IntPtr.Zero) Marshal.FreeHGlobal(ptr);
        }
    }

    /// <summary>
    /// Match two templates (1:1 verification)
    /// </summary>
    public ZKFPMatchResult Match(byte[] template1, byte[] template2)
    {
        if (_dbHandle == IntPtr.Zero)
            return new ZKFPMatchResult { Success = false, ErrorCode = ZKFPInterop.ZKFP_ERR_NOT_INIT, Message = "Database not initialized" };

        IntPtr ptr1 = IntPtr.Zero, ptr2 = IntPtr.Zero;
        try
        {
            ptr1 = Marshal.AllocHGlobal(template1.Length);
            ptr2 = Marshal.AllocHGlobal(template2.Length);
            Marshal.Copy(template1, 0, ptr1, template1.Length);
            Marshal.Copy(template2, 0, ptr2, template2.Length);

            var score = ZKFPInterop.DBMatch(_dbHandle, ptr1, (uint)template1.Length, ptr2, (uint)template2.Length);

            return new ZKFPMatchResult
            {
                Success = true,
                Score = score,
                Matched = score > 0,
                Message = score > 0 ? "Templates matched" : "Templates do not match"
            };
        }
        finally
        {
            if (ptr1 != IntPtr.Zero) Marshal.FreeHGlobal(ptr1);
            if (ptr2 != IntPtr.Zero) Marshal.FreeHGlobal(ptr2);
        }
    }

    /// <summary>
    /// Convert template bytes to Base64 string
    /// </summary>
    public static string TemplateToBase64(byte[] template)
    {
        return Convert.ToBase64String(template);
    }

    /// <summary>
    /// Convert Base64 string to template bytes
    /// </summary>
    public static byte[] Base64ToTemplate(string base64)
    {
        return Convert.FromBase64String(base64);
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_isDisposed)
        {
            if (disposing)
            {
                Terminate();
            }
            _isDisposed = true;
        }
    }

    ~ZKFPWrapper()
    {
        Dispose(false);
    }
}

// ============================================
// Result Types
// ============================================

public class ZKFPResult
{
    public bool Success { get; set; }
    public int ErrorCode { get; set; }
    public string Message { get; set; } = string.Empty;

    public static ZKFPResult Ok() => new() { Success = true };
    public static ZKFPResult FromSuccess(string message) => new() { Success = true, Message = message };
    public static ZKFPResult FromError(int code, string message) => new() { Success = false, ErrorCode = code, Message = $"{message}: {ZKFPInterop.GetErrorMessage(code)}" };
}

public class ZKFPCaptureResult : ZKFPResult
{
    public byte[]? Template { get; set; }
    public byte[]? Image { get; set; }
    public int ImageWidth { get; set; }
    public int ImageHeight { get; set; }
}

public class ZKFPMergeResult : ZKFPResult
{
    public byte[]? RegisteredTemplate { get; set; }
}

public class ZKFPIdentifyResult : ZKFPResult
{
    public bool Matched { get; set; }
    public uint FingerId { get; set; }
    public int Score { get; set; }
}

public class ZKFPMatchResult : ZKFPResult
{
    public bool Matched { get; set; }
    public int Score { get; set; }
}
