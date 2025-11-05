# mcdonalds-azul
# API Documentation - McDonalds's App

Documentación completa de los endpoints del backend de la aplicación de delivery de comida.

##  Tabla de Contenidos
- [Información General](#información-general)
- [Autenticación](#-autenticación)
- [Perfil de Usuario](#-perfil-de-usuario)
- [Direcciones](#-direcciones)
- [Home y Productos](#-home-y-productos)
- [Categorías](#-categorías)
- [Carrito de Compras](#-carrito-de-compras)
- [Checkout](#-checkout)
- [Cupones](#-cupones)
- [Restaurantes](#-restaurantes)
- [Flyers/Promociones](#-flyerspromociones)
- [Delivery (Repartidor)](#-delivery-repartidor)
- [Roles](#-roles)
- [Panel Admin](#-panel-admin)
- [Simulación (Dev)](#-simulación-desarrollo)
- [Códigos de Estado](#códigos-de-estado)
- [Modelos de Datos](#modelos-de-datos)

---

##  Información General

**Base URL:** http://localhost:3000/api

**Formatos soportados:** JSON

**Autenticación:** JWT Bearer Token

### Headers Comunes
Content-Type: application/json
Authorization: Bearer token


### Variables de Entorno Requeridas

PORT3000
DB_HOST127.0.0.1
DB_USERroot
DB_PASSWORD
DB_NAMEmcdonalds_bbdd
DB_PORT3306
JWT_SECRETtu_secreto_jwt
GOOGLE_CLIENT_IDtu_google_client_id
GOOGLE_CLIENT_SECRETtu_google_client_secret
API_URLhttp://localhost:3000
NODE_ENVdevelopment


##  Autenticación

### Registro Local
Registra un nuevo usuario con email y contraseña.

POST /auth/register


**Body:**

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "full_name": "John Doe"
}


**Respuesta exitosa (200):**

{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "auth_provider": "local"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}


**Errores:**
- 400 - Faltan datos requeridos
- 409 - El email ya está registrado

---

### Login Local
Inicia sesión con credenciales locales.


POST /auth/login


**Body:**

{
  "email": "john@example.com",
  "password": "password123"
}


**Respuesta exitosa (200):**

{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "54911234567",
    "address": "Calle 123, Mar del Plata",
    "profile_image_url": "/uploads/profile.jpg",
    "auth_provider": "local"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}


**Errores:**
- 400 - Email y contraseña son requeridos
- 401 - Email o contraseña incorrectos
- 401 - Esta cuenta usa autenticación social

---

### Login con Google
Inicia sesión usando Google OAuth.


POST /auth/google


**Body:**

{
  "id_token": "google_id_token_aqui"
}


**Respuesta exitosa (200):**

{
  "message": "Login con Google exitoso",
  "user": {
    "id": 1,
    "username": "John Doe",
    "email": "john@gmail.com",
    "full_name": "John Doe",
    "profile_image_url": "https://lh3.googleusercontent.com/...",
    "auth_provider": "google"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}


**Errores:**
- 400 - Token de Google requerido
- 401 - Token de Google inválido
- 409 - Este email ya está registrado con email y contraseña

---

### Registro con Google
Registra un nuevo usuario usando Google OAuth.


POST /auth/google/register


**Body:**

{
  "id_token": "google_id_token_aqui"
}


**Respuesta exitosa (200):**

{
  "message": "Registro con Google exitoso",
  "user": { /* datos del usuario */ },
  "token": "string"
}


**Errores:**
- 409 - Este email ya está registrado

---

### Obtener Usuario Actual
Obtiene la información del usuario autenticado.


GET /auth/me
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "54911234567",
    "address": "Calle 123, Mar del Plata",
    "latitude": -38.0055,
    "longitude": -57.5426,
    "profile_image_url": "/uploads/profile.jpg",
    "document_image_url": null,
    "auth_provider": "local",
    "is_verified": true,
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}


**Errores:**
- 401 - Token no proporcionado o inválido
- 404 - Usuario no encontrado

---

##  Perfil de Usuario

### Obtener Perfil Completo
Obtiene toda la información del perfil del usuario.


GET /profile
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "54911234567",
    "address": "Calle 123, Mar del Plata",
    "latitude": -38.0055,
    "longitude": -57.5426,
    "profile_image_url": "/uploads/profile.jpg",
    "document_image_url": "/uploads/dni.jpg",
    "auth_provider": "local",
    "is_verified": true,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z"
  }
}


---

### Actualizar Nombre de Usuario
Actualiza el nombre de usuario (permite duplicados).


PUT /profile/username
Authorization: Bearer token


**Body:**

{
  "username": "johndoe_new"
}


**Validaciones:**
- Mínimo 3 caracteres
- No puede estar vacío

**Respuesta exitosa (200):**

{
  "message": "Nombre actualizado exitosamente",
  "user": { /* usuario actualizado */ }
}


---

### Actualizar Email
Actualiza el email del usuario (debe ser único).


PUT /profile/email
Authorization: Bearer token


**Body:**

{
  "email": "newemail@example.com"
}


**Validaciones:**
- Formato de email válido
- No puede estar en uso por otro usuario

**Respuesta exitosa (200):**

{
  "message": "Email actualizado exitosamente",
  "user": { /* usuario actualizado */ }
}


**Errores:**
- 400 - Email inválido
- 409 - Este email ya está registrado

---

### Actualizar Perfil General
Actualiza múltiples campos del perfil.


PUT /profile
Authorization: Bearer token


**Body:**

{
  "email": "newemail@example.com",
  "full_name": "John Doe Updated",
  "phone": "54911234567",
  "address": "Nueva Calle 456",
  "latitude": -38.0055,
  "longitude": -57.5426
}


**Nota:** Todos los campos son opcionales.

---

### Subir Foto de Perfil
Sube o actualiza la foto de perfil del usuario.


POST /profile/image
Authorization: Bearer token
Content-Type: multipart/form-data


**Body (FormData):**
- image: archivo (JPEG, PNG, max 5MB)

**Respuesta exitosa (200):**

{
  "message": "Foto de perfil actualizada",
  "profile_image_url": "/uploads/1234567890-profile.jpg"
}


**Errores:**
- 400 - No se proporcionó imagen
- 400 - Solo se permiten imágenes (JPEG, PNG)

---

### Subir Documento de Identidad
Sube el documento de identidad del usuario (para repartidores).


POST /profile/document
Authorization: Bearer token
Content-Type: multipart/form-data


**Body (FormData):**
- document: archivo (JPEG, PNG, PDF, max 5MB)

**Respuesta exitosa (200):**

{
  "message": "Documento subido exitosamente",
  "document_image_url": "/uploads/1234567890-document.pdf"
}


---

### Eliminar Documento
Elimina el documento de identidad del usuario.


DELETE /profile/document
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "message": "Documento eliminado exitosamente"
}


---

### Actualizar Ubicación
Actualiza la ubicación del usuario.


PUT /profile/location
Authorization: Bearer token


**Body:**

{
  "latitude": -38.0055,
  "longitude": -57.5426,
  "address": "Calle 123, Mar del Plata"
}


**Respuesta exitosa (200):**

{
  "message": "Ubicación actualizada exitosamente",
  "location": {
    "latitude": -38.0055,
    "longitude": -57.5426,
    "address": "Calle 123, Mar del Plata"
  }
}


---

### Eliminar Cuenta
Elimina permanentemente la cuenta del usuario.


DELETE /profile
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "message": "Cuenta eliminada exitosamente"
}


---

### Obtener Historial de Pedidos
Obtiene los últimos 50 pedidos del usuario.


GET /profile/orders
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "orders": [
    {
      "id": 1,
      "total": 15000,
      "status": "completed",
      "order_type": "delivery",
      "delivery_address": "Calle 123",
      "created_at": "2025-01-15T10:00:00.000Z",
      "items_count": 3
    }
  ]
}


---

### Obtener Roles del Usuario
Obtiene los roles asignados al usuario.


GET /profile/roles
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "roles": ["cliente", "repartidor"]
}


---

##  Direcciones

### Listar Direcciones
Obtiene todas las direcciones guardadas del usuario.


GET /user/addresses
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "addresses": [
    {
      "id": 1,
      "label": "Casa",
      "address": "Calle 123, Mar del Plata",
      "latitude": -38.0055,
      "longitude": -57.5426,
      "is_default": true
    },
    {
      "id": 2,
      "label": "Trabajo",
      "address": "Av. Colón 2500, Mar del Plata",
      "latitude": -38.0065,
      "longitude": -57.5436,
      "is_default": false
    }
  ]
}


---

### Agregar Dirección
Agrega una nueva dirección para el usuario.


POST /user/addresses
Authorization: Bearer token


**Body:**

{
  "label": "Casa",
  "address": "Calle 123, Mar del Plata",
  "latitude": -38.0055,
  "longitude": -57.5426,
  "is_default": false
}


**Campos:**
- label (opcional): Etiqueta descriptiva, default: "Casa"
- address (requerido): Dirección completa
- latitude (opcional): Latitud
- longitude (opcional): Longitud
- is_default (opcional): Marcar como predeterminada, default: false

**Respuesta exitosa (201):**

{
  "success": true,
  "id": 1,
  "message": "Dirección guardada."
}


**Errores:**
- 400 - La dirección es obligatoria

---

### Actualizar Dirección
Actualiza una dirección existente.


PUT /user/addresses/:id
Authorization: Bearer token


**Body:**

{
  "label": "Casa Nueva",
  "address": "Calle 456, Mar del Plata",
  "latitude": -38.0065,
  "longitude": -57.5436,
  "is_default": true
}


**Nota:** Todos los campos son opcionales.

**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Dirección actualizada."
}


**Errores:**
- 403 - Acceso denegado
- 404 - Dirección no encontrada

---

### Eliminar Dirección
Elimina una dirección del usuario.


DELETE /user/addresses/:id
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Dirección eliminada."
}


---

##  Home y Productos

### Obtener Categorías
Lista todas las categorías activas.


GET /home/categories


**Respuesta exitosa (200):**

{
  "categories": [
    {
      "id": 1,
      "name": "McCombos",
      "icon": "",
      "display_order": 1
    },
    {
      "id": 2,
      "name": "Hamburguesas",
      "icon": "",
      "display_order": 2
    }
  ]
}


---

### Obtener Productos
Lista productos disponibles, opcionalmente filtrados por categoría.


GET /home/products?categoryMcCombos


**Query Params:**
- category (opcional): Nombre de la categoría

**Respuesta exitosa (200):**

{
  "products": [
    {
      "id": 1,
      "name": "Big Mac Mediano",
      "description": "Hamburguesa con doble carne, queso cheddar, lechuga y salsa Big Mac",
      "price": 13100,
      "image_url": "https://d2umxhib5z7frz.cloudfront.net/Argentina/26000PRUEBA3.png",
      "category": "McCombos",
      "is_combo": true
    }
  ]
}


---

### Obtener Detalle de Producto
Obtiene información completa de un producto incluyendo tamaños, ingredientes, acompañamientos y bebidas.


GET /home/products/:id


**Respuesta exitosa (200):**

{
  "product": {
    "id": 1,
    "name": "Big Mac Mediano",
    "description": "Hamburguesa con doble carne...",
    "base_price": 13100,
    "image_url": "https://...",
    "category": "McCombos",
    "is_combo": true,
    "sizes": [
      {
        "id": 1,
        "name": "Mediano",
        "price_modifier": 0
      },
      {
        "id": 2,
        "name": "Grande",
        "price_modifier": 4820
      }
    ],
    "ingredients": [
      {
        "id": 1,
        "name": "Pan",
        "is_required": true,
        "is_default": true,
        "is_removable": false,
        "max_quantity": 1,
        "extra_price": 0
      },
      {
        "id": 2,
        "name": "Carne",
        "is_required": true,
        "is_default": true,
        "is_removable": false,
        "max_quantity": 4,
        "extra_price": 1500
      }
    ],
    "sides": [
      {
        "id": 1,
        "name": "Papas Fritas Medianas",
        "extra_price": 0,
        "image_url": null
      },
      {
        "id": 2,
        "name": "Papas Tasty Bacon",
        "extra_price": 3900,
        "image_url": null
      }
    ],
    "drinks": [
      {
        "id": 1,
        "name": "Coca-Cola",
        "extra_price": 0,
        "image_url": null
      },
      {
        "id": 6,
        "name": "Agua",
        "extra_price": 300,
        "image_url": null
      }
    ]
  }
}


---

### Obtener Flyers
Obtiene las promociones activas.


GET /home/flyers


**Respuesta exitosa (200):**

{
  "flyers": [
    {
      "id": 1,
      "title": "Menú Fórmula 1 La Película!",
      "description": "Edición limitada del Cuarto de Libra...",
      "image": "https://pbs.twimg.com/media/GuKWXk1WMAA_e-I.jpg:large",
      "link": "https://x.com/McDonalds_Ar/status/1937526128098603295"
    }
  ]
}


---

##  Categorías

### Listar Categorías
Obtiene todas las categorías activas.


GET /categories


**Respuesta exitosa (200):**

{
  "categories": [
    {
      "id": 1,
      "name": "McCombos",
      "icon": ""
    }
  ]
}


---

##  Carrito de Compras

### Obtener Carrito
Obtiene el carrito actual del usuario con todos sus items.


GET /cart
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "cart": {
    "id": 1,
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Big Mac Mediano",
        "product_image": "https://...",
        "size": "Mediano",
        "side": "Papas Fritas Medianas",
        "drink": "Coca-Cola",
        "quantity": 2,
        "unit_price": 13100,
        "total_price": 26200,
        "customizations": {
          "ingredients": {
            "2": 2,
            "3": 1
          },
          "removed": [5]
        }
      }
    ],
    "subtotal": 26200,
    "total": 26200,
    "coupon_id": null,
    "coupon_title": null,
    "discount_type": null,
    "discount_value": null,
    "discount_amount": 0
  }
}


---

### Agregar Item al Carrito
Agrega un producto al carrito con sus personalizaciones.


POST /cart/items
Authorization: Bearer token


**Body:**

{
  "product_id": 1,
  "size_id": 1,
  "side_id": 1,
  "drink_id": 1,
  "quantity": 2,
  "customizations": "{\"ingredients\":{\"2\":2,\"3\":1},\"removed\":[5]}"
}


**Campos:**
- product_id (requerido): ID del producto
- size_id (opcional): ID del tamaño
- side_id (opcional): ID del acompañamiento
- drink_id (opcional): ID de la bebida
- quantity (opcional): Cantidad, default: 1
- customizations (opcional): JSON string con personalizaciones

**Respuesta exitosa (201):**

{
  "success": true,
  "message": "Producto agregado al carrito",
  "item_id": 1
}


**Errores:**
- 400 - El producto es requerido
- 404 - Producto no encontrado

---

### Actualizar Cantidad de Item
Actualiza la cantidad de un item en el carrito.


PUT /cart/items/:id
Authorization: Bearer token


**Body:**

{
  "quantity": 3
}


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Cantidad actualizada"
}


**Errores:**
- 400 - Cantidad inválida
- 404 - Item no encontrado

---

### Eliminar Item del Carrito
Elimina un item específico del carrito.


DELETE /cart/items/:id
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Item eliminado del carrito"
}


---

### Vaciar Carrito
Elimina todos los items del carrito.


DELETE /cart
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Carrito vaciado"
}


---

### Aplicar Cupón
Aplica un cupón de descuento al carrito.


POST /cart/apply-coupon
Authorization: Bearer token


**Body:**

{
  "coupon_id": 1
}


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Descuento de $2500 aplicado",
  "discount": 2500
}


