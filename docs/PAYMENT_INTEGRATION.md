# Integración de Pagos - BackFutbol-Nest

## 📋 **Resumen**

BackFutbol-Nest integra con BackMP (microservicio de pagos) para procesar pagos de reservas de canchas de fútbol. La integración incluye circuit breakers para resiliencia, webhooks para confirmaciones automáticas, y endpoints para monitoreo.

## 🏗️ **Arquitectura**

```
┌─────────────────┐    HTTP    ┌─────────────────┐
│   Frontend      │ ────────── │ BackFutbol-Nest │
│   (Cliente)     │            │                 │
└─────────────────┘            └─────────────────┘
                                       │
                                       │ HTTP
                                       ▼
                              ┌─────────────────┐
                              │    BackMP       │
                              │ (MercadoPago)   │
                              └─────────────────┘
```

## 🔄 **Flujo de Pago Completo**

### 1. **Creación de Reserva con Pago**

```http
POST /bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fieldId": 1,
  "userId": 123,
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "payerEmail": "usuario@example.com"
}
```

**Respuesta:**

```json
{
  "bookings": [
    {
      "id": 1,
      "status": "pending",
      "totalPrice": 100
    }
  ],
  "priceBreakdown": {
    "basePrice": 1000,
    "platformFee": 100,
    "userPayment": 100,
    "displayPrice": 1100,
    "hours": 1
  },
  "paymentPreference": {
    "id": "pref_123456",
    "initPoint": "https://mp.com/checkout/1",
    "sandboxInitPoint": "https://mp.com/sandbox/checkout/1"
  },
  "message": "Reserva creada. Complete el pago para confirmar."
}
```

### 2. **Proceso de Pago**

1. Usuario accede a `initPoint` o `sandboxInitPoint`
2. Completa el pago en MercadoPago
3. MercadoPago envía webhook a BackMP
4. BackMP procesa y envía webhook a BackFutbol-Nest

### 3. **Confirmación Automática**

```http
POST /webhooks/payment
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "payment_789",
    "status": "approved",
    "external_reference": "booking_1"
  }
}
```

### 4. **Verificación Manual (Opcional)**

```http
POST /bookings/1/confirm-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentId": "payment_789"
}
```

## 🔧 **Endpoints de Pagos**

### **Crear Reserva con Pago**

- **URL:** `POST /bookings`
- **Autenticación:** JWT requerido
- **Roles:** `user`, `admin`
- **Parámetros:**
  - `payerEmail` (opcional): Email para crear preferencia de pago

### **Confirmar Pago Manualmente**

- **URL:** `POST /bookings/:id/confirm-payment`
- **Autenticación:** JWT requerido
- **Roles:** `user`, `admin`
- **Body:** `{ "paymentId": "string" }`

### **Estado de Pago**

- **URL:** `GET /bookings/:id/payment-status`
- **Autenticación:** JWT requerido
- **Roles:** `user`, `admin`
- **Respuesta:**
  ```json
  {
    "bookingId": 1,
    "status": "paid|pending|error",
    "message": "Descripción del estado"
  }
  ```

### **Webhook de Pagos**

- **URL:** `POST /webhooks/payment`
- **Autenticación:** No requerida (viene de BackMP)
- **Body:** Datos del webhook de MercadoPago

## 🛡️ **Circuit Breakers**

### **Configuración**

- **Umbral de fallos:** 5 fallos consecutivos
- **Timeout:** 30 segundos por operación
- **Reset timeout:** 60 segundos
- **Éxitos para cerrar:** 3 éxitos consecutivos

### **Estados**

- **Cerrado:** Operaciones normales
- **Abierto:** Usa fallbacks, no hace llamadas externas
- **Semi-abierto:** Permite algunas llamadas de prueba

### **Monitoreo**

```http
GET /health/circuit-breakers
Authorization: Bearer <jwt_token>
Roles: admin
```

**Respuesta:**

