import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { X, Edit2, Trash2, Save, AlertTriangle } from 'lucide-react';

export default function PaymentHistoryModal({ creditoId, onClose, perfil }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const isSuperadmin = perfil?.rol === 'SUPERADMIN';

  const fetchPagos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('credito_id', creditoId)
      .order('fecha_pago', { ascending: false });
      
    if (!error && data) {
      setPagos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPagos();
  }, [creditoId]);

  const handleDelete = async (pago) => {
    if (!window.confirm(`¿Estás seguro de ELIMINAR el pago por $${pago.monto}? Esta acción no se puede deshacer.`)) return;
    
    try {
      if (pago.corte_id) {
        // Sync with corte de caja
        const { data: corte } = await supabase.from('cortes_diarios').select('*').eq('id', pago.corte_id).single();
        if (corte) {
          const updateData = { gran_total: Number(corte.gran_total) - Number(pago.monto) };
          if (pago.tipo === 'ABONO') updateData.total_abonos = Number(corte.total_abonos) - Number(pago.monto);
          if (pago.tipo === 'AHORRO') updateData.total_ahorros = Number(corte.total_ahorros) - Number(pago.monto);
          if (pago.tipo === 'MORA') updateData.total_mora = Number(corte.total_mora) - Number(pago.monto);
          
          await supabase.from('cortes_diarios').update(updateData).eq('id', pago.corte_id);
        }
      }
      
      const { error } = await supabase.from('pagos').delete().eq('id', pago.id);
      if (error) throw error;
      
      alert('Pago eliminado correctamente.');
      fetchPagos();
    } catch (err) {
      alert('Error eliminando pago: ' + err.message);
    }
  };

  const handleEdit = (pago) => {
    setEditingId(pago.id);
    setEditForm({
      fecha_pago: pago.fecha_pago ? pago.fecha_pago.split('T')[0] : '',
      monto: pago.monto,
      numero_pago: pago.numero_pago || '',
      tipo: pago.tipo
    });
  };

  const handleSaveEdit = async (pago) => {
    if (!window.confirm('¿Guardar los cambios contables en este pago?')) return;
    
    try {
      const diffMonto = Number(editForm.monto) - Number(pago.monto);
      
      if (pago.corte_id && (diffMonto !== 0 || editForm.tipo !== pago.tipo)) {
        // Simple approach: subtract old from corte, add new to corte.
        const { data: corte } = await supabase.from('cortes_diarios').select('*').eq('id', pago.corte_id).single();
        if (corte) {
          let uData = { gran_total: Number(corte.gran_total) + diffMonto };
          
          // Revert old
          if (pago.tipo === 'ABONO') uData.total_abonos = Number(corte.total_abonos) - Number(pago.monto);
          if (pago.tipo === 'AHORRO') uData.total_ahorros = Number(corte.total_ahorros) - Number(pago.monto);
          if (pago.tipo === 'MORA') uData.total_mora = Number(corte.total_mora) - Number(pago.monto);
          
          // Add new
          if (editForm.tipo === 'ABONO') uData.total_abonos = (uData.total_abonos || Number(corte.total_abonos)) + Number(editForm.monto);
          if (editForm.tipo === 'AHORRO') uData.total_ahorros = (uData.total_ahorros || Number(corte.total_ahorros)) + Number(editForm.monto);
          if (editForm.tipo === 'MORA') uData.total_mora = (uData.total_mora || Number(corte.total_mora)) + Number(editForm.monto);
          
          await supabase.from('cortes_diarios').update(uData).eq('id', pago.corte_id);
        }
      }

      let dt = null;
      if (editForm.fecha_pago) {
        // Mantener la hora original si la hay, si no 12:00
        const oldTime = pago.fecha_pago ? pago.fecha_pago.split('T')[1] : '12:00:00Z';
        dt = `${editForm.fecha_pago}T${oldTime}`;
      }
      
      const { error } = await supabase.from('pagos').update({
        monto: Number(editForm.monto),
        numero_pago: editForm.numero_pago ? Number(editForm.numero_pago) : null,
        tipo: editForm.tipo,
        fecha_pago: dt || pago.fecha_pago
      }).eq('id', pago.id);
      
      if (error) throw error;
      
      alert('Pago actualizado.');
      setEditingId(null);
      fetchPagos();
    } catch (err) {
      alert('Error actualizando pago: ' + err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-glass-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="solid-card animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ margin: 0 }}>Historial de Pagos y Auditoría</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={24} /></button>
        </div>
        
        {isSuperadmin && (
          <div className="mb-4 p-3 rounded" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <div className="flex items-center gap-2 font-bold mb-1"><AlertTriangle size={16}/> MODO SUPERADMINISTRADOR</div>
            <p className="text-sm m-0">Estás autorizado para editar o eliminar pagos. Los cambios afectarán automáticamente los saldos de los cortes de caja correspondientes.</p>
          </div>
        )}

        {loading ? (
          <div className="text-center p-8 text-muted">Cargando pagos...</div>
        ) : pagos.length === 0 ? (
          <div className="text-center p-8 text-muted">No hay pagos registrados.</div>
        ) : (
          <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Semana</th>
                  <th>Monto</th>
                  <th>Corte Asignado</th>
                  {isSuperadmin && <th className="text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {pagos.map(p => (
                  <tr key={p.id}>
                    {editingId === p.id ? (
                      <>
                        <td>
                          <input type="date" className="form-control" value={editForm.fecha_pago} onChange={e => setEditForm({...editForm, fecha_pago: e.target.value})} style={{ padding: '0.2rem' }} />
                        </td>
                        <td>
                          <select className="form-control" value={editForm.tipo} onChange={e => setEditForm({...editForm, tipo: e.target.value})} style={{ padding: '0.2rem' }}>
                            <option value="ABONO">ABONO</option>
                            <option value="AHORRO">AHORRO</option>
                            <option value="MORA">MORA</option>
                          </select>
                        </td>
                        <td>
                          <input type="number" className="form-control" value={editForm.numero_pago} onChange={e => setEditForm({...editForm, numero_pago: e.target.value})} style={{ padding: '0.2rem', width: '60px' }} />
                        </td>
                        <td>
                          <input type="number" className="form-control" value={editForm.monto} onChange={e => setEditForm({...editForm, monto: e.target.value})} style={{ padding: '0.2rem', width: '90px' }} />
                        </td>
                        <td className="text-muted text-xs">
                          {p.corte_id ? p.corte_id.split('-')[0].toUpperCase() : 'Sin corte'}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => handleSaveEdit(p)}>
                              <Save size={14} /> Guardar
                            </button>
                            <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setEditingId(null)}>
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {p.fecha_pago ? format(new Date(p.fecha_pago), 'dd/MM/yyyy HH:mm') : '-'}
                        </td>
                        <td>
                          <span className={`badge ${p.tipo === 'MORA' ? 'badge-warning' : p.tipo === 'AHORRO' ? 'badge-info' : 'badge-success'}`}>
                            {p.tipo}
                          </span>
                        </td>
                        <td>{p.numero_pago || '-'}</td>
                        <td className="font-bold">${Number(p.monto).toLocaleString()}</td>
                        <td className="text-muted text-xs font-mono">
                          {p.corte_id ? p.corte_id.split('-')[0].toUpperCase() : 'Pendiente'}
                        </td>
                        {isSuperadmin && (
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--primary)' }} onClick={() => handleEdit(p)} title="Editar Pago">
                                <Edit2 size={16} />
                              </button>
                              <button className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDelete(p)} title="Eliminar Pago">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
