import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToCSV } from '../../lib/exportUtils';
import { TrendingUp, Download, RefreshCw, CalendarDays } from 'lucide-react';

export default function ProyeccionReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proyeccionDias, setProyeccionDias] = useState(7);
  const [totals, setTotals] = useState({ proyectado: 0, activo: 0 });

  const fetchProyeccion = async () => {
    setLoading(true);
    // Fetch active credits
    const { data: cData, error } = await supabase
      .from('vista_analisis_cartera')
      .select('*')
      .eq('estado', 'ACTIVO');

    if (!error && cData) {
      let totalProyectado = 0;
      let totalActivo = 0;

      const proyecciones = cData.map(c => {
        // Simple mathematical projection
        // How many periods fall into the next 'proyeccionDias' days?
        let diasPorPeriodo = 7;
        switch (c.periodicidad) {
          case 'DIARIA': diasPorPeriodo = 1; break;
          case 'SEMANAL': diasPorPeriodo = 7; break;
          case 'CATORCENAL': diasPorPeriodo = 14; break;
          case 'QUINCENAL': diasPorPeriodo = 15; break;
          case 'MENSUAL': diasPorPeriodo = 30; break;
        }

        // How many full periods will trigger in the next X days?
        // (Rough estimate for projection)
        const periodosFuturos = Math.floor(proyeccionDias / diasPorPeriodo) || (proyeccionDias >= diasPorPeriodo ? 1 : 0);
        
        let montoProyectado = periodosFuturos * c.cuota_periodo;
        // Cap by remaining balance
        if (montoProyectado > c.saldo_pendiente) {
          montoProyectado = c.saldo_pendiente;
        }

        totalProyectado += montoProyectado;
        totalActivo += parseFloat(c.monto_otorgado);

        return {
          credito_id: c.credito_id,
          nombre_cliente: c.nombre_cliente,
          tipo: c.tipo,
          periodicidad: c.periodicidad,
          saldo_pendiente: c.saldo_pendiente,
          cuota_periodo: c.cuota_periodo,
          monto_proyectado: montoProyectado
        };
      }).filter(p => p.monto_proyectado > 0);

      proyecciones.sort((a, b) => b.monto_proyectado - a.monto_proyectado);
      setData(proyecciones);
      setTotals({ proyectado: totalProyectado, activo: totalActivo });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProyeccion();
  }, [proyeccionDias]);

  const handleExport = () => {
    exportToCSV(data, `Proyeccion_Cobranza_${proyeccionDias}dias`);
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card" style={{ borderColor: 'var(--info)' }}>
          <div className="metric-header">
            <div className="metric-title">PROYECCIÓN DE INGRESOS</div>
            <div className="metric-icon-box icon-box-info"><TrendingUp size={18} /></div>
          </div>
          <div className="metric-value text-info">
            ${totals.proyectado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-sub">
            En los próximos {proyeccionDias} días
          </div>
        </div>
        
        <div className="solid-card col-span-2 flex items-center justify-between">
          <div>
            <h4 className="text-muted text-sm uppercase tracking-wider mb-2">Escala de Tiempo</h4>
            <div className="flex gap-4">
              <select className="form-control" value={proyeccionDias} onChange={(e) => setProyeccionDias(Number(e.target.value))} style={{ width: '200px' }}>
                <option value={7}>Próximos 7 días</option>
                <option value={15}>Próximos 15 días</option>
                <option value={30}>Próximos 30 días</option>
              </select>
              <button className="btn btn-outline" onClick={fetchProyeccion}><RefreshCw size={16}/></button>
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
                <th>Periodicidad</th>
                <th>Cuota Regular</th>
                <th>Saldo Restante</th>
                <th>Proyectado ({proyeccionDias} días)</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted p-6">No hay pagos proyectados en este rango.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.credito_id}>
                    <td className="font-medium">CTR-{row.credito_id.split('-')[0].toUpperCase()}</td>
                    <td>{row.nombre_cliente || `Crédito ${row.tipo}`}</td>
                    <td><span className="badge badge-default">{row.periodicidad}</span></td>
                    <td>${parseFloat(row.cuota_periodo).toLocaleString()}</td>
                    <td>${parseFloat(row.saldo_pendiente).toLocaleString()}</td>
                    <td className="text-info font-bold">${parseFloat(row.monto_proyectado).toLocaleString()}</td>
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
