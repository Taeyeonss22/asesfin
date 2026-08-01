import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PaymentDetailModal from './PaymentDetailModal';

export default function LiveFeed({ perfil }) {
  const [pagos, setPagos] = useState([]);
  const [selectedPago, setSelectedPago] = useState(null);

  const canViewDetail = perfil && perfil.rol !== 'cobrador';

  const fetchPagos = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        id,
        credito_id,
        monto,
        tipo,
        fecha_pago,
        registrado_por,
        latitud,
        longitud,
        evidencia_url,
        creditos (
          zona_id,
          nombre_cliente,
          tipo,
          clientes ( nombre_completo ),
          grupos ( nombre )
        ),
        perfiles (
          nombre_completo
        ),
        pagos_metadata (
          latitud,
          longitud,
          evidencia_url
        )
      `)
      .order('fecha_pago', { ascending: false })
      .limit(10); // Show last 10 for dashboard

    if (error) {
      console.error('Error fetching feed:', error);
    } else if (data) {
      const formatted = data.map(p => ({
        pago_id: p.id,
        credito_id: p.credito_id,
        zona_id: p.creditos?.zona_id,
        monto: p.monto,
        tipo_pago: p.tipo,
        fecha_pago: p.fecha_pago,
        registrado_por: p.registrado_por,
        latitud: (Array.isArray(p.pagos_metadata) ? p.pagos_metadata[0]?.latitud : p.pagos_metadata?.latitud) || p.latitud,
        longitud: (Array.isArray(p.pagos_metadata) ? p.pagos_metadata[0]?.longitud : p.pagos_metadata?.longitud) || p.longitud,
        evidencia_url: (Array.isArray(p.pagos_metadata) ? p.pagos_metadata[0]?.evidencia_url : p.pagos_metadata?.evidencia_url) || p.evidencia_url,
        cobrador_nombre: p.perfiles?.nombre_completo || 'Cobrador',
        cliente_nombre: p.creditos?.clientes?.nombre_completo || p.creditos?.grupos?.nombre || p.creditos?.nombre_cliente || 'Cliente'
      }));
      setPagos(formatted);
    }
  };

  useEffect(() => {
    fetchPagos();

    // Subscribe to new payments for live feed update
    const subscription = supabase
      .channel('public:pagos_feed_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pagos' }, () => {
        fetchPagos(); // Refetch the view so we get the names based on RLS
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="solid-card mb-4">
      <div className="feed-header">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Feed de Pagos en Tiempo Real (Oficina)</h3>
        </div>
        <div className="status-indicator">
          <div className="status-dot"></div>
          Supabase Realtime Activo
        </div>
      </div>
      
      {pagos.length === 0 ? (
        <p className="text-muted text-center" style={{ padding: '1rem' }}>No hay pagos registrados hoy.</p>
      ) : (
        <div className="feed-list">
          {pagos.map((pago, idx) => (
            <div 
              key={pago.pago_id} 
              className={`feed-item ${canViewDetail ? 'cursor-pointer hover:bg-slate-800' : ''}`}
              onClick={() => canViewDetail && setSelectedPago(pago)}
              style={canViewDetail ? { transition: 'background 0.2s' } : {}}
            >
              <div className="feed-item-left">
                <div className="feed-badge">#{idx + 1}</div>
                <div>
                  <div className="feed-client-name">{pago.cliente_nombre}</div>
                  <div className="feed-meta">
                    Contrato: CTR-{pago.credito_id.split('-')[0].toUpperCase()} • {format(new Date(pago.fecha_pago), 'hh:mm a', { locale: es })}
                  </div>
                </div>
              </div>
              <div className="feed-item-right">
                <div className="feed-amount">
                  +${pago.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <div className="feed-split">
                  {pago.tipo_pago === 'ABONO' ? 'Abono Regular' : pago.tipo_pago}
                  {pago.latitud ? ' • GPS ✓' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedPago && (
        <PaymentDetailModal pago={selectedPago} onClose={() => setSelectedPago(null)} />
      )}
    </div>
  );
}