**Errores:**
- 400 - Compra mínima de $X requerida
- 404 - Cupón no válido o expirado

---

### Remover Cupón
Remueve el cupón aplicado al carrito.


DELETE /cart/coupon
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Cupón removido"
}


---

### Actualizar Restaurante del Carrito
Actualiza el restaurante asociado al carrito (para pickup).


PUT /cart/:id/restaurant
Authorization: Bearer token


**Body:**

{
  "restaurant_id": 1
}


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Restaurante actualizado en el carrito"
}


---

##  Checkout

### Obtener Información de Checkout
Obtiene el resumen del carrito y la información de entrega para el checkout.


GET /checkout
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "success": true,
  "cart": {
    "items": [
      {
        "id": 1,
        "name": "Big Mac Mediano",
        "image_url": "https://...",
        "size_name": "Mediano",
        "side_name": "Papas Fritas Medianas",
        "drink_name": "Coca-Cola",
        "quantity": 2,
        "unit_price": 13100,
        "total_price": 26200,
        "customizations": "{...}"
      }
    ],
    "subtotal": 26200,
    "discount": 0,
    "total": 26200
  },
  "delivery": {
    "type": "delivery",
    "label": "Mi dirección",
    "address": "Calle 123, Mar del Plata",
    "latitude": -38.0055,
    "longitude": -57.5426
  }
}


