import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Calendar, Users, Loader, RefreshCw, Download, TrendingDown, AlertTriangle, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateRejectionTrendsState,
  setSortConfig,
} from '../store/slices/rejectionTrendsSlice';
import { showAlert } from '../store/slices/uiSlice';
import { loadRejectionData, loadVendorsForTrends, exportRejectionTrends } from '../store/thunks/rejectionTrendsThunks';

const RejectionTrendsTab = () => {
  const dispatch = useDispatch();
  const {
    dateFrom,
    dateTo,
    selectedVendor,
    rejectionStage,
    rejectionData,
    trendsData,
    isLoadingData,
    sortConfig,
    vendors,
    error
  } = useSelector((state) => state.rejectionTrends);

  useEffect(() => {
    dispatch(loadVendorsForTrends());
  }, [dispatch]);

  const onStateChange = (key, value) => {
    dispatch(updateRejectionTrendsState({ key, value }));
  };

  const handleLoadRejectionData = () => {
    if (!dateFrom || !dateTo || !selectedVendor) {
      dispatch(showAlert({ 
        message: 'Please select both dates and a vendor', 
        type: 'error' 
      }));
      return;
    }
    dispatch(loadRejectionData({ dateFrom, dateTo, vendor: selectedVendor, rejectionStage }));
  };

  const handleExport = (format) => {
    if (!rejectionData || rejectionData.length === 0) {
      dispatch(showAlert({ message: 'No data to export', type: 'error' }));
      return;
    }
    dispatch(exportRejectionTrends({ dateFrom, dateTo, vendor: selectedVendor, rejectionStage, format }));
  };

  const dateRange = trendsData && trendsData.dateRange ? trendsData.dateRange : [];

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    dispatch(setSortConfig({ key, direction }));
  };

  const getSortedData = () => {
    if (!rejectionData) return [];
    if (!sortConfig.key) return rejectionData;
    
    return [...rejectionData].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'stage') aValue = a.stage;
      else if (sortConfig.key === 'rejection') aValue = a.rejection;
      else if (sortConfig.key === 'total') aValue = a.totals.total;
      else {
        aValue = a.dateWiseData[sortConfig.key] || 0;
        bValue = b.dateWiseData[sortConfig.key] || 0;
      }
      
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  };

  const sortedData = getSortedData();

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Assume UTC to prevent timezone shifts
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStageColor = (stage) => {
    const colors = {
      'ASSEMBLY': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'CASTING': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'FUNCTIONAL': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'POLISHING': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'SHELL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const SortableHeader = ({ children, sortKey, className = "" }) => (
    <th 
      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3" />
        {sortConfig.key === sortKey && (
          <span className={`text-xs ${sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-blue-600'}`}>
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  if (vendors.length === 0 && !isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">
                Database Not Connected
              </h3>
              <p className="text-yellow-600 dark:text-yellow-300 mt-1">
                Please connect to the database in the 'Configuration' tab to load vendor information and see rejection trends.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-br from-red-50 to-orange-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black rounded-2xl p-6 border border-red-200/50 dark:border-gray-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Rejection Trends Analysis</h2>
              <p className="text-gray-600 dark:text-gray-300">Stage-wise rejection tracking over time</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                From Date
              </label>
              <div className="relative">
                <input
                  id="dateFrom"
                  name="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onStateChange('dateFrom', e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-all duration-200"
                />
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                To Date
              </label>
              <div className="relative">
                <input
                  id="dateTo"
                  name="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => onStateChange('dateTo', e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-all duration-200"
                />
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Vendor
              </label>
              <div className="relative">
                <select
                  id="selectedVendor"
                  name="selectedVendor"
                  value={selectedVendor}
                  onChange={(e) => onStateChange('selectedVendor', e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-all duration-200 appearance-none"
                >
                  {vendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
                <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Rejection Stage
              </label>
              <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800/90 rounded-xl p-1">
                {['both', 'vqc', 'ft'].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => onStateChange('rejectionStage', stage)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors w-full ${
                      rejectionStage === stage
                        ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {stage.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoadRejectionData}
                disabled={isLoadingData}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingData ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Load Data
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('csv')}
                disabled={!rejectionData || !rejectionData.length}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                CSV
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {trendsData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Rejections</p>
                <p className="text-2xl font-bold text-red-600">{trendsData.totalRejections}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>

          {Object.entries(trendsData.stageWiseTotals).map(([stage, count]) => (
            <motion.div
              key={stage}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{stage.toUpperCase()}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{count}</p>
                  <p className="text-xs text-gray-500">
                    {trendsData.totalRejections > 0 ? 
                      `${((count / trendsData.totalRejections) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${getStageColor(stage.toUpperCase()).replace('text-', 'bg-').replace('100', '500').replace('800', 'white').replace('dark:bg-', 'dark:bg-').replace('900/20', '500').replace('dark:text-', 'text-')}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {isLoadingData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Loading Rejection Trends Data...
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-4"
        >
          <p className="text-red-600 dark:text-red-400 font-medium">
            Error: {error}
          </p>
        </motion.div>
      )}

      {rejectionData && rejectionData.length > 0 && !isLoadingData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black/90 rounded-2xl border border-gray-200 dark:border-gray-700/30 overflow-hidden shadow-2xl dark:shadow-black/50"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-black dark:to-gray-900/20 border-b border-gray-200 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Rejection Trends - {selectedVendor}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  From {formatDate(dateFrom)} to {formatDate(dateTo)} • {rejectionData.length} rejection types
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click column headers to sort
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0 z-10">
                <tr>
                  <SortableHeader sortKey="stage" className="sticky left-0 bg-gray-100 dark:bg-gray-900 z-20 min-w-[120px]">
                    Stage
                  </SortableHeader>
                  <SortableHeader sortKey="rejection" className="sticky left-[120px] bg-gray-100 dark:bg-gray-900 z-20 min-w-[250px]">
                    Rejection Type
                  </SortableHeader>
                  {dateRange.map(date => (
                    <SortableHeader key={date} sortKey={date} className="min-w-[80px] text-center">
                      {formatDate(date)}
                    </SortableHeader>
                  ))}
                  <SortableHeader sortKey="total" className="min-w-[80px] text-center bg-gray-200 dark:bg-gray-800">
                    Total
                  </SortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30">
                {sortedData.map((row, index) => (
                  <motion.tr
                    key={`${row.stage}-${row.rejection}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150"
                  >
                    <td className="px-3 py-4 sticky left-0 bg-white dark:bg-black/90 z-10 border-r border-gray-200 dark:border-gray-700/30">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(row.stage)}`}>
                        {row.stage}
                      </span>
                    </td>
                    <td className="px-3 py-4 sticky left-[120px] bg-white dark:bg-black/90 z-10 border-r border-gray-200 dark:border-gray-700/30">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {row.rejection}
                      </span>
                    </td>
                    {dateRange.map(date => {
                      const count = row.dateWiseData[date] || 0;
                      return (
                        <td key={date} className="px-3 py-4 text-center">
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.02 + 0.1 }}
                            className={`inline-flex items-center justify-center min-w-[2rem] h-8 rounded-lg text-sm font-semibold ${
                              count === 0 
                                ? 'text-gray-400 dark:text-gray-500' 
                                : count <= 2 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : count <= 5
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                          >
                            {count}
                          </motion.span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-4 text-center bg-gray-50 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-700/30">
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02 + 0.2 }}
                        className="inline-flex items-center justify-center min-w-[3rem] h-8 px-3 rounded-lg text-sm font-bold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {row.totals.total}
                      </motion.span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {(!rejectionData || rejectionData.length === 0) && !isLoadingData && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gray-50 dark:bg-black/90 rounded-2xl"
        >
          <TrendingDown className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No Rejection Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            Select filters and click "Load Data" to see the rejection trends.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RejectionTrendsTab;