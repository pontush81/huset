/**
 * This file contains shims for server-side modules
 * These shims are used in the client to prevent runtime errors when
 * server-side modules are accidentally imported on the client
 */

// Fake drizzle-zod implementation
export const createInsertSchema = () => {
  throw new Error("drizzle-zod cannot be used in client code");
};

export const createSelectSchema = () => {
  throw new Error("drizzle-zod cannot be used in client code");
};

// Export a mock version of the module
export default {
  createInsertSchema,
  createSelectSchema,
};

// Module warning
console.warn("server-module-shims.ts is being used - server modules should not be imported in client code"); 