**Tipos de entrega:**
- delivery: Entrega a domicilio (usa la dirección del usuario)
- pickup: Retiro en el restaurante (usa el restaurant_id del carrito)

---

### Completar Pedido
Procesa y confirma el pedido.


POST /checkout/complete
Authorization: Bearer token


**Body:**

{
  "payment_method": "card",
  "tip": 500
}


**Campos:**
- payment_method (requerido): "card" o "cash"
- tip (opcional): Propina en pesos, default: 0

**Respuesta exitosa (200):**

{
  "success": true,
  "message": "¡Pedido realizado con éxito!",
  "order_id": 1
}


**Errores:**
- 400 - Método de pago requerido
- 400 - Carrito vacío

**Nota:** El pedido se crea con:
- Status: "confirmed"
- Payment status: "paid"
- Se vacía el carrito automáticamente
- Se incrementa el contador de uso del cupón (si se aplicó)

---

##  Cupones

### Listar Cupones Activos
Obtiene todos los cupones disponibles para los clientes.


GET /coupons/active


**Respuesta exitosa (200):**

{
  "success": true,
  "coupons": [
    {
      "id": 1,
      "title": "20% OFF en tu primera compra",
      "description": "Descuento del 20% en compras mayores a $10000",
      "discount_type": "percentage",
      "discount_value": 20,
      "min_purchase": 10000,
      "max_discount": 5000,
      "image_url": "https://...",
      "start_date": "2025-01-01T00:00:00.000Z",
      "end_date": "2025-12-31T23:59:59.000Z",
      "product_id": null
    }
  ]
}


