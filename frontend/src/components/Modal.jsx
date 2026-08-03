import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, maxWidth = '500px' }) {
  // Prevenir scroll en el fondo cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card animate-fade-in" style={{ maxWidth }}>
        <div className="modal-header">
          {typeof title === 'string' ? <h3 style={{ margin: 0 }}>{title}</h3> : title}
          <button className="modal-close" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
