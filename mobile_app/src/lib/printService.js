import * as Print from 'expo-print';
import { format } from 'date-fns';

export const PrintService = {
  printTicket: async (ticketData, config) => {
    try {
      // ticketData from HistorialScreen has: primary, siblings, adeudo_actual
      // ticketData from CobroScreen (offline) has: just the base pago with monto, tipo, creditos
      
      const primary = ticketData.primary || ticketData;
      const siblings = ticketData.siblings || [ticketData];
      const adeudo_actual = ticketData.adeudo_actual !== undefined ? ticketData.adeudo_actual : (primary.creditos?.saldo_pendiente - (primary.tipo === 'ABONO' ? primary.monto : 0));
      
      const fecha = format(new Date(primary.fecha_pago), 'dd/MM/yy HH:mm');
      const folio = primary.id ? primary.id.split('-')[0].toUpperCase() : 'PENDIENTE';
      
      let clienteNombre = 'Desconocido';
      if (primary.creditos) {
        clienteNombre = primary.creditos.tipo === 'INDIVIDUAL' 
          ? (primary.creditos.nombre_cliente || primary.creditos.clientes?.nombre_completo)
          : (primary.creditos.grupos?.nombre || 'Grupo Solidario');
      }

      // Format amounts
      const totalPagado = siblings.reduce((sum, p) => sum + parseFloat(p.monto), 0);
      const abonoS = siblings.filter(p => p.tipo === 'ABONO').reduce((sum, p) => sum + parseFloat(p.monto), 0);
      const ahorroS = siblings.filter(p => p.tipo === 'AHORRO').reduce((sum, p) => sum + parseFloat(p.monto), 0);
      const moraS = siblings.filter(p => p.tipo === 'MORA').reduce((sum, p) => sum + parseFloat(p.monto), 0);

      let desgloseHtml = '';
      if (primary.creditos?.tipo === 'INDIVIDUAL' || !primary.creditos) {
        if (abonoS > 0) desgloseHtml += `<div class="row"><span>Abono a Crédito:</span><span>$${abonoS.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>`;
        if (ahorroS > 0) desgloseHtml += `<div class="row"><span>Ahorro:</span><span>$${ahorroS.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>`;
        if (moraS > 0) desgloseHtml += `<div class="row"><span>Moratorios/Faltas:</span><span>$${moraS.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>`;
      } else {
        const intGroups = siblings.reduce((acc, p) => {
          const intId = p.integrante_id || 'general';
          if (!acc[intId]) {
            acc[intId] = {
              nombre: p.integrantes_grupo?.nombre_completo || 'Pago General',
              abono: 0, ahorro: 0, mora: 0, total: 0
            };
          }
          const amt = parseFloat(p.monto);
          if (p.tipo === 'ABONO') acc[intId].abono += amt;
          if (p.tipo === 'AHORRO') acc[intId].ahorro += amt;
          if (p.tipo === 'MORA') acc[intId].mora += amt;
          acc[intId].total += amt;
          return acc;
        }, {});

        desgloseHtml = Object.entries(intGroups).map(([intId, dt]) => `
          <div style="margin-bottom: 8px;">
            <div class="bold" style="font-size: 10px;">- ${dt.nombre}</div>
            ${dt.abono > 0 ? `<div class="row" style="font-size: 10px;"><span>Abono:</span><span>$${dt.abono.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>` : ''}
            ${dt.ahorro > 0 ? `<div class="row" style="font-size: 10px;"><span>Ahorro:</span><span>$${dt.ahorro.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>` : ''}
            ${dt.mora > 0 ? `<div class="row" style="font-size: 10px;"><span>Mora/Faltas:</span><span>$${dt.mora.toLocaleString('es-MX', {minimumFractionDigits:2})}</span></div>` : ''}
          </div>
        `).join('');
      }

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: monospace; font-size: 14px; color: #000; padding: 10px; margin: 0; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .mt-2 { margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 18px; margin-bottom: 5px;">
              ${config?.nombre_empresa || 'Empresa'}
            </div>
            <div class="center">
              ${config?.direccion || ''}<br/>
              Tel: ${config?.telefono || ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="center bold" style="margin: 10px 0; font-size: 16px;">TICKET DE PAGO</div>
            
            <div class="row">
              <span>Fecha:</span>
              <span>${fecha}</span>
            </div>
            <div class="row">
              <span>Folio:</span>
              <span>${folio}</span>
            </div>
            
            <div class="divider"></div>

            <div style="margin-bottom: 10px;">
              <span class="bold">Cliente/Grupo: </span>
              ${clienteNombre}
            </div>
            
            ${primary.numero_pago ? `
            <div class="row">
              <span>Período/Semana:</span>
              <span class="bold">${primary.numero_pago}</span>
            </div>
            ` : ''}

            <div class="divider"></div>
            
            <div class="center bold" style="margin: 10px 0;">Desglose:</div>
            
            ${desgloseHtml}
            
            <div class="divider"></div>
            
            <div class="row bold">
              <span>Total Pagado:</span>
              <span>$${totalPagado.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            </div>

            <div class="divider"></div>

            <div class="row mt-2">
              <span>Adeudo Restante:</span>
              <span class="bold">$${adeudo_actual.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            </div>
            
            <div class="row mt-2">
              <span>Atendió:</span>
              <span>${primary.perfiles?.nombre_completo || 'Cobrador'}</span>
            </div>

            <div class="divider"></div>

            <div class="center" style="margin-top: 20px;">
              ¡Gracias por su pago!
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
      });
    } catch (error) {
      console.error("Error printing ticket:", error);
    }
  },

  printCorteTicket: async (corteData, config) => {
    try {
      const { corte, pagos } = corteData;
      const fechaCorte = format(new Date(corte.fecha), 'dd/MM/yy HH:mm');
      const folio = corte.id ? corte.id.split('-')[0].toUpperCase() : 'PENDIENTE';
      const cobrador = corte.cobrador?.nombre_completo || 'Sistema';

      let pagosHtml = pagos.map(p => {
        const time = new Date(p.fecha_pago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let client = p.creditos?.nombre_cliente || p.creditos?.clientes?.nombre_completo || p.creditos?.grupos?.nombre || p.credito_id.substring(0,8);
        if (p.creditos?.tipo === 'GRUPAL' && p.integrantes_grupo) {
          client = `${client} - ${p.integrantes_grupo.nombre_completo.substring(0, 10)}`;
        } else {
          client = client.substring(0, 15);
        }
        
        return `
          <div style="font-size: 10px; margin-bottom: 3px;">
            <div>${client} (${p.tipo.substring(0,2)})</div>
            <div class="row">
              <span>${time}</span>
              <span class="bold">$${p.monto}</span>
            </div>
          </div>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: monospace; font-size: 14px; color: #000; padding: 10px; margin: 0; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 18px; margin-bottom: 5px;">
              ${config?.nombre_empresa || 'Empresa'}
            </div>
            
            <div class="divider"></div>
            
            <div class="center bold" style="margin: 10px 0; font-size: 16px;">CORTE DE CAJA</div>
            
            <div class="row">
              <span>Fecha:</span>
              <span>${fechaCorte}</span>
            </div>
            <div class="row">
              <span>Folio:</span>
              <span>${folio}</span>
            </div>
            <div class="row">
              <span>Cobrador:</span>
              <span>${cobrador}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="center bold" style="margin-bottom: 10px;">DETALLE DE COBROS</div>
            ${pagosHtml}
            
            <div class="divider"></div>
            
            <div class="row">
              <span>T. Abonos:</span>
              <span>$${parseFloat(corte.total_abonos).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            </div>
            <div class="row">
              <span>T. Ahorros:</span>
              <span>$${parseFloat(corte.total_ahorros).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            </div>
            <div class="row">
              <span>T. Mora:</span>
              <span>$${parseFloat(corte.total_mora).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            </div>
            
            <div class="divider" style="border-bottom: 2px solid #000;"></div>
            
            <div class="row bold" style="font-size: 16px;">
              <span>ENTREGAR:</span>
              <span>$${parseFloat(corte.gran_total).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="center" style="margin-top: 30px; margin-bottom: 50px;">
              _________________________<br/>
              Firma Cobrador
            </div>
            <div class="center" style="margin-bottom: 20px;">
              _________________________<br/>
              Firma Recibe
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html,
      });
    } catch (error) {
      console.error("Error printing corte:", error);
    }
  }
};
