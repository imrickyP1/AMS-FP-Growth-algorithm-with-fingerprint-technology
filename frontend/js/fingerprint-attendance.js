// ===============================================
// 🔐 Fingerprint Attendance System (Live20R)
// ===============================================

// API_BASE_URL is loaded from api-config.js
const API_BASE = API_BASE_URL;

// DOM Elements
const connectionStatus = document.getElementById("connectionStatus");
const connectionText = document.getElementById("connectionText");
const currentDate = document.getElementById("currentDate");
const currentTime = document.getElementById("currentTime");
const fingerprintArea = document.getElementById("fingerprintArea");
const fingerprintIcon = document.getElementById("fingerprintIcon");
const fingerprintText = document.getElementById("fingerprintText");
const scanBtn = document.getElementById("scanBtn");
const statusMessage = document.getElementById("statusMessage");
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const userPosition = document.getElementById("userPosition");
const attendanceType = document.getElementById("attendanceType");
const activityList = document.getElementById("activityList");

let isScanning = false;
let recentActivities = [];

// ===============================================
// Initialize
// ===============================================
document.addEventListener("DOMContentLoaded", async () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Check fingerprint reader connection
  await checkReaderConnection();
  
  // Load recent activities
  loadRecentActivities();
  
  // Setup scan button
  scanBtn.addEventListener("click", startFingerprintScan);
});

// ===============================================
// Update Date/Time Display
// ===============================================
function updateDateTime() {
  const now = new Date();
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDate.textContent = now.toLocaleDateString('en-US', options);
  
  currentTime.textContent = now.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ===============================================
// Check Fingerprint Reader Connection
// ===============================================
async function checkReaderConnection() {
  try {
    const isAvailable = await FingerprintEnrollment.isAvailable();
    
    if (isAvailable) {
      connectionStatus.className = "connection-status connected";
      connectionText.textContent = "Live20R Connected";
      scanBtn.disabled = false;
    } else {
      connectionStatus.className = "connection-status disconnected";
      connectionText.textContent = "Live20R Not Found";
      scanBtn.disabled = false; // Still allow attempts
    }
  } catch (error) {
    connectionStatus.className = "connection-status disconnected";
    connectionText.textContent = "Reader Service Offline";
    console.error("Reader check failed:", error);
  }
}

// ===============================================
// Start Fingerprint Scan for Attendance
// ===============================================
async function startFingerprintScan() {
  if (isScanning) return;
  
  isScanning = true;
  resetUI();
  
  // Update UI to scanning state
  fingerprintArea.className = "fingerprint-area scanning";
  fingerprintText.textContent = "Place your finger on the scanner...";
  scanBtn.disabled = true;
  scanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scanning...';
  
  try {
    // Initialize reader if needed
    if (!FingerprintReader.isConnected) {
      await FingerprintReader.init();
    }
    
    // Capture fingerprint
    const template = await FingerprintReader.captureSingle();
    
    fingerprintText.textContent = "Fingerprint captured! Verifying...";
    
    // Send to server for identification
    const result = await identifyAndRecordAttendance(template);
    
    if (result.success) {
      showSuccess(result);
    } else {
      showError(result.message || "User not found");
    }
    
  } catch (error) {
    console.error("Scan error:", error);
    showError(error.message || "Failed to capture fingerprint");
  } finally {
    isScanning = false;
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> Start Scanning';
  }
}

// ===============================================
// Identify User and Record Attendance
// ===============================================
async function identifyAndRecordAttendance(template) {
  try {
    const response = await fetch(`${API_BASE}/attendance/fingerprint`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ fingerprintTemplate: template })
    });
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("API error:", error);
    throw new Error("Server connection failed");
  }
}

