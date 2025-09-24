const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

let pythonProcess = null;

function getPythonExecutable() {
  let pythonPath;
  if (process.env.NODE_ENV === 'development') {
    // In development, __dirname is the project root
    if (process.platform === 'win32') {
      pythonPath = path.join(__dirname, 'python-portable', 'python.exe');
    }
    else {
      pythonPath = path.join(__dirname, 'python-portable', 'python');
    }
  }
  else {
    // In production, extraResources are copied to the resources directory
    if (process.platform === 'win32') {
      pythonPath = path.join(process.resourcesPath, 'python-portable', 'python.exe');
    }
    else {
      pythonPath = path.join(process.resourcesPath, 'python-portable', 'python');
    }
  }
  return pythonPath;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, './dist/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  const pythonExecutable = getPythonExecutable();
  const scriptPath = path.join(__dirname, 'run.py');
  pythonProcess = spawn(pythonExecutable, [scriptPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});