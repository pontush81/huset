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
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize the app
createRoot(document.getElementById("root")!).render(<App />);
