// src/store/thunks/reportThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { showAlert } from '../slices/uiSlice';

export const loadReport = createAsyncThunk(
  'report/loadReport',
  async ({ selectedDate, selectedVendor }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, vendor: selectedVendor }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load report');
      }
      
      const data = await response.json();
      dispatch(showAlert({ message: 'Report generated successfully', type: 'success' }));
      return data;
    } catch (error) {
      dispatch(showAlert({ message: `Failed to generate report: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);

export const loadVendors = createAsyncThunk(
  'report/loadVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/vendors');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load vendors');
      }
      const vendors = await response.json();
      return vendors;
    } catch (error) {
      console.error('Failed to load vendors:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const exportReport = createAsyncThunk(
  'report/exportReport',
  async ({ selectedDate, selectedVendor, format }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, vendor: selectedVendor, format }),
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
      a.download = `daily_report_${selectedDate}_${selectedVendor}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      dispatch(showAlert({ message: `Report exported as ${format.toUpperCase()} successfully`, type: 'success' }));
      return; // Indicate success
    } catch (error) {
      dispatch(showAlert({ message: `Export failed: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);
