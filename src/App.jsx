import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Loader,
  Eye,
  RefreshCw,
  Folder,
  Sun,
  Moon,
  BarChart3,
  TrendingUp,  
  TrendingDown,
  Users,
  AlertTriangle,
  PieChart,
  Target
} from 'lucide-react';

// --- (Animation variants are unchanged) ---
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

// --- (Component definitions are unchanged) ---
const ConfigTab = ({ config, setConfig, isLoading, connectionStatus, testSheetsConnection, testDbConnection, createSchema, clearDatabase }) => {
  const fileInputRef = useRef(null);
  const handleBrowseClick = () => fileInputRef.current.click();
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          setConfig(prev => ({ ...prev, serviceAccountFileName: file.name, serviceAccountContent: jsonContent }));
        } catch (error) {
          alert("Invalid JSON file.");
          setConfig(prev => ({ ...prev, serviceAccountFileName: '', serviceAccountContent: '' }));
        }
      };
      reader.readAsText(file);
    }
  };
  return (
    <motion.div {...fadeInUp} className="space-y-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50">
        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-500 rounded-lg"><Cloud className="w-6 h-6 text-white" /></div><h3 className="text-2xl font-bold text-gray-800 dark:text-white">Google Sheets Configuration</h3></div>
        <motion.div variants={staggerContainer} animate="animate" className="space-y-4">
          <motion.div variants={staggerItem} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Service Account JSON</label>
            <div className="flex items-center gap-2"><input type="text" value={config.serviceAccountFileName} readOnly className="flex-grow w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="Service account JSON file selected..." /><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" /><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleBrowseClick} className="px-4 py-3 bg-white/80 dark:bg-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors duration-200 border border-gray-300 dark:border-gray-600 flex items-center gap-2"><Folder className="w-5 h-5" />Browse</motion.button></div>
          </motion.div>
          {['vendorDataUrl', 'vqcDataUrl', 'ftDataUrl'].map((field) => (<motion.div key={field} variants={staggerItem} className="space-y-2"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{field === 'vendorDataUrl' ? 'Vendor Data URL' : field === 'vqcDataUrl' ? 'VQC Data URL' : 'FT Data URL'}</label><input type="url" value={config[field]} onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="https://docs.google.com/spreadsheets/..." /></motion.div>))}
        </motion.div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={testSheetsConnection} disabled={isLoading} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2">{isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Test Sheets Connection</motion.button>
        {connectionStatus.sheets === 'success' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-green-600 font-medium">Sheets connection successful!</span></motion.div>)}
        {connectionStatus.sheets === 'error' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><span className="text-red-600 font-medium">Sheets connection failed. Check console for details.</span></motion.div>)}
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200/50 dark:border-purple-700/50">
        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-500 rounded-lg"><Database className="w-6 h-6 text-white" /></div><h3 className="text-2xl font-bold text-gray-800 dark:text-white">PostgreSQL Configuration</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[ { field: 'dbHost', label: 'Host', placeholder: 'localhost' }, { field: 'dbPort', label: 'Port', placeholder: '5432' }, { field: 'dbName', label: 'Database Name', placeholder: 'rings_db' }, { field: 'dbUser', label: 'Username', placeholder: 'postgres' } ].map((item) => (<div key={item.field} className="space-y-2"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</label><input type="text" value={config[item.field]} onChange={(e) => setConfig(prev => ({ ...prev, [item.field]: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-200" placeholder={item.placeholder} /></div>))}
          <div className="md:col-span-2 space-y-2"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label><input type="password" value={config.dbPassword} onChange={(e) => setConfig(prev => ({ ...prev, dbPassword: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-200" placeholder="Database password" /></div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={testDbConnection} disabled={isLoading} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2">{isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}Test DB Connection</motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createSchema} className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"><RefreshCw className="w-5 h-5" />Create Schema</motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearDatabase} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"><Database className="w-5 h-5" />Clear Database</motion.button>
        </div>
        {connectionStatus.db === 'success' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-green-600 font-medium">Database connection successful!</span></motion.div>)}
        {connectionStatus.db === 'error' && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><span className="text-red-600 font-medium">Database connection failed. Check console for details.</span></motion.div>)}
      </motion.div>
    </motion.div>
  );
};
const PreviewTab = ({ previewData, isLoading, loadPreviewData }) => {
  const desiredColumns = [ 'date', 'vendor', 'mo_number', 'serial_number', 'sku', 'ring_size', 'vqc_status', 'ft_status', 'vqc_reason', 'ft_reason', 'created_at', 'updated_at', ];
  const [columns, setColumns] = useState([]);
  useEffect(() => {
    if (previewData.length > 0) {
      const availableColumns = Object.keys(previewData[0]);
      const filteredAndOrderedColumns = desiredColumns.filter(col => availableColumns.includes(col));
      setColumns(filteredAndOrderedColumns);
    }
  }, [previewData]);
  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-800 dark:text-white">Data Preview</h2><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadPreviewData} disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2">{isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}Refresh Data</motion.button></div>
      {previewData.length > 0 ? (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl"><div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600"><h3 className="text-xl font-bold text-gray-800 dark:text-white">Preview Data ({previewData.length} records)</h3><p className="text-gray-600 dark:text-gray-400 mt-1">Showing first 50 records of the dataset</p></div><div className="overflow-auto max-h-96"><table className="w-full"><thead className="bg-gray-100 dark:bg-gray-700 sticky top-0"><tr>{columns.map((header) => (<th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{header.replace(/_/g, ' ')}</th>))}</tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-600">{previewData.slice(0, 50).map((row, index) => (<motion.tr key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">{columns.map(col => (<td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-mono">{String(row[col])}</td>))}</motion.tr>))}</tbody></table></div></motion.div>) : (<div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl"><Database className="w-12 h-12 mx-auto text-gray-400" /><h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">No Data to Preview</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click 'Refresh Data' to fetch from the database.</p></div>)}
    </motion.div>
  );
};
const MigrationTab = ({ migrationProgress, migrationLog, startMigration }) => (
  <motion.div {...fadeInUp} className="space-y-6">
    <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-800 dark:text-white">Data Migration</h2><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startMigration} disabled={migrationProgress > 0 && migrationProgress < 100} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2">{(migrationProgress > 0 && migrationProgress < 100) ? <Loader className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}Start Migration</motion.button></div>
    {migrationLog.length > 0 && (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl"><div className="mb-4"><div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Migration Progress</span><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(migrationProgress)}%</span></div><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"><motion.div className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${migrationProgress}%` }} transition={{ duration: 0.5 }} /></div></div><div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-auto"><h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Migration Log:</h4>{migrationLog.map((log, index) => (<motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-mono"><span className="text-blue-500">[{log.timestamp}]</span> {log.message}</motion.div>))}</div></motion.div>)}
  </motion.div>
);
const SearchTab = ({ searchFilters, setSearchFilters, filterOptions, performSearch, isLoading, searchResults, exportCsv, clearSearchFilters }) => (
  <motion.div {...fadeInUp} className="space-y-6">
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/50"><h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3"><div className="p-2 bg-indigo-500 rounded-lg"><Filter className="w-6 h-6 text-white" /></div>Search Filters</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[ { field: 'serialNumbers', label: 'Serial Numbers', placeholder: 'RNG000001, RNG000002...', icon: FileText }, { field: 'moNumbers', label: 'MO Numbers', placeholder: 'MO001, MO002...', icon: FileText }, { field: 'dateFrom', label: 'Date From', type: 'date', icon: Calendar }, { field: 'dateTo', label: 'Date To', type: 'date', icon: Calendar } ].map((item) => (<div key={item.field} className="space-y-2"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{item.label}</label><div className="relative"><input type={item.type || 'text'} value={searchFilters[item.field]} onChange={(e) => setSearchFilters(prev => ({ ...prev, [item.field]: e.target.value }))} className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200" placeholder={item.placeholder} /><item.icon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /></div></div>))}</div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <MultiSelectMenu label="Vendor" options={filterOptions.vendors} selected={searchFilters.vendor} onChange={(selected) => setSearchFilters(prev => ({ ...prev, vendor: selected }))} />
      <MultiSelectMenu label="VQC Status" options={filterOptions.vqc_statuses} selected={searchFilters.vqcStatus} onChange={(selected) => setSearchFilters(prev => ({ ...prev, vqcStatus: selected }))} />
      <MultiSelectMenu label="FT Status" options={filterOptions.ft_statuses} selected={searchFilters.ftStatus} onChange={(selected) => setSearchFilters(prev => ({ ...prev, ftStatus: selected }))} />
      <MultiSelectMenu label="Rejection Reason" options={filterOptions.reasons} selected={searchFilters.rejectionReason} onChange={(selected) => setSearchFilters(prev => ({ ...prev, rejectionReason: selected }))} /></div><div className="flex gap-4 mt-6">
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={performSearch} disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2">{isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}Search Rings</motion.button>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportCsv} disabled={!searchResults.length} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"><Download className="w-5 h-5" />Export CSV</motion.button>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearSearchFilters} className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"><Filter className="w-5 h-5" />Clear Filters</motion.button></div></div>
    {searchResults.length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl"><div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600"><h3 className="text-xl font-bold text-gray-800 dark:text-white">Search Results ({searchResults.length} found)</h3></div><div className="overflow-auto max-h-96"><table className="w-full"><thead className="bg-gray-100 dark:bg-gray-700 sticky top-0"><tr>{['serial_number', 'mo_number', 'vendor', 'date', 'vqc_status', 'ft_status'].map((header) => (<th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{header.replace(/_/g, ' ')}</th>))}</tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-600">{searchResults.map((row, index) => (<motion.tr key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150`}><td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">{row.serial_number}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.mo_number}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.vendor}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{row.date}</td><td className="px-6 py-4 whitespace-nowrap"><motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.03 + 0.2 }} className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ row.vqc_status === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }`}>{row.vqc_status}</motion.span></td><td className="px-6 py-4 whitespace-nowrap"><motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.03 + 0.3 }} className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ row.ft_status === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }`}>{row.ft_status}</motion.span></td></motion.tr>))}</tbody></table></div></motion.div>)}
  </motion.div>
);

const ReportTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState(['all']);
  const [error, setError] = useState(null);

  // Fetch available vendors on component mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/search/filters');
        if (response.ok) {
          const data = await response.json();
          setVendors(['all', ...data.vendors]);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, []);

  const fetchDailyReport = async (selectedDate, selectedVendor) => {
    const response = await fetch('http://127.0.0.1:5000/api/reports/daily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: selectedDate,
        vendor: selectedVendor
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDailyReport(selectedDate, selectedVendor);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          vendor: selectedVendor,
          format: format
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily_report_${selectedDate}_${selectedVendor}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report');
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadReport();
    }
  }, [selectedDate, selectedVendor]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100')} dark:${color.replace('text-', 'bg-').replace('-600', '-900/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : trend < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          ) : null}
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend !== 0 ? `${Math.abs(trend)}% vs yesterday` : 'No change'}
          </span>
        </div>
      )}
    </motion.div>
  );

  const ReasonCard = ({ title, reasons, totalRejected }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h4 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h4>
        <span className="text-sm text-gray-500 dark:text-gray-400">({totalRejected} total)</span>
      </div>
      <div className="space-y-4">
        {reasons.length > 0 ? reasons.map((reason, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {reason.reason}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {reason.count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({reason.percentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${reason.percentage}%` }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No rejection reasons found
          </div>
        )}
      </div>
    </motion.div>
  );

  const HourlyChart = ({ data }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h4 className="text-lg font-bold text-gray-800 dark:text-white">Hourly Production</h4>
      </div>
      <div className="space-y-3">
        {data.length > 0 ? data.map((item, index) => {
          const yieldRate = item.received > 0 ? ((item.accepted / item.received) * 100).toFixed(1) : 0;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.hour}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Received: {item.received}</span>
                  <span className="text-green-600 dark:text-green-400">Accepted: {item.accepted}</span>
                  <span className="text-red-600 dark:text-red-400">Rejected: {item.rejected}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Yield: {yieldRate}%</span>
                </div>
                <div className="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.accepted / item.received) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  />
                  <motion.div
                    className="bg-red-500 h-2 rounded-r-full absolute top-0 right-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.rejected / item.received) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No hourly data available
          </div>
        )}
      </div>
    </motion.div>
  );

  const VendorBreakdown = ({ vendors }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-purple-500" />
        <h4 className="text-lg font-bold text-gray-800 dark:text-white">Vendor-wise Breakdown</h4>
      </div>
      <div className="space-y-4">
        {vendors.map((vendor, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-800 dark:text-white">{vendor.vendor}</h5>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {vendor.yield}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Received</span>
                <p className="font-semibold">{vendor.totalReceived}</p>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Accepted</span>
                <p className="font-semibold">{vendor.totalAccepted}</p>
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400">Rejected</span>
                <p className="font-semibold">{vendor.totalRejected}</p>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${vendor.yield}%` }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <motion.div {...fadeInUp} className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Error Loading Report
              </h3>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadReport}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200"
          >
            Retry
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Production Report</h2>
              <p className="text-gray-600 dark:text-gray-400">Comprehensive daily analytics and yield metrics</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Select Vendor
              </label>
              <div className="relative">
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none"
                >
                  {vendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor === 'all' ? 'All Vendors' : vendor}
                    </option>
                  ))}
                </select>
                <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadReport}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <BarChart3 className="w-5 h-5" />
                )}
                Generate Report
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Loading Report Data...
            </p>
          </div>
        </motion.div>
      )}

      {/* Report Content */}
      {reportData && !isLoading && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Received"
              value={reportData.totalReceived.toLocaleString()}
              icon={Target}
              color="text-blue-600"
              subtitle="rings processed"
              trend={reportData.trends?.received}
            />
            <StatCard
              title="Total Accepted"
              value={reportData.totalAccepted.toLocaleString()}
              icon={CheckCircle}
              color="text-green-600"
              subtitle="quality passed"
              trend={reportData.trends?.accepted}
            />
            <StatCard
              title="Total Rejected"
              value={reportData.totalRejected.toLocaleString()}
              icon={XCircle}
              color="text-red-600"
              subtitle="quality failed"
              trend={reportData.trends?.rejected}
            />
            <StatCard
              title="Overall Yield"
              value={`${reportData.yield}%`}
              icon={TrendingUp}
              color="text-purple-600"
              subtitle="acceptance rate"
              trend={reportData.trends?.yield}
            />
          </div>

          {/* Vendor Breakdown (only show when 'all' is selected) */}
          {selectedVendor === 'all' && reportData.vendorBreakdown && reportData.vendorBreakdown.length > 0 && (
            <VendorBreakdown vendors={reportData.vendorBreakdown} />
          )}

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReasonCard
              title="VQC Rejection Reasons"
              reasons={reportData.vqcBreakdown.rejectionReasons}
              totalRejected={reportData.vqcBreakdown.rejected}
            />
            <ReasonCard
              title="FT Rejection Reasons"
              reasons={reportData.ftBreakdown.rejectionReasons}
              totalRejected={reportData.ftBreakdown.rejected}
            />
          </div>

          {/* Hourly Production Chart */}
          {reportData.hourlyData && reportData.hourlyData.length > 0 && (
            <HourlyChart data={reportData.hourlyData} />
          )}

          {/* Export Section */}
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  Export Report
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Download detailed report data for {selectedDate} - {selectedVendor === 'all' ? 'All Vendors' : selectedVendor}
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => exportReport('csv')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => exportReport('excel')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Summary Report Section */}
          <motion.div
            variants={staggerItem}
            className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">Report Summary</h4>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 backdrop-blur-sm">
                <h5 className="text-lg font-semibold mb-4">Daily Production Analysis - {selectedDate}</h5>
                <div className="space-y-3 text-gray-700 dark:text-gray-200">
                  <p>
                    <span className="font-semibold">Production Overview:</span> On {selectedDate}, 
                    {selectedVendor === 'all' ? ' across all vendors,' : ` for ${selectedVendor},`} a total of{' '}
                    <span className="font-bold text-blue-600">{reportData.totalReceived}</span> rings were received for processing.
                  </p>
                  
                  <p>
                    <span className="font-semibold">Quality Results:</span> Out of the total received,{' '}
                    <span className="font-bold text-green-600">{reportData.totalAccepted}</span> rings passed quality checks
                    and <span className="font-bold text-red-600">{reportData.totalRejected}</span> rings were rejected.
                  </p>
                  
                  <p>
                    <span className="font-semibold">Overall Yield:</span> The day achieved a yield of{' '}
                    <span className="font-bold text-purple-600">{reportData.yield}%</span>, indicating{' '}
                    {reportData.yield >= 85 ? 'excellent' : reportData.yield >= 75 ? 'good' : reportData.yield >= 65 ? 'acceptable' : 'below target'} performance.
                  </p>
                  
                  {reportData.vqcBreakdown.rejectionReasons.length > 0 && (
                    <p>
                      <span className="font-semibold">Primary VQC Issues:</span> The main quality concerns were{' '}
                      {reportData.vqcBreakdown.rejectionReasons.slice(0, 3).map((reason, index) => (
                        <span key={index}>
                          {reason.reason} ({reason.count} rings)
                          {index < Math.min(2, reportData.vqcBreakdown.rejectionReasons.length - 1) ? ', ' : ''}
                        </span>
                      )).reduce((prev, curr, index) => index === 0 ? [curr] : [...prev, index === reportData.vqcBreakdown.rejectionReasons.slice(0, 3).length - 1 ? ' and ' : ', ', curr], [])}.
                    </p>
                  )}
                  
                  {reportData.ftBreakdown.rejectionReasons.length > 0 && (
                    <p>
                      <span className="font-semibold">Functional Test Issues:</span> FT rejections were primarily due to{' '}
                      {reportData.ftBreakdown.rejectionReasons.slice(0, 2).map((reason, index) => (
                        <span key={index}>
                          {reason.reason} ({reason.count} rings)
                          {index < Math.min(1, reportData.ftBreakdown.rejectionReasons.length - 1) ? ' and ' : ''}
                        </span>
                      ))}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* No Data State */}
      {!reportData && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl"
        >
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No Report Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No data found for {selectedDate} - {selectedVendor === 'all' ? 'All Vendors' : selectedVendor}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadReport}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200"
          >
            Retry Report Generation
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

const MultiSelectMenu = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleSelect = (option) => { const newSelected = selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]; onChange(newSelected); };
  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full mt-2 px-4 py-3 text-left rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200 flex justify-between items-center"><span className="truncate">{selected.length === 0 ? `All` : selected.length === 1 ? selected[0] : `${selected.length} selected`}</span><Filter className="w-4 h-4 text-gray-400" /></button>
      {isOpen && (<div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto" onMouseLeave={() => setIsOpen(false)}>{options.map(option => (<div key={option} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleSelect(option)}><input type="checkbox" readOnly checked={selected.includes(option)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label className="ml-3 text-sm text-gray-700 dark:text-gray-200">{option}</label></div>))}</div>)}
    </div>
  );
};
const CustomAlert = ({ message, type, onClose }) => {
  const Icon = type === 'success' ? CheckCircle : XCircle;
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const borderColor = type === 'success' ? 'border-green-700' : 'border-red-700';
  return (
    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-xl shadow-lg flex items-center gap-3 text-white font-semibold border-b-4 ${bgColor} ${borderColor}`}>
      <Icon className="w-6 h-6" /><p>{message}</p><button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"><XCircle className="w-5 h-5" /></button>
    </motion.div>
  );
};
const SettingsPanel = ({ isOpen, onClose, isDarkMode, toggleDarkMode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-1/4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg z-50 shadow-lg p-6 border-l border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h3><motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><XCircle className="w-6 h-6" /></motion.button></div>
          <div className="space-y-6"><div className="flex items-center justify-between"><label className="text-lg font-semibold text-gray-700 dark:text-gray-200">Dark Mode</label><motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleDarkMode} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}><span className="sr-only">Toggle Dark Mode</span><span className={`transform transition-transform ease-in-out duration-200 absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>{isDarkMode ? (<Moon className="h-4 w-4 text-indigo-600" />) : (<Sun className="h-4 w-4 text-yellow-500" />)}</span></motion.button></div></div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

const ISDATA = () => {
  const [activeTab, setActiveTab] = useState('config');
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

  // --- FIX: Add missing state hooks ---
  const [previewData, setPreviewData] = useState([]);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationLog, setMigrationLog] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ vendors: [], vqc_statuses: [], ft_statuses: [], reasons: [] });

  const toggleDarkMode = () => setIsDarkMode(prevMode => !prevMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // --- FIX: Close the initialSearchFilters object and initialize searchFilters state ---
  const initialSearchFilters = {
    serialNumbers: '',
    moNumbers: '',
    dateFrom: '',
    dateTo: '',
    vendor: [],
    vqcStatus: [],
    ftStatus: [],
    rejectionReason: []
  };
  const [searchFilters, setSearchFilters] = useState(initialSearchFilters);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/search/filters');
        if (!response.ok) return;
        const data = await response.json();
        setFilterOptions(data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
    loadPreviewData();
  }, []);

  const clearSearchFilters = () => setSearchFilters(initialSearchFilters);

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
  
  // --- (Rest of the functions are unchanged and correct) ---
  const testDbConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: config.dbHost,
          dbPort: config.dbPort,
          dbName: config.dbName,
          dbUser: config.dbUser,
          dbPassword: config.dbPassword
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(config),
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(cleanedFilters),
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(searchFilters),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = "search_results.csv";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (error) { console.error('Error exporting CSV:', error); }
    setIsLoading(false);
  };

  const tabs = [ 
    { id: 'config', label: 'Configuration', icon: Settings, color: 'blue' }, 
    { id: 'preview', label: 'Data Preview', icon: Eye, color: 'green' }, 
    { id: 'migration', label: 'Migration', icon: Upload, color: 'orange' },
    { id: 'search', label: 'Ring Search', icon: Search, color: 'indigo' },
    { id: 'reports', label: 'Daily Reports', icon: BarChart3, color: 'purple' }  
  ];
  const renderTabContent = () => {
    return (
      <div className="relative min-h-[600px]">
        <div className={activeTab === 'config' ? '' : 'hidden'}>
          <ConfigTab config={config} setConfig={setConfig} isLoading={isLoading} connectionStatus={connectionStatus} testSheetsConnection={testSheetsConnection} testDbConnection={testDbConnection} createSchema={createSchema} clearDatabase={clearDatabase} />
        </div>
        <div className={activeTab === 'preview' ? '' : 'hidden'}>
          <PreviewTab previewData={previewData} isLoading={isLoading} loadPreviewData={loadPreviewData} />
        </div>
        <div className={activeTab === 'migration' ? '' : 'hidden'}>
          <MigrationTab migrationProgress={migrationProgress} migrationLog={migrationLog} startMigration={startMigration} />
        </div>
        <div className={activeTab === 'search' ? '' : 'hidden'}>
          <SearchTab searchFilters={searchFilters} setSearchFilters={setSearchFilters} filterOptions={filterOptions} performSearch={performSearch} isLoading={isLoading} searchResults={searchResults} exportCsv={exportCsv} clearSearchFilters={clearSearchFilters} />
        </div>
        <div className={activeTab === 'reports' ? '' : 'hidden'}>
          <ReportTab />
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4"><div className="flex items-center justify-between"><motion.div className="flex items-center gap-4" whileHover={{ scale: 1.02 }}><div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Database className="w-7 h-7 text-white" /></div><div><h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ISDATA</h1><p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ring Data ETL & Search Tool</p></div></motion.div><motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}><div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-semibold rounded-full">Online</div><motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} onClick={() => setIsSettingsPanelOpen(true)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><Settings className="w-5 h-5" /></motion.button></motion.div></div></div>
      </motion.header>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div className="flex flex-wrap gap-2 mb-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {tabs.map((tab, index) => { const Icon = tab.icon; return ( <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 relative overflow-hidden ${ activeTab === tab.id ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg` : `text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-${tab.color}-100 dark:hover:bg-${tab.color}-700` }`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}><Icon className="w-5 h-5" />{tab.label}{activeTab === tab.id && ( <motion.div layoutId="activeTab" className={`absolute inset-0 bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 rounded-xl -z-10`} initial={false} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} /> )}</motion.button> ); })}
        </motion.div>
        <div className="min-h-[600px]">{renderTabContent()}</div>
      </div>
      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-16 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6"><div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"><p>© 2025 ISDATA - Ring Data ETL & Search Tool</p><div className="flex items-center gap-4"><span>Built with React + Tailwind + Framer Motion</span><div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>System Online</span></div></div></div></div>
      </motion.footer>
      <AnimatePresence>{isLoading && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"><motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-4"><Loader className="w-8 h-8 animate-spin text-blue-500" /><span className="text-lg font-semibold text-gray-800 dark:text-white">Processing...</span></div></motion.div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{customAlert && (<CustomAlert message={customAlert.message} type={customAlert.type} onClose={() => setCustomAlert(null)} />)}</AnimatePresence>
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={() => setIsSettingsPanelOpen(false)} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

export default ISDATA;