/**
 * This file contains shims for drizzle-orm
 * These shims are used in the client to prevent runtime errors when
 * server-side modules are accidentally imported on the client
 */

// Export placeholder module
export default {
  // Empty implementation
};

// Module warning
console.warn("drizzle-orm shim is being used - server modules should not be imported in client code"); 