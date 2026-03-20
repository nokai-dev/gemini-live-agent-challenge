import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/main.css';

// Initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN || '',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
            <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-4">
              An error occurred in the application. Please try again.
            </p>
            <pre className="bg-slate-100 p-4 rounded-lg text-sm text-red-700 mb-4 overflow-auto">
              {error.message}
            </pre>
            <button
              onClick={resetError}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);