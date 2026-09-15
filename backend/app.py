import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from conexion import ConexionDB
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Admin1234'
app.config['MYSQL_DB'] = 'techstore'

db = ConexionDB(
    app.config['MYSQL_HOST'],
    app.config['MYSQL_USER'],
    app.config['MYSQL_PASSWORD'],
    app.config['MYSQL_DB']
)

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "img"))
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif", "svg"}


def save_uploaded_image(image):
    if image is None or not image.filename:
        return None
    filename = secure_filename(image.filename)
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if not filename or extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("El archivo debe ser una imagen válida.")
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    image.save(os.path.join(UPLOAD_FOLDER, filename))
    return f"img/{filename}"


def product_request_data():
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.form.to_dict()
        data["descripcion_corta"] = data.pop("descripcionCorta", data.get("descripcion_corta", ""))
        data["descripcion_tecnica"] = data.pop("descripcionTecnica", data.get("descripcion_tecnica", ""))
        uploaded_image = save_uploaded_image(request.files.get("imagen"))
        if uploaded_image:
            data["imagen"] = uploaded_image
        return data
    return request.get_json(silent=True) or {}


CAMPOS_OBLIGATORIOS = (
    "nombre",
    "marca",
    "categoria",
    "precio",
    "stock",
    "estado",
    "descripcion_corta",
    "descripcion_tecnica",
    "imagen",
)


def validar_producto(datos):
    faltantes = [
        campo for campo in CAMPOS_OBLIGATORIOS
        if not str(datos.get(campo) or "").strip()
    ]
    if faltantes:
        return "Faltan campos obligatorios: " + ", ".join(faltantes)

    try:
        precio = float(datos["precio"])
        stock = int(datos["stock"])
    except (TypeError, ValueError):
        return "El precio y el stock deben ser valores numericos."

    if precio <= 0:
        return "El precio debe ser mayor que cero."
    if stock < 0:
        return "El stock no puede ser negativo."
    if datos["estado"] not in ("activo", "inactivo"):
        return "El estado debe ser 'activo' o 'inactivo'."
    return None


@app.route("/")
def inicio():
    return jsonify({"mensaje": "API de TechStore funcionando"})


#PRODUCTOS

@app.route("/api/productos", methods=["GET"])
def listar_productos():
    conexion = db.conectar()
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM productos ORDER BY id_producto")
    productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return jsonify(productos)


@app.route("/api/productos/<int:id_producto>", methods=["GET"])
def obtener_producto(id_producto):
    conexion = db.conectar()
    cursor = conexion.cursor()

    cursor.execute(
        "SELECT * FROM productos WHERE id_producto = %s",
        (id_producto,)
    )
    producto = cursor.fetchone()

    cursor.close()
    conexion.close()

    if producto is None:
        return jsonify({"mensaje": "Producto no encontrado"}), 404

    return jsonify(producto)


@app.route("/api/productos", methods=["POST"])
def crear_producto():
    try:
        datos = product_request_data()
    except ValueError as error:
        return jsonify({"mensaje": str(error)}), 400

    problema = validar_producto(datos)
    if problema:
        return jsonify({"mensaje": problema}), 400

    conexion = db.conectar()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO productos
        (nombre, marca, categoria, precio, stock, estado,
         descripcion_corta, descripcion_tecnica, imagen,
         pantalla, almacenamiento, ram, color, peso, garantia)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    valores = (
        datos["nombre"],
        datos["marca"],
        datos["categoria"],
        datos["precio"],
        datos["stock"],
        datos["estado"],
        datos["descripcion_corta"],
        datos["descripcion_tecnica"],
        datos["imagen"],
        datos.get("pantalla"),
        datos.get("almacenamiento"),
        datos.get("ram"),
        datos.get("color"),
        datos.get("peso"),
        datos.get("garantia")
    )

    cursor.execute(sql, valores)
    conexion.commit()

    nuevo_id = cursor.lastrowid

    cursor.close()
    conexion.close()

    return jsonify({
        "mensaje": "Producto creado correctamente",
        "id_producto": nuevo_id
    }), 201


@app.route("/api/productos/<int:id_producto>", methods=["PUT"])
def editar_producto(id_producto):
    try:
        datos = product_request_data()
    except ValueError as error:
        return jsonify({"mensaje": str(error)}), 400

    problema = validar_producto(datos)
    if problema:
        return jsonify({"mensaje": problema}), 400

    conexion = db.conectar()
    cursor = conexion.cursor()

    sql = """
        UPDATE productos SET
        nombre=%s, marca=%s, categoria=%s, precio=%s, stock=%s,
        estado=%s, descripcion_corta=%s, descripcion_tecnica=%s,
        imagen=%s, pantalla=%s, almacenamiento=%s, ram=%s,
        color=%s, peso=%s, garantia=%s
        WHERE id_producto=%s
    """

    valores = (
        datos["nombre"],
        datos["marca"],
        datos["categoria"],
        datos["precio"],
        datos["stock"],
        datos["estado"],
        datos["descripcion_corta"],
        datos["descripcion_tecnica"],
        datos["imagen"],
        datos.get("pantalla"),
        datos.get("almacenamiento"),
        datos.get("ram"),
        datos.get("color"),
        datos.get("peso"),
        datos.get("garantia"),
        id_producto
    )

    cursor.execute(sql, valores)
    conexion.commit()

    filas = cursor.rowcount

    cursor.close()
    conexion.close()

    if filas == 0:
        return jsonify({"mensaje": "Producto no encontrado"}), 404

    return jsonify({"mensaje": "Producto actualizado correctamente"})


