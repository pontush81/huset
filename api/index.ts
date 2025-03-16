import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

// Create Express app
const app = express();

// Add CORS headers for all requests
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// If cors package isn't installed, use these custom headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
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

// Lägg till mer detaljerad loggning för filoperationer
const SECTIONS_FILE_PATH = path.join(process.cwd(), 'data', 'sections.json');
console.log('Sections file path:', SECTIONS_FILE_PATH);

// Förbättrad version av loadSectionsFromFile
const loadSectionsFromFile = (): any[] => {
  try {
    console.log('Loading sections from file...');
    console.log('Current directory:', process.cwd());
    
    // Skapa data-mappen om den inte finns
    const dataDir = path.dirname(SECTIONS_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    } else {
      console.log(`Directory exists: ${dataDir}`);
    }
    
    // Läs från filen om den finns
    if (fs.existsSync(SECTIONS_FILE_PATH)) {
      console.log(`Reading from existing file: ${SECTIONS_FILE_PATH}`);
      const data = fs.readFileSync(SECTIONS_FILE_PATH, 'utf8');
      try {
        const parsedData = JSON.parse(data);
        console.log(`Successfully loaded ${parsedData.length} sections from file`);
        return parsedData;
      } catch (parseError) {
        console.error('Error parsing JSON from file:', parseError);
        return [...defaultSections];
      }
    } else {
      console.log(`File doesn't exist, using default sections: ${SECTIONS_FILE_PATH}`);
      fs.writeFileSync(SECTIONS_FILE_PATH, JSON.stringify(defaultSections, null, 2), 'utf8');
      console.log(`Created new file with ${defaultSections.length} default sections`);
      return [...defaultSections];
    }
  } catch (error) {
    console.error('Critical error loading sections from file:', error);
    return [...defaultSections];
  }
};

// Förbättrad version av saveSectionsToFile
const saveSectionsToFile = (sectionsData: any[]): void => {
  try {
    console.log(`Attempting to save ${sectionsData.length} sections to file...`);
    
    // Skapa data-mappen om den inte finns
    const dataDir = path.dirname(SECTIONS_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Spara till filen
    const jsonData = JSON.stringify(sectionsData, null, 2);
    console.log(`Writing ${jsonData.length} bytes to: ${SECTIONS_FILE_PATH}`);
    fs.writeFileSync(SECTIONS_FILE_PATH, jsonData, 'utf8');
    console.log(`Successfully saved ${sectionsData.length} sections to file`);
  } catch (error) {
    console.error('Critical error saving sections to file:', error);
    console.error(error.stack);
  }
};

// Load sections from file at startup
let sections = loadSectionsFromFile();

// Add API routes for both regular and admin paths
// API Routes - regular endpoints
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

// PUT endpoint to update a section by ID
app.put('/api/sections/:id', (req, res) => {
  console.log('PUT /api/sections/:id called with ID:', req.params.id);
  console.log('Request body:', JSON.stringify(req.body));
  
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
  
  console.log('About to save sections after update...');
  saveSectionsToFile(sections);
  console.log('Sections saved successfully');
  
  res.json(sections[index]);
});

// PATCH endpoint
app.patch('/api/sections/:id', (req, res) => {
  console.log('PATCH /api/sections/:id called with ID:', req.params.id);
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
  
  console.log('Trying to save section with ID:', id);
  saveSectionsToFile(sections);
  console.log('Finished saving sections');
  
  res.json(sections[index]);
});

// POST endpoint to create a section
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

// DELETE endpoint
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

// API Routes - admin endpoints (duplicated to match client requests)
app.get('/api/admin/sections', (req, res) => {
  res.json(sections);
});

app.put('/api/admin/sections', (req, res) => {
  const updateData = req.body;
  if (!updateData || !updateData.id) {
    return res.status(400).json({ error: "Invalid data, missing id" });
  }
  
  const index = sections.findIndex(s => s.id === updateData.id);
  if (index === -1) {
    return res.status(404).json({ error: "Section not found" });
  }
  
  sections[index] = { 
    ...sections[index], 
    ...updateData,
    updatedAt: new Date().toISOString() 
  };
  
  saveSectionsToFile(sections);
  res.json(sections[index]);
});

app.put('/api/admin/sections/:id', (req, res) => {
  console.log('PUT /api/admin/sections/:id called with ID:', req.params.id);
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

app.patch('/api/admin/sections/:id', (req, res) => {
  console.log('PATCH /api/admin/sections/:id called with ID:', req.params.id);
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

// ADD THIS NEW ENDPOINT: General PUT endpoint for /api/sections (the one client calls)
app.put('/api/sections', (req, res) => {
  console.log('PUT /api/sections (general) called with body:', JSON.stringify(req.body).substring(0, 100) + '...');
  
  const { section } = req.body;
  
  if (!section || typeof section.id !== 'number') {
    console.error('Invalid data received in PUT /api/sections:', req.body);
    return res.status(400).json({ error: "Invalid section data, missing id" });
  }
  
  const index = sections.findIndex(s => s.id === section.id);
  
  if (index === -1) {
    console.error(`Section with ID ${section.id} not found!`);
    return res.status(404).json({ error: "Section not found" });
  }
  
  // Update the section
  console.log(`Updating section ID ${section.id} with new data`);
  sections[index] = {
    ...sections[index],
    ...section,
    updatedAt: new Date().toISOString()
  };
  
  // SAVE TO FILE - Important part!
  console.log('Saving updated sections to file...');
  saveSectionsToFile(sections);
  console.log('Sections saved to file successfully');
  
  console.log(`Returning updated section ${section.id}`);
  res.json(sections[index]);
});

// Fallback API handler
app.use('/api/*', (req, res) => {
  console.log('API route not found:', req.path, 'method:', req.method);
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