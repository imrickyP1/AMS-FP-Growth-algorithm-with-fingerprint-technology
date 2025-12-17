// =====================================
// CONFIGURATION
// =====================================
// API_BASE_URL is loaded from api-config.js
const API_BASE = `${API_BASE_URL}/attendance/report`;

// GET DOM ELEMENTS
const monthInput = document.getElementById("reportMonth");
const positionFilter = document.getElementById("filterPosition");
const searchNameInput = document.getElementById("searchName");
const generateBtn = document.getElementById("generateReport");
const patternList = document.getElementById("patternList");
const chartCanvas = document.getElementById("attendanceChart");

let chartInstance = null;

// =====================================
// GET USER SESSION
// =====================================
function getSession() {
  const user = localStorage.getItem("user");
  if (!user) return null;
  return JSON.parse(user);
}

// =====================================
// ADMIN ONLY ACCESS
// =====================================
function adminAuthGuard() {
  const user = getSession();
  if (!user || user.position !== "admin") {
    Swal.fire("Unauthorized", "Only ADMIN can access the reports page.", "error");
    window.location.href = "login.html";
  }
}
adminAuthGuard();

// =====================================
// LOAD REPORT SUMMARY
// =====================================
async function loadReport() {
  const month = monthInput.value;
  const position = positionFilter.value;
  const searchName = searchNameInput.value.trim();

  if (!month) {
    Swal.fire("Missing Input", "Please select a month to generate your report.", "warning");
    return;
  }

  try {
    // Show loading state
    patternList.innerHTML = "<li>Loading FP-Growth patterns...</li>";
    if (chartInstance) chartInstance.destroy();

    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      month: month,
      position: position || '',
      searchName: searchName || ''
    });

    const response = await fetch(`${API_BASE}/summary?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      Swal.fire("Error", data.message || "Failed to load report data.", "error");
      return;
    }

    console.log('Report data:', data);

    // =============================================
    // UPDATE FREQUENT PATTERNS (FP-Growth)
    // =============================================
    updatePatterns(data.patterns || []);

    // =============================================
    // UPDATE MONTHLY ATTENDANCE TRENDS CHART
    // =============================================
    updateChart(data.chart || {}, searchName, position);

  } catch (err) {
    console.error("❌ Error:", err);
    Swal.fire("Error", "Unable to connect to the server.", "error");
    patternList.innerHTML = "<li>Error loading FP-Growth patterns.</li>";
  }
}

// =====================================
// UPDATE FREQUENT PATTERNS (FP-Growth)
// =====================================
function updatePatterns(patterns = []) {
  patternList.innerHTML = "";

  if (!patterns || !patterns.length) {
    patternList.innerHTML = "<li>No frequent attendance patterns found for this period.</li>";
    return;
  }

  patterns.forEach(p => {
    const li = document.createElement("li");
    const items = Array.isArray(p.items) ? p.items.join(", ") : p.pattern || "Unknown";
    const support = p.support || p.frequency || 0;
    const confidence = p.confidence ? ` (${(p.confidence * 100).toFixed(1)}%)` : '';
    
    li.innerHTML = `<strong>${items}</strong> — Support: ${support}${confidence}`;
    patternList.appendChild(li);
  });
}

// =====================================
// UPDATE MONTHLY ATTENDANCE TRENDS CHART
// =====================================
function updateChart(data, searchName, position) {
  if (!data || !data.labels || !data.labels.length) {
    if (chartInstance) chartInstance.destroy();
    return;
  }

  if (chartInstance) chartInstance.destroy();

  // Determine chart title based on filters
  let chartTitle = "Monthly Attendance Trends";
  if (searchName) {
    chartTitle = `Monthly Attendance Trend - ${searchName}`;
  } else if (position && position !== '') {
    chartTitle = `Monthly Attendance Trends - ${position.charAt(0).toUpperCase() + position.slice(1)}s`;
  } else {
    chartTitle = "Monthly Attendance Trends - All Users";
  }

  // Calculate max value for better scaling
  const allValues = [
    ...(data.ontime || []),
    ...(data.late || []),
    ...(data.undertime || []),
    ...(data.overtime || [])
  ];
  const maxValue = Math.max(...allValues, 10);

  chartInstance = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Ontime",
          data: data.ontime || [],
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true
        },
        {
          label: "Late",
          data: data.late || [],
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true
        },
        {
          label: "Undertime",
          data: data.undertime || [],
          borderColor: "#17a2b8",
          backgroundColor: "rgba(23, 162, 184, 0.1)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true
        },
        {
          label: "Overtime",
          data: data.overtime || [],
          borderColor: "#6f42c1",
          backgroundColor: "rgba(111, 66, 193, 0.1)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: chartTitle,
          font: { size: 18, weight: 'bold' }
        },
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            font: { size: 14 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: Math.ceil(maxValue * 1.2),
          ticks: {
            stepSize: 1,
            font: { size: 12 }
          },
          title: {
            display: true,
            text: 'Count',
            font: { size: 14 }
          }
        },
        x: {
          grid: { color: "#f2f2f2" },
          ticks: { font: { size: 12 } },
          title: {
            display: true,
            text: 'Day of Month',
            font: { size: 14 }
          }
        }
      }
    }
  });
}

// =====================================
// EXPORT PDF
// =====================================
document.getElementById("exportPDF").addEventListener("click", () => {
  const reportElement = document.querySelector(".report-container");

  if (!reportElement) {
    Swal.fire("Error", "Report container not found!", "error");
    return;
  }

  Chart.helpers.each(Chart.instances, (instance) => instance.resize());

  const options = {
    margin: 0.5,
    filename: "Attendance_Report.pdf",
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  };

  html2pdf()
    .from(reportElement)
    .set(options)
    .save();
});

// =====================================
// EVENTS
// =====================================
generateBtn.addEventListener("click", loadReport);
