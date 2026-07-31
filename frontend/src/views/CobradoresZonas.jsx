import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Map, Shield, Users } from 'lucide-react';

export default function CobradoresZonas({ session }) {
  const [users, setUsers] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-4 text-muted">Cargando personal...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Map size={24} className="text-primary" />
        <h1 style={{ margin: 0 }}>Cobradores y Zonas</h1>
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
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={16} className="text-muted" />
                      </div>
                      <div>
                        <strong>{u.nombre_completo || 'Usuario Nuevo'}</strong>
                        <div className="text-muted text-xs font-mono mt-1" style={{ opacity: 0.7 }}>ID: {u.id.substring(0,8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select 
                      className="form-control" 
                      value={u.rol} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '0.4rem', width: 'auto', background: 'rgba(0,0,0,0.2)' }}
                    >
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
    </div>
  );
}
