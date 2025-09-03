// src/store/slices/rejectionTrendsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dateFrom: '',
  dateTo: '',
  selectedVendor: 'all',
  rejectionStage: 'both',
  rejectionData: [],
  trendsData: null,
  isLoadingData: false,
  sortConfig: { key: null, direction: 'asc' },
  vendors: ['all'],
  error: null,
};

const rejectionTrendsSlice = createSlice({
  name: 'rejectionTrends',
  initialState,
  reducers: {
    updateRejectionTrendsState: (state, action) => {
      const { key, value } = action.payload;
      state[key] = value;
    },
    setRejectionData: (state, action) => {
      state.rejectionData = action.payload;
    },
    setTrendsData: (state, action) => {
      state.trendsData = action.payload;
    },
    setVendors: (state, action) => {
      state.vendors = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoadingData = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSortConfig: (state, action) => {
      state.sortConfig = action.payload;
    },
    clearRejectionTrends: (state) => {
      state.rejectionData = [];
      state.trendsData = null;
      state.error = null;
    },
    loadRejectionData: (state) => {
      state.isLoadingData = true;
      state.error = null;
    },
  },
});

export const {
  updateRejectionTrendsState,
  setRejectionData,
  setTrendsData,
  setVendors,
  setLoading,
  setError,
  setSortConfig,
  clearRejectionTrends,
  loadRejectionData,
} = rejectionTrendsSlice.actions;
export default rejectionTrendsSlice.reducer;