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

// Direct handler for Vercel serverless functions
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
      
      // POST to create a new section (not implemented yet)
      if (req.method === 'POST') {
        return res.status(501).end(safeStringify({ error: 'Creating new sections is not implemented yet' }));
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
        try {
          // Parse the request body
          const updates = await parseBody(req);
          
          // Update only allowed fields
          const allowedFields = ['title', 'content', 'icon'];
          const updatedSection = { ...section };
          
          for (const field of allowedFields) {
            if (updates[field] !== undefined) {
              updatedSection[field] = updates[field];
            }
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
      
      // DELETE request (not implemented yet)
      if (req.method === 'DELETE') {
        return res.status(501).end(safeStringify({ error: 'Deleting sections is not implemented yet' }));
      }
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
          '/sections (GET)',
          '/sections/:id (GET, PUT, PATCH)',
          '/sections/:slug (GET)',
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