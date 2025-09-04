// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isDarkMode: false,
  isSettingsPanelOpen: false,
  customAlert: {
    show: false,
    message: '',
    type: 'success',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
    },
    toggleSettingsPanel: (state) => {
      state.isSettingsPanelOpen = !state.isSettingsPanelOpen;
    },
    closeSettingsPanel: (state) => {
      state.isSettingsPanelOpen = false;
    },
    showAlert: (state, action) => {
      const { message, type = 'success' } = action.payload;
      state.customAlert = {
        show: true,
        message,
        type,
      };
    },
    hideAlert: (state) => {
      state.customAlert.show = false;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSettingsPanel,
  closeSettingsPanel,
  showAlert,
  hideAlert,
} = uiSlice.actions;
export default uiSlice.reducer;