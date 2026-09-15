CREATE DATABASE IF NOT EXISTS techstore;
USE techstore;

-- Tabla de administradores
CREATE TABLE administradores (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(20) NOT NULL UNIQUE,
    contrasena VARCHAR(100) NOT NULL
);

-- Tabla de productos
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    marca VARCHAR(40) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    estado VARCHAR(10) NOT NULL,
    descripcion_corta VARCHAR(120) NOT NULL,
    descripcion_tecnica VARCHAR(800) NOT NULL,
    imagen VARCHAR(150) NOT NULL,
    pantalla VARCHAR(40),
    almacenamiento VARCHAR(20),
    ram VARCHAR(20),
    color VARCHAR(30),
    peso INT,
    garantia INT
);

-- Tabla de compras
CREATE TABLE compras (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL
);

-- Detalle de cada compra
CREATE TABLE detalle_compra (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Usuario administrador de prueba
INSERT INTO administradores (usuario, contrasena)
VALUES ('admin.techstore', 'Admin123');

-- Productos iniciales de TechStore
INSERT INTO productos
(nombre, marca, categoria, precio, stock, estado, descripcion_corta, descripcion_tecnica, imagen,
 pantalla, almacenamiento, ram, color, peso, garantia)
VALUES
('iPhone 15 Pro Max 256 GB', 'Apple', 'celulares', 32500.00, 12, 'activo',
 'Titanio, chip A17 Pro y cámara de 48 MP.',
 'iPhone 15 Pro Max con chip A17 Pro, pantalla de 6.7 pulgadas, cámara principal de 48 MP y almacenamiento de 256 GB.',
 'img/iphone-15-pro-max.png', '6.7 pulgadas', '256 GB', '8 GB', 'Titanio natural', 221, 12),

('Galaxy S24 Ultra 512 GB', 'Samsung', 'celulares', 34900.00, 8, 'activo',
 'Pantalla AMOLED, cámara de 200 MP y S Pen.',
 'Galaxy S24 Ultra con pantalla Dynamic AMOLED 2X, cámara principal de 200 MP, S Pen y almacenamiento de 512 GB.',
 'img/s24ultra.webp', '6.8 pulgadas', '512 GB', '12 GB', 'Titanio gris', 232, 12),

('Redmi Note 13 Pro 256 GB', 'Xiaomi', 'celulares', 8750.00, 25, 'activo',
 'Cámara de 200 MP y pantalla AMOLED.',
 'Redmi Note 13 Pro con pantalla AMOLED, cámara de 200 MP y almacenamiento de 256 GB.',
 'img/redminote13.webp', '6.67 pulgadas', '256 GB', '8 GB', 'Negro', 188, 12),

('Pixel 8 128 GB', 'Google', 'celulares', 19900.00, 0, 'inactivo',
 'Android puro y cámara con inteligencia artificial.',
 'Google Pixel 8 con pantalla OLED, cámara principal de alta resolución y almacenamiento de 128 GB.',
 'img/pixel8.jpeg', '6.2 pulgadas', '128 GB', '8 GB', 'Obsidiana', 187, 12),

('Moto G84 128 GB', 'Motorola', 'celulares', 6200.00, 17, 'activo',
 'Pantalla pOLED y batería de larga duración.',
 'Motorola Moto G84 con pantalla pOLED, almacenamiento de 128 GB y batería de larga duración.',
 'img/motog84.webp', '6.55 pulgadas', '128 GB', '8 GB', 'Azul', 166, 12),

('Galaxy A55 256 GB', 'Samsung', 'celulares', 10400.00, 14, 'activo',
 'Pantalla Super AMOLED y cámara de 50 MP.',
 'Samsung Galaxy A55 con pantalla Super AMOLED, cámara principal de 50 MP y almacenamiento de 256 GB.',
 'img/a55.webp', '6.6 pulgadas', '256 GB', '8 GB', 'Azul oscuro', 213, 12),

('AirPods Pro 2da gen.', 'Apple', 'audio', 6450.00, 30, 'activo',
 'Cancelación activa de ruido y estuche MagSafe.',
 'AirPods Pro de segunda generación con cancelación activa de ruido y estuche de carga MagSafe.',
 'img/airpods.webp', NULL, NULL, NULL, 'Blanco', 51, 12),

('Galaxy Watch 6 44 mm', 'Samsung', 'wearables', 7300.00, 6, 'inactivo',
 'Reloj inteligente con pantalla Super AMOLED.',
 'Galaxy Watch 6 de 44 mm con funciones inteligentes para actividad, notificaciones y seguimiento diario.',
 'img/watch6.webp', '1.5 pulgadas', '16 GB', '2 GB', 'Grafito', 33, 12),

('Cargador GaN 65 W', 'Anker', 'accesorios', 1250.00, 42, 'activo',
 'Cargador compacto de 65 W para dispositivos compatibles.',
 'Cargador Anker GaN de 65 W para carga rápida de celulares, tablets y otros dispositivos compatibles.',
 'img/anker.webp', NULL, NULL, NULL, 'Blanco', 120, 6);
