const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'assets', 'icon.svg');
  const iconsetPath = path.join(__dirname, '..', 'assets', 'icon.iconset');
  const assetsPath = path.join(__dirname, '..', 'assets');
  
  // Ensure iconset directory exists
  if (!fs.existsSync(iconsetPath)) {
    fs.mkdirSync(iconsetPath, { recursive: true });
  }
  
  // Icon sizes for macOS iconset
  const sizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' }
  ];
  
  console.log('Generating icons from SVG...');
  
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    
    for (const { size, name } of sizes) {
      const outputPath = path.join(iconsetPath, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Created ${name} (${size}x${size})`);
    }
    
    console.log('✓ All macOS icons generated successfully!');
    
    // Generate Windows icon (256px PNG)
    const windowsIconPath = path.join(assetsPath, 'icon.png');
    await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toFile(windowsIconPath);
    console.log('✓ Created icon.png for Windows/Linux (256x256)');
    
    // Generate high-res version for Linux
    const linuxIconPath = path.join(assetsPath, 'icon-512.png');
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(linuxIconPath);
    console.log('✓ Created icon-512.png for Linux (512x512)');
    
    console.log('✓ All icons generated successfully!');
    console.log(`Icons created in: ${iconsetPath} and ${assetsPath}`);
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();