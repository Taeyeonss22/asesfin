import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import { FolderKey, RefreshCw, Eye, Search, Plus, Calculator } from 'lucide-react';
import PaymentForm from '../components/PaymentForm';
import CalendarioPagos from '../components/CalendarioPagos';

export default function GestionGrupos({ session }) {
  const [grupos, setGrupos] = useState([]);
  const [clientesLibres, setClientesLibres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);

  const [newGroup, setNewGroup] = useState({
    nombre: '',
    integrantes: []
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchGrupos = async () => {
    setLoading(true);
    
    // 1. Fetch grupos con sus integrantes (para saber count) y creditos
    const { data: gruposData, error: gruposError } = await supabase
      .from('grupos')
      .select(`
        id,
        nombre,
        created_at,
        grupo_integrantes (
          clientes (
            id,
            nombre_completo
          )
        ),
        creditos (
          id,
          estado,
          monto_otorgado,
          total_a_pagar,
          pagos (monto, tipo)
        )
      `)
      .order('created_at', { ascending: false });

    if (!gruposError && gruposData) {
      // Process metrics for each group
      const procesados = gruposData.map(g => {
        // Find active credit
        const activeCredit = g.creditos?.find(c => c.estado === 'ACTIVO' || c.estado === 'MORA');
        
        let montoTotal = 0;
        let adeudoTotal = 0;
        let ahorroTotal = 0;

        if (activeCredit) {
          montoTotal = activeCredit.monto_otorgado;
          // Calculate debt: total_a_pagar - sum(abonos)
          const abonos = activeCredit.pagos?.filter(p => p.tipo === 'ABONO').reduce((sum, p) => sum + Number(p.monto), 0) || 0;
          adeudoTotal = activeCredit.total_a_pagar - abonos;
        }

        // Calculate all-time savings (ahorro across all credits)
        ahorroTotal = g.creditos?.flatMap(c => c.pagos || [])
          ?.filter(p => p.tipo === 'AHORRO')
          ?.reduce((sum, p) => sum + Number(p.monto), 0) || 0;

        return {
          ...g,
          activeCredit,
          integrantes_count: g.grupo_integrantes?.length || 0,
          montoTotal,
          adeudoTotal,
          ahorroTotal,
          estado: activeCredit ? activeCredit.estado : 'LIBRE'
        };
      });
      setGrupos(procesados);
    }
    setLoading(false);
  };

  const fetchClientesLibres = async () => {
    // Para crear un grupo, necesitamos clientes que NO tengan crédito activo
    const { data: clientesData } = await supabase
      .from('clientes')
      .select(`
        id, 
        nombre_completo,
        creditos!creditos_cliente_id_fkey(estado),
        grupo_integrantes(
          grupos(
            creditos(estado)
          )
        )
      `)
      .order('nombre_completo', { ascending: true });

    if (clientesData) {
      const libres = clientesData.filter(c => {
        const activeInd = c.creditos?.some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
        const activeGrp = c.grupo_integrantes?.flatMap(gi => gi.grupos?.creditos || [])
          ?.some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
        return !activeInd && !activeGrp;
      });
      setClientesLibres(libres);
    }
  };

  useEffect(() => {
    fetchGrupos();
    fetchClientesLibres();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.nombre || newGroup.integrantes.length === 0) return;
    setCreateLoading(true);

    try {
      // 1. Insert Grupo
      const { data: gData, error: gError } = await supabase
        .from('grupos')
        .insert([{ nombre: newGroup.nombre.trim().toUpperCase() }])
        .select()
        .single();
      
      if (gError) throw gError;

      // 2. Insert Integrantes
      const rels = newGroup.integrantes.map(cliente_id => ({
        grupo_id: gData.id,
        cliente_id
      }));

      const { error: relError } = await supabase
        .from('grupo_integrantes')
        .insert(rels);

      if (relError) throw relError;

      setShowCreateForm(false);
      setNewGroup({ nombre: '', integrantes: [] });
      fetchGrupos();
      fetchClientesLibres();
    } catch (error) {
      alert("Error al crear grupo: " + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleIntegrante = (clienteId) => {
    setNewGroup(prev => {
      const ints = prev.integrantes.includes(clienteId)
        ? prev.integrantes.filter(id => id !== clienteId)
        : [...prev.integrantes, clienteId];
      return { ...prev, integrantes: ints };
    });
  };

  const filteredGrupos = grupos.filter(g => 
    g.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FolderKey size={24} className="text-primary" />
          <h1 style={{ margin: 0 }}>Gestión de Grupos</h1>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={fetchGrupos} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} style={{ border: 'none' }} />
            Actualizar
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} /> Crear Grupo Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Izquierdo: Directorio de Tarjetas */}
        <div className="solid-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-muted uppercase text-sm tracking-wider" style={{ margin: 0 }}>Directorio de Grupos</h3>
          </div>
          
          <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar grupo..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {filteredGrupos.length === 0 ? (
              <div className="text-center text-muted p-4">No se encontraron grupos.</div>
            ) : (
              filteredGrupos.map((g) => (
                <div 
                  key={g.id} 
                  className={`glass-card cursor-pointer transition-all ${selectedGroup?.id === g.id ? 'border-primary' : ''}`}
                  style={{ padding: '1rem', border: selectedGroup?.id === g.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)' }}
                  onClick={() => setSelectedGroup(g)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{g.nombre}</h4>
                    <span className={`badge ${g.estado === 'LIBRE' ? 'badge-default' : (g.estado === 'ACTIVO' ? 'badge-active' : 'badge-danger')}`}>
                      {g.estado}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <div className="text-muted text-xs uppercase tracking-wider">Integrantes</div>
                      <div className="font-bold">{g.integrantes_count}</div>
                    </div>
                    <div>
                      <div className="text-muted text-xs uppercase tracking-wider">Monto (Activo)</div>
                      <div className="font-bold">${Number(g.montoTotal).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted text-xs uppercase tracking-wider">Adeudo (Activo)</div>
                      <div className="font-bold text-danger">${Number(g.adeudoTotal).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted text-xs uppercase tracking-wider">Ahorro Histórico</div>
                      <div className="font-bold text-success">${Number(g.ahorroTotal).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lado Derecho: Detalles del Grupo */}
        <div>
          {selectedGroup ? (
            <div className="solid-card animate-fade-in" style={{ position: 'sticky', top: '1.5rem' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="mb-1" style={{ fontSize: '1.5rem' }}>{selectedGroup.nombre}</h3>
                  <span className={`badge ${selectedGroup.estado === 'LIBRE' ? 'badge-default' : (selectedGroup.estado === 'ACTIVO' ? 'badge-active' : 'badge-danger')}`}>
                    {selectedGroup.estado}
                  </span>
                </div>
                {selectedGroup.activeCredit && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // We need to pass the format expected by PaymentForm
                      setShowPaymentModal({
                        credito_id: selectedGroup.activeCredit.id,
                        tipo: 'GRUPAL'
                      });
                    }}
                  >
                    <Calculator size={18} /> Realizar Pago Grupal
                  </button>
                )}
              </div>
              
              <h4 className="text-muted mb-3 uppercase tracking-wider text-xs border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                Integrantes del Grupo
              </h4>
              
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.grupo_integrantes?.map(int => (
                      <tr key={int.clientes?.id}>
                        <td className="font-medium">{int.clientes?.nombre_completo}</td>
                      </tr>
                    ))}
                    {(!selectedGroup.grupo_integrantes || selectedGroup.grupo_integrantes.length === 0) && (
                      <tr><td className="text-muted">Sin integrantes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedGroup.activeCredit && (
                <CalendarioPagos creditoId={selectedGroup.activeCredit.id} />
              )}
            </div>
          ) : (
            <div className="solid-card flex items-center justify-center text-muted" style={{ minHeight: '400px' }}>
              Selecciona un grupo para ver sus detalles y capturar pagos.
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <Modal title="Crear Grupo Nuevo" onClose={() => setShowCreateForm(false)} maxWidth="600px">
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Nombre del Grupo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Grupo Solidario Amanecer"
                  value={newGroup.nombre}
                  onChange={(e) => setNewGroup({...newGroup, nombre: e.target.value})}
                  required
                />
              </div>

              <label className="mt-2 mb-2 block font-medium">
                Selecciona los Integrantes ({newGroup.integrantes.length} seleccionados)
              </label>
              
              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
                {clientesLibres.length === 0 ? (
                  <div className="text-muted text-center py-4">No hay clientes libres sin crédito activo.</div>
                ) : (
                  clientesLibres.map(c => (
                    <div 
                      key={c.id} 
                      className="flex items-center gap-3 p-2 border-b cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)' }}
                      onClick={() => toggleIntegrante(c.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={newGroup.integrantes.includes(c.id)}
                        onChange={() => {}} 
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <div className="font-medium text-main">{c.nombre_completo}</div>
                        {c.telefono && <div className="text-xs text-muted">{c.telefono}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading || newGroup.integrantes.length === 0}>
                  {createLoading ? 'Guardando...' : 'Guardar Grupo'}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {showPaymentModal && (
        <PaymentForm 
          credit={showPaymentModal} 
          session={session} 
          onClose={() => {
            setShowPaymentModal(null);
            fetchGrupos(); // Actualizar métricas
          }} 
        />
      )}
    </div>
  );
}
