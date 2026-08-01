import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, RefreshCw, Plus, DollarSign, Printer, Search, Calendar } from 'lucide-react';
import CreditForm from '../components/CreditForm';
import PaymentForm from '../components/PaymentForm';
import CalendarioModal from '../components/CalendarioModal';

export default function CreditosIndividuales({ session }) {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [showCalendarioModal, setShowCalendarioModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCredits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vista_saldos_creditos')
      .select('*')
      .eq('tipo', 'INDIVIDUAL')
      .order('credito_id', { ascending: false });

    if (!error && data) {
      setCredits(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <User size={24} className="text-primary" />
          <h1 style={{ margin: 0 }}>Créditos Individuales</h1>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline" onClick={fetchCredits} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} style={{ border: 'none' }} />
            Actualizar
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreditForm(true)}>
            <Plus size={16} /> Nuevo Crédito
          </button>
        </div>
      </div>

      <div className="solid-card">
        <div className="flex items-center gap-2 mb-4" style={{ maxWidth: '400px' }}>
          <div className="form-group w-full" style={{ marginBottom: 0, position: 'relative' }}>
            <Search size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nombre o folio..." 
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
                <th>Folio</th>
                <th>Cliente</th>
                <th>Monto Otorgado</th>
                <th>Total a Pagar</th>
                <th>Pagado</th>
                <th>Saldo Pendiente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {credits.filter(item => 
                (item.nombre_cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                (item.credito_id || '').toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: '3rem' }}>
                    {searchTerm ? 'No se encontraron créditos.' : 'No hay créditos individuales registrados.'}
                  </td>
                </tr>
              ) : (
                credits.filter(item => 
                  (item.nombre_cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                  (item.credito_id || '').toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <tr key={item.credito_id}>
                    <td className="font-medium">CTR-{item.credito_id.split('-')[0].toUpperCase()}</td>
                    <td>{item.nombre_cliente || 'Sin Nombre'}</td>
                    <td>${item.monto_otorgado?.toLocaleString()}</td>
                    <td>${item.total_a_pagar?.toLocaleString()}</td>
                    <td className="text-success">${item.total_pagado?.toLocaleString()}</td>
                    <td className="text-danger font-bold">${item.saldo_pendiente?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${item.saldo_pendiente <= 0 ? 'badge-paid' : 'badge-active'}`}>
                        {item.saldo_pendiente <= 0 ? 'PAGADO' : item.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => window.open(`/print/contract/${item.credito_id}`, '_blank')}
                          title="Imprimir Contrato"
                        >
                          <Printer size={14} />
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => setShowCalendarioModal(item)}
                          title="Ver Calendario y Pagos"
                        >
                          <Calendar size={14} />
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => setShowPaymentForm(item)}
                          disabled={item.saldo_pendiente <= 0}
                        >
                          <DollarSign size={14} /> Pagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreditForm && (
        <CreditForm onClose={() => { setShowCreditForm(false); fetchCredits(); }} session={session} />
      )}
      {showPaymentForm && (
        <PaymentForm credit={showPaymentForm} onClose={() => { setShowPaymentForm(null); fetchCredits(); }} session={session} />
      )}
      {showCalendarioModal && (
        <CalendarioModal credito={showCalendarioModal} onClose={() => setShowCalendarioModal(null)} />
      )}
    </div>
  );
}
