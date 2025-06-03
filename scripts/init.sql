-- Script de inicialización para TurnosYa Backend
-- Este script se ejecuta automáticamente cuando se levanta el contenedor MySQL

-- Crear índices para optimizar consultas geográficas
CREATE INDEX idx_field_location ON field (latitude, longitude);
CREATE INDEX idx_field_price ON field (pricePerHour);
CREATE INDEX idx_field_rating ON field (averageRating);

-- Crear índices para bookings
CREATE INDEX idx_booking_date ON booking (date);
CREATE INDEX idx_booking_user ON booking (userId);
CREATE INDEX idx_booking_field ON booking (fieldId);

-- Crear índices para usuarios
CREATE INDEX idx_user_email ON user (email);
CREATE INDEX idx_user_role ON user (role);

-- Datos de ejemplo para desarrollo
-- Usuario administrador
INSERT IGNORE INTO user (email, password, firstName, lastName, role, isActive, createdAt, updatedAt) VALUES 
('admin@turnosya.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZUcz8J8n8QOqbgNhZYj3LYKQu0Rr2', 'Admin', 'TurnosYa', 'admin', true, NOW(), NOW());

-- Propietarios de canchas de ejemplo
INSERT IGNORE INTO user (email, password, firstName, lastName, phone, role, isActive, createdAt, updatedAt) VALUES 
('owner1@turnosya.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZUcz8J8n8QOqbgNhZYj3LYKQu0Rr2', 'Carlos', 'García', '+34600123456', 'field_owner', true, NOW(), NOW()),
('owner2@turnosya.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZUcz8J8n8QOqbgNhZYj3LYKQu0Rr2', 'María', 'López', '+34600789012', 'field_owner', true, NOW(), NOW());

-- Jugadores de ejemplo
INSERT IGNORE INTO user (email, password, firstName, lastName, phone, role, isActive, createdAt, updatedAt) VALUES 
('player1@turnosya.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZUcz8J8n8QOqbgNhZYj3LYKQu0Rr2', 'Juan', 'Pérez', '+34600345678', 'player', true, NOW(), NOW()),
('player2@turnosya.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZUcz8J8n8QOqbgNhZYj3LYKQu0Rr2', 'Ana', 'Martínez', '+34600901234', 'player', true, NOW(), NOW());

-- Canchas de ejemplo
INSERT IGNORE INTO field (name, address, latitude, longitude, pricePerHour, businessHours, description, surface, hasLighting, isIndoor, amenities, maxPlayers, averageRating, reviewCount, ownerId, createdAt, updatedAt) VALUES 
('Cancha Central Norte', 'Av. Libertador 1234, Buenos Aires', -34.5875, -58.3974, 50.00, '[{"day":1,"openTime":"08:00","closeTime":"22:00"},{"day":2,"openTime":"08:00","closeTime":"22:00"},{"day":3,"openTime":"08:00","closeTime":"22:00"},{"day":4,"openTime":"08:00","closeTime":"22:00"},{"day":5,"openTime":"08:00","closeTime":"22:00"},{"day":6,"openTime":"09:00","closeTime":"20:00"},{"day":0,"openTime":"09:00","closeTime":"18:00"}]', 'Cancha de fútbol 11 con césped sintético de última generación', 'synthetic', true, false, '["parking","bathroom","changing_rooms","cafe"]', 22, 4.5, 15, 2, NOW(), NOW()),

('Complejo Deportivo Sur', 'Calle San Martín 567, La Plata', -34.9214, -57.9544, 45.00, '[{"day":1,"openTime":"07:00","closeTime":"23:00"},{"day":2,"openTime":"07:00","closeTime":"23:00"},{"day":3,"openTime":"07:00","closeTime":"23:00"},{"day":4,"openTime":"07:00","closeTime":"23:00"},{"day":5,"openTime":"07:00","closeTime":"23:00"},{"day":6,"openTime":"08:00","closeTime":"22:00"},{"day":0,"openTime":"08:00","closeTime":"20:00"}]', 'Cancha de fútbol 7 cubierta con piso de cemento', 'concrete', true, true, '["parking","bathroom","changing_rooms","security"]', 14, 4.2, 8, 3, NOW(), NOW()),

('Campo Verde Oeste', 'Ruta 2 Km 45, Canuelas', -35.0515, -58.7781, 35.00, '[{"day":1,"openTime":"08:00","closeTime":"20:00"},{"day":2,"openTime":"08:00","closeTime":"20:00"},{"day":3,"openTime":"08:00","closeTime":"20:00"},{"day":4,"openTime":"08:00","closeTime":"20:00"},{"day":5,"openTime":"08:00","closeTime":"20:00"},{"day":6,"openTime":"09:00","closeTime":"19:00"},{"day":0,"openTime":"09:00","closeTime":"18:00"}]', 'Cancha de césped natural en ambiente campestre', 'natural', false, false, '["parking","bathroom","grill"]', 22, 4.8, 25, 2, NOW(), NOW());

-- Algunas reservas de ejemplo
INSERT IGNORE INTO booking (fieldId, userId, date, startTime, endTime, status, totalPrice, createdAt) VALUES 
(1, 4, '2024-03-25', '16:00', '17:30', 'confirmed', 75.00, NOW()),
(1, 5, '2024-03-26', '18:00', '19:30', 'confirmed', 75.00, NOW()),
(2, 4, '2024-03-24', '20:00', '21:00', 'pending', 45.00, NOW());

-- Reseñas de ejemplo
INSERT IGNORE INTO review (fieldId, userId, userName, rating, comment, createdAt) VALUES 
(1, 4, 'Juan Pérez', 5, 'Excelente cancha, muy bien mantenida y con buena iluminación', NOW()),
(1, 5, 'Ana Martínez', 4, 'Muy buena experiencia, solo faltaría más estacionamiento', NOW()),
(3, 4, 'Juan Pérez', 5, 'El mejor césped natural que he visto, ambiente muy tranquilo', NOW()),
(3, 5, 'Ana Martínez', 5, 'Perfecta para un partido relajado, excelente atención', NOW());

-- Comentario de finalización
SELECT 'Base de datos inicializada correctamente con datos de ejemplo' AS message; 