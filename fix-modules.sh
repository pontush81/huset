#!/bin/bash

# Script to ensure all server-side module shims are properly set up
echo "Setting up module shims..."

# Create node_modules directory if it doesn't exist
mkdir -p node_modules/drizzle-zod
mkdir -p node_modules/drizzle-orm
mkdir -p node_modules/drizzle-orm/pg-core

# Create client node_modules directory if it doesn't exist
mkdir -p client/node_modules/drizzle-zod 
mkdir -p client/node_modules/drizzle-orm
mkdir -p client/node_modules/drizzle-orm/pg-core

# Copy shim files to node_modules for absolute imports
echo "Copying drizzle-zod shim..."
cp -f client/src/lib/drizzle-zod/index.ts node_modules/drizzle-zod/index.js
cp -f client/src/lib/drizzle-zod/index.ts client/node_modules/drizzle-zod/index.js

echo "Copying drizzle-orm shims..."
cp -f client/src/lib/drizzle-orm/index.ts node_modules/drizzle-orm/index.js
cp -f client/src/lib/drizzle-orm/index.ts client/node_modules/drizzle-orm/index.js

echo "Copying pg-core shims..."
cp -f client/src/lib/drizzle-orm/pg-core/index.ts node_modules/drizzle-orm/pg-core/index.js
cp -f client/src/lib/drizzle-orm/pg-core/index.ts client/node_modules/drizzle-orm/pg-core/index.js

# Fix permissions
chmod +x fix-modules.sh

echo "Module shims setup complete!" 