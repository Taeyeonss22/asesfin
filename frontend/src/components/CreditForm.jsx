import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Select from 'react-select';

export default function CreditForm({ onClose, session }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [clientesLibres, setClientesLibres] = useState([]);
  const [gruposLibres, setGruposLibres] = useState([]);

  const [formData, setFormData] = useState({
    zona_id: '',
    tipo: 'INDIVIDUAL',
    cliente_id: '',
    grupo_id: '',
    monto_otorgado: '',
    periodicidad: 'SEMANAL',
    fecha_inicio: new Date().toISOString().split('T')[0],
  });

  const [integrantes, setIntegrantes] = useState([]);

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

    // Fetch Clientes Libres
    supabase.from('clientes')
      .select('id, nombre_completo, creditos!creditos_cliente_id_fkey(estado), grupo_integrantes(grupos(creditos(estado)))')
      .then(({data}) => {
         if (data) {
           const libres = data.filter(c => {
             const actInd = c.creditos?.some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
             const actGrp = c.grupo_integrantes?.flatMap(gi => gi.grupos?.creditos || []).some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
             return !actInd && !actGrp;
           });
           setClientesLibres(libres);
         }
      });

    // Fetch Grupos Libres
    supabase.from('grupos')
      .select('id, nombre, creditos(estado), grupo_integrantes(clientes(id, nombre_completo, creditos!creditos_cliente_id_fkey(estado), grupo_integrantes(grupos(creditos(estado)))))')
      .then(({data}) => {
         if (data) {
           const libres = data.filter(g => {
             const actGrp = g.creditos?.some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
             const actInt = g.grupo_integrantes?.some(gi => {
               const c = gi.clientes;
               if (!c) return false;
               const intActInd = c.creditos?.some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
               const intActGrp = c.grupo_integrantes?.flatMap(x => x.grupos?.creditos || []).some(cr => cr.estado === 'ACTIVO' || cr.estado === 'MORA');
               return intActInd || intActGrp;
             });
             return !actGrp && !actInt;
           });
           setGruposLibres(libres);
         }
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGroupSelect = (e) => {
    const groupId = e.target.value;
    setFormData({ ...formData, grupo_id: groupId });
    
    if (groupId) {
      const group = gruposLibres.find(g => g.id === groupId);
      if (group && group.grupo_integrantes) {
        const ints = group.grupo_integrantes.map(gi => ({
          cliente_id: gi.clientes.id,
          nombre_completo: gi.clientes.nombre_completo,
          monto_otorgado: '',
          monto_garantia: 0
        }));
        setIntegrantes(ints);
      }
    } else {
      setIntegrantes([]);
    }
  };

  const handleIntegranteChange = (index, field, value) => {
    const newIntegrantes = [...integrantes];
    newIntegrantes[index][field] = value;
    setIntegrantes(newIntegrantes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!params) throw new Error("Faltan parámetros del sistema para calcular cuotas.");
      if (formData.tipo === 'INDIVIDUAL' && !formData.cliente_id) throw new Error("Debes seleccionar un cliente libre.");
      if (formData.tipo === 'GRUPAL' && !formData.grupo_id) throw new Error("Debes seleccionar un grupo libre.");

      // Calculate totals
      let montoOtorgadoFinal = parseFloat(formData.monto_otorgado);
      if (formData.tipo === 'GRUPAL') {
        montoOtorgadoFinal = integrantes.reduce((acc, curr) => acc + (parseFloat(curr.monto_otorgado) || 0), 0);
      }

      if (isNaN(montoOtorgadoFinal) || montoOtorgadoFinal <= 0) {
        throw new Error("El monto otorgado debe ser mayor a 0");
      }

      let numero_periodos = 16;
      if (formData.periodicidad === 'DIARIA') numero_periodos = 20;
      else if (formData.periodicidad === 'SEMANAL') numero_periodos = 16;
      else if (formData.periodicidad === 'CATORCENAL' || formData.periodicidad === 'QUINCENAL') numero_periodos = 8;
      else if (formData.periodicidad === 'MENSUAL') numero_periodos = 4;

      const totalAPagar = montoOtorgadoFinal * 1.20;
      const cuotaPeriodo = totalAPagar / numero_periodos;

      // 1. Insert Credito (Parent)
      const payload = {
        zona_id: formData.zona_id,
        tipo: formData.tipo,
        cliente_id: formData.tipo === 'INDIVIDUAL' ? formData.cliente_id : null,
        grupo_id: formData.tipo === 'GRUPAL' ? formData.grupo_id : null,
        monto_otorgado: montoOtorgadoFinal,
        total_a_pagar: totalAPagar,
        cuota_periodo: cuotaPeriodo,
        periodicidad: formData.periodicidad,
        fecha_inicio: formData.fecha_inicio,
        numero_periodos: numero_periodos,
        creado_por: session.user.id
      };

      const { data: credito, error: creditoError } = await supabase
        .from('creditos')
        .insert(payload)
        .select()
        .single();

      if (creditoError) throw creditoError;

      // 2. Insert Integrantes (Children) if GRUPAL
      if (formData.tipo === 'GRUPAL' && integrantes.length > 0) {
        const integrantesInsert = integrantes.map(int => {
          const m = parseFloat(int.monto_otorgado) || 0;
          return {
            credito_id: credito.id,
            cliente_id: int.cliente_id,
            nombre_completo: int.nombre_completo,
            monto_otorgado: m,
            total_a_pagar: m * 1.20,
            cuota_periodo: (m * 1.20) / numero_periodos,
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
      <div className="modal-content glass-card" style={{ maxWidth: formData.tipo === 'GRUPAL' ? '700px' : '450px' }}>
        <div className="modal-header">
          <h3>Nuevo Crédito</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Tipo de Crédito</label>
                <select name="tipo" className="form-control" value={formData.tipo} onChange={(e) => {
                  handleChange(e);
                  setIntegrantes([]); // Reset on type change
                  setFormData(p => ({...p, tipo: e.target.value, cliente_id: '', grupo_id: ''}));
                }}>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="GRUPAL">Grupal</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Zona</label>
                <select name="zona_id" className="form-control" value={formData.zona_id} onChange={handleChange} required>
                  <option value="">Selecciona una zona</option>
                  {zonas.map(z => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {formData.tipo === 'INDIVIDUAL' && (
              <>
                <div className="form-group">
                  <label>Seleccionar Cliente (Libre)</label>
                  <Select
                    options={clientesLibres.map(c => ({ value: c.id, label: c.nombre_completo }))}
                    value={formData.cliente_id ? { value: formData.cliente_id, label: clientesLibres.find(c => c.id === formData.cliente_id)?.nombre_completo } : null}
                    onChange={(selected) => handleChange({ target: { name: 'cliente_id', value: selected ? selected.value : '' } })}
                    placeholder="-- Buscar / Seleccionar Cliente --"
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({ ...base, background: 'rgba(255, 255, 255, 0.05)', borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }),
                      singleValue: (base) => ({ ...base, color: 'var(--text-main)' }),
                      input: (base) => ({ ...base, color: 'var(--text-main)' }),
                      menu: (base) => ({ ...base, background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }),
                      option: (base, { isFocused }) => ({ ...base, background: isFocused ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer' })
                    }}
                    required
                  />
                  {clientesLibres.length === 0 && <span className="text-xs text-danger mt-1">No hay clientes libres (o sin crédito).</span>}
                </div>

                <div className="form-group">
                  <label>Monto Otorgado ($)</label>
                  <input type="number" name="monto_otorgado" className="form-control" value={formData.monto_otorgado} onChange={handleChange} min="1" step="0.01" required />
                </div>
              </>
            )}

            {formData.tipo === 'GRUPAL' && (
              <>
                <div className="form-group">
                  <label>Seleccionar Grupo (Libre)</label>
                  <select name="grupo_id" className="form-control" value={formData.grupo_id} onChange={handleGroupSelect} required>
                    <option value="">-- Seleccionar Grupo --</option>
                    {gruposLibres.map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                  {gruposLibres.length === 0 && <span className="text-xs text-danger mt-1">No hay grupos libres disponibles.</span>}
                </div>

                {formData.grupo_id && (
                  <div className="mt-4">
                    <h4 className="text-muted text-sm uppercase tracking-wider mb-2">Montos por Integrante</h4>
                    <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                      {integrantes.map((int, i) => (
                        <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', mb: '1rem', border: '1px solid var(--border-subtle)' }} className="mb-4">
                          <div className="font-bold mb-2 text-primary">{int.nombre_completo}</div>
                          <div className="flex gap-4">
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                              <label>Monto a Otorgar ($)</label>
                              <input type="number" className="form-control" value={int.monto_otorgado} onChange={(e) => handleIntegranteChange(i, 'monto_otorgado', e.target.value)} min="1" step="0.01" required />
                            </div>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                              <label>Monto Garantía ($)</label>
                              <input type="number" className="form-control" value={int.monto_garantia} onChange={(e) => handleIntegranteChange(i, 'monto_garantia', e.target.value)} min="0" step="0.01" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {integrantes.length === 0 && (
                        <div className="text-muted text-sm">Este grupo no tiene integrantes asignados.</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading || (formData.tipo === 'GRUPAL' && integrantes.length === 0)}>
                {loading ? 'Guardando...' : 'Crear Crédito'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
