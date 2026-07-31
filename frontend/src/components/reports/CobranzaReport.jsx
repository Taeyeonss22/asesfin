import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToCSV } from '../../lib/exportUtils';
import { DollarSign, Download, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function CobranzaReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch payments within the date range
    const { data: reportData, error } = await supabase
      .from('vista_cobranza_cobrador')
      .select('*')
      .gte('fecha_pago', dateRange.start)
      .lte('fecha_pago', dateRange.end);
      
    if (!error && reportData) {
      // Group by cobrador
      const grouped = reportData.reduce((acc, curr) => {
        const id = curr.cobrador_id || 'unassigned';
        if (!acc[id]) {
          acc[id] = {
            cobrador_id: id,
            cobrador_nombre: curr.cobrador_nombre || 'Sin Asignar',
            zona_nombre: curr.nombre_zona,
            pagos_count: 0,
            monto_total: 0
          };
        }
        acc[id].pagos_count += 1;
        acc[id].monto_total += parseFloat(curr.monto);
        return acc;
      }, {});
      
      setData(Object.values(grouped).sort((a, b) => b.monto_total - a.monto_total));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleExport = () => {
    exportToCSV(data, 'Cobranza_Cobrador');
  };

  return (
    <div className="animate-fade-in">
      <div className="solid-card flex items-center justify-between mb-6">
        <div>
          <h4 className="text-muted text-sm uppercase tracking-wider mb-2">Rango de Fechas</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                className="form-control" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
              />
              <span className="text-muted">hasta</span>
              <input 
                type="date" 
                className="form-control" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
            <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16}/></button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleExport} disabled={data.length === 0}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="metric-card md:col-span-1">
          <div className="metric-header">
            <div className="metric-title">TOTAL RECAUDADO</div>
            <div className="metric-icon-box icon-box-success"><DollarSign size={18} /></div>
          </div>
          <div className="metric-value success">
            ${data.reduce((sum, row) => sum + row.monto_total, 0).toLocaleString()}
          </div>
          <div className="metric-sub">
            En el periodo seleccionado
          </div>
        </div>
        <div className="metric-card md:col-span-2 flex items-center justify-center border-dashed">
           <p className="text-muted text-sm text-center">
             * El monto esperado contra el que se compara a los cobradores dependerá de los periodos que vencen dentro del rango seleccionado.
           </p>
        </div>
      </div>

      <div className="solid-card">
        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
          <table>
            <thead>
              <tr>
                <th>Cobrador / Empleado</th>
                <th>Zona Asignada</th>
                <th>Transacciones Registradas</th>
                <th>Monto Recaudado</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted p-6">No hay pagos en este periodo.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.cobrador_id}>
                    <td className="font-medium">{row.cobrador_nombre}</td>
                    <td>{row.zona_nombre}</td>
                    <td><span className="badge badge-default">{row.pagos_count} pagos</span></td>
                    <td className="text-success font-bold">${row.monto_total.toLocaleString()}</td>
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
