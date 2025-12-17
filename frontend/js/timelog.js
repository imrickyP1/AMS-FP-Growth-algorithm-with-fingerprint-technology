// ===============================================
// 🕐 TIME LOG - Fingerprint Attendance System
// ===============================================
// Default login method using fingerprint scanner
// Auto-detects AM/PM session for Time In/Out

// API_BASE_URL is loaded from api-config.js
const API_BASE = API_BASE_URL;

// DOM Elements
const connectionIndicator = document.getElementById("connectionIndicator");
const connectionLabel = document.getElementById("connectionLabel");
const currentDate = document.getElementById("currentDate");
const currentTime = document.getElementById("currentTime");
const sessionBadge = document.getElementById("sessionBadge");
const fingerprintScanner = document.getElementById("fingerprintScanner");
const scannerIcon = document.getElementById("scannerIcon");
const scannerText = document.getElementById("scannerText");
const scannerHint = document.getElementById("scannerHint");
const actionInfo = document.getElementById("actionInfo");
const nextAction = document.getElementById("nextAction");
const actionHint = document.getElementById("actionHint");
const resultPanel = document.getElementById("resultPanel");
const resultIcon = document.getElementById("resultIcon");
const resultName = document.getElementById("resultName");
const resultPosition = document.getElementById("resultPosition");
const resultType = document.getElementById("resultType");
const resultTime = document.getElementById("resultTime");
const logsList = document.getElementById("logsList");

let isScanning = false;
let todayLogs = [];
let scannerConnected = false;
let autoCapture = false; // Auto-capture mode disabled by default - user must click button
let autoCaptureInterval = null;

// ===============================================
// Initialize on Page Load
// ===============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 TIMELOG.JS LOADED - MANUAL START MODE");
  
  // Start clock
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Check fingerprint scanner connection
  await checkScannerConnection();
  
  // Load today's logs
  await loadTodayLogs();
  
  // Update action info based on time
  updateActionInfo();
  
  // Attach button event listener
  const btnAutoScan = document.getElementById('btnAutoScan');
  if (btnAutoScan) {
    btnAutoScan.addEventListener('click', toggleAutoScan);
    console.log("✅ Auto-scan button listener attached");
  } else {
    console.error("❌ btnAutoScan button not found!");
  }
  
  // DO NOT auto-start - wait for user to click button
  console.log("⏸️ Auto-capture mode: OFF - Click 'Start Auto-Scan' to begin");
});

// ===============================================
// Update Date/Time Display
// ===============================================
function updateDateTime() {
  const now = new Date();
  
  // Format date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDate.textContent = now.toLocaleDateString('en-US', options);
  
  // Format time
  currentTime.textContent = now.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Update session badge
  const hour = now.getHours();
  if (hour < 12) {
    sessionBadge.textContent = "AM SESSION";
    sessionBadge.className = "session-badge am";
  } else {
    sessionBadge.textContent = "PM SESSION";
    sessionBadge.className = "session-badge pm";
  }
}

// ===============================================
// Check Fingerprint Scanner Connection
// ===============================================
async function checkScannerConnection() {
  try {
    connectionLabel.textContent = "Connecting to Live20R...";
    
    const response = await fetch(`${API_BASE}/scanner/status`);
    const data = await response.json();
    
    if (data.sdk?.initialized && data.devices?.connected) {
      scannerConnected = true;
      connectionIndicator.className = "connection-indicator online";
      connectionLabel.textContent = "Live20R Ready";
      scannerText.textContent = "Tap or place finger to scan";
      scannerHint.textContent = "Keep your finger steady on the scanner";
    } else {
      scannerConnected = false;
      connectionIndicator.className = "connection-indicator offline";
      connectionLabel.textContent = "Scanner Not Found";
      scannerText.textContent = "Scanner not detected";
      scannerHint.textContent = "Please connect Live20R and refresh";
    }
  } catch (error) {
    scannerConnected = false;
    connectionIndicator.className = "connection-indicator offline";
    connectionLabel.textContent = "Service Offline";
    console.error("Scanner check error:", error);
  }
  
  // Retry connection periodically
  setTimeout(checkScannerConnection, 30000);
}

// ===============================================
// Update Action Info Based on Time/Session
// ===============================================
function updateActionInfo() {
  const now = new Date();
  const hour = now.getHours();
  const isAM = hour < 12;
  
  if (isAM) {
    // Morning session
    if (hour < 8) {
      nextAction.textContent = "🌅 Next Scan: AM Time In";
      actionHint.textContent = "Early morning - scan to record your arrival";
    } else if (hour < 12) {
      nextAction.textContent = "☀️ Next Scan: AM Time In/Out";
      actionHint.textContent = "Scan to record Time In (if first) or Time Out";
    }
  } else {
    // Afternoon session
    if (hour < 13) {
      nextAction.textContent = "🌤️ Next Scan: PM Time In";
      actionHint.textContent = "Afternoon session - scan to record PM arrival";
    } else if (hour < 17) {
      nextAction.textContent = "🌇 Next Scan: PM Time In/Out";
      actionHint.textContent = "Scan to record PM Time In or Out";
    } else {
      nextAction.textContent = "🌙 Next Scan: PM Time Out";
      actionHint.textContent = "End of day - scan to record departure";
    }
  }
}

