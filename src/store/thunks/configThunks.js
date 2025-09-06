// src/store/thunks/configThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setConnectionStatus } from '../slices/configSlice';
import { showAlert } from '../slices/uiSlice';
import { apiFetch } from '../../utils/api';

export const testSheetsConnection = createAsyncThunk(
  'config/testSheetsConnection',
  async (config, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await apiFetch('/api/test_sheets_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceAccountContent: config.serviceAccountContent,
          vendorDataUrl: config.vendorDataUrl,
          vqcDataUrl: config.vqcDataUrl,
          ftDataUrl: config.ftDataUrl,
        }),
      });
      
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        dispatch(setConnectionStatus({ type: 'sheets', status: 'success' }));
        dispatch(showAlert({ message: 'Sheets connection successful!', type: 'success' }));
        return result;
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      dispatch(setConnectionStatus({ type: 'sheets', status: 'error' }));
      dispatch(showAlert({ message: `Sheets connection failed: ${error.message}`, type: 'error' }));
      console.error('Sheets connection error:', error);
      throw error;
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
      const response = await apiFetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: config.dbHost,
          dbPort: config.dbPort,
          dbName: config.dbName,
          dbUser: config.dbUser,
          dbPassword: config.dbPassword,
        }),
      });
      
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        dispatch(setConnectionStatus({ type: 'db', status: 'success' }));
        dispatch(showAlert({ message: 'Database connection successful!', type: 'success' }));
        return result;
      } else {
        throw new Error(result.message || 'Database connection failed');
      }
    } catch (error) {
      dispatch(setConnectionStatus({ type: 'db', status: 'error' }));
      dispatch(showAlert({ message: `Database connection failed: ${error.message}`, type: 'error' }));
      console.error('DB connection error:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const createSchema = createAsyncThunk(
  'config/createSchema',
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await apiFetch('/api/db/schema', {
        method: 'POST',
      });
      
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        dispatch(showAlert({ message: 'Schema created successfully!', type: 'success' }));
        console.log('Schema creation logs:', result.logs);
        return result;
      } else {
        throw new Error(result.message || 'Schema creation failed');
      }
    } catch (error) {
      dispatch(showAlert({ message: `Schema creation failed: ${error.message}`, type: 'error' }));
      console.error('Schema creation error:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const clearDatabase = createAsyncThunk(
  'config/clearDatabase',
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await apiFetch('/api/db/clear', {
        method: 'DELETE',
      });
      
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        dispatch(showAlert({ message: 'Database cleared successfully!', type: 'success' }));
        return result;
      } else {
        throw new Error(result.message || 'Database clear failed');
      }
    } catch (error) {
      dispatch(showAlert({ message: `Database clear failed: ${error.message}`, type: 'error' }));
      console.error('Database clear error:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);