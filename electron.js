const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
require('dotenv').config(); // Load .env file

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let store;
let backendProcess = null;
let authToken = null; // Variable to hold the JWT

// Add an Axios interceptor to inject the token
client.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

function getBackendPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, 'backend', 'backend.exe');
  } else {
    return path.join(process.resourcesPath, 'backend.exe');
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
}

app.whenReady().then(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();

  const backendPath = getBackendPath();
  
  // Prepare environment for the backend process
  const backendEnv = {
    ...process.env,
    SECRET_KEY: process.env.SECRET_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  };

  backendProcess = spawn(backendPath, [], { env: backendEnv });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  createWindow();
});

// IPC Handlers for Auth
ipcMain.on('auth:set-token', (event, token) => {
  authToken = token;
});

ipcMain.on('auth:clear-token', () => {
  authToken = null;
});

// IPC Handlers for configuration
ipcMain.handle('config:save', (event, config) => {
  store.set('dbConfig', config);
});

ipcMain.handle('config:load', (event) => {
  return store.get('dbConfig');
});

// ... (rest of the IPC handlers)