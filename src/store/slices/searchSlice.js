// src/store/slices/searchSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialSearchFilters = {
  serialNumbers: '',
  moNumbers: '',
  dateFrom: '',
  dateTo: '',
  vendor: [],
  vqcStatus: [],
  ftStatus: [],
  rejectionReason: [],
};

const initialState = {
  searchFilters: initialSearchFilters,
  searchResults: [],
  filterOptions: {
    vendors: [],
    vqc_statuses: ['Pass', 'Fail'],
    ft_statuses: ['Pass', 'Fail'],
    reasons: [],
  },
  isLoading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    updateSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setFilterOptions: (state, action) => {
      state.filterOptions = { ...state.filterOptions, ...action.payload };
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearSearchFilters: (state) => {
      state.searchFilters = initialSearchFilters;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.error = null;
    },
    performSearch: (state) => {
      state.isLoading = true;
      state.error = null;
    },
  },
});

export const {
  updateSearchFilters,
  setSearchResults,
  setFilterOptions,
  setLoading,
  setError,
  clearSearchFilters,
  clearSearchResults,
  performSearch,
} = searchSlice.actions;
export default searchSlice.reducer;
