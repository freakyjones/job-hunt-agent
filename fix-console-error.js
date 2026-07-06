const fs = require('node:fs');
const path = require('node:path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (
        file !== 'node_modules' &&
        file !== '.turbo' &&
        file !== 'dist' &&
        !file.startsWith('.')
      ) {
        processDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      const regex = /console\.error\(([^)]*?)\b(\w+)\.message\b([^)]*?)\)/g;

      content = content.replace(regex, (match, p1, p2, p3) => {
        if (match.includes('instanceof Error')) return match;
        if (p2 === 'response' || p2 === 'request') return match; // skip non errors
        changed = true;
        return `console.error(${p1}${p2} instanceof Error ? ${p2}.message : String(${p2})${p3})`;
      });

      const optRegex = /console\.error\(([^)]*?)\b(\w+)\?\.message([^)]*?)\)/g;
      content = content.replace(optRegex, (match, p1, p2, p3) => {
        if (match.includes('instanceof Error')) return match;
        changed = true;
        return `console.error(${p1}${p2} instanceof Error ? ${p2}.message : String(${p2})${p3})`;
      });

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'apps', 'agent'));
processDir(path.join(__dirname, 'apps', 'dashboard'));
processDir(path.join(__dirname, 'apps', 'networking-worker'));
