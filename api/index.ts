import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Dynamically import server routes
const registerRoutes = async (app) => {
  try {
    // Try importing the routes
    const { registerRoutes } = await import('../server/routes');
    await registerRoutes(app);
  } catch (error) {
    console.error('Error loading routes:', error);
    // Fallback for API routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  }
};

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

// Initialize the app
(async () => {
  await registerRoutes(app);
  serveStatic(app);
})();

export default app; 