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

// File path for storing sections
const SECTIONS_FILE_PATH = path.join(process.cwd(), 'data', 'sections.json');

// Function to load sections from file
const loadSectionsFromFile = (): any[] => {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(path.dirname(SECTIONS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SECTIONS_FILE_PATH), { recursive: true });
    }
    
    // Read from file if it exists
    if (fs.existsSync(SECTIONS_FILE_PATH)) {
      const data = fs.readFileSync(SECTIONS_FILE_PATH, 'utf8');
      console.log(`Loaded ${JSON.parse(data).length} sections from file`);
      return JSON.parse(data);
    }
    
    // If file doesn't exist, use default data and save it
    fs.writeFileSync(SECTIONS_FILE_PATH, JSON.stringify(defaultSections, null, 2));
    console.log(`Initialized file with ${defaultSections.length} default sections`);
    return [...defaultSections];
  } catch (error) {
    console.error('Error loading sections from file:', error);
    return [...defaultSections];
  }
};

// Function to save sections to file
const saveSectionsToFile = (sectionsData: any[]): void => {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(path.dirname(SECTIONS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SECTIONS_FILE_PATH), { recursive: true });
    }
    
    // Save to file
    fs.writeFileSync(SECTIONS_FILE_PATH, JSON.stringify(sectionsData, null, 2));
    console.log(`Saved ${sectionsData.length} sections to file`);
  } catch (error) {
    console.error('Error saving sections to file:', error);
  }
};

// Load sections from file at startup
let sections = loadSectionsFromFile();

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

// Add new PUT endpoint to update a section by ID
app.put('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const index = sections.findIndex(s => s.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: "Section not found" });
  }
  
  // Update section
  sections[index] = { 
    ...sections[index], 
    ...updateData,
    updatedAt: new Date().toISOString() 
  };
  
  // Save changes to file
  saveSectionsToFile(sections);
  
  res.json(sections[index]);
});

// Add new PATCH endpoint as an alternative
app.patch('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const index = sections.findIndex(s => s.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: "Section not found" });
  }
  
  // Update section (PATCH only updates provided fields)
  sections[index] = { 
    ...sections[index], 
    ...updateData,
    updatedAt: new Date().toISOString() 
  };
  
  // Save changes to file
  saveSectionsToFile(sections);
  
  res.json(sections[index]);
});

// Add new POST endpoint to create a section
app.post('/api/sections', (req, res) => {
  const newSection = req.body;
  
  // Ensure the new section has an ID
  const maxId = Math.max(...sections.map(s => s.id), 0);
  newSection.id = maxId + 1;
  newSection.updatedAt = new Date().toISOString();
  
  // Add the new section
  sections.push(newSection);
  
  // Save changes to file
  saveSectionsToFile(sections);
  
  res.status(201).json(newSection);
});

// Add DELETE endpoint
app.delete('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const index = sections.findIndex(s => s.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: "Section not found" });
  }
  
  // Remove the section
  const removed = sections.splice(index, 1)[0];
  
  // Save changes to file
  saveSectionsToFile(sections);
  
  res.json({ message: "Section deleted", section: removed });
});

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