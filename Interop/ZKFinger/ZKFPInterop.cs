using System.Runtime.InteropServices;
using System.Text;

namespace AMS.API.Interop.ZKFinger;

/// <summary>
/// P/Invoke declarations for libzkfp.dll (ZKTeco Fingerprint SDK)
/// Compatible with ZK Live20R and similar devices
/// </summary>
public static class ZKFPInterop
{
    private const string DllName = "libzkfp";

    // ============================================
    // Error Codes
    // ============================================
    public const int ZKFP_ERR_OK = 0;
    public const int ZKFP_ERR_ALREADY_INIT = 1;
    public const int ZKFP_ERR_INITLIB = -1;
    public const int ZKFP_ERR_INIT = -2;
    public const int ZKFP_ERR_NO_DEVICE = -3;
    public const int ZKFP_ERR_NOT_SUPPORT = -4;
    public const int ZKFP_ERR_INVALID_PARAM = -5;
    public const int ZKFP_ERR_OPEN = -6;
    public const int ZKFP_ERR_INVALID_HANDLE = -7;
    public const int ZKFP_ERR_CAPTURE = -8;
    public const int ZKFP_ERR_EXTRACT_FP = -9;
    public const int ZKFP_ERR_ABSORT = -10;
    public const int ZKFP_ERR_MEMORY_NOT_ENOUGH = -11;
    public const int ZKFP_ERR_BUSY = -12;
    public const int ZKFP_ERR_ADD_FINGER = -13;
    public const int ZKFP_ERR_DEL_FINGER = -14;
    public const int ZKFP_ERR_FAIL = -17;
    public const int ZKFP_ERR_CANCEL = -18;
    public const int ZKFP_ERR_VERIFY_FP = -20;
    public const int ZKFP_ERR_MERGE = -22;
    public const int ZKFP_ERR_NOT_OPENED = -23;
    public const int ZKFP_ERR_NOT_INIT = -24;
    public const int ZKFP_ERR_ALREADY_OPENED = -25;

    // ============================================
    // Parameter Codes
    // ============================================
    public const int CYCBP_PARAM_CODE_IMAGE_WIDTH = 1;
    public const int CYCBP_PARAM_CODE_IMAGE_HEIGHT = 2;
    public const int CYCBP_PARAM_CODE_IMAGE_DPI = 3;

    // ============================================
    // SDK Initialization
    // ============================================

    /// <summary>
    /// Initialize the fingerprint SDK
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_Init", CallingConvention = CallingConvention.StdCall)]
    public static extern int Init();

    /// <summary>
    /// Terminate the fingerprint SDK
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_Terminate", CallingConvention = CallingConvention.StdCall)]
    public static extern int Terminate();

    // ============================================
    // Device Operations
    // ============================================

    /// <summary>
    /// Get the number of connected fingerprint devices
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_GetDeviceCount", CallingConvention = CallingConvention.StdCall)]
    public static extern int GetDeviceCount();

    /// <summary>
    /// Open a fingerprint device by index
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_OpenDevice", CallingConvention = CallingConvention.StdCall)]
    public static extern IntPtr OpenDevice(int index);

    /// <summary>
    /// Close a fingerprint device
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_CloseDevice", CallingConvention = CallingConvention.StdCall)]
    public static extern int CloseDevice(IntPtr handle);

    /// <summary>
    /// Get device parameters (width, height, DPI)
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_GetParameters", CallingConvention = CallingConvention.StdCall)]
    public static extern int GetParameters(IntPtr handle, int paramCode, IntPtr paramValue, ref int cbParamValue);

    /// <summary>
    /// Set device parameters
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_SetParameters", CallingConvention = CallingConvention.StdCall)]
    public static extern int SetParameters(IntPtr handle, int paramCode, IntPtr paramValue, int cbParamValue);

    /// <summary>
    /// Get capture parameters (extended)
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_GetCaptureParamsEx", CallingConvention = CallingConvention.StdCall)]
    public static extern int GetCaptureParamsEx(IntPtr handle, ref int width, ref int height, ref int dpi);

    // ============================================
    // Fingerprint Capture
    // ============================================

    /// <summary>
    /// Acquire fingerprint image and template
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_AcquireFingerprint", CallingConvention = CallingConvention.StdCall)]
    public static extern int AcquireFingerprint(IntPtr handle, IntPtr fpImage, uint cbFPImage, IntPtr fpTemplate, ref int cbTemplate);

    /// <summary>
    /// Acquire fingerprint image only
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_AcquireFingerprintImage", CallingConvention = CallingConvention.StdCall)]
    public static extern int AcquireFingerprintImage(IntPtr handle, IntPtr fpImage, uint cbFPImage);

    // ============================================
    // Database Cache Operations
    // ============================================

