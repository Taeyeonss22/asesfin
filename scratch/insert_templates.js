require('dotenv').config({ path: 'frontend/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const htmlIndividual = `
<div style="font-family: Arial, sans-serif; font-size: 14px; text-align: justify; line-height: 1.5; padding: 20px;">
  <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
    CONTRATO DE HONORARIOS<br/>
    POR PRESTACIÓN DE SERVICIOS PROFESIONALES
  </div>

  <table style="width: 100%; margin-bottom: 20px;">
    <tr><td style="font-weight: bold; width: 40%;">FECHA:</td><td>{{fecha_firma}}</td></tr>
    <tr><td style="font-weight: bold;">FOLIO:</td><td>{{folio}}</td></tr>
    <tr><td style="font-weight: bold;">MONTO DE LOS HONORARIOS:</td><td>{{monto_otorgado}}</td></tr>
    <tr><td style="font-weight: bold;">INTERES GENERADO:</td><td>{{interes_generado}}</td></tr>
    <tr><td style="font-weight: bold;">MONTO TOTAL A PAGAR:</td><td>{{monto_total_a_pagar}}</td></tr>
    <tr><td style="font-weight: bold;">PLAZO DE LOS HONORARIOS A CRÉDITO:</td><td>{{plazo}}</td></tr>
    <tr><td style="font-weight: bold;">PARCIALIDADES:</td><td>{{cuota_periodo}} M.N. Las parcialidades incluyen todos los montos a pagar, intereses e I.V.A.</td></tr>
    <tr><td style="font-weight: bold;">FECHAS DE PAGO:</td><td>La fecha para realizar el primer pago es {{fecha_primer_pago}} y posteriormente según la tabla de amortización.</td></tr>
    <tr><td style="font-weight: bold;">TASA DE INTERÉS ORDINARIO:</td><td>5.0 % (Mensual)</td></tr>
    <tr><td style="font-weight: bold;">COMISION POR INTENTO FALLIDO DE COBRO:</td><td>$ 50 M.N. + IVA.</td></tr>
    <tr><td style="font-weight: bold;">DOMICILIO DEL ACREDITADO:</td><td>{{domicilio_acreditado}}</td></tr>
  </table>

  <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
    _____________________________<br/>
    <span style="font-weight: bold; text-transform: uppercase;">{{nombre_acreditado}}</span><br/>
    ACREDITADO
  </div>

  <div style="font-weight: bold; text-align: justify;">
    CONTRATO DE APERTURA DE SERVICIOS PROFESIONALES A CRÉDITO No. {{folio}} CON GARANTÍA LIQUIDA Y PRENDARIA QUE CELEBRAN, POR UNA PARTE, “ASES” (ASESORÍA ADMINISTRATIVA PARA NEGOCIOS DEL ORIENTE), COMO “EL ACREDITANTE”, Y POR OTRA PARTE, EL (LA) SR. (A). <span style="text-transform: uppercase;">{{nombre_acreditado}}</span>, COMO “EL ACREDITADO” AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLAUSULAS:
  </div>

  <h3 style="text-align: center; margin-top: 20px;">DECLARACIONES</h3>
  <ol type="I">
    <li>Declara Tomas Rubí García ser él quien representa a “ASES” con domicilio en C. Tamaulipas # 10, Atlautla, Edo. de Méx.</li>
    <li>Declara “ASES” que cuenta con la capacidad Técnica, conocimientos, infraestructura necesaria y solvencia económica para facilitar el acceso a la asesoría administrativa y apoyo económico de bajo monto a los productores.</li>
    <li>Declara “EL ACREDITADO”, ser mexicano(a), mayor de edad, con domicilio en {{domicilio_acreditado}}, y manifiesta estar interesado en recibir las asesorías y apoyo económico.</li>
    <li>Ambas partes reconocen y acuerdan cumplir con todas las obligaciones fiscales.</li>
  </ol>

  <h3 style="text-align: center; margin-top: 20px;">CLÁUSULAS</h3>
  <p><strong>PRIMERA.- HONORARIOS PROFESIONALES.</strong> Prestación de servicios profesionales y apoyo económico a favor de “EL ACREDITADO”...</p>
  <p><strong>SEGUNDA.- DISPOSICIÓN.</strong> “EL ACREDITADO” dispondrá de la asesoría administrativa y apoyo en una ministración a la firma del presente...</p>
  <p><strong>TERCERA.- VENCIMIENTO.</strong> El contrato tendrá duración de {{plazo}} y se dará por terminado el {{fecha_vencimiento}}.</p>
  <p><strong>CUARTA.- IMPORTE.</strong> “EL ACREDITADO” se obliga a pagar a “ASES” el importe correspondiente...</p>
  <p><strong>QUINTA.- PAGOS.</strong> Los pagos que realice se aplicarán en el siguiente orden: contribuciones, apoyo económico, comisiones, moratorios, honorarios.</p>
  
  <div style="margin-top: 60px; text-align: center; display: flex; justify-content: space-around;">
    <div>
      _____________________________<br/>
      <strong>ACREDITANTE</strong><br/>
      TOMAS RUBÍ GARCÍA<br/>
      "ASES"
    </div>
    <div>
      _____________________________<br/>
      <strong style="text-transform: uppercase;">{{nombre_acreditado}}</strong><br/>
      ACREDITADO
    </div>
  </div>
</div>
`;

const htmlIndividualAval = `
<div style="font-family: Arial, sans-serif; font-size: 14px; text-align: justify; line-height: 1.5; padding: 20px;">
  <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
    CONTRATO DE HONORARIOS<br/>
    POR PRESTACIÓN DE SERVICIOS PROFESIONALES
  </div>

  <table style="width: 100%; margin-bottom: 20px;">
    <tr><td style="font-weight: bold; width: 40%;">FECHA:</td><td>{{fecha_firma}}</td></tr>
    <tr><td style="font-weight: bold;">FOLIO:</td><td>{{folio}}</td></tr>
    <tr><td style="font-weight: bold;">MONTO DE LOS HONORARIOS:</td><td>{{monto_otorgado}}</td></tr>
    <tr><td style="font-weight: bold;">INTERES GENERADO:</td><td>{{interes_generado}}</td></tr>
    <tr><td style="font-weight: bold;">MONTO TOTAL A PAGAR:</td><td>{{monto_total_a_pagar}}</td></tr>
    <tr><td style="font-weight: bold;">PLAZO DE LOS HONORARIOS A CRÉDITO:</td><td>{{plazo}}</td></tr>
    <tr><td style="font-weight: bold;">PARCIALIDADES:</td><td>{{cuota_periodo}} M.N. Las parcialidades incluyen todos los montos a pagar, intereses e I.V.A.</td></tr>
    <tr><td style="font-weight: bold;">FECHAS DE PAGO:</td><td>La fecha para realizar el primer pago es {{fecha_primer_pago}} y posteriormente según la tabla de amortización.</td></tr>
    <tr><td style="font-weight: bold;">TASA DE INTERÉS ORDINARIO:</td><td>5.0 % (Mensual)</td></tr>
    <tr><td style="font-weight: bold;">COMISION POR INTENTO FALLIDO DE COBRO:</td><td>$ 50 M.N. + IVA.</td></tr>
    <tr><td style="font-weight: bold;">DOMICILIO DEL ACREDITADO:</td><td>{{domicilio_acreditado}}</td></tr>
    <tr><td style="font-weight: bold;">DOMICILIO DEL AVAL:</td><td>{{domicilio_aval}}</td></tr>
  </table>

  <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 40px; margin-bottom: 40px;">
    <div>
      _____________________________<br/>
      <span style="font-weight: bold; text-transform: uppercase;">{{nombre_acreditado}}</span><br/>
      ACREDITADO
    </div>
    <div>
      _____________________________<br/>
      <span style="font-weight: bold; text-transform: uppercase;">{{nombre_aval}}</span><br/>
      DEUDOR SOLIDARIO
    </div>
  </div>

  <div style="font-weight: bold; text-align: justify;">
    CONTRATO DE APERTURA DE SERVICIOS PROFESIONALES A CRÉDITO No. {{folio}} CON GARANTÍA LIQUIDA Y PRENDARIA QUE CELEBRAN, POR UNA PARTE, “ASES” (ASESORÍA ADMINISTRATIVA PARA NEGOCIOS DEL ORIENTE), COMO “EL ACREDITANTE”, POR OTRA PARTE, <span style="text-transform: uppercase;">{{nombre_acreditado}}</span>, COMO “EL ACREDITADO”, Y POR UNA TERCERA PARTE <span style="text-transform: uppercase;">{{nombre_aval}}</span> COMO “DEUDOR SOLIDARIO” AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLAUSULAS:
  </div>

  <h3 style="text-align: center; margin-top: 20px;">DECLARACIONES</h3>
  <ol type="I">
    <li>Declara Tomas Rubí García ser él quien representa a “ASES”.</li>
    <li>Declara “ASES” que cuenta con la capacidad Técnica, conocimientos, infraestructura necesaria y solvencia económica.</li>
    <li>Declara “EL ACREDITADO”, ser mexicano(a), mayor de edad, con domicilio en {{domicilio_acreditado}}.</li>
    <li>Declara “EL DEUDOR SOLIDARIO” que es su voluntad constituirse como obligado solidario, comprometiéndose a cumplir con todas las obligaciones que asuma “EL ACREDITADO”.</li>
  </ol>

  <h3 style="text-align: center; margin-top: 20px;">CLÁUSULAS</h3>
  <p><strong>PRIMERA.- HONORARIOS PROFESIONALES.</strong> Prestación de servicios profesionales y apoyo económico...</p>
  <p><strong>SEGUNDA.- DISPOSICIÓN.</strong> “EL ACREDITADO” dispondrá de la asesoría administrativa y apoyo en una ministración...</p>
  <p><strong>TERCERA.- VENCIMIENTO.</strong> El contrato tendrá duración de {{plazo}} y se dará por terminado el {{fecha_vencimiento}}.</p>
  <p><strong>CUARTA.- IMPORTE.</strong> “EL ACREDITADO” y “DEUDOR SOLIDARIO” se obligan a pagar a “ASES” el importe correspondiente...</p>
  
  <div style="margin-top: 60px; text-align: center; display: flex; justify-content: space-between;">
    <div style="flex: 1;">
      _____________________________<br/>
      <strong>ACREDITANTE</strong><br/>
      TOMAS RUBÍ GARCÍA
    </div>
    <div style="flex: 1;">
      _____________________________<br/>
      <strong style="text-transform: uppercase;">{{nombre_acreditado}}</strong><br/>
      ACREDITADO
    </div>
    <div style="flex: 1;">
      _____________________________<br/>
      <strong style="text-transform: uppercase;">{{nombre_aval}}</strong><br/>
      DEUDOR SOLIDARIO
    </div>
  </div>
</div>
`;

const htmlGrupal = `
<div style="font-family: Arial, sans-serif; font-size: 14px; text-align: justify; line-height: 1.5; padding: 20px;">
  <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
    CONTRATO DE HONORARIOS GRUPAL<br/>
    POR PRESTACIÓN DE SERVICIOS PROFESIONALES
  </div>

  <table style="width: 100%; margin-bottom: 20px;">
    <tr><td style="font-weight: bold; width: 40%;">FECHA:</td><td>{{fecha_firma}}</td></tr>
    <tr><td style="font-weight: bold;">GRUPO:</td><td>{{nombre_grupo}}</td></tr>
    <tr><td style="font-weight: bold;">FOLIO:</td><td>{{folio}}</td></tr>
    <tr><td style="font-weight: bold;">MONTO GRUPAL:</td><td>{{monto_otorgado}}</td></tr>
    <tr><td style="font-weight: bold;">INTERES GRUPAL:</td><td>{{interes_generado}}</td></tr>
    <tr><td style="font-weight: bold;">TOTAL A PAGAR:</td><td>{{monto_total_a_pagar}}</td></tr>
    <tr><td style="font-weight: bold;">PLAZO A CRÉDITO:</td><td>{{plazo}}</td></tr>
    <tr><td style="font-weight: bold;">PARCIALIDAD GRUPAL:</td><td>{{cuota_periodo}} M.N.</td></tr>
    <tr><td style="font-weight: bold;">GARANTÍA LIQUIDA (10%):</td><td>{{garantia_liquida}}</td></tr>
    <tr><td style="font-weight: bold;">FECHAS DE PAGO:</td><td>Primer pago el {{fecha_primer_pago}}.</td></tr>
  </table>

  <div style="font-weight: bold; text-align: justify; margin-bottom: 20px;">
    CONTRATO DE APERTURA DE SERVICIOS PROFESIONALES A CRÉDITO GRUPAL No. {{folio}} QUE CELEBRAN “ASES” Y LOS INTEGRANTES DEL GRUPO SOLIDARIO "{{nombre_grupo}}".
  </div>

  {{tabla_integrantes}}

  <h3 style="text-align: center; margin-top: 20px;">DECLARACIONES Y CLÁUSULAS</h3>
  <ol type="I">
    <li>Ambas partes declaran la voluntad de conformar el grupo solidario.</li>
    <li>Los integrantes del grupo declaran ser responsables solidarios por la totalidad de la deuda grupal, no pudiendo eximirse del pago por abandono o incumplimiento de otros miembros.</li>
    <li>La garantía liquida equivalente al 10% del crédito permanecerá en resguardo hasta la liquidación total.</li>
  </ol>
  
  <p><strong>PRIMERA.-</strong> Los honorarios profesionales y apoyo económico se otorgan de forma solidaria...</p>
  <p><strong>SEGUNDA.-</strong> El contrato vencerá el {{fecha_vencimiento}}.</p>

  <div style="margin-top: 60px; text-align: center;">
    _____________________________<br/>
    <strong>ACREDITANTE</strong><br/>
    TOMAS RUBÍ GARCÍA<br/>
    "ASES"
  </div>
</div>
`;

async function run() {
  const { data, error } = await supabase.from('plantillas_contratos').upsert([
    {
      tipo: 'INDIVIDUAL',
      nombre: 'Contrato Individual (Sin Aval)',
      contenido_html: htmlIndividual,
      variables_permitidas: ['folio', 'fecha_firma', 'monto_otorgado', 'interes_generado', 'monto_total_a_pagar', 'plazo', 'cuota_periodo', 'fecha_primer_pago', 'domicilio_acreditado', 'nombre_acreditado', 'fecha_vencimiento']
    },
    {
      tipo: 'INDIVIDUAL_AVAL',
      nombre: 'Contrato Individual (Con Aval)',
      contenido_html: htmlIndividualAval,
      variables_permitidas: ['folio', 'fecha_firma', 'monto_otorgado', 'interes_generado', 'monto_total_a_pagar', 'plazo', 'cuota_periodo', 'fecha_primer_pago', 'domicilio_acreditado', 'nombre_acreditado', 'fecha_vencimiento', 'nombre_aval', 'domicilio_aval']
    },
    {
      tipo: 'GRUPAL',
      nombre: 'Contrato Grupal (Grupo Solidario)',
      contenido_html: htmlGrupal,
      variables_permitidas: ['folio', 'fecha_firma', 'monto_otorgado', 'interes_generado', 'monto_total_a_pagar', 'plazo', 'cuota_periodo', 'fecha_primer_pago', 'nombre_grupo', 'fecha_vencimiento', 'garantia_liquida', 'tabla_integrantes']
    }
  ], { onConflict: 'tipo' });

  if (error) console.error(error);
  else console.log('Plantillas actualizadas correctamente.');
}
run();
