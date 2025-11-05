import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setInventoryMigrationProgress,
  addInventoryMigrationLog,
  setInventoryMigrationRunning,
  setInventoryMigrationError,
  clearInventoryMigrationLog
} from '../slices/inventoryMigrationSlice';
import { showAlert } from '../slices/uiSlice';

export const startInventoryMigration = createAsyncThunk(
  'inventoryMigration/startInventoryMigration',
  async (_, { dispatch }) => {
    dispatch(clearInventoryMigrationLog());
    dispatch(setInventoryMigrationRunning(true));
    dispatch(addInventoryMigrationLog('Starting inventory migration process...'));

    return new Promise((resolve, reject) => {
      window.api.onInventoryMigrationLog((logMessage) => {
        if (logMessage.type === 'log') {
          dispatch(addInventoryMigrationLog(logMessage.message));
          // Estimate progress based on key messages
          if (logMessage.message.includes('Connecting to Google API')) {
            dispatch(setInventoryMigrationProgress(10));
          } else if (logMessage.message.includes('Connected to Inventory Status Google Sheet')) {
            dispatch(setInventoryMigrationProgress(30));
          } else if (logMessage.message.includes('Processed') && logMessage.message.includes('unique serial numbers')) {
            dispatch(setInventoryMigrationProgress(50));
          } else if (logMessage.message.includes('Prepared') && logMessage.message.includes('updates and') && logMessage.message.includes('inserts')) {
            dispatch(setInventoryMigrationProgress(70));
          } else if (logMessage.message.includes('All updates completed successfully.') || logMessage.message.includes('All inserts completed successfully.')) {
            dispatch(setInventoryMigrationProgress(90));
          } else if (logMessage.message.includes('Inventory migration completed successfully!')) {
            dispatch(setInventoryMigrationProgress(100));
            dispatch(showAlert({ message: 'Inventory migration completed successfully!', type: 'success' }));
          } else if (logMessage.message.includes('ERROR')) {
            dispatch(setInventoryMigrationError(logMessage.message));
            dispatch(showAlert({ message: 'Inventory migration failed. Check logs for details.', type: 'error' }));
          }
        } else if (logMessage.type === 'error') {
          dispatch(setInventoryMigrationError(logMessage.message));
          dispatch(addInventoryMigrationLog(logMessage.message));
          dispatch(showAlert({ message: 'Inventory migration failed. Check logs for details.', type: 'error' }));
          dispatch(setInventoryMigrationRunning(false));
          window.api.removeInventoryMigrationLogListener();
          reject(new Error(logMessage.message));
        } else if (logMessage.type === 'complete') {
          dispatch(setInventoryMigrationRunning(false));
          window.api.removeInventoryMigrationLogListener();
          resolve();
        }
      });

      window.api.startInventoryMigration();
    });
  }
);
