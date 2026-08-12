import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';
import CreditForm from './CreditForm';
import DashboardMetrics from './DashboardMetrics';
import LiveFeed from './LiveFeed';
import VencimientosWidget from './VencimientosWidget';

export default function Dashboard({ session, perfil }) {
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [metricsKey, setMetricsKey] = useState(0);

  useEffect(() => {
    // Realtime listeners to refresh dashboard metrics when payments/credits occur
    const creditsSubscription = supabase
      .channel('dash:creditos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creditos' }, () => {
        setMetricsKey(k => k + 1);
      })
      .subscribe();

    const pagosSubscription = supabase
      .channel('dash:pagos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, () => {
        setMetricsKey(k => k + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(creditsSubscription);
      supabase.removeChannel(pagosSubscription);
    };
  }, []);

  const handleWipe = async () => {
    if (!window.confirm("¿Seguro que quieres borrar todos los datos de prueba?")) return;
    try {
      const deleteTable = async (table) => {
        const { data, error } = await supabase.from(table).select('id');
        if (error) throw new Error(`Error leyendo ${table}: ${error.message}`);
        if (data && data.length > 0) {
          const ids = data.map(r => r.id);
          const { error: delErr } = await supabase.from(table).delete().in('id', ids);
          if (delErr) throw new Error(`Error borrando ${table}: ${delErr.message}`);
        }
      };

      await deleteTable('pagos');
      await deleteTable('integrantes_grupo');
      await deleteTable('creditos');
      await deleteTable('cortes_diarios');
      await deleteTable('grupos');
      await deleteTable('clientes');

      alert("Limpieza terminada con éxito. La página se recargará.");
      window.location.reload();
    } catch (err) {
      alert("Fallo al limpiar: " + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="solid-card mb-6 flex justify-between items-center" style={{ padding: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Dashboard Operativo de Cobranza</h1>
          <p className="text-muted">Resumen en tiempo real de cartera activa, ingresos del día y seguimiento de faltas.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleWipe}>
            Limpiar BD
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreditForm(true)}>
            <Plus size={18} /> Otorgar Nuevo Crédito
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <DashboardMetrics key={metricsKey} />

      {/* Feed & Vencimientos Row */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveFeed key={`feed-${metricsKey}`} perfil={perfil} />
        </div>
        <div>
          <VencimientosWidget key={`venc-${metricsKey}`} />
        </div>
      </div>

      {showCreditForm && (
        <CreditForm onClose={() => setShowCreditForm(false)} session={session} />
      )}
    </div>
  );
}
