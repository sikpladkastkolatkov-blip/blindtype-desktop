const { contextBridge, ipcRenderer } = require("electron");

// Renderer получает только три безопасных действия управления окном.
contextBridge.exposeInMainWorld("desktop", {
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
  close: () => ipcRenderer.send("window:close")
});