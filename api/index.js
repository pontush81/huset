// Simple API handler for Vercel serverless functions

// Default sections for the BRF handbook
const defaultSections = [
  {
    id: 1,
    title: "Aktivitetsrum",
    slug: "aktivitetsrum",
    content: "Information om föreningens aktivitetsrum och hur man bokar det.",
    icon: "fa-running",
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Elbil",
    slug: "elbil",
    content: "Information om laddstationer för elbilar i föreningen.",
    icon: "fa-car-side",
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "Ellagården",
    slug: "ellagarden",
    content: "Allmän information om bostadsrättsföreningen Ellagården.",
    icon: "fa-home",
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    title: "Stämma",
    slug: "stamma",
    content: "Information om föreningens årsstämma och extra stämmor.",
    icon: "fa-users",
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    title: "Grillregler",
    slug: "grillregler",
    content: "Regler för grillning på balkonger och i gemensamma utrymmen.",
    icon: "fa-fire",
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    title: "Gästlägenhet",
    slug: "gastlagenhet",
    content: "Vår förening har en gästlägenhet som medlemmar kan boka för sina gäster.",
    icon: "fa-bed",
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    title: "Färgkoder",
    slug: "fargkoder",
    content: "Färgkoder för målning av dörrar, fönster och andra detaljer i föreningen.",
    icon: "fa-paint-brush",
    updatedAt: new Date().toISOString()
  },
  {
    id: 8,
    title: "Sophantering",
    slug: "sophantering",
    content: "Information om sophantering, återvinning och miljörum.",
    icon: "fa-trash-alt",
    updatedAt: new Date().toISOString()
  },
  {
    id: 9,
    title: "Styrelse",
    slug: "styrelse",
    content: "Information om föreningens styrelse och kontaktuppgifter.",
    icon: "fa-users-cog",
    updatedAt: new Date().toISOString()
  },
  {
    id: 10,
    title: "Sidfot",
    slug: "footer",
    content: JSON.stringify({
      address: "Ellagårdsvägen 123, 123 45 Stockholm",
      email: "styrelsen@ellagarden.se",
      phone: "08-123 45 67",
      copyright: "© 2025 BRF Ellagården. Alla rättigheter förbehållna."
    }),
    icon: "fa-shoe-prints",
    updatedAt: new Date().toISOString()
  }
];

// In-memory storage (resets on function restart)
let sections = [...defaultSections];

// Auto increment counter for new section IDs
let nextSectionId = sections.reduce((maxId, section) => Math.max(maxId, section.id || 0), 0) + 1;

// Safe JSON stringify
function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    console.error('Error stringifying object:', err);
    return JSON.stringify({ error: 'Could not serialize response' });
  }
}

// Parse request body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Create a slug from a title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// Simple basic auth middleware
function validateAdminAuth(req) {
  const authHeader = req.headers.authorization;
  
  // Skip auth validation if AUTH_SECRET is not set
  if (!process.env.AUTH_SECRET) {
    console.warn('Warning: AUTH_SECRET not set. Using default password "admin"');
    
    // If AUTH_SECRET is not set, check for default password "admin"
    if (!authHeader) {
      return false;
    }
    
    // Basic auth format: "Basic base64(username:password)"
    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const password = credentials.split(':')[1]; // Ignore username part
      
      return password === 'admin';
    } catch (error) {
      console.error('Error validating auth with default password:', error);
      return false;
    }
  }
  
  // Check if Authorization header exists
  if (!authHeader) {
    return false;
  }
  
  // Basic auth format: "Basic base64(username:password)"
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const password = credentials.split(':')[1]; // Ignore username part
    
    return password === process.env.AUTH_SECRET;
  } catch (error) {
    console.error('Error validating admin auth:', error);
    return false;
  }
}

// Find next available ID (safe version)
function getNextAvailableId(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 1; // Start with ID 1 if no items
  }
  
  // Filter out items without valid IDs before mapping
  const validIds = items
    .filter(item => item && typeof item.id === 'number')
    .map(item => item.id);
    
  return validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
}

