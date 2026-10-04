const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const replacement = '<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script><script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script><script src="firebase-config.js"></script><script src="data.js"></script>';

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('<script src="data.js"></script>', replacement);
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
