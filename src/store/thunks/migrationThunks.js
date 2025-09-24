// src/store/thunks/migrationThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setMigrationProgress, 
  addMigrationLog, 
  setMigrationRunning, 
  setMigrationError,
  clearMigrationLog
} from '../slices/migrationSlice';
import { showAlert } from '../slices/uiSlice';

export const startMigration = createAsyncThunk(
  'migration/startMigration',
  async (config, { dispatch }) => {
    dispatch(clearMigrationLog());
    dispatch(setMigrationRunning(true));
    dispatch(addMigrationLog('Starting migration process...'));

    return new Promise((resolve, reject) => {
      window.api.onMigrationLog((logMessage) => {
        if (logMessage.type === 'log') {
          dispatch(addMigrationLog(logMessage.message));
          // Estimate progress based on key messages
          if (logMessage.message.includes('Connecting to Google API')) {
            dispatch(setMigrationProgress(10));
          } else if (logMessage.message.includes('Starting parallel data loading')) {
            dispatch(setMigrationProgress(20));
          } else if (logMessage.message.includes('Starting merge')) {
            dispatch(setMigrationProgress(50));
          } else if (logMessage.message.includes('Copying') && logMessage.message.includes('records to DB')) {
            dispatch(setMigrationProgress(70));
          } else if (logMessage.message.includes('Updating existing records')) {
            dispatch(setMigrationProgress(85));
          } else if (logMessage.message.includes('Inserting new records')) {
            dispatch(setMigrationProgress(95));
          } else if (logMessage.message.includes('Migration completed successfully!')) {
            dispatch(setMigrationProgress(100));
            dispatch(showAlert({ message: 'Migration completed successfully!', type: 'success' }));
          } else if (logMessage.message.includes('ERROR')) {
            dispatch(setMigrationError(logMessage.message));
            dispatch(showAlert({ message: 'Migration failed. Check logs for details.', type: 'error' }));
          }
        } else if (logMessage.type === 'error') {
          dispatch(setMigrationError(logMessage.message));
          dispatch(addMigrationLog(logMessage.message));
          dispatch(showAlert({ message: 'Migration failed. Check logs for details.', type: 'error' }));
          dispatch(setMigrationRunning(false));
          window.api.removeMigrationLogListener();
          reject(new Error(logMessage.message));
        } else if (logMessage.type === 'complete') {
          dispatch(setMigrationRunning(false));
          window.api.removeMigrationLogListener();
          resolve();
        }
      });

      window.api.startMigration(config);
    });
  }
);
