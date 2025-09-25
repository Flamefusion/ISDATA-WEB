// src/store/thunks/searchThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { showAlert } from '../slices/uiSlice';

export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (searchFilters, { dispatch, rejectWithValue }) => {
    try {
      const results = await window.api.performSearch(searchFilters);
      
      dispatch(showAlert({ 
        message: `Found ${results.length} matching records`, 
        type: 'success' 
      }));
      return results;
    } catch (error) {
      dispatch(showAlert({ message: `Search failed: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);

export const loadFilterOptions = createAsyncThunk(
  'search/loadFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const options = await window.api.loadSearchFilterOptions();
      return options;
    } catch (error) {
      console.error('Failed to load filter options:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const exportSearchResults = createAsyncThunk(
  'search/exportSearchResults',
  async (searchFilters, { dispatch, rejectWithValue }) => {
    try {
      const { blob, fileName } = await window.api.exportSearchResults(searchFilters);

      const url = window.URL.createObjectURL(new Blob([new Uint8Array(blob.data)], { type: blob.type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      dispatch(showAlert({ message: 'Search results exported successfully', type: 'success' }));

    } catch (error) {
      console.error('Export failed:', error);
      dispatch(showAlert({ message: `Export failed: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);