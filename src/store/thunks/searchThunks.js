// src/store/thunks/searchThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setSearchResults, 
  setFilterOptions, 
  setLoading, 
  setError 
} from '../slices/searchSlice';
import { showAlert } from '../slices/uiSlice';

export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (searchFilters, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchFilters),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }
      
      const results = await response.json();
      dispatch(setSearchResults(results));
      dispatch(showAlert({ 
        message: `Found ${results.length} matching records`, 
        type: 'success' 
      }));
      return results;
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(showAlert({ message: `Search failed: ${error.message}`, type: 'error' }));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const loadFilterOptions = createAsyncThunk(
  'search/loadFilterOptions',
  async (_, { dispatch }) => {
    try {
      const response = await fetch('/api/search/filters');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load filter options');
      }
      
      const options = await response.json();
      dispatch(setFilterOptions(options));
      return options;
    } catch (error) {
      console.error('Failed to load filter options:', error);
      dispatch(showAlert({ message: `Failed to load filter options: ${error.message}`, type: 'error' }));
      throw error;
    }
  }
);

export const exportSearchResults = createAsyncThunk(
  'search/exportSearchResults',
  async (searchFilters, { dispatch }) => {
    try {
      const response = await fetch('/api/search/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchFilters),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      dispatch(showAlert({ message: 'Search results exported successfully', type: 'success' }));

    } catch (error) {
      console.error('Export failed:', error);
      dispatch(showAlert({ message: `Export failed: ${error.message}`, type: 'error' }));
      throw error;
    }
  }
);
