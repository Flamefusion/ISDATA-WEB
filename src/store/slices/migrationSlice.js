// src/store/slices/migrationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  migrationProgress: 0,
  migrationLog: [],
  isRunning: false,
  error: null,
};

const migrationSlice = createSlice({
  name: 'migration',
  initialState,
  reducers: {
    setMigrationProgress: (state, action) => {
      state.migrationProgress = action.payload;
    },
    addMigrationLog: (state, action) => {
      state.migrationLog.push({
        message: action.payload,
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      });
    },
    setMigrationRunning: (state, action) => {
      state.isRunning = action.payload;
    },
    setMigrationError: (state, action) => {
      state.error = action.payload;
    },
    clearMigrationLog: (state) => {
      state.migrationLog = [];
      state.migrationProgress = 0;
      state.error = null;
    },
    startMigration: (state) => {
      state.isRunning = true;
      state.migrationProgress = 0;
      state.error = null;
      state.migrationLog.push({
        message: 'Migration started',
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      });
    },
  },
});

export const {
  setMigrationProgress,
  addMigrationLog,
  setMigrationRunning,
  setMigrationError,
  clearMigrationLog,
  startMigration,
} = migrationSlice.actions;
export default migrationSlice.reducer;
