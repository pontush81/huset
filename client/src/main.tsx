// Import dependencies at the top level
import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent server-only modules from being imported in client code
if (typeof window !== 'undefined') {
  // These imports should never happen on the client
  const forbiddenImports = ['drizzle-orm', 'drizzle-zod', 'express'];
  forbiddenImports.forEach(module => {
    Object.defineProperty(window, module, {
      get() {
        console.error(`Attempted to import server-only module '${module}' in client code!`);
        return {};
      }
    });
  });

  // Add global error handling for better debugging
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Log to DOM for visibility if the React app failed to mount
    const errorLog = document.getElementById('error-log');
    if (errorLog) {
      const timestamp = new Date().toISOString();
      errorLog.textContent += `[${timestamp}] Uncaught Error: ${event.message}\n`;
      if (event.error && event.error.stack) {
        errorLog.textContent += `Stack: ${event.error.stack}\n\n`;
      }
    }
  });

  // Add promise rejection handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Log to DOM
    const errorLog = document.getElementById('error-log');
    if (errorLog) {
      const timestamp = new Date().toISOString();
      errorLog.textContent += `[${timestamp}] Unhandled Promise: ${event.reason}\n\n`;
    }
  });
}

// Function to initialize the app
function startApp() {
  try {
    // Log start
    console.log('Starting React application...');

    // Initialize the app with error handling
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found! Make sure there is a div with id="root" in the HTML.');
    }

    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    console.log('React application started successfully');
  } catch (err) {
    // Log initialization errors
    const error = err as Error;
    console.error('Failed to initialize React application:', error);
    
    // Show error in the DOM
    const errorLog = document.getElementById('error-log');
    const loading = document.getElementById('loading');
    
    if (errorLog && loading) {
      errorLog.textContent = `Initialization Error: ${error.message}\n${error.stack || ''}`;
      loading.style.display = 'block';
    }
  }
}

// Start the application
startApp();
