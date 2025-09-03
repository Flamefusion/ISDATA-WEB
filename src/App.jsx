import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Database, 
  Search, 
  Eye,
  Upload,
  BarChart3,
  TrendingUp,
  Loader,
  XCircle
} from 'lucide-react';

// Import all components
import ConfigTab from './components/ConfigTab';
import PreviewTab from './components/PreviewTab';
import MigrationTab from './components/MigrationTab';
import SearchTab from './components/SearchTab';
import ReportTab from './components/ReportTab';
import RejectionTrendsTab from './components/RejectionTrendsTab';
import CustomAlert from './components/CustomAlert';
import SettingsPanel from './components/SettingsPanel';

const ISDATA = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [prevActiveTab, setPrevActiveTab] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ db: null, sheets: null });
  const [config, setConfig] = useState({
    serviceAccountFileName: '',
    serviceAccountContent: '',
    vendorDataUrl: '',
    vqcDataUrl: '',
    ftDataUrl: '',
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'fqc_rings',
    dbUser: 'postgres',
    dbPassword: ''
  });
  const [customAlert, setCustomAlert] = useState(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Data Preview state
  const [previewData, setPreviewData] = useState([]);
  
  // Migration state
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationLog, setMigrationLog] = useState([]);

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ vendors: [], vqc_statuses: [], ft_statuses: [], reasons: [] });
  const initialSearchFilters = {
    serialNumbers: '', moNumbers: '', dateFrom: '', dateTo: '',
    vendor: [], vqcStatus: [], ftStatus: [], rejectionReason: []
  };
  const [searchFilters, setSearchFilters] = useState(initialSearchFilters);

  // Report state
  const [reportSelectedDate, setReportSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportSelectedVendor, setReportSelectedVendor] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportVendors, setReportVendors] = useState(['all']);

  const handleTabChange = (tabId) => {
    setPrevActiveTab(activeTab);
    setActiveTab(tabId);
  };

  const toggleDarkMode = () => setIsDarkMode(prevMode => !prevMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/search/filters');
        if (!response.ok) return;
        const data = await response.json();
        setFilterOptions(data);
        setReportVendors(['all', ...data.vendors]);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
    loadPreviewData();
  }, []);

  // API Functions
  const loadPreviewData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/data');
      if (!response.ok) throw new Error('Failed to fetch preview data');
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };
  
  const testDbConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: config.dbHost, dbPort: config.dbPort, dbName: config.dbName,
          dbUser: config.dbUser, dbPassword: config.dbPassword
        })
      });
      const data = await response.json();
      setConnectionStatus(prev => ({ ...prev, db: data.status }));
      setCustomAlert({ message: data.message, type: data.status });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, db: 'error' }));
      setCustomAlert({ message: `Error testing database connection: ${error.message}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const testSheetsConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/test_sheets_connection', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config)
      });
      const data = await response.json();
      setConnectionStatus(prev => ({ ...prev, sheets: data.status }));
      setCustomAlert({ message: data.message, type: data.status });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, sheets: 'error' }));
      setCustomAlert({ message: `Error testing sheets connection: ${error.message}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const createSchema = async () => {
    if (!confirm('This will drop and recreate the \'rings\' table. ALL DATA WILL BE LOST. Are you sure?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/db/schema', { method: 'POST' });
      const data = await response.json();
      setCustomAlert({ message: data.status === 'success' ? 'Schema created successfully!\n\n' + data.logs.join('\n') : 'Schema creation failed: ' + data.message, type: data.status });
    } catch (error) {
      setCustomAlert({ message: `Error creating schema: ${error.message}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const clearDatabase = async () => {
    if (!confirm('DANGER: This will permanently delete all data from the \'rings\' table. Are you sure?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/db/clear', { method: 'DELETE' });
      const data = await response.json();
      setCustomAlert({ message: data.status === 'success' ? data.message : 'Failed to clear database: ' + data.message, type: data.status });
    } catch (error) {
      setCustomAlert({ message: `Error clearing database: ${error.message}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const startMigration = async () => {
    setMigrationProgress(0);
    setMigrationLog([ { timestamp: new Date().toLocaleTimeString(), message: "Starting migration..." } ]);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/migrate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(config),
      });
      if (!response.body) return;
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let logCount = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) { setMigrationProgress(100); break; }
        const lines = value.split('\n\n').filter(line => line.length > 0);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const message = line.substring(6);
            setMigrationLog(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message }]);
            logCount++;
            setMigrationProgress(Math.min(99, (logCount / 15) * 100));
            if (message.includes('Migration completed successfully!')) {
              loadPreviewData();
              setMigrationProgress(100);
            }
          }
        }
      }
    } catch (error) {
      setMigrationLog(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: `Error: ${error.message}` }]);
    }
  };

  const validateAndFormatDates = (filters) => {
    const formattedFilters = { ...filters };
    if (formattedFilters.dateFrom) { try { const dateFrom = new Date(formattedFilters.dateFrom + 'T00:00:00'); if (isNaN(dateFrom.getTime())) throw new Error('Invalid dateFrom'); formattedFilters.dateFrom = dateFrom.toISOString().split('T')[0]; } catch (error) { delete formattedFilters.dateFrom; } }
    if (formattedFilters.dateTo) { try { const dateTo = new Date(formattedFilters.dateTo + 'T00:00:00'); if (isNaN(dateTo.getTime())) throw new Error('Invalid dateTo'); formattedFilters.dateTo = dateTo.toISOString().split('T')[0]; } catch (error) { delete formattedFilters.dateTo; } }
    if (formattedFilters.dateFrom && formattedFilters.dateTo) { const fromDate = new Date(formattedFilters.dateFrom); const toDate = new Date(formattedFilters.dateTo); if (fromDate > toDate) { return null; } }
    return formattedFilters;
  };

  const performSearch = async () => {
    const validatedFilters = validateAndFormatDates(searchFilters);
    if (!validatedFilters) { setCustomAlert({ message: 'Invalid date range: "Date From" cannot be later than "Date To"', type: 'error' }); return; }
    setIsLoading(true);
    try {
      const cleanedFilters = Object.entries(validatedFilters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (Array.isArray(value)) { if (value.length > 0) acc[key] = value; } else { acc[key] = value; }
        }
        return acc;
      }, {});
      const response = await fetch('http://127.0.0.1:5000/api/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(cleanedFilters),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) setCustomAlert({ message: 'No results found for the specified criteria', type: 'error' });
    } catch (error) {
      setCustomAlert({ message: `Search failed: ${error.message}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const exportCsv = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/search/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(searchFilters),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = "search_results.csv";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (error) { console.error('Error exporting CSV:', error); }
    setIsLoading(false);
  };

  const clearSearchFilters = () => setSearchFilters(initialSearchFilters);

  // Report functions
  const loadReport = async () => {
    setReportIsLoading(true);
    setReportError(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: reportSelectedDate, vendor: reportSelectedVendor })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      setReportError(error.message);
    } finally {
      setReportIsLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: reportSelectedDate, vendor: reportSelectedVendor, format: format })
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily_report_${reportSelectedDate}_${reportSelectedVendor}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      setReportError('Failed to export report');
    }
  };

  useEffect(() => {
    if (reportSelectedDate) {
      loadReport();
    }
  }, [reportSelectedDate, reportSelectedVendor]);

  // Animation variants
  const revealVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    center: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20, duration: 0.7 } },
    exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.3 } },
  };

  const tabs = [ 
    { id: 'config', label: 'Configuration', icon: Settings, color: 'blue' }, 
    { id: 'preview', label: 'Data Preview', icon: Eye, color: 'green' }, 
    { id: 'migration', label: 'Migration', icon: Upload, color: 'orange' },
    { id: 'search', label: 'Ring Search', icon: Search, color: 'indigo' },
    { id: 'reports', label: 'Daily Reports', icon: BarChart3, color: 'purple' },
    { id: 'rejection-trends', label: 'Rejection Trends', icon: TrendingUp, color: 'red' }
  ];

  const tabColorClasses = {
    blue: { active: 'bg-gradient-to-r from-blue-500 to-blue-600', hover: 'hover:bg-blue-100', },
    green: { active: 'bg-gradient-to-r from-green-500 to-green-600', hover: 'hover:bg-green-100', },
    orange: { active: 'bg-gradient-to-r from-orange-500 to-orange-600', hover: 'hover:bg-orange-100', },
    indigo: { active: 'bg-gradient-to-r from-indigo-500 to-indigo-600', hover: 'hover:bg-indigo-100', },
    purple: { active: 'bg-gradient-to-r from-purple-500 to-purple-600', hover: 'hover:bg-purple-100', },
    red: { active: 'bg-gradient-to-r from-red-500 to-red-600', hover: 'hover:bg-red-100', },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config': 
        return (
          <ConfigTab 
            config={config} 
            setConfig={setConfig} 
            isLoading={isLoading} 
            connectionStatus={connectionStatus} 
            testSheetsConnection={testSheetsConnection} 
            testDbConnection={testDbConnection} 
            createSchema={createSchema} 
            clearDatabase={clearDatabase} 
          />
        );
      case 'preview': 
        return (
          <PreviewTab 
            previewData={previewData} 
            isLoading={isLoading} 
            loadPreviewData={loadPreviewData} 
          />
        );
      case 'migration': 
        return (
          <MigrationTab 
            migrationProgress={migrationProgress} 
            migrationLog={migrationLog} 
            startMigration={startMigration} 
          />
        );
      case 'search': 
        return (
          <SearchTab 
            searchFilters={searchFilters} 
            setSearchFilters={setSearchFilters} 
            filterOptions={filterOptions} 
            performSearch={performSearch} 
            isLoading={isLoading} 
            searchResults={searchResults} 
            exportCsv={exportCsv} 
            clearSearchFilters={clearSearchFilters} 
          />
        );
      case 'reports': 
        return (
          <ReportTab 
            selectedDate={reportSelectedDate}
            setSelectedDate={setReportSelectedDate}
            selectedVendor={reportSelectedVendor}
            setSelectedVendor={setReportSelectedVendor}
            reportData={reportData}
            isLoading={reportIsLoading}
            vendors={reportVendors}
            error={reportError}
            loadReport={loadReport}
            exportReport={exportReport}
          />
        );
      case 'rejection-trends': 
        return <RejectionTrendsTab vendors={reportVendors} />;
      default: 
        return (
          <ConfigTab 
            config={config} 
            setConfig={setConfig} 
            isLoading={isLoading} 
            connectionStatus={connectionStatus} 
            testSheetsConnection={testSheetsConnection} 
            testDbConnection={testDbConnection} 
            createSchema={createSchema} 
            clearDatabase={clearDatabase} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div className="flex items-center gap-4" whileHover={{ scale: 1.02 }}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ISDATA</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Ring Data ETL & Search Tool</p>
              </div>
            </motion.div>
            <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-semibold rounded-full">Online</div>
              <motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} onClick={() => setIsSettingsPanelOpen(true)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                <Settings className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div className="flex flex-wrap gap-2 mb-8 bg-white/60 dark:bg-black/95 backdrop-blur-lg rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/30" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {tabs.map((tab, index) => { 
            const Icon = tab.icon; 
            const color = tab.color;
            const activeClass = `${tabColorClasses[color]?.active || ''} text-white shadow-lg`;
            const inactiveClass = `text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 ${tabColorClasses[color]?.hover || ''} dark:hover:bg-gray-800`;
            const activeBackgroundClass = `${tabColorClasses[color]?.active || ''} absolute inset-0 rounded-xl -z-10`;

            return ( 
              <motion.button 
                key={tab.id} 
                onClick={() => handleTabChange(tab.id)} 
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 relative overflow-hidden ${activeTab === tab.id ? activeClass : inactiveClass}`} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: index * 0.1 }}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {activeTab === tab.id && ( 
                  <motion.div 
                    layoutId="activeTab" 
                    className={activeBackgroundClass} 
                    initial={false} 
                    transition={{ type: "spring", duration: 0.6 }} 
                  /> 
                )}
              </motion.button> 
            ); 
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={revealVariants}
            initial="initial"
            animate="center"
            exit="exit"
            className="min-h-[600px]"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-16 bg-white/60 dark:bg-black/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
            <p>© 2025 ISDATA - Ring Data ETL & Search Tool</p>
            <div className="flex items-center gap-4">
              <span>Built with React + Tailwind + Framer Motion</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white dark:bg-black rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700/30">
              <div className="flex items-center gap-4">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Processing...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {customAlert && (
          <CustomAlert 
            message={customAlert.message} 
            type={customAlert.type} 
            onClose={() => setCustomAlert(null)} 
          />
        )}
      </AnimatePresence>

      <SettingsPanel 
        isOpen={isSettingsPanelOpen} 
        onClose={() => setIsSettingsPanelOpen(false)} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
    </div>
  );
};

export default ISDATA;