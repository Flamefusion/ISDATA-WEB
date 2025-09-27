const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const axios = require('axios');

let store;
let backendProcess = null;

function getBackendPath() {
  if (process.env.NODE_ENV === 'development') {
    // In development, expect backend.exe in a 'backend' subfolder of the project root
    return path.join(__dirname, 'backend', 'backend.exe');
  } else {
    // In production, electron-builder moves extraResources to the 'resources' directory
    return path.join(process.resourcesPath, 'backend.exe');
  }
}

function createWindow() {
  console.log('Creating main window...');
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

  console.log(`Loading URL: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    console.log('Main window closed.');
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  console.log('App is ready.');
  const Store = (await import('electron-store')).default;
  store = new Store();

  const backendPath = getBackendPath();
  console.log(`Spawning backend process from: ${backendPath}`);
  backendProcess = spawn(backendPath);

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

// IPC Handlers for configuration
ipcMain.handle('config:save', (event, config) => {
  store.set('dbConfig', config);
});

ipcMain.handle('config:load', (event) => {
  return store.get('dbConfig');
});

// IPC Handlers
ipcMain.handle('sheets:test', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/test_sheets_connection', data);
    return response.data;
  } catch (error) {
    console.error('Error in sheets:test IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('db:connect', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/db/connect', data);
    return response.data;
  } catch (error) {
    console.error('Error in db:connect IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('db:createSchema', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/db/schema', data);
    return response.data;
  } catch (error) {
    console.error('Error in db:createSchema IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('db:clear', async (event, data) => {
  try {
    const response = await axios.delete('http://localhost:5000/api/db/clear', { data });
    return response.data;
  } catch (error) {
    console.error('Error in db:clear IPC handler:', error);
    throw error;
  }
});

ipcMain.on('migration:start', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/migrate', data, {
      responseType: 'stream'
    });

    response.data.on('data', (chunk) => {
      const message = chunk.toString();
      const lines = message.split('\n').filter(line => line.startsWith('data: '));
      for (const line of lines) {
        const message = line.replace('data: ', '');
        event.sender.send('migration:log', { type: 'log', message: message });
      }
    });

    response.data.on('end', () => {
      event.sender.send('migration:log', { type: 'complete', message: 'Migration stream complete.' });
    });

  } catch (error) {
    console.error('Error in migration:start IPC handler:', error);
    event.sender.send('migration:log', { type: 'error', message: `Migration failed: ${error.message}` });
  }
});

ipcMain.handle('rejection:loadData', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/rejection_trends', data);
    return response.data;
  } catch (error) {
    console.error('Error in rejection:loadData IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('rejection:loadVendors', async (event, data) => {
  try {
    const response = await axios.get('http://localhost:5000/api/vendors');
    return response.data;
  } catch (error) {
    console.error('Error in rejection:loadVendors IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('rejection:exportTrends', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/rejection_trends/export', data, {
      responseType: 'arraybuffer'
    });

    const fileName = `rejection_trends_${data.dateFrom}_to_${data.dateTo}_${data.selectedVendor}.${data.format === 'excel' ? 'xlsx' : 'csv'}`;
    
    return {
      blob: {
        data: response.data,
        type: response.headers['content-type'],
      },
      fileName: fileName,
    };
  } catch (error) {
    console.error('Error in rejection:exportTrends IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('search:loadFilterOptions', async (event) => {
  try {
    const response = await axios.get('http://localhost:5000/api/search/filters');
    return response.data;
  } catch (error) {
    console.error('Error in search:loadFilterOptions IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('search:performSearch', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/search', data);
    return response.data;
  } catch (error) {
    console.error('Error in search:performSearch IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('search:exportSearchResults', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/search/export', data, {
      responseType: 'arraybuffer'
    });

    const fileName = `search_results_${data.dateFrom}_to_${data.dateTo}.csv`; // Adjust filename as needed
    
    return {
      blob: {
        data: response.data,
        type: response.headers['content-type'],
      },
      fileName: fileName,
    };
  } catch (error) {
    console.error('Error in search:exportSearchResults IPC handler:', error);
    throw error;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});