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
import { apiFetch } from '../../utils/api';

export const startMigration = createAsyncThunk(
  'migration/startMigration',
  async (config, { dispatch }) => {
    dispatch(clearMigrationLog());
    dispatch(setMigrationRunning(true));
    dispatch(addMigrationLog('Starting migration process...'));

    try {
      const response = await apiFetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceAccountContent: config.serviceAccountContent,
          vendorDataUrl: config.vendorDataUrl,
          vqcDataUrl: config.vqcDataUrl,
          ftDataUrl: config.ftDataUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Migration start failed with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const message = line.replace('data: ', '');
          dispatch(addMigrationLog(message));

          // Estimate progress based on key messages
          if (message.includes('Connecting to Google API')) {
            dispatch(setMigrationProgress(10));
          } else if (message.includes('Starting parallel data loading')) {
            dispatch(setMigrationProgress(20));
          } else if (message.includes('Starting merge')) {
            dispatch(setMigrationProgress(50));
          } else if (message.includes('Copying') && message.includes('records to DB')) {
            dispatch(setMigrationProgress(70));
          } else if (message.includes('Updating existing records')) {
            dispatch(setMigrationProgress(85));
          } else if (message.includes('Inserting new records')) {
            dispatch(setMigrationProgress(95));
          } else if (message.includes('Migration completed successfully!')) {
            dispatch(setMigrationProgress(100));
            dispatch(showAlert({ message: 'Migration completed successfully!', type: 'success' }));
          } else if (message.includes('ERROR')) {
            dispatch(setMigrationError(message));
            dispatch(showAlert({ message: 'Migration failed. Check logs for details.', type: 'error' }));
          }
        }
      }
    } catch (error) {
      const errorMessage = `Migration failed: ${error.message}`;
      dispatch(setMigrationError(errorMessage));
      dispatch(addMigrationLog(errorMessage));
      dispatch(showAlert({ message: 'Migration failed. Check logs for details.', type: 'error' }));
      throw error;
    } finally {
      dispatch(setMigrationRunning(false));
    }
  }
);