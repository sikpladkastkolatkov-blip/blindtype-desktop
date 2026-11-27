const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 760,
    minHeight: 650,
    show: false,
    backgroundColor: "#17191f",
    title: "Swift Nimble Exact Input System",
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",   // на Mac остаются родные кнопки слева
    titleBarOverlay: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Окно сразу разворачивается, чтобы кнопки управления были в самом углу экрана.
  win.once("ready-to-show", () => { win.maximize(); win.show(); });
  win.loadFile("index.html");
}

app.whenReady().then(() => {
  const fromEvent = (event) => BrowserWindow.fromWebContents(event.sender);
  ipcMain.on("window:minimize", (event) => fromEvent(event)?.minimize());
  ipcMain.on("window:toggle-maximize", (event) => {
    const win = fromEvent(event);
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on("window:close", (event) => fromEvent(event)?.close());
  ipcMain.on("window:toggle-fullscreen", (event) => {
    const win = fromEvent(event);
    if (win) win.setFullScreen(!win.isFullScreen());
  });
  ipcMain.on("window:always-on-top", (event, value) => fromEvent(event)?.setAlwaysOnTop(!!value));
  ipcMain.on("window:zoom", (event, factor) => {
    const f = Math.min(2, Math.max(0.6, Number(factor) || 1));
    event.sender.setZoomFactor(f);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
