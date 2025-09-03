// src/store/slices/configSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  serviceAccountFileName: '',
  serviceAccountContent: '',
  vendorDataUrl: '',
  vqcDataUrl: '',
  ftDataUrl: '',
  dbHost: 'localhost',
  dbPort: '5432',
  dbName: 'rings_db',
  dbUser: 'postgres',
  dbPassword: '',
  isLoading: false,
  connectionStatus: {
    sheets: null,
    db: null,
  },
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateConfig: (state, action) => {
      return { ...state, ...action.payload };
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setConnectionStatus: (state, action) => {
      const { type, status } = action.payload;
      state.connectionStatus[type] = status;
    },
    resetConfig: () => initialState,
  },
});

export const { updateConfig, setLoading, setConnectionStatus, resetConfig } = configSlice.actions;
export default configSlice.reducer;