-- Añadir campos extra para la información general y social de la empresa
ALTER TABLE configuracion_empresa
  ADD COLUMN IF NOT EXISTS ruc TEXT,
  ADD COLUMN IF NOT EXISTS propietario TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS ciudad TEXT,
  ADD COLUMN IF NOT EXISTS sitio_web TEXT;

-- Actualizar la única fila con los datos de ASES por defecto si están vacíos
UPDATE configuracion_empresa
SET 
  nombre_empresa = 'ASES',
  ruc = 'RUGT860128HI7',
  propietario = 'TOMAS RUBI GARCIA',
  email = 'ases.tepe@gmail.com',
  telefono = '5513283983',
  ciudad = 'Tepetlixpa',
  sitio_web = 'ases-fin.com',
  direccion = 'C. DEL ESTUDIANTE 30, TEPETLIXPA 56880 EDO. MEX.'
WHERE id = (SELECT id FROM configuracion_empresa LIMIT 1);
