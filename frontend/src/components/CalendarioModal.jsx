import React from 'react';
import CalendarioPagos from './CalendarioPagos';
import Modal from './Modal';

export default function CalendarioModal({ credito, onClose }) {
  if (!credito) return null;

  const title = `Detalle del Crédito ${credito.nombre_cliente || credito.nombre || credito.credito_id.split('-')[0].toUpperCase()}`;

  return (
    <Modal title={title} onClose={onClose} maxWidth="800px">
      <CalendarioPagos creditoId={credito.credito_id || credito.id} />
    </Modal>
  );
}
