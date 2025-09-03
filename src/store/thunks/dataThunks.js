// src/store/thunks/dataThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { setPreviewData, setLoading, setError } from '../slices/dataSlice';
import { showAlert } from '../slices/uiSlice';

export const loadPreviewData = createAsyncThunk(
  'data/loadPreviewData',
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/preview-data');
      if (!response.ok) throw new Error('Failed to load preview data');
      
      const data = await response.json();
      dispatch(setPreviewData(data));
      dispatch(showAlert({ message: `Loaded ${data.length} records`, type: 'success' }));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(showAlert({ message: 'Failed to load preview data', type: 'error' }));
    } finally {
      dispatch(setLoading(false));
    }
  }
);
