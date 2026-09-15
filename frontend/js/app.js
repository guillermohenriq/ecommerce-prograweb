const API_URL = "http://127.0.0.1:5000/api";
const CART_KEY = "techstore-carrito";

async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    headers: isFormData
      ? { ...(options.headers || {}) }
      : { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.mensaje || "No se pudo completar la solicitud.");
  }
  return data;
}

function money(value) {
  return `L. ${Number(value).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartLabels(cart);
}

function updateCartLabels(cart = getCart()) {
  const count = cart.reduce((total, item) => total + item.cantidad, 0);
  document
    .querySelectorAll('header nav a[href="carrito.html"]')
    .forEach((link) => {
      link.textContent = `Carrito (${count})`;
    });
}

function capitalize(text) {
  const value = String(text ?? "");
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function imagePath(image) {
  return image || "img/logo.svg";
}

function addImageFallback(image) {
  image.addEventListener("error", () => {
    image.onerror = null;
    image.src = "img/logo.svg";
  });
}

function productCard(product) {
  const features = [product.pantalla, product.almacenamiento, product.ram]
    .filter(Boolean)
    .map((value) => `<li>${value}</li>`)
    .join("");
  return `
        <article class="tarjeta-producto">
            <img src="${imagePath(product.imagen)}" alt="${product.nombre}">
            <p class="marca-producto">${product.marca}</p>
            <h3>${product.nombre}</h3>
            <p class="descripcion">${product.descripcion_corta}</p>
            <ul class="fichas">${features}</ul>
            <p class="precio">${money(product.precio)}</p>
            <a href="detalle.html?id=${product.id_producto}" class="boton">Ver detalle</a>
        </article>`;
}

async function loadCatalog() {
  const grid = document.querySelector(".grid-productos");
  if (!grid) return;
  grid.innerHTML = "";
  try {
    const products = await apiFetch("/productos");
    const available = products.filter((product) => product.estado === "activo");
    grid.innerHTML = available.map(productCard).join("");
    grid.querySelectorAll("img").forEach(addImageFallback);
    const subtitle = document.querySelector(".subtitulo");
    if (subtitle)
      subtitle.textContent = `${available.length} productos disponibles. Da clic en un producto para ver su detalle.`;
  } catch (error) {
    grid.innerHTML = `<p class="aviso">${error.message}</p>`;
  }
}

function technicalSheet(product) {
  const rows = [
    ["Marca", product.marca],
    ["Categoría", capitalize(product.categoria)],
    ["Pantalla", product.pantalla],
    ["Almacenamiento", product.almacenamiento],
    ["Memoria RAM", product.ram],
    ["Color", product.color],
    ["Peso", product.peso ? `${product.peso} gramos` : null],
    ["Garantía", product.garantia ? `${product.garantia} meses` : null],
  ];
  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");
}

async function loadDetail() {
  const detail = document.querySelector(".detalle-info");
  if (!detail) return;
  const id = new URLSearchParams(window.location.search).get("id") || "1";
  try {
    const product = await apiFetch(`/productos/${id}`);
    const image = document.querySelector(".detalle-imagen > img");
    if (image) {
      image.src = imagePath(product.imagen);
      image.alt = product.nombre;
      addImageFallback(image);
    }
    const gallery = document.querySelector(".galeria");
    if (gallery) {
      gallery.innerHTML = `<img src="${imagePath(product.imagen)}" alt="${product.nombre}">`;
      gallery.querySelectorAll("img").forEach(addImageFallback);
    }
    detail.querySelector(".marca-producto").textContent = product.marca;
    detail.querySelector("h2").textContent = product.nombre;
    detail.querySelector(".precio").textContent = money(product.precio);
    detail.querySelector(".disponible").textContent =
      product.stock > 0 ? "Disponible" : "Agotado";
    detail.querySelector(".existencias").textContent =
      ` · ${product.stock} unidades en existencia`;
    detail.querySelector(".descripcion").textContent =
      product.descripcion_tecnica;
    const sheet = document.querySelector(".tabla-ficha tbody");
    if (sheet) sheet.innerHTML = technicalSheet(product);
    const breadcrumb = document.querySelector(".migas .actual");
    if (breadcrumb) breadcrumb.textContent = product.nombre;
    const quantity = detail.querySelector("#cantidad");
    const addButton = detail.querySelector('a[href="carrito.html"]');
    if (quantity) {
      quantity.innerHTML = "";
      for (let value = 1; value <= Math.min(product.stock, 10); value += 1) {
        quantity.insertAdjacentHTML(
          "beforeend",
          `<option value="${value}">${value}</option>`,
        );
      }
      quantity.disabled = product.stock === 0;
    }
    if (addButton) {
      addButton.href = "#";
      addButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (!product.stock) return;
        const cart = getCart();
        const existing = cart.find(
          (item) => item.id_producto === product.id_producto,
        );
        const quantityValue = Number(quantity.value);
        if (existing)
          existing.cantidad = Math.min(
            existing.cantidad + quantityValue,
            product.stock,
          );
        else
          cart.push({
            id_producto: product.id_producto,
            cantidad: quantityValue,
          });
        saveCart(cart);
        window.location.href = "carrito.html";
      });
    }
    document.title = `${product.nombre} - TechStore`;
  } catch (error) {
    detail.innerHTML = `<p class="aviso">${error.message}</p>`;
  }
}

async function loadCartPage() {
  const tableBody = document.querySelector(".tabla tbody");
  if (!tableBody || !document.querySelector(".resumen")) return;
  tableBody.innerHTML = "";
  try {
    const products = await apiFetch("/productos");
    const cart = getCart();
    const items = cart
      .map((item) => ({
        ...item,
        product: products.find(
          (product) => product.id_producto === item.id_producto,
        ),
      }))
      .filter((item) => item.product);
    tableBody.innerHTML = items.length
      ? items
          .map(
            (item) => `
            <tr>
                <td><img src="${imagePath(item.product.imagen)}" alt="${item.product.nombre}" class="miniatura"></td>
                <td><strong>${item.product.nombre}</strong><br>${item.product.color || ""}</td>
                <td class="numero">${money(item.product.precio)}</td>
                <td class="numero">${item.cantidad}</td>
                <td class="numero">${money(item.product.precio * item.cantidad)}</td>
                <td><button type="button" class="boton eliminar pequeno quitar" data-id="${item.id_producto}">Quitar</button></td>
            </tr>`,
          )
          .join("")
      : '<tr><td colspan="6">El carrito está vacío.</td></tr>';
    tableBody.querySelectorAll("img").forEach(addImageFallback);
    const subtotal = items.reduce(
      (total, item) => total + Number(item.product.precio) * item.cantidad,
      0,
    );
    const tax = subtotal * 0.15;
    const total = subtotal + tax + (items.length ? 150 : 0);
    const lines = document.querySelectorAll(".resumen .linea span:last-child");
    if (lines[0]) lines[0].textContent = money(subtotal);
    if (lines[1]) lines[1].textContent = money(tax);
    if (lines[2]) lines[2].textContent = money(items.length ? 150 : 0);
    const totalElement = document.querySelector(
      ".resumen .total span:last-child",
    );
    if (totalElement) totalElement.textContent = money(total);
    tableBody.querySelectorAll(".quitar").forEach((button) =>
      button.addEventListener("click", () => {
        saveCart(
          getCart().filter(
            (item) => item.id_producto !== Number(button.dataset.id),
          ),
        );
        loadCartPage();
      }),
    );
    const checkout = document.querySelector(
      ".acciones .boton:not(.secundario):not(.eliminar)",
    );
    if (checkout)
      checkout.onclick = async (event) => {
        event.preventDefault();
        if (!items.length) return alert("El carrito está vacío.");
        try {
          const result = await apiFetch("/compras", {
            method: "POST",
            body: JSON.stringify({
              productos: items.map((item) => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
              })),
            }),
          });
          saveCart([]);
          alert(`${result.mensaje}. Total: ${money(result.total)}`);
          loadCartPage();
        } catch (error) {
          alert(error.message);
        }
      };
    const empty = document.querySelector(".acciones .eliminar");
    if (empty)
      empty.onclick = (event) => {
        event.preventDefault();
        saveCart([]);
        loadCartPage();
      };
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
  }
}

function getAdmin() {
  return JSON.parse(sessionStorage.getItem("techstore-admin") || "null");
}

function showAdminSession() {
  const bar = document.querySelector(".barra-admin");
  if (!bar) return;
  const admin = getAdmin();
  if (!admin) {
    window.location.replace("login.html");
    return;
  }
  const label = bar.querySelector(".sesion");
  if (label) label.textContent = `Sesión: ${admin.usuario}`;
  document.querySelectorAll(".cerrar-sesion").forEach((link) =>
    link.addEventListener("click", () => {
      sessionStorage.removeItem("techstore-admin");
    }),
  );
}

function fechaLegible(value) {
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-HN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function loadReports(filters = {}) {
  const tableBody = document.querySelector(".tabla-reporte tbody");
  if (!tableBody) return;
  const totalCell = document.querySelector(".total-reporte");
  const query = new URLSearchParams();
  if (filters.fecha) query.set("fecha", filters.fecha);
  if (filters.id) query.set("id", filters.id);
  const suffix = query.toString() ? `?${query}` : "";
  try {
    const purchases = await apiFetch(`/reportes/compras${suffix}`);
    tableBody.innerHTML = purchases.length
      ? purchases
          .map(
            (purchase) => `
            <tr>
                <td>${purchase.id_compra}</td>
                <td>${fechaLegible(purchase.fecha)}</td>
                <td class="numero">${money(purchase.total)}</td>
            </tr>`,
          )
          .join("")
      : '<tr><td colspan="3">No hay compras que coincidan con el filtro.</td></tr>';
    const total = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total),
      0,
    );
    if (totalCell) totalCell.textContent = money(total);
    const caption = document.querySelector(".tabla-reporte caption");
    if (caption)
      caption.textContent = `${purchases.length} compras registradas en la tienda.`;
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
    if (totalCell) totalCell.textContent = money(0);
  }
}

function setupReports() {
  const form = document.querySelector(".filtros-reporte");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadReports({
      fecha: form.elements.fecha.value,
      id: form.elements.id.value,
    });
  });
  form.addEventListener("reset", () => {
    window.setTimeout(() => loadReports(), 0);
  });
  loadReports();
}

function setupLogin() {
  const form = document.querySelector(".pagina-login form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const result = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({
          usuario: form.usuario.value,
          contrasena: form.contrasena.value,
        }),
      });
      sessionStorage.setItem(
        "techstore-admin",
        JSON.stringify(result.administrador),
      );
      window.location.href = "producto.html";
    } catch (error) {
      alert(error.message);
      button.disabled = false;
    }
  });
}

async function loadAdminProducts() {
  const tableBody = document.querySelector(".tabla-productos tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  try {
    const products = await apiFetch("/productos");
    tableBody.innerHTML = products
      .map(
        (product) => `
            <tr>
                <td>${product.id_producto}</td>
                <td><img src="${imagePath(product.imagen)}" alt="${product.nombre}" class="miniatura"></td>
                <td>${product.nombre}</td><td>${capitalize(product.categoria)}</td>
                <td class="numero">${money(product.precio)}</td><td class="numero">${product.stock}</td>
                <td><span class="estado estado-${product.estado === "activo" ? "activo" : "inactivo"}">${capitalize(product.estado)}</span></td>
                <td><a href="nuevoProducto.html?id=${product.id_producto}" class="boton secundario pequeno">Editar</a>
                <button type="button" class="boton eliminar pequeno borrar" data-id="${product.id_producto}">Eliminar</button></td>
            </tr>`,
      )
      .join("");
    tableBody.querySelectorAll("img").forEach(addImageFallback);
    const caption = document.querySelector(".tabla-productos caption");
    if (caption)
      caption.textContent = `${products.length} productos registrados en el catálogo.`;
    tableBody.querySelectorAll(".borrar").forEach((button) =>
      button.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este producto?")) return;
        try {
          await apiFetch(`/productos/${button.dataset.id}`, {
            method: "DELETE",
          });
          loadAdminProducts();
        } catch (error) {
          alert(error.message);
        }
      }),
    );
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8">${error.message}</td></tr>`;
  }
}

