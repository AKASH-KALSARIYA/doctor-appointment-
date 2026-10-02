// Icon generator script for RuralCare PWA
// Run with: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Icon sizes for PWA
const iconSizes = [
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' }
];

// Screenshot sizes
const screenshotSizes = [
    { width: 1280, height: 720, name: 'screenshot-1.png' },
    { width: 1280, height: 720, name: 'screenshot-2.png' }
];

// Shortcut icons
const shortcutIcons = [
    { size: 96, name: 'shortcut-icon-96x96.png' }
];

// Badge for notifications
const badge = { size: 72, name: 'badge-72.png' };

// Create directories if they don't exist
const directories = ['icons', 'screenshots', 'shortcuts'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

console.log('🎨 RuralCare Icon Generator');
console.log('===========================');

// Create SVG template for icons
function createSVG(size, text = 'RC') {
    const fontSize = size * 0.4;
    return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3498db;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#27ae60;stop-opacity:1" />
            </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" rx="${size * 0.2}" fill="url(#gradient)" />
        
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="white" fill-opacity="0.2" />
        
        <text 
            x="50%" 
            y="50%" 
            text-anchor="middle" 
            dy="0.35em" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            fill="white"
        >
            ${text}
        </text>
        
        <!-- Medical cross symbol -->
        <g transform="translate(${size/2}, ${size/2}) scale(${size/100})">
            <rect x="-4" y="-20" width="8" height="40" fill="white" rx="2"/>
            <rect x="-20" y="-4" width="40" height="8" fill="white" rx="2"/>
        </g>
    </svg>
    `;
}

// Create screenshot placeholder
function createScreenshotSVG(width, height, title) {
    return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa" />
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="60" fill="#3498db" />
        <text x="20" y="35" font-family="Arial" font-size="18" fill="white">RuralCare</text>
        
        <!-- Content -->
        <rect x="50" y="100" width="${width-100}" height="40" rx="8" fill="#e9ecef" />
        <rect x="50" y="160" width="${width-100}" height="200" rx="8" fill="white" stroke="#dee2e6" stroke-width="2" />
        
        <!-- Cards -->
        <rect x="50" y="380" width="250" height="150" rx="8" fill="white" stroke="#dee2e6" stroke-width="2" />
        <rect x="320" y="380" width="250" height="150" rx="8" fill="white" stroke="#dee2e6" stroke-width="2" />
        <rect x="590" y="380" width="250" height="150" rx="8" fill="white" stroke="#dee2e6" stroke-width="2" />
        
        <!-- Text -->
        <text x="50" y="90" font-family="Arial" font-size="14" fill="#6c757d">${title}</text>
        <text x="${width/2}" y="300" text-anchor="middle" font-family="Arial" font-size="24" fill="#2c3e50">Doctor Appointment System</text>
        
        <!-- Footer -->
        <rect x="0" y="${height-40}" width="100%" height="40" fill="#2c3e50" />
        <text x="20" y="${height-15}" font-family="Arial" font-size="12" fill="white">ruralcare.example.com</text>
    </svg>
    `;
}

// Generate icons
console.log('\n📱 Generating PWA Icons:');
iconSizes.forEach(icon => {
    const svgContent = createSVG(icon.size);
    const filePath = path.join('icons', icon.name);
    fs.writeFileSync(filePath, svgContent);
    console.log(`   ✓ Created ${icon.name}`);
});

// Generate shortcut icons
console.log('\n🔗 Generating Shortcut Icons:');
shortcutIcons.forEach(icon => {
    const svgContent = createSVG(icon.size, '🏥');
    const filePath = path.join('shortcuts', icon.name);
    fs.writeFileSync(filePath, svgContent);
    console.log(`   ✓ Created ${icon.name}`);
});

// Generate badge
console.log('\n🛡️ Generating Notification Badge:');
const badgeSVG = createSVG(badge.size, '!');
const badgePath = path.join('icons', badge.name);
fs.writeFileSync(badgePath, badgeSVG);
console.log(`   ✓ Created ${badge.name}`);

// Generate screenshot placeholders
console.log('\n📸 Generating Screenshot Placeholders:');
screenshotSizes.forEach((screenshot, index) => {
    const title = index === 0 ? 'Main Dashboard' : 'Booking Page';
    const svgContent = createScreenshotSVG(screenshot.width, screenshot.height, title);
    const filePath = path.join('screenshots', screenshot.name);
    fs.writeFileSync(filePath, svgContent);
    console.log(`   ✓ Created ${screenshot.name} (${title})`);
});

// Generate favicon
console.log('\n🌟 Generating Favicon:');
const faviconSVG = createSVG(32);
const faviconICO = `
    <!-- Convert this SVG to ICO format using online tools -->
    <!-- Recommended: https://favicon.io/favicon-converter/ -->
    ${faviconSVG}
`;
fs.writeFileSync('favicon.svg', faviconSVG);
fs.writeFileSync('favicon-conversion-instructions.txt', `
Convert favicon.svg to favicon.ico using:
1. Visit https://favicon.io/favicon-converter/
2. Upload favicon.svg
3. Download favicon.ico and apple-touch-icon.png
4. Place them in the project root directory
`);
console.log('   ✓ Created favicon.svg');
console.log('   ⚠️  Note: Convert favicon.svg to .ico format using online converter');

// Create README for icons
const iconReadme = `
# RuralCare Icons and Assets

This directory contains all icons and assets for the RuralCare PWA.

## Files Generated

### Icons Directory (/icons)
- icon-72x72.png - Android home screen icon
- icon-96x96.png - General purpose icon
- icon-128x128.png - Chrome extension icon
- icon-144x144.png - Windows tile icon
- icon-152x152.png - Apple touch icon (iPad)
- icon-192x192.png - Android/Chrome home screen icon
- icon-384x384.png - Large Android icon
- icon-512x512.png - Splash screen icon
- badge-72.png - Notification badge

### Shortcuts Directory (/shortcuts)
- shortcut-icon-96x96.png - PWA shortcut icons

### Screenshots Directory (/screenshots)
- screenshot-1.png - Main dashboard screenshot
- screenshot-2.png - Booking page screenshot

## Usage

1. Place all .png files in the root directory of your project
2. Update manifest.json with correct icon paths
3. For production, optimize images using tools like:
   - ImageOptim (macOS)
   - TinyPNG (online)
   - Squoosh (online)

## Regenerating Icons

To regenerate icons with different colors or text:
1. Modify the generate-icons.js script
2. Run: node generate-icons.js
3. Convert favicon.svg to .ico format using favicon.io

## Color Scheme

Primary Gradient: #3498db → #27ae60
Text Color: White
Background: Transparent
`;

fs.writeFileSync('ICONS-README.md', iconReadme);
console.log('\n📄 Created ICONS-README.md');

console.log('\n✅ Icon generation complete!');
console.log('\nNext steps:');
console.log('1. Convert favicon.svg to .ico format');
console.log('2. Place all .png files in project root');
console.log('3. Update manifest.json icon paths');
console.log('4. Test PWA installation on different devices');

// Note: This script requires Node.js to run
// For actual PNG generation, you would need libraries like sharp or canvas
// This script creates SVG files which can be converted to PNG using online tools