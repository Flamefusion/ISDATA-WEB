// src/store/thunks/rejectionTrendsThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setRejectionData, 
  setTrendsData, 
  setVendors, 
  setLoading, 
  setError 
} from '../slices/rejectionTrendsSlice';
import { showAlert } from '../slices/uiSlice';

export const loadRejectionData = createAsyncThunk(
  'rejectionTrends/loadRejectionData',
  async ({ dateFrom, dateTo, selectedVendor, rejectionStage }, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/rejection-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo, selectedVendor, rejectionStage }),
      });
      
      if (!response.ok) throw new Error('Failed to load rejection data');
      
      const { rejectionData, trendsData } = await response.json();
      dispatch(setRejectionData(rejectionData));
      dispatch(setTrendsData(trendsData));
      dispatch(showAlert({ 
        message: 'Rejection trends data loaded successfully', 
        type: 'success' 
      }));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(showAlert({ message: 'Failed to load rejection trends', type: 'error' }));
    } finally {
      dispatch(setLoading(false));
    }
  }
);