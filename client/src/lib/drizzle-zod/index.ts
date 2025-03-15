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

// Add any other exports that might be used
export const zodTable = () => ({});
export const z = {
  infer: (schema: any) => ({}),
  object: () => ({
    pick: () => ({}),
    omit: () => ({})
  }),
  string: () => ({}),
  number: () => ({}),
  boolean: () => ({}),
  date: () => ({}),
  array: () => ({})
};

// Export everything as default export as well to handle different import styles
const drizzleZod = {
  createInsertSchema,
  createSelectSchema,
  zodTable,
  z
};

export default drizzleZod;

// Module warning
console.warn("drizzle-zod shim is being used - server modules should not be imported in client code"); 