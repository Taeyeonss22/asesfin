import React from 'react';
import { X } from 'lucide-react';
import CalendarioPagos from './CalendarioPagos';

export default function CalendarioModal({ credito, onClose }) {
  if (!credito) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>
            Detalle del Crédito {credito.tipo === 'INDIVIDUAL' ? credito.nombre_cliente : credito.nombre}
          </h3>
          <button className="modal-close" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <CalendarioPagos creditoId={credito.credito_id || credito.id} />
        </div>
        
      </div>
    </div>
  );
}
