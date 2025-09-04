// src/store/slices/reportSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { loadReport, loadVendors } from '../thunks/reportThunks';

const initialState = {
  reportData: null,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedVendor: 'all',
  vendors: ['all'],
  isLoading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setSelectedVendor: (state, action) => {
      state.selectedVendor = action.payload;
    },
    clearReport: (state) => {
      state.reportData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.reportData = null;
      })
      .addCase(loadReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reportData = action.payload;
      })
      .addCase(loadReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(loadVendors.fulfilled, (state, action) => {
        state.vendors = action.payload;
      });
  },
});

export const {
  setSelectedDate,
  setSelectedVendor,
  clearReport,
} = reportSlice.actions;

export default reportSlice.reducer;