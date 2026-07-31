import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState({ 
    cobrado_hoy: 0,
    abonos_hoy: 0,
    cartera_activa: 0, 
    creditos_activos: 0,
    adeudo_total: 0 
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    // 1. Fetch adeudo from the view
    const { data: vData } = await supabase.from('vista_metricas_dashboard').select('*');
    let totalCreditos = 0;
    let totalAdeudo = 0;
    
    if (vData) {
      totalCreditos = vData.reduce((acc, curr) => acc + parseInt(curr.creditos_activos), 0);
      totalAdeudo = vData.reduce((acc, curr) => acc + parseFloat(curr.adeudo_total_cartera), 0);
    }

    // 2. Fetch cartera activa (sum of monto_otorgado of active credits)
    const { data: cData } = await supabase.from('creditos').select('monto_otorgado').eq('estado', 'ACTIVO');
    const carteraColocada = cData ? cData.reduce((acc, curr) => acc + parseFloat(curr.monto_otorgado), 0) : 0;

    // 3. Fetch cobrado hoy
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: pData } = await supabase
      .from('pagos')
      .select('monto')
      .eq('tipo', 'ABONO')
      .gte('fecha_pago', startOfDay.toISOString());
    
    const cobradoHoy = pData ? pData.reduce((acc, curr) => acc + parseFloat(curr.monto), 0) : 0;
    const abonosHoy = pData ? pData.length : 0;

    setMetrics({
      cobrado_hoy: cobradoHoy,
      abonos_hoy: abonosHoy,
      cartera_activa: carteraColocada,
      creditos_activos: totalCreditos,
      adeudo_total: totalAdeudo
    });
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    // In real app, the parent Dashboard handles realtime and remounts this via key,
    // but just in case we can also listen here or rely on parent.
  }, []);

  if (loading) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Cobrado Hoy */}
      <div className="metric-card">
        <div className="metric-header">
          <div className="metric-title">COBRADO EL DÍA DE HOY</div>
          <div className="metric-icon-box icon-box-success">
            <DollarSign size={18} strokeWidth={2.5} />
          </div>
        </div>
        <div className="metric-value success">
          ${metrics.cobrado_hoy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        <div className="metric-sub text-success">
          <CheckCircle2 size={12} /> {metrics.abonos_hoy} abonos capturados hoy
        </div>
      </div>

      {/* Cartera Colocada Activa */}
      <div className="metric-card">
        <div className="metric-header">
          <div className="metric-title">CARTERA COLOCADA ACTIVA</div>
          <div className="metric-icon-box icon-box-info">
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
        </div>
        <div className="metric-value">
          ${metrics.cartera_activa.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        <div className="metric-sub">
          {metrics.creditos_activos} créditos activos totales
        </div>
      </div>

      {/* Adeudo Vigente */}
      <div className="metric-card">
        <div className="metric-header">
          <div className="metric-title">ADEUDO VIGENTE (+ MORAS)</div>
          <div className="metric-icon-box icon-box-warning">
            <CreditCard size={18} strokeWidth={2.5} />
          </div>
        </div>
        <div className="metric-value warning">
          ${metrics.adeudo_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        <div className="metric-sub">
          Total pendiente por recuperar
        </div>
      </div>

      {/* Faltas de Pago (Placeholder) */}
      <div className="metric-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div className="metric-header">
          <div className="metric-title">FALTAS DE PAGO ACTIVAS</div>
          <div className="metric-icon-box icon-box-danger">
            <AlertTriangle size={18} strokeWidth={2.5} />
          </div>
        </div>
        <div className="metric-value danger">
          0 faltas
        </div>
        <div className="metric-sub">
          Regla: Cada 3 incompletos = 1 falta
        </div>
      </div>
    </div>
  );
}
