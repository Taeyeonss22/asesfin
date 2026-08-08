import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToCSV } from '../../lib/exportUtils';
import { AlertTriangle, Download, RefreshCw, Filter } from 'lucide-react';
import { enrichCreditData } from '../../lib/penalties';

export default function CarteraMoraReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zonas, setZonas] = useState([]);
  const [selectedZona, setSelectedZona] = useState('ALL');
  
  // PAR = Portfolio at Risk (Monto atrasado / Monto total activo)
  const [parInfo, setParInfo] = useState({ cartera_riesgo: 0, cartera_total: 0, par: 0 });

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('vista_saldos_creditos').select('*').in('estado', ['ACTIVO', 'MORA']);
    if (selectedZona !== 'ALL') query = query.eq('zona_id', selectedZona);
    
    const { data: cData, error } = await query;
    
    if (!error && cData && cData.length > 0) {
      const creditIds = cData.map(c => c.credito_id);
      const { data: allPagos } = await queryPagos(creditIds); // Helper

      const reportData = [];
      let riesgo = 0;
      let total = 0;

      cData.forEach(credit => {
        total += parseFloat(credit.monto_otorgado) || 0;
        const pagos = allPagos.filter(p => p.credito_id === credit.credito_id);
        const enriched = enrichCreditData(credit, pagos, parseFloat(credit.saldo_pendiente) || 0);
        
        if (enriched) {
          // Si tiene pagos omitidos o está vencido, consideramos su adeudo real como riesgo
          const isAtRisk = enriched.pagos_omitidos > 0 || enriched.esta_vencido;
          const montoAtrasado = isAtRisk ? enriched.adeudo_total_real : 0;
          
          if (montoAtrasado > 0) {
            riesgo += montoAtrasado;
          }
          
          reportData.push({
            ...enriched,
            monto_atrasado: montoAtrasado,
            total_pagado: pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
          });
        }
      });

      // Sort by highest delay
      reportData.sort((a, b) => b.monto_atrasado - a.monto_atrasado);
      setData(reportData);

      const par = total > 0 ? (riesgo / total) * 100 : 0;
      setParInfo({ cartera_riesgo: riesgo, cartera_total: total, par });
    } else {
      setData([]);
      setParInfo({ cartera_riesgo: 0, cartera_total: 0, par: 0 });
    }

    const { data: zData } = await supabase.from('zonas').select('*');
    if (zData) setZonas(zData);

    setLoading(false);
  };

  const queryPagos = async (creditIds) => {
    return await supabase.from('pagos').select('*').in('credito_id', creditIds);
  };

  useEffect(() => {
    fetchData();
  }, [selectedZona]);

  const handleExport = () => {
    exportToCSV(data, 'Cartera_Mora');
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card" style={{ borderColor: 'var(--danger)' }}>
          <div className="metric-header">
            <div className="metric-title">Índice PAR (Riesgo)</div>
            <div className="metric-icon-box icon-box-danger"><AlertTriangle size={18} /></div>
          </div>
          <div className="metric-value danger">{parInfo.par.toFixed(2)}%</div>
          <div className="metric-sub text-danger">Porcentaje de cartera en atraso</div>
        </div>
        
        <div className="solid-card col-span-2 flex items-center justify-between">
          <div>
            <h4 className="text-muted text-sm uppercase tracking-wider mb-2">Filtros de Reporte</h4>
            <div className="flex gap-4">
              <select className="form-control" value={selectedZona} onChange={(e) => setSelectedZona(e.target.value)} style={{ width: '200px' }}>
                <option value="ALL">Todas las Zonas</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
              <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16}/></button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleExport} disabled={data.length === 0}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="solid-card">
        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
          <table>
            <thead>
              <tr>
                <th>Crédito</th>
                <th>Cliente / Grupo</th>
                <th>Monto Otorgado</th>
                <th>Abonado</th>
                <th>Monto Esperado</th>
                <th>Atraso</th>
                <th>Omitidos</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(d => d.monto_atrasado > 0).length === 0 ? (
                <tr><td colSpan="7" className="text-center text-muted p-6">No hay cartera en mora en esta zona.</td></tr>
              ) : (
                data.filter(d => d.monto_atrasado > 0).map((row) => (
                  <tr key={row.credito_id}>
                    <td className="font-medium">CTR-{row.credito_id.split('-')[0].toUpperCase()}</td>
                    <td>{row.nombre_cliente || `Crédito ${row.tipo}`}</td>
                    <td>${parseFloat(row.monto_otorgado).toLocaleString()}</td>
                    <td className="text-success">${parseFloat(row.total_pagado).toLocaleString()}</td>
                    <td>-</td>
                    <td className="text-danger font-bold">${parseFloat(row.monto_atrasado).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-mora">{row.pagos_omitidos} pagos</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
