import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Save, RefreshCw } from 'lucide-react';
import { htmlIndividual, htmlIndividualAval, htmlGrupal } from '../lib/templates';

export default function PlantillasContrato() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPlantillas = async () => {
    setLoading(true);
    const { data } = await supabase.from('plantillas_contratos').select('*');
    
    if (data && data.length > 0) {
      setPlantillas(data);
    } else {
      // Seed if empty
      const defaultTemplates = [
        { tipo: 'INDIVIDUAL', contenido: htmlIndividual },
        { tipo: 'INDIVIDUAL_AVAL', contenido: htmlIndividualAval },
        { tipo: 'GRUPAL', contenido: htmlGrupal }
      ];
      await supabase.from('plantillas_contratos').insert(defaultTemplates);
      const { data: newData } = await supabase.from('plantillas_contratos').select('*');
      if (newData) setPlantillas(newData);
    }
    
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
      // Check if it exists first
      const { data: existing } = await supabase.from('plantillas_contratos').select('id').eq('tipo', p.tipo).single();
      
      let error;
      if (existing) {
        const res = await supabase.from('plantillas_contratos').update({ contenido: p.contenido }).eq('tipo', p.tipo);
        error = res.error;
      } else {
        const res = await supabase.from('plantillas_contratos').insert({ tipo: p.tipo, contenido: p.contenido });
        error = res.error;
      }

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

  const handleRestoreDefaults = async () => {
    if (!window.confirm('¿Estás seguro de restaurar las plantillas por defecto? Esto sobreescribirá los diseños actuales.')) return;
    
    setLoading(true);
    const defaultTemplates = [
      { tipo: 'INDIVIDUAL', contenido: htmlIndividual },
      { tipo: 'INDIVIDUAL_AVAL', contenido: htmlIndividualAval },
      { tipo: 'GRUPAL', contenido: htmlGrupal }
    ];
    
    for (const t of defaultTemplates) {
      // Upsert by tipo
      const { data: existing } = await supabase.from('plantillas_contratos').select('id').eq('tipo', t.tipo).single();
      if (existing) {
        await supabase.from('plantillas_contratos').update({ contenido: t.contenido }).eq('tipo', t.tipo);
      } else {
        await supabase.from('plantillas_contratos').insert(t);
      }
    }
    
    await fetchPlantillas();
    setMessage('Plantillas restauradas a su valor por defecto.');
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
            {'{{empresa_nombre}}, {{cliente_nombre}}, {{folio}}, {{monto_otorgado}}, {{interes_generado}}, {{monto_total_a_pagar}}, {{plazo}}, {{cuota_periodo}}, {{fecha_primer_pago}}, {{tasa_interes}}, {{domicilio_acreditado}}, {{fecha_vencimiento}}, {{fecha_firma}}, {{nombre_aval}}, {{domicilio_aval}}, {{garantia_liquida}}, {{tabla_integrantes}}'}
          </code>
        </div>
        
        {plantillas.map(p => (
          <div key={p.id} className="mb-6">
            <label className="block mb-2 font-bold">Plantilla: {p.tipo}</label>
            <textarea 
              className="form-control" 
              rows="12" 
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--bg-base)', resize: 'vertical' }}
              value={p.contenido}
              onChange={(e) => handleChange(p.id, e.target.value)}
            />
          </div>
        ))}

        <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : <><Save size={16} /> Guardar Plantillas</>}
          </button>
          <button className="btn btn-outline" onClick={handleRestoreDefaults} disabled={saving}>
            <RefreshCw size={16} /> Restaurar por Defecto
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
