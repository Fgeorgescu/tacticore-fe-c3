# 🤖 Integración ChatGPT - TACTICORE Bot

## 📋 Descripción

Se ha integrado un bot de ChatGPT directamente en el frontend que puede analizar partidas de Counter-Strike y dar consejos personalizados basados en las estadísticas de cada partida.

## 🚀 Características

- **Análisis personalizado**: El bot analiza cada partida específica
- **Contexto rico**: Incluye kills, deaths, K/D ratio, score, buenas/malas jugadas
- **Respuestas inteligentes**: Usa GPT-3.5-turbo para generar respuestas contextuales
- **Interfaz integrada**: Chat nativo en la vista de detalles de partida
- **Sugerencias**: Preguntas predefinidas para facilitar el uso

## ⚙️ Configuración

### 1. Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Copia la key generada

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto frontend:

una ```bash
# Copia el archivo de ejemplo
cp .env.example .env.local

# Edita el archivo con tus credenciales reales
nano .env.local
\`\`\`

Contenido del archivo `.env.local`:

\`\`\`bash
# API del backend
NEXT_PUBLIC_API_URL=http://localhost:8080

# OpenAI API Key
NEXT_PUBLIC_OPENAI_API_KEY=tu_api_key_aqui

# Configuración de ChatGPT (opcional)
NEXT_PUBLIC_CHATGPT_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_CHATGPT_MAX_TOKENS=300
NEXT_PUBLIC_CHATGPT_TEMPERATURE=0.7
\`\`\`

### 3. Reiniciar Servicios

\`\`\`bash
docker-compose down
docker-compose up --build -d
\`\`\`

## 🎯 Uso del Bot

### Acceder al Chat

1. Ve al dashboard de partidas
2. Haz clic en el ícono del ojo de cualquier partida
3. En la vista de detalles, encontrarás el "Chat de Análisis"
4. El bot estará disponible automáticamente

### Ejemplos de Preguntas

- **Mejora de rendimiento**: "¿Cómo puedo mejorar mi K/D ratio?"
- **Análisis de armas**: "¿Qué arma debería usar más?"
- **Posicionamiento**: "¿Cómo mejorar mi posicionamiento en el mapa?"
- **Errores**: "¿Qué errores debo evitar?"
- **Estrategia**: "¿Qué estrategias me recomiendas para este mapa?"

### Respuestas del Bot

El bot proporcionará:
- Análisis específico basado en tus estadísticas
- Consejos prácticos y accionables
- Sugerencias de mejora personalizadas
- Explicaciones de métricas y términos técnicos

## 🔧 Arquitectura Técnica

### Flujo de Datos

\`\`\`
Frontend Chat → ChatGPT Service → OpenAI API
     ↓
Match Context (kills, deaths, score, etc.)
     ↓
Personalized Response
\`\`\`

### Componentes Principales

1. **`lib/chatgpt.ts`**: Servicio principal de ChatGPT
2. **`components/chat/bot-chat.tsx`**: Componente de chat con bot
3. **`components/match-details/match-details.tsx`**: Integración en vista de partida

### Contexto de Partida

El bot recibe automáticamente:
- Mapa jugado
- Número de kills y deaths
- K/D ratio calculado
- Score de la partida (1-10)
- Buenas y malas jugadas
- Duración de la partida
- Tipo de juego (Ranked, Casual, etc.)

## 🛡️ Consideraciones de Seguridad

### Desarrollo vs Producción

**Desarrollo (Actual)**:
- API key expuesta en el frontend
- Ideal para testing y desarrollo rápido
- Sin control de costos

**Producción (Recomendado)**:
- API key protegida en el backend
- Control de costos y rate limiting
- Contexto enriquecido con datos del servidor

### Migración Futura

Para migrar a producción:
1. Mover lógica al backend
2. Crear endpoint `/api/chatgpt/proxy`
3. Proteger API key en variables de servidor
4. Implementar rate limiting

## 📊 Monitoreo y Costos

### Control de Costos

- **Modelo**: GPT-3.5-turbo (más económico)
- **Tokens máximos**: 300 por respuesta
- **Temperatura**: 0.7 (balance creatividad/precisión)

### Estimación de Costos

- ~$0.002 por 1K tokens
- Respuesta promedio: ~200 tokens
- Costo por consulta: ~$0.0004

## 🐛 Troubleshooting

### Bot No Responde

1. Verificar que la API key esté configurada
2. Revisar la consola del navegador para errores
3. Confirmar que el backend esté funcionando

### Respuestas Genéricas

1. Verificar que el contexto de la partida se esté enviando
2. Revisar el prompt del sistema
3. Ajustar la temperatura si es necesario

### Errores de API

1. Verificar límites de la API key
2. Revisar conectividad a internet
3. Confirmar que la API key sea válida

## 🔮 Próximas Mejoras

- [ ] Migrar a backend para producción
- [ ] Implementar cache de respuestas similares
- [ ] Agregar más contexto (armas usadas, posiciones, etc.)
- [ ] Analytics de preguntas más frecuentes
- [ ] Integración con más datos de la partida
- [ ] Respuestas más específicas por mapa

## 📝 Notas de Desarrollo

- El bot está configurado para responder en español
- Las respuestas están limitadas a 300 tokens para mantener costos bajos
- El contexto se actualiza automáticamente con cada partida
- La integración es completamente funcional sin backend adicional
