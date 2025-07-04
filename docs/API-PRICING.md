# 💰 Sistema de Precios - TurnosYa API

## 📋 Modelo de Negocio

TurnosYa funciona como una plataforma intermediaria entre propietarios de canchas y jugadores:

- **Propietario**: Establece el precio base por hora
- **Plataforma**: Agrega automáticamente 10% de comisión
- **Usuario Final**: Ve el precio total (base + comisión) pero paga solo la comisión del 10%

## 🔧 Cálculo de Precios

### Ejemplo Práctico

```
Precio del propietario: $50/hora
Comisión plataforma (10%): $5/hora
Precio mostrado al usuario: $55/hora
Usuario paga: $5/hora (solo la comisión)
```

### Estructura de Respuesta

```json
{
  "priceBreakdown": {
    "basePrice": 100.0, // Precio base (owner)
    "platformFee": 10.0, // 10% comisión
    "displayPrice": 110.0, // Lo que ve el usuario
    "userPayment": 10.0, // Lo que paga el usuario
    "hours": 2, // Duración
    "isSpecialHour": false, // ¿Precio especial?
    "specialPrice": null // Precio especial si aplica
  }
}
```

## 🕐 Horarios Especiales

Los propietarios pueden establecer precios especiales para fechas específicas:

```json
{
  "date": "2024-12-31",
  "openTime": "10:00",
  "closeTime": "18:00",
  "specialPrice": 80.0, // Precio especial
  "reason": "Año Nuevo"
}
```

### Cálculo con Horario Especial

```
Precio especial: $80/hora
Comisión (10%): $8/hora
Precio mostrado: $88/hora
Usuario paga: $8/hora
```

## 📊 Descuentos Off-Peak

Sistema automático de descuentos para horarios de menor demanda:

- **Horario Off-Peak**: 08:00 - 16:00
- **Descuento**: 15%
- **Aplicación**: Sobre el precio base

### Ejemplo con Descuento

```
Precio base: $50/hora
Descuento off-peak (15%): -$7.50
Precio con descuento: $42.50
Comisión (10%): $4.25
Precio mostrado: $46.75
Usuario paga: $4.25
```

## 🔁 Reservas Recurrentes

Para reservas recurrentes, se aplica el mismo cálculo a cada instancia:

```json
{
  "isRecurrent": true,
  "recurrencePattern": {
    "type": "weekly", // daily, weekly, monthly
    "interval": 1, // cada X períodos
    "endDate": "2024-12-31"
  }
}
```

## 🛠️ Endpoints de Pricing

### Obtener Precio de Campo

```http
GET /api/v1/fields/{id}/pricing
```

**Query Parameters:**

- `date` (opcional): Fecha específica para verificar precios especiales
- `startTime` (opcional): Hora de inicio
- `endTime` (opcional): Hora de fin

**Respuesta:**

```json
{
  "pricePerHour": 50.0,
  "displayPricePerHour": 55.0,
  "platformFeePerHour": 5.0,
  "hasSpecialPrice": false,
  "specialPrice": null,
  "offPeakDiscount": 0.15
}
```

### Calcular Precio de Reserva

```http
POST /api/v1/bookings/calculate-price
```

**Body:**

```json
{
  "fieldId": 1,
  "date": "2024-03-25",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

**Respuesta:**

```json
{
  "priceBreakdown": {
    "basePrice": 100.0,
    "platformFee": 10.0,
    "displayPrice": 110.0,
    "userPayment": 10.0,
    "hours": 2,
    "isSpecialHour": false,
    "offPeakDiscount": 0.0
  }
}
```

## 💳 Proceso de Pago

1. **Usuario selecciona** horario y ve precio total
2. **Usuario confirma** y paga solo la comisión
3. **Plataforma retiene** la comisión
4. **Propietario recibe** confirmación de reserva
5. **Pago al propietario** se realiza después del servicio

## 📈 Estadísticas para Propietarios

```http
GET /api/v1/fields/owner/{ownerId}/revenue
```

**Respuesta:**

```json
{
  "fields": [
    {
      "fieldId": 1,
      "fieldName": "Cancha Central",
      "totalBookings": 45,
      "platformRevenue": 225.0, // Lo que ganó la plataforma
      "ownerRevenue": 2025.0, // Lo que debería recibir el owner
      "averageRating": 4.5
    }
  ],
  "summary": {
    "totalPlatformRevenue": 225.0,
    "totalOwnerRevenue": 2025.0,
    "totalBookings": 45
  }
}
```

## 🔧 Configuración de Precios

### Variables de Entorno

```env
PLATFORM_FEE_PERCENTAGE=0.10    # 10%
OFF_PEAK_DISCOUNT=0.15          # 15%
OFF_PEAK_START_HOUR=8           # 08:00
OFF_PEAK_END_HOUR=16            # 16:00
```

### Personalización por Región

```typescript
// src/common/services/pricing.service.ts
export class PricingService {
  private readonly PLATFORM_FEE_PERCENTAGE =
    parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 0.1;

  private readonly OFF_PEAK_DISCOUNT =
    parseFloat(process.env.OFF_PEAK_DISCOUNT) || 0.15;
}
```

## 📝 Validaciones

### Precio Mínimo

- El precio base no puede ser menor a $10/hora
- La comisión mínima es $1/hora

### Precio Máximo

- Límite configurable por región
- Validación en frontend y backend

### Horarios Especiales

- No pueden exceder 300% del precio base
- Deben estar dentro del horario de funcionamiento
- No pueden solaparse entre sí

## 🔍 Auditoría de Precios

Todos los cambios de precio se registran para auditoría:

```sql
CREATE TABLE price_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  field_id INT NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  change_reason VARCHAR(255),
  changed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Mejoras Futuras

1. **Pricing Dinámico**: Basado en demanda
2. **Descuentos por Volumen**: Para usuarios frecuentes
3. **Precios por Temporada**: Verano/Invierno
4. **Membresías Premium**: Descuentos especiales