// ===============================================
// Show Success State
// ===============================================
function showSuccess(result) {
  fingerprintArea.className = "fingerprint-area success";
  fingerprintIcon.className = "fa-solid fa-check-circle fingerprint-icon";
  fingerprintIcon.style.color = "#28a745";
  fingerprintText.textContent = "Verified!";
  
  // Show user info
  userInfo.className = "user-info show";
  userName.textContent = result.user.username;
  userPosition.textContent = result.user.position;
  attendanceType.textContent = result.attendanceType; // "Time In" or "Time Out"
  attendanceType.style.background = result.attendanceType.includes("In") ? "#28a745" : "#dc3545";
  
  // Show status message
  statusMessage.className = "status-message success show";
  statusMessage.innerHTML = `
    <i class="fa-solid fa-check-circle"></i>
    ${result.message}
    <br><small>${result.remarks || ''} - ${result.time}</small>
  `;
  
  // Add to recent activities
  addRecentActivity({
    name: result.user.username,
    type: result.attendanceType,
    time: result.time,
    remarks: result.remarks
  });
  
  // Play success sound (optional)
  playSound("success");
  
  // Reset after delay
  setTimeout(resetUI, 5000);
}

// ===============================================
// Show Error State
// ===============================================
function showError(message) {
  fingerprintArea.className = "fingerprint-area error";
  fingerprintIcon.className = "fa-solid fa-times-circle fingerprint-icon";
  fingerprintIcon.style.color = "#dc3545";
  fingerprintText.textContent = "Not recognized";
  
  statusMessage.className = "status-message error show";
  statusMessage.innerHTML = `
    <i class="fa-solid fa-exclamation-circle"></i>
    ${message}
  `;
  
  // Play error sound (optional)
  playSound("error");
  
  // Reset after delay
  setTimeout(resetUI, 3000);
}

// ===============================================
// Reset UI State
// ===============================================
function resetUI() {
  fingerprintArea.className = "fingerprint-area";
  fingerprintIcon.className = "fa-solid fa-fingerprint fingerprint-icon";
  fingerprintIcon.style.color = "#2b426b";
  fingerprintText.textContent = "Ready to scan";
  statusMessage.className = "status-message";
  userInfo.className = "user-info";
}

// ===============================================
// Add Recent Activity
// ===============================================
function addRecentActivity(activity) {
  recentActivities.unshift(activity);
  if (recentActivities.length > 10) {
    recentActivities.pop();
  }
  
  // Save to localStorage
  localStorage.setItem("recentActivities", JSON.stringify(recentActivities));
  
  renderActivities();
}

// ===============================================
// Load Recent Activities
// ===============================================
function loadRecentActivities() {
  const saved = localStorage.getItem("recentActivities");
  if (saved) {
    recentActivities = JSON.parse(saved);
    renderActivities();
  }
}

// ===============================================
// Render Activities List
// ===============================================
function renderActivities() {
  if (recentActivities.length === 0) {
    activityList.innerHTML = '<p style="color: #999; font-size: 12px; text-align: center;">No recent activity</p>';
    return;
  }
  
  activityList.innerHTML = recentActivities.map(activity => `
    <div class="activity-item">
      <div>
        <span class="name">${activity.name}</span>
        <br><small style="color: #666;">${activity.remarks || ''}</small>
      </div>
      <div style="text-align: right;">
        <span class="type">${activity.type}</span>
        <br><span class="time" style="font-size: 11px;">${activity.time}</span>
      </div>
    </div>
  `).join("");
}

// ===============================================
// Play Sound (optional feedback)
// ===============================================
function playSound(type) {
  // Create audio context for beep sounds
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === "success") {
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
    } else {
      oscillator.frequency.value = 300;
      gainNode.gain.value = 0.1;
    }
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 150);
  } catch (e) {
    // Audio not supported
  }
}

// ===============================================
// Auto-scan mode (optional - continuous scanning)
// ===============================================
let autoScanInterval = null;

function startAutoScan() {
  if (autoScanInterval) return;
  
  autoScanInterval = setInterval(() => {
    if (!isScanning) {
      startFingerprintScan();
    }
  }, 2000);
}

function stopAutoScan() {
  if (autoScanInterval) {
    clearInterval(autoScanInterval);
    autoScanInterval = null;
  }
}
