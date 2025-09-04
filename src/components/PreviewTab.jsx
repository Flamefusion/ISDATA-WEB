// src/components/PreviewTab.jsx - Updated with Real API Integration
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, RefreshCw, Loader } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setPreviewData, 
  setLoading, 
  setError,
  clearData
} from '../store/slices/dataSlice';
import { showAlert } from '../store/slices/uiSlice';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const PreviewTab = () => {
  const dispatch = useDispatch();
  const { previewData, isLoading, error } = useSelector((state) => state.data);
  
  const desiredColumns = [
    'date', 'vendor', 'mo_number', 'serial_number', 'sku', 'ring_size',
    'vqc_status', 'ft_status', 'vqc_reason', 'ft_reason', 'created_at', 'updated_at',
  ];
  
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (previewData.length > 0) {
      const availableColumns = Object.keys(previewData[0]);
      const filteredAndOrderedColumns = desiredColumns.filter(col => 
        availableColumns.includes(col)
      );
      setColumns(filteredAndOrderedColumns);
    }
  }, [previewData]);

  const handleLoadPreviewData = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await fetch('/api/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Format dates for better display
      const formattedData = data.map(record => ({
        ...record,
        date: record.date ? new Date(record.date).toLocaleDateString() : '',
        created_at: record.created_at ? new Date(record.created_at).toLocaleString() : '',
        updated_at: record.updated_at ? new Date(record.updated_at).toLocaleString() : '',
      }));

      dispatch(setPreviewData(formattedData));
      dispatch(showAlert({ 
        message: `Loaded ${formattedData.length} records`, 
        type: 'success' 
      }));
    } catch (err) {
      console.error('Preview data error:', err);
      dispatch(setError(err.message));
      dispatch(showAlert({ 
        message: 'Failed to load preview data', 
        type: 'error' 
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const formatCellValue = (value, columnName) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    
    // Handle status columns with badges
    if (columnName.includes('status')) {
      const status = String(value).toLowerCase();
      const isPass = ['pass', 'accepted'].includes(status);
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isPass 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : status !== '-' && status !== ''
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        }`}>
          {value || '-'}
        </span>
      );
    }
    
    // Handle reason columns with truncation
    if (columnName.includes('reason')) {
      const reasonText = String(value);
      if (reasonText.length > 30) {
        return (
          <span title={reasonText} className="cursor-help">
            {reasonText.substring(0, 30)}...
          </span>
        );
      }
      return reasonText;
    }
    
    return String(value);
  };

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Data Preview</h2>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={handleLoadPreviewData} 
          disabled={isLoading} 
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Refresh Data
        </motion.button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-4"
        >
          <p className="text-red-600 dark:text-red-400 font-medium">
            Error: {error}
          </p>
          <p className="text-red-500 dark:text-red-300 text-sm mt-1">
            Make sure the database is configured and contains data. Try running a migration first.
          </p>
        </motion.div>
      )}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Loading Preview Data...
            </p>
          </div>
        </motion.div>
      )}

      {previewData.length > 0 && !isLoading ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-black/90 rounded-2xl border border-gray-200 dark:border-gray-700/30 overflow-hidden shadow-2xl dark:shadow-black/50"
        >
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-black dark:to-gray-900/20 border-b border-gray-200 dark:border-gray-700/30">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Preview Data ({previewData.length} records)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Showing {Math.min(50, previewData.length)} of {previewData.length} records from the database
            </p>
          </div>

          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                <tr>
                  {columns.map((header) => (
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
                {previewData.slice(0, 50).map((row, index) => (
                  <motion.tr 
                    key={row.id || index} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: Math.min(index * 0.02, 1) }} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150"
                  >
                    {columns.map(col => (
                      <td 
                        key={col} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
                      >
                        {formatCellValue(row[col], col)}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Stats */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700/30">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-6">
                <span>Total Records: {previewData.length}</span>
                {previewData.length > 0 && (
                  <>
                    <span>
                      VQC Pass: {previewData.filter(r => ['pass', 'accepted'].includes(String(r.vqc_status || '').toLowerCase())).length}
                    </span>
                    <span>
                      FT Pass: {previewData.filter(r => ['pass', 'accepted'].includes(String(r.ft_status || '').toLowerCase())).length}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>
      ) : !isLoading && !error && (
        <div className="text-center py-16 bg-gray-50 dark:bg-black/90 rounded-2xl">
          <Database className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
            No Data to Preview
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            The database appears to be empty. Try running a migration first.
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>1. Configure Google Sheets connection in the Configuration tab</p>
            <p>2. Test your database connection</p>
            <p>3. Run a data migration</p>
            <p>4. Then return here to preview your data</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PreviewTab;