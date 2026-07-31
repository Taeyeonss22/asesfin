import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, RefreshCw, Search } from 'lucide-react';

export default function DirectorioClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClientes = async () => {
    setLoading(true);
    
    // Fetch individuales
    const { data: indData } = await supabase
      .from('creditos')
      .select('id, nombre_cliente, estado, monto_otorgado')
      .eq('tipo', 'INDIVIDUAL')
      .not('nombre_cliente', 'is', null);

    // Fetch integrantes
    const { data: grpData } = await supabase
      .from('integrantes_grupo')
      .select('id, nombre_completo, monto_otorgado, creditos(estado)');

    let combined = [];
    
    if (indData) {
      combined = [...combined, ...indData.map(c => ({
        id: c.id,
        nombre: c.nombre_cliente,
        tipo: 'Individual',
        estado: c.estado,
        monto_historico: c.monto_otorgado
      }))];
    }
    
    if (grpData) {
      combined = [...combined, ...grpData.map(c => ({
        id: c.id,
        nombre: c.nombre_completo,
        tipo: 'Grupal (Integrante)',
        estado: c.creditos?.estado || 'DESCONOCIDO',
        monto_historico: c.monto_otorgado
      }))];
    }

    // Sort alphabetically
    combined.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    setClientes(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

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
        <button className="btn btn-outline" onClick={fetchClientes} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} style={{ border: 'none' }} />
          Actualizar
        </button>
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
                <th>Tipo de Crédito</th>
                <th>Estado del Crédito</th>
                <th>Monto Histórico Asignado</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted" style={{ padding: '3rem' }}>
                    {searchTerm ? 'No se encontraron clientes.' : 'No hay clientes registrados.'}
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c, idx) => (
                  <tr key={`${c.id}-${idx}`}>
                    <td className="font-medium">{c.nombre}</td>
                    <td><span className="badge badge-default">{c.tipo}</span></td>
                    <td>
                      <span className={`badge ${c.estado === 'ACTIVO' ? 'badge-active' : 'badge-paid'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>${parseFloat(c.monto_historico).toLocaleString()}</td>
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