// Main handler function
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Get path from request
    const url = new URL(req.url, `http://${req.headers.host}`);
    let path = url.pathname;
    
    // Remove trailing slash if present
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    
    console.log(`API Request: ${req.method} ${path}`);
    
    // Handle /api routes by removing the /api prefix if it exists
    if (path.startsWith('/api/')) {
      path = path.substring(4);
    }
    
    // Debug: Log the current state of sections to verify they all have valid IDs
    console.log('Current sections:', sections.map(s => s ? { id: s.id, title: s.title } : 'undefined'));
    
    // Log request details
    console.log('Request details:', {
      method: req.method,
      path,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams)
    });

    // Handle admin sections routes - these mirror the regular sections routes but enforce admin auth
    if (path.startsWith('/admin/sections')) {
      // Validate admin authentication for all admin routes
      if (!validateAdminAuth(req)) {
        return res.status(401).end(safeStringify({ 
          error: 'Unauthorized',
          message: 'Admin authentication required'
        }));
      }
      
      // GET all sections (admin)
      if (path === '/admin/sections' && req.method === 'GET') {
        console.log('Serving sections data (admin)');
        return res.end(safeStringify(sections));
      }
      
      // POST to create new section (admin)
      if (path === '/admin/sections' && req.method === 'POST') {
        try {
          const newSection = await parseBody(req);
          
          // Validate required fields
          if (!newSection.title) {
            return res.status(400).end(safeStringify({ error: 'Title is required' }));
          }
          
          // Generate slug if not provided
          if (!newSection.slug) {
            newSection.slug = createSlug(newSection.title);
          }
          
          // Find next available ID (using safe method)
          const nextId = getNextAvailableId(sections);
          
          // Create new section
          const createdSection = {
            id: nextId,
            title: newSection.title,
            slug: newSection.slug,
            content: newSection.content || '',
            icon: newSection.icon || 'fa-file',
            updatedAt: new Date().toISOString()
          };
          
          // Add to sections
          sections.push(createdSection);
          
          console.log(`Created new section (admin): ${createdSection.title}`);
          return res.status(201).end(safeStringify({
            message: 'Section created successfully',
            section: createdSection
          }));
        } catch (error) {
          console.error('Error creating section (admin):', error);
          return res.status(400).end(safeStringify({ error: 'Invalid request body' }));
        }
      }
      
      // Handle specific section by ID in admin route
      if (path.startsWith('/admin/sections/')) {
        const idOrSlug = path.split('/')[3];
        
        // Try to parse as ID first
        let sectionIndex = -1;
        const id = parseInt(idOrSlug, 10);
        
        if (!isNaN(id)) {
          sectionIndex = sections.findIndex(s => s.id === id);
        } else {
          // If not a valid ID, try to find by slug
          sectionIndex = sections.findIndex(s => s.slug === idOrSlug);
        }
        
        if (sectionIndex === -1) {
          console.log(`Section not found (admin): ${idOrSlug}`);
          return res.status(404).end(safeStringify({ error: 'Section not found' }));
        }
        
        const section = sections[sectionIndex];
        
        // GET request to fetch a section
        if (req.method === 'GET') {
          console.log(`Found section (admin): ${section.title}`);
          return res.end(safeStringify(section));
        }
        
        // PUT or PATCH request to update a section
        if (req.method === 'PUT' || req.method === 'PATCH') {
          try {
            // Parse the request body
            const updates = await parseBody(req);
            
            console.log(`Received updates for section (admin) ${section.id}:`, updates);
            
            // Update only allowed fields
            const allowedFields = ['title', 'content', 'icon', 'slug'];
            const updatedSection = { ...section };
            
            for (const field of allowedFields) {
              if (updates[field] !== undefined) {
                updatedSection[field] = updates[field];
              }
            }
            
            // Update updatedAt timestamp
            updatedSection.updatedAt = new Date().toISOString();
            
            // Validate updatedSection has all required fields
            if (!updatedSection.id) {
              console.error('Missing ID in updated section:', updatedSection);
              return res.status(400).end(safeStringify({ 
                error: 'Invalid section data', 
                message: 'Section ID is missing after update' 
              }));
            }
            
            // Extra validation to prevent undefined values in response
            const validatedSection = {
              id: updatedSection.id,
              title: updatedSection.title || section.title,
              slug: updatedSection.slug || section.slug,
              content: updatedSection.content !== undefined ? updatedSection.content : section.content,
              icon: updatedSection.icon || section.icon,
              updatedAt: updatedSection.updatedAt
            };
            
            // Extra logging for debugging
            console.log('Final validated section data being saved:', validatedSection);
            
            // Update sections array
            sections[sectionIndex] = validatedSection;
            
            console.log(`Updated section (admin) ${validatedSection.id}: ${validatedSection.title}`);
            return res.end(safeStringify(validatedSection));
          } catch (error) {
            console.error('Error updating section (admin):', error);
            return res.status(400).end(safeStringify({ 
              error: 'Invalid request body',
              message: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }));
          }
        }
        
        // DELETE request to remove a section
        if (req.method === 'DELETE') {
          // Remove section from array
          sections = sections.filter(s => s.id !== section.id);
          
          console.log(`Deleted section (admin) ${section.id}: ${section.title}`);
          return res.end(safeStringify({ 
            message: 'Section deleted successfully',
            id: section.id
          }));
        }
      }
    }
    
    // Handle regular sections routes
    if (path === '/sections') {
      if (req.method === 'GET') {
        console.log('Serving sections data');
        return res.end(safeStringify(sections));
      }
      
      if (req.method === 'POST') {
        // Validate admin authentication for POST
        if (!validateAdminAuth(req)) {
          return res.status(401).end(safeStringify({
            error: 'Unauthorized',
            message: 'Admin authentication required for creating sections'
          }));
        }
        
        try {
          const newSection = await parseBody(req);
          
          // Validate required fields
          if (!newSection.title) {
            return res.status(400).end(safeStringify({ error: 'Title is required' }));
          }
          
          // Generate slug if not provided
          if (!newSection.slug) {
            newSection.slug = createSlug(newSection.title);
          }
          
          // Find next available ID (using safe method)
          const nextId = getNextAvailableId(sections);
          
          // Create new section
          const createdSection = {
            id: nextId,
            title: newSection.title,
            slug: newSection.slug,
            content: newSection.content || '',
            icon: newSection.icon || 'fa-file',
            updatedAt: new Date().toISOString()
          };
          
          // Add to sections
          sections.push(createdSection);
          
          console.log(`Created new section: ${createdSection.title}`);
          return res.status(201).end(safeStringify({
            message: 'Section created successfully',
            section: createdSection
          }));
        } catch (error) {
          console.error('Error creating section:', error);
          return res.status(400).end(safeStringify({ error: 'Invalid request body' }));
        }
      }
    }
    
    // Handle specific section by ID or slug
    if (path.startsWith('/sections/')) {
      const idOrSlug = path.split('/')[2];
      
      // Try to parse as ID first
      let sectionIndex = -1;
      const id = parseInt(idOrSlug, 10);
      
      if (!isNaN(id)) {
        sectionIndex = sections.findIndex(s => s.id === id);
      } else {
        // If not a valid ID, try to find by slug
        sectionIndex = sections.findIndex(s => s.slug === idOrSlug);
      }
      
      if (sectionIndex === -1) {
        console.log(`Section not found: ${idOrSlug}`);
        return res.status(404).end(safeStringify({ error: 'Section not found' }));
      }
      
      const section = sections[sectionIndex];
      
      // GET request to fetch a section
      if (req.method === 'GET') {
        console.log(`Found section: ${section.title}`);
        return res.end(safeStringify(section));
      }
      
      // PUT or PATCH request to update a section
      if (req.method === 'PUT' || req.method === 'PATCH') {
        // Validate admin authentication for PUT/PATCH requests
        if (!validateAdminAuth(req)) {
          return res.status(401).end(safeStringify({ 
            error: 'Unauthorized',
            message: 'Admin authentication required'
          }));
        }
        
        try {
          // Parse the request body
          const updates = await parseBody(req);
          
          console.log(`Received updates for section ${section.id}:`, updates);
          
          // Update only allowed fields
          const allowedFields = ['title', 'content', 'icon', 'slug'];
          const updatedSection = { ...section };
          
          for (const field of allowedFields) {
            if (updates[field] !== undefined) {
              updatedSection[field] = updates[field];
            }
          }
          
          // Update updatedAt timestamp
          updatedSection.updatedAt = new Date().toISOString();
          
          // Validate updatedSection has all required fields
          if (!updatedSection.id) {
            console.error('Missing ID in updated section:', updatedSection);
            return res.status(400).end(safeStringify({ 
              error: 'Invalid section data', 
              message: 'Section ID is missing after update' 
            }));
          }
          
          // Extra validation to prevent undefined values in response
          const validatedSection = {
            id: updatedSection.id,
            title: updatedSection.title || section.title,
            slug: updatedSection.slug || section.slug,
            content: updatedSection.content !== undefined ? updatedSection.content : section.content,
            icon: updatedSection.icon || section.icon,
            updatedAt: updatedSection.updatedAt
          };
          
          // Extra logging for debugging
          console.log('Final validated section data being saved:', validatedSection);
          
          // Update sections array
          sections[sectionIndex] = validatedSection;
          
          console.log(`Updated section ${validatedSection.id}: ${validatedSection.title}`);
          return res.end(safeStringify(validatedSection));
        } catch (error) {
          console.error('Error updating section:', error);
          return res.status(400).end(safeStringify({ 
            error: 'Invalid request body',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }));
        }
      }
      
      // DELETE request to remove a section
      if (req.method === 'DELETE') {
        // Validate admin authentication for DELETE requests
        if (!validateAdminAuth(req)) {
          return res.status(401).end(safeStringify({ 
            error: 'Unauthorized',
            message: 'Admin authentication required'
          }));
        }
        
        // Remove section from array
        sections = sections.filter(s => s.id !== section.id);
        
        console.log(`Deleted section ${section.id}: ${section.title}`);
        return res.end(safeStringify({ 
          message: 'Section deleted successfully',
          id: section.id
        }));
      }
    }
    
    // Handle /admin/dashboard
    if (path === '/admin/dashboard' || path === '/admin/dashboard/') {
      // Validate admin authentication for dashboard data
      if (!validateAdminAuth(req)) {
        return res.status(401).end(safeStringify({ 
          error: 'Unauthorized',
          message: 'Admin authentication required'
        }));
      }
      
      const dashboardData = {
        totalSections: sections.length,
        lastUpdated: new Date().toISOString(),
        sections: sections
      };
      
      return res.end(safeStringify(dashboardData));
    }
    
    // Health check
    if (path === '/health' || path === '/health/') {
      const healthData = { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'unknown',
        sections: sections.length
      };
      console.log('Health check:', healthData);
      return res.end(safeStringify(healthData));
    }
    
    // If path is root, show API info
    if (path === '/' || path === '') {
      return res.end(safeStringify({
        api: 'BRF Ellagården API',
        version: '1.0.0',
        endpoints: [
          '/sections (GET, POST)',
          '/sections/:id (GET, PUT, PATCH, DELETE)',
          '/sections/:slug (GET)',
          '/admin/sections (GET, POST)',
          '/admin/sections/:id (GET, PUT, PATCH, DELETE)',
          '/admin/dashboard (GET)',
          '/admin/login (POST)',
          '/health (GET)'
        ],
        sections: sections.length
      }));
    }
    
    // Admin login route for testing authentication
    if (path === '/admin/login' || path === '/admin/login/') {
      // Only handle POST
      if (req.method === 'POST') {
        try {
          // Parse login data
          const loginData = await parseBody(req);
          
          // If no AUTH_SECRET set, expect "admin" password
          const expectedPassword = process.env.AUTH_SECRET || 'admin';
          
          if (loginData.password === expectedPassword) {
            return res.status(200).end(safeStringify({
              success: true,
              message: 'Authentication successful',
              authSecret: process.env.AUTH_SECRET ? 'set' : 'not set (using default)'
            }));
          } else {
            return res.status(401).end(safeStringify({
              success: false,
              message: 'Invalid password',
              hint: !process.env.AUTH_SECRET ? 'Default password is "admin" when AUTH_SECRET is not set' : undefined
            }));
          }
        } catch (error) {
          console.error('Login error:', error);
          return res.status(400).end(safeStringify({
            success: false,
            message: 'Invalid request'
          }));
        }
      } else {
        return res.status(405).end(safeStringify({
          success: false,
          message: 'Method not allowed, use POST'
        }));
      }
    }
    
    // Default 404 response
    console.log(`404 Not Found: ${path}`);
    return res.status(404).end(safeStringify({ 
      error: 'Not Found', 
      path,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).end(safeStringify({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
}; 