import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PrintContract({ configEmpresa }) {
  const { id } = useParams();
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Fetch credit details
        const { data: credito, error: err1 } = await supabase.from('creditos').select('*').eq('id', id).single();
        if (err1) throw err1;
        if (!credito) throw new Error("Crédito no encontrado");

        // Fetch template
        const { data: plantilla, error: err2 } = await supabase.from('plantillas_contratos').select('*').eq('tipo', credito.tipo).single();
        if (err2) throw err2;
        if (!plantilla) throw new Error("Plantilla no encontrada");

      let finalHtml = plantilla.contenido;

      // Fetch integrantes if GRUPAL
      let tablaIntegrantes = '';
      if (credito.tipo === 'GRUPAL') {
        const { data: integrantes } = await supabase.from('integrantes_grupo').select('*').eq('credito_id', id);
        if (integrantes && integrantes.length > 0) {
          tablaIntegrantes = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 8px;">Nombre</th>
                  <th style="border: 1px solid #000; padding: 8px;">Monto Otorgado</th>
                </tr>
              </thead>
              <tbody>
                ${integrantes.map(i => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px;">${i.nombre_completo}</td>
                    <td style="border: 1px solid #000; padding: 8px;">$${i.monto_otorgado}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }

      // Replace variables
      finalHtml = finalHtml
        .replace(/{{credito_id}}/g, credito.id.split('-')[0].toUpperCase())
        .replace(/{{empresa_nombre}}/g, config?.nombre_empresa || 'Empresa')
        .replace(/{{cliente_nombre}}/g, credito.nombre_cliente || 'N/A')
        .replace(/{{monto_otorgado}}/g, credito.monto_otorgado)
        .replace(/{{monto_otorgado_total}}/g, credito.monto_otorgado)
        .replace(/{{total_a_pagar}}/g, credito.total_a_pagar)
        .replace(/{{total_a_pagar_total}}/g, credito.total_a_pagar)
        .replace(/{{periodicidad}}/g, credito.periodicidad)
        .replace(/{{numero_periodos}}/g, credito.numero_periodos)
        .replace(/{{cuota_periodo}}/g, credito.cuota_periodo)
        .replace(/{{fecha_inicio}}/g, credito.fecha_inicio)
        .replace(/{{tabla_integrantes}}/g, tablaIntegrantes);

      setHtmlContent(finalHtml);
      setLoading(false);
      
      // Auto print after a short delay to allow render
      setTimeout(() => {
        window.print();
      }, 500);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchContractData();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Cargando contrato...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="print-contract" style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'serif',
      lineHeight: '1.5',
      color: '#000'
    }}>
      
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        {configEmpresa?.logo_url && (
          <img 
            src={configEmpresa.logo_url} 
            alt="Logo" 
            style={{ maxHeight: '80px', objectFit: 'contain' }} 
          />
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{configEmpresa?.nombre_empresa || 'Empresa Financiera'}</h1>
          {configEmpresa?.eslogan && (
            <p style={{ margin: '0 0 5px 0', fontStyle: 'italic', color: '#555' }}>
              {configEmpresa.eslogan}
            </p>
          )}
          <p style={{ margin: 0, fontSize: '14px' }}>{configEmpresa?.direccion} | Tel: {configEmpresa?.telefono}</p>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
}
