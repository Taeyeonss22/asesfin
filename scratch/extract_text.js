const mammoth = require('mammoth');
const fs = require('fs');

async function extract() {
  const result = await mammoth.extractRawText({path: "CONTRATO Leonila Rojas Lima.docx"});
  fs.writeFileSync('contrato_leonila.txt', result.value);
  console.log("Done extracting Leonila");
}

extract();
