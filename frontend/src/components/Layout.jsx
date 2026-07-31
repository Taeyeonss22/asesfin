import React from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import { RefreshCw, UserCircle, LogOut } from 'lucide-react';

export default function Layout({ session, perfil }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const syncApp = () => {
    // This is just a visual feedback for web, real sync is automatic via realtime
    alert("Sincronización con la nube completada.");
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <header className="top-header">
          <button className="btn btn-outline" onClick={syncApp}>
            <RefreshCw size={16} className="text-primary" />
            <span style={{ fontSize: '0.8rem' }}>Sincronizar Nube</span>
          </button>
          
          <div className="flex items-center gap-4 border-l border-subtle" style={{ paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <UserCircle size={32} className="text-primary" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{perfil?.nombre_completo || 'Usuario'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{perfil?.rol || 'ADMIN'}</div>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="content-area">
          {/* Aquí se renderizarán las vistas hijas (Dashboard, Creditos, etc) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
