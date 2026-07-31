import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Percent, Save } from 'lucide-react';

export default function TasasYParametros() {
  const [params, setParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchParams = async () => {
    setLoading(true);
    const { data } = await supabase.from('parametros_sistema').select('*').limit(1).single();
    if (data) setParams(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    if (params?.id) {
      const { error } = await supabase.from('parametros_sistema').update(params).eq('id', params.id);
      if (error) {
        setMessage('Error al guardar: ' + error.message);
      } else {
        setMessage('Parámetros guardados correctamente.');
      }
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="p-4 text-muted">Cargando parámetros...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <div className="flex items-center gap-2 mb-6">
        <Percent size={24} className="text-primary" />
        <h1 style={{ margin: 0 }}>Tasas y Parámetros</h1>
      </div>

      <div className="solid-card">
        <h3 className="mb-4">Configuración del Producto de Crédito</h3>
        <p className="text-muted text-sm mb-6">
          Estos valores se usarán por defecto al calcular nuevos créditos. Modificarlos no afectará a los créditos ya otorgados.
        </p>

        <div className="form-group">
          <label>Tasa de Interés Global (%)</label>
          <input 
            type="number" 
            name="interes_porcentaje" 
            className="form-control" 
            value={params?.interes_porcentaje || ''} 
            onChange={handleChange}
            step="0.1" 
          />
          <span className="text-xs text-muted mt-1 inline-block">Ejemplo: 20 para 20%</span>
        </div>
        
        <div className="form-group">
          <label>Cuota Base (por cada $1,000 otorgados)</label>
          <input 
            type="number" 
            name="cuota_por_mil" 
            className="form-control" 
            value={params?.cuota_por_mil || ''} 
            onChange={handleChange}
            step="0.01" 
          />
          <span className="text-xs text-muted mt-1 inline-block">Ejemplo: 75 significa que por $1,000 la cuota del periodo es $75</span>
        </div>
        
        <div className="form-group mb-6">
          <label>Número de Periodos (Plazo por defecto)</label>
          <input 
            type="number" 
            name="numero_periodos_default" 
            className="form-control" 
            value={params?.numero_periodos_default || ''} 
            onChange={handleChange} 
          />
          <span className="text-xs text-muted mt-1 inline-block">Ejemplo: 16 (semanas)</span>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : <><Save size={16} /> Guardar Parámetros</>}
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
