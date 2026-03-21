import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<div className="loading-overlay"><div className="spinner"></div></div>}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
