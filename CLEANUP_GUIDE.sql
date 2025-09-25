-- ============================================================================
-- CLEANUP: Remover archivos complejos, mantener solo MVP-Lite esencial
-- ============================================================================

-- Este archivo documenta qué mantener y qué remover del sistema enterprise
-- Usuario pidió: "bajemos la ambición y dejemos un MVP-Lite sólido y fácil de mantener"

-- ============================================================================
-- MANTENER (MVP-Lite Core)
-- ============================================================================

/*
✅ MANTENER - Archivos esenciales MVP-Lite:

1. SCHEMA PRINCIPAL:
   - scripts/009_mvp_lite_scheduling.sql ← USAR ESTE
   
2. SERVICIO SIMPLIFICADO:
   - lib/services/scheduling-lite.ts ← LISTO Y FUNCIONAL
   
3. COMPONENTES BÁSICOS (una vez resuelto TypeScript):
   - components/scheduling/simple-calendar.tsx
   - components/scheduling/daily-availability.tsx
   
4. PÁGINA INTEGRADA:
   - app/scheduling-mvp/page.tsx

5. CONFIGURACIÓN BASE:
   - package.json (con dependencias mínimas)
   - tsconfig.json
   - next.config.mjs
*/

-- ============================================================================
-- REMOVER / ARCHIVAR (Enterprise System - Demasiado complejo para MVP)
-- ============================================================================

/*
❌ REMOVER - Archivos enterprise complejos:

1. SCHEMA COMPLEJO:
   - scripts/008_audit_and_events.sql ← ENTERPRISE (archivar)
   
2. EDGE FUNCTIONS:
   - supabase/functions/availability/index.ts ← COMPLEJO
   - supabase/functions/suggest/index.ts ← COMPLEJO  
   - supabase/functions/bookings-patch/index.ts ← COMPLEJO
   - supabase/functions/outbox-dispatcher/index.ts ← COMPLEJO
   
3. COMPONENTES COMPLEJOS:
   - components/scheduling/planner-board.tsx ← ENTERPRISE
   
4. DOCUMENTACIÓN ENTERPRISE:
   - supabase/DEPLOYMENT.md ← ENTERPRISE SPECIFIC
   - supabase/IMPLEMENTATION_GUIDE.md ← ENTERPRISE SPECIFIC
*/

-- ============================================================================
-- ESTADO ACTUAL MVP-Lite
-- ============================================================================

/*
✅ COMPLETADO:
- SQL Schema simplificado con GIST anti-overlap constraint
- Servicio CRUD básico sin Edge Functions  
- Funciones de disponibilidad en cliente
- Detección automática de conflictos
- RLS policies simples

🔄 EN PROGRESO:
- Componentes React (problemas TypeScript)
- FullCalendar integration (dependency issues)

📋 PRÓXIMOS PASOS RECOMENDADOS:
1. Resolver configuración TypeScript/React
2. Migrar SQL: scripts/009_mvp_lite_scheduling.sql
3. Probar servicio: lib/services/scheduling-lite.ts  
4. Implementar UI simple (puede usar server components)
5. Testing anti-overlap constraint

🎯 ARQUITECTURA FINAL MVP-Lite:
- Supabase DB + Single GIST constraint (bulletproof anti-overlap)
- Simple service layer (no Edge Functions)
- Basic React components (or server components)
- Future-ready para FullCalendar cuando esté estable
*/

-- ============================================================================
-- COMANDO PARA MIGRACIÓN
-- ============================================================================

-- Para implementar MVP-Lite:
-- 1. Ejecutar: psql -d database_name -f scripts/009_mvp_lite_scheduling.sql
-- 2. Verificar constraint: SELECT * FROM pg_constraint WHERE conname = 'booking_time_overlap';
-- 3. Probar servicio: import functions from lib/services/scheduling-lite.ts
-- 4. Deploy página: app/scheduling-mvp/page.tsx

-- ============================================================================
-- NOTAS DE MANTENIMIENTO
-- ============================================================================

/*
VENTAJAS MVP-Lite vs Enterprise:
✅ Menos dependencias externas
✅ Debugging más fácil (todo en cliente/service)
✅ Sin Edge Functions complex deployment
✅ Anti-overlap garantizado por DB constraint
✅ Expandible cuando sea necesario

ENTERPRISE SYSTEM DISPONIBLE:
- Si en el futuro necesitan el sistema complejo, está en scripts/008
- Incluye auditoría completa, outbox pattern, notifications
- Edge Functions ready para Teams-like functionality
- Pero para MVP-Lite, demasiado complex
*/