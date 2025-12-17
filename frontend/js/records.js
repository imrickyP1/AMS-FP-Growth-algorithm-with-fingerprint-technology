document.addEventListener("DOMContentLoaded", () => {

  // ------------------------
  // SESSION LOAD
  // ------------------------
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  let username = user.username;
  let position = user.position;

  if (!username) {
    Swal.fire({
      icon: "warning",
      title: "Unauthorized",
      text: "Please login first.",
    }).then(() => window.location.href = "login.html");
    return;
  }

  if (position !== "admin") {
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "Admin only!",
      timer: 3000,
      showConfirmButton: false,
    }).then(() => window.location.href = "splash.html");
    return;
  }

  document.getElementById("welcomeText").textContent = `Welcome, ${username}`;

  // ------------------------
  // ELEMENTS
  // ------------------------
  const tbody = document.getElementById("attendanceTableBody");
  const searchName = document.getElementById("searchName");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const filterBtn = document.getElementById("filterBtn");
  const trendBtn = document.getElementById("trendBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Set default dates to current month (first day to last day)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  fromDate.value = firstDay.toISOString().split('T')[0];
  toDate.value = lastDay.toISOString().split('T')[0];

  // MODAL ELEMENTS
  const trendModal = document.getElementById("trendModal");
  const trendClose = document.getElementById("closeTrend");
  const trendCanvas = document.getElementById("trendChart");

  let trendChart = null;

  // ------------------------
  // REMARKS FORMATTER
  // ------------------------
  function formatRemarks(remarks) {
    if (!remarks || remarks.trim() === "") return "Ontime";

    const r = remarks.toLowerCase();
    if (["present", "on time", "ontime"].includes(r)) return "Ontime";
    if (r === "late") return "Late";
    if (r === "undertime") return "Undertime";
    if (r === "overtime") return "Overtime";

    return remarks;
  }

  // ------------------------
  // LOAD ATTENDANCE TABLE
  // ------------------------
  async function loadAttendance() {
    tbody.innerHTML =
      `<tr><td colspan="8" style="text-align:center;">Loading records...</td></tr>`;

    try {
      const query = new URLSearchParams({
        searchName: searchName.value || "",
        fromDate: fromDate.value || "",
        toDate: toDate.value || ""
      });

      const res = await fetch(`${API_BASE_URL}/attendance/records?${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log('📊 Attendance records loaded:', result);

      tbody.innerHTML = "";

      if (!result.success || !result.data?.length) {
        tbody.innerHTML =
          `<tr><td colspan="8" style="text-align:center;">No attendance records found.</td></tr>`;
        return;
      }

      result.data.forEach((rec) => {
        const formattedDate = rec.date
          ? new Date(rec.date).toLocaleDateString("en-PH")
          : "-";

        const row = `
          <tr>
            <td>${rec.employee || "-"}</td>
            <td>${rec.position || "-"}</td>
            <td>${formattedDate}</td>
            <td>${rec.am_time_in || "-"}</td>
            <td>${rec.am_time_out || "-"}</td>
            <td>${rec.pm_time_in || "-"}</td>
            <td>${rec.pm_time_out || "-"}</td>
            <td>${formatRemarks(rec.remarks)}</td>
          </tr>
        `;

        tbody.insertAdjacentHTML("beforeend", row);
      });

    } catch (err) {
      console.error("Frontend error:", err);
      tbody.innerHTML =
        `<tr><td colspan="8" style="color:red;text-align:center;">Error loading data: ${err.message}</td></tr>`;
    }
  }

  // ------------------------
// LOAD DAILY TREND CHART
// ------------------------
async function loadTrend() {
  const employee = searchName.value.trim();

  // Auto-detect month
  let monthValue = "";
  if (fromDate.value) {
    // Use the month from the FROM date
    monthValue = fromDate.value.substring(0, 7);
  } else {
    // Default: current month
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    monthValue = `${y}-${m}`;
  }

  const params = new URLSearchParams({
    employee: employee || "",  // Empty string for all users
    month: monthValue
  });

  try {
    const res = await fetch(`${API_BASE_URL}/attendance/trend?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const result = await res.json();

    if (!result.ok || !result.data.length) {
      Swal.fire({
        icon: "info",
        title: "No Trend Data",
        text: employee ? `No attendance trend found for "${employee}".` : "No attendance data found for this period."
      });
      return;
    }

    // ------------------------
    // BUILD X-AXIS FOR FULL MONTH
    // ------------------------
    const [year, month] = monthValue.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const labels = Array.from({ length: lastDay }, (_, i) => i + 1);

    const ontime = Array(lastDay).fill(0);
    const late = Array(lastDay).fill(0);
    const undertime = Array(lastDay).fill(0);
    const overtime = Array(lastDay).fill(0);

    result.data.forEach(row => {
      const day = Number(row.date.substring(8, 10));
      ontime[day - 1] = Number(row.ontime);
      late[day - 1] = Number(row.late);
      undertime[day - 1] = Number(row.undertime);
      overtime[day - 1] = Number(row.overtime);
    });

    if (trendChart) trendChart.destroy();

    const title = employee 
      ? `Daily Attendance Trend of "${employee}"`
      : `Daily Attendance Trend - All Users`;

    trendChart = new Chart(trendCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Ontime", data: ontime, borderColor: "#28a745", backgroundColor: "rgba(40, 167, 69, 0.1)", tension: 0.3, fill: true },
          { label: "Late", data: late, borderColor: "#ffc107", backgroundColor: "rgba(255, 193, 7, 0.1)", tension: 0.3, fill: true },
          { label: "Undertime", data: undertime, borderColor: "#17a2b8", backgroundColor: "rgba(23, 162, 184, 0.1)", tension: 0.3, fill: true },
          { label: "Overtime", data: overtime, borderColor: "#6f42c1", backgroundColor: "rgba(111, 66, 193, 0.1)", tension: 0.3, fill: true }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title, font: { size: 18 } },
          legend: { display: true, position: 'top' }
        },
        scales: {
          x: { title: { display: true, text: "Day of Month" } },
          y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: "Count" } }
        }
      }
    });

    trendModal.style.display = "flex";

  } catch (err) {
    console.error("Trend load error:", err);
    Swal.fire({
      icon: "error",
      title: "Trend Error",
      text: "Something went wrong loading trend data."
    });
  }
}

  // ------------------------
  // EVENT LISTENERS
  // ------------------------
  if (filterBtn) filterBtn.addEventListener("click", loadAttendance);
  if (trendBtn) trendBtn.addEventListener("click", loadTrend);

  trendClose.addEventListener("click", () => {
    trendModal.style.display = "none";
  });

  trendModal.addEventListener("click", (e) => {
    if (e.target === trendModal) {
      trendModal.style.display = "none";
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // ------------------------
  // INITIAL LOAD
  // ------------------------
  loadAttendance();

});
