import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, RefreshCw, Search, Plus, UserPlus } from 'lucide-react';

export default function DirectorioClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    direccion: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchClientes = async () => {
    setLoading(true);
    
    const { data: clientesData, error } = await supabase
      .from('clientes')
      .select(`
        id, 
        nombre_completo, 
        telefono, 
        direccion,
        creditos!creditos_cliente_id_fkey(estado, tipo, monto_otorgado),
        grupo_integrantes(
          grupos(
            creditos(estado, tipo, monto_otorgado)
          )
        )
      `)
      .order('nombre_completo', { ascending: true });

    if (!error && clientesData) {
      const processed = clientesData.map(c => {
        // Individual active
        const activeInd = c.creditos?.find(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
        
        // Group active
        const activeGrp = c.grupo_integrantes
          ?.flatMap(gi => gi.grupos?.creditos || [])
          ?.find(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');

        let estado = 'LIBRE';
        let tipoCreditoActivo = 'N/A';
        
        if (activeInd) {
          estado = activeInd.estado;
          tipoCreditoActivo = 'INDIVIDUAL';
        } else if (activeGrp) {
          estado = activeGrp.estado;
          tipoCreditoActivo = 'GRUPAL';
        }

        return {
          id: c.id,
          nombre: c.nombre_completo,
          telefono: c.telefono || 'Sin registro',
          direccion: c.direccion || 'Sin registro',
          estado,
          tipoCreditoActivo
        };
      });
      setClientes(processed);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleCreateCliente = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const { error } = await supabase
        .from('clientes')
        .insert([{
          nombre_completo: formData.nombre_completo.trim().toUpperCase(),
          telefono: formData.telefono,
          direccion: formData.direccion
        }]);

      if (error) {
        if (error.code === '23505') throw new Error('Ya existe un cliente con ese nombre exacto.');
        throw error;
      }
      
      setShowForm(false);
      setFormData({ nombre_completo: '', telefono: '', direccion: '' });
      fetchClientes();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CreditCard size={24} className="text-primary" />
          <h1 style={{ margin: 0 }}>Acreditados / Clientes</h1>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={fetchClientes} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} style={{ border: 'none' }} />
            Actualizar
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <UserPlus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="solid-card">
        <div className="flex items-center gap-2 mb-4" style={{ maxWidth: '400px' }}>
          <div className="form-group w-full" style={{ marginBottom: 0, position: 'relative' }}>
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar cliente por nombre..." 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
          <table>
            <thead>
              <tr>
                <th>Nombre del Cliente</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Crédito Activo</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted" style={{ padding: '3rem' }}>
                    {searchTerm ? 'No se encontraron clientes.' : 'No hay clientes registrados.'}
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.nombre}</td>
                    <td>{c.telefono}</td>
                    <td>{c.direccion}</td>
                    <td>
                      <span className={`badge ${c.estado === 'LIBRE' ? 'badge-paid' : (c.estado === 'ACTIVO' ? 'badge-active' : 'badge-danger')}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>{c.tipoCreditoActivo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Registrar Nuevo Cliente</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateCliente}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Teléfono</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Dirección</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Guardando...' : 'Guardar Cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
