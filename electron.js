const { app, BrowserWindow, ipcMain } = require('electron');
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

// IPC Handlers
ipcMain.handle('sheets:test', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/test_sheets_connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Backend error');
    }
    return result;
  } catch (error) {
    console.error('Error in sheets:test IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('db:test', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/db/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Backend error');
    }
    return result;
  } catch (error) {
    console.error('Error in db:test IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('db:createSchema', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/db/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Backend error');
    }
    return result;
  } catch (error) {
    console.error('Error in db:createSchema IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('db:clear', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/db/clear', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Backend error');
    }
    return result;
  } catch (error) {
    console.error('Error in db:clear IPC handler:', error);
    throw error;
  }
});

ipcMain.on('migration:start', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      event.sender.send('migration:log', { type: 'error', message: errorData.error || `Migration start failed with status: ${response.status}` });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        event.sender.send('migration:log', { type: 'complete', message: 'Migration stream complete.' });
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const message = line.replace('data: ', '');
        event.sender.send('migration:log', { type: 'log', message: message });
      }
    }
  } catch (error) {
    console.error('Error in migration:start IPC handler:', error);
    event.sender.send('migration:log', { type: 'error', message: `Migration failed: ${error.message}` });
  }
});

ipcMain.handle('rejection:loadData', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/rejection_trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Backend error');
    }
    return result;
  } catch (error) {
    console.error('Error in rejection:loadData IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('rejection:loadVendors', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/vendors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Backend error');
    }
    return result;
  } catch (error) {
    console.error('Error in rejection:loadVendors IPC handler:', error);
    throw error;
  }
});

ipcMain.handle('rejection:exportTrends', async (event, data) => {
  try {
    const response = await fetch('http://localhost:5000/api/reports/rejection-trends/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Export failed');
    }

    const blob = await response.blob();
    const fileName = `rejection_trends_${data.dateFrom}_to_${data.dateTo}_${data.selectedVendor}.${data.format === 'excel' ? 'xlsx' : 'csv'}`;
    const fileType = blob.type;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      blob: {
        data: buffer,
        type: fileType,
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