**Tipos de descuento:**
- percentage: Descuento porcentual
- fixed: Descuento fijo en pesos

---

### Crear Cupón (Admin)
Crea un nuevo cupón de descuento.


POST /coupons
Authorization: Bearer token
Requires: role  admin


**Body:**

{
  "title": "20% OFF",
  "description": "Descuento especial",
  "discount_type": "percentage",
  "discount_value": 20,
  "min_purchase": 10000,
  "max_discount": 5000,
  "image_url": "https://...",
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-12-31T23:59:59.000Z",
  "is_active": true,
  "usage_limit": 100,
  "product_id": null
}


**Campos requeridos:**
- title: Título del cupón
- discount_type: "percentage" o "fixed"
- discount_value: Valor del descuento

**Campos opcionales:**
- description: Descripción
- min_purchase: Compra mínima (default: 0)
- max_discount: Descuento máximo
- image_url: URL de la imagen
- start_date: Fecha de inicio
- end_date: Fecha de fin
- is_active: Si está activo (default: true)
- usage_limit: Límite de usos
- product_id: ID del producto específico

**Respuesta exitosa (201):**

{
  "success": true,
  "couponId": 1,
  "message": "Cupón creado exitosamente."
}


---

### Actualizar Cupón (Admin)
Actualiza un cupón existente.


PUT /coupons/:id
Authorization: Bearer token
Requires: role  admin


**Body:** (todos los campos opcionales)

{
  "title": "25% OFF",
  "is_active": false
}


---

### Eliminar Cupón (Admin)
Elimina un cupón.


DELETE /coupons/:id
Authorization: Bearer token
Requires: role  admin


---

### Listar Todos los Cupones (Admin)
Obtiene todos los cupones (activos e inactivos).


