/ src/store/thunks/searchThunks.js
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
      
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      dispatch(setSearchResults(results));
      dispatch(showAlert({ 
        message: `Found ${results.length} matching records`, 
        type: 'success' 
      }));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(showAlert({ message: 'Search failed', type: 'error' }));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const loadFilterOptions = createAsyncThunk(
  'search/loadFilterOptions',
  async (_, { dispatch }) => {
    try {
      const response = await fetch('/api/filter-options');
      if (!response.ok) throw new Error('Failed to load filter options');
      
      const options = await response.json();
      dispatch(setFilterOptions(options));
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }
);
