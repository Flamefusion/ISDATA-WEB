import { createSlice } from '@reduxjs/toolkit';
import { performSearch, loadFilterOptions } from '../thunks/searchThunks';

const initialSearchFilters = {
  serialNumbers: '',
  moNumbers: '',
  dateFrom: '',
  dateTo: '',
  vendor: [],
  pcb: [],
  qccode: [],
  qcperson: [],
  vqcStatus: [],
  ftStatus: [],
  rejectionReason: [],
};

const initialState = {
  searchFilters: initialSearchFilters,
  searchResults: [],
  filterOptions: {
    vendors: [],
    pcbs: [],
    qccodes: [],
    qcpersons: [],
    vqc_statuses: [],
    ft_statuses: [],
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
    clearSearchFilters: (state) => {
      state.searchFilters = initialSearchFilters;
      state.searchResults = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(loadFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = action.payload;
      });
  },
});

export const { updateSearchFilters, clearSearchFilters } = searchSlice.actions;
export default searchSlice.reducer;
