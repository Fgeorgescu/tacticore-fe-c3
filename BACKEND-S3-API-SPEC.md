# Backend API Specification for S3 Upload Integration

## Resumen

El frontend ahora sube archivos directamente a S3 con compresión gzip, y luego notifica al backend con las referencias de S3. Esto reduce la carga en las lambdas y acelera el procesamiento.

## Configuración de S3

- **Bucket**: `tacticore-storage-temp`
- **Región**: `us-east-1`
- **Estructura de paths**: `/uploads/{type}/{timestamp}-{random}-{filename}.gz`
  - `{type}`: `dem` o `video`
  - Los archivos se comprimen con gzip antes de subir
  - Ejemplo: `uploads/dem/1734567890123-abc123-match.dem.gz`

## Endpoint Nuevo Requerido

### POST `/api/matches/s3`

Crea una nueva partida usando archivos ya subidos a S3.

#### Request Body

```json
{
  "bucket": "tacticore-storage-temp",
  "key": "uploads/dem/1734567890123-abc123-match.dem.gz",
  "videoKey": "uploads/video/1734567890456-def456-gameplay.mp4.gz",  // opcional
  "metadata": {
    "playerName": "Player",
    "notes": "Dust II ranked match"
  }
}
```

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `bucket` | string | Sí | Nombre del bucket S3 |
| `key` | string | Sí | Ruta completa del archivo DEM en S3 (comprimido con gzip) |
| `videoKey` | string | No | Ruta completa del archivo de video en S3 (opcional, comprimido) |
| `metadata` | object | No | Metadata adicional de la partida |
| `metadata.playerName` | string | No | Nombre del jugador |
| `metadata.notes` | string | No | Notas sobre la partida |

#### Response (200 OK)

```json
{
  "id": "match_123456",
  "status": "processing",
  "message": "Match is being processed"
}
```

#### Response de Error (400 Bad Request)

```json
{
  "error": "bucket and key are required",
  "code": "MISSING_REQUIRED_FIELDS"
}
```

#### Response de Error (500 Internal Server Error)

```json
{
  "error": "Failed to process match",
  "code": "PROCESSING_ERROR",
  "details": "S3 file not found or invalid format"
}
```

## Flujo de Procesamiento Backend

1. **Recibir la solicitud** con bucket y key
2. **Validar** que el archivo DEM existe en S3
3. **Descargar** el archivo DEM desde S3
4. **Descomprimir** el archivo gzip
5. **Procesar** el archivo DEM usando la lógica existente
6. **Si hay video**, descargarlo, descomprimirlo y asociarlo con la partida
7. **Guardar** los resultados en la base de datos
8. **Retornar** el ID de la partida y el estado

## Permisos de IAM Necesarios

La función Lambda debe tener permisos para:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::tacticore-storage-temp",
        "arn:aws:s3:::tacticore-storage-temp/*"
      ]
    }
  ]
}
```

## Endpoints Existentes (Sin Cambios)

Los siguientes endpoints siguen funcionando como antes:

- `GET /api/matches` - Listar partidas
- `GET /api/matches/{id}` - Obtener detalle de partida
- `GET /api/matches/{id}/kills` - Obtener kills de una partida
- `GET /api/matches/{id}/status` - Verificar estado de procesamiento
- `DELETE /api/matches/{id}` - Eliminar partida

## Ejemplo de Implementación Python (Lambda)

```python
import boto3
import gzip
import json
from typing import Dict, Any

s3_client = boto3.client('s3', region_name='us-east-1')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler para POST /api/matches/s3
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        bucket = body.get('bucket')
        dem_key = body.get('key')
        video_key = body.get('videoKey')
        metadata = body.get('metadata', {})
        
        # Validate required fields
        if not bucket or not dem_key:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'bucket and key are required',
                    'code': 'MISSING_REQUIRED_FIELDS'
                })
            }
        
        # Verify DEM file exists in S3
        try:
            s3_client.head_object(Bucket=bucket, Key=dem_key)
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'DEM file not found in S3',
                    'code': 'FILE_NOT_FOUND'
                })
            }
        
        # Download and decompress DEM file
        dem_obj = s3_client.get_object(Bucket=bucket, Key=dem_key)
        compressed_content = dem_obj['Body'].read()
        
        # Decompress gzip content
        dem_content = gzip.decompress(compressed_content)
        
        # Process the DEM file (your existing logic here)
        match_id = process_dem_file(dem_content, metadata)
        
        # If video exists, download and associate it with the match
        if video_key:
            try:
                s3_client.head_object(Bucket=bucket, Key=video_key)
                video_obj = s3_client.get_object(Bucket=bucket, Key=video_key)
                compressed_video = video_obj['Body'].read()
                video_content = gzip.decompress(compressed_video)
                associate_video_with_match(match_id, video_content)
            except s3_client.exceptions.NoSuchKey:
                print(f"Warning: Video file {video_key} not found, continuing without video")
        
        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'id': match_id,
                'status': 'processing',
                'message': 'Match is being processed'
            })
        }
        
    except Exception as e:
        print(f"Error processing match: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process match',
                'code': 'PROCESSING_ERROR',
                'details': str(e)
            })
        }

