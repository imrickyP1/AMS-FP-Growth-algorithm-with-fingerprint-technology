// login.js

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const showPasswordBtn = document.getElementById("togglePassword");
const errorMessage = document.getElementById("error-message");

// API_BASE_URL is loaded from api-config.js
const API_BASE = `${API_BASE_URL}/auth`;

// ======================================================
// 🔵 SHOW / HIDE PASSWORD
// ======================================================
if (showPasswordBtn) {
  showPasswordBtn.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    showPasswordBtn.classList.toggle("active");
  });
}

// ======================================================
// 🔵 LOGIN HANDLER
// ======================================================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {

        const session = {
          username: data.user.username,
          position: data.user.position, // admin, staff, official
        };

        // ================================
        // FIXED: Save correct keys
        // ================================
        localStorage.setItem("user", JSON.stringify(session));
        localStorage.setItem("username", session.username);
        localStorage.setItem("userPosition", session.position);
        localStorage.setItem("token", data.token); // Save JWT token

        // Redirect
        if (session.position === "admin") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "splash.html";
        }

      } else {
        showError(data.message || "Invalid username or password.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      showError("Unable to reach server. Check backend connection.");
    }
  });
}

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  } else {
    alert(message);
  }
}