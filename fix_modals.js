const fs = require('fs');

const files = [
  'frontend/src/components/PaymentForm.jsx',
  'frontend/src/views/DirectorioClientes.jsx',
  'frontend/src/views/CortesCaja.jsx',
  'frontend/src/views/GestionGrupos.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find modal-content
  const modalContentRegex = /(<div className="modal-content[^>]*>)\s*(<div[^>]*>[\s\S]*?<\/div>)\s*([\s\S]*?)(\s*<\/div>\s*<\/div>\s*(?:;|\)|\s)*)$/m;
  // This regex is tricky for nested divs.
  // Let's do it with basic string manipulation instead of regex for the wrapper.
}