// ===============================================
// Toggle Auto-Scan Mode
// ===============================================
function toggleAutoScan() {
  console.log("🔘 Toggle Auto-Scan clicked");
  
  const btn = document.getElementById('btnAutoScan');
  const btnText = document.getElementById('btnAutoScanText');
  
  console.log("Current autoCapture state:", autoCapture);
  console.log("Scanner connected:", scannerConnected);
  
  if (!scannerConnected) {
    Swal.fire('Warning', 'Scanner is not connected. Please wait for scanner to initialize.', 'warning');
    return;
  }
  
  if (!autoCapture) {
    // Start auto-scan
    console.log("▶️ Starting auto-scan mode...");
    startAutoCapture();
    btn.classList.add('active');
    btnText.textContent = '⏹️ Stop Auto-Scan';
  } else {
    // Stop auto-scan
    console.log("⏹️ Stopping auto-scan mode...");
    stopAutoCapture();
    btn.classList.remove('active');
    btnText.textContent = 'Start Auto-Scan';
  }
}

// ===============================================
// Stop Auto-Capture Mode
// ===============================================
function stopAutoCapture() {
  autoCapture = false;
  if (autoCaptureInterval) {
    clearTimeout(autoCaptureInterval);
    autoCaptureInterval = null;
  }
  Swal.close(); // Close any open scanning dialog
  fingerprintScanner.className = "fingerprint-scanner";
  scannerText.textContent = "Auto-scan stopped";
  scannerHint.textContent = "Click 'Start Auto-Scan' to resume";
  console.log("⏹️ Auto-capture mode stopped");
}

// ===============================================
// Start Auto-Capture Mode
// ===============================================
function startAutoCapture() {
  if (!scannerConnected) {
    console.log("⚠️ Scanner not connected, cannot start auto-capture");
    scannerText.textContent = "Scanner not connected";
    scannerHint.textContent = "Please ensure scanner is connected";
    // Retry after 5 seconds
    setTimeout(() => {
      checkScannerConnection().then(() => {
        if (scannerConnected) {
          startAutoCapture();
        } else {
          setTimeout(startAutoCapture, 5000);
        }
      });
    }, 5000);
    return;
  }
  
  autoCapture = true;
  
  // Set scanning state with animations
  fingerprintScanner.className = "fingerprint-scanner scanning";
  scannerText.textContent = "👆 Ready to scan - Place your finger now";
  scannerHint.textContent = "Scanner is actively waiting for fingerprint";
  
  console.log("✅ Auto-capture mode started - waiting for fingerprint...");
  
  // Show animated scanning dialog
  showScanningDialog();
  
  autoCaptureLoop();
}

// ===============================================
// Show Animated Scanning Dialog
// ===============================================
function showScanningDialog() {
  Swal.fire({
    title: '🔍 Ready to Scan',
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: true
  });
}

// ===============================================
// Update Scanning Dialog - Show Progress
// ===============================================
function updateScanningDialog(status, type = 'info') {
  const statusText = document.getElementById('scanStatusText');
  if (statusText) {
    statusText.parentElement.style.background = 
      type === 'success' ? '#d4edda' : 
      type === 'processing' ? '#d1ecf1' : 
      '#fff3cd';
    statusText.parentElement.querySelector('p').style.color = 
      type === 'success' ? '#155724' : 
      type === 'processing' ? '#0c5460' : 
      '#856404';
    statusText.textContent = status;
  }
  
  // Update title and icon based on type
  const swalTitle = document.querySelector('.swal2-title');
  if (swalTitle) {
    if (type === 'processing') {
      swalTitle.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-spinner fa-spin"></i> Verifying...</div>';
    } else if (type === 'success') {
      swalTitle.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-check-circle" style="color: #28a745;"></i> Verified!</div>';
    }
  }
}

