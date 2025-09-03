
// src/store/hooks.js
import { useDispatch, useSelector } from 'react-redux';

// Typed hooks for better TypeScript support (optional if using TypeScript)
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;