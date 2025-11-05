const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { spawn, execSync } = require('child_process');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
require('dotenv').config();

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

let backendProcess = null;
let authToken = null;

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
  const backendPath = getBackendPath();
  const backendEnv = { ...process.env };

  backendProcess = spawn(backendPath, [], { env: backendEnv });

  backendProcess.stdout.on('data', (data) => console.log(`Backend stdout: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`Backend stderr: ${data}`));
  backendProcess.on('close', (code) => console.log(`Backend process exited with code ${code}`));

  createWindow();
});

// --- IPC Handlers ---

// Auth
ipcMain.on('auth:set-token', (event, token) => { authToken = token; });
ipcMain.on('auth:clear-token', () => { authToken = null; });

// DB Schema
ipcMain.handle('db:createSchema', async (event, data) => {
  const response = await client.post('http://localhost:5000/api/db/schema', data);
  return response.data;
});

ipcMain.handle('db:clear', async (event, data) => {
  const response = await client.delete('http://localhost:5000/api/db/clear', { data });
  return response.data;
});

// Migration
ipcMain.on('migration:start', async (event) => {
  try {
    const response = await client.post('http://localhost:5000/api/migrate', {}, { responseType: 'stream' });
    response.data.on('data', (chunk) => {
      const message = chunk.toString();
      const lines = message.split('\n').filter(line => line.startsWith('data: '));
      for (const line of lines) {
        event.sender.send('migration:log', { type: 'log', message: line.replace('data: ', '') });
      }
    });
    response.data.on('end', () => {
      event.sender.send('migration:log', { type: 'complete', message: 'Migration stream complete.' });
    });
  } catch (error) {
    event.sender.send('migration:log', { type: 'error', message: `Migration failed: ${error.message}` });
  }
});

ipcMain.on('inventory-migration:start', async (event) => {
  try {
    const response = await client.post('http://localhost:5000/api/inventory_migrate', {}, { responseType: 'stream' });
    response.data.on('data', (chunk) => {
      const message = chunk.toString();
      const lines = message.split('\n').filter(line => line.startsWith('data: '));
      for (const line of lines) {
        event.sender.send('inventory-migration:log', { type: 'log', message: line.replace('data: ', '') });
      }
    });
    response.data.on('end', () => {
      event.sender.send('inventory-migration:log', { type: 'complete', message: 'Inventory migration stream complete.' });
    });
  } catch (error) {
    event.sender.send('inventory-migration:log', { type: 'error', message: `Inventory migration failed: ${error.message}` });
  }
});

// Reports & Rejection Trends
ipcMain.handle('rejection:loadData', async (event, data) => {
  const response = await client.post('http://localhost:5000/api/rejection_trends', data);
  return response.data;
});

ipcMain.handle('rejection:loadVendors', async () => {
  const response = await client.get('http://localhost:5000/api/vendors');
  return response.data;
});

ipcMain.handle('rejection:exportTrends', async (event, data) => {
    const response = await client.post('http://localhost:5000/api/rejection_trends/export', data, { responseType: 'arraybuffer' });
    return { blob: { data: response.data, type: response.headers['content-type'] }, fileName: `rejection_trends.csv` };
});

// Search
ipcMain.handle('search:loadFilterOptions', async () => {
  const response = await client.get('http://localhost:5000/api/search/filters');
  return response.data;
});

ipcMain.handle('db:addInventoryColumn', async () => {
  const response = await client.post('http://localhost:5000/api/db/add_inventory_column');
  return response.data;
});

ipcMain.handle('search:performSearch', async (event, data) => {
  const response = await client.post('http://localhost:5000/api/search', data);
  return response.data;
});

ipcMain.handle('search:exportSearchResults', async (event, data) => {
    const response = await client.post('http://localhost:5000/api/search/export', data, { responseType: 'arraybuffer' });
    return { blob: { data: response.data, type: response.headers['content-type'] }, fileName: 'search_results.csv' };
});

// App lifecycle
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (backendProcess) {
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /PID ${backendProcess.pid} /F /T`);
      } catch (e) {
        console.error(`Failed to kill backend process: ${e}`);
      }
    } else {
      backendProcess.kill();
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});