// ===============================================
// Auto-Capture Loop (Continuous Scanning)
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
      // Fingerprint captured! Now identify and record
      console.log('👆 Fingerprint detected - Identifying...');
      updateScanningDialog('👆 Fingerprint detected! Verifying identity...', 'processing');
      
      const verifyResponse = await fetch(`${API_BASE}/fingerprint/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprintTemplate: captureData.template })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.matched && verifyData.userId) {
        // User identified! Record attendance
        console.log(`✅ USER IDENTIFIED: ${verifyData.username} (ID: ${verifyData.userId}) - Score: ${verifyData.score}`);
        
        // Record time log
        const result = await recordTimeLog(captureData.template);
        
        // Close dialog
        Swal.close();
        
        if (result.success) {
          showSuccess(result);
          await loadTodayLogs();
        } else {
          showError(result.message || "Failed to record attendance");
        }
      } else {
        // Unknown fingerprint
        console.log('❌ Unknown fingerprint - Not registered in system');
        Swal.close();
        showError('Fingerprint not recognized');
      }
      
      // Wait before next capture
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
// Start Fingerprint Scan (Legacy - not used in auto-mode)
// ===============================================
async function startScan() {
  console.log("🖐️ FINGERPRINT SCANNER CLICKED!");
  console.log("Scanner connected:", scannerConnected);
  console.log("Is scanning:", isScanning);
  
  if (isScanning) return;
  
  // Check if scanner is connected
  if (!scannerConnected) {
    console.log("⚠️ Scanner not connected, showing warning");
    Swal.fire({
      icon: "warning",
      title: "Scanner Not Connected",
      html: `
        <p>The fingerprint scanner is not detected.</p>
        <p style="margin-top: 10px; font-size: 13px; color: #666;">
          Please connect your Live20R device and ensure ZKFinger SDK is running.
        </p>
      `,
      confirmButtonText: "Retry Connection",
      showCancelButton: true,
      cancelButtonText: "Use Password Login"
    }).then((result) => {
      if (result.isConfirmed) {
        checkScannerConnection();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        window.location.href = "login.html";
      }
    });
    return;
  console.log("✅ Starting scanning dialog...");
  
  }
  
  isScanning = true;
  resetUI();
  
  // Show scanning dialog with animation
  await showScanningDialog();
}

// ===============================================
// Show Scanning Dialog with Animation
// ===============================================
async function showScanningDialog() {
  const scanDialog = Swal.fire({
    title: '<i class="fa-solid fa-fingerprint"></i> Fingerprint Scan',
    html: `
      <div id="scanContent" style="padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <i class="fa-solid fa-fingerprint" style="font-size: 80px; color: #2b426b; animation: pulse 1.5s infinite;"></i>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
            <div id="scanProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #2b426b, #5a7fb8); transition: width 0.3s;"></div>
          </div>
        </div>
        <p style="font-size: 14px; color: #666; margin: 10px 0;" id="scanStatus">Place your finger on the scanner...</p>
        <div style="font-size: 12px; color: #999; margin-top: 10px;">
          <i class="fa-solid fa-lightbulb"></i> Keep your finger steady and press firmly
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      </style>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    width: '500px',
    didOpen: () => {
      // Start the capture process
      captureAndVerifyFingerprint();
    }
  });
}