function setupProductForm() {
  const form = document.querySelector('form[action="producto.html"]');
  if (!form || document.querySelector(".pagina-login")) return;
  const id = new URLSearchParams(window.location.search).get("id");
  const submit = form.querySelector('button[type="submit"]');
  let existingImage = "img/logo.svg";
  if (id) {
    submit.textContent = "Actualizar producto";
    document.title = "Editar producto - TechStore";
    const heading = document.querySelector(".encabezado-pagina h2");
    if (heading) heading.textContent = "Editar producto";
    const breadcrumb = document.querySelector(".migas");
    if (breadcrumb)
      breadcrumb.innerHTML =
        '<a href="producto.html">Productos</a> / Editar producto';
    const imageInput = form.elements.imagen;
    if (imageInput) imageInput.required = false;
    apiFetch(`/productos/${id}`)
      .then((product) => {
        existingImage = product.imagen || existingImage;
        const values = {
          descripcionCorta: product.descripcion_corta,
          descripcionTecnica: product.descripcion_tecnica,
          ...product,
        };
        Object.entries(values).forEach(([key, value]) => {
          if (form.elements[key] && form.elements[key].type !== "file") {
            form.elements[key].value = value ?? "";
          }
        });
      })
      .catch((error) => alert(error.message));
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (id && !data.get("imagen")?.name) data.delete("imagen");
    if (id && !data.has("imagen")) data.append("imagen", existingImage);
    try {
      await apiFetch(id ? `/productos/${id}` : "/productos", {
        method: id ? "PUT" : "POST",
        body: data,
      });
      window.location.href = "producto.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartLabels();
  showAdminSession();
  loadCatalog();
  loadDetail();
  loadCartPage();
  loadAdminProducts();
  setupReports();
  setupLogin();
  setupProductForm();
});
