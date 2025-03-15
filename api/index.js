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

// Direct handler for Vercel serverless functions
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
      console.log(`Returning ${sections.length} sections`);
      return res.end(safeStringify(sections));
    }
    
    // Handle specific section by slug
    if (path.startsWith('/sections/')) {
      const slug = path.split('/')[2];
      const section = sections.find(s => s.slug === slug);
      
      if (section) {
        console.log(`Found section: ${section.title}`);
        return res.end(safeStringify(section));
      } else {
        console.log(`Section not found: ${slug}`);
        return res.status(404).end(safeStringify({ error: 'Section not found' }));
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
        endpoints: ['/sections', '/sections/:slug', '/health'],
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