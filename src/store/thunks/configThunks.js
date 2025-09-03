
// src/store/thunks/configThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setConnectionStatus } from '../slices/configSlice';
import { showAlert } from '../slices/uiSlice';

export const testSheetsConnection = createAsyncThunk(
  'config/testSheetsConnection',
  async (config, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      // Your sheets connection test logic here
      const response = await fetch('/api/test-sheets-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        dispatch(setConnectionStatus({ type: 'sheets', status: 'success' }));
        dispatch(showAlert({ message: 'Sheets connection successful!', type: 'success' }));
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      dispatch(setConnectionStatus({ type: 'sheets', status: 'error' }));
      dispatch(showAlert({ message: 'Sheets connection failed', type: 'error' }));
      console.error('Sheets connection error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const testDbConnection = createAsyncThunk(
  'config/testDbConnection',
  async (config, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      // Your DB connection test logic here
      const response = await fetch('/api/test-db-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        dispatch(setConnectionStatus({ type: 'db', status: 'success' }));
        dispatch(showAlert({ message: 'Database connection successful!', type: 'success' }));
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      dispatch(setConnectionStatus({ type: 'db', status: 'error' }));
      dispatch(showAlert({ message: 'Database connection failed', type: 'error' }));
      console.error('DB connection error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }
);