import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Map, Shield, Users, UserPlus, X, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CobradoresZonas({ session }) {
  const [users, setUsers] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol: 'COBRADOR',
    zonas: []
  });

  // Zone Modal State
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [isSubmittingZone, setIsSubmittingZone] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch profiles and their zones
    const { data: perfilesData } = await supabase.from('perfiles').select('*, cobradores_zonas(zona_id, zonas(nombre))');
    const { data: zonasData } = await supabase.from('zonas').select('*');
    
    setUsers(perfilesData || []);
    setZonas(zonasData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await supabase.from('perfiles').update({ rol: newRole }).eq('id', userId);
    fetchData();
  };

  const handleZoneToggle = async (userId, zonaId, hasZone) => {
    if (hasZone) {
      await supabase.from('cobradores_zonas').delete().eq('cobrador_id', userId).eq('zona_id', zonaId);
    } else {
      await supabase.from('cobradores_zonas').insert({ cobrador_id: userId, zona_id: zonaId });
    }
    fetchData();
  };

  const handleNewUserZoneToggle = (zonaId) => {
    setNewUser(prev => {
      const exists = prev.zonas.includes(zonaId);
      if (exists) {
        return { ...prev, zonas: prev.zonas.filter(id => id !== zonaId) };
      } else {
        return { ...prev, zonas: [...prev.zonas, zonaId] };
      }
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.nombre_completo || !newUser.email || !newUser.password) {
      toast.error('Llena los campos obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading('Creando usuario...', { id: 'create-user' });
      
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: newUser
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Usuario creado con éxito', { id: 'create-user' });
      setShowModal(false);
      setNewUser({ nombre_completo: '', email: '', password: '', rol: 'COBRADOR', zonas: [] });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al crear usuario', { id: 'create-user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      toast.error('Ingresa el nombre de la zona');
      return;
    }
    try {
      setIsSubmittingZone(true);
      const { error } = await supabase.from('zonas').insert([{ nombre: newZoneName.trim() }]);
      if (error) throw error;
      
      toast.success('Zona creada exitosamente');
      setShowZoneModal(false);
      setNewZoneName('');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Error al crear zona: ' + error.message);
    } finally {
      setIsSubmittingZone(false);
    }
  };

  if (loading) return <div className="p-4 text-muted">Cargando personal...</div>;

  return (
    <div className="animate-fade-in relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Map size={24} className="text-primary" />
          <h1 style={{ margin: 0 }}>Cobradores y Zonas</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => setShowZoneModal(true)}>
            <PlusCircle size={18} /> Nueva Zona
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} /> Nuevo Usuario
          </button>
        </div>
      </div>
      
      <div className="solid-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-warning" />
          <h3 style={{ margin: 0 }}>Control de Acceso (Administradores)</h3>
        </div>
        <p className="text-muted text-sm mb-6">
          Asigna roles de sistema y delimita las zonas operativas de cada usuario. 
          Los cobradores solo verán los créditos pertenecientes a las zonas que tengan marcadas.
        </p>

        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
          <table>
            <thead>
              <tr>
                <th>Usuario / Nombre</th>
                <th>Rol en el Sistema</th>
                <th>Zonas Operativas Asignadas</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-glass-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={16} className="text-muted" />
                      </div>
                      <div>
                        <strong>
                          {u.nombre_completo || 'Usuario Nuevo'}
                          {session?.user?.id === u.id && (
                            <span className="badge badge-primary ml-2" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>TÚ</span>
                          )}
                        </strong>
                        <div className="text-muted text-xs font-mono mt-1" style={{ opacity: 0.7 }}>ID: {u.id.substring(0,8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select 
                      className="form-control" 
                      value={u.rol} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '0.4rem', width: 'auto', background: 'var(--bg-glass)' }}
                    >
                      <option value="SUPERADMIN">Súper Administrador</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="OFICINA">Oficina / Call Center</option>
                      <option value="COBRADOR">Cobrador de Campo</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                      {zonas.map(z => {
                        const hasZone = u.cobradores_zonas?.some(cz => cz.zona_id === z.id);
                        return (
                          <label key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={hasZone} 
                              onChange={() => handleZoneToggle(u.id, z.id, hasZone)}
                              style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                            />
                            <span className={hasZone ? 'text-main font-medium' : 'text-muted'}>{z.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Usuario */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-glass-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="solid-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ margin: 0 }}>Crear Nuevo Usuario</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group mb-4">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newUser.nombre_completo}
                  onChange={(e) => setNewUser({...newUser, nombre_completo: e.target.value})}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Contraseña Temporal</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Rol</label>
                <select 
                  className="form-control"
                  value={newUser.rol}
                  onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
                >
                  <option value="SUPERADMIN">Súper Administrador</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="OFICINA">Oficina / Call Center</option>
                  <option value="COBRADOR">Cobrador de Campo</option>
                </select>
              </div>

              {newUser.rol === 'COBRADOR' && (
                <div className="form-group mb-6">
                  <label>Zonas Asignadas Inicialmente</label>
                  <div className="flex gap-4 flex-wrap mt-2 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                    {zonas.map(z => (
                      <label key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={newUser.zonas.includes(z.id)} 
                          onChange={() => handleNewUserZoneToggle(z.id)}
                          style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                        />
                        <span>{z.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 border-t border-subtle pt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Zona */}
      {showZoneModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-glass-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="solid-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ margin: 0 }}>Crear Nueva Zona</h3>
              <button className="btn btn-ghost" onClick={() => setShowZoneModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateZone}>
              <div className="form-group mb-6">
                <label>Nombre de la Zona</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Ej. Zona Norte, Rafael, etc."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-subtle pt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowZoneModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingZone}>
                  {isSubmittingZone ? 'Creando...' : 'Crear Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
