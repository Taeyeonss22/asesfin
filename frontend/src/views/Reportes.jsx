import React, { useState } from 'react';
import { BarChart2, AlertTriangle, Users, TrendingUp, AlertCircle } from 'lucide-react';
import CarteraMoraReport from '../components/reports/CarteraMoraReport';
import CobranzaReport from '../components/reports/CobranzaReport';
import ProyeccionReport from '../components/reports/ProyeccionReport';
import FaltasReport from '../components/reports/FaltasReport';

export default function Reportes() {
  const [activeTab, setActiveTab] = useState('mora');

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={24} className="text-primary" />
        <h1 style={{ margin: 0 }}>Reportes y Métricas</h1>
      </div>

      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeTab === 'mora' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('mora')}
        >
          <AlertTriangle size={16} /> Cartera en Mora / PAR
        </button>
        <button 
          className={`btn ${activeTab === 'cobranza' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('cobranza')}
        >
          <Users size={16} /> Cobranza por Cobrador
        </button>
        <button 
          className={`btn ${activeTab === 'proyeccion' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('proyeccion')}
        >
          <TrendingUp size={16} /> Proyección
        </button>
        <button 
          className={`btn ${activeTab === 'faltas' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('faltas')}
        >
          <AlertCircle size={16} /> Clientes en Falta
        </button>
      </div>

      <div>
        {activeTab === 'mora' && <CarteraMoraReport />}
        {activeTab === 'cobranza' && <CobranzaReport />}
        {activeTab === 'proyeccion' && <ProyeccionReport />}
        {activeTab === 'faltas' && <FaltasReport />}
      </div>
    </div>
  );
}
