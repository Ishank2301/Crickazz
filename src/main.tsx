import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getStoredTheme, applyTheme } from './utils/theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initPersistentLogger } from './utils/logger';

// Initialize persistent log capture for console and runtime error monitoring
initPersistentLogger();

// Initialize persisted theme before render
applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

