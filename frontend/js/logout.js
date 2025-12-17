// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", function () {
  Swal.fire({
    title: "Are you sure you want to logout?",
    text: "You will be redirected to the login page.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#0c3b6a",
    cancelButtonColor: "#e74c3c",
    confirmButtonText: "Yes, Logout",
  }).then((result) => {
    if (result.isConfirmed) {
      // ✅ Clear any stored session data (optional)
      localStorage.clear();
      sessionStorage.clear();

      // ✅ Redirect to login page
      window.location.href = "login.html";
    }
  });
});
