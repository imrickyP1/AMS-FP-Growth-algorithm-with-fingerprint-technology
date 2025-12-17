// frontend/js/splash.js
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in as admin
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (user.username && user.position === "admin") {
    // Admin users go directly to dashboard
    window.location.href = "dashboard.html";
    return;
  }
  
  console.log("✅ Splash screen loaded");
  console.log("📍 Primary: Fingerprint Time Log");
  console.log("📍 Fallback: Credential Login");
});
