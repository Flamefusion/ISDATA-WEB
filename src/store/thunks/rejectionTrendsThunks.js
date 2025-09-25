// src/store/thunks/rejectionTrendsThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { showAlert } from '../slices/uiSlice';

export const loadRejectionData = createAsyncThunk(
  'rejectionTrends/loadRejectionData',
  async ({ dateFrom, dateTo, vendor, rejectionStage }, { dispatch, rejectWithValue }) => {
    try {
      const data = await window.api.loadRejectionData({ dateFrom, dateTo, vendor, rejectionStage });
      
      dispatch(showAlert({ 
        message: 'Rejection trends data loaded successfully', 
        type: 'success' 
      }));
      return data;
    } catch (error) {
      dispatch(showAlert({ message: `Failed to load rejection trends: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);

export const loadVendorsForTrends = createAsyncThunk(
  'rejectionTrends/loadVendors',
  async (_, { rejectWithValue }) => {
    try {
      const vendors = await window.api.loadVendorsForTrends();
      // For this tab, we don't want 'all' vendors, so we filter it out.
      return vendors.filter(vendor => vendor !== 'all');
    } catch (error) {
      console.error('Failed to load vendors for trends tab:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const exportRejectionTrends = createAsyncThunk(
  'rejectionTrends/exportRejectionTrends',
  async ({ dateFrom, dateTo, vendor, rejectionStage, format }, { dispatch, rejectWithValue }) => {
    try {
      const { blob, fileName } = await window.api.exportRejectionTrends({ dateFrom, dateTo, vendor, rejectionStage, format });
      const url = window.URL.createObjectURL(new Blob([new Uint8Array(blob.data)], { type: blob.type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      dispatch(showAlert({ message: `Rejection trends exported as ${format.toUpperCase()} successfully`, type: 'success' }));
      return; // Indicate success
    } catch (error) {
      dispatch(showAlert({ message: `Export failed: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);
