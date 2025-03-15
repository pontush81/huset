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

// Direct handler for Vercel serverless functions
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log request
  console.log(`${req.method} ${req.url}`);
  
  // Get the path without the leading /api
  const path = req.url.replace(/^\/api/, '');
  
  // Handle sections routes
  if (path === '/sections' || path === '/sections/') {
    return res.json(sections);
  }
  
  // Handle specific section by slug
  if (path.startsWith('/sections/')) {
    const slug = path.split('/')[2];
    const section = sections.find(s => s.slug === slug);
    
    if (section) {
      return res.json(section);
    } else {
      return res.status(404).json({ error: 'Section not found' });
    }
  }
  
  // Health check
  if (path === '/health' || path === '/health/') {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  
  // Default 404 response
  return res.status(404).json({ error: 'Not Found', path });
}; 