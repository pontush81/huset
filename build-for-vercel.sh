#!/bin/bash

echo "Creating static build for Vercel deployment..."

# Create output directory and ensure it's clean
rm -rf client/dist
mkdir -p client/dist

# Create the index.html file with better structure
echo "Creating index.html..."
cat > client/dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BRF Ellagården</title>
  <link rel="stylesheet" href="/index.css">
  <script src="https://kit.fontawesome.com/4f3d4d0dc6.js" crossorigin="anonymous"></script>
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <div class="container">
    <header>
      <h1>BRF Ellagården</h1>
      <p>Välkommen till BRF Ellagårdens informationssida</p>
    </header>
    
    <main>
      <div id="root">
        <div class="message">
          <h2>Välkommen till BRF Ellagården</h2>
          <p>Webbplatsen är för närvarande under uppdatering.</p>
          <p>Här kommer snart information om föreningen, dokument och nyheter.</p>
          <p>För frågor, kontakta styrelsen via <a href="mailto:styrelse@ellagarden.se">styrelse@ellagarden.se</a>.</p>
        </div>
      </div>
    </main>
    
    <footer>
      <p>© 2024 BRF Ellagården. Alla rättigheter förbehållna.</p>
    </footer>
  </div>
</body>
</html>
EOL

# Create 404.html
echo "Creating 404.html..."
cat > client/dist/404.html << 'EOL'
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sidan hittades inte - BRF Ellagården</title>
  <link rel="stylesheet" href="/index.css">
  <meta http-equiv="refresh" content="5;url=/">
</head>
<body>
  <div class="container">
    <header>
      <h1>BRF Ellagården</h1>
    </header>
    
    <main>
      <div class="error-container">
        <h2>404 - Sidan kunde inte hittas</h2>
        <p>Tyvärr kunde vi inte hitta sidan du letar efter. Det kan bero på att:</p>
        <ul>
          <li>URL-adressen är felaktig</li>
          <li>Sidan har flyttats eller tagits bort</li>
          <li>Det är ett temporärt fel med hemsidan</li>
        </ul>
        <p>Du kommer att omdirigeras till <a href="/">hemsidan</a> om 5 sekunder.</p>
      </div>
    </main>
    
    <footer>
      <p>© 2024 BRF Ellagården. Alla rättigheter förbehållna.</p>
    </footer>
  </div>
</body>
</html>
EOL

# Create the CSS file
echo "Creating CSS..."
cat > client/dist/index.css << 'EOL'
:root {
  --primary-color: hsl(210, 90%, 30%);
  --primary-light: hsl(210, 90%, 95%);
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
  color: var(--primary-color);
}

ul {
  margin: 15px 0;
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
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

.error-container {
  background: #fff8f8;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid #dc2626;
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

# Create an empty favicon
echo "Creating favicon..."
touch client/dist/favicon.ico

# Create a _redirects file for Vercel
echo "Creating _redirects file..."
cat > client/dist/_redirects << 'EOL'
/*    /index.html   200
EOL

# Create a .vercel/output/config.json file with the correct routing
echo "Creating Vercel config..."
mkdir -p client/dist/.vercel/output/
cat > client/dist/.vercel/output/config.json << 'EOL'
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/(.*)", "dest": "/api" },
    { "src": "/(.*)", "dest": "/index.html", "status": 200 }
  ]
}
EOL

echo "Static build completed successfully!"
echo "Files are in client/dist directory ready for Vercel deployment" 