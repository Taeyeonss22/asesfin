import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calculator } from 'lucide-react';

export default function PaymentForm({ credit, onClose, session }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // For Individual credits
  const [pagosInd, setPagosInd] = useState({ abono: '', ahorro: '', mora: '' });
  
  // For Group credits
  const [integrantes, setIntegrantes] = useState([]);
  const [pagosGrupal, setPagosGrupal] = useState({}); // { id: { abono: '', ahorro: '', mora: '' } }
  
  const [successPagoId, setSuccessPagoId] = useState(null);

  useEffect(() => {
    if (credit.tipo === 'GRUPAL') {
      supabase
        .from('vista_saldos_integrantes')
        .select('*')
        .eq('credito_id', credit.credito_id)
        .then(({ data }) => {
          if (data) {
            setIntegrantes(data);
            const initialState = {};
            data.forEach(int => {
              initialState[int.integrante_id] = { abono: '', ahorro: '', mora: '' };
            });
            setPagosGrupal(initialState);
          }
        });
    }
  }, [credit.credito_id, credit.tipo]);

  const handleGrupalChange = (id, field, value) => {
    setPagosGrupal(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const totalesGrupal = useMemo(() => {
    let tAbono = 0;
    let tAhorro = 0;
    let tMora = 0;
    
    if (credit.tipo === 'INDIVIDUAL') {
      tAbono = parseFloat(pagosInd.abono) || 0;
      tAhorro = parseFloat(pagosInd.ahorro) || 0;
      tMora = parseFloat(pagosInd.mora) || 0;
    } else {
      Object.values(pagosGrupal).forEach(p => {
        tAbono += parseFloat(p.abono) || 0;
        tAhorro += parseFloat(p.ahorro) || 0;
        tMora += parseFloat(p.mora) || 0;
      });
    }

    return { 
      abono: tAbono, 
      ahorro: tAhorro, 
      mora: tMora, 
      granTotal: tAbono + tAhorro + tMora 
    };
  }, [pagosGrupal, pagosInd, credit.tipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessPagoId(null);

    try {
      const inserts = [];
      const timestamp = new Date().toISOString();

      if (credit.tipo === 'INDIVIDUAL') {
        const pAbono = parseFloat(pagosInd.abono) || 0;
        const pAhorro = parseFloat(pagosInd.ahorro) || 0;
        const pMora = parseFloat(pagosInd.mora) || 0;

        if (pAbono > 0) {
          if (pAbono > credit.saldo_pendiente) throw new Error("El abono no puede ser mayor al saldo pendiente");
          inserts.push({ credito_id: credit.credito_id, integrante_id: null, monto: pAbono, tipo: 'ABONO', fecha_pago: timestamp, registrado_por: session.user.id });
        }
        if (pAhorro > 0) {
          inserts.push({ credito_id: credit.credito_id, integrante_id: null, monto: pAhorro, tipo: 'AHORRO', fecha_pago: timestamp, registrado_por: session.user.id });
        }
        if (pMora > 0) {
          inserts.push({ credito_id: credit.credito_id, integrante_id: null, monto: pMora, tipo: 'MORA', fecha_pago: timestamp, registrado_por: session.user.id });
        }

        if (inserts.length === 0) {
          throw new Error("Debes capturar al menos un monto.");
        }
      } else {
        // Build array from group inputs
        let totalAbonosGroup = 0;
        for (const int of integrantes) {
          const pagos = pagosGrupal[int.integrante_id];
          if (!pagos) continue;

          const pAbono = parseFloat(pagos.abono) || 0;
          const pAhorro = parseFloat(pagos.ahorro) || 0;
          const pMora = parseFloat(pagos.mora) || 0;

          if (pAbono > 0) {
            if (pAbono > int.saldo_pendiente) throw new Error(`El abono de ${int.nombre_completo} supera su saldo pendiente`);
            inserts.push({ credito_id: credit.credito_id, integrante_id: int.integrante_id, monto: pAbono, tipo: 'ABONO', fecha_pago: timestamp, registrado_por: session.user.id });
            totalAbonosGroup += pAbono;
          }
          if (pAhorro > 0) {
            inserts.push({ credito_id: credit.credito_id, integrante_id: int.integrante_id, monto: pAhorro, tipo: 'AHORRO', fecha_pago: timestamp, registrado_por: session.user.id });
          }
          if (pMora > 0) {
            inserts.push({ credito_id: credit.credito_id, integrante_id: int.integrante_id, monto: pMora, tipo: 'MORA', fecha_pago: timestamp, registrado_por: session.user.id });
          }
        }

        if (inserts.length === 0) {
          throw new Error("Debes capturar al menos un monto para algún integrante.");
        }
      }

      // Insert all
      const { data, error: pagoError } = await supabase.from('pagos').insert(inserts).select();
      if (pagoError) throw pagoError;

      // Check if completely paid
      const sumAbonos = inserts.filter(i => i.tipo === 'ABONO').reduce((acc, curr) => acc + curr.monto, 0);
      if (sumAbonos >= credit.saldo_pendiente) {
        await supabase.from('creditos').update({ estado: 'PAGADO' }).eq('id', credit.credito_id);
      }

      // Pass the first payment ID to print a consolidated ticket (or the UI can just rely on the latest timestamp)
      setSuccessPagoId(data[0].id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '900px' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ margin: 0 }}>Registrar Pago {credit.tipo === 'GRUPAL' && 'Grupal'}</h3>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '0.25rem' }}><X size={20}/></button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {successPagoId ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              ¡Cobro Registrado Exitosamente!
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                className="btn btn-primary" 
                onClick={() => window.open(`/print/ticket/${successPagoId}`, '_blank')}
              >
                Imprimir Ticket (58mm)
              </button>
              <button className="btn btn-outline" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {credit.tipo === 'INDIVIDUAL' ? (
              // VISTA PLANILLA INDIVIDUAL
              <div className="mb-6">
                <div className="table-container">
                  <table>
                    <thead style={{ background: '#1e293b' }}>
                      <tr>
                        <th>Cliente</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Abono ($)</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Ahorro ($)</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Mora ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{credit.nombre_cliente}</strong>
                          <div className="text-muted text-xs">Saldo: ${parseFloat(credit.saldo_pendiente).toLocaleString()}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '0.5rem', marginBottom: 0, textAlign: 'center' }}
                            placeholder="0.00"
                            min="0" step="0.01"
                            value={pagosInd.abono}
                            onChange={(e) => setPagosInd({...pagosInd, abono: e.target.value})}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '0.5rem', marginBottom: 0, textAlign: 'center' }}
                            placeholder="0.00"
                            min="0" step="0.01"
                            value={pagosInd.ahorro}
                            onChange={(e) => setPagosInd({...pagosInd, ahorro: e.target.value})}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ padding: '0.5rem', marginBottom: 0, textAlign: 'center' }}
                            placeholder="0.00"
                            min="0" step="0.01"
                            value={pagosInd.mora}
                            onChange={(e) => setPagosInd({...pagosInd, mora: e.target.value})}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // VISTA DE PLANILLA GRUPAL
              <div className="mb-6">
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                      <tr>
                        <th>Integrante</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Abono ($)</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Ahorro ($)</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Mora ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrantes.map(int => (
                        <tr key={int.integrante_id}>
                          <td>
                            <strong>{int.nombre_completo}</strong>
                            <div className="text-muted text-xs">Saldo: ${parseFloat(int.saldo_pendiente).toLocaleString()}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '0.5rem', marginBottom: 0, textAlign: 'center' }}
                              placeholder="0.00"
                              min="0" step="0.01"
                              value={pagosGrupal[int.integrante_id]?.abono || ''}
                              onChange={(e) => handleGrupalChange(int.integrante_id, 'abono', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '0.5rem', marginBottom: 0, textAlign: 'center' }}
                              placeholder="0.00"
                              min="0" step="0.01"
                              value={pagosGrupal[int.integrante_id]?.ahorro || ''}
                              onChange={(e) => handleGrupalChange(int.integrante_id, 'ahorro', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '0.5rem', marginBottom: 0, textAlign: 'center' }}
                              placeholder="0.00"
                              min="0" step="0.01"
                              value={pagosGrupal[int.integrante_id]?.mora || ''}
                              onChange={(e) => handleGrupalChange(int.integrante_id, 'mora', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen Consolidado Inferior */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Calculator size={18} />
                    <strong style={{ fontSize: '1rem' }}>Total Consolidado del Grupo</strong>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '0.875rem' }}>
                    <span>Total Abonos: <strong className="text-success">${totalesGrupal.abono.toLocaleString()}</strong></span>
                    <span>Total Ahorro: <strong>${totalesGrupal.ahorro.toLocaleString()}</strong></span>
                    <span>Total Mora: <strong className="text-danger">${totalesGrupal.mora.toLocaleString()}</strong></span>
                    <span style={{ fontSize: '1.1rem' }}>Gran Total: <strong className="text-primary">${totalesGrupal.granTotal.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Procesando...' : `Registrar $${totalesGrupal.granTotal.toLocaleString()}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
