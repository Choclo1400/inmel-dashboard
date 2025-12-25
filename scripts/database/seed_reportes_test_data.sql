-- ============================================================================
-- DATOS DE PRUEBA PARA REPORTES
-- MES 1: OCTUBRE 2024 (30 solicitudes)
-- MES 2: NOVIEMBRE 2024 (35 solicitudes)
-- ============================================================================

-- Primero, obtener un usuario existente para usar como creador
-- Ejecutar esto primero para obtener el ID:
-- SELECT id FROM profiles LIMIT 1;

-- Variable para el usuario creador (reemplazar con un ID real de tu sistema)
-- Puedes obtenerlo con: SELECT id, email FROM profiles LIMIT 5;

DO $$
DECLARE
  v_user_id UUID;
  v_tecnico_id UUID;
  v_cliente_id UUID;
  i INTEGER;
BEGIN
  -- Obtener un usuario para asignar como creador
  SELECT id INTO v_user_id FROM profiles LIMIT 1;
  
  -- Obtener un técnico (si existe)
  SELECT id INTO v_tecnico_id FROM profiles WHERE rol = 'Empleado' LIMIT 1;
  IF v_tecnico_id IS NULL THEN
    v_tecnico_id := v_user_id;
  END IF;
  
  -- Obtener un cliente (si existe)  
  SELECT id INTO v_cliente_id FROM clients LIMIT 1;

  -- ============================================================================
  -- MES 1: OCTUBRE 2024 (30 solicitudes)
  -- ============================================================================
  
  -- Pendiente: 5 solicitudes
  FOR i IN 1..5 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion, 
      estado, prioridad, creado_por, cliente_id,
      fecha_creacion, created_at, updated_at
    ) VALUES (
      'OCT-2024-P' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 3 = 0 THEN 'Instalación' WHEN i % 3 = 1 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Octubre 2024 - Pendiente #' || i,
      'Av. Providencia ' || (1000 + i * 10) || ', Santiago',
      'Pendiente',
      CASE WHEN i = 1 THEN 'Crítica' WHEN i <= 3 THEN 'Alta' ELSE 'Media' END,
      v_user_id,
      v_cliente_id,
      '2024-10-' || LPAD((i * 5)::TEXT, 2, '0'),
      '2024-10-' || LPAD((i * 5)::TEXT, 2, '0') || ' 09:00:00',
      '2024-10-' || LPAD((i * 5)::TEXT, 2, '0') || ' 09:00:00'
    );
  END LOOP;

  -- Aprobada: 10 solicitudes
  FOR i IN 1..10 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, created_at, updated_at
    ) VALUES (
      'OCT-2024-A' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 4 = 0 THEN 'Instalación' WHEN i % 4 = 1 THEN 'Mantención' WHEN i % 4 = 2 THEN 'Reparación' ELSE 'Inspección' END,
      'Solicitud de prueba Octubre 2024 - Aprobada #' || i,
      'Calle Las Condes ' || (500 + i * 20) || ', Las Condes',
      'Aprobada',
      CASE WHEN i <= 2 THEN 'Crítica' WHEN i <= 5 THEN 'Alta' WHEN i <= 8 THEN 'Media' ELSE 'Baja' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0'),
      '2024-10-' || LPAD(LEAST(i * 2 + 5, 30)::TEXT, 2, '0'),
      '2024-10-' || LPAD((i * 2 + 1)::TEXT, 2, '0') || ' 10:00:00',
      '2024-10-' || LPAD((i * 2 + 2)::TEXT, 2, '0') || ' 14:00:00'
    );
  END LOOP;

  -- En Progreso: 4 solicitudes (estas serían las "Programadas" + En Progreso = 8 + 4 = 12, pero usamos En Progreso)
  FOR i IN 1..4 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, programada, created_at, updated_at
    ) VALUES (
      'OCT-2024-EP' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 2 = 0 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Octubre 2024 - En Progreso #' || i,
      'Av. Apoquindo ' || (2000 + i * 100) || ', Las Condes',
      'En Progreso',
      CASE WHEN i = 1 THEN 'Crítica' WHEN i = 2 THEN 'Alta' ELSE 'Media' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-10-' || LPAD((i * 3)::TEXT, 2, '0'),
      '2024-10-' || LPAD(LEAST(i * 3 + 7, 31)::TEXT, 2, '0'),
      true,
      '2024-10-' || LPAD((i * 3)::TEXT, 2, '0') || ' 08:30:00',
      '2024-10-' || LPAD((i * 3 + 3)::TEXT, 2, '0') || ' 16:00:00'
    );
  END LOOP;

  -- Solicitudes Programadas (Aprobadas con programada=true): 8 solicitudes
  FOR i IN 1..8 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, programada, created_at, updated_at
    ) VALUES (
      'OCT-2024-PR' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 3 = 0 THEN 'Instalación' WHEN i % 3 = 1 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Octubre 2024 - Programada #' || i,
      'Av. Vitacura ' || (3000 + i * 50) || ', Vitacura',
      'Aprobada',
      CASE WHEN i <= 2 THEN 'Alta' WHEN i <= 5 THEN 'Media' ELSE 'Baja' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-10-' || LPAD((i * 2 + 5)::TEXT, 2, '0'),
      '2024-10-' || LPAD(LEAST(i * 2 + 10, 31)::TEXT, 2, '0'),
      true,
      '2024-10-' || LPAD((i * 2 + 5)::TEXT, 2, '0') || ' 11:00:00',
      '2024-10-' || LPAD((i * 2 + 6)::TEXT, 2, '0') || ' 15:00:00'
    );
  END LOOP;

  -- Completada: 2 solicitudes
  FOR i IN 1..2 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, programada, created_at, updated_at
    ) VALUES (
      'OCT-2024-C' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i = 1 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Octubre 2024 - Completada #' || i,
      'Calle Ñuñoa ' || (100 + i * 50) || ', Ñuñoa',
      'Completada',
      'Media',
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-10-0' || i,
      '2024-10-' || LPAD((i + 5)::TEXT, 2, '0'),
      true,
      '2024-10-0' || i || ' 09:00:00',
      '2024-10-' || LPAD((i + 4)::TEXT, 2, '0') || ' 17:00:00'
    );
  END LOOP;

  -- Rechazada: 1 solicitud
  INSERT INTO solicitudes (
    numero_solicitud, tipo_trabajo, descripcion, direccion,
    estado, prioridad, creado_por, cliente_id,
    fecha_creacion, created_at, updated_at
  ) VALUES (
    'OCT-2024-R001',
    'Instalación',
    'Solicitud de prueba Octubre 2024 - Rechazada #1 (información incompleta)',
    'Calle Santiago Centro 500, Santiago',
    'Rechazada',
    'Baja',
    v_user_id,
    v_cliente_id,
    '2024-10-15',
    '2024-10-15 10:00:00',
    '2024-10-16 11:00:00'
  );

  -- ============================================================================
  -- MES 2: NOVIEMBRE 2024 (35 solicitudes)
  -- ============================================================================

  -- Pendiente: 3 solicitudes
  FOR i IN 1..3 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, cliente_id,
      fecha_creacion, created_at, updated_at
    ) VALUES (
      'NOV-2024-P' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i = 1 THEN 'Instalación' WHEN i = 2 THEN 'Mantención' ELSE 'Inspección' END,
      'Solicitud de prueba Noviembre 2024 - Pendiente #' || i,
      'Av. Libertador Bernardo OHiggins ' || (800 + i * 100) || ', Santiago',
      'Pendiente',
      CASE WHEN i = 1 THEN 'Alta' ELSE 'Media' END,
      v_user_id,
      v_cliente_id,
      '2024-11-' || LPAD((i * 8)::TEXT, 2, '0'),
      '2024-11-' || LPAD((i * 8)::TEXT, 2, '0') || ' 09:30:00',
      '2024-11-' || LPAD((i * 8)::TEXT, 2, '0') || ' 09:30:00'
    );
  END LOOP;

  -- Aprobada: 12 solicitudes
  FOR i IN 1..12 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, created_at, updated_at
    ) VALUES (
      'NOV-2024-A' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 4 = 0 THEN 'Instalación' WHEN i % 4 = 1 THEN 'Mantención' WHEN i % 4 = 2 THEN 'Reparación' ELSE 'Inspección' END,
      'Solicitud de prueba Noviembre 2024 - Aprobada #' || i,
      'Av. Pedro de Valdivia ' || (100 + i * 30) || ', Providencia',
      'Aprobada',
      CASE WHEN i <= 3 THEN 'Crítica' WHEN i <= 7 THEN 'Alta' WHEN i <= 10 THEN 'Media' ELSE 'Baja' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-11-' || LPAD((i * 2)::TEXT, 2, '0'),
      '2024-11-' || LPAD(LEAST(i * 2 + 3, 30)::TEXT, 2, '0'),
      '2024-11-' || LPAD((i * 2)::TEXT, 2, '0') || ' 10:00:00',
      '2024-11-' || LPAD((i * 2 + 1)::TEXT, 2, '0') || ' 12:00:00'
    );
  END LOOP;

  -- Solicitudes Programadas: 10 solicitudes
  FOR i IN 1..10 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, programada, created_at, updated_at
    ) VALUES (
      'NOV-2024-PR' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 3 = 0 THEN 'Instalación' WHEN i % 3 = 1 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Noviembre 2024 - Programada #' || i,
      'Calle Tobalaba ' || (400 + i * 40) || ', Providencia',
      'Aprobada',
      CASE WHEN i <= 3 THEN 'Alta' WHEN i <= 7 THEN 'Media' ELSE 'Baja' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-11-' || LPAD((i + 2)::TEXT, 2, '0'),
      '2024-11-' || LPAD(LEAST(i + 7, 30)::TEXT, 2, '0'),
      true,
      '2024-11-' || LPAD((i + 2)::TEXT, 2, '0') || ' 08:00:00',
      '2024-11-' || LPAD((i + 3)::TEXT, 2, '0') || ' 14:00:00'
    );
  END LOOP;

  -- En Progreso: 6 solicitudes
  FOR i IN 1..6 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, programada, created_at, updated_at
    ) VALUES (
      'NOV-2024-EP' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i % 2 = 0 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Noviembre 2024 - En Progreso #' || i,
      'Av. El Bosque Norte ' || (200 + i * 50) || ', Las Condes',
      'En Progreso',
      CASE WHEN i <= 2 THEN 'Crítica' WHEN i <= 4 THEN 'Alta' ELSE 'Media' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-11-' || LPAD((i * 3)::TEXT, 2, '0'),
      '2024-11-' || LPAD(LEAST(i * 3 + 5, 30)::TEXT, 2, '0'),
      true,
      '2024-11-' || LPAD((i * 3)::TEXT, 2, '0') || ' 07:30:00',
      '2024-11-' || LPAD((i * 3 + 2)::TEXT, 2, '0') || ' 18:00:00'
    );
  END LOOP;

  -- Completada: 3 solicitudes
  FOR i IN 1..3 LOOP
    INSERT INTO solicitudes (
      numero_solicitud, tipo_trabajo, descripcion, direccion,
      estado, prioridad, creado_por, tecnico_asignado_id, cliente_id,
      fecha_creacion, fecha_estimada, programada, created_at, updated_at
    ) VALUES (
      'NOV-2024-C' || LPAD(i::TEXT, 3, '0'),
      CASE WHEN i = 1 THEN 'Instalación' WHEN i = 2 THEN 'Mantención' ELSE 'Reparación' END,
      'Solicitud de prueba Noviembre 2024 - Completada #' || i,
      'Calle Isidora Goyenechea ' || (2800 + i * 10) || ', Las Condes',
      'Completada',
      CASE WHEN i = 1 THEN 'Alta' ELSE 'Media' END,
      v_user_id,
      v_tecnico_id,
      v_cliente_id,
      '2024-11-0' || i,
      '2024-11-' || LPAD((i + 3)::TEXT, 2, '0'),
      true,
      '2024-11-0' || i || ' 09:00:00',
      '2024-11-' || LPAD((i + 2)::TEXT, 2, '0') || ' 16:30:00'
    );
  END LOOP;

  -- Rechazada: 1 solicitud
  INSERT INTO solicitudes (
    numero_solicitud, tipo_trabajo, descripcion, direccion,
    estado, prioridad, creado_por, cliente_id,
    fecha_creacion, created_at, updated_at
  ) VALUES (
    'NOV-2024-R001',
    'Inspección',
    'Solicitud de prueba Noviembre 2024 - Rechazada #1 (fuera de cobertura)',
    'Calle Fuera de Zona 1000, Región',
    'Rechazada',
    'Baja',
    v_user_id,
    v_cliente_id,
    '2024-11-20',
    '2024-11-20 11:00:00',
    '2024-11-21 09:00:00'
  );

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Datos de prueba insertados exitosamente';
  RAISE NOTICE '   - Octubre 2024: 30 solicitudes';
  RAISE NOTICE '   - Noviembre 2024: 35 solicitudes';
  RAISE NOTICE '   - Total: 65 solicitudes';
  RAISE NOTICE '============================================';

END $$;

-- ============================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- ============================================================================

-- Resumen por mes y estado
SELECT 
  TO_CHAR(fecha_creacion, 'YYYY-MM') as mes,
  estado,
  COUNT(*) as cantidad
FROM solicitudes
WHERE fecha_creacion >= '2024-10-01' AND fecha_creacion < '2024-12-01'
GROUP BY TO_CHAR(fecha_creacion, 'YYYY-MM'), estado
ORDER BY mes, estado;

-- Total por mes
SELECT 
  TO_CHAR(fecha_creacion, 'YYYY-MM') as mes,
  COUNT(*) as total_solicitudes
FROM solicitudes
WHERE fecha_creacion >= '2024-10-01' AND fecha_creacion < '2024-12-01'
GROUP BY TO_CHAR(fecha_creacion, 'YYYY-MM')
ORDER BY mes;
