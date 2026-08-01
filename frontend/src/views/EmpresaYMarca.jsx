import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Save, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EmpresaYMarca() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('configuracion_empresa').select('*').limit(1).single();
    if (data) setConfig(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploadingLogo(true);
      toast.loading("Subiendo logotipo...", { id: 'upload-logo' });

      // Upload to Supabase Storage bucket 'logos'
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Update state
      setConfig({ ...config, logo_url: publicUrl });
      toast.success("Logotipo subido. No olvides Guardar Cambios.", { id: 'upload-logo' });
    } catch (error) {
      console.error(error);
      toast.error("Error al subir el logotipo: " + error.message, { id: 'upload-logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    if (config?.id) {
      const { error } = await supabase.from('configuracion_empresa').update(config).eq('id', config.id);
      if (error) {
        setMessage('Error al guardar: ' + error.message);
        toast.error('Error al guardar configuración');
      } else {
        setMessage('Configuración guardada correctamente.');
        toast.success('Configuración guardada correctamente');
      }
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="p-4 text-muted">Cargando configuración...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div className="flex items-center gap-2 mb-6">
        <Building2 size={24} className="text-primary" />
        <h1 style={{ margin: 0 }}>Empresa y Marca</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Logo */}
        <div className="solid-card text-center flex flex-col items-center justify-center">
          <h4 className="mb-4 text-muted">LOGOTIPO EMPRESA</h4>
          
          <div className="mb-6" style={{ width: '150px', height: '150px', border: '2px dashed var(--border-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
            {config?.logo_url ? (
              <img src={config.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <span className="text-muted text-sm">Sin logotipo</span>
            )}
          </div>
          
          <div>
            <input 
              type="file" 
              id="logo-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleLogoUpload} 
              disabled={uploadingLogo}
            />
            <label htmlFor="logo-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> 
              {uploadingLogo ? 'Subiendo...' : 'Subir Logotipo'}
            </label>
          </div>
        </div>

        {/* Columna Derecha: Información */}
        <div className="solid-card md:col-span-2">
          <h3 className="mb-4">Información General</h3>
          <p className="text-muted text-sm mb-6">
            Estos datos aparecerán en los tickets impresos, contratos y en la cabecera de la plataforma.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label>Nombre de la Empresa o Razón Social</label>
              <input 
                type="text" 
                name="nombre_empresa" 
                className="form-control" 
                value={config?.nombre_empresa || ''} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group sm:col-span-2">
              <label>Eslogan o Subtítulo (Opcional)</label>
              <input 
                type="text" 
                name="eslogan" 
                className="form-control" 
                placeholder="Ej. Creciendo Juntos"
                value={config?.eslogan || ''} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>R.U.C</label>
            <input 
              type="text" 
              name="ruc" 
              className="form-control" 
              value={config?.ruc || ''} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Propietario</label>
            <input 
              type="text" 
              name="propietario" 
              className="form-control" 
              value={config?.propietario || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              name="email" 
              className="form-control" 
              value={config?.email || ''} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono</label>
            <input 
              type="text" 
              name="telefono" 
              className="form-control" 
              value={config?.telefono || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Ciudad</label>
            <input 
              type="text" 
              name="ciudad" 
              className="form-control" 
              value={config?.ciudad || ''} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="form-group">
            <label>Sitio Web</label>
            <input 
              type="text" 
              name="sitio_web" 
              className="form-control" 
              value={config?.sitio_web || ''} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="form-group mb-6">
          <label>Dirección Oficial</label>
          <input 
            type="text" 
            name="direccion" 
            className="form-control" 
            value={config?.direccion || ''} 
            onChange={handleChange} 
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
          </button>
          {message && (
            <span className={message.includes('Error') ? 'text-danger' : 'text-success'}>
              {message}
            </span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
