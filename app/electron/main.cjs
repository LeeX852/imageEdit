const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let pythonProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PYTHON_BACKEND_URL = 'http://localhost:8000';

// Check if bundled venv exists — use it regardless of isPackaged if available
const fs = require('fs');
const bundledVenvPython = path.join(process.resourcesPath, 'backend', '.venv', 'Scripts', 'python.exe');
const useBundledBackend = fs.existsSync(bundledVenvPython);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Game Asset Processor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev && !useBundledBackend) {
    // Pure dev mode: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production or packaged with bundled backend: load local files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function findPython() {
  const candidates = [
    'C:\\Users\\leex852\\AppData\\Local\\Programs\\Python\\Python310\\python.exe',
    'C:\\Python310\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python312\\python.exe',
    'python3',
    'python',
  ];
  const { execFileSync } = require('child_process');
  for (const cmd of candidates) {
    try {
      execFileSync(cmd, ['--version'], { stdio: 'ignore' });
      return cmd;
    } catch { /* not found, try next */ }
  }
  return 'python';
}

function startPythonBackend() {
  let pythonCmd;
  let spawnArgs;
  let spawnCwd;

  if (useBundledBackend) {
    // Production: use bundled venv Python interpreter
    pythonCmd = bundledVenvPython;
    spawnArgs = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'];
    spawnCwd = path.join(process.resourcesPath, 'backend');
  } else {
    // Dev mode: use system Python
    pythonCmd = findPython();
    spawnArgs = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'];
    spawnCwd = path.join(__dirname, '../backend');
  }

  console.log('Starting Python backend:', pythonCmd);
  console.log('Working directory:', spawnCwd);
  console.log('isDev:', isDev, 'isPackaged:', app.isPackaged);
  console.log('useBundledBackend:', useBundledBackend);
  console.log('resourcesPath:', process.resourcesPath);

  pythonProcess = spawn(pythonCmd, spawnArgs, {
    cwd: spawnCwd,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python backend: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python backend error: ${data}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err.message);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python backend exited with code ${code}`);
    pythonProcess = null;
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// IPC handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tiff', 'gif'] },
    ],
  });
  return result.filePaths;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('get-backend-url', () => PYTHON_BACKEND_URL);

// App lifecycle
app.whenReady().then(async () => {
  startPythonBackend();
  // Wait for backend to be ready before showing window
  await waitForBackend(15000);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

async function waitForBackend(timeoutMs) {
  const http = require('http');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await new Promise((resolve, reject) => {
        http.get(PYTHON_BACKEND_URL + '/health', (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        }).on('error', reject);
      });
      console.log('Backend is ready');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.warn('Backend did not become ready within timeout, continuing anyway');
}

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopPythonBackend();
});