GET /coupons
Authorization: Bearer token
Requires: role  admin


**Respuesta exitosa (200):**

{
  "success": true,
  "coupons": [
    {
      "id": 1,
      "title": "20% OFF",
      "description": "...",
      "discount_type": "percentage",
      "discount_value": 20,
      "min_purchase": 10000,
      "max_discount": 5000,
      "image_url": "https://...",
      "start_date": "2025-01-01T00:00:00.000Z",
      "end_date": "2025-12-31T23:59:59.000Z",
      "is_active": true,
      "usage_limit": 100,
      "used_count": 25,
      "product_id": null,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}


---

##  Restaurantes

### Listar Restaurantes
Obtiene todos los restaurantes abiertos.


GET /restaurants


**Respuesta exitosa (200):**

{
  "success": true,
  "restaurants": [
    {
      "id": 1,
      "name": "McDonald's - Mar del Plata Centro",
      "address": "San Juan 1532, Mar del Plata, Buenos Aires",
      "latitude": -38.0055,
      "longitude": -57.5426,
      "phone": "54 223 123-4567",
      "is_open": true,
      "opening_time": "08:00:00",
      "closing_time": "23:00:00"
    }
  ]
}


---

### Obtener Restaurante
Obtiene los detalles de un restaurante específico.


GET /restaurants/:id


**Respuesta exitosa (200):**

{
  "success": true,
  "restaurant": {
    "id": 1,
    "name": "McDonald's - Mar del Plata Centro",
    "address": "San Juan 1532, Mar del Plata, Buenos Aires",
    "latitude": -38.0055,
    "longitude": -57.5426,
    "phone": "54 223 123-4567",
    "is_open": true,
    "opening_time": "08:00:00",
    "closing_time": "23:00:00"
  }
}


---

### Crear Restaurante (Admin)
Crea un nuevo restaurante.


POST /restaurants
Authorization: Bearer token
Requires: role  admin


**Body:**

{
  "name": "McDonald's - Nueva Sucursal",
  "address": "Av. Colón 2500, Mar del Plata",
  "latitude": -38.0065,
  "longitude": -57.5436,
  "phone": "54 223 123-4568",
  "is_open": true,
  "opening_time": "08:00:00",
  "closing_time": "23:00:00"
}


**Campos requeridos:**
- name: Nombre del restaurante
- address: Dirección completa
- latitude: Latitud
- longitude: Longitud

**Respuesta exitosa (201):**

{
  "success": true,
  "id": 2,
  "message": "Restaurante creado exitosamente."
}


---

### Actualizar Restaurante (Admin)
Actualiza un restaurante existente.


PUT /restaurants/:id
Authorization: Bearer token
Requires: role  admin


**Body:** (todos los campos opcionales)

{
  "name": "McDonald's - Sucursal Centro",
  "is_open": false
}


---

### Eliminar Restaurante (Admin)
Elimina un restaurante.


DELETE /restaurants/:id
Authorization: Bearer token
Requires: role  admin


---

##  Flyers/Promociones

### Listar Flyers Activos
Obtiene las promociones activas.


GET /flyers


**Respuesta exitosa (200):**

{
  "flyers": [
    {
      "id": 1,
      "title": "Menú Fórmula 1 La Película!",
      "description": "Edición limitada del Cuarto de Libra con Salsa Barbacoa y Bacon",
      "image": "https://pbs.twimg.com/media/GuKWXk1WMAA_e-I.jpg:large",
      "link": "https://x.com/McDonalds_Ar/status/1937526128098603295"
    }
  ]
}


---

##  Delivery (Repartidor)

### Obtener Pedidos Disponibles
Lista pedidos confirmados disponibles para aceptar.


GET /delivery/orders/available
Authorization: Bearer token
Requires: role  repartidor


**Respuesta exitosa (200):**

{
  "orders": [
    {
      "id": 1,
      "total": 15000,
      "delivery_address": "Calle 123, Mar del Plata",
      "status": "confirmed",
      "driver_id": null,
      "restaurant_name": "McDonald's - Mar del Plata Centro",
      "restaurant_address": "San Juan 1532",
      "customer_name": "John Doe",
      "customer_phone": "54911234567",
      "minutes_ago": 5,
      "estimated_delivery_time": 30
    }
  ]
}


**Nota:** No muestra pedidos que el repartidor ya rechazó.

---

### Aceptar Pedido
Acepta un pedido disponible.


POST /delivery/orders/accept
Authorization: Bearer token
Requires: role  repartidor


**Body:**

{
  "order_id": 1
}


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Pedido aceptado correctamente",
  "order_id": 1
}


**Cambios:**
- Status del pedido cambia a "preparing"
- Se asigna el driver_id

**Errores:**
- 400 - No estás registrado como repartidor
- 400 - El pedido no está disponible o ya fue aceptado

---

### Rechazar Pedido
Rechaza un pedido (no volverá a aparecer para este repartidor).


POST /delivery/orders/reject
Authorization: Bearer token
Requires: role  repartidor


**Body:**

{
  "order_id": 1
}


**Respuesta exitosa (200):**

{
  "success": true,
  "message": "Pedido rechazado correctamente",
  "order_id": 1
}


**Nota:** El rechazo se registra en la tabla order_rejections.

---

### Obtener Pedidos Activos
Lista los pedidos asignados al repartidor que están en proceso.


GET /delivery/orders/active
Authorization: Bearer token
Requires: role  repartidor


**Respuesta exitosa (200):**

{
  "orders": [
    {
      "id": 1,
      "total": 15000,
      "delivery_address": "Calle 123, Mar del Plata",
      "restaurant_name": "McDonald's - Mar del Plata Centro",
      "restaurant_address": "San Juan 1532",
      "customer_name": "John Doe",
      "customer_phone": "54911234567",
      "status": "preparing",
      "pickup_time": null,
      "delivered_time": null,
      "estimated_delivery_time": 30
    }
  ]
}


**Estados posibles:**
- preparing: El restaurante está preparando el pedido
- ready: El pedido está listo para retirar
- delivering: El repartidor retiró el pedido

---

### Marcar como Retirado
Marca un pedido como retirado del restaurante.


POST /delivery/orders/pickup
Authorization: Bearer token
Requires: role  repartidor


**Body:**

{
  "order_id": 1
}


**Respuesta exitosa (200):**

{
  "message": "Pedido marcado como retirado",
  "order_id": 1
}


**Cambios:**
- Status cambia a "delivering"
- Se registra pickup_time

---

### Marcar como Entregado
Marca un pedido como entregado al cliente.


POST /delivery/orders/deliver
Authorization: Bearer token
Requires: role  repartidor


**Body:**

{
  "order_id": 1
}


**Respuesta exitosa (200):**

{
  "message": "Pedido marcado como entregado",
  "order_id": 1
}


**Cambios:**
- Status cambia a "completed"
- Se registra delivered_time

---

### Obtener Historial de Entregas
Lista los pedidos completados por el repartidor.


GET /delivery/orders/history?page1&limit10
Authorization: Bearer token
Requires: role  repartidor


**Query Params:**
- page (opcional): Número de página, default: 1
- limit (opcional): Items por página, default: 10

**Respuesta exitosa (200):**

{
  "orders": [
    {
      "id": 1,
      "total": 15000,
      "delivery_address": "Calle 123",
      "restaurant_name": "McDonald's - Mar del Plata Centro",
      "customer_name": "John Doe",
      "delivered_time": "2025-01-15T14:30:00.000Z",
      "created_at": "2025-01-15T13:00:00.000Z",
      "items_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}


---

##  Roles

### Obtener Roles de un Usuario
Obtiene los roles asignados a un usuario específico.


GET /roles/user/:user_id/roles
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "user_id": 1,
  "roles": ["cliente", "repartidor"]
}


---

### Listar Todos los Roles (Admin)
Obtiene todos los roles disponibles en el sistema.


GET /roles
Authorization: Bearer token
Requires: role  admin


**Respuesta exitosa (200):**

{
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "description": "Administrador del sistema"
    },
    {
      "id": 2,
      "name": "cliente",
      "description": "Cliente de la aplicación"
    },
    {
      "id": 3,
      "name": "repartidor",
      "description": "Repartidor de pedidos"
    }
  ]
}


---

##  Panel Admin

### Listar Usuarios
Lista todos los usuarios del sistema.


GET /admin/usuarios?rolecliente
Authorization: Bearer token
Requires: role  admin


**Query Params:**
- role (opcional): "repartidor" para filtrar solo repartidores

**Respuesta exitosa (200):**

{
  "usuarios": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone": "54911234567",
      "profile_image_url": "/uploads/profile.jpg",
      "roles": ["cliente", "repartidor"]
    }
  ]
}


