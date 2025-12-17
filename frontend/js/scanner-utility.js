// Scanner Utility Controller
// Manages health checks, scanner initialization, and fingerprint testing

let scannerInitialized = false;
let healthCheckInterval = null;
let autoCapture = false;
let autoCaptureInterval = null;

// Initialize health checks when page loads
document.addEventListener('DOMContentLoaded', function() {
    addLog('Scanner Utility loaded', 'info');
    startHealthCheck();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey) {
            if (e.key === 'i') initializeScanner();
            if (e.key === 's') testScan();
            if (e.key === 'v') verifyFingerprint();
            if (e.key === 'd') disconnectScanner();
        }
    });
});

// Start periodic health checks
function startHealthCheck() {
    checkAPIStatus();
    checkDatabaseStatus();
    checkScannerStatus();
    
    healthCheckInterval = setInterval(() => {
        checkAPIStatus();
        checkDatabaseStatus();
        checkScannerStatus();
    }, 5000); // Check every 5 seconds
}

// Check API Service Health
async function checkAPIStatus() {
    try {
        const startTime = performance.now();
        const response = await fetch(`${API_BASE_URL}/scanner/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(0);
        
        const isOnline = response.ok;
        const statusCode = response.status;
        
        updateStatusCard('apiCard', 'apiStatus', isOnline);
        document.getElementById('apiStatusCode').textContent = statusCode;
        document.getElementById('apiResponseTime').textContent = responseTime + 'ms';
        
        if (isOnline) {
            addLog('✓ API Service is online', 'success');
        }
    } catch (error) {
        updateStatusCard('apiCard', 'apiStatus', false);
        document.getElementById('apiStatusCode').textContent = 'Error';
        document.getElementById('apiResponseTime').textContent = '--';
        addLog('✗ API Service is offline: ' + error.message, 'error');
    }
}

// Check Database Connection
async function checkDatabaseStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const isOnline = response.ok || response.status === 401; // 401 is OK for auth check
        
        if (isOnline) {
            updateStatusCard('dbCard', 'dbStatus', true);
            document.getElementById('dbConnection').textContent = 'Connected';
            
            // Try to get user count
            try {
                const data = await response.json();
                if (Array.isArray(data)) {
                    document.getElementById('dbRecords').textContent = data.length + ' users';
                }
            } catch (e) {
                // JSON parse error is OK
            }
            
            addLog('✓ Database is online', 'success');
        } else {
            throw new Error('Database unreachable');
        }
    } catch (error) {
        updateStatusCard('dbCard', 'dbStatus', false);
        document.getElementById('dbConnection').textContent = 'Disconnected';
        document.getElementById('dbRecords').textContent = '0 users';
        addLog('✗ Database is offline: ' + error.message, 'error');
    }
}

// Check Scanner Device Status
async function checkScannerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/scanner/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Check if SDK is initialized and devices are available
            const sdkReady = data.sdk && data.sdk.initialized;
            const deviceCount = data.devices ? data.devices.count : 0;
            const deviceConnected = data.devices && data.devices.connected;
            const deviceInfo = data.devices ? data.devices.info : null;
            
            // Update scanner status card
            const isOnline = sdkReady && deviceCount > 0;
            updateStatusCard('scannerCard', 'scannerStatus', isOnline);
            
            // Update device count
            document.getElementById('devicesFound').textContent = deviceCount > 0 ? `${deviceCount} device(s)` : 'undefined device(s)';
            
            // Update device info if connected
            if (deviceInfo) {
                document.getElementById('scannerModel').textContent = deviceInfo.model || 'ZK Live20R';
                document.getElementById('scannerResolution').textContent = 
                    deviceInfo.width && deviceInfo.height ? `${deviceInfo.width}x${deviceInfo.height}` : '--';
                document.getElementById('scannerDpi').textContent = 
                    deviceInfo.dpi > 0 ? deviceInfo.dpi.toString() : '--';
            } else {
                document.getElementById('scannerModel').textContent = 'ZK Live20R';
                document.getElementById('scannerResolution').textContent = '--';
                document.getElementById('scannerDpi').textContent = '--';
            }
            
            // Enable/disable buttons based on status
            if (sdkReady && deviceConnected) {
                document.getElementById('btnInit').disabled = true;
                document.getElementById('btnScan').disabled = false;
                document.getElementById('btnVerify').disabled = false;
                document.getElementById('btnDisconnect').disabled = false;
                scannerInitialized = true;
                if (deviceInfo) {
                    addLog(`✓ Scanner ready: ${deviceInfo.model} (${deviceInfo.width}x${deviceInfo.height})`, 'success');
                }
            } else if (sdkReady) {
                document.getElementById('btnInit').disabled = true;
                document.getElementById('btnScan').disabled = true;
                document.getElementById('btnVerify').disabled = true;
                document.getElementById('btnDisconnect').disabled = true;
                addLog('✓ SDK initialized, but no device connected', 'info');
            } else {
                document.getElementById('btnInit').disabled = false;
                document.getElementById('btnScan').disabled = true;
                document.getElementById('btnVerify').disabled = true;
                document.getElementById('btnDisconnect').disabled = true;
            }
        } else {
            updateStatusCard('scannerCard', 'scannerStatus', false);
            document.getElementById('devicesFound').textContent = 'undefined device(s)';
            document.getElementById('scannerResolution').textContent = '--';
            document.getElementById('scannerDpi').textContent = '--';
        }
    } catch (error) {
        updateStatusCard('scannerCard', 'scannerStatus', false);
        document.getElementById('devicesFound').textContent = 'undefined device(s)';
        document.getElementById('scannerResolution').textContent = '--';
        document.getElementById('scannerDpi').textContent = '--';
        addLog('✗ Scanner check failed: ' + error.message, 'error');
    }
}

// Update status card UI
function updateStatusCard(cardId, statusId, isOnline) {
    const card = document.getElementById(cardId);
    const statusEl = document.getElementById(statusId);
    
    if (isOnline) {
        card.classList.remove('offline');
        card.classList.add('online');
        statusEl.classList.remove('offline');
        statusEl.classList.add('online');
        statusEl.innerHTML = '<span class="status-dot online"></span><span>Online</span>';
    } else {
        card.classList.remove('online');
        card.classList.add('offline');
        statusEl.classList.remove('online');
        statusEl.classList.add('offline');
        statusEl.innerHTML = '<span class="status-dot offline"></span><span>Offline</span>';
    }
}

// Initialize Scanner
async function initializeScanner() {
    addLog('Initializing scanner...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/scanner/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            scannerInitialized = true;
            document.getElementById('btnInit').disabled = true;
            document.getElementById('btnScan').disabled = false;
            document.getElementById('btnVerify').disabled = false;
            document.getElementById('btnDisconnect').disabled = false;
            
            addLog(`✓ Scanner initialized successfully - ${data.message}`, 'success');
            Swal.fire('Success', data.message, 'success');
        } else {
            addLog(`✗ Scanner initialization failed: ${data.message}`, 'error');
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        addLog(`✗ Initialization error: ${error.message}`, 'error');
        Swal.fire('Error', 'Failed to initialize scanner: ' + error.message, 'error');
    }
}

// Test Scan Fingerprint
async function testScan() {
    if (!scannerInitialized) {
        Swal.fire('Warning', 'Scanner is not initialized', 'warning');
        return;
    }
    
    // Toggle auto-capture mode
    if (!autoCapture) {
        startAutoCapture();
    } else {
        stopAutoCapture();
    }
}

// Start Auto-Capture Mode
function startAutoCapture() {
    autoCapture = true;
    document.getElementById('btnScan').textContent = '⏹️ Stop Auto-Scan';
    document.getElementById('btnScan').classList.add('active');
    addLog('🔄 Auto-capture mode enabled - Place finger on scanner...', 'info');
    
    // Start continuous capture loop
    autoCaptureLoop();
}

// Stop Auto-Capture Mode
function stopAutoCapture() {
    autoCapture = false;
    if (autoCaptureInterval) {
        clearTimeout(autoCaptureInterval);
        autoCaptureInterval = null;
    }
    document.getElementById('btnScan').textContent = '👆 Test Scan';
    document.getElementById('btnScan').classList.remove('active');
    addLog('⏸️ Auto-capture mode disabled', 'info');
}

// Auto-Capture Loop
async function autoCaptureLoop() {
    if (!autoCapture) return;
    
    try {
        // Attempt to capture fingerprint
        const captureResponse = await fetch(`${API_BASE_URL}/scanner/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const captureData = await captureResponse.json();
        
        if (captureResponse.ok && captureData.success && captureData.template) {
            // Fingerprint captured! Now identify the user
            addLog('👆 Fingerprint detected - Identifying...', 'info');
            
            const verifyResponse = await fetch(`${API_BASE_URL}/fingerprint/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fingerprintTemplate: captureData.template })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.matched && verifyData.userId) {
                // User identified!
                addLog(`✅ USER IDENTIFIED: ${verifyData.username} (ID: ${verifyData.userId}) - Score: ${verifyData.score}`, 'success');
                Swal.fire({
                    icon: 'success',
                    title: 'User Identified!',
                    html: `<strong>${verifyData.username}</strong><br>Position: ${verifyData.position || 'N/A'}<br>Match Score: ${verifyData.score}`,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                // Unknown fingerprint
                addLog('❌ Unknown fingerprint - Not registered in system', 'error');
                Swal.fire({
                    icon: 'warning',
                    title: 'Unknown User',
                    text: 'Fingerprint not recognized',
                    timer: 2000,
                    timerProgressBar: true
                });
            }
            
            // Wait before next capture
            autoCaptureInterval = setTimeout(() => autoCaptureLoop(), 2000);
        } else {
            // No finger detected or capture failed - retry quickly
            autoCaptureInterval = setTimeout(() => autoCaptureLoop(), 500);
        }
    } catch (error) {
        addLog(`⚠️ Auto-capture error: ${error.message}`, 'error');
        // Continue trying
        autoCaptureInterval = setTimeout(() => autoCaptureLoop(), 1000);
    }
}

// Verify Fingerprint
async function verifyFingerprint() {
    if (!scannerInitialized) {
        Swal.fire('Warning', 'Scanner is not initialized', 'warning');
        return;
    }
    
    const { value: userId } = await Swal.fire({
        title: 'Verify Fingerprint',
        input: 'number',
        inputLabel: 'Enter User ID',
        inputPlaceholder: 'User ID',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) return 'User ID is required';
        }
    });
    
    if (!userId) return;
    
    addLog(`Starting fingerprint verification for user ${userId}...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/scanner/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId) })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            addLog(`✓ Fingerprint verified - Match score: ${data.matchScore}%`, 'success');
            Swal.fire('Success', `Fingerprint verified!\nMatch Score: ${data.matchScore}%`, 'success');
        } else {
            addLog(`✗ Verification failed: ${data.message}`, 'error');
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        addLog(`✗ Verification error: ${error.message}`, 'error');
        Swal.fire('Error', 'Failed to verify fingerprint: ' + error.message, 'error');
    }
}

// Disconnect Scanner
async function disconnectScanner() {
    // Stop auto-capture if running
    if (autoCapture) {
        stopAutoCapture();
    }
    
    addLog('Disconnecting scanner...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/scanner/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            scannerInitialized = false;
            document.getElementById('btnInit').disabled = false;
            document.getElementById('btnScan').disabled = true;
            document.getElementById('btnVerify').disabled = true;
            document.getElementById('btnDisconnect').disabled = true;
            
            addLog('✓ Scanner disconnected', 'success');
            Swal.fire('Success', 'Scanner disconnected', 'success');
        } else {
            addLog(`✗ Disconnect failed: ${data.message}`, 'error');
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        addLog(`✗ Disconnect error: ${error.message}`, 'error');
        Swal.fire('Error', 'Failed to disconnect scanner: ' + error.message, 'error');
    }
}

// Add log entry
function addLog(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    logEntry.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-${type}">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 100 entries
    while (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

    if (autoCapture) {
        stopAutoCapture();
    }
// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
});
