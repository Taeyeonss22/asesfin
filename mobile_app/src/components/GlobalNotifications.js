import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';

export default function GlobalNotifications({ session }) {
  useEffect(() => {
    if (!session) return;

    const subscription = supabase
      .channel('global:pagos_notifications_mobile')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pagos' }, async (payload) => {
        const newPagoId = payload.new.id;
        
        // Fetch the hydrated data from the view
        const { data, error } = await supabase
          .from('vista_feed_pagos')
          .select('cliente_nombre, monto, cobrador_nombre, tipo_pago')
          .eq('pago_id', newPagoId)
          .single();
          
        if (error) {
          console.log('Error fetching new payment details for notification:', error);
          return;
        }
        
        if (data) {
          const formattedAmount = `$${data.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          
          Toast.show({
            type: 'success',
            text1: `Pago: ${data.cliente_nombre}`,
            text2: `${formattedAmount} cobrado por ${data.cobrador_nombre || 'Cobrador'}`,
            position: 'top',
            visibilityTime: 5000,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]);

  return null;
}
