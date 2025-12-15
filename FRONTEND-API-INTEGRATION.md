# Frontend API Integration

## Cambios Realizados

### 1. Servicio de API (`lib/api.ts`)
- Creación de un servicio centralizado para todas las llamadas al backend
- Definición de tipos TypeScript para todas las entidades
- Manejo de errores y respuestas HTTP
- Métodos para todas las operaciones CRUD

### 2. Hook Personalizado (`hooks/useApi.ts`)
- Hook para manejar estados de carga, error y datos
- Reutilizable para cualquier llamada a la API
- Manejo automático de estados de loading y error

### 3. Componentes Actualizados

#### Dashboard (`components/dashboard/dashboard.tsx`)
- Reemplazado mocks con llamadas reales a `apiService.getMatches()` y `apiService.getDashboardStats()`
- Estados de loading y error
- Botón de actualización manual
- Manejo de datos vacíos

#### MatchDetails (`components/match-details/match-details.tsx`)
- Integración con `apiService.getMatch()`, `apiService.getMatchKills()`, `apiService.getMatchChat()`
- Funcionalidad de chat en tiempo real con `apiService.addChatMessage()`
- Eliminación de partidas con `apiService.deleteMatch()`
- Estados de loading y error para cada sección

#### HistoricalAnalytics (`components/analytics/historical-analytics.tsx`)
- Reemplazado mocks con `apiService.getHistoricalAnalytics()`
- Manejo de datos vacíos
- Estados de loading y error
- Botón de reintento

#### UploadModal (`components/upload/upload-modal.tsx`)
- Integración con `apiService.uploadDemFile()`, `apiService.uploadVideoFile()`, `apiService.processUpload()`
- Manejo de errores de upload
- Estados de progreso reales
- Validación de archivos

#### VideoUpload (`components/video-upload.tsx`)
- Integración con `apiService.uploadVideoFile()`
- Manejo de errores de upload
- Estados de progreso reales

### 4. Estado de Conexión (`components/ui/connection-status.tsx`)
- Componente para mostrar cuando el backend no está disponible
- Verificación automática cada 30 segundos
- Botón de reintento manual
- Integración con `apiService.ping()`

### 5. Configuración de Entorno
- Variable `NEXT_PUBLIC_API_URL` para configurar la URL del backend
- Por defecto apunta a `http://localhost:8080`

## Funcionalidades Implementadas

### ✅ Completadas
- [x] Listado de partidas desde el backend
- [x] Estadísticas del dashboard desde el backend
- [x] Detalles de partida con kills y chat
- [x] Análisis histórico con datos reales
- [x] Upload de archivos DEM y video
- [x] Chat en tiempo real para partidas
- [x] Eliminación de partidas
- [x] Estados de loading y error
- [x] Verificación de conexión con el backend
- [x] Manejo de errores de red

### 🔄 Pendientes
- [ ] Autenticación JWT
- [ ] WebSockets para chat en tiempo real
- [ ] Notificaciones push
- [ ] Cache de datos
- [ ] Optimización de rendimiento

## Uso

### Configuración
1. Crear archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Desarrollo
```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev
```

### Docker
```bash
# Ejecutar con Docker Compose
docker-compose up
```

## Estructura de Archivos

```
tacticore-fe-c3/
├── lib/
│   └── api.ts                 # Servicio de API
├── hooks/
│   └── useApi.ts              # Hook personalizado
├── components/
│   ├── dashboard/
│   │   └── dashboard.tsx      # Dashboard con API real
│   ├── match-details/
│   │   └── match-details.tsx  # Detalles con API real
│   ├── analytics/
│   │   └── historical-analytics.tsx  # Analytics con API real
│   ├── upload/
│   │   └── upload-modal.tsx   # Upload con API real
│   └── ui/
│       └── connection-status.tsx  # Estado de conexión
└── app/
    └── page.tsx               # Página principal actualizada
```

## Notas Técnicas

### Manejo de Errores
- Todos los componentes manejan errores de red
- Estados de loading para mejor UX
- Mensajes de error descriptivos
- Botones de reintento

### Tipos TypeScript
- Interfaces completas para todas las entidades
- Tipado estricto en todas las llamadas a la API
- Autocompletado y validación de tipos

### Performance
- Lazy loading de datos
- Estados de cache básicos
- Verificación de conexión periódica
- Manejo eficiente de re-renders

### Compatibilidad
- Funciona con el backend Java Spring Boot
- Compatible con Docker Compose
- Configuración flexible de URLs
- Fallbacks para datos faltantes
