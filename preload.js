// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process (your React app)
contextBridge.exposeInMainWorld('api', {
  // Auth
  setAuthToken: (token) => ipcRenderer.send('auth:set-token', token),
  clearAuthToken: () => ipcRenderer.send('auth:clear-token'),

  // Config
  saveConfig: (data) => ipcRenderer.invoke('config:save', data),
  loadConfig: () => ipcRenderer.invoke('config:load'),

  // The function your React app will call
  testSheetsConnection: (data) => ipcRenderer.invoke('sheets:test', data),
  createSchema: (data) => ipcRenderer.invoke('db:createSchema', data),
  clearDatabase: (data) => ipcRenderer.invoke('db:clear', data),
  startMigration: (data) => ipcRenderer.send('migration:start', data),
  onMigrationLog: (callback) => ipcRenderer.on('migration:log', (event, message) => callback(message)),
  removeMigrationLogListener: () => ipcRenderer.removeAllListeners('migration:log'),
  startInventoryMigration: (data) => ipcRenderer.send('inventory-migration:start', data),
  onInventoryMigrationLog: (callback) => ipcRenderer.on('inventory-migration:log', (event, message) => callback(message)),
  removeInventoryMigrationLogListener: () => ipcRenderer.removeAllListeners('inventory-migration:log'),
  loadRejectionData: (data) => ipcRenderer.invoke('rejection:loadData', data),
  loadVendorsForTrends: () => ipcRenderer.invoke('rejection:loadVendors'),
  exportRejectionTrends: (data) => ipcRenderer.invoke('rejection:exportTrends', data),
  fetchInventoryStatus: () => ipcRenderer.invoke('inventory:fetchStatus'),
  exportInventoryStatus: () => ipcRenderer.invoke('inventory:exportStatus'),
  loadSearchFilterOptions: () => ipcRenderer.invoke('search:loadFilterOptions'),
  performSearch: (data) => ipcRenderer.invoke('search:performSearch', data),
  exportSearchResults: (data) => ipcRenderer.invoke('search:exportSearchResults', data),
  addInventoryColumn: () => ipcRenderer.invoke('db:addInventoryColumn'),
  // You can add other functions here for other backend calls
});