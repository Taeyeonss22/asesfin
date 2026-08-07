export const htmlIndividual = `
<div style="font-family: serif; font-size: 11pt; line-height: 1.5; text-align: justify; color: #000; background: #fff;">
  <p style="text-align: center; font-weight: bold; font-size: 14pt;">CONTRATO DE HONORARIOS <br>POR PRESTACIÓN DE SERVICIOS PROFESIONALES</p>
  <p><b>FECHA:</b> {{fecha_firma}}</p>
  <p><b>FOLIO:</b> {{folio}}</p>
  <p><b>MONTO DE LOS HONORARIOS:</b> {{monto_otorgado}}</p>
  <p><b>INTERES GENERADO:</b> {{interes_generado}}</p>
  <p><b>MONTO TOTAL A PAGAR:</b> {{monto_total_a_pagar}}</p>
  <p><b>PLAZO DE LOS HONORARIOS A CRÉDITO:</b> {{plazo}}</p>
  <p><b>PARCIALIDADES:</b> {{cuota_periodo}} Las parcialidades incluyen todos los montos a pagar, intereses e I.V.A.</p>
  <p><b>FECHAS DE PAGO:</b> La fecha para realizar el primer pago es {{fecha_primer_pago}} y posteriormente según la tabla de amortización que se adjunta al contrato como ANEXO 1º.</p>
  <p><b>TASA DE INTERÉS ORDINARIO (tasa de interés mensual):</b> {{tasa_interes}}%</p>
  <p><b>COMISION POR INTENTO FALLIDO DE COBRO:</b> $ 50 M.N. + IVA, esta comisión pertenecerá a quien "{{empresa_nombre}}" asigne para realizar las gestiones de cobro.</p>
  <p><b>DOMICILIO DEL ACREDITADO:</b> {{domicilio_acreditado}}</p>
  
  <br><br>
  <div style="text-align: center;">
    <p>_____________________________</p>
    <p><b>{{cliente_nombre}}</b><br>ACREDITADO</p>
  </div>
  <br><br>

  <p>CONTRATO DE APERTURA DE SERVICIOS PROFESIONALES A CRÉDITO No. {{folio}} CON GARANTÍA LIQUIDA Y PRENDARIA QUE CELEBRAN, POR UNA PARTE, "{{empresa_nombre}}", QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS DEL PRESENTE CONTRATO SERÁ DENOMINADO COMO "EL ACREDITANTE", POR OTRA PARTE, EL (LA) SR. (A). {{cliente_nombre}}, POR SU PROPIO DERECHO, EN LO SUCESIVO Y PARA LOS MISMOS EFECTOS SE LE DENOMINARA "EL ACREDITADO" AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLAUSULAS:</p>

  <h3 style="text-align: center;">D E C L A R A C I O N E S:</h3>

  <p><b>I. -</b> Declara el Representante Legal ser él quien representa a "{{empresa_nombre}}" con domicilio de la empresa.</p>
  
  <p><b>II.-</b> Declara "{{empresa_nombre}}", que cuenta con la capacidad Técnica, conocimientos, infraestructura necesaria, solvencia económica, organización y elementos suficientes para que, por cuenta y orden suyos, facilite el acceso a la asesoría administrativa y de ser necesario un apoyo económico de bajo monto a los productores con características de sujetos de crédito incipientes con requerimientos de crédito de baja cuantía.<br>
  El trabajo a desarrollar por parte de "{{empresa_nombre}}", o a quien ella designe, será la capacitación mediante métodos y herramientas para una óptima toma de decisiones. Impulse su negocio hacia la generación de valor y contribuya al crecimiento sostenido no solo de su negocio sino de todos aquellos que se interesan en sus productos y servicios.</p>

  <p><b>III.-</b> Declara "EL ACREDITADO", ser mexicano(a), mayor de edad, con domicilio en {{domicilio_acreditado}}, y manifiesta estar interesado en recibir las asesorías administrativas y servicios profesionales o apoyo económico para el impulso y fortalecimiento de sus actividades productivas, las cuales son lícitas y rentables.<br>
  Que "EL ACREDITADO" está plenamente consciente de los derechos y obligaciones que por este medio contrae, estando de acuerdo en recibir los servicios profesionales y de así ser necesario el apoyo económico que le otorga "{{empresa_nombre}}", bajo los términos y condiciones que se establecen en el presente instrumento.<br>
  Que previo a la celebración del presente contrato, han convenido en todos y en cada uno de los términos en cuanto a los honorarios, plazo, intereses ordinarios y moratorios, descuentos, cesión, causas de vencimiento anticipado, rescate de crédito, tribunales competentes, etc.<br>
  Estar de acuerdo en los servicios profesionales que "{{empresa_nombre}}" le otorgará a "EL ACREDITADO", en los términos que más adelante se precisan.</p>

  <p><b>IV.-</b> Todos los impuestos, contribuciones y derechos que deban cubrirse con motivo de la celebración y ejecución del Contrato, serán cubiertos por la parte que resulte obligada a ello, de conformidad con las disposiciones aplicables. Ambas partes reconocen y acuerdan que cumplirán con todas las obligaciones fiscales que le resulten aplicables por virtud del presente Contrato y que los recursos económicos utilizados provienen y provendrán de fuentes lícitas y serán utilizados para actividades lícitas en todo momento. Ambas partes reconocen y acuerdan que "{{empresa_nombre}}" no tiene obligación fiscal alguna relacionada con el presente Contrato, salvo por aquellas relacionadas con las comisiones que sean cobradas directamente y en beneficio de "{{empresa_nombre}}", quedando por lo tanto ambas partes obligadas a indemnizar y sacar en paz y a salvo a "{{empresa_nombre}}" de cualquier daño, perjuicio, demanda y/o acción que su incumplimiento fiscal le provoque a "{{empresa_nombre}}".</p>

  <p>En virtud de lo anterior, las partes de común acuerdo celebran el presente contrato de crédito por lo cual convienen en otorgar las siguientes:</p>

  <h3 style="text-align: center;">C L Á U S U L A S</h3>

  <p><b>PRIMERA.- HONORARIOS PROFESIONALES.</b> Prestación de servicios profesionales y apoyo económico a favor de "EL ACREDITADO" conforme se describe en la primera hoja de este contrato, los servicios profesionales prestados serán para la capacitación y desarrollo de actividades administrativas para el crecimiento de su negocio, en los honorarios se incluye el apoyo económico que deberá ser invertido para el desarrollo y fomento de sus actividades productivas.</p>

  <p><b>SEGUNDA.- DISPOSICIÓN.</b> "EL ACREDITADO" dispondrá de la asesoría administrativa y el apoyo económico otorgado en una ministración a la firma del presente contrato y mediante la suscripción de 1 (un) pagaré a la orden de "{{empresa_nombre}}", quien podrá endosarlo, descontarlo, cederlo y en cualquier forma negociarlos aún antes de su vencimiento. El vencimiento de dicho pagaré será a la vista y se ejercerá en un plazo posterior de 60 días del vencimiento del contrato.</p>

  <p><b>TERCERA.- VENCIMIENTO.</b> El presente contrato tendrá una duración de {{plazo}} y se dará por terminado el día {{fecha_vencimiento}}.</p>

  <p><b>CUARTA.- IMPORTE.</b> "EL ACREDITADO" se obliga a pagar a "{{empresa_nombre}}", respecto del importe correspondiente a los honorarios profesionales, sin necesidad de requerimiento o cobros previos, los importes correspondientes a intereses ordinarios, intereses moratorios y los gastos accesorios que por incumplimiento del contrato resulten.</p>

  <p><b>QUINTA.- PAGOS.</b> "EL ACREDITADO" se obliga a pagar la cantidad de honorarios profesionales, así como sus accesorios, mediante moratorios, estableciéndose que la falta de pago de una o más amortizaciones, sea causa de RETENCIÓN DE LA GARANTÍA. Las partes convienen en que el importe de los pagos que realice "EL ACREDITADO", se aplicará en el siguiente orden: contribuciones, apoyo económico, comisiones, intereses moratorios y por último honorarios profesionales.<br>
  Del lugar de pago. - Todos los pagos que deba efectuar "EL ACREDITADO" a "EL ACREDITANTE" con motivo de este contrato en las fechas que para tal efecto se establezcan en EL ANEXO 1 que documentan "CONTRATO DE SERVICIOS PROFESIONALES", deberán realizarse sin necesidad de requerimiento o cobro previo, en días y horas hábiles en la Cuenta o en el domicilio de "EL ACREDITANTE" o en el domicilio de quien fuere, en su caso, cesionario o causahabiente de sus derechos, para cuyo caso se le notificará a "EL ACREDITADO".</p>

  <p><b>SEXTA.- PAGOS ANTICIPADOS.</b> "EL ACREDITADO", podrá hacer pagos anticipados o bien podrá liquidarlo íntegramente con los intereses normales antes de su vencimiento, sin penalización alguna.</p>

  <p><b>SÉPTIMA. - GARANTÍA.</b> El monto depositado, así como "LA GARANTÍA", será devuelto una vez haya sido liquidado en tu totalidad LOS HONORARIOS PROFESIONALES. En caso de incumplimiento, "EL ACREDITANTE" podrá disponer de "LA GARANTÍA" en el entendido que será aplicada en el orden siguiente: en primer término, los gastos de cobranza administrativa, extrajudicial y judicial, comisiones, impuestos, intereses moratorios, intereses ordinarios fijos mensuales y el remanente a los HONORARIOS PROFESIONALES.</p>

  <p><b>OCTAVA.- DOMICILIOS.</b> Para todo lo relacionado con la interpretación y cumplimiento de este contrato, las partes señalan como domicilios:<br>
  "EL CREDITANTE": Domicilio de "{{empresa_nombre}}".<br>
  "EL ACREDITADO": {{domicilio_acreditado}}.</p>

  <p>Convienen las partes que mientras "EL ACREDITADO" no notifique a "{{empresa_nombre}}" por escrito el cambio de domicilio señalado en el presente contrato, los avisos, notificaciones y demás diligencias judiciales o extrajudiciales que se le hagan en el domicilio arriba indicado, surtirán todos los efectos a que haya lugar.</p>

  <p>Leído que fue el presente contrato y explicado su valor y fuerza legal a los comparecientes, cuya identidad y capacidad se comprobaron, los otorgantes firman el presente instrumento por duplicado, el día {{fecha_firma}}.</p>

  <br><br><br>
  <table style="width: 100%; text-align: center; border: none;">
    <tr>
      <td style="width: 50%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>ACREDITANTE</b><br>"{{empresa_nombre}}"</p>
      </td>
      <td style="width: 50%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>{{cliente_nombre}}</b><br>ACREDITADO</p>
      </td>
    </tr>
  </table>
</div>
`;

