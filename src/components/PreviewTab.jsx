import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, RefreshCw, Loader } from 'lucide-react';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const PreviewTab = ({ previewData, isLoading, loadPreviewData }) => {
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

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Data Preview</h2>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={loadPreviewData} 
          disabled={isLoading} 
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Refresh Data
        </motion.button>
      </div>

      {previewData.length > 0 ? (
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
              Showing first 50 records of the dataset
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
                    key={index} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: index * 0.05 }} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors duration-150"
                  >
                    {columns.map(col => (
                      <td 
                        key={col} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-mono"
                      >
                        {String(row[col])}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-black/90 rounded-2xl">
          <Database className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
            No Data to Preview
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Click 'Refresh Data' to fetch from the database.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PreviewTab;