def process_dem_file(dem_content: bytes, metadata: Dict) -> str:
    """
    Tu lógica existente para procesar archivos DEM
    """
    # Implementa tu lógica aquí
    pass

def associate_video_with_match(match_id: str, video_content: bytes):
    """
    Asocia un video con una partida
    """
    # Implementa tu lógica aquí
    pass
```

## Ventajas de Este Enfoque

1. **Lambdas más rápidas**: No procesan el upload, solo referencian archivos
2. **Menor timeout risk**: Upload a S3 es más confiable que upload a Lambda
3. **Mejor progress tracking**: XHR proporciona mejor tracking del progreso
4. **Escalabilidad**: S3 maneja uploads grandes mejor que Lambda
5. **Costos**: Menos tiempo de ejecución de Lambda
6. **Seguridad**: Credenciales AWS nunca se exponen al cliente

## Consideraciones de Seguridad

- El frontend llama a un endpoint Next.js seguro (`/api/upload/s3`) que maneja las credenciales
- Las credenciales AWS están **solo en el servidor**, nunca expuestas al cliente
- El servidor Next.js tiene credenciales temporales (session token) para S3
- Las credenciales deben tener permisos **solo de escritura** en `/uploads/*`
- El backend Lambda tiene permisos de **lectura** en todo el bucket
- Considera implementar políticas de lifecycle en S3 para limpiar archivos antiguos

## Variables de Entorno

### Frontend (Next.js Server)

Agrega estas variables en la sección **Vars** del sidebar de v0 (sin prefijo NEXT_PUBLIC_):

```bash
AWS_S3_BUCKET=tacticore-storage-temp
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<tu_access_key_id>
AWS_SECRET_ACCESS_KEY=<tu_secret_access_key>
AWS_SESSION_TOKEN=<tu_session_token>  # Para credenciales temporales
```

**Nota importante**: Estas variables NO tienen el prefijo `NEXT_PUBLIC_` porque son **solo para el servidor**. Esto mantiene las credenciales seguras y nunca las expone al navegador del cliente.

### Backend (Lambda)

Tu Lambda ya debe tener acceso a S3 mediante su rol de IAM. No necesitas configurar credenciales explícitamente si usas roles de IAM correctamente.

## Testing

### Probar el endpoint con curl

```bash
curl -X POST https://tu-api.execute-api.us-east-1.amazonaws.com/prod/api/matches/s3 \
  -H "Content-Type: application/json" \
  -d '{
    "bucket": "tacticore-storage-temp",
    "key": "uploads/dem/test-match.dem.gz",
    "videoKey": "uploads/video/test-gameplay.mp4.gz",
    "metadata": {
      "playerName": "TestPlayer",
      "notes": "Test match"
    }
  }'
```

### Respuesta esperada

```json
{
  "id": "match_abc123",
  "status": "processing",
  "message": "Match is being processed"
}
```

## Arquitectura de Seguridad

```
┌─────────────┐         ┌──────────────────┐         ┌─────────┐         ┌─────────────┐
│   Cliente   │────────▶│ Next.js Server   │────────▶│   S3    │◀────────│   Lambda    │
│  (Browser)  │         │ /api/upload/s3   │         │ Bucket  │         │  Backend    │
└─────────────┘         └──────────────────┘         └─────────┘         └─────────────┘
      │                         │                          ▲                      │
      │                         │                          │                      │
      │                    [Credenciales                   │                 [Credenciales
      │                     AWS seguras]                   │                  IAM Role]
      │                                                     │                      │
      └─────────────────────────────────────────────────────┴──────────────────────┘
                    POST /api/matches/s3 con S3 keys
```

1. Cliente sube archivo al servidor Next.js (`/api/upload/s3`)
2. Servidor Next.js usa credenciales AWS para subir a S3
3. Servidor retorna S3 key al cliente
4. Cliente envía S3 key al backend Lambda
5. Lambda descarga archivo de S3 y procesa
