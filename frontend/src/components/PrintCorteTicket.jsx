import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function PrintCorteTicket({ configEmpresa }) {
  const { id } = useParams(); // id del corte
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        // Fetch corte details
        const { data: corte, error: errCorte } = await supabase
          .from('cortes_diarios')
          .select(`
            *,
            cobrador:perfiles!cortes_diarios_cobrador_id_fkey(nombre_completo)
          `)
          .eq('id', id)
          .single();
          
        if (errCorte) throw errCorte;

        // Fetch pagos in this corte
        const { data: pagos, error: errPagos } = await supabase
          .from('pagos')
          .select(`
            *,
            creditos(tipo, nombre_cliente, clientes(nombre_completo), grupos(nombre)),
            integrantes_grupo(nombre_completo)
          `)
          .eq('corte_id', id)
          .order('fecha_pago', { ascending: true });
          
        if (errPagos) throw errPagos;

        setTicketData({ corte, pagos });

        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchTicket();
  }, [id]);

  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!ticketData || !configEmpresa) return <div style={{ padding: 20 }}>Generando ticket de corte...</div>;

  const getClientName = (pago) => {
    if (pago.creditos?.tipo === 'INDIVIDUAL') {
      return pago.creditos.nombre_cliente || pago.creditos.clientes?.nombre_completo || 'Desconocido';
    } else {
      return pago.integrantes_grupo?.nombre_completo || pago.creditos?.grupos?.nombre || 'Grupo';
    }
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: 58mm auto; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          .ticket {
            width: 58mm;
            padding: 5mm;
            font-family: monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            box-sizing: border-box;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; }
        `}
      </style>
      <div className="ticket">
        {/* Encabezado */}
        <div className="center" style={{ marginBottom: '10px' }}>
          {configEmpresa?.logo_url && (
            <img 
              src={configEmpresa.logo_url} 
              alt="Logo" 
              style={{ maxWidth: '100%', height: 'auto', maxHeight: '60px', marginBottom: '5px' }} 
            />
          )}
          <div className="bold" style={{ fontSize: '14px', marginBottom: '2px' }}>
            {configEmpresa?.nombre_empresa || 'Empresa'}
          </div>
          <div style={{ fontSize: '10px' }}>
            CORTE DE CAJA
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="row">
          <span>Fecha:</span>
          <span>{format(new Date(ticketData.corte.fecha), 'dd/MM/yy HH:mm')}</span>
        </div>
        <div className="row">
          <span>Folio Corte:</span>
          <span>{ticketData.corte.id.split('-')[0].toUpperCase()}</span>
        </div>
        <div className="row">
          <span>Cobrador:</span>
          <span>{ticketData.corte.cobrador?.nombre_completo?.split(' ')[0] || 'N/A'}</span>
        </div>
        
        <div className="divider"></div>
        <div className="center bold" style={{ margin: '5px 0' }}>Detalle de Cobros:</div>
        
        {ticketData.pagos && ticketData.pagos.length > 0 ? (
          ticketData.pagos.map((pago, index) => (
            <div key={pago.id || index} style={{ marginBottom: '6px', fontSize: '10px' }}>
              <div className="row">
                <span className="bold">
                  [{format(new Date(pago.fecha_pago), 'HH:mm')}] {getClientName(pago).substring(0, 15)}...
                </span>
              </div>
              <div className="row">
                <span>- {pago.tipo}</span>
                <span>${parseFloat(pago.monto).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="center" style={{ fontSize: '10px', margin: '5px 0' }}>Sin cobros registrados</div>
        )}

        <div className="divider"></div>
        <div className="center bold" style={{ margin: '5px 0' }}>Resumen:</div>

        <div className="row">
          <span>Total Abonos:</span>
          <span>${parseFloat(ticketData.corte.total_abonos).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
        </div>
        <div className="row">
          <span>Total Ahorros:</span>
          <span>${parseFloat(ticketData.corte.total_ahorros).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
        </div>
        <div className="row">
          <span>Total Moras:</span>
          <span>${parseFloat(ticketData.corte.total_mora).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
        </div>

        <div className="divider"></div>

        <div className="row bold" style={{ fontSize: '14px', marginTop: '5px' }}>
          <span>A ENTREGAR:</span>
          <span>${parseFloat(ticketData.corte.gran_total).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
        </div>
        
        <div className="divider" style={{ marginTop: '5px' }}></div>
        <div className="center" style={{ fontSize: '10px', marginTop: '10px' }}>
          Firma Cobrador
          <br /><br /><br />
          _______________________
        </div>
      </div>
    </>
  );
}