export const htmlIndividualAval = `
<div style="font-family: serif; font-size: 11pt; line-height: 1.5; text-align: justify; color: #000; background: #fff;">
  <p style="text-align: center; font-weight: bold; font-size: 14pt;">CONTRATO DE HONORARIOS <br>POR PRESTACIÓN DE SERVICIOS PROFESIONALES</p>
  <p><b>FECHA:</b> {{fecha_firma}}</p>
  <p><b>FOLIO:</b> {{folio}}</p>
  <p><b>MONTO DE LOS HONORARIOS:</b> {{monto_otorgado}}</p>
  <p><b>INTERES GENERADO:</b> {{interes_generado}}</p>
  <p><b>MONTO TOTAL A PAGAR:</b> {{monto_total_a_pagar}}</p>
  <p><b>PLAZO DE LOS HONORARIOS A CRÉDITO:</b> {{plazo}}</p>
  <p><b>PARCIALIDADES:</b> {{cuota_periodo}} Las parcialidades incluyen todos los montos a pagar, intereses e I.V.A.</p>
  <p><b>FECHAS DE PAGO:</b> La fecha para realizar el primer pago es {{fecha_primer_pago}} y posteriormente según la tabla de amortización que se adjunta al contrato como ANEXO 1º.</p>
  <p><b>TASA DE INTERÉS ORDINARIO (tasa de interés mensual):</b> {{tasa_interes}}%</p>
  <p><b>COMISION POR INTENTO FALLIDO DE COBRO:</b> $ 50 M.N. + IVA, esta comisión pertenecerá a quien "{{empresa_nombre}}" asigne para realizar las gestiones de cobro.</p>
  <p><b>DOMICILIO DEL ACREDITADO:</b> {{domicilio_acreditado}}</p>
  
  <br><br>
  <table style="width: 100%; text-align: center; border: none;">
    <tr>
      <td style="width: 50%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>{{cliente_nombre}}</b><br>ACREDITADO</p>
      </td>
      <td style="width: 50%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>{{nombre_aval}}</b><br>DEUDOR SOLIDARIO</p>
      </td>
    </tr>
  </table>
  <br><br>

  <p>CONTRATO DE APERTURA DE SERVICIOS PROFESIONALES A CRÉDITO No. {{folio}} CON GARANTÍA LIQUIDA Y PRENDARIA QUE CELEBRAN, POR UNA PARTE, "{{empresa_nombre}}", QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS DEL PRESENTE CONTRATO SERÁ DENOMINADO COMO "EL ACREDITANTE", POR OTRA PARTE, EL (LA) SR. (A). {{cliente_nombre}}, POR SU PROPIO DERECHO, EN LO SUCESIVO Y PARA LOS MISMOS EFECTOS SE LE DENOMINARA "EL ACREDITADO", Y POR UNA TERCERA PARTE, EL (LA) SR. (A) {{nombre_aval}}, POR SU PROPIA VOLUNTAD A QUIEN EN LO SUCESIVO SE LE DENOMINARA "DEUDOR SOLIDARIO"; AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLAUSULAS:</p>

  <h3 style="text-align: center;">D E C L A R A C I O N E S:</h3>

  <p><b>I. -</b> Declara el Representante Legal ser él quien representa a "{{empresa_nombre}}" con domicilio de la empresa.</p>
  
  <p><b>II.-</b> Declara "{{empresa_nombre}}", que cuenta con la capacidad Técnica, conocimientos, infraestructura necesaria, solvencia económica, organización y elementos suficientes para que, por cuenta y orden suyos, facilite el acceso a la asesoría administrativa y de ser necesario un apoyo económico de bajo monto a los productores con características de sujetos de crédito incipientes con requerimientos de crédito de baja cuantía.<br>
  El trabajo a desarrollar por parte de "{{empresa_nombre}}", o a quien ella designe, será la capacitación mediante métodos y herramientas para una óptima toma de decisiones. Impulse su negocio hacia la generación de valor y contribuya al crecimiento sostenido no solo de su negocio sino de todos aquellos que se interesan en sus productos y servicios.</p>

  <p><b>III.-</b> Declara "EL ACREDITADO", ser mexicano(a), mayor de edad, con domicilio en {{domicilio_acreditado}}, y manifiesta estar interesado en recibir las asesorías administrativas y servicios profesionales o apoyo económico para el impulso y fortalecimiento de sus actividades productivas, las cuales son lícitas y rentables.<br>
  Que "EL ACREDITADO" y "DEUDOR SOLIDARIO" están plenamente consciente de los derechos y obligaciones que por este medio contraen, estando de acuerdo en recibir los servicios profesionales y de así ser necesario el apoyo económico que le otorga "{{empresa_nombre}}", bajo los términos y condiciones que se establecen en el presente instrumento.<br>
  Que previo a la celebración del presente contrato, han convenido en todos y en cada uno de los términos en cuanto a los honorarios, plazo, intereses ordinarios y moratorios, descuentos, cesión, causas de vencimiento anticipado, rescate de crédito, tribunales competentes, etc.<br>
  Estar de acuerdo en los servicios profesionales que "{{empresa_nombre}}" le otorgará a "EL ACREDITADO" y "DEUDOR SOLIDARIO", en los términos que más adelante se precisan.</p>

  <p><b>IV.- Declara "EL DEUDOR SOLIDARIO"</b><br>
  Que es cierta la información proporcionada a "EL ACREDITANTE".<br>
  Que es su voluntad celebrar el presente contrato y otorgar su consentimiento expreso, para constituirse como "DEUDOR SOLIDARIO" de "EL ACREDITADO", comprometiéndose por tal motivo a cumplir con todas y cada una de las obligaciones que "EL ACREDITADO" asuma en el presente acuerdo de voluntades o que en su caso se deriven de dicha celebración.<br>
  Que es su voluntad celebrar el presente contrato y obligarse solidariamente con "EL ACREDITADO" en los términos y condiciones que en el mismo se pactan.</p>

  <p><b>V.-</b> Todos los impuestos, contribuciones y derechos que deban cubrirse con motivo de la celebración y ejecución del Contrato, serán cubiertos por la parte que resulte obligada a ello, de conformidad con las disposiciones aplicables. Ambas partes reconocen y acuerdan que cumplirán con todas las obligaciones fiscales que le resulten aplicables por virtud del presente Contrato y que los recursos económicos utilizados provienen y provendrán de fuentes lícitas y serán utilizados para actividades lícitas en todo momento. Ambas partes reconocen y acuerdan que "{{empresa_nombre}}" no tiene obligación fiscal alguna relacionada con el presente Contrato, salvo por aquellas relacionadas con las comisiones que sean cobradas directamente y en beneficio de "{{empresa_nombre}}", quedando por lo tanto ambas partes obligadas a indemnizar y sacar en paz y a salvo a "{{empresa_nombre}}" de cualquier daño, perjuicio, demanda y/o acción que su incumplimiento fiscal le provoque a "{{empresa_nombre}}".</p>

  <p>En virtud de lo anterior, las partes de común acuerdo celebran el presente contrato de crédito por lo cual convienen en otorgar las siguientes:</p>

  <h3 style="text-align: center;">C L Á U S U L A S</h3>

  <p><b>PRIMERA.- HONORARIOS PROFESIONALES.</b> Prestación de servicios profesionales y apoyo económico a favor de "EL ACREDITADO" conforme se describe en la primera hoja de este contrato, los servicios profesionales prestados serán para la capacitación y desarrollo de actividades administrativas para el crecimiento de su negocio, en los honorarios se incluye el apoyo económico que deberá ser invertido para el desarrollo y fomento de sus actividades productivas.</p>

  <p><b>SEGUNDA.- DISPOSICIÓN.</b> "EL ACREDITADO" dispondrá de la asesoría administrativa y el apoyo económico otorgado en una ministración a la firma del presente contrato y mediante la suscripción de 1 (un) pagaré a la orden de "{{empresa_nombre}}", quien podrá endosarlo, descontarlo, cederlo y en cualquier forma negociarlos aún antes de su vencimiento. El vencimiento de dicho pagaré será a la vista y se ejercerá en un plazo posterior de 60 días del vencimiento del contrato.</p>

  <p><b>TERCERA.- VENCIMIENTO.</b> El presente contrato tendrá una duración de {{plazo}} y se dará por terminado el día {{fecha_vencimiento}}.</p>

  <p><b>CUARTA.- IMPORTE.</b> "EL ACREDITADO" y "DEUDOR SOLIDARIO" se obligan a pagar a "{{empresa_nombre}}", respecto del importe correspondiente a los honorarios profesionales, sin necesidad de requerimiento o cobros previos, los importes correspondientes a intereses ordinarios, intereses moratorios y los gastos accesorios que por incumplimiento del contrato resulten.</p>

  <p><b>QUINTA.- PAGOS.</b> "EL ACREDITADO" y "DEUDOR SOLIDARIO" se obligan a pagar la cantidad de honorarios profesionales, así como sus accesorios, mediante moratorios, estableciéndose que la falta de pago de una o más amortizaciones, sea causa de RETENCIÓN DE LA GARANTÍA. Las partes convienen en que el importe de los pagos que realice "EL ACREDITADO", se aplicará en el siguiente orden: contribuciones, apoyo económico, comisiones, intereses moratorios y por último honorarios profesionales.<br>
  Del lugar de pago. - Todos los pagos que deban efectuar "EL ACREDITADO" y "DEUDOR SOLIDARIO" a "EL ACREDITANTE" con motivo de este contrato en las fechas que para tal efecto se establezcan en EL ANEXO 1 que documentan "CONTRATO DE SERVICIOS PROFESIONALES", deberán realizarse sin necesidad de requerimiento o cobro previo, en días y horas hábiles en la Cuenta o en el domicilio de "EL ACREDITANTE" o en el domicilio de quien fuere, en su caso, cesionario o causahabiente de sus derechos, para cuyo caso se le notificará a "EL ACREDITADO" y "DEUDOR SOLIDARIO".</p>

  <p><b>SEXTA.- PAGOS ANTICIPADOS.</b> "EL ACREDITADO", podrá hacer pagos anticipados o bien podrá liquidarlo íntegramente con los intereses normales antes de su vencimiento, sin penalización alguna.</p>

  <p><b>SÉPTIMA. - GARANTÍA.</b> El monto depositado, así como "LA GARANTÍA", será devuelto una vez haya sido liquidado en tu totalidad los HONORARIOS PROFESIONALES. En caso de incumplimiento, "EL ACREDITANTE" podrá disponer de "LA GARANTÍA" en el entendido que será aplicada en el orden siguiente: en primer término, los gastos de cobranza administrativa, extrajudicial y judicial, comisiones, impuestos, intereses moratorios, intereses ordinarios fijos mensuales y el remanente a los HONORARIOS PROFESIONALES.</p>

  <p><b>OCTAVA.- DOMICILIOS.</b> Para todo lo relacionado con la interpretación y cumplimiento de este contrato, las partes señalan como domicilios:<br>
  "EL CREDITANTE": Domicilio de "{{empresa_nombre}}".<br>
  "EL ACREDITADO": {{domicilio_acreditado}}.<br>
  "DEUDOR SOLIDARIO": {{domicilio_aval}}.</p>

  <p>Convienen las partes que mientras "EL ACREDITADO" y "DEUDOR SOLIDARIO" no notifiquen a "{{empresa_nombre}}" por escrito el cambio de domicilio señalado en el presente contrato, los avisos, notificaciones y demás diligencias judiciales o extrajudiciales que se le hagan en el domicilio arriba indicado, surtirán todos los efectos a que haya lugar.</p>

  <p>Leído que fue el presente contrato y explicado su valor y fuerza legal a los comparecientes, cuya identidad y capacidad se comprobaron, los otorgantes firman el presente instrumento por duplicado, el día {{fecha_firma}}.</p>

  <br><br><br>
  <table style="width: 100%; text-align: center; border: none;">
    <tr>
      <td style="width: 33%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>ACREDITANTE</b><br>"{{empresa_nombre}}"</p>
      </td>
      <td style="width: 33%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>{{cliente_nombre}}</b><br>ACREDITADO</p>
      </td>
      <td style="width: 33%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>{{nombre_aval}}</b><br>DEUDOR SOLIDARIO</p>
      </td>
    </tr>
  </table>
</div>
`;