---

### Obtener Usuario
Obtiene los detalles de un usuario específico.


GET /admin/usuarios/:id
Authorization: Bearer token
Requires: role  admin


**Respuesta exitosa (200):**

{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "phone": "54911234567",
  "profile_image_url": "/uploads/profile.jpg",
  "is_verified": true
}


---

### Crear Usuario (Admin)
Crea un nuevo usuario.


POST /admin/usuarios
Authorization: Bearer token
Requires: role  admin


**Body:**

{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "54911234568",
  "password": "password123",
  "role": "cliente"
}


**Campos requeridos:**
- email: Email del usuario
- password: Contraseña

**Campos opcionales:**
- full_name: Nombre completo
- phone: Teléfono
- role: Rol a asignar (default: "cliente")

**Respuesta exitosa (201):**

{
  "id": 2,
  "username": null,
  "email": "jane@example.com",
  "full_name": "Jane Doe",
  "phone": "54911234568",
  "profile_image_url": null
}


---

### Actualizar Usuario (Admin)
Actualiza información de un usuario.


PUT /admin/usuarios/:id
Authorization: Bearer token
Requires: role  admin


**Body:** (todos los campos opcionales)

{
  "full_name": "Jane Doe Updated",
  "email": "jane.new@example.com",
  "phone": "54911234569"
}


---

### Eliminar Usuario (Admin)
Elimina un usuario del sistema.


DELETE /admin/usuarios/:id
Authorization: Bearer token
Requires: role  admin


**Respuesta exitosa (200):**

