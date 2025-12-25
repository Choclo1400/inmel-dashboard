# Estructura del Proyecto INMEL Dashboard

## Descripción General
Dashboard de gestión para INMEL con Next.js 14, React 18, TypeScript y Supabase.

## Estructura de Directorios

```
inmel-dashboard/
├── .claude/                    # Configuración de Claude Code
├── .github/
│   └── workflows/
│       └── database-backup.yml # Workflow de backup automático
├── .next/                      # Build de Next.js (ignorado)
├── .vscode/                    # Configuración de VS Code
├── app/                        # App Router de Next.js 14
│   ├── admin/                  # Páginas de administración
│   ├── api/                    # API routes
│   ├── aprobaciones/           # Gestión de aprobaciones
│   ├── auth/                   # Autenticación
│   ├── clientes/               # Gestión de clientes
│   ├── configuracion/          # Configuración del sistema
│   ├── dashboard/              # Dashboard principal
│   ├── empleador/              # Vistas de empleador
│   ├── mis-tareas/             # Tareas del usuario
│   ├── no-access/              # Página de acceso denegado
│   ├── notificaciones/         # Centro de notificaciones
│   ├── programaciones/         # Programación de servicios
│   ├── reportes/               # Reportes y análisis
│   ├── servicios/              # Catálogo de servicios
│   ├── solicitudes/            # Gestión de solicitudes
│   ├── supervisor/             # Panel de supervisor
│   ├── tecnicos/               # Gestión de técnicos
│   ├── usuarios/               # Gestión de usuarios
│   ├── error.tsx               # Página de error
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout principal
│   ├── loading.tsx             # Estado de carga
│   └── page.tsx                # Página de inicio
├── backups/                    # Backups de base de datos
│   └── RESTORE.md              # Guía de restauración
├── components/                 # Componentes React
│   ├── auth/                   # Componentes de autenticación
│   ├── calendario/             # Componentes de calendario
│   ├── clients/                # Componentes de clientes
│   ├── configuracion/          # Componentes de configuración
│   ├── layout/                 # Componentes de layout
│   ├── notifications/          # Componentes de notificaciones
│   ├── programaciones/         # Componentes de programación
│   ├── rbac/                   # Control de acceso basado en roles
│   ├── scheduling/             # Componentes de programación
│   ├── solicitudes/            # Componentes de solicitudes
│   ├── supervisor/             # Componentes de supervisor
│   ├── technicians/            # Componentes de técnicos
│   ├── ui/                     # Componentes UI reutilizables
│   ├── users/                  # Componentes de usuarios
│   ├── dashboard-content.tsx
│   ├── role-dashboards.tsx
│   └── theme-provider.tsx
├── config/                     # Configuración de la aplicación
├── hooks/                      # Custom React Hooks
├── lib/                        # Utilidades y servicios
├── node_modules/               # Dependencias (ignorado)
├── public/                     # Archivos estáticos
├── scripts/                    # Scripts de base de datos y utilidades
│   ├── database/               # Scripts de creación de tablas
│   ├── supabase/               # Scripts de configuración Supabase
│   ├── triggers/               # Scripts de triggers
│   └── README.md               # Documentación de scripts
├── services/                   # Servicios de negocio
├── types/                      # Definiciones de TypeScript
├── .env.local                  # Variables de entorno (ignorado)
├── .gitignore                  # Archivos ignorados por Git
├── components.json             # Configuración de componentes
├── middleware.ts               # Middleware de Next.js
├── next.config.mjs             # Configuración de Next.js
├── next-env.d.ts               # Tipos de Next.js
├── package.json                # Dependencias del proyecto
├── package-lock.json           # Lock de dependencias
├── postcss.config.mjs          # Configuración de PostCSS
├── PROJECT_STRUCTURE.md        # Este archivo
├── tsconfig.json               # Configuración de TypeScript
└── README.md                   # Documentación principal

```

## Tecnologías Principales

- **Framework**: Next.js 14.2.35 (App Router)
- **Frontend**: React 18.3.1, TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI, Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Formularios**: React Hook Form + Zod
- **Gráficos**: Recharts
- **Calendario**: React Big Calendar
- **Iconos**: Lucide React

## Roles del Sistema

1. **Administrador**: Acceso completo al sistema
2. **Supervisor**: Supervisión de técnicos y servicios
3. **Gestor**: Gestión de solicitudes y clientes
4. **Empleado**: Usuario básico del sistema

## Características Principales

- Dashboard adaptativo según rol
- Sistema de notificaciones en tiempo real
- Gestión de solicitudes de servicio
- Programación de técnicos
- Calendario de actividades
- Reportes mensuales
- Sistema de aprobaciones
- Control de acceso basado en roles (RBAC)

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
```

## Backups

El proyecto incluye un sistema de backup automático que se ejecuta diariamente a las 3:00 AM (hora de Chile).
Los backups se almacenan en el directorio `/backups` y se conservan por 30 días.

Ver [backups/RESTORE.md](backups/RESTORE.md) para instrucciones de restauración.

## Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Seguridad

- Row Level Security (RLS) habilitado en Supabase
- Autenticación JWT
- Validación de formularios con Zod
- Middleware de autenticación
- Control de permisos por rol

## Contribución

1. Crear una rama desde `main`
2. Realizar cambios
3. Ejecutar tests y linter
4. Crear Pull Request

## Notas Importantes

- Solo usar `npm` para gestión de dependencias
- Los archivos `.backup`, `.old`, `.tmp` están ignorados
- La carpeta `backups/` NO debe ser ignorada (contiene backups críticos)
- Todos los scripts SQL deben estar organizados en `/scripts`
