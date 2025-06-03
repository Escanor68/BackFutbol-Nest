# 🏟️ TurnosYa Backend

Backend para aplicación de reservas deportivas construido con **NestJS**, **TypeORM** y **MySQL**.

## 📋 Características

- **🔐 Autenticación JWT** con roles (jugador, propietario, admin)
- **🏟️ Gestión de canchas** con ubicación geográfica
- **📅 Sistema de reservas** con validación de disponibilidad
- **⭐ Sistema de reseñas** y calificaciones
- **📊 Estadísticas** para propietarios
- **🌍 Búsqueda geográfica** de canchas cercanas
- **📝 Logging** completo de requests/responses
- **🛡️ Validación** robusta con class-validator
- **📖 Documentación** automática con Swagger
- **🐳 Docker** ready para desarrollo y producción
- **☁️ AWS** ready para deploy en la nube

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- Git

### 🐳 Desarrollo con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <tu-repo>
cd BackFutbol-Nest

# Levantar servicios con Docker Compose
docker-compose up -d

# Ver logs del backend
docker-compose logs -f backend
```

**URLs disponibles:**

- 🌐 Backend: http://localhost:3001
- 📖 Swagger: http://localhost:3001/api
- 🗄️ Adminer (DB): http://localhost:8080
- 🔗 MySQL: localhost:3307

### 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Levantar solo la base de datos
docker-compose up mysql -d

# Iniciar en modo desarrollo
npm run start:dev
```

## 📚 API Endpoints

### 🔐 Autenticación

```
POST /api/v1/auth/register    # Registrar usuario
POST /api/v1/auth/login       # Iniciar sesión
```

### 👥 Usuarios

```
GET    /api/v1/users           # Listar usuarios (admin)
GET    /api/v1/users/profile   # Perfil del usuario
GET    /api/v1/users/:id       # Usuario por ID
PATCH  /api/v1/users/:id       # Actualizar usuario
DELETE /api/v1/users/:id       # Eliminar usuario (admin)
```

### 🏟️ Canchas

```
GET    /api/v1/fields              # Listar todas las canchas
POST   /api/v1/fields              # Crear cancha (propietario)
GET    /api/v1/fields/:id          # Cancha por ID
GET    /api/v1/fields/search       # Buscar canchas con filtros
GET    /api/v1/fields/nearby       # Canchas cercanas
GET    /api/v1/fields/:id/availability  # Disponibilidad de cancha
POST   /api/v1/fields/:id/reviews  # Crear reseña
GET    /api/v1/fields/owner/:id/statistics  # Estadísticas (propietario)
```

### 📅 Reservas

```
GET    /api/v1/bookings         # Listar reservas
POST   /api/v1/bookings         # Crear reserva
GET    /api/v1/bookings/:id     # Reserva por ID
DELETE /api/v1/bookings/:id     # Cancelar reserva
```

## 🏗️ Arquitectura

```
src/
├── auth/                 # Autenticación y autorización
│   ├── guards/          # Guards de autenticación
│   ├── strategies/      # Estrategias de Passport
│   └── dto/            # DTOs de auth
├── users/               # Gestión de usuarios
├── soccer-field/        # Gestión de canchas
├── bookings/           # Sistema de reservas
├── events/             # WebSocket Gateway
├── common/             # Componentes compartidos
│   ├── filters/        # Filtros de excepciones
│   ├── interceptors/   # Interceptores
│   └── decorators/     # Decoradores custom
└── main.ts             # Punto de entrada
```

## 🗄️ Base de Datos

### Entidades Principales

- **User**: Usuarios (jugadores, propietarios, admins)
- **Field**: Canchas de fútbol con ubicación y características
- **Booking**: Reservas con fechas y horarios
- **Review**: Reseñas y calificaciones
- **SoccerField**: Sistema legacy de turnos (por eliminar)
- **SpecialHours**: Horarios especiales para canchas

### Relaciones

```
User 1→N Field (propietario)
User 1→N Booking (reservas del usuario)
User 1→N Review (reseñas del usuario)
Field 1→N Booking (reservas en la cancha)
Field 1→N Review (reseñas de la cancha)
Field 1→N SpecialHours (horarios especiales)
```

## 🔧 Variables de Entorno

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=futbol_user
DB_PASSWORD=futbol_password
DB_DATABASE=futbol_app

# JWT
JWT_SECRET=your-secret-key

# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

# AWS (Producción)
AWS_REGION=us-east-1
RDS_HOSTNAME=your-rds-endpoint
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests en modo watch
npm run test:watch
```

## 📦 Scripts Disponibles

```bash
npm run start:dev     # Desarrollo con hot reload
npm run start:prod    # Producción
npm run build         # Compilar TypeScript
npm run lint          # Linter
npm run format        # Prettier
npm test              # Tests unitarios
npm run test:e2e      # Tests end-to-end
```

## 🚀 Deploy en AWS

### 📋 Preparación

1. **RDS MySQL** configurado
2. **CodeBuild** project creado
3. **CodeDeploy** application configurada
4. **EC2** instances con CodeDeploy agent

### 🏗️ BuildSpec (CodeBuild)

```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - npm install
  build:
    commands:
      - echo Build started on `date`
      - npm run build
      - npm run test
  post_build:
    commands:
      - echo Build completed on `date`
artifacts:
  files:
    - '**/*'
```

### 🔄 CI/CD Pipeline

1. **Push** a main branch
2. **CodeBuild** ejecuta tests y build
3. **CodeDeploy** despliega a EC2
4. **Health checks** automáticos

## 🛡️ Seguridad

- **🔐 JWT** tokens con expiración
- **🛡️ Guards** de autenticación y autorización
- **✅ Validación** de entrada con class-validator
- **🚫 Rate limiting** (en main.ts si se configura)
- **🔒 CORS** configurado
- **🏥 Health checks** disponibles

## 📖 Documentación API

Una vez iniciado el servidor, visita:

- **Swagger UI**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/v1/health

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Equipo

- **Backend**: NestJS + TypeORM + MySQL
- **Auth**: JWT + Passport
- **Deploy**: AWS (RDS + EC2 + CodePipeline)
- **DevOps**: Docker + GitHub Actions

---

¿Tienes preguntas? ¡Abre un issue! 🚀