export const htmlGrupal = `
<div style="font-family: serif; font-size: 11pt; line-height: 1.5; text-align: justify; color: #000; background: #fff;">
  <p>CONTRATO DE APERTURA DE CREDITO SIMPLE No. {{folio}} CON GARANTIA LÍQUIDA, QUE CELEBRAN POR UNA PARTE "{{empresa_nombre}}", A QUIEN EN LO SUCESIVO Y PARA LOS EFECTOS DEL PRESENTE SERA DENOMINADO COMO "EL ACREDITANTE" Y POR LA OTRA PARTE, EL GRUPO SOLIDARIO "{{cliente_nombre}}", EN SU CARÁCTER DE GRUPO SOLIDARIO A QUIENES EN LO SUCESIVO Y A QUIEN PARA LOS MISMOS EFECTOS SE LE DENOMINARA "EL ACREDITADO", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLAUSULAS:</p>

  <h3 style="text-align: center;">D E C L A R A C I O N E S</h3>

  <p><b>I.-</b> Declara "{{empresa_nombre}}" por conducto de su Representante Legal, bajo protesta de decir verdad, que cuenta con la capacidad para otorgar el presente crédito.</p>

  <p><b>II.-</b> Declara "EL ACREDITADO", por su propio derecho y bajo protesta de decir verdad:<br>
  Que es un grupo solidario, por lo que comparecen y se obligan de forma individual y solidaria entre sus integrantes cuyos nombres, domicilio, CURP y firmas aparecen en la lista anexa al presente instrumento.<br>
  Que está interesado en recibir un crédito para el impulso y fortalecimiento de las diferentes actividades productivas de sus integrantes, las cuales son lícitas y rentables.<br>
  Que los integrantes son mayores de edad, con referencias y buenos antecedentes comunitarios y cuentan a la fecha con las facultades necesarias para la celebración del presente instrumento.<br>
  Que de acuerdo a la Solicitud y a la Información presentada por "EL ACREDITADO", le otorga el crédito simple que se contiene en este instrumento.<br>
  Que los integrantes están plenamente conscientes de los derechos y obligaciones que por este medio contraen, estando de acuerdo en recibir el crédito que le otorga "{{empresa_nombre}}" bajo los términos y condiciones que se establecen en el presente instrumento.<br>
  Que previamente a la celebración del presente contrato, han convenido en todos y en cada uno de los términos en cuanto al monto, plazo, intereses ordinarios y moratorios, descuentos, cesión, causas de vencimiento anticipado, rescate de crédito, tribunales competentes, etc.</p>

  <p><b>III.- Declaran las partes:</b><br>
  a) Estar de acuerdo en el Financiamiento que "{{empresa_nombre}}" le otorgará a "EL ACREDITADO", en los términos que más adelante se precisan;<br>
  b) Que, en el presente contrato, el conjunto de personas físicas que los suscriben se compromete en forma solidaria e ilimitada, entendiendo por lo anterior el asumir los adeudos en forma completa y no individualizada y en caso de falta de pago de cualesquiera de los signatarios, el resto lo cobrará en forma solidaria, en los términos precisado en éste;</p>

  <p>Una vez expuesto lo anterior, las partes otorgan las siguientes:</p>

  <h3 style="text-align: center;">C L Á U S U L A S</h3>

  <p><b>PRIMERA. - APERTURA DE CREDITO SIMPLE.</b> "{{empresa_nombre}}" abre un crédito simple a favor de "EL ACREDITADO" hasta por la cantidad de {{monto_otorgado}}, en cuyo monto no quedan incluidos los intereses, gastos e impuestos que deba cubrir "EL ACREDITADO", acordando las partes que para la implementación del presente instrumento se realizará el crédito con recursos de "{{empresa_nombre}}".<br>
  El monto del crédito será utilizado por "EL ACREDITADO" como capital de trabajo para el financiamiento de las actividades productivas, las cuales deberán ser rentables y legales. Estas, igualmente serán de manera enunciativa, mas no limitativa, consistiendo en la venta de prendas de vestir, artículos de belleza, del hogar, joyería, venta de calzado, elaboración y venta de artesanías, venta de comida, dulces, alimentos transformados, maquila, carpintería, herrería, entre otras.</p>

  <p><b>SEGUNDA. -</b> "EL ACREDITADO", se obliga a apertura una cuenta mancomunada con "{{empresa_nombre}}" para la administración de los recursos; tanto para su ministración como para su recuperación, incluyendo el propio ahorro generado por "EL ACREDITADO" durante el transcurso del crédito. Dicho ahorro se establecerá de manera semanal y en el mismo día que se realice el pago subsecuentemente.<br>
  La disposición y entrega del crédito, quedará documentada mediante la suscripción de pagaré grupal y pagarés individuales, con sus respectivos avales de los integrantes que conforman "EL ACREDITADO".</p>

  <p><b>TERCERA. -</b> "EL ACREDITADO" otorgará a "{{empresa_nombre}}" de manera anticipada y como condición al crédito solicitado, el equivalente al 10% del monto total solicitado ({{garantia_liquida}}), el cual quedará como garantía líquida de la operación y en amparo de la misma. Dicha garantía líquida podrá ser recuperada por "EL ACREDITADO" hasta la liquidación total del crédito ejercido.</p>

  <p><b>CUARTA. -</b> "EL ACREDITADO" faculta expresamente a "{{empresa_nombre}}" para ceder, descontar, negociar, enajenar por cualquier título legal ante cualquier persona física o moral tanto de derecho público como privado, independientemente de su denominación, los derechos derivados del presente instrumento.</p>

  <p><b>QUINTA. -</b> "EL ACREDITADO" se obliga a pagar a "{{empresa_nombre}}" un interés total de {{interes_generado}}, dando como monto total del crédito la suma de capital e interés la cantidad de {{monto_total_a_pagar}}. El plazo del crédito es de {{plazo}} y será pagado de manera {{periodicidad}} en {{numero_periodos}} amortizaciones, terminando de pagar en o antes del día {{fecha_vencimiento}}.</p>

  <p><b>SEXTA. -</b> "EL ACREDITADO" Los pagos deberán hacerse por parte de todos los integrantes del grupo solidario y se deberán presentar en forma completa; comprometiéndose todos los integrantes a pagar, de manera proporcional, el pago de aquel socio o integrante que no lo haya hecho, consolidándose así la obligación solidaria contraída en este instrumento. Todos los pagos que deban efectuar "EL ACREDITADO" a "EL ACREDITANTE" con motivo de este contrato en las fechas que para tal efecto se establezcan en los pagarés que documentan "EL CRÉDITO", deberán realizarse sin necesidad de requerimiento o cobro previo, en días y horas hábiles en la Cuenta o en el domicilio de "EL ACREDITANTE" o en el domicilio de quien fuere, en su caso, cesionario o causahabiente representante del grupo solidario.</p>

  <p><b>SÉPTIMA. -</b> Los pagos hechos a "{{empresa_nombre}}" serán aplicados en el siguiente orden: comisiones, impuestos, intereses y por último el capital.</p>

  <p><b>OCTAVA. -</b> El presente contrato tendrá un plazo de {{plazo}} y comenzará a surtir efectos a partir del día {{fecha_firma}} y vencerá el día {{fecha_vencimiento}}, no obstante, continuará surtiendo efectos mientras existan saldos insolutos a cargo de "EL ACREDITADO". Durante la vigencia del presente instrumento, no se modificarán ni variarán las tasas de interés del crédito. Sin perjuicio de la obligación que tiene "EL ACREDITADO", de pagar el crédito concedido, cubriendo precisamente a su vencimiento los pagarés que se suscriban para documentar los abonos convenidos.</p>

  <p><b>NOVENA. -</b> "EL ACREDITADO" se obliga a que todas las cantidades dispuestas con motivo del presente crédito y que deba de pagar a "{{empresa_nombre}}", tanto de capital como de intereses, los cubrirá en los días señalados, en horas hábiles y sin necesidad de requerimiento o cobro previo en el domicilio que más adelante se indica.</p>

  <p><b>DÉCIMA. -</b> Los intereses ordinarios sobre saldos insolutos al capital financiado, pagaderos serán del {{tasa_interes}}%. Al momento de incurrir en moratoria del cumplimiento de sus obligaciones, "EL ACREDITADO" se obliga a pagar a favor de "{{empresa_nombre}}" o de quien sus derechos representen, intereses moratorios equivalentes a los intereses ordinarios por DOS PUNTO CERO VECES a partir de la fecha de vencimiento y hasta su liquidación total.</p>

  <p><b>DÉCIMA PRIMERA. -</b> En el supuesto de que la obligación de pago coincida en un día inhábil, tanto para pago de intereses como de capital, y dicha obligación no corresponda a un pago final del crédito "EL ACREDITADO" deberá efectuar dicho pago el día hábil inmediato anterior, incluyendo los intereses moratorios que en su caso se generen, hasta la fecha de pago originalmente pactada en el presente instrumento, de lo contrario se considerara como pago vencido.</p>
  <p>En el supuesto de que la obligación de pago coincida en un día inhábil, tanto para pago de intereses como de capital, y dicha obligación corresponda a un pago final del crédito "EL ACREDITADO" deberá efectuar dicho pago el día hábil inmediato anterior, incluyendo los intereses moratorios que en su caso se generen por los días inhábiles transcurridos.</p>
  <p>"EL ACREDITADO" se obliga a que todas las cantidades que deba de pagar a "{{empresa_nombre}}" tanto de capital como de intereses, los cubrirá en los días señalados, en horas hábiles bancarias y sin necesidad de requerimiento o cobro previo en el domicilio de que más adelante se indica.</p>

  <p><b>DÉCIMA SEGUNDA. -</b> Los Integrantes de "EL ACREDITADO" no deberán entregar por ningún motivo dinero en efectivo, en especie o en valor al personal de manera individual a "{{empresa_nombre}}", fuera de la hora y día de reunión por ningún motivo y bajo ninguna circunstancia, será responsable "{{empresa_nombre}}" de la devolución o pago de dinero a "EL ACREDITADO" cuando este último haya entregado a cualquiera de los empleados de "{{empresa_nombre}}" dinero en efectivo, en especie o en valor.</p>

  <p><b>DÉCIMA TERCERA. -</b> En caso de fallecimiento de alguno de los socios del grupo solidario, previa exhibición del acta de defunción, así como de la credencial y de la libreta de abonos donde se indique que el socio iba al corriente se sus pagos, será cancelada la deuda por parte de "{{empresa_nombre}}", quien liberará al grupo del adeudo individual del integrante fallecido, continuándose los pagos por parte de "EL ACREDITADO" en forma normal.</p>

  <p><b>DÉCIMA CUARTA. -</b> En garantía del cumplimiento de todas y cada una de las obligaciones derivadas de éste contrato, todos los integrantes que conforman "EL ACREDITADO" se constituyen en OBLIGADOS SOLIDARIOS recíprocos respecto de todas las obligaciones directas o indirectas de éste instrumento, así como por lo dispuesto por los artículos aplicables del Código Civil del Estado y sus demás correlativos en todos los Estados de la República Mexicana, los cuales se tienen aquí suscritos como si a la letra se insertasen.</p>

  <p><b>DÉCIMA QUINTA. -</b> "EL ACREDITADO" o grupo solidario durante la vigencia del presente contrato, se obliga a:<br>
  - Mantener y conservar su actividad productiva y todos sus elementos integrantes.<br>
  - Permitir que "{{empresa_nombre}}" y/o cualquier Institución o persona que esta designe, realice visitas a sus domicilios o lugares donde desarrollen su actividad económica, a efectos de verificar el desarrollo de su actividad y negocio.<br>
  - Pagar a "{{empresa_nombre}}" cualquier comisión o gasto adicional que pudiera generarse.<br>
  - Contribuir, preservar y hacer cumplir los ordenamientos ecológicos que se les pudiera aplicar, así como colaborar con las autoridades ambientales en la preservación y conservación del medio ambiente de su localidad.<br>
  - Todas las demás que sean aplicables y que determine "{{empresa_nombre}}", previo aviso que se les dé por escrito o por conducto de alguno de sus representatives.</p>

  <p><b>DÉCIMA SEXTA. -</b> En caso de que un integrante o socio no sepa leer o escribir, deberá firmar con su huella digital el presente contrato, con lo que todo el grupo solidario estará de acuerdo en considerar su huella como si se hiciera "a ruego y encargo", estando conscientes de que estos integrantes están enterados de sus responsabilidades y obligaciones.</p>

  <p><b>DÉCIMA SÉPTIMA. -</b> "{{empresa_nombre}}" podrá, sin necesidad de previo aviso, dar por vencido anticipado el plazo para el reembolso de las cantidades adeudadas por "EL ACREDITADO", así como el del pago de sus accesorios y exigir su entrega inmediata, si uno o más de sus integrantes que conforman al mismo, faltaren al cumplimiento de cualesquiera de las obligaciones contenidas en este contrato, o en cualquiera de los siguientes casos:<br>
  - Si no cumplen con sus obligaciones de pago o intencionalmente provocan que su actividad o negocio, herramientas o maquinaria fueren embargados en todo o en parte, por Autoridad Judicial o de cualquier otro género.<br>
  - Si uno o más de los integrantes que conforman el grupo solidario dejan de pagar cualquiera de las amortizaciones estipuladas o cualquier exhibición.<br>
  - Si resulta ser falsa cualquier información o dato proporcionado por uno o más de los integrantes que conforman el grupo solidario en la solicitud de crédito o en cualquier información que deba proporcionar a "{{empresa_nombre}}".</p>

  <p><b>DÉCIMA OCTAVA. -</b> En caso de incumplimiento de las obligaciones a cargo de" EL ACREDITADO", las partes convienen en que:<br>
  - En caso de embargo, "{{empresa_nombre}}" no se sujetará al orden establecido en los artículos correspondientes del Código de Comercio, Código de Procedimientos Civiles y sus correlativos en todos los Estados de la República Mexicana.<br>
  - El emplazamiento y notificaciones relativas al presente instrumento, se harán en los domicilios señalados por "EL ACREDITADO" y por "{{empresa_nombre}}".<br>
  - Las partes convienen que en tanto no se comunique por escrito a ambas partes de algún cambio de domicilio, cualquier diligencia, actuación, notificación, emplazamiento, requerimiento o comunicado, surtirá efectos en los domicilios señalados.</p>

  <p><b>DÉCIMA NOVENA. -</b> Las partes convienen que en caso de que "{{empresa_nombre}}" tuviere que instaurar algún procedimiento judicial para exigir el cumplimiento de las obligaciones consignadas en el presente Contrato, se sujetarán a lo siguiente:<br>
  "{{empresa_nombre}}", tendrá la facultad de señalar los bienes a embargar, sin seguir el orden establecido en los Artículos del Código de Comercio y del Código de Procedimientos Civiles.</p>

  <p><b>VIGÉSIMA. -</b> Para el caso de que "EL ACREDITADO" incumpla con cualquiera de las obligaciones a su cargo derivadas del presente contrato o con uno o más de los pagos convenidos, "{{empresa_nombre}}" queda facultado para acudir inmediatamente ante los tribunales judiciales y solicitar ante los mismos la declaración del vencimiento anticipado del presente contrato, procediendo de inmediato a descontar de la cantidad liquida existente, las sumas que importen los pagos que el "EL ACREDITADO", haya dejado de cubrir más la que se sigan causando hasta que judicialmente se determine la forma y términos en que debe cumplimentarse el total de las obligaciones derivadas del presente contrato.</p>

  <p><b>VIGÉSIMA PRIMERA. -</b> Todos los gastos, derechos y honorarios, que se causen por el otorgamiento y ejecución de este Instrumento; sus consecuencias y actos complementarios, así como su cancelación, cuando proceda, serán por cuenta de "EL ACREDITADO", quien se obliga a pagarlos en el momento en que se causen.<br>
  En caso de que "EL ACREDITADO", dejare de efectuar dichos pagos "{{empresa_nombre}}", podrá hacerlos por cuenta del propio "ACREDITADO", la que deberá reembolsarle el importe de los mismos más intereses moratorios a la tasa estipulada.</p>

  <p><b>VIGÉSIMA SEGUNDA. -</b> Para los mismos efectos de la cláusula DÉCIMA NOVENA, las partes se someten a las Leyes y Tribunales de la ciudad correspondiente al domicilio de "{{empresa_nombre}}" para lo cual "EL ACREDITADO" renuncia al fuero de cualquier domicilio presente o futuro que pudiere corresponderle.</p>

  <p>Leído que fue el presente contrato y explicado su valor y fuerza legal a los comparecientes, cuya identidad y capacidad se comprobaron, los otorgantes firman el presente Instrumento por triplicado, el día {{fecha_firma}}.</p>

  <br><br>
  <table style="width: 100%; text-align: center; border: none; margin-bottom: 30px;">
    <tr>
      <td style="width: 50%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>ACREDITANTE</b><br>"{{empresa_nombre}}"</p>
      </td>
      <td style="width: 50%; vertical-align: bottom;">
        <p>_____________________________</p>
        <p><b>EL ACREDITADO</b><br>GRUPO "{{cliente_nombre}}"</p>
      </td>
    </tr>
  </table>

  {{tabla_integrantes}}

</div>
`;