```json
{
  "paymentService": {
    "isOpen": false,
    "failureCount": 0,
    "lastFailureTime": 0,
    "successCount": 0
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔄 **Fallbacks**

### **Creación de Preferencia**

Si BackMP no está disponible:

```json
{
  "id": "pref_fallback_123456",
  "initPoint": "https://backmp.com/fallback/checkout/1",
  "sandboxInitPoint": "https://backmp.com/fallback/sandbox/checkout/1"
}
```

### **Verificación de Estado**

Si BackMP no está disponible:

```json
{
  "id": "payment_123",
  "status": "pending",
  "externalReference": "booking_fallback_123456",
  "amount": 0,
  "currency": "ARS"
}
```

### **Validación de Pago**

Si BackMP no está disponible, asume que el pago es válido.

## 📊 **Estados de Reserva**

| Estado      | Descripción                     | Acciones Permitidas      |
| ----------- | ------------------------------- | ------------------------ |
| `pending`   | Reserva creada, pago pendiente  | Cancelar, confirmar pago |
| `confirmed` | Pago confirmado, reserva activa | Cancelar                 |
| `cancelled` | Reserva cancelada               | Ninguna                  |

## 🔐 **Seguridad**

### **Autenticación**

- Todos los endpoints requieren JWT válido de BackUPyUC
- Webhook no requiere autenticación (viene de BackMP)

### **Validación**

- Verificación de roles (`user`, `admin`)
- Validación de pagos antes de confirmar reservas
- Verificación de `external_reference` en webhooks

### **Rate Limiting**

- Implementado a nivel de aplicación
- Límites específicos por endpoint

## 🚨 **Manejo de Errores**

### **Errores Comunes**

- **400:** Datos de reserva inválidos
- **401:** Token JWT inválido o expirado
- **403:** Sin permisos para la operación
- **404:** Reserva o cancha no encontrada
- **503:** Servicio de pagos no disponible

### **Logging**

- Todos los errores se registran con contexto
- Circuit breaker events se loguean
- Webhook processing se loguea

## 🧪 **Testing**

### **Tests Unitarios**

```bash
npm run test src/bookings/booking.service.spec.ts
```

### **Tests de Integración**

```bash
npm run test:e2e test/booking.e2e-spec.ts
```

### **Tests de Circuit Breaker**

```bash
npm run test src/common/services/payment-integration.service.spec.ts
```

## 📈 **Métricas y Monitoreo**

### **Health Checks**

- `GET /health` - Estado general
- `GET /health/readiness` - Listo para tráfico
- `GET /health/liveness` - Servicio vivo
- `GET /health/circuit-breakers` - Estado de circuit breakers

### **Métricas Recomendadas**

- Tasa de éxito de pagos
- Tiempo de respuesta de BackMP
- Estado de circuit breakers
- Errores de webhook
- Reservas pendientes de pago

## 🔧 **Configuración**

### **Variables de Entorno**

```env
# BackMP Configuration
BACK_MP_URL=https://backmp.example.com
BACK_MP_API_KEY=your_api_key
BACK_MP_WEBHOOK_SECRET=your_webhook_secret

# Circuit Breaker Configuration
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT_MS=30000
CIRCUIT_BREAKER_RESET_TIMEOUT_MS=60000
```

### **Docker**

```yaml
# docker-compose.yml
services:
  backfutbol-nest:
    environment:
      - BACK_MP_URL=http://backmp:3000
      - CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
```

## 🚀 **Despliegue**

### **AWS ECS**

```bash
# Desplegar con CloudFormation
aws cloudformation deploy \
  --template-file aws-deployment.yml \
  --stack-name backfutbol-nest \
  --capabilities CAPABILITY_IAM
```

### **Kubernetes**

```yaml
# health-check.yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 📚 **Referencias**

- [MercadoPago API Documentation](https://www.mercadopago.com.ar/developers/es/docs)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [NestJS Health Checks](https://docs.nestjs.com/recipes/terminus)
- [Microservices Patterns](https://microservices.io/patterns/reliability/circuit-breaker.html)
