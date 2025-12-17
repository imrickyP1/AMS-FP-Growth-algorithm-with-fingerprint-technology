// ===============================================
// TIME LOG 2 - Auto-Scan Fingerprint Attendance
// ===============================================
// Copied mechanism from scanner-utility.js for instant detection

const API_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5002/api';
console.log('🔗 Timelog2 API Base:', API_BASE);

// State
let autoCapture = false;
let autoCaptureInterval = null;
let scannerConnected = false;
let todayLogs = [];
let attendanceMode = 'IN'; // Default to IN

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const connectionLabel = document.getElementById('connectionLabel');
const currentDate = document.getElementById('currentDate');
const currentTime = document.getElementById('currentTime');
const sessionBadge = document.getElementById('sessionBadge');
const btnAutoScan = document.getElementById('btnAutoScan');
const btnText = document.getElementById('btnText');
const btnTimeIn = document.getElementById('btnTimeIn');
const btnTimeOut = document.getElementById('btnTimeOut');
const scannerStatus = document.getElementById('scannerStatus');
const scannerText = document.getElementById('scannerText');
const scannerHint = document.getElementById('scannerHint');
const logsList = document.getElementById('logsList');

// ===============================================
// Initialize
// ===============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 TIMELOG 2 LOADED - Ready for auto-scan');
  console.log('📡 API Base URL:', API_BASE);
  
  try {
    // Start clock
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Check scanner connection
    await checkScannerConnection();
    
    // Load today's logs
    await loadTodayLogs();
    
    // Attach button listener
    if (btnAutoScan) {
      btnAutoScan.addEventListener('click', toggleAutoScan);
      console.log('✅ Auto-scan button listener attached');
    } else {
      console.error('❌ btnAutoScan element not found');
    }
    
    // Attach IN/OUT toggle listeners
    if (btnTimeIn && btnTimeOut) {
      btnTimeIn.addEventListener('click', () => selectMode('IN'));
      btnTimeOut.addEventListener('click', () => selectMode('OUT'));
      console.log('✅ IN/OUT toggle listeners attached');
    } else {
      console.error('❌ IN/OUT toggle buttons not found');
    }
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
});

