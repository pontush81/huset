const fs = require('fs');
const path = require('path');

try {
  // Skapa data-katalogen om den inte finns
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    console.log(`Creating directory: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dataDir}`);
  }

  // Försök skriva en testfil
  const testFile = path.join(dataDir, 'test-file.json');
  const testData = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Detta är ett testmeddelande'
  };
  
  console.log(`Writing test file to: ${testFile}`);
  fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), 'utf8');
  console.log('File written successfully!');
  
  // Läs och verifiera filen
  const readData = fs.readFileSync(testFile, 'utf8');
  console.log('Read back data:', readData);
  
} catch (error) {
  console.error('ERROR:', error);
} 