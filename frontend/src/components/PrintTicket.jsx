import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PrintTicket({ configEmpresa }) {
  const { id } = useParams(); // id del pago
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {

      // Fetch primary payment
      const { data: pago, error: err2 } = await supabase
        .from('pagos')
        .select(`
          *,
          perfiles(nombre_completo),
          creditos(tipo, nombre_cliente, periodicidad, cuota_periodo, clientes(nombre_completo), grupos(nombre)),
          integrantes_grupo(nombre_completo)
        `)
        .eq('id', id)
        .single();
        
      if (err2) throw err2;
      
      // Fetch all payments in the same transaction (same timestamp)
      let consolidated = [];
      if (pago) {
        const { data: siblingPagos } = await supabase
          .from('pagos')
          .select('*')
          .eq('credito_id', pago.credito_id)
          .eq('fecha_pago', pago.fecha_pago);
        
        if (siblingPagos) {
          consolidated = siblingPagos;
        } else {
          consolidated = [pago];
        }
        
        setTicketData({ primary: pago, siblings: consolidated });
      }
      
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

  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error} (Verifica que corriste el script SQL)</div>;
  if (!ticketData || !configEmpresa) return <div style={{ padding: 20 }}>Generando ticket...</div>;

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
          {configEmpresa?.eslogan && (
            <div style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '2px' }}>
              {configEmpresa.eslogan}
            </div>
          )}
          <div style={{ fontSize: '10px' }}>
            {configEmpresa?.direccion}<br/>
            Tel: {configEmpresa?.telefono}
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="center bold" style={{ margin: '5px 0' }}>TICKET DE PAGO</div>
        
        <div className="row">
          <span>Fecha:</span>
          <span>{format(new Date(ticketData.primary.fecha_pago), 'dd/MM/yy HH:mm')}</span>
        </div>
        <div className="row">
          <span>Folio Pago:</span>
          <span>{ticketData.primary.id.split('-')[0].toUpperCase()}</span>
        </div>
        
        <div className="divider"></div>

        <div style={{ marginBottom: '5px' }}>
          <span className="bold">Cliente: </span>
          {ticketData.primary.creditos.tipo === 'INDIVIDUAL' 
            ? (ticketData.primary.creditos.nombre_cliente || ticketData.primary.creditos.clientes?.nombre_completo)
            : (ticketData.primary.integrantes_grupo?.nombre_completo || ticketData.primary.creditos.grupos?.nombre || 'Pago Grupal')}
        </div>

        {ticketData.primary.numero_pago && (
          <div className="row">
            <span>Período/Semana:</span>
            <span className="bold">{ticketData.primary.numero_pago}</span>
          </div>
        )}
        
        <div className="divider"></div>

        <div className="center bold" style={{ margin: '5px 0' }}>Desglose:</div>
        
        {ticketData.siblings.find(p => p.tipo === 'ABONO') && (
          <div className="row">
            <span>Abono a Crédito:</span>
            <span>${parseFloat(ticketData.siblings.find(p => p.tipo === 'ABONO').monto).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
          </div>
        )}
        {ticketData.siblings.find(p => p.tipo === 'AHORRO') && (
          <div className="row">
            <span>Ahorro:</span>
            <span>${parseFloat(ticketData.siblings.find(p => p.tipo === 'AHORRO').monto).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
          </div>
        )}
        {ticketData.siblings.find(p => p.tipo === 'MORA') && (
          <div className="row">
            <span>Moratorios/Faltas:</span>
            <span>${parseFloat(ticketData.siblings.find(p => p.tipo === 'MORA').monto).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
          </div>
        )}

        <div className="divider"></div>

        <div className="row bold">
          <span>Total Pagado:</span>
          <span>${ticketData.siblings.reduce((sum, p) => sum + parseFloat(p.monto), 0).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
        </div>

        <div className="divider"></div>
        <div className="row mt-2">
          <span>Atendió:</span>
          <span>{ticketData.primary.perfiles?.nombre_completo || 'Sistema'}</span>
        </div>

        <div className="divider"></div>
        
        <div className="center" style={{ marginTop: '10px' }}>
          ¡Gracias por su pago!
        </div>
        
        {/* Espacio extra para el corte de la impresora */}
        <div style={{ height: '15mm' }}></div>
      </div>
    </>
  );
}
