// src/store/slices/reportSlice.js
import { createSlice } from '@reduxjs/toolkit';

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
    setReportData: (state, action) => {
      state.reportData = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setSelectedVendor: (state, action) => {
      state.selectedVendor = action.payload;
    },
    setVendors: (state, action) => {
      state.vendors = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearReport: (state) => {
      state.reportData = null;
      state.error = null;
    },
    loadReport: (state) => {
      state.isLoading = true;
      state.error = null;
    },
  },
});

export const {
  setReportData,
  setSelectedDate,
  setSelectedVendor,
  setVendors,
  setLoading,
  setError,
  clearReport,
  loadReport,
} = reportSlice.actions;
export default reportSlice.reducer;