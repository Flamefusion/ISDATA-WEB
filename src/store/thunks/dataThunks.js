// src/store/thunks/dataThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { setPreviewData, setLoading, setError } from '../slices/dataSlice';
import { showAlert } from '../slices/uiSlice';

export const loadPreviewData = createAsyncThunk(
  'data/loadPreviewData',
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Format dates for better display
      const formattedData = data.map(record => ({
        ...record,
        date: record.date ? new Date(record.date).toLocaleDateString() : '',
        created_at: record.created_at ? new Date(record.created_at).toLocaleString() : '',
        updated_at: record.updated_at ? new Date(record.updated_at).toLocaleString() : '',
      }));

      dispatch(setPreviewData(formattedData));
      dispatch(showAlert({ message: `Loaded ${formattedData.length} records`, type: 'success' }));
      return formattedData;
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(showAlert({ message: `Failed to load preview data: ${error.message}`, type: 'error' }));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
