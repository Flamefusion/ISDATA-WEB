import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Database, 
  Search, 
  Upload, 
  Download, 
  Play, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Server, 
  Cloud, 
  Filter,
  Calendar,
  User,
  AlertCircle,
  Loader,
  Eye,
  Save,
  RefreshCw
} from 'lucide-react';

const ISDATA = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    db: null,
    sheets: null
  });
  const [config, setConfig] = useState({
    serviceAccountPath: '',
    vendorDataUrl: '',
    vqcDataUrl: '',
    ftDataUrl: '',
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: '',
    dbUser: '',
    dbPassword: ''
  });
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationLog, setMigrationLog] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    serialNumbers: '',
    moNumbers: '',
    dateFrom: '',
    dateTo: '',
    vendor: '',
    vqcStatus: '',
    ftStatus: '',
    rejectionReason: ''
  });
  const [searchResults, setSearchResults] = useState([]);

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'preview', label: 'Data Preview', icon: Eye },
    { id: 'migration', label: 'Migration', icon: Upload },
    { id: 'search', label: 'Ring Search', icon: Search }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  // Mock functions for demonstration
  const testDbConnection = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setConnectionStatus(prev => ({ ...prev, db: 'success' }));
      setIsLoading(false);
    }, 2000);
  };

  const testSheetsConnection = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setConnectionStatus(prev => ({ ...prev, sheets: 'success' }));
      setIsLoading(false);
    }, 2000);
  };

  const loadPreviewData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        serial_number: `RNG${String(i + 1).padStart(6, '0')}`,
        mo_number: `MO${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        vendor: ['Vendor A', 'Vendor B', 'Vendor C'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vqc_status: Math.random() > 0.7 ? 'Fail' : 'Pass',
        ft_status: Math.random() > 0.8 ? 'Fail' : 'Pass',
        vqc_reason: Math.random() > 0.7 ? 'Dimensional tolerance exceeded' : '',
        ft_reason: Math.random() > 0.8 ? 'Performance below threshold' : ''
      }));
      setPreviewData(mockData);
      setIsLoading(false);
    }, 1500);
  };

  const startMigration = () => {
    setMigrationProgress(0);
    setMigrationLog([]);
    const logs = [
      'Starting migration process...',
      'Creating temporary table rings_temp...',
      'Preparing data buffer...',
      'Bulk copying data to temp table...',
      'Updating existing records...',
      'Inserting new records...',
      'Cleaning up temporary table...',
      'Migration completed successfully!'
    ];
    
    logs.forEach((log, index) => {
      setTimeout(() => {
        setMigrationLog(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: log }]);
        setMigrationProgress(((index + 1) / logs.length) * 100);
      }, (index + 1) * 800);
    });
  };

  const performSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockResults = Array.from({ length: 25 }, (_, i) => ({
        serial_number: `RNG${String(i + 1).padStart(6, '0')}`,
        mo_number: `MO${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        vendor: ['Vendor A', 'Vendor B', 'Vendor C'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vqc_status: Math.random() > 0.7 ? 'Fail' : 'Pass',
        ft_status: Math.random() > 0.8 ? 'Fail' : 'Pass'
      }));
      setSearchResults(mockResults);
      setIsLoading(false);
    }, 1000);
  };

  const ConfigTab = () => (
    <motion.div {...fadeInUp} className="space-y-8">
      {/* Google Sheets Configuration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Google Sheets Configuration</h3>
        </div>
        
        <motion.div variants={staggerContainer} animate="animate" className="space-y-4">
          <motion.div variants={staggerItem} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Service Account JSON Path</label>
            <div className="relative">
              <input
                type="text"
                value={config.serviceAccountPath}
                onChange={(e) => setConfig(prev => ({ ...prev, serviceAccountPath: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Path to your service account JSON file..."
              />
              <FileText className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </motion.div>

          {['vendorDataUrl', 'vqcDataUrl', 'ftDataUrl'].map((field, index) => (
            <motion.div key={field} variants={staggerItem} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {field === 'vendorDataUrl' ? 'Vendor Data URL' : 
                 field === 'vqcDataUrl' ? 'VQC Data URL' : 'FT Data URL'}
              </label>
              <input
                type="url"
                value={config[field]}
                onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={testSheetsConnection}
          disabled={isLoading}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          Test Sheets Connection
        </motion.button>
        
        {connectionStatus.sheets && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-600 font-medium">Sheets connection successful!</span>
          </motion.div>
        )}
      </motion.div>

      {/* PostgreSQL Configuration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200/50 dark:border-purple-700/50"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">PostgreSQL Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { field: 'dbHost', label: 'Host', placeholder: 'localhost' },
            { field: 'dbPort', label: 'Port', placeholder: '5432' },
            { field: 'dbName', label: 'Database Name', placeholder: 'rings_db' },
            { field: 'dbUser', label: 'Username', placeholder: 'postgres' }
          ].map((item) => (
            <div key={item.field} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</label>
              <input
                type="text"
                value={config[item.field]}
                onChange={(e) => setConfig(prev => ({ ...prev, [item.field]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                placeholder={item.placeholder}
              />
            </div>
          ))}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
            <input
              type="password"
              value={config.dbPassword}
              onChange={(e) => setConfig(prev => ({ ...prev, dbPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              placeholder="Database password"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={testDbConnection}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
            Test DB Connection
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Create Schema
          </motion.button>
        </div>

        {connectionStatus.db && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-600 font-medium">Database connection successful!</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  const PreviewTab = () => (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Data Preview</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadPreviewData}
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Load & Merge Data
        </motion.button>
      </div>

      {previewData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Preview Data ({previewData.length} records)</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">First 50 records of merged dataset</p>
          </div>
          
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  {['Serial Number', 'MO Number', 'Vendor', 'Date', 'VQC Status', 'FT Status'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {previewData.slice(0, 10).map((row, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">{row.serial_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.mo_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        row.vqc_status === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {row.vqc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        row.ft_status === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {row.ft_status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const MigrationTab = () => (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Data Migration</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startMigration}
          disabled={migrationProgress > 0 && migrationProgress < 100}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {migrationProgress > 0 && migrationProgress < 100 ? 
            <Loader className="w-5 h-5 animate-spin" /> : 
            <Play className="w-5 h-5" />
          }
          Start Migration
        </motion.button>
      </div>

      {migrationProgress > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl"
        >
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Migration Progress</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(migrationProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${migrationProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-auto">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Migration Log:</h4>
            {migrationLog.map((log, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-mono"
              >
                <span className="text-blue-500">[{log.timestamp}]</span> {log.message}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const SearchTab = () => (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/50">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Filter className="w-6 h-6 text-white" />
          </div>
          Search Filters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { field: 'serialNumbers', label: 'Serial Numbers', placeholder: 'RNG000001, RNG000002...', icon: FileText },
            { field: 'moNumbers', label: 'MO Numbers', placeholder: 'MO001, MO002...', icon: FileText },
            { field: 'dateFrom', label: 'Date From', type: 'date', icon: Calendar },
            { field: 'dateTo', label: 'Date To', type: 'date', icon: Calendar }
          ].map((item) => (
            <div key={item.field} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</label>
              <div className="relative">
                <input
                  type={item.type || 'text'}
                  value={searchFilters[item.field]}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, [item.field]: e.target.value }))}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  placeholder={item.placeholder}
                />
                <item.icon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[
            { field: 'vendor', label: 'Vendor', options: ['All', 'Vendor A', 'Vendor B', 'Vendor C'] },
            { field: 'vqcStatus', label: 'VQC Status', options: ['All', 'Pass', 'Fail'] },
            { field: 'ftStatus', label: 'FT Status', options: ['All', 'Pass', 'Fail'] }
          ].map((item) => (
            <div key={item.field} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</label>
              <div className="relative">
                <select
                  value={searchFilters[item.field]}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, [item.field]: e.target.value }))}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200 appearance-none"
                >
                  {item.options.map(option => (
                    <option key={option} value={option === 'All' ? '' : option}>{option}</option>
                  ))}
                </select>
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={performSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Search Rings
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </motion.button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Search Results ({searchResults.length} found)</h3>
          </div>
          
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  {['Serial Number', 'MO Number', 'Vendor', 'Date', 'VQC Status', 'FT Status'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {searchResults.map((row, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                      row.vqc_status === 'Fail' || row.ft_status === 'Fail' ? 
                      'bg-red-50 dark:bg-red-900/10' : 
                      'bg-green-50 dark:bg-green-900/10'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">{row.serial_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.mo_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.03 + 0.2 }}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          row.vqc_status === 'Pass' ? 
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {row.vqc_status}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.03 + 0.3 }}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          row.ft_status === 'Pass' ? 
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {row.ft_status}
                      </motion.span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return <ConfigTab />;
      case 'preview':
        return <PreviewTab />;
      case 'migration':
        return <MigrationTab />;
      case 'search':
        return <SearchTab />;
      default:
        return <ConfigTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ISDATA
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ring Data ETL & Search Tool</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-semibold rounded-full">
                Online
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 relative overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
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
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl -z-10"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px]"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-lg font-semibold text-gray-800 dark:text-white">Processing...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ISDATA;