const fs = require('fs');

function processTemplate(file, isGrupal, hasAval) {
  let html = fs.readFileSync(file, 'utf8');

  // Common replacements
  html = html.replace(/07 DE AGOSTO DE 2026/gi, '{{fecha_firma}}');
  html = html.replace(/15 DE MAYO DE 2026/gi, '{{fecha_firma}}');
  html = html.replace(/001111/g, '{{folio}}');
  html = html.replace(/001065/g, '{{folio}}');
  html = html.replace(/001108/g, '{{folio}}');
  html = html.replace(/\$ 18,000\.00/g, '{{monto_otorgado}}');
  html = html.replace(/\$ 6,000\.00/g, '{{monto_otorgado}}');
  html = html.replace(/\$ 23,000\.00/g, '{{monto_otorgado}}');
  
  html = html.replace(/\$ 3,600\.00/g, '{{interes_generado}}');
  html = html.replace(/\$ 1,200\.00/g, '{{interes_generado}}');
  html = html.replace(/\$ 4,600\.00/g, '{{interes_generado}}');

  html = html.replace(/\$ 21,600\.00/g, '{{monto_total_a_pagar}}');
  html = html.replace(/\$ 7,200\.00/g, '{{monto_total_a_pagar}}');
  html = html.replace(/\$ 27,600\.00/g, '{{monto_total_a_pagar}}');

  html = html.replace(/4 Meses \(.*?16 Semanas.*?\)/g, '{{plazo}}');
  html = html.replace(/4 meses/gi, '{{plazo}}');

  html = html.replace(/\$ 1,350\.00/g, '{{cuota_periodo}}');
  html = html.replace(/\$ 450\.00/g, '{{cuota_periodo}}');

  html = html.replace(/14 \/ Agosto \/ 2026/gi, '{{fecha_primer_pago}}');
  html = html.replace(/22 \/ Mayo \/ 2026/gi, '{{fecha_primer_pago}}');
  html = html.replace(/14 de agosto del 2025/gi, '{{fecha_primer_pago}}');

  html = html.replace(/27 de noviembre del 2026/gi, '{{fecha_vencimiento}}');
  html = html.replace(/04 de septiembre de 2026/gi, '{{fecha_vencimiento}}');
  
  if (isGrupal) {
    // Grupal specific
    html = html.replace(/C\. IGNACIO MAYA # 4, Cuautla/gi, '{{domicilio_acreditado}}');
    html = html.replace(/SAN JUAN/gi, '{{cliente_nombre}}');
    // Remove the hardcoded table of members completely
    html = html.replace(/<table>.*?Gloria Sánchez Rivera.*?<\/table>/gi, '');
    html += '<br/><h3 style="text-align: center; margin-top: 30px;">INTEGRANTES DEL GRUPO</h3><br/>{{tabla_integrantes}}';
  } else {
    // Individual specific
    html = html.replace(/C\. Ignacio Maya # 4, municipio de Cuautla Morelos\./gi, '{{domicilio_acreditado}}');
    html = html.replace(/LEONILA ROJAS LIMA/gi, '{{cliente_nombre}}');
    html = html.replace(/MATEO DE JESÚS LIMA/gi, '{{cliente_nombre}}');
    html = html.replace(/MATEO DE JESUS LIMA/gi, '{{cliente_nombre}}');
    
    if (hasAval) {
      // The aval doc has "MARÍA DEL CARMEN LIMA RAMÍREZ" or "MARISOL LARA DE LA ROSA"
      html = html.replace(/MARÍA DEL CARMEN LIMA RAMÍREZ/gi, '{{nombre_aval}}');
      html = html.replace(/MARISOL LARA DE LA ROSA/gi, '{{nombre_aval}}');
      html = html.replace(/Calle Ignacio Maya número 4 Cuautla Morelos/gi, '{{domicilio_aval}}');
    }
  }

  // Remove huge empty spans or weird anchors mammoth adds
  html = html.replace(/<a id=".*?"><\/a>/g, '');
  
  return html;
}

const htmlInd = processTemplate('contrato_leonila.html', false, false);
const htmlAval = processTemplate('contrato_mateo.html', false, true);
const htmlGrupal = processTemplate('contrato_sanjuan.html', true, false);

const sql = `
-- Drop constraint to allow INDIVIDUAL_AVAL
ALTER TABLE plantillas_contratos DROP CONSTRAINT IF EXISTS plantillas_contratos_tipo_check;
ALTER TABLE plantillas_contratos ADD CONSTRAINT plantillas_contratos_tipo_check CHECK (tipo IN ('INDIVIDUAL', 'INDIVIDUAL_AVAL', 'GRUPAL'));

DELETE FROM plantillas_contratos;
INSERT INTO plantillas_contratos (tipo, contenido) VALUES 
('INDIVIDUAL', '${htmlInd.replace(/'/g, "''")}'),
('INDIVIDUAL_AVAL', '${htmlAval.replace(/'/g, "''")}'),
('GRUPAL', '${htmlGrupal.replace(/'/g, "''")}');
`;

fs.writeFileSync('insert_templates.sql', sql);
console.log("SQL generated.");
