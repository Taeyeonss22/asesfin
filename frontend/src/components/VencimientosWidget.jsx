import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { enrichCreditData } from '../lib/penalties';
import { AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function VencimientosWidget() {
  const [vencimientos, setVencimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVencimientos = async () => {
      // Fetch active credits
      const { data: cData } = await supabase.from('vista_saldos_creditos').select('*').in('estado', ['ACTIVO', 'MORA']);
      if (!cData || cData.length === 0) {
        setLoading(false);
        return;
      }

      const creditIds = cData.map(c => c.credito_id);
      
      const { data: allPagos } = await supabase
        .from('pagos')
        .select('*')
        .in('credito_id', creditIds);

      const pagosByCredit = {};
      if (allPagos) {
        allPagos.forEach(p => {
          if (!pagosByCredit[p.credito_id]) pagosByCredit[p.credito_id] = [];
          pagosByCredit[p.credito_id].push(p);
        });
      }

      const riesgos = [];
      cData.forEach(credit => {
        const enriched = enrichCreditData(credit, pagosByCredit[credit.credito_id] || [], parseFloat(credit.saldo_pendiente) || 0);
        if (enriched && enriched.en_riesgo_vencimiento) {
          riesgos.push(enriched);
        }
      });

      // Sort by days to expire (closest first)
      riesgos.sort((a, b) => a.dias_para_vencer - b.dias_para_vencer);
      setVencimientos(riesgos);
      setLoading(false);
    };

    fetchVencimientos();
  }, []);

  if (loading) return <div className="p-4 text-center text-muted">Cargando vencimientos...</div>;

  if (vencimientos.length === 0) {
    return (
      <div className="solid-card h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="icon-box-success mb-3 p-3 rounded-full flex items-center justify-center" style={{ background: 'var(--success-light)', color: 'var(--success)', width: '48px', height: '48px' }}>
          <Calendar size={24} />
        </div>
        <h3 className="text-lg font-bold">Sin Vencimientos</h3>
        <p className="text-muted text-sm mt-1">No hay créditos a punto de vencer en los próximos 7 días.</p>
      </div>
    );
  }

  return (
    <div className="solid-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold flex items-center gap-2 m-0 border-0 p-0 text-warning">
          <AlertCircle size={18} /> Créditos por Vencer
        </h3>
        <span className="badge badge-warning">{vencimientos.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}>
        <div className="flex flex-col gap-3">
          {vencimientos.map(v => (
            <div key={v.credito_id} className="p-3 rounded-lg border flex flex-col gap-2" style={{ borderColor: 'var(--warning-light)', background: 'rgba(245,158,11,0.05)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{v.nombre_cliente}</div>
                  <div className="text-xs text-muted uppercase tracking-wider">{v.folio} • {v.tipo}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-warning text-sm">
                    ${v.adeudo_total_real.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                  </div>
                  <div className="text-xs text-danger font-bold">
                    {v.dias_para_vencer === 0 ? 'VENCE HOY' : `Faltan ${v.dias_para_vencer} días`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
