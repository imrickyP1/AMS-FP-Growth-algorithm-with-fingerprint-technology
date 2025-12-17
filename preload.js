const { contextBridge, ipcRenderer } = require("electron");

// 🔹 Safe IPC bridge for frontend (HTML/JS)
contextBridge.exposeInMainWorld("electronAPI", {
  // For navigation between pages
  navigate: (page) => ipcRenderer.send("navigate", page),

  // When login is successful — send the user role to Electron
  loginSuccess: (position) => ipcRenderer.send("login-success", position),

  // When user logs out — return to login page
  logout: () => ipcRenderer.send("logout"),

  // listen for main process sending the position to the frontend
  onSetPosition: (callback) => ipcRenderer.on("set-position", (event, position) => callback(position)),
});
