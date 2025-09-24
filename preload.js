// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (your React app)
contextBridge.exposeInMainWorld('api', {
  // The function your React app will call
  testSheetsConnection: (data) => ipcRenderer.invoke('sheets:test', data),
  testDbConnection: (data) => ipcRenderer.invoke('db:test', data),
  createSchema: (data) => ipcRenderer.invoke('db:createSchema', data),
  clearDatabase: (data) => ipcRenderer.invoke('db:clear', data),
  startMigration: (data) => ipcRenderer.send('migration:start', data),
  onMigrationLog: (callback) => ipcRenderer.on('migration:log', (event, message) => callback(message)),
  removeMigrationLogListener: () => ipcRenderer.removeAllListeners('migration:log'),
  loadRejectionData: (data) => ipcRenderer.invoke('rejection:loadData', data),
  loadVendorsForTrends: () => ipcRenderer.invoke('rejection:loadVendors'),
  exportRejectionTrends: (data) => ipcRenderer.invoke('rejection:exportTrends', data),
  // You can add other functions here for other backend calls
});