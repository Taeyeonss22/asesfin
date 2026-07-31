import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

export default function GlobalNotifications({ session }) {
  useEffect(() => {
    if (!session) return;

    const subscription = supabase
      .channel('global:pagos_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pagos' }, async (payload) => {
        const newPagoId = payload.new.id;
        
        // Fetch the hydrated data from the view
        const { data, error } = await supabase
          .from('vista_feed_pagos')
          .select('cliente_nombre, monto, cobrador_nombre, tipo_pago')
          .eq('pago_id', newPagoId)
          .single();
          
        if (error) {
          console.error('Error fetching new payment details for notification:', error);
          return;
        }
        
        if (data) {
          const formattedAmount = `$${data.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          
          toast.custom((t) => (
            <div
              className={t.visible ? 'animate-fade-in' : ''}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '350px',
                boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'auto',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--success)',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    Nuevo Pago Registrado
                  </h4>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{data.cliente_nombre}</span> • {data.tipo_pago}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formattedAmount}</span> por {data.cobrador_nombre || 'Cobrador'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Cerrar
              </button>
            </div>
          ), { duration: 5000 });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]);

  return null; // This component does not render anything directly
}
