import { configureStore } from '@reduxjs/toolkit';
import locationReducer from './locationSlice';
import reportReducer from './reportSlice';

export const store = configureStore({
  reducer: {
    location: locationReducer,
    report: reportReducer,
  },
});

