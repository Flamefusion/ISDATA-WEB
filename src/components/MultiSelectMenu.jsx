import React, { useState } from 'react';
import { Filter } from 'lucide-react';

const MultiSelectMenu = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (option) => { 
    const newSelected = selected.includes(option) ? 
      selected.filter(item => item !== option) : 
      [...selected, option]; 
    onChange(newSelected); 
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}
      </label>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full mt-2 px-4 py-3 text-left rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-400 transition-all duration-200 flex justify-between items-center"
      >
        <span className="truncate">
          {selected.length === 0 ? `All` : 
           selected.length === 1 ? selected[0] : 
           `${selected.length} selected`}
        </span>
        <Filter className="w-4 h-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700/30 rounded-xl shadow-lg max-h-60 overflow-auto" 
          onMouseLeave={() => setIsOpen(false)}
        >
          {options.map(option => (
            <div 
              key={option} 
              className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/70 cursor-pointer" 
              onClick={() => handleSelect(option)}
            >
              <input 
                type="checkbox" 
                readOnly 
                checked={selected.includes(option)} 
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
              />
              <label className="ml-3 text-sm text-gray-700 dark:text-gray-200">
                {option}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectMenu;