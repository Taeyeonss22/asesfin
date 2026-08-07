import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { enrichCreditData, calcularFechaProgramada } from '../lib/penalties';

export default function CalendarioPagos({ creditoId }) {
  const [loading, setLoading] = useState(true);
  const [credito, setCredito] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [faltas, setFaltas] = useState(0);
  const [costoFaltas, setCostoFaltas] = useState(0);
  const [moratorio, setMoratorio] = useState(0);

  useEffect(() => {
    if (!creditoId) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Obtener detalles del crédito
      const { data: crData, error: crError } = await supabase
        .from('creditos')
        .select('*')
        .eq('id', creditoId)
        .single();
        
      if (crError) {
        console.error("Error fetching credito", crError);
        setLoading(false);
        return;
      }
      
      setCredito(crData);
      
      // 2. Obtener todos los abonos de este crédito
      const { data: pgData, error: pgError } = await supabase
        .from('pagos')
        .select('*')
        .eq('credito_id', creditoId)
        .eq('tipo', 'ABONO');
        
      if (!pgError && pgData) {
        setPagos(pgData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [creditoId]);

  useEffect(() => {
    if (!credito) return;
    
    // Generar 16 (o numero_periodos) filas
    const numPeriodos = credito.numero_periodos || 16;
    const periodos = [];
    
    const fechaInicio = new Date(credito.fecha_inicio);
    // Ajuste para evitar problema de zonas horarias en frontend
    fechaInicio.setMinutes(fechaInicio.getMinutes() + fechaInicio.getTimezoneOffset());
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    let incompletos = 0;
    
    // Agrupar pagos por numero_pago
    const pagosAgrupados = {};
    pagos.forEach(p => {
      if (!p.numero_pago) return; // Pagos antiguos sin numero_pago
      if (!pagosAgrupados[p.numero_pago]) pagosAgrupados[p.numero_pago] = [];
      pagosAgrupados[p.numero_pago].push(p);
    });
    
    for (let i = 1; i <= numPeriodos; i++) {
      let fechaProgramada = calcularFechaProgramada(fechaInicio, i, credito.periodicidad);
      
      const pagosDelPeriodo = pagosAgrupados[i] || [];
      const totalAbonado = pagosDelPeriodo.reduce((sum, p) => sum + Number(p.monto), 0);
      
      // ¿Está completo?
      // Usamos una tolerancia mínima (ej. 1 peso) por problemas de decimales
      const estaPagado = totalAbonado >= (credito.cuota_periodo - 1);
      
      const estaVencido = !estaPagado && fechaProgramada < hoy;
      
      if (estaVencido) {
        incompletos++;
      }
      
      periodos.push({
        numero: i,
        fechaProgramada,
        totalAbonado,
        estaPagado,
        estaVencido,
        pagos: pagosDelPeriodo
      });
    }
    
    setCalendario(periodos);
    
    // Apply enrich to calculate penalties correctly
    const enriched = enrichCreditData(credito, pagos, 0); // We just need the penalty math here
    if (enriched) {
      setFaltas(enriched.faltas_computadas);
      setCostoFaltas(enriched.costo_faltas);
      setMoratorio(enriched.moratorio);
    }
    
  }, [credito, pagos]);

  if (loading) {
    return <div className="text-center p-4 text-muted">Cargando calendario...</div>;
  }

  if (!credito) {
    return null;
  }

  return (
    <div className="mt-6 mb-4 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-muted uppercase tracking-wider text-xs flex items-center gap-2 m-0 border-none pb-0">
          <Calendar size={14} /> Calendario de Pagos
        </h4>
        <div className="flex gap-3">
          {moratorio > 0 && (
            <span className="badge badge-danger flex items-center gap-1">
              <AlertTriangle size={12} /> Moratorio Vencido: ${moratorio.toLocaleString('es-MX', {minimumFractionDigits: 2})}
            </span>
          )}
          {faltas > 0 ? (
            <span className="badge badge-warning flex items-center gap-1" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <AlertTriangle size={12} /> {faltas} Falta(s): ${costoFaltas.toLocaleString('es-MX', {minimumFractionDigits: 2})}
            </span>
          ) : (
            <span className="badge badge-success flex items-center gap-1">
              <CheckCircle size={12} /> Al Corriente
            </span>
          )}
        </div>
      </div>
      
      <div className="table-container" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-glass-light)', maxHeight: '50vh', overflowY: 'auto' }}>
        <table>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-table-header)' }}>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Semana</th>
              <th>Fecha Prog.</th>
              <th style={{ textAlign: 'center' }}>Cuota Esperada</th>
              <th style={{ textAlign: 'center' }}>Abonado</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {calendario.map(periodo => (
              <tr key={periodo.numero} className={periodo.estaVencido ? 'bg-red-500/10' : ''}>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{periodo.numero}</td>
                <td>{format(periodo.fechaProgramada, 'dd/MM/yyyy')}</td>
                <td style={{ textAlign: 'center' }}>${Number(credito.cuota_periodo).toLocaleString()}</td>
                <td style={{ textAlign: 'center', color: periodo.totalAbonado > 0 ? 'var(--success)' : 'inherit' }}>
                  ${periodo.totalAbonado.toLocaleString()}
                  {periodo.pagos.length > 0 && (
                    <div className="text-xs text-muted">
                      ({periodo.pagos[periodo.pagos.length-1].fecha_pago ? format(new Date(periodo.pagos[periodo.pagos.length-1].fecha_pago), 'dd/MM/yyyy') : 'N/A'})
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {periodo.estaPagado ? (
                    <span className="text-success flex justify-center items-center gap-1"><CheckCircle size={14}/> Pagado</span>
                  ) : periodo.estaVencido ? (
                    <span className="text-danger flex justify-center items-center gap-1 font-bold"><XCircle size={14}/> Pendiente</span>
                  ) : (
                    <span className="text-muted">Próximo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-xs text-muted mt-2">
        * Se calcula 1 falta por cada 3 semanas vencidas e incompletas. Actualmente hay {faltas * 3 + (calendario.filter(c => c.estaVencido).length % 3)} semanas vencidas.
      </div>
    </div>
  );
}
