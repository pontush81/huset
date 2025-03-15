// @ts-nocheck
import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Setup error handlers
if (typeof window !== 'undefined') {
  // Server-side modules that should be blocked in client
  const serverModules = ['drizzle-orm', 'drizzle-zod', 'express', '@neondatabase/serverless'];
  
  // Block server modules
  serverModules.forEach(moduleName => {
    // Add a property with a getter that throws an error
    Object.defineProperty(window, moduleName, {
      configurable: true,
      get: () => {
        console.error(`Error: ${moduleName} is a server-only module and cannot be used in client code`);
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
          loadingElement.style.display = 'block';
        }
        throw new Error(`Server module "${moduleName}" cannot be used in browser`);
      }
    });
  });
  
  // Global error handler
  window.addEventListener('error', event => {
    console.error('Global error:', event.error || event.message);
    
    // Check for module resolution errors
    if (event.message && event.message.includes('Failed to resolve module specifier')) {
      const match = event.message.match(/module specifier ["']([^"']+)["']/);
      const moduleName = match?.[1] || 'unknown';
      
      // Show the loading element with error
      const errorLog = document.getElementById('error-log');
      if (errorLog) {
        errorLog.textContent = `Failed to load module: ${moduleName}\n${event.message}`;
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
          loadingElement.style.display = 'block';
        }
      }
    }
  });
}

// Initialize app with error handling
function initApp() {
  try {
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('Root element not found');
    }
    
    createRoot(container).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error initializing app:', error);
    // Display error to user
    const errorElement = document.getElementById('error-log');
    if (errorElement) {
      errorElement.textContent = String(error);
      const loadingElement = document.getElementById('loading');
      if (loadingElement) {
        loadingElement.style.display = 'block';
      }
    }
  }
}

// Start the app
initApp();
