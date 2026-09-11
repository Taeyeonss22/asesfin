import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Modal from './Modal';

export default function ClientProfileModal({ clientId, onClose }) {
  const [client, setClient] = useState(null);
  const [credits, setCredits] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // 1. Info del cliente
        const { data: clientData } = await supabase.from('clientes').select('*').eq('id', clientId).single();
        setClient(clientData);

        // 2. Créditos individuales
        const { data: indCredits } = await supabase.from('vista_saldos_creditos').select('*').eq('cliente_id', clientId);
        
        // 3. Créditos grupales (donde es integrante)
        const { data: grpMembers } = await supabase.from('vista_saldos_integrantes').select('*, creditos:credito_id(estado, fecha_inicio, numero_periodos)').eq('cliente_id', clientId);

        // Transformar grupales para unificar formato
        const mappedGrpCredits = (grpMembers || []).map(m => ({
          credito_id: m.credito_id,
          tipo: 'GRUPAL',
          monto_otorgado: m.monto_otorgado,
          total_a_pagar: m.total_a_pagar,
          saldo_pendiente: m.saldo_pendiente,
          estado: m.creditos?.estado || 'DESCONOCIDO',
          fecha_inicio: m.creditos?.fecha_inicio,
          numero_periodos: m.creditos?.numero_periodos,
          integrante_id: m.integrante_id
        }));

        const allCredits = [...(indCredits || []), ...mappedGrpCredits].sort((a, b) => new Date(b.fecha_inicio || 0) - new Date(a.fecha_inicio || 0));
        setCredits(allCredits);

        // 4. Pagos individuales
        const indCreditIds = (indCredits || []).map(c => c.credito_id);
        let indPagos = [];
        if (indCreditIds.length > 0) {
          const { data } = await supabase.from('pagos').select('*').in('credito_id', indCreditIds);
          indPagos = data || [];
        }

        // 5. Pagos grupales (solo los de este integrante)
        const memberIds = (grpMembers || []).map(m => m.integrante_id);
        let grpPagos = [];
        if (memberIds.length > 0) {
          const { data } = await supabase.from('pagos').select('*').in('integrante_id', memberIds);
          grpPagos = data || [];
        }

        setPagos([...indPagos, ...grpPagos].sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago)));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchProfile();
  }, [clientId]);

  if (!clientId) return null;

  // Calcular métricas
  const totalAbonos = pagos.filter(p => p.tipo === 'ABONO').length;
  const totalMoras = pagos.filter(p => p.tipo === 'MORA').length;
  const score = (totalAbonos + totalMoras) === 0 ? 100 : Math.round((totalAbonos / (totalAbonos + totalMoras)) * 100);
  
  const totalOtorgado = credits.reduce((acc, c) => acc + Number(c.monto_otorgado || 0), 0);
  const creditosActivos = credits.filter(c => c.estado === 'ACTIVO' || c.estado === 'MORA').length;
  const creditosLiquidados = credits.filter(c => c.estado === 'LIQUIDADO').length;

  const titleHeader = (
    <h2 className="flex items-center gap-2 m-0 text-xl font-bold">
      <User className="text-primary" /> Perfil e Historial
    </h2>
  );

  return (
    <Modal title={titleHeader} onClose={onClose} maxWidth="800px">
      {loading ? (
        <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>
      ) : (
        <div className="flex flex-col gap-6" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '5px' }}>
          
          {/* Header del Cliente */}
          <div className="glass-card flex flex-wrap gap-6 items-center justify-between" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '12px' }}>
            <div>
              <h3 className="text-2xl font-bold m-0 text-primary">{client?.nombre_completo}</h3>
              <p className="text-muted m-0 mt-1">{client?.telefono} • {client?.direccion}</p>
            </div>
            
            <div className="text-center" style={{ minWidth: '120px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg viewBox="0 0 36 36" style={{ width: '80px', height: '80px' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="3"
                    strokeDasharray={`${score}, 100`}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '18px' }}>
                  {score}%
                </div>
              </div>
              <div className="text-xs text-muted font-bold mt-1">Confiabilidad</div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="metric-card p-4">
              <div className="text-xs text-muted">Total Prestado (Histórico)</div>
              <div className="text-lg font-bold">${totalOtorgado.toLocaleString()}</div>
            </div>
            <div className="metric-card p-4">
              <div className="text-xs text-muted">Créditos Históricos</div>
              <div className="text-lg font-bold">{credits.length} ({creditosActivos} Activos)</div>
            </div>
            <div className="metric-card p-4">
              <div className="text-xs text-muted">Abonos Realizados</div>
              <div className="text-lg font-bold text-success flex items-center gap-1"><CheckCircle size={14}/> {totalAbonos}</div>
            </div>
            <div className="metric-card p-4">
              <div className="text-xs text-muted">Faltas / Moras</div>
              <div className="text-lg font-bold text-danger flex items-center gap-1"><AlertTriangle size={14}/> {totalMoras}</div>
            </div>
          </div>

          {/* Lista de Créditos */}
          <div>
            <h4 className="font-bold border-b border-subtle pb-2 mb-4">Historial de Créditos</h4>
            {credits.length === 0 ? (
              <p className="text-muted italic">Este cliente no ha tenido créditos.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {credits.map(c => (
                  <div key={c.credito_id} className="p-3 rounded-lg border border-subtle" style={{ background: 'var(--bg-card)' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">
                          Folio: {c.credito_id.split('-')[0].toUpperCase()} 
                          <span className="text-xs text-muted ml-2 font-normal">({c.tipo})</span>
                        </div>
                        <div className="text-sm text-muted">
                          Prestado: ${parseFloat(c.monto_otorgado).toLocaleString()} • Pagar: ${parseFloat(c.total_a_pagar).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`badge badge-${c.estado === 'ACTIVO' ? 'active' : c.estado === 'MORA' ? 'warning' : 'success'}`}>
                          {c.estado}
                        </span>
                        <div className="text-xs text-muted mt-1">{c.fecha_inicio ? format(new Date(c.fecha_inicio), 'dd/MM/yyyy') : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Historial Reciente de Pagos */}
          <div>
            <h4 className="font-bold border-b border-subtle pb-2 mb-4">Últimos Pagos Realizados</h4>
            {pagos.length === 0 ? (
              <p className="text-muted italic">No hay pagos registrados.</p>
            ) : (
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table className="text-sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th>Folio Crédito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.slice(0, 15).map(p => (
                      <tr key={p.id}>
                        <td>{format(new Date(p.fecha_pago), 'dd/MM/yyyy HH:mm')}</td>
                        <td>
                          <span className={`badge ${p.tipo === 'MORA' ? 'badge-warning' : 'badge-active'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                            {p.tipo}
                          </span>
                        </td>
                        <td className="font-bold text-success">${parseFloat(p.monto).toLocaleString()}</td>
                        <td className="text-muted font-mono">{p.credito_id.split('-')[0].toUpperCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pagos.length > 15 && <div className="text-center text-xs text-muted mt-2">Mostrando los 15 pagos más recientes (de {pagos.length} totales)</div>}
              </div>
            )}
          </div>

        </div>
      )}
    </Modal>
  );
}
