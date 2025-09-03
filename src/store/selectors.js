// src/store/selectors.js
// Memoized selectors for better performance

// Config selectors
export const selectConfig = (state) => state.config;
export const selectConfigLoading = (state) => state.config.isLoading;
export const selectConnectionStatus = (state) => state.config.connectionStatus;

// Data selectors
export const selectPreviewData = (state) => state.data.previewData;
export const selectDataLoading = (state) => state.data.isLoading;
export const selectDataError = (state) => state.data.error;

// Report selectors
export const selectReportData = (state) => state.report.reportData;
export const selectReportParams = (state) => ({
  selectedDate: state.report.selectedDate,
  selectedVendor: state.report.selectedVendor,
});
export const selectReportVendors = (state) => state.report.vendors;
export const selectReportLoading = (state) => state.report.isLoading;
export const selectReportError = (state) => state.report.error;

// Search selectors
export const selectSearchFilters = (state) => state.search.searchFilters;
export const selectSearchResults = (state) => state.search.searchResults;
export const selectFilterOptions = (state) => state.search.filterOptions;
export const selectSearchLoading = (state) => state.search.isLoading;
export const selectSearchError = (state) => state.search.error;

// Migration selectors
export const selectMigrationProgress = (state) => state.migration.migrationProgress;
export const selectMigrationLog = (state) => state.migration.migrationLog;
export const selectMigrationRunning = (state) => state.migration.isRunning;
export const selectMigrationError = (state) => state.migration.error;

// Rejection Trends selectors
export const selectRejectionTrendsState = (state) => state.rejectionTrends;
export const selectRejectionData = (state) => state.rejectionTrends.rejectionData;
export const selectTrendsData = (state) => state.rejectionTrends.trendsData;
export const selectRejectionTrendsLoading = (state) => state.rejectionTrends.isLoadingData;

// UI selectors
export const selectIsDarkMode = (state) => state.ui.isDarkMode;
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectIsSettingsPanelOpen = (state) => state.ui.isSettingsPanelOpen;
export const selectCustomAlert = (state) => state.ui.customAlert;