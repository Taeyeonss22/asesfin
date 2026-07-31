# MicroCréditos App

Un sistema moderno de gestión de microcréditos, diseñado para operar tanto en dispositivos de escritorio como móviles, con sincronización en tiempo real y arquitectura orientada a la nube.

## Tecnologías Utilizadas

- **Frontend:** React, Vite
- **Estilos:** Vanilla CSS (Diseño Premium, Dark Mode, Glassmorphism)
- **Backend / Base de Datos:** Supabase (PostgreSQL, Realtime, Auth, RLS)
- **Despliegue:** Preparado para Dokploy/Vercel (Dockerfile incluido)

## Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Proyecto de Supabase configurado (con su URL y Anon Key)

## Configuración y Ejecución Local

1. **Clonar el repositorio y entrar a la carpeta frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Copia el archivo `.env.example` (o crea un archivo `.env`) en la raíz del frontend y configura tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev -- --host
   ```
   La aplicación estará disponible en `http://localhost:5173` y en tu red local (necesario para probar en el móvil).

## Configuración de Supabase (Backend)

Para que la aplicación funcione, debes inicializar la base de datos en Supabase:

1. Ve a tu panel de Supabase y navega a la sección **SQL Editor**.
2. Copia el contenido del archivo de migración ubicado en `backend/supabase/migrations/20240101000000_init_microcreditos.sql`.
3. Pega y ejecuta el script en el SQL Editor de Supabase. Esto creará:
   - Las tablas necesarias (`parametros_sistema`, `perfiles`, `creditos`, `integrantes_grupo`, `pagos`).
   - Las vistas SQL para el cálculo de saldos en tiempo real (`vista_saldos_creditos`, `vista_saldos_integrantes`).
   - Habilitará **Supabase Realtime** para las tablas `creditos` y `pagos`.
   - Configurará políticas RLS permisivas iniciales (Fase 1).

## Prueba de Sincronización Multidispositivo (El Objetivo Principal)

Para probar la sincronización en tiempo real:

1. Asegúrate de iniciar la app con `--host` para que sea accesible en tu red local.
2. Abre la aplicación en tu computadora (`http://localhost:5173`).
3. Abre la aplicación en tu teléfono móvil usando la IP local de tu máquina (ej. `http://192.168.1.100:5173`).
4. Inicia sesión en ambos dispositivos.
5. Crea un crédito desde la computadora.
6. Registra un pago desde el celular y observa cómo el saldo se actualiza **instantáneamente** en la computadora, **sin recargar la página**.

Esta sincronización está respaldada 100% por Supabase Realtime y las Vistas SQL, garantizando cero estados locales desincronizados.
