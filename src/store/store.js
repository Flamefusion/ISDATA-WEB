// src/store/store.js - COMPLETE VERSION
import { configureStore } from '@reduxjs/toolkit';
import configReducer from './slices/configSlice.js';
import dataReducer from './slices/dataSlice.js';
import reportReducer from './slices/reportSlice.js';
import searchReducer from './slices/searchSlice.js';
import migrationReducer from './slices/migrationSlice.js';
import rejectionTrendsReducer from './slices/rejectionTrendsSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    config: configReducer,
    data: dataReducer,
    report: reportReducer,
    search: searchReducer,
    migration: migrationReducer,
    rejectionTrends: rejectionTrendsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});