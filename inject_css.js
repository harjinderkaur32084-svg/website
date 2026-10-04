const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('premium.css')) {
    content = content.replace('</head>', '<link rel="stylesheet" href="premium.css"></head>');
    fs.writeFileSync(file, content);
    console.log('Added premium.css to ' + file);
  }
});
