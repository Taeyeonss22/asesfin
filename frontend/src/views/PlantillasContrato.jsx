import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Save } from 'lucide-react';

export default function PlantillasContrato() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPlantillas = async () => {
    setLoading(true);
    const { data } = await supabase.from('plantillas_contratos').select('*');
    if (data) setPlantillas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlantillas();
  }, []);

  const handleChange = (id, newContent) => {
    setPlantillas(plantillas.map(p => p.id === id ? { ...p, contenido: newContent } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    let errorOcurred = false;
    for (const p of plantillas) {
      const { error } = await supabase.from('plantillas_contratos').update({ contenido: p.contenido }).eq('id', p.id);
      if (error) {
        errorOcurred = true;
        setMessage('Error al guardar: ' + error.message);
        break;
      }
    }

    if (!errorOcurred) {
      setMessage('Plantillas guardadas correctamente.');
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="p-4 text-muted">Cargando plantillas...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="flex items-center gap-2 mb-6">
        <FileText size={24} className="text-primary" />
        <h1 style={{ margin: 0 }}>Plantillas de Contrato</h1>
      </div>

      <div className="solid-card">
        <h3 className="mb-2">Diseño de Contratos (HTML)</h3>
        <p className="text-muted text-sm mb-6">
          Utiliza HTML estándar para diseñar el contrato que se imprimirá al otorgar un crédito. 
          Las variables encerradas en {'{{doble_llave}}'} serán reemplazadas por los datos reales del crédito.
        </p>

        <div className="mb-6 p-4 rounded-lg bg-black/20 border border-white/5">
          <h4 className="text-sm uppercase tracking-wider text-muted mb-2">Variables Disponibles</h4>
          <code className="text-xs text-primary" style={{ display: 'block', lineHeight: 1.8 }}>
            {'{{empresa_nombre}}, {{cliente_nombre}}, {{monto_otorgado}}, {{total_a_pagar}}, {{periodicidad}}, {{fecha_inicio}}, {{numero_periodos}}, {{credito_id}}, {{tabla_integrantes}}'}
          </code>
        </div>
        
        {plantillas.map(p => (
          <div key={p.id} className="mb-6">
            <label className="block mb-2 font-bold">Plantilla: {p.tipo}</label>
            <textarea 
              className="form-control" 
              rows="12" 
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: '#0f172a', resize: 'vertical' }}
              value={p.contenido}
              onChange={(e) => handleChange(p.id, e.target.value)}
            />
          </div>
        ))}

        <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : <><Save size={16} /> Guardar Plantillas</>}
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