// ===============================================
// Update Date/Time
// ===============================================
function updateDateTime() {
  try {
    const now = new Date();
    
    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (currentDate) {
      currentDate.textContent = now.toLocaleDateString('en-US', options);
    }
    
    // Time
    if (currentTime) {
      currentTime.textContent = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    // Session
    const hour = now.getHours();
    if (sessionBadge) {
      if (hour < 12) {
        sessionBadge.textContent = 'AM SESSION';
        sessionBadge.className = 'session-badge am';
      } else {
        sessionBadge.textContent = 'PM SESSION';
        sessionBadge.className = 'session-badge pm';
      }
    }
  } catch (error) {
    console.error('❌ Error updating date/time:', error);
  }
}

// ===============================================
// Select IN/OUT Mode
// ===============================================
function selectMode(mode) {
  attendanceMode = mode;
  console.log(`📍 Attendance mode set to: ${mode}`);
  
  if (mode === 'IN') {
    btnTimeIn.classList.add('active');
    btnTimeOut.classList.remove('active');
  } else {
    btnTimeOut.classList.add('active');
    btnTimeIn.classList.remove('active');
  }
}

// ===============================================
// Check Scanner Connection
// ===============================================
async function checkScannerConnection() {
  try {
    const response = await fetch(`${API_BASE}/scanner/status`);
    const data = await response.json();
    
    if (data.sdk?.initialized && data.devices?.connected) {
      scannerConnected = true;
      connectionStatus.className = 'connection-status online';
      connectionLabel.textContent = 'Scanner Ready';
      console.log('✅ Scanner connected and ready');
    } else {
      scannerConnected = false;
      connectionStatus.className = 'connection-status offline';
      connectionLabel.textContent = 'Scanner Not Found';
      console.log('⚠️ Scanner not connected');
    }
  } catch (error) {
    scannerConnected = false;
    connectionStatus.className = 'connection-status offline';
    connectionLabel.textContent = 'Service Offline';
    console.error('Scanner check error:', error);
  }
  
  // Retry every 30 seconds
  setTimeout(checkScannerConnection, 30000);
}

// ===============================================
// Toggle Auto-Scan
// ===============================================
function toggleAutoScan() {
  console.log('🔘 Toggle Auto-Scan clicked');
  
  if (!scannerConnected) {
    Swal.fire('Warning', 'Scanner is not connected. Please check scanner connection.', 'warning');
    return;
  }
  
  if (!autoCapture) {
    // Start scanning
    console.log('▶️ Starting auto-scan mode');
    startAutoCapture();
  } else {
    // Stop scanning
    console.log('⏹️ Stopping auto-scan mode');
    stopAutoCapture();
  }
}

// ===============================================
// Start Auto-Capture
// ===============================================
function startAutoCapture() {
  autoCapture = true;
  
  // Update UI
  scannerStatus.className = 'scanner-status scanning';
  scannerText.textContent = '👆 Ready to scan - Place your finger now';
  scannerHint.textContent = 'Scanner is actively waiting for fingerprint';
  
  // Update button to show "Stop"
  btnAutoScan.classList.add('active');
  btnText.innerHTML = '<i class="fas fa-stop"></i> Stop';
  
  // Show scanning dialog
  showScanningDialog();
  
  // Start capture loop
  autoCaptureLoop();
}

// ===============================================
// Stop Auto-Capture
// ===============================================
function stopAutoCapture() {
  autoCapture = false;
  
  if (autoCaptureInterval) {
    clearTimeout(autoCaptureInterval);
    autoCaptureInterval = null;
  }
  
  // Close dialog
  Swal.close();
  
  // Reset UI
  scannerStatus.className = 'scanner-status';
  scannerText.textContent = 'Auto-scan stopped';
  scannerHint.textContent = 'Click "Start" to resume';
  
  // Update button to show "Start"
  btnAutoScan.classList.remove('active');
  btnText.innerHTML = '<i class="fas fa-play"></i> Start';
}

// ===============================================
// Show Scanning Dialog
// ===============================================
function showScanningDialog() {
  Swal.fire({
    title: '🔍 Waiting for Fingerprint',
    html: `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 80px; animation: pulse 1.5s ease-in-out infinite;">
          👆
        </div>
        <p style="margin-top: 20px; font-size: 16px; color: #666;">
          Place your finger on the scanner
        </p>
        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 8px;">
          <p style="margin: 0; color: #856404; font-weight: 500;">
            <span id="scanStatusText">Waiting for fingerprint...</span>
          </p>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      </style>
    `,
    position: 'center',
    customClass: {
      popup: 'swal-lower-position'
    },
    showCancelButton: true,
    cancelButtonText: '✕ Stop Scanning',
    cancelButtonColor: '#d33',
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: true,
    backdrop: true,
    didOpen: () => {
      // Add custom CSS for lower position
      const style = document.createElement('style');
      style.textContent = `
        .swal-lower-position {
          margin-top: 100px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason.esc) {
      stopAutoCapture();
    }
  });
}

// ===============================================
// Update Scanning Dialog
// ===============================================
function updateScanningDialog(message, type = 'info') {
  const statusText = document.getElementById('scanStatusText');
  if (!statusText) {
    console.warn('⚠️ scanStatusText element not found');
    return;
  }
  
  statusText.textContent = message;
  const parent = statusText.parentElement;
  
  if (!parent) {
    console.warn('⚠️ parent element not found');
    return;
  }
  
  const p = parent.querySelector('p');
  if (!p) {
    console.warn('⚠️ p element not found');
    return;
  }
  
  if (type === 'success') {
    parent.style.background = '#d4edda';
    p.style.color = '#155724';
  } else if (type === 'processing') {
    parent.style.background = '#d1ecf1';
    p.style.color = '#0c5460';
  } else if (type === 'error') {
    parent.style.background = '#f8d7da';
    p.style.color = '#721c24';
  }
  
  // Update title icon
  const swalTitle = document.querySelector('.swal2-title');
  if (swalTitle && type === 'processing') {
    swalTitle.innerHTML = '🔄 Processing...';
  }
}

// ===============================================
// Auto-Capture Loop (COPIED FROM SCANNER-UTILITY)
// ===============================================
async function autoCaptureLoop() {
  if (!autoCapture) return;
  
  try {
    // Attempt to capture fingerprint
    const captureResponse = await fetch(`${API_BASE}/scanner/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const captureData = await captureResponse.json();
    
    if (captureResponse.ok && captureData.success && captureData.template) {
      // Fingerprint captured!
      console.log('👆 Fingerprint detected - Processing...');
      
      // Wait a bit for dialog to render
      await new Promise(resolve => setTimeout(resolve, 100));
      updateScanningDialog('👆 Fingerprint detected! Verifying...', 'processing');
      
      try {
        // Call attendance endpoint (does identify + record in one call)
        console.log('🔄 Calling /attendance/fingerprint...');
        console.log('📍 Mode:', attendanceMode);
        const response = await fetch(`${API_BASE}/attendance/fingerprint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fingerprintTemplate: captureData.template,
            mode: attendanceMode // Pass IN or OUT
          })
        });
        
        console.log('📥 Response status:', response.status, response.statusText);
        const data = await response.json();
        console.log('📡 API Response:', data);
        
        if (!response.ok) {
          console.error('❌ Response not OK:', response.status);
          throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        if (data.success) {
          // Success!
          console.log(`✅ SUCCESS: ${data.attendanceType} at ${data.time}`);
          console.log('👤 User:', data.user);
          updateScanningDialog(`✅ ${data.attendanceType} recorded!`, 'success');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Attendance Recorded!',
            html: `<strong>${data.user.username}</strong><br>${data.attendanceType}<br>${data.time}`,
            timer: 3000,
            timerProgressBar: true
          });
          
          // Reload logs
          await loadTodayLogs();
        } else {
          // API returned success:false
          console.log('❌ API returned failure:', data.message);
          throw new Error(data.message || 'Failed to record attendance');
        }
      } catch (error) {
        console.error('❌ ERROR:', error);
        updateScanningDialog(`❌ Error: ${error.message}`, 'error');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message,
          timer: 3000
        });
      }
      
      // Continue scanning
      autoCaptureInterval = setTimeout(() => {
        showScanningDialog();
        autoCaptureLoop();
      }, 2000);
    } else {
      // No finger detected or capture failed - retry quickly
      autoCaptureInterval = setTimeout(() => autoCaptureLoop(), 500);
    }
  } catch (error) {
    console.error(`⚠️ Auto-capture error: ${error.message}`);
    // Continue trying
    autoCaptureInterval = setTimeout(() => autoCaptureLoop(), 1000);
  }
}

// ===============================================
// Load Today's Logs
// ===============================================
async function loadTodayLogs() {
  try {
    const response = await fetch(`${API_BASE}/attendance/today`);
    
    if (response.ok) {
      const data = await response.json();
      todayLogs = data.logs || [];
      displayLogs(todayLogs);
      console.log(`📋 Loaded ${todayLogs.length} logs for today`);
    }
  } catch (error) {
    console.error('Load logs error:', error);
  }
}

// ===============================================
// Display Logs
// ===============================================
function displayLogs(logs) {
  if (!logs || logs.length === 0) {
    logsList.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 20px;">No records yet today</p>';
    return;
  }
  
  logsList.innerHTML = logs.map(log => `
    <div class="log-item ${log.attendanceType?.includes('In') ? 'time-in' : 'time-out'}">
      <div>
        <div class="log-name">${log.username || 'User ' + log.userId}</div>
        <div class="log-time">${log.attendanceType || log.type}</div>
      </div>
      <div class="log-time">${log.time || new Date(log.timestamp).toLocaleTimeString('en-US')}</div>
    </div>
  `).join('');
}
