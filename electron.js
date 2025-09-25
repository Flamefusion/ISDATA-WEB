const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');
const axios = require('axios');

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

function getScriptPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, 'run.py');
  } else {
    return path.join(process.resourcesPath, 'run.py');
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

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  const pythonExecutable = getPythonExecutable();
  const scriptPath = getScriptPath();
  const cwd = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath;
  const env = { ...process.env, PYTHONPATH: cwd };

  pythonProcess = spawn(pythonExecutable, [scriptPath], { cwd, env });

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

ipcMain.handle('db:test', async (event, data) => {
  try {
    const response = await axios.post('http://localhost:5000/api/db/test', data);
    return response.data;
  } catch (error) {
    console.error('Error in db:test IPC handler:', error);
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
    const response = await axios.post('http://localhost:5000/api/reports/rejection-trends/export', data, {
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