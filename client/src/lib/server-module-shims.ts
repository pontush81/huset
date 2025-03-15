/**
 * This file contains shims for server-side modules
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

// PG-core shims for drizzle-orm/pg-core
export const pgTable = () => ({
  $inferSelect: {},
  primaryKey: () => ({}),
});

export const text = () => ({
  notNull: () => ({
    unique: () => ({}),
    default: () => ({}),
  }),
  default: () => ({}),
});

export const serial = () => ({
  primaryKey: () => ({}),
});

export const integer = () => ({
  notNull: () => ({
    default: () => ({}),
  }),
});

export const boolean = () => ({
  notNull: () => ({
    default: () => ({}),
  }),
});

export const timestamp = () => ({
  notNull: () => ({
    default: () => ({}),
    defaultNow: () => ({}),
  }),
});

export const date = () => ({
  notNull: () => ({
    default: () => ({}),
  }),
});

// Module warning
console.warn("server-module-shims.ts is being used - server modules should not be imported in client code"); 