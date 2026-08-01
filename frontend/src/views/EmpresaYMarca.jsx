import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Save } from 'lucide-react';

export default function EmpresaYMarca() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('configuracion_empresa').select('*').limit(1).single();
    if (data) setConfig(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    if (config?.id) {
      const { error } = await supabase.from('configuracion_empresa').update(config).eq('id', config.id);
      if (error) {
        setMessage('Error al guardar: ' + error.message);
      } else {
        setMessage('Configuración guardada correctamente.');
      }
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="p-4 text-muted">Cargando configuración...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <div className="flex items-center gap-2 mb-6">
        <Building2 size={24} className="text-primary" />
        <h1 style={{ margin: 0 }}>Empresa y Marca</h1>
      </div>

      <div className="solid-card">
        <h3 className="mb-4">Datos Fiscales y Comerciales</h3>
        <p className="text-muted text-sm mb-6">
          Estos datos aparecerán en los tickets impresos, contratos y reportes generados por la plataforma.
        </p>

        <div className="form-group">
          <label>Nombre de la Empresa o Razón Social</label>
          <input 
            type="text" 
            name="nombre_empresa" 
            className="form-control" 
            value={config?.nombre_empresa || ''} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>R.U.C</label>
            <input 
              type="text" 
              name="ruc" 
              className="form-control" 
              value={config?.ruc || ''} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Propietario</label>
            <input 
              type="text" 
              name="propietario" 
              className="form-control" 
              value={config?.propietario || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              name="email" 
              className="form-control" 
              value={config?.email || ''} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono</label>
            <input 
              type="text" 
              name="telefono" 
              className="form-control" 
              value={config?.telefono || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Ciudad</label>
            <input 
              type="text" 
              name="ciudad" 
              className="form-control" 
              value={config?.ciudad || ''} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Sitio Web</label>
            <input 
              type="text" 
              name="sitio_web" 
              className="form-control" 
              value={config?.sitio_web || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="form-group mb-6">
          <label>Dirección Oficial</label>
          <input 
            type="text" 
            name="direccion" 
            className="form-control" 
            value={config?.direccion || ''} 
            onChange={handleChange} 
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
          </button>
          {message && (
            <span className={message.includes('Error') ? 'text-danger' : 'text-success'}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
