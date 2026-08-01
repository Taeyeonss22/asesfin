import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { exportToCSV } from '../lib/exportUtils';
import PaymentDetailModal from '../components/PaymentDetailModal';
import { FileText, CheckCircle, Search, Calendar, ChevronRight, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function CortesCaja({ session }) {
  const [cortes, setCortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDIENTE'); // PENDIENTE | CONFIRMADO
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedCorte, setSelectedCorte] = useState(null);
  const [cortePagos, setCortePagos] = useState([]);
  const [notas, setNotas] = useState('');
  const [selectedPagoDetail, setSelectedPagoDetail] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchCortes();
  }, [activeTab]);

  const fetchCortes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cortes_diarios')
        .select(`
          *,
          cobrador:perfiles!cortes_diarios_cobrador_id_fkey(nombre_completo),
          confirmador:perfiles!cortes_diarios_confirmado_por_fkey(nombre_completo)
        `)
        .eq('estado', activeTab)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setCortes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCorte = async (corte) => {
    setSelectedCorte(corte);
    setNotas(corte.notas || '');
    setCortePagos([]); // reset
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          creditos (nombre_cliente, credito_id, tipo),
          pagos_metadata (latitud, longitud, evidencia_url)
        `)
        .eq('corte_id', corte.id)
        .order('fecha_pago', { ascending: true });
        
      if (error) throw error;
      setCortePagos(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmCorte = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('cortes_diarios')
        .update({
          estado: 'CONFIRMADO',
          notas: notas,
          confirmado_por: session.user.id
        })
        .eq('id', selectedCorte.id);

      if (error) throw error;
      
      setSelectedCorte(null);
      fetchCortes(); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Error confirmando el corte.');
    } finally {
      setConfirming(false);
    }
  };

  const filteredCortes = cortes.filter(c => {
    const cobradorName = c.cobrador?.nombre_completo?.toLowerCase() || '';
    const dateStr = format(new Date(c.fecha), 'dd/MM/yyyy');
    return cobradorName.includes(searchTerm.toLowerCase()) || dateStr.includes(searchTerm);
  });

  return (
    <div className="content-area">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Cortes de Caja</h2>
          <p className="text-muted">Revisa y confirma los cortes diarios de los cobradores.</p>
        </div>
      </div>

      <div className="glass-card mb-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-subtle mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <button 
            className={`px-4 py-2 font-semibold ${activeTab === 'PENDIENTE' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: activeTab === 'PENDIENTE' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'PENDIENTE' ? 'var(--primary)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('PENDIENTE')}
          >
            Pendientes
          </button>
          <button 
            className={`px-4 py-2 font-semibold ${activeTab === 'CONFIRMADO' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: activeTab === 'CONFIRMADO' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'CONFIRMADO' ? 'var(--primary)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('CONFIRMADO')}
          >
            Confirmados
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.5rem 1rem', flex: 1 }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por cobrador o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="loading-spinner"></div>
          </div>
        ) : filteredCortes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted">
            <CheckCircle size={48} className="mb-4 text-success opacity-50" />
            <p>No hay cortes {activeTab.toLowerCase()}s.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredCortes.map(c => (
              <div 
                key={c.id} 
                className="metric-card cursor-pointer" 
                style={{ cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: 'var(--primary)' } }}
                onClick={() => handleOpenCorte(c)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="metric-icon-box icon-box-info">
                      <FileText size={16} />
                    </div>
                    <span className="font-bold text-sm">{c.cobrador?.nombre_completo || 'Desconocido'}</span>
                  </div>
                  {c.estado === 'PENDIENTE' ? (
                    <span className="badge badge-warning text-xs">Pendiente</span>
                  ) : (
                    <span className="badge badge-active text-xs">Confirmado</span>
                  )}
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-muted flex items-center gap-1 mb-2">
                    <Calendar size={12} /> {format(new Date(c.fecha), 'dd/MM/yyyy HH:mm')}
                  </div>
                  <div className="text-xl font-bold text-success">
                    ${parseFloat(c.gran_total).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Abono: ${parseFloat(c.total_abonos).toLocaleString()} • Ahorro: ${parseFloat(c.total_ahorros).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalles del Corte */}
      {selectedCorte && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '800px' }}>
            <div className="flex justify-between items-center mb-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Detalle de Corte de Caja</h3>
                <div className="text-sm text-muted mt-1 flex items-center gap-2">
                  <span>Cobrador: {selectedCorte.cobrador?.nombre_completo}</span>
                  <span>•</span>
                  <span>Fecha: {format(new Date(selectedCorte.fecha), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => setSelectedCorte(null)} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Pagos List */}
              <div>
                <h4 className="text-sm font-bold mb-3 uppercase text-muted">Transacciones ({cortePagos.length})</h4>
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                      <tr>
                        <th>Hora</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th style={{ textAlign: 'right' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cortePagos.length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-muted">Cargando...</td></tr>
                      ) : (
                        cortePagos.map(p => (
                          <tr 
                            key={p.id} 
                            className="cursor-pointer hover:bg-slate-800 transition-colors"
                            onClick={() => setSelectedPagoDetail({
                              ...p,
                              latitud: p.pagos_metadata?.[0]?.latitud || p.pagos_metadata?.latitud,
                              longitud: p.pagos_metadata?.[0]?.longitud || p.pagos_metadata?.longitud,
                              evidencia_url: p.pagos_metadata?.[0]?.evidencia_url || p.pagos_metadata?.evidencia_url,
                              tipo_pago: p.tipo,
                              cliente_nombre: p.creditos?.nombre_cliente || p.credito_id.substring(0,8),
                              cobrador_nombre: selectedCorte.perfiles?.nombre_completo // already filtered by cobrador
                            })}
                          >
                            <td className="text-xs text-muted">{new Date(p.fecha_pago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="text-sm font-semibold">{p.creditos?.nombre_cliente || p.credito_id.substring(0,8)}</td>
                            <td>
                              <span className={`badge ${p.tipo==='ABONO'?'badge-active':p.tipo==='AHORRO'?'badge-paid':'badge-mora'}`}>
                                {p.tipo}
                              </span>
                            </td>
                            <td className="text-right font-bold text-success">${parseFloat(p.monto).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Totals & Confirmation */}
              <div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <h4 className="text-sm font-bold mb-3 uppercase text-muted">Resumen</h4>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-muted">Total Abonos:</span>
                    <span>${parseFloat(selectedCorte.total_abonos).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-muted">Total Ahorros:</span>
                    <span>${parseFloat(selectedCorte.total_ahorros).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-muted">Total Mora:</span>
                    <span className="text-danger">${parseFloat(selectedCorte.total_mora).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t text-lg font-bold" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span>Efectivo Total:</span>
                    <span className="text-success">${parseFloat(selectedCorte.gran_total).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 form-group">
                  <label>Notas / Ajustes (Opcional)</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Ej. Faltaron $50 pesos..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    disabled={selectedCorte.estado === 'CONFIRMADO'}
                  />
                </div>

                {selectedCorte.estado === 'PENDIENTE' ? (
                  <button 
                    className="btn btn-primary w-full" 
                    style={{ marginTop: '1rem' }}
                    onClick={handleConfirmCorte}
                    disabled={confirming}
                  >
                    {confirming ? 'Confirmando...' : 'Confirmar Recepción de Efectivo'}
                  </button>
                ) : (
                  <div className="mt-4 p-3 rounded text-center text-sm" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                    Corte confirmado por {selectedCorte.confirmador?.nombre_completo || 'Oficina'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPagoDetail && (
        <PaymentDetailModal pago={selectedPagoDetail} onClose={() => setSelectedPagoDetail(null)} />
      )}
    </div>
  );
}
