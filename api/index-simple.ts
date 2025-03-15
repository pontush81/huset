import express from 'express';
import path from 'path';
import fs from 'fs';

// Create Express app without any complex dependencies
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define sections directly to avoid Zod/Drizzle dependencies
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

// Memory storage for sections
let sections = [...defaultSections];
let documents = [];

// Simple API routes
app.get('/api/sections', (req, res) => {
  console.log('GET /api/sections called');
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

app.get('/api/documents', (req, res) => {
  const { category } = req.query;
  if (category && typeof category === 'string') {
    res.json(documents.filter(d => d.category === category));
  } else {
    res.json(documents);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Serve static files from client/dist
const serveStatic = (app) => {
  // Determine the correct path to the client dist directory
  const distPath = path.join(process.cwd(), 'client', 'dist');
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // SPA fallback for client routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    console.error('Error: Could not find client dist folder at', distPath);
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.send('Build directory not found. Please run build command.');
      }
    });
  }
};

// Set up static file serving
serveStatic(app);

// Export the Express app
export default app; 