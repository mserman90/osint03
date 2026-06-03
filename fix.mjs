import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      // Replace literal backslash followed by backtick with just backtick
      const fixed = original.split('\\`').join('`');
      if (original !== fixed) {
        fs.writeFileSync(fullPath, fixed);
        console.log('Fixed', fullPath);
      }
    }
  }
}

walk('./src');
