/**
 * This file contains shims for drizzle-zod
 * These shims are used in the client to prevent runtime errors when
 * server-side modules are accidentally imported on the client
 */

// Fake drizzle-zod implementation
export const createInsertSchema = () => {
  return {
    pick: () => ({ parse: () => ({}) }),
    omit: () => ({ parse: () => ({}) })
  };
};

export const createSelectSchema = () => {
  return {
    pick: () => ({ parse: () => ({}) }),
    omit: () => ({ parse: () => ({}) })
  };
};

// Export a mock version of the module
export default {
  createInsertSchema,
  createSelectSchema,
};

// Module warning
console.warn("drizzle-zod shim is being used - server modules should not be imported in client code"); 