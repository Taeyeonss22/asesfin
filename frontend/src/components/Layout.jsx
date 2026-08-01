import React from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import { RefreshCw, UserCircle, LogOut } from 'lucide-react';

export default function Layout({ session, perfil, configEmpresa }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const syncApp = () => {
    // This is just a visual feedback for web, real sync is automatic via realtime
    alert("Sincronización con la nube completada.");
  };

  return (
    <div className="layout-container">
      <Sidebar configEmpresa={configEmpresa} />
      <div className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div className="flex items-center gap-3">
            {configEmpresa?.logo_url && (
              <img 
                src={configEmpresa.logo_url} 
                alt="Logo Empresa" 
                style={{ height: '40px', objectFit: 'contain' }} 
              />
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {configEmpresa?.nombre_empresa || 'Microcréditos App'}
              </h2>
              {configEmpresa?.eslogan && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {configEmpresa.eslogan}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="btn btn-outline" onClick={syncApp}>
              <RefreshCw size={16} className="text-primary" />
              <span className="hidden sm:inline" style={{ fontSize: '0.8rem' }}>Sincronizar Nube</span>
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
