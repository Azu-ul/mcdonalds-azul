# mcdonalds-azul
# McDonald's App - Aplicación de Delivery

Aplicación completa de delivery de comida estilo McDonald's, desarrollada con React Native (Expo) para el frontend y Node.js/Express para el backend.

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
  - [1. Clonar el Repositorio](#1-clonar-el-repositorio)
  - [2. Configurar Backend](#2-configurar-backend)
  - [3. Configurar Frontend](#3-configurar-frontend)
- [Ejecución del Proyecto](#ejecución-del-proyecto)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Variables de Entorno](#variables-de-entorno)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## Características

- Autenticación con email/contraseña y Google OAuth
- Catálogo de productos con categorías
- Carrito de compras con personalización de productos
- Sistema de cupones de descuento
- Gestión de direcciones múltiples
- Seguimiento de pedidos en tiempo real
- Panel de administración
- Sistema de repartidores
- Geolocalización y mapas
- Múltiples métodos de pago

## Tecnologías Utilizadas

### Frontend
- React Native (Expo SDK 51)
- Expo Router para navegación
- Axios para peticiones HTTP
- React Hook Form + Yup para validación
- Expo Location y React Native Maps
- AsyncStorage para persistencia local
- Expo Secure Store para tokens

### Backend
- Node.js con Express
- MySQL como base de datos
- JWT para autenticación
- Passport.js para OAuth
- Bcrypt para encriptación
- Multer para subida de archivos

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
  - Descargar desde: https://nodejs.org/
- **npm** (viene con Node.js) o **yarn**
- **XAMPP** (para MySQL y phpMyAdmin)
  - Descargar desde: https://www.apachefriends.org/
- **Expo CLI** (se instalará globalmente)
- **Git** para clonar el repositorio
- Un dispositivo móvil con la app **Expo Go** instalada, o un emulador Android/iOS

### Opcional pero recomendado:
- **Android Studio** (para emulador Android)
- **Xcode** (para emulador iOS, solo en Mac)
- **Visual Studio Code** como editor de código

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Azu-ul/mcdonalds-azul
cd mcdonalds-azul
```

### 2. Configurar Backend

#### 2.1. Instalar XAMPP y configurar MySQL

1. Abre XAMPP Control Panel
2. Inicia los servicios **Apache** y **MySQL**
3. Verifica que MySQL esté corriendo en el puerto 3306

#### 2.2. Crear la Base de Datos

1. Abre tu navegador y ve a: http://localhost/phpmyadmin
2. Crea una nueva base de datos llamada `mcdonalds_bbdd`
3. Selecciona la base de datos creada
4. Ve a la pestaña "Importar"
5. Selecciona el archivo `back/mcdonalds_bbdd.sql`
6. Haz clic en "Continuar" para importar todas las tablas y datos

#### 2.3. Instalar dependencias del backend

```bash
cd back
npm install
```

#### 2.4. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `back/` con el siguiente contenido:

```env
# Puerto del servidor
PORT=3000

# Configuración de la base de datos
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=mcdonalds_bbdd
DB_PORT=3306

# JWT Secret (cambia esto por una clave secreta fuerte)
JWT_SECRET=tu_clave_secreta_super_segura_cambiar_esto

# Google OAuth (opcional, solo si usarás login con Google)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# URL de la API
API_URL=http://localhost:3000

# Entorno de desarrollo
NODE_ENV=development
```

**Nota sobre Google OAuth:**
Si no vas a usar login con Google, puedes dejar estos valores vacíos o comentarlos. El login local funcionará sin problemas.

### 3. Configurar Frontend

#### 3.1. Instalar dependencias del frontend

```bash
cd ../front
npm install
```

#### 3.2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `front/` con el siguiente contenido:

```env
# URL del backend
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Para desarrollo en dispositivo físico, usa tu IP local
# EXPO_PUBLIC_API_URL=http://192.168.X.X:3000/api
```

**Importante:** Si vas a probar en un dispositivo físico (usando Expo Go), necesitas:
1. Asegurarte de que tu computadora y tu dispositivo estén en la misma red WiFi
2. Cambiar `localhost` por tu IP local (ejemplo: `http://192.168.1.100:3000/api`)
3. Para saber tu IP local:
   - Windows: `ipconfig` en CMD
   - Mac/Linux: `ifconfig` en Terminal

#### 3.3. Configurar Google OAuth (Opcional)

Si deseas habilitar el login con Google:

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto
3. Habilita la API de Google+ 
4. Crea credenciales OAuth 2.0:
   - Tipo: ID de cliente de OAuth
   - Tipo de aplicación: Aplicación web (para el backend)
   - URI de redirección autorizados: `http://localhost:3000/api/auth/google/callback`
5. Copia el Client ID y Client Secret al `.env` del backend
6. Para el frontend, también necesitarás un Client ID tipo "Android" o "iOS"

## Ejecución del Proyecto

### 1. Iniciar el Backend

```bash
cd back
npm run dev
```

El servidor se ejecutará en: http://localhost:3000

Verifica que funciona visitando: http://localhost:3000/health

Deberías ver:
```json
{
  "status": "ok",
  "message": "API is running"
}
```

### 2. Iniciar el Frontend

En una nueva terminal:

```bash
cd front
npm start
```

Esto abrirá Expo DevTools en tu navegador. Desde ahí puedes:

- Presionar `a` para abrir en emulador Android
- Presionar `i` para abrir en emulador iOS (solo Mac)
- Escanear el código QR con la app **Expo Go** en tu dispositivo móvil

### Opciones de ejecución alternativas:

```bash
# Solo Android
npm run android

# Solo iOS (requiere Mac)
npm run ios

# Versión web (limitada)
npm run web
```

## Estructura del Proyecto

📂 back
├── 📄 README.md
└── 📂 config/
│  ├── 📄 passport.js
└── 📂 controllers/
│  ├── 📄 deliveryController.js
│  ├── 📄 roleController.js
│  ├── 📄 simulationController.js
├── 📄 db.js
├── 📄 mcdonalds_bbdd.sql
└── 📂 middleware/
│  ├── 📄 auth.js
│  ├── 📄 role.js
├── 📄 package-lock.json
├── 📄 package.json
└── 📂 routes/
│  ├── 📄 addresses.js
│  ├── 📄 admin.js
│  ├── 📄 auth.js
│  ├── 📄 cart.js
│  ├── 📄 categories.js
│  ├── 📄 checkout.js
│  ├── 📄 coupons.js
│  ├── 📄 delivery.js
│  ├── 📄 flyers.js
│  ├── 📄 home.js
│  ├── 📄 products.js
│  ├── 📄 profile.js
│  ├── 📄 restaurants.js
│  ├── 📄 roles.js
│  ├── 📄 simulation.js
│  ├── 📄 user.js
├── 📄 server.js
└── 📂 uploads/

📂 front
└── 📂 app/
├── 📄 app.json
│  └── 📂 (tabs)/
│    ├── 📄 _layout.tsx
│    ├── 📄 coupons.tsx
│    ├── 📄 index.tsx
│    ├── 📄 profile.tsx
│    ├── 📄 restaurants.tsx
│  ├── 📄 _layout.tsx
│  └── 📂 admin/
│    └── 📂 create/
│      ├── 📄 [type].tsx
│    └── 📂 edit/
│      └── 📂 [type]/
│        ├── 📄 [id].tsx
│    ├── 📄 index.tsx
│  ├── 📄 checkout.tsx
│  └── 📂 components/
│    ├── 📄 CustomModal.tsx
│    ├── 📄 ImagePickerModal.tsx
│    ├── 📄 SelectionModal.tsx
│    └── 📂 home/
│      ├── 📄 AddressBar.tsx
│      ├── 📄 BottomTabs.tsx
│      ├── 📄 CategoryCarousel.tsx
│      ├── 📄 FloatingCart.tsx
│      ├── 📄 FlyerCarousel.tsx
│      ├── 📄 ProductCarousel.tsx
│    └── 📂 profile/
│      ├── 📄 AddressCard.tsx
│      ├── 📄 DocumentCard.tsx
│      ├── 📄 OrderHistoryCard.tsx
│      ├── 📄 PersonalInfoCard.tsx
│      ├── 📄 ProfileHeader.tsx
│      ├── 📄 ProfileImageSection.tsx
│  └── 📂 context/
│    ├── 📄 AuthContext.tsx
│    ├── 📄 CartContext.tsx
│    ├── 📄 CouponContext.tsx
│  └── 📂 delivery/
│    ├── 📄 delivery-home.tsx
│    ├── 📄 delivery-register.tsx
│    ├── 📄 simulation-panel.tsx
│  └── 📂 product/
│    ├── 📄 AddToCartButton.tsx
│    ├── 📄 CondimentSelector.tsx
│    ├── 📄 DrinkSelector.tsx
│    ├── 📄 IngredientSelector.tsx
│    ├── 📄 SideSelector.tsx
│    ├── 📄 [id].tsx
│    ├── 📄 cart.tsx
│  ├── 📄 register.tsx
│  ├── 📄 signin.tsx
│  └── 📂 utils/
│    ├── 📄 geocoding.ts
└── 📂 assets/
├── 📄 assets.d.ts
│  ├── 📄 adaptive-icon.png
│  ├── 📄 favicon.png
│  ├── 📄 google-icon.png
│  ├── 📄 icon.png
│  ├── 📄 splash-icon.png
└── 📂 config/
│  ├── 📄 api.ts
├── 📄 eas.json
├── 📄 index.ts
├── 📄 package-lock.json
├── 📄 package.json
└── 📄 tsconfig.json

## Variables de Entorno

### Backend (.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de MySQL | `127.0.0.1` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `` (vacío por defecto en XAMPP) |
| `DB_NAME` | Nombre de la base de datos | `mcdonalds_bbdd` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `JWT_SECRET` | Clave secreta para JWT | `tu_clave_secreta` |
| `GOOGLE_CLIENT_ID` | Client ID de Google | `tu_client_id` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google | `tu_client_secret` |
| `API_URL` | URL base de la API | `http://localhost:3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |

### Frontend (.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL del backend | `http://localhost:3000/api` |

## API Documentation

La documentación completa de la API está disponible en `back/README.md`.

### Endpoints principales:

- **Autenticación:** `/api/auth/*`
- **Productos:** `/api/home/products`
- **Carrito:** `/api/cart/*`
- **Checkout:** `/api/checkout/*`
- **Perfil:** `/api/profile/*`
- **Cupones:** `/api/coupons/*`
- **Restaurantes:** `/api/restaurants/*`
- **Delivery:** `/api/delivery/*`
- **Admin:** `/api/admin/*`

## Troubleshooting

### Problemas Comunes

#### 1. Error de conexión a la base de datos

**Error:** `ER_ACCESS_DENIED_ERROR` o `ECONNREFUSED`

**Solución:**
- Verifica que MySQL esté corriendo en XAMPP
- Confirma que las credenciales en `.env` sean correctas
- Asegúrate de que la base de datos `mcdonalds_bbdd` exista

#### 2. El frontend no se conecta al backend

**Error:** `Network Error` o `Request failed`

**Solución:**
- Verifica que el backend esté corriendo (`npm run dev` en la carpeta `back`)
- Si usas un dispositivo físico, cambia `localhost` por tu IP local en el `.env` del frontend
- Desactiva el firewall temporalmente o permite conexiones en el puerto 3000

#### 3. Google OAuth no funciona

**Solución:**
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de haber configurado correctamente las URIs de redirección en Google Cloud Console
- El login local seguirá funcionando sin configurar OAuth

#### 4. Expo no abre el proyecto

**Error:** `Metro bundler failed to start`

**Solución:**
```bash
# Limpia el caché de Expo
cd front
npx expo start --clear
```

#### 5. Error al importar la base de datos

**Error:** `SQL syntax error`

**Solución:**
- Asegúrate de estar usando MySQL/MariaDB versión compatible (5.7+)
- Importa el archivo `mcdonalds_bbdd.sql` completo
- Verifica que no haya errores de codificación (debe ser UTF-8)

#### 6. Puertos en uso

**Error:** `Port 3000 is already in use`

**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

O cambia el puerto en el archivo `.env` del backend.

### Logs útiles

Para ver los logs del backend:
```bash
cd back
npm run dev
```

Para ver los logs de Expo:
```bash
cd front
npx expo start
```

## Características Adicionales

### Roles de Usuario

El sistema maneja tres tipos de roles:

1. **Cliente:** Usuario estándar que puede realizar pedidos
2. **Repartidor:** Puede ver y gestionar entregas
3. **Admin:** Acceso completo al panel de administración

### Flujo de un Pedido

1. Cliente agrega productos al carrito
2. Cliente aplica cupón (opcional)
3. Cliente completa el checkout
4. Pedido creado con estado "confirmed"
5. Repartidor acepta el pedido → "preparing"
6. Restaurante marca como listo → "ready"
7. Repartidor retira el pedido → "delivering"
8. Repartidor entrega al cliente → "completed"

### Simulación de Pedidos (Desarrollo)

Para facilitar el testing, el backend incluye endpoints de simulación:

- `POST /api/simulation/orders/generate` - Genera un pedido aleatorio
- `POST /api/simulation/orders/generate-multiple` - Genera múltiples pedidos
- `POST /api/simulation/orders/simulate-ready` - Marca pedidos como listos
- `DELETE /api/simulation/orders/cleanup` - Limpia pedidos antiguos

**Nota:** Estos endpoints solo están disponibles cuando `NODE_ENV=development`

## Contacto y Soporte

Para reportar bugs o sugerencias:
- **Email:** azulsofiadavid@gmail.com
- **GitHub Issues:** [Crear un issue](https://github.com/Azu-ul/mcdonalds-azul/issues)

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Última actualización:** Noviembre 2025  
**Versión:** 1.0.0