// ===============================================
// Capture and Verify Fingerprint
// ===============================================
async function captureAndVerifyFingerprint() {
  const scanProgressBar = document.getElementById('scanProgressBar');
  const scanStatus = document.getElementById('scanStatus');
  
  try {
    // Check scanner status
    scanStatus.textContent = 'Checking scanner availability...';
    scanProgressBar.style.width = '10%';
    
    const statusResponse = await fetch(`${API_BASE}/scanner/status`);
    const statusData = await statusResponse.json();
    
    if (!statusData.sdk?.initialized || !statusData.devices?.connected) {
      throw new Error('Scanner not connected. Please check scanner status.');
    }
    
    scanProgressBar.style.width = '20%';
    
    // Capture fingerprint with retry logic
    let captureSuccess = false;
    let retryCount = 0;
    const maxRetries = 10;
    let template = null;
    
    while (!captureSuccess && retryCount < maxRetries) {
      try {
        scanStatus.innerHTML = `<strong>Capturing fingerprint...</strong><br>Keep your finger on the scanner${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}`;
        scanProgressBar.style.width = `${20 + (retryCount * 5)}%`;
        
        const captureResponse = await fetch(`${API_BASE}/scanner/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const captureData = await captureResponse.json();
        
        if (captureData.success && captureData.template) {
          template = captureData.template;
          captureSuccess = true;
          scanProgressBar.style.width = '70%';
          scanStatus.innerHTML = '<strong style="color: #28a745;">✓ Fingerprint captured!</strong>';
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    if (!captureSuccess || !template) {
      throw new Error('Unable to capture fingerprint. Please try again.');
    }
    
    // Verify identity and record time log
    scanStatus.textContent = 'Verifying identity...';
    scanProgressBar.style.width = '80%';
    
    const result = await recordTimeLog(template);
    
    scanProgressBar.style.width = '100%';
    
    // Close the scanning dialog
    Swal.close();
    
    if (result.success) {
      showSuccess(result);
      await loadTodayLogs(); // Refresh logs
    } else {
      showError(result.message || "Fingerprint not recognized");
    }
    
  } catch (error) {
    console.error("Scan error:", error);
    Swal.close();
    showError(error.message || "Scan failed. Please try again.");
  } finally {
    isScanning = false;
  }
}

// ===============================================
// Record Time Log via API
// ===============================================
async function recordTimeLog(fingerprintTemplate) {
  try {
    const response = await fetch(`${API_BASE}/attendance/fingerprint`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fingerprintTemplate })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to record time log");
    }
    
    return data;
    
  } catch (error) {
    console.error("API error:", error);
    throw new Error(error.message || "Cannot connect to server");
  }
}

// ===============================================
// Show Success Result
// ===============================================
function showSuccess(result) {
  // Update scanner appearance
  fingerprintScanner.className = "fingerprint-scanner success";
  scannerIcon.className = "fa-solid fa-check-circle scanner-icon";
  scannerText.textContent = "Verified!";
  scannerHint.textContent = "";
  
  // Show result panel
  resultPanel.className = "result-panel success show";
  resultIcon.className = "fa-solid fa-check-circle result-icon";
  resultName.textContent = result.user.username;
  resultPosition.textContent = result.user.position;
  
  // Determine if Time In or Time Out
  const isTimeIn = result.attendanceType.toLowerCase().includes("in");
  resultType.textContent = result.attendanceType;
  resultType.className = isTimeIn ? "result-type in" : "result-type out";
  
  resultTime.textContent = `${result.time} • ${result.remarks || "Recorded"}`;
  
  // Play success sound
  playBeep("success");
  
  // Reset after delay
  setTimeout(() => {
    resetUI();
    updateActionInfo();
  }, 4000);
}

// ===============================================
// Show Error Result
// ===============================================
function showError(message) {
  fingerprintScanner.className = "fingerprint-scanner error";
  scannerIcon.className = "fa-solid fa-times-circle scanner-icon";
  scannerText.textContent = "Not Recognized";
  scannerHint.textContent = message;
  
  resultPanel.className = "result-panel error show";
  resultIcon.className = "fa-solid fa-times-circle result-icon";
  resultName.textContent = "Unknown User";
  resultPosition.textContent = "Fingerprint not registered";
  resultType.textContent = "Failed";
  resultType.className = "result-type out";
  resultTime.textContent = "Please register your fingerprint first";
  
  // Play error sound
  playBeep("error");
  
  // Reset after delay
  setTimeout(resetUI, 3000);
}

// ===============================================
// Reset UI to Default State
// ===============================================
function resetUI() {
  fingerprintScanner.className = "fingerprint-scanner";
  scannerIcon.className = "fa-solid fa-fingerprint scanner-icon";
  scannerText.textContent = "Tap or place finger to scan";
  scannerHint.textContent = "Keep your finger steady on the scanner";
  resultPanel.className = "result-panel";
}

// ===============================================
// Load Today's Logs from Server
// ===============================================
async function loadTodayLogs() {
  try {
    const response = await fetch(`${API_BASE}/attendance/fingerprint/today`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.logs) {
      todayLogs = data.logs;
      renderLogs();
    }
  } catch (error) {
    console.error("Failed to load logs:", error);
    // Load from localStorage as fallback
    const saved = localStorage.getItem("todayLogs");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's from today
      const today = new Date().toDateString();
      if (parsed.date === today) {
        todayLogs = parsed.logs;
        renderLogs();
      }
    }
  }
}

// ===============================================
// Render Today's Logs
// ===============================================
function renderLogs() {
  if (!todayLogs || todayLogs.length === 0) {
    logsList.innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 20px;">No logs yet today</p>';
    return;
  }
  
  logsList.innerHTML = todayLogs.map(log => {
    const isTimeIn = log.type.toLowerCase().includes("in");
    return `
      <div class="log-item ${isTimeIn ? 'time-in' : 'time-out'}">
        <div class="log-info">
          <span class="log-name">${log.username}</span>
          <span class="log-position">${log.position}</span>
        </div>
        <div class="log-meta">
          <span class="log-type ${isTimeIn ? 'in' : 'out'}">${log.type}</span>
          <div class="log-time">${log.time}</div>
        </div>
      </div>
    `;
  }).join("");
  
  // Save to localStorage
  localStorage.setItem("todayLogs", JSON.stringify({
    date: new Date().toDateString(),
    logs: todayLogs
  }));
}

// ===============================================
// Play Beep Sound
// ===============================================
function playBeep(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "success") {
      osc.frequency.value = 880; // Higher pitch for success
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => {
        osc.frequency.value = 1100;
      }, 100);
      setTimeout(() => osc.stop(), 200);
    } else {
      osc.frequency.value = 330; // Lower pitch for error
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => osc.stop(), 300);
    }
  } catch (e) {
    // Audio not supported
  }
}
