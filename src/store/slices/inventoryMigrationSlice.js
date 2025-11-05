import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inventoryMigrationProgress: 0,
  inventoryMigrationLog: [],
  isInventoryMigrationRunning: false,
  inventoryMigrationError: null,
};

const inventoryMigrationSlice = createSlice({
  name: 'inventoryMigration',
  initialState,
  reducers: {
    setInventoryMigrationProgress: (state, action) => {
      state.inventoryMigrationProgress = action.payload;
    },
    addInventoryMigrationLog: (state, action) => {
      state.inventoryMigrationLog.push({ timestamp: new Date().toLocaleString(), message: action.payload });
    },
    setInventoryMigrationRunning: (state, action) => {
      state.isInventoryMigrationRunning = action.payload;
    },
    setInventoryMigrationError: (state, action) => {
      state.inventoryMigrationError = action.payload;
    },
    clearInventoryMigrationLog: (state) => {
      state.inventoryMigrationLog = [];
      state.inventoryMigrationError = null;
      state.inventoryMigrationProgress = 0;
    },
  },
});

export const {
  setInventoryMigrationProgress,
  addInventoryMigrationLog,
  setInventoryMigrationRunning,
  setInventoryMigrationError,
  clearInventoryMigrationLog,
} = inventoryMigrationSlice.actions;

export default inventoryMigrationSlice.reducer;
