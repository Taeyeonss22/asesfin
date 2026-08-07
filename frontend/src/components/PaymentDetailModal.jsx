import React from 'react';
import { MapPin, Camera, User, Clock, DollarSign } from 'lucide-react';
import Modal from './Modal';

export default function PaymentDetailModal({ pago, onClose }) {
  if (!pago) return null;

  const title = (
    <div className="flex items-center gap-2">
      <DollarSign className="text-primary" />
      Detalle de Cobro
    </div>
  );

  return (
    <Modal title={title} onClose={onClose} maxWidth="600px">
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div className="text-muted text-xs uppercase font-bold tracking-wider mb-1">Monto Cobrado</div>
          <div className="text-xl font-bold" style={{ color: pago.tipo_pago === 'MORA' ? 'var(--danger)' : 'var(--success)' }}>
            ${parseFloat(pago.monto).toLocaleString()}
            <span className="text-sm font-normal text-muted ml-2">({pago.tipo_pago})</span>
          </div>
          {pago.numero_pago && (
            <div className="text-sm text-primary font-medium mt-1">
              Semana {pago.numero_pago}
                </div>
              )}
            </div>
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div className="flex items-center gap-2 text-muted text-xs uppercase font-bold tracking-wider mb-1">
                <Clock size={14} /> Fecha Exacta
              </div>
              <div className="font-semibold">
                {new Date(pago.fecha_pago).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            <div className="glass-card col-span-2" style={{ padding: '1rem' }}>
              <div className="flex items-center gap-2 text-muted text-xs uppercase font-bold tracking-wider mb-1">
                <User size={14} /> Registrado por
              </div>
              <div className="font-semibold">
                {pago.cobrador_nombre || 'Usuario Desconocido'}
              </div>
              <div className="text-muted text-sm mt-1">Acreditado: {pago.cliente_nombre}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FOTO EVIDENCIA */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div className="flex items-center gap-2 text-muted text-xs uppercase font-bold tracking-wider mb-3">
                <Camera size={14} /> Evidencia Fotográfica
              </div>
              {pago.evidencia_url ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-hover)', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={pago.evidencia_url} 
                    alt="Evidencia del cobro" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted" style={{ height: '200px', background: 'var(--bg-glass-light)', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
                  No disponible
                </div>
              )}
            </div>

            {/* UBICACION GPS */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div className="flex items-center gap-2 text-muted text-xs uppercase font-bold tracking-wider mb-3">
                <MapPin size={14} /> Ubicación GPS
              </div>
              {pago.latitud && pago.longitud ? (
                <div className="flex flex-col h-full gap-3">
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-glass-light)', height: '155px', position: 'relative' }}>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight="0" 
                      marginWidth="0" 
                      src={`https://maps.google.com/maps?q=${pago.latitud},${pago.longitud}&z=16&output=embed`}
                    ></iframe>
                  </div>
                  <a 
                    href={`https://maps.google.com/?q=${pago.latitud},${pago.longitud}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline flex items-center justify-center gap-2"
                    style={{ padding: '0.5rem', width: '100%' }}
                  >
                    <MapPin size={16} /> Ver en Google Maps
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center text-muted" style={{ height: '200px', background: 'var(--bg-glass-light)', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
                  No disponible
                </div>
              )}
            </div>
      </div>
    </Modal>
  );
}
