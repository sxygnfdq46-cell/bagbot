const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'fix-imports.js']
});

console.log(`Found ${files.length} files to process`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Calculate depth (how many directories deep from frontend root)
  const depth = file.split('/').length - 1;
  const prefix = '../'.repeat(depth);
  
  // Replace @/ imports with correct relative paths
  const newContent = content.replace(/from ['"]@\//g, (match) => {
    modified = true;
    return `from '${prefix}`;
  });
  
  // Also replace import('@/...')
  const finalContent = newContent.replace(/import\(['"]@\//g, (match) => {
    modified = true;
    return `import('${prefix}`;
  });
  
  if (modified) {
    fs.writeFileSync(file, finalContent, 'utf8');
    console.log(`Fixed: ${file} (depth: ${depth}, prefix: ${prefix})`);
  }
});

console.log('Done!');
