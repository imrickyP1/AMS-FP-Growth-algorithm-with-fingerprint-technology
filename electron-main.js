// electron-main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

// ===============================
// 🔹 Create Main Window
// ===============================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splash = path.join(__dirname, "frontend", "splash.html");
  console.log("🟦 Loading:", splash);

  mainWindow.loadFile(splash).catch((err) =>
    console.error("❌ Failed to load splash:", err)
  );

  mainWindow.on("closed", () => (mainWindow = null));
}

// ===============================
// 🔹 Helper Loader
// ===============================
function loadPage(page) {
  const filePath = path.join(__dirname, "frontend", page);
  console.log("📄 PAGE LOAD:", filePath);

  if (!mainWindow) return;
  mainWindow.loadFile(filePath).catch((err) =>
    console.error(`❌ Failed to load ${page}:`, err)
  );
}

// ===============================
// 🔹 Electron Ready
// ===============================
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ===============================
// 🧭 IPC: Navigation Handler
// ===============================
ipcMain.on("navigate", (event, page) => {
  console.log(`🧭 NAVIGATE TO: ${page}`);

  const routes = {
    splash: "splash.html",
    login: "login.html",
    register: "register.html",
    dashboard: "dashboard.html",
    records: "records.html",
    list: "list.html",
    report: "report.html",
    home: "home.html",
  };

  if (routes[page]) loadPage(routes[page]);
  else console.warn("⚠ Unknown nav:", page);
});

// ===============================
// 🔹 LOGIN SUCCESS HANDLER
// ===============================
// login.js now sends the FULL USER, NOT only position
ipcMain.on("login-success", (event, user) => {
  console.log("✅ LOGIN SUCCESS:", user);

  // Send full user object to renderer
  mainWindow.webContents.send("set-user", user);

  // Redirect based on position
  if (user.position === "admin") {
    console.log("➡ ADMIN → DASHBOARD");
    loadPage("dashboard.html");
  } else {
    console.log("➡ STAFF/OFFICIAL → HOME");
    loadPage("home.html");
  }
});

// ===============================
// 🔸 LOGOUT
// ===============================
ipcMain.on("logout", () => {
  console.log("👋 LOGOUT → login.html");

  // Clear session in renderer
  mainWindow.webContents.send("clear-session");

  loadPage("login.html");
});
