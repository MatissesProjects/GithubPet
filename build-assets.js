const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Copy style.css
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(distDir, 'style.css'));

// Patch and copy manifest.json
let manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
manifest.content_scripts[0].js = ["content.js"];
manifest.content_scripts[0].css = ["style.css"];
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// Patch and copy popup.html
let popup = fs.readFileSync(path.join(__dirname, 'popup.html'), 'utf8');
popup = popup.replace('dist/popup.js', 'popup.js');
fs.writeFileSync(path.join(distDir, 'popup.html'), popup);

console.log('Dist folder fully populated and patched!');
