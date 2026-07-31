import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FolderKey, RefreshCw, Eye, Search } from 'lucide-react';

export default function GestionGrupos() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGrupos = async () => {
    setLoading(true);
    // Fetch group credits and their members
    const { data, error } = await supabase
      .from('creditos')
      .select(`
        id, 
        fecha_inicio,
        estado,
        nombre_cliente,
        integrantes_grupo (
          id,
          nombre_completo,
          monto_otorgado
        )
      `)
      .eq('tipo', 'GRUPAL')
      .order('fecha_inicio', { ascending: false });

    if (!error && data) {
      setGrupos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FolderKey size={24} className="text-primary" />
          <h1 style={{ margin: 0 }}>Gestión de Grupos</h1>
        </div>
        <button className="btn btn-outline" onClick={fetchGrupos} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} style={{ border: 'none' }} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="solid-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted uppercase text-sm tracking-wider" style={{ margin: 0 }}>Directorio de Grupos</h3>
          </div>
          
          <div className="form-group mb-4" style={{ position: 'relative' }}>
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

          <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre del Grupo</th>
                  <th>Integrantes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {grupos.filter(g => 
                  (g.nombre_cliente || `Grupo ${g.id.split('-')[0]}`).toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted" style={{ padding: '2rem' }}>
                      {searchTerm ? 'No se encontraron grupos.' : 'No hay grupos registrados.'}
                    </td>
                  </tr>
                ) : (
                  grupos.filter(g => 
                    (g.nombre_cliente || `Grupo ${g.id.split('-')[0]}`).toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((g) => (
                    <tr key={g.id} className={selectedGroup?.id === g.id ? 'bg-white/5' : ''}>
                      <td className="font-medium">{g.nombre_cliente || `Grupo ${g.id.split('-')[0]}`}</td>
                      <td>{g.integrantes_grupo?.length || 0}</td>
                      <td>
                        <span className={`badge ${g.estado === 'ACTIVO' ? 'badge-active' : 'badge-default'}`}>
                          {g.estado}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => setSelectedGroup(g)}
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          <Eye size={16} /> Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {selectedGroup ? (
            <div className="solid-card animate-fade-in">
              <h3 className="mb-2">{selectedGroup.nombre_cliente || `Grupo ${selectedGroup.id.split('-')[0]}`}</h3>
              <p className="text-muted text-sm mb-4">Integrantes del grupo solidario</p>
              
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Monto Asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.integrantes_grupo?.map(int => (
                      <tr key={int.id}>
                        <td>{int.nombre_completo}</td>
                        <td>${parseFloat(int.monto_otorgado).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="solid-card flex items-center justify-center text-muted" style={{ minHeight: '200px' }}>
              Selecciona un grupo para ver sus integrantes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