{
  "message": "Usuario eliminado exitosamente"
}


**Restricciones:**
- No se puede eliminar a sí mismo
- No se puede eliminar al último administrador

---

### Listar Productos (Admin)
Lista todos los productos (disponibles y no disponibles).


GET /admin/productos
Authorization: Bearer token
Requires: role  admin


**Respuesta exitosa (200):**

{
  "products": [
    {
      "id": 1,
      "name": "Big Mac Mediano",
      "description": "...",
      "price": 13100,
      "image_url": "https://...",
      "category": "McCombos",
      "is_available": true,
      "is_combo": true
    }
  ]
}


---

### Obtener Producto (Admin)
Obtiene los detalles de un producto.


GET /admin/productos/:id
Authorization: Bearer token
Requires: role  admin


---

### Crear Producto (Admin)
Crea un nuevo producto.


POST /admin/productos
Authorization: Bearer token
Requires: role  admin


**Body:**

{
  "name": "Nuevo Combo",
  "description": "Descripción del combo",
  "price": 15000,
  "category_id": 1,
  "is_available": true
}


**Campos requeridos:**
- name: Nombre del producto
- price: Precio base
- category_id: ID de la categoría

---

### Actualizar Producto (Admin)
Actualiza un producto existente.


PUT /admin/productos/:id
Authorization: Bearer token
Requires: role  admin


**Body:** (todos los campos opcionales)

{
  "name": "Big Mac Grande",
  "price": 17920,
  "is_available": false
}


---

### Eliminar Producto (Admin)
Elimina un producto del sistema.


DELETE /admin/productos/:id
Authorization: Bearer token
Requires: role  admin


---

### Gestión de Restaurantes (Admin)
Ver sección [Restaurantes](#-restaurantes) - todos los endpoints de creación, actualización y eliminación requieren rol admin.

---

### Gestión de Cupones (Admin)
Ver sección [Cupones](#-cupones) - todos los endpoints de gestión requieren rol admin.

---

### Gestión de Flyers (Admin)

#### Listar Flyers

GET /admin/flyers
Authorization: Bearer token
Requires: role  admin


**Respuesta exitosa (200):**

{
  "flyers": [
    {
      "id": 1,
      "title": "Menú Fórmula 1",
      "description": "...",
      "image_url": "https://...",
      "link_url": "https://...",
      "display_order": 1,
      "start_date": "2025-01-01T00:00:00.000Z",
      "end_date": "2025-12-31T23:59:59.000Z",
      "is_active": true
    }
  ]
}


#### Obtener Flyer

GET /admin/flyers/:id
Authorization: Bearer token
Requires: role  admin


#### Crear Flyer

POST /admin/flyers
Authorization: Bearer token
Requires: role  admin


**Body:**

{
  "title": "Nueva Promoción",
  "description": "Descripción de la promo",
  "image_url": "https://...",
  "link_url": "https://...",
  "display_order": 1,
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-12-31T23:59:59.000Z",
  "is_active": true
}


**Campos requeridos:**
- title: Título del flyer
- image_url: URL de la imagen

#### Actualizar Flyer

PUT /admin/flyers/:id
Authorization: Bearer token
Requires: role  admin


#### Eliminar Flyer

DELETE /admin/flyers/:id
Authorization: Bearer token
Requires: role  admin


---

##  Simulación (Desarrollo)

**Nota:** Estos endpoints solo están disponibles cuando NODE_ENVdevelopment.

### Generar Pedido Simulado
Genera un pedido aleatorio para testing.


POST /simulation/orders/generate
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "message": "Pedido simulado generado correctamente",
  "order": {
    "id": 1,
    "restaurant_name": "McDonald's - Mar del Plata Centro",
    "restaurant_address": "San Juan 1532",
    "delivery_address": "Av. Colón 2500, Mar del Plata",
    "total": 18500,
    "estimated_delivery_time": 25,
    "customer_name": "Cliente Demo",
    "customer_phone": "5491112345678"
  }
}


---

### Generar Múltiples Pedidos
Genera varios pedidos simulados.


POST /simulation/orders/generate-multiple
Authorization: Bearer token


**Body:**

{
  "count": 5
}


**Respuesta exitosa (200):**

{
  "message": "5 pedidos simulados generados",
  "orders": [
    { /* pedido 1 */ },
    { /* pedido 2 */ }
  ]
}


---

### Simular Pedidos Listos
Marca pedidos en "preparing" como "ready" automáticamente.


POST /simulation/orders/simulate-ready
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "message": "3 pedidos marcados como listos",
  "updated_orders": 3
}


---

### Limpiar Pedidos Antiguos
Elimina pedidos confirmados sin asignar de más de 1 hora.


DELETE /simulation/orders/cleanup
Authorization: Bearer token


**Respuesta exitosa (200):**

{
  "message": "10 pedidos antiguos eliminados",
  "deleted_count": 10
}


---

##  Códigos de Estado

### Códigos de Éxito
- 200 - OK: Solicitud exitosa
- 201 - Created: Recurso creado exitosamente

