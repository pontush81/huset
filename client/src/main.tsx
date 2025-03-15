// Handle module resolution errors early
try {
  // Import dependencies at the top level
  import React from 'react';
  import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./index.css";

  // Prevent server-only modules from being imported in client code
  if (typeof window !== 'undefined') {
    // These imports should never happen on the client
    const forbiddenImports = ['drizzle-orm', 'drizzle-zod', 'express', '@neondatabase/serverless'];
    
    // Create module blockers
    forbiddenImports.forEach(module => {
      Object.defineProperty(window, module, {
        get() {
          const errorMsg = `Attempted to import server-only module '${module}' in client code!`;
          console.error(errorMsg);
          // Log to DOM
          const errorLog = document.getElementById('error-log');
          if (errorLog) {
            errorLog.textContent += `[${new Date().toISOString()}] ${errorMsg}\n`;
            document.getElementById('loading')?.style.display = 'block';
          }
          
          // Throw error to prevent execution
          throw new Error(`Server-only module '${module}' cannot be used in client code`);
        }
      });
    });

    // Intercept dynamic imports to catch server-only modules
    const originalImport = window.Function.prototype.constructor;
    window.Function.prototype.constructor = function(...args) {
      const fnBody = args[args.length - 1];
      
      if (typeof fnBody === 'string' && 
          (fnBody.includes('drizzle-zod') || 
           fnBody.includes('drizzle-orm') || 
           fnBody.includes('@neondatabase/serverless'))) {
        
        console.error('Blocked dynamic import of server-only module:', fnBody);
        const errorModule = fnBody.match(/['"]([^'"]+)['"]/)?.[1] || 'unknown';
        
        // Redirect to fallback page
        window.location.href = `/fallback.html?module=${encodeURIComponent(errorModule)}`;
        
        // Return empty function to prevent further execution
        return originalImport.call(this, '', 'return () => {}');
      }
      
      return originalImport.apply(this, args);
    };

    // Add global error handling for better debugging
    window.addEventListener('error', (event) => {
      // Check if this is a module resolution error
      if (event.message && event.message.includes('Failed to resolve module specifier')) {
        const moduleMatch = event.message.match(/module specifier ["']([^"']+)["']/);
        if (moduleMatch && moduleMatch[1]) {
          const badModule = moduleMatch[1];
          console.error('Module resolution error:', badModule);
          
          // Redirect to fallback page after a brief delay
          setTimeout(() => {
            window.location.href = `/fallback.html?module=${encodeURIComponent(badModule)}`;
          }, 100);
        }
      }
      
      console.error('Global error:', event.error);
      
      // Log to DOM for visibility if the React app failed to mount
      const errorLog = document.getElementById('error-log');
      if (errorLog) {
        const timestamp = new Date().toISOString();
        errorLog.textContent += `[${timestamp}] Uncaught Error: ${event.message}\n`;
        if (event.error && event.error.stack) {
          errorLog.textContent += `Stack: ${event.error.stack}\n\n`;
        }
        document.getElementById('loading')?.style.display = 'block';
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
        document.getElementById('loading')?.style.display = 'block';
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
  
} catch (error) {
  console.error('Critical error in main.tsx:', error);
  // If we catch an error at the top level, show the fallback
  if (typeof window !== 'undefined') {
    window.location.href = '/fallback.html';
  }
}
