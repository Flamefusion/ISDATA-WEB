// src/store/slices/rejectionTrendsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { loadRejectionData, loadVendorsForTrends } from '../thunks/rejectionTrendsThunks';

const initialState = {
  dateFrom: '',
  dateTo: '',
  selectedVendor: '',
  rejectionStage: 'both',
  rejectionData: [],
  trendsData: null,
  isLoadingData: false,
  sortConfig: { key: 'total', direction: 'desc' },
  vendors: [],
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
    setSortConfig: (state, action) => {
      state.sortConfig = action.payload;
    },
    clearRejectionTrends: (state) => {
      state.rejectionData = [];
      state.trendsData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRejectionData.pending, (state) => {
        state.isLoadingData = true;
        state.error = null;
      })
      .addCase(loadRejectionData.fulfilled, (state, action) => {
        state.isLoadingData = false;
        state.rejectionData = action.payload.rejectionData;
        state.trendsData = action.payload.summary;
        // Update date range from payload if needed
        if (action.payload.dateRange) {
          state.trendsData.dateRange = action.payload.dateRange;
        }
      })
      .addCase(loadRejectionData.rejected, (state, action) => {
        state.isLoadingData = false;
        state.error = action.payload;
      })
      .addCase(loadVendorsForTrends.fulfilled, (state, action) => {
        state.vendors = action.payload;
        // Set a default vendor if one isn't already selected
        if (!state.selectedVendor && action.payload.length > 0) {
          state.selectedVendor = action.payload[0];
        }
      });
  },
});

export const {
  updateRejectionTrendsState,
  setSortConfig,
  clearRejectionTrends,
} = rejectionTrendsSlice.actions;

export default rejectionTrendsSlice.reducer;