import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function CreditForm({ onClose, session }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(null);
  const [zonas, setZonas] = useState([]);

  const [formData, setFormData] = useState({
    zona_id: '',
    tipo: 'INDIVIDUAL',
    nombre_cliente: '',
    monto_otorgado: '',
    periodicidad: 'SEMANAL',
    fecha_inicio: new Date().toISOString().split('T')[0],
  });

  const [integrantes, setIntegrantes] = useState([
    { nombre_completo: '', monto_otorgado: '', monto_garantia: 0 }
  ]);

  useEffect(() => {
    // Fetch default parameters
    supabase.from('parametros_sistema').select('*').limit(1).single()
      .then(({ data }) => {
        if (data) setParams(data);
      });
      
    // Fetch available zones
    supabase.from('zonas').select('*').then(({ data }) => {
      if (data) {
        setZonas(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, zona_id: data[0].id }));
        }
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIntegranteChange = (index, field, value) => {
    const newIntegrantes = [...integrantes];
    newIntegrantes[index][field] = value;
    setIntegrantes(newIntegrantes);
  };

  const addIntegrante = () => {
    if (integrantes.length >= 10) return;
    setIntegrantes([...integrantes, { nombre_completo: '', monto_otorgado: '', monto_garantia: 0 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!params) throw new Error("Faltan parámetros del sistema para calcular cuotas.");

      // Calculate totals
      let montoOtorgadoFinal = parseFloat(formData.monto_otorgado);
      if (formData.tipo === 'GRUPAL') {
        montoOtorgadoFinal = integrantes.reduce((acc, curr) => acc + (parseFloat(curr.monto_otorgado) || 0), 0);
      }

      if (isNaN(montoOtorgadoFinal) || montoOtorgadoFinal <= 0) {
        throw new Error("El monto otorgado debe ser mayor a 0");
      }

      const totalAPagar = montoOtorgadoFinal * (1 + (params.interes_porcentaje / 100));
      const cuotaPeriodo = (montoOtorgadoFinal / 1000) * params.cuota_por_mil;

      // 1. Insert Credito (Parent)
      const { data: credito, error: creditoError } = await supabase
        .from('creditos')
        .insert({
          zona_id: formData.zona_id,
          tipo: formData.tipo,
          nombre_cliente: formData.tipo === 'INDIVIDUAL' ? formData.nombre_cliente : null,
          monto_otorgado: montoOtorgadoFinal,
          total_a_pagar: totalAPagar,
          cuota_periodo: cuotaPeriodo,
          periodicidad: formData.periodicidad,
          fecha_inicio: formData.fecha_inicio,
          numero_periodos: params.numero_periodos_default,
          creado_por: session.user.id
        })
        .select()
        .single();

      if (creditoError) throw creditoError;

      // 2. Insert Integrantes (Children) if GRUPAL
      if (formData.tipo === 'GRUPAL' && integrantes.length > 0) {
        const integrantesInsert = integrantes.map(int => {
          const m = parseFloat(int.monto_otorgado) || 0;
          return {
            credito_id: credito.id,
            nombre_completo: int.nombre_completo,
            monto_otorgado: m,
            total_a_pagar: m * (1 + (params.interes_porcentaje / 100)),
            cuota_periodo: (m / 1000) * params.cuota_por_mil,
            monto_garantia: parseFloat(int.monto_garantia) || 0,
          };
        });

        const { error: integrantesError } = await supabase
          .from('integrantes_grupo')
          .insert(integrantesInsert);

        if (integrantesError) throw integrantesError;
      }

      onClose(); // Cerrar modal al terminar
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Nuevo Crédito</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Zona</label>
            <select name="zona_id" className="form-control" value={formData.zona_id} onChange={handleChange} required>
              <option value="">Selecciona una zona</option>
              {zonas.map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Crédito</label>
            <select name="tipo" className="form-control" value={formData.tipo} onChange={handleChange}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GRUPAL">Grupal</option>
            </select>
          </div>

          <div className="form-group">
            <label>Periodicidad</label>
            <select name="periodicidad" className="form-control" value={formData.periodicidad} onChange={handleChange}>
              <option value="DIARIA">Diaria</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="CATORCENAL">Catorcenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha de Inicio</label>
            <input type="date" name="fecha_inicio" className="form-control" value={formData.fecha_inicio} onChange={handleChange} required />
          </div>

          {formData.tipo === 'INDIVIDUAL' && (
            <div className="form-group">
              <label>Nombre del Cliente</label>
              <input type="text" name="nombre_cliente" className="form-control" value={formData.nombre_cliente} onChange={handleChange} required />
            </div>
          )}

          {formData.tipo === 'INDIVIDUAL' ? (
            <div className="form-group">
              <label>Monto Otorgado ($)</label>
              <input type="number" name="monto_otorgado" className="form-control" value={formData.monto_otorgado} onChange={handleChange} min="1" step="0.01" required />
            </div>
          ) : (
            <div className="mt-4">
              <h4>Integrantes del Grupo (Max 10)</h4>
              {integrantes.map((int, i) => (
                <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Nombre del Integrante</label>
                    <input type="text" className="form-control" value={int.nombre_completo} onChange={(e) => handleIntegranteChange(i, 'nombre_completo', e.target.value)} required />
                  </div>
                  <div className="flex gap-4">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Monto ($)</label>
                      <input type="number" className="form-control" value={int.monto_otorgado} onChange={(e) => handleIntegranteChange(i, 'monto_otorgado', e.target.value)} min="1" step="0.01" required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Garantía ($)</label>
                      <input type="number" className="form-control" value={int.monto_garantia} onChange={(e) => handleIntegranteChange(i, 'monto_garantia', e.target.value)} min="0" step="0.01" />
                    </div>
                  </div>
                </div>
              ))}
              {integrantes.length < 10 && (
                <button type="button" className="btn btn-outline mb-4" onClick={addIntegrante}>
                  + Agregar Integrante
                </button>
              )}
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
