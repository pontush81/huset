import express from 'express';
import path from 'path';
import fs from 'fs';

// Create Express app
const app = express();

// Add CORS headers to allow browser access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Default sections for initial setup
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

// In-memory section storage for Vercel (will reset on deployment)
let sections = [...defaultSections];

// API Routes
app.get('/api/sections', (req, res) => {
  console.log('GET /api/sections called, returning:', sections.length, 'sections');
  res.json(sections);
});

app.get('/api/sections/:slug', (req, res) => {
  const { slug } = req.params;
  const section = sections.find(s => s.slug === slug);
  
  if (!section) {
    return res.status(404).json({ error: "Section not found" });
  }
  
  res.json(section);
});

// ADD NEW ROUTES FOR UPDATING SECTIONS
// PUT endpoint for updating a section
app.put('/api/sections', (req, res) => {
  try {
    console.log('PUT /api/sections called with body:', req.body);
    
    const { section } = req.body;
    
    // Validate incoming data
    if (!section || typeof section.id !== 'number') {
      return res.status(400).json({ error: "Invalid section data" });
    }
    
    // Find section by ID
    const index = sections.findIndex(s => s.id === section.id);
    
    if (index === -1) {
      return res.status(404).json({ error: "Section not found" });
    }
    
    // Update the section
    sections[index] = {
      ...sections[index],
      ...section,
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Section ${section.id} updated successfully`);
    res.json(sections[index]);
  } catch (err) {
    console.error('Error updating section:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH/PUT endpoint for updating a specific section by ID 
app.put('/api/sections/:id', (req, res) => {
  updateSectionById(req, res);
});

app.patch('/api/sections/:id', (req, res) => {
  updateSectionById(req, res);
});

// PUT endpoint for admin updating a section
app.put('/api/admin/sections', (req, res) => {
  // Just reuse the same logic by calling the normal endpoint handler
  try {
    console.log('Admin PUT /api/admin/sections called, forwarding to regular handler');
    // Use the same handler as the regular endpoint
    const { section } = req.body;
    
    // Validate incoming data
    if (!section || typeof section.id !== 'number') {
      return res.status(400).json({ error: "Invalid section data" });
    }
    
    // Find section by ID
    const index = sections.findIndex(s => s.id === section.id);
    
    if (index === -1) {
      return res.status(404).json({ error: "Section not found" });
    }
    
    // Update the section
    sections[index] = {
      ...sections[index],
      ...section,
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Section ${section.id} updated successfully via admin endpoint`);
    res.json(sections[index]);
  } catch (err) {
    console.error('Error in admin update:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT/PATCH endpoint for admin updating a specific section by ID
app.put('/api/admin/sections/:id', (req, res) => {
  updateSectionById(req, res);
});

app.patch('/api/admin/sections/:id', (req, res) => {
  updateSectionById(req, res);
});

// Helper function for updating a section by ID
function updateSectionById(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const sectionId = parseInt(id, 10);
    
    if (isNaN(sectionId)) {
      return res.status(400).json({ error: "Invalid section ID" });
    }
    
    const { section } = req.body;
    let updateData = section;
    
    // If the request body doesn't have a nested section object, use the body itself
    if (!updateData) {
      updateData = req.body;
    }
    
    // Find section by ID
    const index = sections.findIndex(s => s.id === sectionId);
    
    if (index === -1) {
      return res.status(404).json({ error: `Section with ID ${sectionId} not found` });
    }
    
    // Update the section
    sections[index] = {
      ...sections[index],
      ...updateData,
      id: sectionId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Section ${sectionId} updated successfully`);
    res.json(sections[index]);
  } catch (err) {
    console.error('Error updating section by ID:', err);
    res.status(500).json({ error: "Server error" });
  }
}

// Fallback API handler
app.use('/api/*', (req, res) => {
  console.log('API route not found:', req.path);
  res.status(404).json({ error: 'API route not found' });
});

// Serve static files from client/dist
const serveStatic = (app) => {
  const distPath = path.join(process.cwd(), 'client', 'dist');
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('*', (req, res) => {
      res.send('Build directory not found. Please run build command.');
    });
  }
};

// Set up static file serving
serveStatic(app);

export default app; 