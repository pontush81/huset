/**
 * This file contains shims for drizzle-orm/pg-core
 * These shims are used in the client to prevent runtime errors when
 * server-side modules are accidentally imported on the client
 */

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
console.warn("drizzle-orm/pg-core shim is being used - server modules should not be imported in client code"); 