@app.route("/api/productos/<int:id_producto>", methods=["DELETE"])
def eliminar_producto(id_producto):
    conexion = db.conectar()
    cursor = conexion.cursor()

    cursor.execute(
        "DELETE FROM productos WHERE id_producto = %s",
        (id_producto,)
    )
    conexion.commit()

    filas = cursor.rowcount

    cursor.close()
    conexion.close()

    if filas == 0:
        return jsonify({"mensaje": "Producto no encontrado"}), 404

    return jsonify({"mensaje": "Producto eliminado correctamente"})


# ---------------- LOGIN ----------------

@app.route("/api/login", methods=["POST"])
def login():
    datos = request.get_json(silent=True) or {}

    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")

    if not usuario or not contrasena:
        return jsonify({"mensaje": "Debes enviar usuario y contrasena"}), 400

    conexion = db.conectar()
    cursor = conexion.cursor()

    cursor.execute(
        "SELECT id_admin, usuario FROM administradores WHERE usuario=%s AND contrasena=%s",
        (usuario, contrasena)
    )

    administrador = cursor.fetchone()

    cursor.close()
    conexion.close()

    if administrador is None:
        return jsonify({"mensaje": "Usuario o contraseña incorrectos"}), 401

    return jsonify({
        "mensaje": "Inicio de sesión correcto",
        "administrador": administrador
    })


#COMPRAS

@app.route("/api/compras", methods=["POST"])
def crear_compra():
    datos = request.get_json(silent=True) or {}
    productos = datos.get("productos", [])

    if not isinstance(productos, list) or len(productos) == 0:
        return jsonify({"mensaje": "La compra no tiene productos"}), 400

    lineas = []
    for item in productos:
        if not isinstance(item, dict) or "id_producto" not in item or "cantidad" not in item:
            return jsonify({"mensaje": "Cada producto necesita id_producto y cantidad"}), 400
        try:
            id_producto = int(item["id_producto"])
            cantidad = int(item["cantidad"])
        except (TypeError, ValueError):
            return jsonify({"mensaje": "El id_producto y la cantidad deben ser numericos"}), 400
        if cantidad <= 0:
            return jsonify({"mensaje": "La cantidad debe ser mayor que cero"}), 400
        lineas.append({"id_producto": id_producto, "cantidad": cantidad})

    conexion = db.conectar()
    cursor = conexion.cursor()

    try:
        total = 0

        # Se valida y se guarda el precio antes de escribir nada.
        for linea in lineas:
            cursor.execute(
                "SELECT precio, stock FROM productos WHERE id_producto=%s",
                (linea["id_producto"],)
            )
            producto = cursor.fetchone()

            if producto is None:
                conexion.rollback()
                return jsonify({"mensaje": "Producto no encontrado"}), 404

            if producto["stock"] < linea["cantidad"]:
                conexion.rollback()
                return jsonify({"mensaje": "No hay suficiente stock"}), 400

            linea["precio"] = producto["precio"]
            linea["subtotal"] = producto["precio"] * linea["cantidad"]
            total = total + linea["subtotal"]

        cursor.execute(
            "INSERT INTO compras (total) VALUES (%s)",
            (total,)
        )

        id_compra = cursor.lastrowid

        for linea in lineas:
            cursor.execute(
                """
                INSERT INTO detalle_compra
                (id_compra, id_producto, cantidad, precio, subtotal)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    id_compra,
                    linea["id_producto"],
                    linea["cantidad"],
                    linea["precio"],
                    linea["subtotal"]
                )
            )

            cursor.execute(
                """
                UPDATE productos
                SET stock = stock - %s
                WHERE id_producto=%s AND stock >= %s
                """,
                (linea["cantidad"], linea["id_producto"], linea["cantidad"])
            )

            if cursor.rowcount == 0:
                conexion.rollback()
                return jsonify({"mensaje": "No hay suficiente stock"}), 400

        conexion.commit()
    except Exception:
        conexion.rollback()
        return jsonify({"mensaje": "No se pudo registrar la compra"}), 500
    finally:
        cursor.close()
        conexion.close()

    return jsonify({
        "mensaje": "Compra registrada correctamente",
        "id_compra": id_compra,
        "total": float(total)
    }), 201


#REPORTES

@app.route("/api/reportes/compras", methods=["GET"])
def reporte_compras():
    fecha = request.args.get("fecha")
    id_compra = request.args.get("id")

    conexion = db.conectar()
    cursor = conexion.cursor()

    sql = """
        SELECT id_compra, fecha, total
        FROM compras
        WHERE 1=1
    """
    valores = []

    if fecha:
        sql = sql + " AND DATE(fecha) = %s"
        valores.append(fecha)

    if id_compra:
        sql = sql + " AND id_compra = %s"
        valores.append(id_compra)

    sql = sql + " ORDER BY fecha DESC"

    cursor.execute(sql, valores)
    compras = cursor.fetchall()

    cursor.close()
    conexion.close()

    return jsonify(compras)


if __name__ == "__main__":
    app.run(debug=True)
