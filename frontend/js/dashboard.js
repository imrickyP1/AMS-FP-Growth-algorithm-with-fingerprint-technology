//const { ipcRenderer } = require("electron");

// ✅ Correct API endpoint for dashboard summary
// API_BASE_URL is loaded from api-config.js
const API_URL = `${API_BASE_URL}/attendance/home/dashboard-summary`;

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
  
  // Refresh dashboard every 30 seconds
  setInterval(() => {
    loadDashboardData();
  }, 30000);
});

// =========================================
// ✅ Load Dashboard Summary (Today Only)
// =========================================
async function loadDashboardData() {
  const loader = document.getElementById("loader");

  try {
    if (loader) loader.style.display = "block";

    console.log('📊 Fetching dashboard data from:', API_URL);

    // Fetch data from correct route
    const res = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ Dashboard data received:', data);

    if (!data.success) throw new Error("Failed to load dashboard data");

    // =========================================
    // Update Summary Cards
    // =========================================
    document.getElementById("totalOfficials").textContent = data.totalOfficials ?? 0;
    document.getElementById("totalStaff").textContent = data.totalStaff ?? 0;
    document.getElementById("ontimeCount").textContent = data.ontime ?? 0;
    document.getElementById("lateCount").textContent = data.late ?? 0;
    document.getElementById("undertimeCount").textContent = data.undertime ?? 0;
    document.getElementById("overtimeCount").textContent = data.overtime ?? 0;
    document.getElementById("enrolledUsersCount").textContent = data.enrolledUsers ?? 0;

    // Update enrolled status in scanner status widget
    if (document.getElementById("enrolledStatusValue")) {
      document.getElementById("enrolledStatusValue").textContent = data.enrolledUsers ?? 0;
    }

    // =========================================
    // Render Bar Chart
    // =========================================
    renderBarChart(
      data.ontime || 0,
      data.late || 0,
      data.undertime || 0,
      data.overtime || 0
    );

    // Show success state
    showServerStatus(true, "Server online");
    console.log('✅ Dashboard updated successfully');

  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    
    // Show offline state with default values
    document.getElementById("totalOfficials").textContent = "--";
    document.getElementById("totalStaff").textContent = "--";
    document.getElementById("ontimeCount").textContent = "--";
    document.getElementById("lateCount").textContent = "--";
    document.getElementById("undertimeCount").textContent = "--";
    document.getElementById("overtimeCount").textContent = "--";
    document.getElementById("enrolledUsersCount").textContent = "--";
    
    if (document.getElementById("enrolledStatusValue")) {
      document.getElementById("enrolledStatusValue").textContent = "--";
    }
    
    // Show offline message
    showServerStatus(false, err.message.includes('fetch') ? 'Server offline' : err.message);
    
    // Render empty chart
    renderBarChart(0, 0, 0, 0);
  } finally {
    if (loader) loader.style.display = "none";
  }
}

// =========================================
// Show Server Status Helper
// =========================================
function showServerStatus(online, message) {
  // Update API status in scanner widget
  const apiStatusDot = document.getElementById("apiStatusDot");
  const apiStatusValue = document.getElementById("apiStatusValue");
  
  if (apiStatusDot && apiStatusValue) {
    if (online) {
      apiStatusDot.className = "status-dot online";
      apiStatusValue.textContent = "Online";
    } else {
      apiStatusDot.className = "status-dot offline";
      apiStatusValue.textContent = "Offline";
    }
  }
}

// =========================================
// ✅ Render Chart.js Bar Chart
// =========================================
function renderBarChart(ontime, late, undertime, overtime) {
  const canvas = document.getElementById("attendanceChart");
  if (!canvas) {
    console.warn('Canvas element #attendanceChart not found');
    return;
  }

  const ctx = canvas.getContext("2d");

  // Destroy old chart if exists and is a Chart instance
  if (window.attendanceChart && typeof window.attendanceChart.destroy === 'function') {
    window.attendanceChart.destroy();
  }

  window.attendanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Ontime", "Late", "Undertime", "Overtime"],
      datasets: [
        {
          label: "Today's Summary",
          data: [ontime, late, undertime, overtime],
          backgroundColor: [
            "#28a745",
            "#ffc107",
            "#17a2b8",
            "#6f42c1",
          ],
          borderRadius: 8,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// ===============================================
// Logout
// ===============================================
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  Swal.fire("Logout", "You have successfully logged out!", "info").then(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("userPosition");
    window.location.href = "login.html";
  });
});
