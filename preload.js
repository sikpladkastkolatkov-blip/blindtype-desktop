const { contextBridge, ipcRenderer } = require("electron");

// Renderer получает только безопасные действия управления окном.
contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
  close: () => ipcRenderer.send("window:close"),
  toggleFullscreen: () => ipcRenderer.send("window:toggle-fullscreen"),
  setAlwaysOnTop: (value) => ipcRenderer.send("window:always-on-top", !!value),
  setZoom: (factor) => ipcRenderer.send("window:zoom", Number(factor) || 1)
});
