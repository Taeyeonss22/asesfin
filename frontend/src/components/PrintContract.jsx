import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { htmlIndividual, htmlIndividualAval, htmlGrupal } from '../lib/templates';

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

        // Determine template type
        let templateType = 'INDIVIDUAL';
        if (credito.tipo === 'GRUPAL') {
          templateType = 'GRUPAL';
        } else if (credito.aval_nombre) {
          templateType = 'INDIVIDUAL_AVAL';
        }

        // Fetch template from DB or fallback
        const { data: plantilla } = await supabase.from('plantillas_contratos').select('*').eq('tipo', templateType).single();
        
        let finalHtml = '';
        if (plantilla && plantilla.contenido) {
          finalHtml = plantilla.contenido;
        } else {
          // Fallbacks
          if (templateType === 'GRUPAL') finalHtml = htmlGrupal;
          else if (templateType === 'INDIVIDUAL_AVAL') finalHtml = htmlIndividualAval;
          else finalHtml = htmlIndividual;
        }

        // Fetch integrantes if GRUPAL
        let tablaIntegrantes = '';
        let garantiaLiquida = (credito.monto_otorgado * 0.10).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

        if (credito.tipo === 'GRUPAL') {
          const { data: integrantes } = await supabase.from('integrantes_grupo').select('*').eq('credito_id', id);
          if (integrantes && integrantes.length > 0) {
            tablaIntegrantes = `
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #000; padding: 8px;">Nombre</th>
                    <th style="border: 1px solid #000; padding: 8px;">CURP</th>
                    <th style="border: 1px solid #000; padding: 8px;">Domicilio</th>
                    <th style="border: 1px solid #000; padding: 8px;">Firma</th>
                  </tr>
                </thead>
                <tbody>
                  ${integrantes.map(i => `
                    <tr>
                      <td style="border: 1px solid #000; padding: 8px;">${i.nombre_completo}</td>
                      <td style="border: 1px solid #000; padding: 8px;">${i.curp || ''}</td>
                      <td style="border: 1px solid #000; padding: 8px;">${i.domicilio || ''}</td>
                      <td style="border: 1px solid #000; padding: 15px;"></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `;
          }
        }

        // Format values
        const folio = credito.id.split('-')[0].toUpperCase();
        const fmtMontoOtorgado = Number(credito.monto_otorgado).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        const fmtTotalPagar = Number(credito.total_a_pagar).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        const fmtInteresGenerado = (Number(credito.total_a_pagar) - Number(credito.monto_otorgado)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        const fmtCuota = Number(credito.cuota_periodo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        const tasaInteres = credito.tasa_interes || 5;

        // Date formatter
        const formatDateLong = (dateStr) => {
          if (!dateStr) return '';
          // Avoid timezone shift
          const [year, month, day] = dateStr.split('T')[0].split('-');
          const d = new Date(year, month - 1, day);
          return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        };

        const fechaFirma = formatDateLong(credito.fecha_inicio);
        const fechaPrimerPago = credito.fecha_inicio ? formatDateLong(new Date(new Date(credito.fecha_inicio).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()) : '';
        
        // Calculate vencimiento
        let fechaVenc = '';
        if (credito.fecha_inicio && credito.numero_periodos) {
          const f = new Date(credito.fecha_inicio);
          if (credito.periodicidad === 'SEMANAL') {
             f.setDate(f.getDate() + (credito.numero_periodos * 7));
          } else if (credito.periodicidad === 'QUINCENAL') {
             f.setDate(f.getDate() + (credito.numero_periodos * 15));
          } else if (credito.periodicidad === 'MENSUAL') {
             f.setMonth(f.getMonth() + credito.numero_periodos);
          }
          fechaVenc = formatDateLong(f.toISOString());
        }

        const plazoStr = `${credito.numero_periodos} Pagos ${credito.periodicidad === 'SEMANAL' ? 'Semanales' : credito.periodicidad === 'QUINCENAL' ? 'Quincenales' : 'Mensuales'}`;

        // Replace variables
        finalHtml = finalHtml
          .replace(/{{folio}}/g, folio)
          .replace(/{{empresa_nombre}}/g, configEmpresa?.nombre_empresa || 'Empresa')
          .replace(/{{cliente_nombre}}/g, credito.nombre_cliente || '')
          .replace(/{{monto_otorgado}}/g, fmtMontoOtorgado)
          .replace(/{{interes_generado}}/g, fmtInteresGenerado)
          .replace(/{{monto_total_a_pagar}}/g, fmtTotalPagar)
          .replace(/{{plazo}}/g, plazoStr)
          .replace(/{{cuota_periodo}}/g, fmtCuota)
          .replace(/{{fecha_primer_pago}}/g, fechaPrimerPago)
          .replace(/{{tasa_interes}}/g, tasaInteres)
          .replace(/{{domicilio_acreditado}}/g, credito.domicilio || 'Domicilio Conocido')
          .replace(/{{fecha_vencimiento}}/g, fechaVenc)
          .replace(/{{fecha_firma}}/g, fechaFirma)
          .replace(/{{nombre_aval}}/g, credito.aval_nombre || '')
          .replace(/{{domicilio_aval}}/g, credito.aval_telefono || '')
          .replace(/{{garantia_liquida}}/g, garantiaLiquida)
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
  }, [id, configEmpresa]);

  if (loading) return <div style={{ padding: '2rem' }}>Cargando contrato...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="print-contract" style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'serif',
      lineHeight: '1.5',
      color: 'var(--text-inverse)'
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
