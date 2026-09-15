# TechStore - Ecommerce (Programación Web)

Tienda de celulares y tecnología con catálogo público, carrito de compras y
panel de administración. El frontend es HTML, CSS y JavaScript sin
frameworks; el backend es una API REST en Flask sobre MySQL.

## Estructura

```
backend/     API REST en Flask (app.py) y conexión a MySQL (conexion.py)
database/    Script de creación de la base y datos de prueba
frontend/    Páginas HTML, hoja de estilos, imágenes y app.js
```

## Requisitos

- Python 3.10 o superior
- MySQL 8 o superior

## Instalación

1. Crear la base de datos y cargar los datos de prueba:

   ```sql
   SOURCE database/techstore.sql;
   ```

2. Instalar las dependencias de Python:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Ajustar las credenciales de MySQL en `backend/app.py`. Por defecto son
   usuario `root` y contraseña `Admin1234`.

4. Levantar la API:

   ```bash
   python backend/app.py
   ```

   Queda escuchando en `http://127.0.0.1:5000`.

5. Abrir `frontend/index.html` en el navegador.

## Endpoints

| Método | Ruta                      | Descripción                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/api/productos`          | Lista todos los productos            |
| GET    | `/api/productos/<id>`     | Devuelve un producto                 |
| POST   | `/api/productos`          | Crea un producto                     |
| PUT    | `/api/productos/<id>`     | Actualiza un producto                |
| DELETE | `/api/productos/<id>`     | Elimina un producto                  |
| POST   | `/api/login`              | Valida las credenciales del admin    |
| POST   | `/api/compras`            | Registra una compra y descuenta stock|
| GET    | `/api/reportes/compras`   | Reporte de compras por fecha o id    |

## Páginas

| Archivo                     | Descripción                                |
| --------------------------- | ------------------------------------------ |
| `index.html`                | Catálogo de productos                      |
| `detalle.html?id=<id>`      | Detalle y ficha técnica de un producto     |
| `carrito.html`              | Carrito y cierre de compra                 |
| `login.html`                | Acceso al panel de administración          |
| `producto.html`             | Mantenimiento de productos                 |
| `nuevoProducto.html?id=<id>`| Alta y edición de productos                |
| `Reportes.html`             | Reporte de compras                         |

Todas las páginas se llenan desde la API; no hay datos escritos en el HTML.

## Acceso de prueba

Usuario `admin.techstore`, contraseña `Admin123`. Las credenciales vienen en
el script de la base de datos y son solo para uso académico.
