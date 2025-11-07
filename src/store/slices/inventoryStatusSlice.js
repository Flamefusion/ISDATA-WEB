// src/store/slices/inventoryStatusSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchInventoryStatus } from '../thunks/inventoryStatusThunks';

const initialState = {
  inventoryData: null,
  isLoading: false,
  error: null,
};

const inventoryStatusSlice = createSlice({
  name: 'inventoryStatus',
  initialState,
  reducers: {
    clearInventoryStatus: (state) => {
      state.inventoryData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventoryData = action.payload;
      })
      .addCase(fetchInventoryStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearInventoryStatus } = inventoryStatusSlice.actions;

export default inventoryStatusSlice.reducer;
