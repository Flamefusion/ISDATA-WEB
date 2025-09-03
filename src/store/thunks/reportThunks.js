// src/store/thunks/reportThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setReportData, 
  setVendors, 
  setLoading, 
  setError 
} from '../slices/reportSlice';
import { showAlert } from '../slices/uiSlice';

export const loadReport = createAsyncThunk(
  'report/loadReport',
  async ({ selectedDate, selectedVendor }, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, vendor: selectedVendor }),
      });
      
      if (!response.ok) throw new Error('Failed to load report');
      
      const data = await response.json();
      dispatch(setReportData(data));
      dispatch(showAlert({ message: 'Report generated successfully', type: 'success' }));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(showAlert({ message: 'Failed to generate report', type: 'error' }));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const loadVendors = createAsyncThunk(
  'report/loadVendors',
  async (_, { dispatch }) => {
    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) throw new Error('Failed to load vendors');
      
      const vendors = await response.json();
      dispatch(setVendors(vendors));
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  }
);