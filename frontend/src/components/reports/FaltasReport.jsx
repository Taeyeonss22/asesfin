import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToCSV } from '../../lib/exportUtils';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';

export default function FaltasReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zonas, setZonas] = useState([]);
  const [selectedZona, setSelectedZona] = useState('ALL');
  const [minFaltas, setMinFaltas] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('vista_analisis_cartera').select('*');
    if (selectedZona !== 'ALL') query = query.eq('zona_id', selectedZona);
    
    const { data: reportData, error } = await query;
    
    if (!error && reportData) {
      // Filter by min Faltas and sort descending
      const faltasData = reportData
        .filter(d => d.faltas >= minFaltas)
        .sort((a, b) => b.faltas - a.faltas);
      setData(faltasData);
    }

    const { data: zData } = await supabase.from('zonas').select('*');
    if (zData) setZonas(zData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedZona, minFaltas]);

  const handleExport = () => {
    exportToCSV(data, 'Reporte_Faltas');
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card" style={{ borderColor: 'var(--warning)' }}>
          <div className="metric-header">
            <div className="metric-title">CLIENTES EN RIESGO</div>
            <div className="metric-icon-box icon-box-warning"><AlertCircle size={18} /></div>
          </div>
          <div className="metric-value warning">{data.length}</div>
          <div className="metric-sub">
            Con {minFaltas} o más faltas
          </div>
        </div>
        
        <div className="solid-card col-span-2 flex items-center justify-between">
          <div className="flex gap-4">
            <div>
              <h4 className="text-muted text-xs uppercase tracking-wider mb-2">Zona</h4>
              <select className="form-control" value={selectedZona} onChange={(e) => setSelectedZona(e.target.value)} style={{ width: '150px' }}>
                <option value="ALL">Todas</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
            <div>
              <h4 className="text-muted text-xs uppercase tracking-wider mb-2">Mínimo Faltas</h4>
              <select className="form-control" value={minFaltas} onChange={(e) => setMinFaltas(Number(e.target.value))} style={{ width: '120px' }}>
                <option value={1}>1 o más</option>
                <option value={2}>2 o más</option>
                <option value={3}>3 o más (Grave)</option>
              </select>
            </div>
            <div className="flex items-end">
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
                <th>Atraso ($)</th>
                <th>Pagos Omitidos</th>
                <th>Faltas Computadas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted p-6">No hay clientes con ese nivel de faltas.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.credito_id}>
                    <td className="font-medium">CTR-{row.credito_id.split('-')[0].toUpperCase()}</td>
                    <td>{row.nombre_cliente || `Crédito ${row.tipo}`}</td>
                    <td className="text-danger font-bold">${parseFloat(row.monto_atrasado).toLocaleString()}</td>
                    <td>{row.pagos_omitidos}</td>
                    <td>
                      <span className={`badge ${row.faltas >= 3 ? 'badge-mora' : 'badge-warning'}`} style={{ backgroundColor: row.faltas >= 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: row.faltas >= 3 ? 'var(--danger)' : 'var(--warning)', border: 'none' }}>
                        {row.faltas} faltas
                      </span>
                    </td>
                    <td><span className="badge badge-default">{row.estado}</span></td>
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
