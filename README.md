# 🎮 TACTICORE - Counter Strike Match Analysis Frontend

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

Frontend moderno y responsive para análisis de partidas de Counter-Strike. Permite subir archivos `.dem`, analizar estadísticas de gameplay, visualizar kills en mapas interactivos y realizar seguimiento de rendimiento histórico.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Desarrollo Local](#-desarrollo-local)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Integración con Backend](#-integración-con-backend)
- [Docker](#-docker)
- [Deployment](#-deployment)
- [Características Principales](#-características-principales)

## ✨ Características

### 🎯 Funcionalidades Principales

- **📤 Subida de Archivos**: Upload de archivos `.dem` con soporte opcional para videos complementarios
- **📊 Dashboard Interactivo**: Vista general de todas las partidas con estadísticas agregadas
- **🗺️ Visualización de Mapas**: Mapas interactivos con visualización de kills en tiempo real
- **📈 Análisis Histórico**: Gráficos y tendencias de rendimiento a lo largo del tiempo
- **💬 Chat de Análisis**: Bot integrado con ChatGPT para análisis personalizado de partidas
- **👤 Gestión de Usuarios**: Perfiles de usuario con estadísticas detalladas
- **🔍 Comparación de Usuarios**: Herramientas para comparar rendimiento entre jugadores
- **🌓 Tema Oscuro**: Interfaz gaming con branding TACTICORE
- **📱 Diseño Responsive**: Optimizado para desktop, tablet y móvil

### 🎨 UI/UX

- Interfaz moderna inspirada en gaming
- Componentes reutilizables con Radix UI
- Animaciones suaves con TailwindCSS
- Tema oscuro por defecto
- Estados de carga y manejo de errores
- Indicadores de conexión con el backend

## 🛠️ Stack Tecnológico

### Core
- **Next.js 15.2**: Framework React con App Router
- **React 19**: Librería UI
- **TypeScript 5**: Tipado estático
- **TailwindCSS 4.1**: Framework CSS utility-first

### UI Components
- **Radix UI**: Componentes accesibles y primitivos
- **Lucide React**: Iconos
- **Recharts**: Gráficos y visualizaciones
- **Sonner**: Notificaciones toast

### Utilidades
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **date-fns**: Manipulación de fechas
- **class-variance-authority**: Variantes de componentes

### Herramientas de Desarrollo
- **ESLint**: Linting
- **PostCSS**: Procesamiento de CSS
- **pnpm**: Gestor de paquetes

## 📦 Prerrequisitos

- **Node.js**: 18.x o superior
- **pnpm**: 8.x o superior (recomendado) o npm/yarn
- **Backend API**: Tacticore Backend corriendo (ver repositorio backend)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Fgeorgescu/tacticore-fe-c3.git
cd tacticore-fe-c3
```

### 2. Instalar dependencias

```bash
# Con pnpm (recomendado)
pnpm install

# Con npm
npm install

# Con yarn
yarn install
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:8080

# OpenAI API Key (para ChatGPT integration)
NEXT_PUBLIC_OPENAI_API_KEY=tu_api_key_aqui

# Configuración de ChatGPT (opcional)
NEXT_PUBLIC_CHATGPT_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_CHATGPT_MAX_TOKENS=300
NEXT_PUBLIC_CHATGPT_TEMPERATURE=0.7

# Usar datos mock en desarrollo (opcional)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Configuración del Backend

Asegúrate de que el backend esté corriendo en `http://localhost:8080` o actualiza `NEXT_PUBLIC_API_URL` según corresponda.

## 💻 Desarrollo Local

### Iniciar servidor de desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Hot Reload

Next.js incluye hot reload automático. Los cambios en el código se reflejan inmediatamente en el navegador.

### Verificar conexión con Backend

El frontend incluye un componente `ConnectionStatus` que verifica automáticamente la conexión con el backend cada 30 segundos. Si el backend no está disponible, mostrará un mensaje de advertencia.

## 📜 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo en http://localhost:3000

# Producción
pnpm build            # Construye la aplicación para producción
pnpm start            # Inicia servidor de producción (requiere build previo)

# Calidad de código
pnpm lint             # Ejecuta ESLint para verificar código
```

## 📁 Estructura del Proyecto

```
tacticore-fe-c3/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   │   └── chat/          # Endpoint de chat
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   ├── loading.tsx        # Componente de carga
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── analytics/         # Componentes de análisis
│   ├── chat/              # Componentes de chat
│   ├── comparison/        # Comparación de usuarios
│   ├── dashboard/         # Dashboard principal
│   ├── layout/            # Componentes de layout
│   ├── match-details/     # Detalles de partida
│   ├── upload/            # Upload de archivos
│   └── ui/                # Componentes UI reutilizables
├── contexts/              # Contextos de React
│   └── UserContext.tsx    # Contexto de usuario
├── hooks/                 # Custom hooks
│   ├── useApi.ts         # Hook para llamadas API
│   └── useUserValidation.ts
├── lib/                   # Utilidades y servicios
│   ├── api.ts            # Cliente API centralizado
│   ├── chatgpt.ts        # Servicio de ChatGPT
│   ├── dateUtils.ts      # Utilidades de fecha
│   ├── killDataMapper.ts # Mapeo de datos de kills
│   ├── mockData.ts       # Datos mock para desarrollo
│   └── utils.ts          # Utilidades generales
├── public/                # Archivos estáticos
│   ├── maps/             # Imágenes de mapas CS2
│   └── *.png, *.svg      # Assets estáticos
├── Dockerfile             # Configuración Docker
├── next.config.mjs       # Configuración Next.js
├── package.json           # Dependencias y scripts
├── postcss.config.mjs     # Configuración PostCSS
├── tsconfig.json          # Configuración TypeScript
└── README.md              # Este archivo
```

## 🔌 Integración con Backend

El frontend se comunica con el backend a través de un servicio API centralizado (`lib/api.ts`). Todas las llamadas al backend se realizan a través de este servicio.

### Endpoints Principales

- `GET /api/matches` - Lista de partidas
- `GET /api/matches/:id` - Detalles de partida
- `GET /api/matches/:id/kills` - Kills de una partida
- `GET /api/matches/:id/chat` - Mensajes de chat
- `POST /api/matches/:id/chat` - Enviar mensaje
- `POST /api/upload/dem` - Subir archivo .dem
- `POST /api/upload/video` - Subir video
- `GET /api/analytics/historical` - Análisis histórico
- `GET /api/dashboard/stats` - Estadísticas del dashboard
- `GET /api/users/:username` - Perfil de usuario

### Manejo de Errores

El servicio API incluye manejo automático de errores y fallback a datos mock si el backend no está disponible (cuando `NEXT_PUBLIC_USE_MOCK_DATA=true`).

### Estados de Carga

Todos los componentes principales incluyen estados de carga y manejo de errores para mejorar la experiencia del usuario.

## 🐳 Docker

### Construir imagen Docker

```bash
docker build -t tacticore-frontend .
```

### Ejecutar contenedor

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8080 \
  tacticore-frontend
```

### Docker Compose

El proyecto incluye un `docker-compose.yml` en el repositorio raíz que levanta frontend, backend y servicios de ML juntos.

```bash
docker-compose up
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Vercel detectará automáticamente Next.js y desplegará

### Variables de Entorno en Producción

Asegúrate de configurar:
- `NEXT_PUBLIC_API_URL`: URL del backend en producción
- `NEXT_PUBLIC_OPENAI_API_KEY`: API key de OpenAI (si usas ChatGPT)

### Build de Producción

```bash
pnpm build
pnpm start
```

## 🎯 Características Principales

### Dashboard

- Vista general de todas las partidas
- Estadísticas agregadas (kills, deaths, KDR, score promedio)
- Filtros por mapa, tipo de juego y fecha
- Actualización manual de datos

### Detalles de Partida

- Timeline de kills con información detallada
- Visualización en mapa 2D interactivo
- Análisis por ronda
- Chat integrado con bot de análisis
- Información de armas y posiciones

### Análisis Histórico

- Gráficos de tendencias de rendimiento
- Métricas de kills, deaths, KDR a lo largo del tiempo
- Análisis de buenas y malas jugadas
- Comparación de métricas

### Upload de Archivos

- Drag & drop para archivos .dem
- Upload opcional de videos complementarios
- Progreso de upload en tiempo real
- Validación de archivos

### Chat de Análisis

- Bot integrado con ChatGPT
- Análisis personalizado basado en estadísticas de partida
- Preguntas sugeridas
- Respuestas contextuales

## 📚 Documentación Adicional

- **API Integration**: Ver `lib/api.ts` para detalles de integración con el backend
- **Componentes**: Ver carpeta `components/` para componentes reutilizables
- **Hooks**: Ver carpeta `hooks/` para custom hooks

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es parte de TACTICORE, una aplicación de análisis de partidas de Counter-Strike.

## 🔗 Enlaces

- [Backend Repository](https://github.com/Fgeorgescu/tacticore-backend)
- [ML Service Repository](https://github.com/Fgeorgescu/tesis/tree/main/Tacticore)

## 📞 Soporte

Para problemas o preguntas, abre un issue en el repositorio de GitHub.

---

Desarrollado con ❤️ para la comunidad de Counter-Strike