    /// <summary>
    /// Create a database cache for fingerprint matching
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_CreateDBCache", CallingConvention = CallingConvention.StdCall)]
    public static extern IntPtr DBInit();

    /// <summary>
    /// Close the database cache
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_CloseDBCache", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBFree(IntPtr hDBCache);

    /// <summary>
    /// Clear all templates from database cache
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_ClearDBCache", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBClear(IntPtr hDBCache);

    /// <summary>
    /// Get template count in database cache
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_GetDBCacheCount", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBCount(IntPtr hDBCache, IntPtr count);

    // ============================================
    // Template Operations
    // ============================================

    /// <summary>
    /// Merge 3 fingerprint templates into a registration template
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_GenRegTemplate", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBMerge(IntPtr hDBCache, IntPtr temp1, IntPtr temp2, IntPtr temp3, IntPtr regTemp, ref int cbRegTemp);

    /// <summary>
    /// Add a registration template to database cache
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_AddRegTemplateToDBCache", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBAdd(IntPtr hDBCache, uint fid, IntPtr fpTemplate, uint cbTemplate);

    /// <summary>
    /// Delete a template from database cache
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_DelRegTemplateFromDBCache", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBDel(IntPtr hDBCache, uint fid);

    // ============================================
    // Matching Operations
    // ============================================

    /// <summary>
    /// 1:N Identification - Find matching template in database
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_Identify", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBIdentify(IntPtr hDBCache, IntPtr fpTemplate, uint cbTemplate, ref uint fid, ref int score);

    /// <summary>
    /// 1:1 Verification by FID
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_VerifyByID", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBVerifyByID(IntPtr hDBCache, uint fid, IntPtr fpTemplate, uint cbTemplate);

    /// <summary>
    /// 1:1 Template matching
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_MatchFinger", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBMatch(IntPtr hDBCache, IntPtr fpTemplate1, uint cbTemplate1, IntPtr fpTemplate2, uint cbTemplate2);

    // ============================================
    // Utility Operations
    // ============================================

    /// <summary>
    /// Convert Base64 string to binary blob
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_Base64ToBlob", CallingConvention = CallingConvention.StdCall, CharSet = CharSet.Ansi)]
    public static extern int Base64ToBlob(string src, IntPtr blob, uint cbBlob);

    /// <summary>
    /// Convert binary blob to Base64 string
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_BlobToBase64", CallingConvention = CallingConvention.StdCall, CharSet = CharSet.Ansi)]
    public static extern int BlobToBase64(IntPtr src, uint cbSrc, StringBuilder dst, uint cbDst);

    /// <summary>
    /// Set database parameter
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_DBSetParameter", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBSetParameter(IntPtr handle, int paramCode, int paramValue);

    /// <summary>
    /// Get database parameter
    /// </summary>
    [DllImport(DllName, EntryPoint = "ZKFPM_DBGetParameter", CallingConvention = CallingConvention.StdCall)]
    public static extern int DBGetParameter(IntPtr handle, int paramCode, ref int paramValue);

    // ============================================
    // Error Message Helper
    // ============================================
    public static string GetErrorMessage(int errorCode)
    {
        return errorCode switch
        {
            ZKFP_ERR_OK => "Success",
            ZKFP_ERR_ALREADY_INIT => "SDK already initialized",
            ZKFP_ERR_INITLIB => "Failed to initialize library",
            ZKFP_ERR_INIT => "Initialization error",
            ZKFP_ERR_NO_DEVICE => "No device connected",
            ZKFP_ERR_NOT_SUPPORT => "Operation not supported",
            ZKFP_ERR_INVALID_PARAM => "Invalid parameter",
            ZKFP_ERR_OPEN => "Failed to open device",
            ZKFP_ERR_INVALID_HANDLE => "Invalid handle",
            ZKFP_ERR_CAPTURE => "Capture failed",
            ZKFP_ERR_EXTRACT_FP => "Failed to extract fingerprint template",
            ZKFP_ERR_ABSORT => "Operation aborted",
            ZKFP_ERR_MEMORY_NOT_ENOUGH => "Not enough memory",
            ZKFP_ERR_BUSY => "Device busy",
            ZKFP_ERR_ADD_FINGER => "Failed to add fingerprint",
            ZKFP_ERR_DEL_FINGER => "Failed to delete fingerprint",
            ZKFP_ERR_FAIL => "General failure",
            ZKFP_ERR_CANCEL => "Operation cancelled",
            ZKFP_ERR_VERIFY_FP => "Fingerprint verification failed",
            ZKFP_ERR_MERGE => "Failed to merge templates",
            ZKFP_ERR_NOT_OPENED => "Device not opened",
            ZKFP_ERR_NOT_INIT => "SDK not initialized",
            ZKFP_ERR_ALREADY_OPENED => "Device already opened",
            _ => $"Unknown error ({errorCode})"
        };
    }
}
