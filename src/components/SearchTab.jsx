import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Calendar, 
  FileText, 
  Search, 
  Download, 
  Loader 
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateSearchFilters,
  clearSearchFilters,
} from '../store/slices/searchSlice';
import { 
  performSearch, 
  loadFilterOptions, 
  exportSearchResults 
} from '../store/thunks/searchThunks';
import MultiSelectMenu from './MultiSelectMenu';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const SearchTab = () => {
  const dispatch = useDispatch();
  const { 
    searchFilters, 
    searchResults, 
    filterOptions, 
    isLoading, 
    error 
  } = useSelector((state) => state.search);

  useEffect(() => {
    dispatch(loadFilterOptions());
  }, [dispatch]);

  const handlePerformSearch = () => {
    dispatch(performSearch(searchFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearSearchFilters());
  };

  const handleExportCsv = () => {
    if (searchResults.length > 0) {
      dispatch(exportSearchResults(searchFilters));
    }
  };


  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black rounded-2xl p-6 border border-indigo-200/50 dark:border-gray-700/30">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {item.label}
              </label>
              <div className="relative">
                <input 
                  type={item.type || 'text'} 
                  value={searchFilters[item.field]} 
                  onChange={(e) => dispatch(updateSearchFilters({ [item.field]: e.target.value }))} 
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-400 transition-all duration-200" 
                  placeholder={item.placeholder} 
                />
                <item.icon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <MultiSelectMenu 
            label="Vendor" 
            options={filterOptions.vendors} 
            selected={searchFilters.vendor} 
            onChange={(selected) => dispatch(updateSearchFilters({ vendor: selected }))} 
          />
          <MultiSelectMenu 
            label="VQC Status" 
            options={filterOptions.vqc_statuses} 
            selected={searchFilters.vqcStatus} 
            onChange={(selected) => dispatch(updateSearchFilters({ vqcStatus: selected }))} 
          />
          <MultiSelectMenu 
            label="FT Status" 
            options={filterOptions.ft_statuses} 
            selected={searchFilters.ftStatus} 
            onChange={(selected) => dispatch(updateSearchFilters({ ftStatus: selected }))} 
          />
          <MultiSelectMenu 
            label="Rejection Reason" 
            options={filterOptions.reasons} 
            selected={searchFilters.rejectionReason} 
            onChange={(selected) => dispatch(updateSearchFilters({ rejectionReason: selected }))} 
          />
        </div>

        <div className="flex gap-4 mt-6">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handlePerformSearch} 
            disabled={isLoading} 
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Search Rings
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleExportCsv} 
            disabled={!searchResults.length} 
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleClearFilters} 
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Clear Filters
          </motion.button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-lg"
          >
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              Error: {error}
            </p>
          </motion.div>
        )}
      </div>

      {searchResults.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-black/90 rounded-2xl border border-gray-200 dark:border-gray-700/30 overflow-hidden shadow-2xl dark:shadow-black/50"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-black dark:to-gray-900/20 border-b border-gray-200 dark:border-gray-700/30">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Search Results ({searchResults.length} found)
            </h3>
          </div>

          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                <tr>
                  {['serial_number', 'mo_number', 'vendor', 'date', 'vqc_status', 'ft_status'].map((header) => (
                    <th 
                      key={header} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30">
                {searchResults.map((row, index) => (
                  <motion.tr 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.03 }} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-200">
                      {row.serial_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {row.mo_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {row.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {row.date}
                    </td>
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
};

export default SearchTab;