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

      // Fetch payment with all joins
      const { data: pago, error: err2 } = await supabase
        .from('pagos')
        .select(`
          *,
          perfiles(nombre_completo),
          creditos(tipo, nombre_cliente, periodicidad, cuota_periodo),
          integrantes_grupo(nombre_completo)
        `)
        .eq('id', id)
        .single();
        
      if (err2) throw err2;
      if (pago) setTicketData(pago);
      
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
          <span>{format(new Date(ticketData.fecha_pago), 'dd/MM/yy HH:mm')}</span>
        </div>
        <div className="row">
          <span>Folio Pago:</span>
          <span>{ticketData.id.split('-')[0].toUpperCase()}</span>
        </div>
        
        <div className="divider"></div>

        <div style={{ marginBottom: '5px' }}>
          <span className="bold">Cliente: </span>
          {ticketData.creditos.tipo === 'INDIVIDUAL' 
            ? ticketData.creditos.nombre_cliente 
            : ticketData.integrantes_grupo?.nombre_completo || 'Pago Grupal'}
        </div>
        
        <div className="row">
          <span>Monto Abonado:</span>
          <span className="bold">${ticketData.monto}</span>
        </div>
        <div className="row">
          <span>Tipo:</span>
          <span>{ticketData.tipo}</span>
        </div>
        <div className="row">
          <span>Atendió:</span>
          <span>{ticketData.perfiles?.nombre_completo || 'Sistema'}</span>
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
