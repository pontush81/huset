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

// In-memory sections
const sections = [...defaultSections];

// Auto increment counter for new section IDs
let nextSectionId = sections.reduce((maxId, section) => Math.max(maxId, section.id), 0) + 1;

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
    console.warn('Warning: AUTH_SECRET not set. Admin authentication disabled.');
    return true;
  }
  
  if (!authHeader) {
    return false;
  }
  
  // Basic auth format: "Basic base64(username:password)"
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return false;
  }
  
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');
  
  // Simple password check (in a real app, use proper hashing)
  return password === process.env.AUTH_SECRET;
}

// Direct handler for Vercel serverless functions
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Log request
    console.log(`${req.method} ${req.url}`);
    
    // Get the path without the leading /api
    const path = req.url.replace(/^\/api/, '');
    
    // Handle sections routes
    if (path === '/sections' || path === '/sections/') {
      if (req.method === 'GET') {
        console.log(`Returning ${sections.length} sections`);
        return res.end(safeStringify(sections));
      }
      
      // POST to create a new section
      if (req.method === 'POST') {
        // Validate admin authentication for POST requests
        if (!validateAdminAuth(req)) {
          return res.status(401).end(safeStringify({ 
            error: 'Unauthorized',
            message: 'Admin authentication required'
          }));
        }
        
        try {
          const newSectionData = await parseBody(req);
          
          // Validate required fields
          if (!newSectionData.title) {
            return res.status(400).end(safeStringify({ 
              error: 'Bad Request', 
              message: 'Title is required' 
            }));
          }
          
          // Create new section with defaults for missing fields
          const newSection = {
            id: nextSectionId++,
            title: newSectionData.title,
            slug: newSectionData.slug || createSlug(newSectionData.title),
            content: newSectionData.content || '',
            icon: newSectionData.icon || 'fa-file',
            updatedAt: new Date().toISOString()
          };
          
          // Add to sections array
          sections.push(newSection);
          
          console.log(`Created new section: ${newSection.title} (ID: ${newSection.id})`);
          return res.status(201).end(safeStringify(newSection));
        } catch (error) {
          console.error('Error creating section:', error);
          return res.status(400).end(safeStringify({ 
            error: 'Bad Request', 
            message: error.message 
          }));
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
          
          // Update only allowed fields
          const allowedFields = ['title', 'content', 'icon', 'slug'];
          const updatedSection = { ...section };
          
          for (const field of allowedFields) {
            if (updates[field] !== undefined) {
              updatedSection[field] = updates[field];
            }
          }
          
          // Generate slug from title if title changed but slug wasn't provided
          if (updates.title && !updates.slug) {
            updatedSection.slug = createSlug(updates.title);
          }
          
          // Always update the timestamp
          updatedSection.updatedAt = new Date().toISOString();
          
          // Save the updated section
          sections[sectionIndex] = updatedSection;
          
          console.log(`Updated section ${updatedSection.id}: ${updatedSection.title}`);
          return res.status(200).end(safeStringify(updatedSection));
        } catch (error) {
          console.error('Error updating section:', error);
          return res.status(400).end(safeStringify({ error: 'Invalid request body' }));
        }
      }
      
      // DELETE request
      if (req.method === 'DELETE') {
        // Validate admin authentication for DELETE requests
        if (!validateAdminAuth(req)) {
          return res.status(401).end(safeStringify({ 
            error: 'Unauthorized',
            message: 'Admin authentication required'
          }));
        }
        
        // Remove the section
        const deletedSection = sections.splice(sectionIndex, 1)[0];
        console.log(`Deleted section ${deletedSection.id}: ${deletedSection.title}`);
        
        return res.status(200).end(safeStringify({ 
          success: true,
          message: `Section "${deletedSection.title}" deleted successfully`,
          deletedSection
        }));
      }
    }
    
    // Admin dashboard data
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
        sections: sections.map(s => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          updatedAt: s.updatedAt
        }))
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
          '/admin/dashboard (GET)',
          '/health (GET)'
        ],
        sections: sections.length
      }));
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
      timestamp: new Date().toISOString()
    }));
  }
}; 