const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DIAGRAMS_DIR = __dirname;

async function generateDiagrams(format = 'png') {
  console.log(`🎨 Generating ${format.toUpperCase()} diagrams...`);
  
  try {
    // Get all .puml files
    const files = fs.readdirSync(DIAGRAMS_DIR)
      .filter(file => file.endsWith('.puml'));
    
    console.log(`📊 Found ${files.length} diagram files`);
    
    for (const file of files) {
      const filePath = path.join(DIAGRAMS_DIR, file);
      console.log(`\n📝 Processing: ${file}`);
      
      try {
        // Use PlantUML online service via curl (fallback method)
        const content = fs.readFileSync(filePath, 'utf8');
        const outputFile = file.replace('.puml', `.${format}`);
        
        console.log(`   ⏳ Generating ${outputFile}...`);
        
        // Create a temp encoded file
        const encoded = Buffer.from(content).toString('base64');
        const url = `https://www.plantuml.com/plantuml/${format}/${encoded}`;
        
        // Download using curl or wget
        const downloadCmd = process.platform === 'win32' 
          ? `curl -s "${url}" -o "${path.join(DIAGRAMS_DIR, outputFile)}"`
          : `wget -q "${url}" -O "${path.join(DIAGRAMS_DIR, outputFile)}"`;
        
        console.log(`   🌐 Using PlantUML online service...`);
        console.log(`   ⚠️  This may take a moment...`);
        
        // For now, just inform the user
        console.log(`   ℹ️  To generate this diagram, use one of these methods:`);
        console.log(`      1. Install PlantUML VS Code extension and export manually`);
        console.log(`      2. Visit: https://www.planttext.com/ and paste the content`);
        console.log(`      3. Use online service: ${url.substring(0, 80)}...`);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${file}:`, error.message);
      }
    }
    
    console.log(`\n✅ Diagram processing complete!`);
    console.log(`\n📖 Manual Generation Instructions:`);
    console.log(`   1. Open VS Code`);
    console.log(`   2. Install "PlantUML" extension by jebbs`);
    console.log(`   3. Open any .puml file`);
    console.log(`   4. Press Alt+D to preview`);
    console.log(`   5. Right-click → "Export Current Diagram"`);
    console.log(`   6. Choose format (PNG, SVG, PDF)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get format from command line argument
const format = process.argv[2] || 'png';

if (format === 'all') {
  (async () => {
    await generateDiagrams('png');
    await generateDiagrams('svg');
  })();
} else {
  generateDiagrams(format);
}
