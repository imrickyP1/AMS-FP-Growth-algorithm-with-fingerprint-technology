// authGuard.js

const currentPage = window.location.pathname;

// Skip guard on login page
if (currentPage.includes("login.html")) {
  console.log("AuthGuard skipped on login page.");
  return;
}

// Get session from localStorage
let user = JSON.parse(localStorage.getItem("user") || "{}");
let userPosition = user.position;

// Position is loaded from localStorage on page load

// 🟥 If no position → block page
if (!userPosition) {
  alert("Please log in first.");
  window.location = "login.html";
  throw new Error("Not logged in");
}

// 🟥 Block non-admin
if (userPosition !== "admin") {
  alert("Access denied! Only admin can view this page.");
  window.location = "login.html";
  throw new Error("Access denied");
}

// ========================================
// Sidebar visibility
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  const sidebarItems = {
    home: document.getElementById("home"),
    records: document.getElementById("records"),
    list: document.getElementById("list"),
    reports: document.getElementById("reports"),
  };

  if (userPosition === "admin") {
    Object.values(sidebarItems).forEach((item) => {
      if (item) item.style.display = "block";
    });
  } else {
    Object.values(sidebarItems).forEach((item) => {
      if (item) item.style.display = "none";
    });
  }
});
