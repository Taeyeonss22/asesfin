import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  FolderKey, 
  CreditCard,
  FileText,
  BarChart2,
  Building2,
  Percent,
  Map
} from 'lucide-react';

export default function Sidebar({ configEmpresa }) {
  const sections = [
    {
      title: 'OPERACIÓN PRINCIPAL',
      items: [
        { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/creditos-individuales', icon: <User size={18} />, label: 'Créditos Individuales' },
        { path: '/creditos-grupales', icon: <Users size={18} />, label: 'Créditos Grupales' },
        { path: '/grupos', icon: <FolderKey size={18} />, label: 'Gestión de Grupos' },
        { path: '/clientes', icon: <CreditCard size={18} />, label: 'Acreditados / Clientes' },
        { path: '/cortes', icon: <FileText size={18} />, label: 'Cortes de Caja' },
      ]
    },
    {
      title: 'DOCUMENTOS Y MÉTRICAS',
      items: [
        { path: '/plantillas', icon: <FileText size={18} />, label: 'Plantillas de Contrato' },
        { path: '/reportes', icon: <BarChart2 size={18} />, label: 'Reportes y Métricas' },
      ]
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { path: '/empresa', icon: <Building2 size={18} />, label: 'Empresa y Marca' },
        { path: '/parametros', icon: <Percent size={18} />, label: 'Tasas y Parámetros' },
        { path: '/cobradores', icon: <Map size={18} />, label: 'Cobradores y Zonas' },
      ]
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-text flex items-center gap-2">
          {configEmpresa?.logo_url ? (
            <img 
              src={configEmpresa.logo_url} 
              alt="Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }}
            />
          ) : (
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '18px', fontWeight: 'bold'}}>
              {configEmpresa?.nombre_empresa ? configEmpresa.nombre_empresa.charAt(0).toUpperCase() : 'M'}
            </div>
          )}
          <span style={{ fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
            {configEmpresa?.nombre_empresa || 'MicroFinanzas'}
          </span>
        </div>
        <div className="sidebar-logo-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {configEmpresa?.eslogan || 'Soluciones S.A. de C.V. S.F.P.'}
        </div>
      </div>

      <div className="sidebar-nav">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <div className="nav-category">{section.title}</div>
            {section.items.map((item, iIdx) => (
              <NavLink 
                key={iIdx} 
                to={item.path}
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                end={item.path === '/'}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        MicroFinanzas App v2.0 &bull; Web
      </div>
    </div>
  );
}
