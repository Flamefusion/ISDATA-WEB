// src/store/thunks/dataThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { showAlert } from '../slices/uiSlice';

export const loadPreviewData = createAsyncThunk(
  'data/loadPreviewData',
  async (page = 1, { dispatch, getState, rejectWithValue }) => {
    try {
      const { session } = getState().auth;
      if (!session || !session.access_token) {
        return rejectWithValue('Authentication token is missing');
      }

      const response = await fetch(`http://localhost:5000/api/data?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();

      // Format dates for better display
      const formattedData = responseData.data.map(record => ({
        ...record,
        date: record.date ? new Date(record.date).toLocaleDateString() : '',
        created_at: record.created_at ? new Date(record.created_at).toLocaleString() : '',
        updated_at: record.updated_at ? new Date(record.updated_at).toLocaleString() : '',
      }));

      const payload = {
        data: formattedData,
        total: responseData.total,
      };
      
      dispatch(showAlert({ message: `Loaded ${formattedData.length} records`, type: 'success' }));
      return payload;

    } catch (error) {
      dispatch(showAlert({ message: `Failed to load preview data: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);