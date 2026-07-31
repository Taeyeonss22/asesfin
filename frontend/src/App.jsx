import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';

import CreditosIndividuales from './views/CreditosIndividuales';
import CreditosGrupales from './views/CreditosGrupales';
import GestionGrupos from './views/GestionGrupos';
import DirectorioClientes from './views/DirectorioClientes';

import PlantillasContrato from './views/PlantillasContrato';
import Reportes from './views/Reportes';
import CortesCaja from './views/CortesCaja';

import EmpresaYMarca from './views/EmpresaYMarca';
import TasasYParametros from './views/TasasYParametros';
import CobradoresZonas from './views/CobradoresZonas';

import PrintContract from './components/PrintContract';
import PrintTicket from './components/PrintTicket';
import GlobalNotifications from './components/GlobalNotifications';
import { Toaster } from 'react-hot-toast';

function App() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
        setPerfil(data);
      }
      setLoading(false);
    };
    
    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
        setPerfil(data);
      } else {
        setPerfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <GlobalNotifications session={session} />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/print/contract/:id" element={session ? <PrintContract /> : <Navigate to="/" />} />
        <Route path="/print/ticket/:id" element={session ? <PrintTicket /> : <Navigate to="/" />} />
        
        {/* Protected Layout Routes */}
        <Route 
          path="/" 
          element={session && perfil ? <Layout session={session} perfil={perfil} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard session={session} perfil={perfil} />} />
          <Route path="creditos-individuales" element={<CreditosIndividuales session={session} />} />
          <Route path="creditos-grupales" element={<CreditosGrupales session={session} />} />
          <Route path="grupos" element={<GestionGrupos />} />
          <Route path="clientes" element={<DirectorioClientes />} />
          
          <Route path="plantillas" element={<PlantillasContrato />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="cortes" element={<CortesCaja session={session} />} />
          
          <Route path="empresa" element={<EmpresaYMarca />} />
          <Route path="parametros" element={<TasasYParametros />} />
          <Route path="cobradores" element={<CobradoresZonas session={session} />} />
        </Route>

        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
