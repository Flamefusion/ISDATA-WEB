// src/store/thunks/inventoryStatusThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { showAlert } from '../slices/uiSlice';

export const fetchInventoryStatus = createAsyncThunk(
  'inventoryStatus/fetchInventoryStatus',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await window.api.fetchInventoryStatus();
      dispatch(showAlert({ 
        message: 'Inventory status loaded successfully', 
        type: 'success' 
      }));
      return data;
    } catch (error) {
      dispatch(showAlert({ message: `Failed to load inventory status: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);

export const exportInventoryStatus = createAsyncThunk(
  'inventoryStatus/exportInventoryStatus',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { blob, fileName } = await window.api.exportInventoryStatus();
      const url = window.URL.createObjectURL(new Blob([new Uint8Array(blob.data)], { type: blob.type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      dispatch(showAlert({ message: `Inventory status exported as CSV successfully`, type: 'success' }));
      return; // Indicate success
    } catch (error) {
      dispatch(showAlert({ message: `Export failed: ${error.message}`, type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);
