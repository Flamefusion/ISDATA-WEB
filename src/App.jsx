// src/App.jsx
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Database, FileText, Search, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';

// Redux Store
import { store } from './store/store';

// Redux Hooks and Actions
import { useAppSelector, useAppDispatch } from './store/hooks';
import {
  selectIsDarkMode,
  selectActiveTab,
  selectIsSettingsPanelOpen,
  selectCustomAlert,
} from './store/selectors';
import {
  setActiveTab,
  toggleSettingsPanel,
  closeSettingsPanel,
  toggleDarkMode,
  hideAlert,
} from './store/slices/uiSlice';

// Components
import ConfigTab from './components/ConfigTab';
import MigrationTab from './components/MigrationTab';
import PreviewTab from './components/PreviewTab';
import ReportTab from './components/ReportTab';
import SearchTab from './components/SearchTab';
import RejectionTrendsTab from './components/RejectionTrendsTab';
import SettingsPanel from './components/SettingsPanel';
import CustomAlert from './components/CustomAlert';

// App Content Component (to use Redux hooks)
const AppContent = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(selectIsDarkMode);
  const activeTab = useAppSelector(selectActiveTab);
  const isSettingsPanelOpen = useAppSelector(selectIsSettingsPanelOpen);
  const customAlert = useAppSelector(selectCustomAlert);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Tab configuration
  const tabs = [
    { id: 'config', label: 'Configuration', icon: Database, component: ConfigTab },
    { id: 'migration', label: 'Migration', icon: RefreshCw, component: MigrationTab },
    { id: 'preview', label: 'Preview', icon: BarChart3, component: PreviewTab },
    { id: 'report', label: 'Report', icon: FileText, component: ReportTab },
    { id: 'search', label: 'Search', icon: Search, component: SearchTab },
    { id: 'rejectionTrends', label: 'Rejection Trends', icon: TrendingDown, component: RejectionTrendsTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ConfigTab;

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-900'
    }`}>
      {/* Alert System */}
      <AnimatePresence>
        {customAlert.show && (
          <CustomAlert 
            message={customAlert.message} 
            type={customAlert.type} 
            onClose={() => dispatch(hideAlert())} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Rings Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Production Data Management System
                </p>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={() => dispatch(toggleSettingsPanel())} 
              className="p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-200 border border-white/10 dark:border-gray-700/30"
            >
              <Settings className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <motion.nav 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }} 
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 p-2 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => dispatch(setActiveTab(tab.id))}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.nav>

        {/* Main Content */}
        <motion.main 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }} 
          transition={{ duration: 0.3 }}
        >
          <ActiveComponent />
        </motion.main>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => dispatch(closeSettingsPanel())}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => dispatch(toggleDarkMode())}
      />
    </div>
  );
};

// Main App Component with Redux Provider
const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;