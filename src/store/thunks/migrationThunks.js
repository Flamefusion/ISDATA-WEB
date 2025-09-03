// src/store/thunks/migrationThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setMigrationProgress, 
  addMigrationLog, 
  setMigrationRunning, 
  setMigrationError 
} from '../slices/migrationSlice';
import { showAlert } from '../slices/uiSlice';

export const startMigration = createAsyncThunk(
  'migration/startMigration',
  async (_, { dispatch }) => {
    dispatch(setMigrationRunning(true));
    dispatch(addMigrationLog('Migration started'));
    
    try {
      // Simulate migration progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        dispatch(setMigrationProgress(i));
        dispatch(addMigrationLog(`Migration progress: ${i}%`));
      }
      
      dispatch(addMigrationLog('Migration completed successfully'));
      dispatch(showAlert({ message: 'Migration completed!', type: 'success' }));
    } catch (error) {
      dispatch(setMigrationError(error.message));
      dispatch(addMigrationLog(`Migration failed: ${error.message}`));
      dispatch(showAlert({ message: 'Migration failed', type: 'error' }));
    } finally {
      dispatch(setMigrationRunning(false));
    }
  }
);