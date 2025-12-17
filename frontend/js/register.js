// ===============================================
// 🔐 Fingerprint Enrollment Handler
// ===============================================
let fingerprintTemplate = null;

document.getElementById("enrollFingerprintBtn").addEventListener("click", async () => {
  const btn = document.getElementById("enrollFingerprintBtn");
  const statusEl = document.getElementById("fingerprintStatus");
  const textEl = document.getElementById("fingerprintText");
  const templateInput = document.getElementById("fingerprintTemplate");

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scanning...';

    // Check if fingerprint reader is available
    const isAvailable = await FingerprintEnrollment.isAvailable();
    
    if (!isAvailable) {
      Swal.fire({
        icon: "warning",
        title: "Reader Not Found",
        text: "Fingerprint reader is not connected. Please connect your ZKTeco device and try again.",
        confirmButtonColor: "#3085d6"
      });
      return;
    }

    // Enroll fingerprint
    fingerprintTemplate = await FingerprintEnrollment.enroll();
    
    // Update UI
    statusEl.classList.add("enrolled");
    textEl.textContent = "Fingerprint enrolled ✓";
    templateInput.value = fingerprintTemplate;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Re-scan Fingerprint';

  } catch (error) {
    console.error("Fingerprint enrollment error:", error);
    statusEl.classList.remove("enrolled");
    textEl.textContent = "Enrollment failed - try again";
  } finally {
    btn.disabled = false;
    if (!fingerprintTemplate) {
      btn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> Scan Fingerprint';
    }
  }
});

// ✅ Handle Registration Form
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const gender = document.getElementById("gender").value.trim();
  const position = document.getElementById("position").value.trim();
  const fingerprintData = document.getElementById("fingerprintTemplate").value;

  // 🛑 Validate fields
  if (!username || !password || !gender || !position) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill in all required fields.",
    });
    return;
  }

  // Note: Fingerprint is now optional for all users
  // Fingerprint can be added later from User Management

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        username, 
        password, 
        gender, 
        position,
        fingerprintTemplate: fingerprintData || null
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text: fingerprintData 
          ? "Account created with fingerprint enrollment."
          : "Account created. You can add fingerprint later from User Management.",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        window.location.href = "login.html";
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: data.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#6e7881",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Unable to connect to the server. Please try again later.",
    });
  }
});

// 👁 Toggle Password Visibility
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});
