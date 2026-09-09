const mammoth = require('mammoth');
const fs = require('fs');

async function extract() {
  const result1 = await mammoth.convertToHtml({path: "../CONTRATO Leonila Rojas Lima.docx"});
  fs.writeFileSync('contrato_leonila.html', result1.value);

  const result2 = await mammoth.convertToHtml({path: "../CONTRATO Mateo De Jesús Lima.docx"});
  fs.writeFileSync('contrato_mateo.html', result2.value);

  const result3 = await mammoth.convertToHtml({path: "../CONTRATO San Juan.docx"});
  fs.writeFileSync('contrato_sanjuan.html', result3.value);
  console.log("Done extracting to HTML");
}

extract();
