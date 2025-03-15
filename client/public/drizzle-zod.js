// This is a shim for drizzle-zod to prevent module resolution errors
export const createInsertSchema = () => {
  throw new Error("drizzle-zod cannot be used in client code");
};

export const createSelectSchema = () => {
  throw new Error("drizzle-zod cannot be used in client code");
};

export default {
  createInsertSchema,
  createSelectSchema
}; 