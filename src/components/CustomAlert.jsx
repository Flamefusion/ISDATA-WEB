import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const CustomAlert = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const Icon = type === 'success' ? CheckCircle : XCircle;
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const borderColor = type === 'success' ? 'border-green-700' : 'border-red-700';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -50 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -50, transition: { duration: 0.5 } }} 
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-xl shadow-lg flex items-center gap-3 text-white font-semibold border-b-4 ${bgColor} ${borderColor}`}
    >
      <Icon className="w-6 h-6" />
      <p>{message}</p>
      <button 
        onClick={onClose} 
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <XCircle className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default CustomAlert;