### Códigos de Error del Cliente
- 400 - Bad Request: Solicitud malformada o datos inválidos
- 401 - Unauthorized: No autenticado o token inválido
- 403 - Forbidden: No tiene permisos para esta acción
- 404 - Not Found: Recurso no encontrado
- 409 - Conflict: Conflicto (ej: email duplicado)

### Códigos de Error del Servidor
- 500 - Internal Server Error: Error interno del servidor

---

##  Modelos de Datos

### Usuario (User)

{
  id: number
  username: string
  email: string
  full_name: string  null
  phone: string  null
  address: string  null
  latitude: number  null
  longitude: number  null
  profile_image_url: string  null
  document_image_url: string  null
  auth_provider: 'local'  'google'  'facebook'
  provider_id: string  null
  is_verified: boolean
  created_at: Date
  updated_at: Date
}


### Producto (Product)

{
  id: number
  name: string
  description: string  null
  category_id: number
  base_price: number
  image_url: string  null
  is_available: boolean
  is_combo: boolean
  display_order: number
  created_at: Date
  updated_at: Date
}


### Pedido (Order)

{
  id: number
  user_id: number
  restaurant_id: number  null
  delivery_address: string  null
  delivery_latitude: number  null
  delivery_longitude: number  null
  order_type: 'delivery'  'pickup'
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  status: 'pending'  'confirmed'  'preparing'  'ready'  'delivering'  'completed'  'cancelled'
  payment_method: 'card'  'cash'
  payment_status: 'pending'  'paid'  'failed'
  coupon_id: number  null
  driver_id: number  null
  notes: string  null
  created_at: Date
  updated_at: Date
}


### Cupón (Coupon)

{
  id: number
  code: string
  title: string
  description: string  null
  discount_type: 'percentage'  'fixed'
  discount_value: number
  min_purchase: number
  max_discount: number  null
  image_url: string  null
  start_date: Date  null
  end_date: Date  null
  is_active: boolean
  usage_limit: number  null
  used_count: number
  product_id: number  null
  created_at: Date
  updated_at: Date
}


### Restaurante (Restaurant)

{
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string  null
  is_open: boolean
  opening_time: string  null
  closing_time: string  null
  created_at: Date
  updated_at: Date
}


---

##  Seguridad

### JWT Token
- **Expiración:** 7 días
- **Algoritmo:** HS256
- **Payload:** { id, username, email }

### Autenticación OAuth
- **Google OAuth 2.0**
- Verifica token con https://www.googleapis.com/oauth2/v3/tokeninfo
- Valida aud (client_id) y exp (expiración)

### Subida de Archivos
- **Formatos permitidos:** JPEG, PNG, PDF
- **Tamaño máximo:** 5MB
- **Almacenamiento:** /uploads directory
- **Nombres:** {user_id}-{timestamp}-{random}.{ext}

### Validaciones
- Emails: validación con regex
- Contraseñas: sin restricciones específicas (hash con bcrypt)
- Tokens: verificados en cada request protegido

---

##  Guía de Inicio Rápido

### 1. Configurar Variables de Entorno
Crear archivo .env:
env
PORT3000
DB_HOST127.0.0.1
DB_USERroot
DB_PASSWORD
DB_NAMEmcdonalds_bbdd
JWT_SECRETtu_secreto_super_seguro
GOOGLE_CLIENT_IDtu_google_client_id
GOOGLE_CLIENT_SECRETtu_google_client_secret
API_URLhttp://localhost:3000
NODE_ENVdevelopment


### 2. Instalar Dependencias

npm install


### 3. Importar Base de Datos

mysql -u root -p mcdonalds_bbdd  mcdonalds_bbdd.sql


### 4. Iniciar Servidor

# Desarrollo
npm run dev

# Producción
npm start


### 5. Probar Endpoints

# Health check
curl http://localhost:3000/health

# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass123"}'


---

##  Notas Adicionales

### Gestión de Carrito
- El carrito se crea automáticamente al agregar el primer item
- Un usuario solo puede tener un carrito activo
- Al completar un pedido, el carrito se vacía automáticamente

### Sistema de Roles
- **admin**: Acceso completo al panel de administración
- **cliente**: Usuario estándar, puede hacer pedidos
- **repartidor**: Puede ver y gestionar entregas

### Estados de Pedidos
1. **pending**: Pedido creado, esperando confirmación
2. **confirmed**: Pedido confirmado, esperando asignación de repartidor
3. **preparing**: Repartidor asignado, restaurante preparando
4. **ready**: Pedido listo para retirar
5. **delivering**: Repartidor en camino al cliente
6. **completed**: Pedido entregado
7. **cancelled**: Pedido cancelado

### Flujo de un Pedido
1. Cliente agrega items al carrito
2. Cliente aplica cupón (opcional)
3. Cliente completa el checkout
4. Pedido creado con status "confirmed"
5. Repartidor acepta el pedido  "preparing"
6. Restaurante marca como listo  "ready"
7. Repartidor retira el pedido  "delivering"
8. Repartidor entrega al cliente  "completed"

---

##  Soporte

Para reportar bugs o sugerencias:
- **Email:** azulsofiadavid@gmail.com
- **GitHub:** github.com/mcdonalds-azul/issues

---

**Última actualización:** Noviembre 2025
**Versión de la API:** 1.0.0