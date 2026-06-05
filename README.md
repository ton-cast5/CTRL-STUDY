# Ctrl+Study

Plataforma EdTech que conecta tutores DACYTI con estudiantes UJAT.

## Funcionalidades

- Registro e inicio de sesión por matrícula (tutor / estudiante)
- Alta de tutor con materias
- Solicitudes de asesoría (alumno → tutor)
- Aceptación de solicitudes y chat en tiempo real
- Estado en línea de tutores
- Recursos, agenda y progreso con Supabase

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase
npm run dev
```

## Base de datos (Supabase)

1. Ejecuta `supabase/setup.sql` (primera vez)
2. Ejecuta `supabase/upgrade-v2.sql` (solicitudes, mensajes, auth)

Verifica conexión:

```bash
npm run db:setup
```

## Deploy en Vercel

1. Sube el repo a GitHub: [ton-cast5/CTRL-STUDY](https://github.com/ton-cast5/CTRL-STUDY)
2. En [Vercel](https://vercel.com), importa el repositorio
3. Framework: **Vite** (detectado automáticamente)
4. Agrega variables de entorno:

| Variable | Valor |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | tu publishable key |

5. Deploy

El archivo `vercel.json` ya incluye el rewrite SPA para React Router / rutas del cliente.

## Cuentas demo (después de setup.sql)

| Rol | Matrícula | Contraseña |
|-----|-----------|------------|
| Tutor | 2020001001 | 123456 |
| Estudiante | 2023001234 | 123456 |

## Build

```bash
npm run build
npm run preview
```
