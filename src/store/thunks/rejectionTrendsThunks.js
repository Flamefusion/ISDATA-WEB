// src/store/thunks/rejectionTrendsThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { showAlert } from '../slices/uiSlice';
import { apiFetch } from '../../utils/api';

export const loadRejectionData = createAsyncThunk(
  'rejectionTrends/loadRejectionData',
  async ({ dateFrom, dateTo, selectedVendor, rejectionStage }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiFetch('/api/reports/rejection-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo, vendor: selectedVendor, rejectionStage }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load rejection data');
      }
      
      const data = await response.json();
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
      const response = await apiFetch('/api/search/filters');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load vendors');
      }
      const options = await response.json();
      // For this tab, we don't want 'all' vendors, so we just return the list
      return options.vendors || [];
    } catch (error) {
      console.error('Failed to load vendors for trends tab:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const exportRejectionTrends = createAsyncThunk(
  'rejectionTrends/exportRejectionTrends',
  async ({ dateFrom, dateTo, selectedVendor, rejectionStage, format }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiFetch('/api/reports/rejection-trends/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo, vendor: selectedVendor, rejectionStage, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      a.download = `rejection_trends_${dateFrom}_to_${dateTo}_${selectedVendor}.${extension}`;
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