#!/bin/bash

# Create a simple static build for Vercel deployment
echo "Creating simple static build for Vercel deployment..."

# Create output directory
mkdir -p client/dist

# Copy simple HTML file
echo "Copying fallback HTML..."
cat > client/dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BRF Ellagården</title>
  <link rel="stylesheet" href="index.css">
  <script src="https://kit.fontawesome.com/1234567890.js" crossorigin="anonymous"></script>
</head>
<body>
  <div class="container">
    <header>
      <h1>BRF Ellagården</h1>
      <p>Välkommen till BRF Ellagårdens informationssida</p>
    </header>
    
    <main>
      <div id="root">
        <!-- React app would mount here -->
        <div class="message">
          <h2>Webbplatsen är under uppdatering</h2>
          <p>Vi jobbar för närvarande med att uppdatera webbplatsen. Vänligen kom tillbaka lite senare.</p>
          <p>För frågor, kontakta styrelsen via <a href="mailto:styrelse@ellagarden.se">styrelse@ellagarden.se</a>.</p>
        </div>
      </div>
      
      <div id="loading" class="loading" style="display: none;">
        Laddar applikationen...
        <div><small>Om sidan inte laddas inom några sekunder, försök att <a href="javascript:location.reload()">ladda om sidan</a>.</small></div>
      </div>
      
      <div id="error-log" class="error-log"></div>
    </main>
    
    <footer>
      <p>© 2024 BRF Ellagården. Alla rättigheter förbehållna.</p>
    </footer>
  </div>

  <script>
    // Simple error handler
    window.addEventListener('error', function(event) {
      console.error('Error:', event.error || event.message);
      document.getElementById('loading').style.display = 'block';
      const errorLog = document.getElementById('error-log');
      errorLog.textContent += event.message + '\n';
      errorLog.style.display = 'block';
    });
  </script>
</body>
</html>
EOL

# Create simple CSS
echo "Creating simple CSS..."
cat > client/dist/index.css << 'EOL'
:root {
  --primary-color: hsl(210, 90%, 30%);
  --background: #f8f9fa;
  --foreground: #333333;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: var(--foreground);
  background: var(--background);
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

header {
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

h2 {
  margin: 20px 0 15px;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.message {
  background: #f0f4ff;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.loading {
  padding: 20px;
  text-align: center;
  margin-top: 20px;
  background: #f3f4f6;
  border-radius: 4px;
}

.error-log {
  padding: 15px;
  margin-top: 20px;
  background: #fee2e2;
  border-radius: 4px;
  color: #b91c1c;
  font-family: monospace;
  white-space: pre-wrap;
  display: none;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

@media (max-width: 640px) {
  .container {
    padding: 15px;
  }
}
EOL

# Copy any other needed files from public directory
echo "Copying files from public directory..."
cp -r client/public/*.html client/dist/ 2>/dev/null || true

echo "Done! Files are in client/dist directory"
echo "Upload this directory to Vercel manually if needed" 