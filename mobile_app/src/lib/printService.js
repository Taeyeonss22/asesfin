import * as Print from 'expo-print';
import { format } from 'date-fns';

export const PrintService = {
  printTicket: async (ticketData, config) => {
    try {
      const fecha = format(new Date(ticketData.fecha_pago), 'dd/MM/yy HH:mm');
      const folio = ticketData.id ? ticketData.id.split('-')[0].toUpperCase() : 'PENDIENTE';
      
      let clienteNombre = 'Desconocido';
      if (ticketData.creditos) {
        clienteNombre = ticketData.creditos.tipo === 'INDIVIDUAL' 
          ? ticketData.creditos.nombre_cliente 
          : (ticketData.integrantes_grupo?.nombre_completo || 'Pago Grupal');
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
              <span class="bold">Cliente: </span>
              ${clienteNombre}
            </div>
            
            <div class="row">
              <span>Monto Abonado:</span>
              <span class="bold">$${ticketData.monto}</span>
            </div>
            <div class="row">
              <span>Tipo:</span>
              <span>${ticketData.tipo}</span>
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
      
      let pagosHtml = pagos.map(p => {
        const time = new Date(p.fecha_pago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const client = p.creditos?.nombre_cliente ? p.creditos.nombre_cliente.substring(0, 15) : 'Desconocido';
        return `
          <div style="font-size: 12px; margin-bottom: 3px;">
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
            
            <div class="divider"></div>
            
            <div class="center bold" style="margin-bottom: 10px;">DETALLE DE COBROS</div>
            ${pagosHtml}
            
            <div class="divider"></div>
            
            <div class="row">
              <span>T. Abonos:</span>
              <span>$${corte.total_abonos}</span>
            </div>
            <div class="row">
              <span>T. Ahorros:</span>
              <span>$${corte.total_ahorros}</span>
            </div>
            <div class="row">
              <span>T. Mora:</span>
              <span>$${corte.total_mora}</span>
            </div>
            
            <div class="divider" style="border-bottom: 2px solid #000;"></div>
            
            <div class="row bold" style="font-size: 16px;">
              <span>ENTREGAR:</span>
              <span>$${corte.gran_total}</span>
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
