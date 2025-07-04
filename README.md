# 🏟️ BackFutbol-Nest - Microservicio de Gestión de Fútbol

Microservicio especializado en la gestión de canchas de fútbol, reservas, horarios y calificaciones. Diseñado para trabajar en conjunto con otros microservicios en una arquitectura desacoplada.

## 🏗️ Arquitectura de Microservicios

Este servicio es parte de un ecosistema de 3 microservicios:

- **🔹 BackUPyUC** → Gestión de usuarios y autenticación
- **🔹 BackMP** → Gestión de pagos con MercadoPago
- **🔹 BackFutbol-Nest** → Este servicio (gestión de fútbol)

### Responsabilidades del Microservicio

✅ **Lo que SÍ maneja:**

- ABM de canchas de fútbol
- Gestión de reservas y turnos
- Horarios y disponibilidad
- Calificaciones y reviews
- Validación de turnos
- Integración con otros microservicios

❌ **Lo que NO maneja:**

- Usuarios (delegado a BackUPyUC)
- Pagos (delegado a BackMP)
- Autenticación local

## 🚀 Características Principales

### 🔐 Autenticación Externa

- Valida tokens JWT de BackUPyUC
- No maneja usuarios localmente
- Guards y decoradores para roles externos

### 💳 Integración de Pagos

- Comunicación con BackMP
- Validación de pagos antes de confirmar reservas
- Procesamiento de webhooks

### 🏥 Health Checks

- Endpoints de health, readiness y liveness
- Monitoreo de servicios externos
- Verificación de base de datos

### 🐳 Docker & Producción

- Multi-stage Docker build
- Health checks integrados
- Configuración para AWS ECS
- Variables de entorno seguras

## 📋 Prerrequisitos

- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose
- AWS CLI (para despliegue)

## 🛠️ Instalación y Configuración

### 1. Clonar y instalar dependencias

```bash
git clone <repository-url>
cd BackFutbol-Nest
npm install
```

### 2. Configurar variables de entorno

```bash
cp env.example .env
# Editar .env con tus configuraciones
```

### 3. Variables de entorno requeridas

```env
# Configuración de la aplicación
NODE_ENV=development
PORT=3000
APP_VERSION=1.0.0

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=futbol_app

# Microservicios
BACK_UPYUC_URL=http://localhost:3001
BACK_MP_URL=http://localhost:3002

# JWT (para validación de tokens de BackUPyUC)
JWT_SECRET=your-jwt-secret-key
JWT_PUBLIC_KEY=your-jwt-public-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🏃‍♂️ Ejecución

### Desarrollo local

```bash
# Con Docker Compose (recomendado)
docker-compose up

# O directamente con Node.js
npm run start:dev
```

### Producción

```bash
# Construir imagen
docker build -t backfutbol-nest .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env backfutbol-nest
```

## 📚 API Endpoints

### Health Checks

- `GET /api/v1/health` - Health check básico
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

### Canchas de Fútbol

- `GET /api/v1/fields` - Listar todas las canchas
- `GET /api/v1/fields/:id` - Obtener cancha específica
- `POST /api/v1/fields` - Crear nueva cancha (FIELD_OWNER, ADMIN)
- `GET /api/v1/fields/search` - Buscar canchas
- `GET /api/v1/fields/nearby` - Canchas cercanas

### Reservas

- `GET /api/v1/bookings` - Listar reservas
- `POST /api/v1/bookings` - Crear reserva
- `GET /api/v1/bookings/:id` - Obtener reserva específica
- `PUT /api/v1/bookings/:id` - Actualizar reserva
- `DELETE /api/v1/bookings/:id` - Cancelar reserva

### Reviews

- `POST /api/v1/fields/:id/reviews` - Crear review
- `GET /api/v1/fields/:id/reviews` - Obtener reviews de una cancha

### Documentación Swagger

- `GET /api` - Documentación interactiva de la API

## 🔐 Autenticación y Autorización

### Tokens JWT

El servicio valida tokens JWT emitidos por BackUPyUC. Los tokens deben incluir:

- `sub`: ID del usuario
- `email`: Email del usuario
- `role`: Rol del usuario (PLAYER, FIELD_OWNER, ADMIN)

### Roles y Permisos

- **PLAYER**: Puede hacer reservas y reviews
- **FIELD_OWNER**: Puede crear y gestionar canchas
- **ADMIN**: Acceso completo al sistema

### Uso de Guards

```typescript
@UseGuards(ExternalJwtAuthGuard, ExternalRolesGuard)
@Roles('FIELD_OWNER', 'ADMIN')
async createField() {
  // Solo usuarios con roles FIELD_OWNER o ADMIN
}
```

## 🐳 Docker

### Construir imagen

```bash
docker build -t backfutbol-nest .
```

### Ejecutar con Docker Compose

```bash
docker-compose up -d
```

### Health checks

```bash
# Verificar salud del servicio
curl http://localhost:3000/api/v1/health

# Verificar readiness
curl http://localhost:3000/api/v1/health/ready

# Verificar liveness
curl http://localhost:3000/api/v1/health/live
```

## ☁️ Despliegue en AWS

### Prerrequisitos

- AWS CLI configurado
- Docker instalado
- Variables de entorno configuradas

### Desplegar

```bash
# Hacer el script ejecutable
chmod +x scripts/deploy-aws.sh

# Desplegar en producción
./scripts/deploy-aws.sh production

# O en staging
./scripts/deploy-aws.sh staging
```

### Configuración AWS

El despliegue incluye:

- ECS Cluster con Fargate
- Application Load Balancer
- RDS MySQL (configurar por separado)
- CloudWatch Logs
- IAM Roles y Security Groups

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📊 Monitoreo

### Health Checks

El servicio expone endpoints de monitoreo:

- `/api/v1/health` - Estado general
- `/api/v1/health/ready` - Listo para recibir tráfico
- `/api/v1/health/live` - Proceso vivo

### Logs

- Logs estructurados con Winston
- Integración con CloudWatch en AWS
- Niveles de log configurables

### Métricas

- Tiempo de respuesta de endpoints
- Estado de servicios externos
- Uso de recursos

## 🔧 Configuración Avanzada

### Base de Datos

```typescript
// Configuración TypeORM optimizada para producción
TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});
```

### Rate Limiting

```typescript
// Configuración de rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas requests desde esta IP',
  }),
);
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**

   - Verificar variables de entorno DB\_\*
   - Verificar que MySQL esté ejecutándose
   - Verificar permisos de usuario

2. **Error de autenticación**

   - Verificar que BackUPyUC esté disponible
   - Verificar configuración JWT_SECRET
   - Verificar formato del token

3. **Error de integración con BackMP**
   - Verificar que BackMP esté disponible
   - Verificar configuración BACK_MP_URL
   - Verificar logs de comunicación

### Logs de Debug

```bash
# Habilitar logs detallados
export LOG_LEVEL=debug
npm run start:dev
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas:

- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de la API en `/api`

---

**🏟️ BackFutbol-Nest** - Microservicio especializado en gestión de fútbol ⚽
