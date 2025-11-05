-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-11-2025 a las 05:04:23
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mcdonalds_bbdd`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `delivery_address_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `coupon_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `delivery_type` enum('delivery','pickup') DEFAULT 'delivery',
  `delivery_address` text DEFAULT NULL,
  `delivery_latitude` decimal(10,8) DEFAULT NULL,
  `delivery_longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `restaurant_id`, `delivery_address_id`, `created_at`, `updated_at`, `coupon_id`, `discount_amount`, `delivery_type`, `delivery_address`, `delivery_latitude`, `delivery_longitude`) VALUES
(7, 4, NULL, NULL, '2025-11-03 21:50:44', '2025-11-03 21:50:44', NULL, 0.00, 'delivery', NULL, NULL, NULL),
(8, 5, NULL, NULL, '2025-11-03 21:58:10', '2025-11-03 21:58:10', NULL, 0.00, 'delivery', NULL, NULL, NULL),
(13, 1, NULL, NULL, '2025-11-04 13:58:04', '2025-11-04 13:58:04', NULL, 0.00, 'delivery', NULL, NULL, NULL),
(14, 10, NULL, NULL, '2025-11-04 17:34:03', '2025-11-04 17:34:03', NULL, 0.00, 'delivery', NULL, NULL, NULL),
(16, 11, NULL, NULL, '2025-11-05 02:32:07', '2025-11-05 02:32:07', NULL, 0.00, 'delivery', NULL, NULL, NULL),
(17, 12, 1, NULL, '2025-11-05 03:40:53', '2025-11-05 03:43:25', NULL, 0.00, 'delivery', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `size_id` int(11) DEFAULT NULL,
  `side_id` int(11) DEFAULT NULL,
  `drink_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `customizations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customizations`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `name`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'McCombos', '🍔', 1, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(2, 'Hamburguesas', '🍔', 2, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(3, 'Cajita Feliz', '🎁', 3, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(4, 'Pollo y McNuggets', '🍗', 4, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(5, 'Para Acompañar', '🍟', 5, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(6, 'McShakes', '🥤', 6, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(7, 'Postres', '🍦', 7, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(8, 'Ensaladas', '🥗', 8, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(9, 'Bebidas', '🥤', 9, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(10, 'Sin TACC', '🌾', 10, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(11, 'Menús McCafé', '☕', 11, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(12, 'Bebidas McCafé', '☕', 12, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(13, 'Comidas McCafé', '🥐', 13, 1, '2025-10-26 23:36:39', '2025-10-26 23:36:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase` decimal(10,2) DEFAULT 0.00,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `coupons`
--

INSERT INTO `coupons` (`id`, `product_id`, `title`, `description`, `discount_type`, `discount_value`, `min_purchase`, `max_discount`, `image_url`, `start_date`, `end_date`, `is_active`, `usage_limit`, `used_count`, `created_at`, `updated_at`) VALUES
(1, 1, '¡20% OFF en Big Mac!', 'Descuento válido solo en combos McCombos. Válido hasta agotar stock.', 'percentage', 20.00, 0.00, NULL, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26000PRUEBA3.png', '2025-10-28 03:00:00', '2026-01-01 02:59:59', 1, 5000, 0, '2025-10-28 15:36:51', '2025-10-28 15:36:51'),
(2, 2, '15% de descuento en Cuarto de Libra', '¡Aprovechá esta oferta por tiempo limitado!', 'percentage', 15.00, 0.00, NULL, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26003_AR19JUL24.png', '2025-10-28 03:00:00', '2025-12-01 02:59:59', 1, 3000, 1, '2025-10-28 15:36:51', '2025-11-03 21:20:07'),
(4, 4, '10% OFF en Tasty Feat Cuarto Doble', 'Combos medianos y grandes incluidos.', 'percentage', 10.00, 0.00, NULL, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_2852_06mar25.png', '2025-10-28 03:00:00', '2026-02-01 02:59:59', 1, 10000, 0, '2025-10-28 15:36:51', '2025-10-28 15:36:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `delivery_drivers`
--

CREATE TABLE `delivery_drivers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `birth_date` date NOT NULL,
  `vehicle_type` enum('bicycle','motorcycle','car','foot') NOT NULL,
  `address` text NOT NULL,
  `availability_days` set('monday','tuesday','wednesday','thursday','friday','saturday','sunday') DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `delivery_drivers`
--

INSERT INTO `delivery_drivers` (`id`, `user_id`, `birth_date`, `vehicle_type`, `address`, `availability_days`, `start_time`, `end_time`, `is_available`, `status`, `created_at`, `updated_at`) VALUES
(1, 9, '2007-11-05', 'motorcycle', 'San Juan 1536', 'monday,wednesday,friday', '07:00:00', '14:30:00', 1, 'active', '2025-11-04 17:26:23', '2025-11-04 17:26:23'),
(2, 10, '2007-01-30', 'foot', 'asdasdsa', 'monday', '09:00:00', '18:00:00', 1, 'active', '2025-11-04 17:34:01', '2025-11-04 17:34:01'),
(3, 11, '2007-11-05', 'bicycle', 'a', 'wednesday', '09:00:00', '18:00:00', 1, 'active', '2025-11-04 21:29:14', '2025-11-04 21:29:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `drinks`
--

CREATE TABLE `drinks` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `extra_price` decimal(10,2) DEFAULT 0.00,
  `image_url` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `drinks`
--

INSERT INTO `drinks` (`id`, `name`, `extra_price`, `image_url`, `is_available`, `created_at`) VALUES
(1, 'Coca-Cola', 0.00, NULL, 1, '2025-10-26 23:36:39'),
(2, 'Coca-Cola Zero', 0.00, NULL, 1, '2025-10-26 23:36:39'),
(3, 'Sprite', 0.00, NULL, 1, '2025-10-26 23:36:39'),
(4, 'Sprite Zero', 0.00, NULL, 1, '2025-10-26 23:36:39'),
(5, 'Fanta', 0.00, NULL, 1, '2025-10-26 23:36:39'),
(6, 'Agua', 300.00, NULL, 1, '2025-10-26 23:36:39'),
(7, 'Jugo de Naranja', 500.00, NULL, 1, '2025-10-26 23:36:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `flyers`
--

CREATE TABLE `flyers` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` text NOT NULL,
  `link_url` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `flyers`
--

INSERT INTO `flyers` (`id`, `title`, `description`, `image_url`, `link_url`, `display_order`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Menú Fórmula 1 La Película! ', 'Pasá por McDonald’s y disfrutá del sabor de las carreras con una edición limitada del Cuarto de Libra con Salsa Barbacoa y Bacon 👌 Ah y no te olvides que, por un precio extra, te podés llevar un auto de colección🏎️', 'https://pbs.twimg.com/media/GuKWXk1WMAA_e-I.jpg:large', 'https://x.com/McDonalds_Ar/status/1937526128098603295', 1, '2025-10-27 09:00:00', '2025-11-11 08:59:59', 1, '2025-10-27 15:47:47', '2025-11-04 15:55:22'),
(3, '¡Cajita Feliz se disfraza este Halloween!', 'Prepárense para Halloween con sus Buu Baldes en McDonald’s', 'https://mcd-landings-l-statics.appmcdonalds.com/uploads-live/BANNER_JUGUETE_1200x550_c72920ed57.jpg', NULL, 3, NULL, NULL, 1, '2025-10-27 15:47:47', '2025-10-27 16:25:53');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ingredients`
--

CREATE TABLE `ingredients` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `max_quantity` int(11) DEFAULT 1,
  `extra_price` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ingredients`
--

INSERT INTO `ingredients` (`id`, `name`, `is_required`, `max_quantity`, `extra_price`, `created_at`) VALUES
(1, 'Pan', 1, 1, 0.00, '2025-10-26 23:36:39'),
(2, 'Carne', 1, 4, 1500.00, '2025-10-26 23:36:39'),
(3, 'Queso Cheddar', 0, 3, 800.00, '2025-10-26 23:36:39'),
(4, 'Bacon', 0, 3, 900.00, '2025-10-26 23:36:39'),
(5, 'Lechuga', 0, 1, 0.00, '2025-10-26 23:36:39'),
(6, 'Tomate', 0, 1, 0.00, '2025-10-26 23:36:39'),
(7, 'Cebolla', 0, 1, 0.00, '2025-10-26 23:36:39'),
(8, 'Pepino', 0, 1, 0.00, '2025-10-26 23:36:39'),
(9, 'Salsa Big Mac', 0, 1, 0.00, '2025-10-26 23:36:39'),
(10, 'Ketchup', 0, 1, 0.00, '2025-10-26 23:36:39'),
(11, 'Mostaza', 0, 1, 0.00, '2025-10-26 23:36:39'),
(12, 'Mayonesa', 0, 1, 0.00, '2025-10-26 23:36:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oauth_tokens`
--

CREATE TABLE `oauth_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `provider` enum('google','facebook') NOT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `oauth_tokens`
--

INSERT INTO `oauth_tokens` (`id`, `user_id`, `provider`, `access_token`, `refresh_token`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'google', 'ya29.A0ATi6K2vI29Dciyoubk2L4chTtSO2uTVEFn2FFlreaOjG3M8gJVWr-4MzPq3-YG_WNYsVuA5enzAqxQ1WdvIbC9dP_Ow-C887nTQvYSNtge9HEQg-WSQCgb9qHtNPJNXmQNThTqiOS3FrbC-z0jITbKDRtKAOnTNQuoVFjOp-7uUHkbktRwWwPbfvSlrnhGLcZj1TclI-cMcXRlpWj6jsK3sbzLVhjMS8ufbBQcWSdr9qyIxoX_V-hdU_7Wp2lZSw45BT__JN9WDS2unU1msbCRG9krxvaCgYKAfUSARUSFQHGX2MiodAscmx75AUgHAx5DSiewA0291', NULL, '2025-10-27 23:41:18', '2025-10-27 15:00:20', '2025-10-27 22:41:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `restaurant_id` int(11) DEFAULT NULL,
  `delivery_address` text DEFAULT NULL,
  `delivery_latitude` decimal(10,8) DEFAULT NULL,
  `delivery_longitude` decimal(11,8) DEFAULT NULL,
  `order_type` enum('delivery','pickup') DEFAULT 'delivery',
  `subtotal` decimal(10,2) NOT NULL,
  `delivery_fee` decimal(10,2) DEFAULT 0.00,
  `discount` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','preparing','ready','delivering','completed','cancelled') DEFAULT 'pending',
  `payment_method` enum('card','cash') NOT NULL,
  `payment_status` enum('pending','paid','failed') DEFAULT 'pending',
  `coupon_id` int(11) DEFAULT NULL,
  `repartidor_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `pickup_time` timestamp NULL DEFAULT NULL,
  `delivered_time` timestamp NULL DEFAULT NULL,
  `estimated_delivery_time` int(11) DEFAULT NULL,
  `delivery_distance` decimal(8,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `restaurant_id`, `delivery_address`, `delivery_latitude`, `delivery_longitude`, `order_type`, `subtotal`, `delivery_fee`, `discount`, `total`, `status`, `payment_method`, `payment_status`, `coupon_id`, `repartidor_id`, `driver_id`, `pickup_time`, `delivered_time`, `estimated_delivery_time`, `delivery_distance`, `notes`, `created_at`, `updated_at`) VALUES
(10, 1, 4, 'Av. Juan B. Justo 2800, Mar del Plata', NULL, NULL, 'delivery', 9767.00, 1500.00, 0.00, 11267.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-04 23:46:48', '2025-11-04 23:46:50', 19, NULL, NULL, '2025-11-04 22:55:06', '2025-11-04 23:46:50'),
(11, 6, 4, 'Calle Rivadavia 1500, Mar del Plata', NULL, NULL, 'delivery', 19554.00, 1500.00, 0.00, 21054.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-04 23:46:46', '2025-11-04 23:46:49', 20, NULL, NULL, '2025-11-04 22:57:14', '2025-11-04 23:46:49'),
(12, 9, 4, 'Calle Olavarría 2200, Mar del Plata', NULL, NULL, 'delivery', 20945.00, 1500.00, 0.00, 22445.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-04 23:47:06', '2025-11-04 23:47:07', 24, NULL, NULL, '2025-11-04 22:57:33', '2025-11-04 23:47:07'),
(13, 8, 1, 'Av. Luro 3500, Mar del Plata', NULL, NULL, 'delivery', 15562.00, 1500.00, 0.00, 17062.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-04 23:47:07', '2025-11-04 23:47:07', 19, NULL, NULL, '2025-11-04 22:57:33', '2025-11-04 23:47:07'),
(14, 9, 2, 'Calle San Martín 1800, Mar del Plata', NULL, NULL, 'delivery', 20004.00, 1500.00, 0.00, 21504.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-04 23:47:07', '2025-11-04 23:47:07', 26, NULL, NULL, '2025-11-04 22:57:33', '2025-11-04 23:47:07'),
(15, 5, 4, 'Calle Olavarría 2200, Mar del Plata', NULL, NULL, 'delivery', 14484.00, 1500.00, 0.00, 15984.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-04 23:47:05', '2025-11-04 23:47:05', 36, NULL, NULL, '2025-11-04 23:29:13', '2025-11-04 23:47:05'),
(17, 11, NULL, 'Chaco, 1707, Don Bosco, Mar del Plata', -37.99039660, -57.56531930, 'delivery', 13100.00, 0.00, 0.00, 13100.00, 'confirmed', 'cash', 'paid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-05 02:32:02', '2025-11-05 02:32:02'),
(18, 8, 3, 'Av. Colón 2500, Mar del Plata', NULL, NULL, 'delivery', 24309.00, 1500.00, 0.00, 25809.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 02:34:29', '2025-11-05 02:34:31', 29, NULL, NULL, '2025-11-05 02:32:36', '2025-11-05 02:34:31'),
(19, 10, 1, 'Calle Olavarría 2200, Mar del Plata', NULL, NULL, 'delivery', 24584.00, 1500.00, 0.00, 26084.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 02:54:24', '2025-11-05 02:54:25', 18, NULL, NULL, '2025-11-05 02:51:31', '2025-11-05 02:54:25'),
(20, 8, 3, 'Calle Olavarría 2200, Mar del Plata', NULL, NULL, 'delivery', 18883.00, 1500.00, 0.00, 20383.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:05:14', '2025-11-05 03:05:17', 28, NULL, NULL, '2025-11-05 03:03:06', '2025-11-05 03:05:17'),
(21, 4, 2, 'Av. Luro 3500, Mar del Plata', NULL, NULL, 'delivery', 7826.00, 1500.00, 0.00, 9326.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 37, NULL, NULL, '2025-11-05 03:05:20', '2025-11-05 03:05:20'),
(22, 1, 2, 'Calle Rivadavia 1500, Mar del Plata', NULL, NULL, 'delivery', 16149.00, 1500.00, 0.00, 17649.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 15, NULL, NULL, '2025-11-05 03:05:22', '2025-11-05 03:05:22'),
(23, 1, 4, 'Calle Rivadavia 1500, Mar del Plata', NULL, NULL, 'delivery', 8329.00, 1500.00, 0.00, 9829.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 16, NULL, NULL, '2025-11-05 03:05:22', '2025-11-05 03:05:22'),
(24, 6, 4, 'Av. Luro 3500, Mar del Plata', NULL, NULL, 'delivery', 5119.00, 1500.00, 0.00, 6619.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:34:02', '2025-11-05 03:34:04', 32, NULL, NULL, '2025-11-05 03:05:22', '2025-11-05 03:34:04'),
(25, 9, 4, 'Av. Colón 2500, Mar del Plata', NULL, NULL, 'delivery', 11802.00, 1500.00, 0.00, 13302.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:34:06', '2025-11-05 03:34:06', 33, NULL, NULL, '2025-11-05 03:11:39', '2025-11-05 03:34:06'),
(26, 10, 3, 'Av. Independencia 3200, Mar del Plata', NULL, NULL, 'delivery', 10401.00, 1500.00, 0.00, 11901.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:33:31', '2025-11-05 03:33:50', 36, NULL, NULL, '2025-11-05 03:15:11', '2025-11-05 03:33:50'),
(27, 4, 1, 'Av. Colón 2500, Mar del Plata', NULL, NULL, 'delivery', 18227.00, 1500.00, 0.00, 19727.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:33:29', '2025-11-05 03:33:30', 37, NULL, NULL, '2025-11-05 03:20:18', '2025-11-05 03:33:30'),
(28, 8, 2, 'Calle San Martín 1800, Mar del Plata', NULL, NULL, 'delivery', 12988.00, 1500.00, 0.00, 14488.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:33:27', '2025-11-05 03:33:28', 17, NULL, NULL, '2025-11-05 03:31:00', '2025-11-05 03:33:28'),
(29, 4, 3, 'Av. Independencia 3200, Mar del Plata', NULL, NULL, 'delivery', 21064.00, 1500.00, 0.00, 22564.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:34:21', '2025-11-05 03:34:22', 31, NULL, NULL, '2025-11-05 03:34:13', '2025-11-05 03:34:22'),
(30, 8, 4, 'Av. Independencia 3200, Mar del Plata', NULL, NULL, 'delivery', 24986.00, 1500.00, 0.00, 26486.00, 'completed', 'card', 'pending', NULL, NULL, 3, '2025-11-05 03:35:15', '2025-11-05 03:35:16', 24, NULL, NULL, '2025-11-05 03:34:28', '2025-11-05 03:35:16'),
(31, 8, 4, 'Calle Rivadavia 1500, Mar del Plata', NULL, NULL, 'delivery', 21816.00, 1500.00, 0.00, 23316.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 24, NULL, NULL, '2025-11-05 03:35:20', '2025-11-05 03:35:20'),
(32, 8, 3, 'Av. Luro 3500, Mar del Plata', NULL, NULL, 'delivery', 19220.00, 1500.00, 0.00, 20720.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 26, NULL, NULL, '2025-11-05 03:35:26', '2025-11-05 03:35:26'),
(33, 7, 3, 'Calle Corrientes 1200, Mar del Plata', NULL, NULL, 'delivery', 13206.00, 1500.00, 0.00, 14706.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 19, NULL, NULL, '2025-11-05 03:36:34', '2025-11-05 03:36:34'),
(34, 10, 3, 'Calle Corrientes 1200, Mar del Plata', NULL, NULL, 'delivery', 18929.00, 1500.00, 0.00, 20429.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 28, NULL, NULL, '2025-11-05 03:36:47', '2025-11-05 03:36:47'),
(35, 8, 3, 'Av. Colón 2500, Mar del Plata', NULL, NULL, 'delivery', 6793.00, 1500.00, 0.00, 8293.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 36, NULL, NULL, '2025-11-05 03:36:53', '2025-11-05 03:36:53'),
(36, 7, 3, 'Av. Independencia 3200, Mar del Plata', NULL, NULL, 'delivery', 22369.00, 1500.00, 0.00, 23869.00, 'confirmed', 'card', 'pending', NULL, NULL, NULL, NULL, NULL, 20, NULL, NULL, '2025-11-05 03:39:27', '2025-11-05 03:39:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `size_name` varchar(50) DEFAULT NULL,
  `side_name` varchar(100) DEFAULT NULL,
  `drink_name` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `customizations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customizations`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `size_name`, `side_name`, `drink_name`, `quantity`, `unit_price`, `total_price`, `customizations`, `created_at`) VALUES
(11, 10, 12, 'Ensalada Caesar', NULL, NULL, NULL, 1, 9200.00, 9200.00, NULL, '2025-11-04 22:55:06'),
(12, 10, 1, 'Small Mac Mediano', NULL, NULL, NULL, 1, 13100.00, 13100.00, NULL, '2025-11-04 22:55:06'),
(13, 10, 14, 'Ensalada Guacamole Sin TACC', NULL, NULL, NULL, 1, 10400.00, 10400.00, NULL, '2025-11-04 22:55:06'),
(14, 11, 12, 'Ensalada Caesar', NULL, NULL, NULL, 2, 9200.00, 18400.00, NULL, '2025-11-04 22:57:14'),
(15, 11, 1, 'Small Mac Mediano', NULL, NULL, NULL, 1, 13100.00, 13100.00, NULL, '2025-11-04 22:57:14'),
(16, 11, 10, 'McShake Vainilla', NULL, NULL, NULL, 2, 5200.00, 10400.00, NULL, '2025-11-04 22:57:14'),
(17, 12, 16, 'Café Latte Mediano', NULL, NULL, NULL, 2, 4900.00, 9800.00, NULL, '2025-11-04 22:57:33'),
(18, 12, 3, 'McNuggets x10 Mediano', NULL, NULL, NULL, 1, 12800.00, 12800.00, NULL, '2025-11-04 22:57:33'),
(19, 12, 12, 'Ensalada Caesar', NULL, NULL, NULL, 2, 9200.00, 18400.00, NULL, '2025-11-04 22:57:33'),
(20, 13, 11, 'Sundae Chocolate', NULL, NULL, NULL, 2, 3500.00, 7000.00, NULL, '2025-11-04 22:57:33'),
(21, 13, 14, 'Ensalada Guacamole Sin TACC', NULL, NULL, NULL, 1, 10400.00, 10400.00, NULL, '2025-11-04 22:57:33'),
(22, 13, 8, 'McNuggets x20', NULL, NULL, NULL, 1, 7200.00, 7200.00, NULL, '2025-11-04 22:57:33'),
(23, 14, 12, 'Ensalada Caesar', NULL, NULL, NULL, 1, 9200.00, 9200.00, NULL, '2025-11-04 22:57:33'),
(24, 14, 17, 'Tostado Lomo Y Queso', NULL, NULL, NULL, 2, 3700.00, 7400.00, NULL, '2025-11-04 22:57:33'),
(25, 14, 15, 'Menú McCafé - Desayuno', NULL, NULL, NULL, 1, 1999.00, 1999.00, NULL, '2025-11-04 22:57:33'),
(26, 15, 6, 'Hamburguesa Clásica', NULL, NULL, NULL, 2, 9800.00, 19600.00, NULL, '2025-11-04 23:29:13'),
(27, 15, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 2, 2700.00, 5400.00, NULL, '2025-11-04 23:29:13'),
(28, 15, 1, 'Small Mac Mediano', NULL, NULL, NULL, 1, 13100.00, 13100.00, NULL, '2025-11-04 23:29:13'),
(32, 17, 1, 'Small Mac Mediano', 'Mediano', 'Papas Fritas Medianas', 'Coca-Cola', 1, 13100.00, 13100.00, NULL, '2025-11-05 02:32:02'),
(33, 18, 6, 'Hamburguesa Clásica', NULL, NULL, NULL, 1, 9800.00, 9800.00, NULL, '2025-11-05 02:32:36'),
(34, 18, 7, 'Cajita Feliz', NULL, NULL, NULL, 2, 6200.00, 12400.00, NULL, '2025-11-05 02:32:36'),
(35, 18, 11, 'Sundae Chocolate', NULL, NULL, NULL, 1, 3500.00, 3500.00, NULL, '2025-11-05 02:32:36'),
(36, 19, 1, 'Small Mac Mediano', NULL, NULL, NULL, 1, 13100.00, 13100.00, NULL, '2025-11-05 02:51:31'),
(37, 19, 17, 'Tostado Lomo Y Queso', NULL, NULL, NULL, 1, 3700.00, 3700.00, NULL, '2025-11-05 02:51:31'),
(38, 19, 2, 'Cuarto de Libra Mediano', NULL, NULL, NULL, 1, 14500.00, 14500.00, NULL, '2025-11-05 02:51:31'),
(39, 20, 3, 'McNuggets x10 Mediano', NULL, NULL, NULL, 1, 12800.00, 12800.00, NULL, '2025-11-05 03:03:06'),
(40, 20, 2, 'Cuarto de Libra Mediano', NULL, NULL, NULL, 2, 14500.00, 29000.00, NULL, '2025-11-05 03:03:06'),
(41, 20, 10, 'McShake Vainilla', NULL, NULL, NULL, 2, 5200.00, 10400.00, NULL, '2025-11-05 03:03:06'),
(42, 21, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 2, 3800.00, 7600.00, NULL, '2025-11-05 03:05:20'),
(43, 21, 7, 'Cajita Feliz', NULL, NULL, NULL, 1, 6200.00, 6200.00, NULL, '2025-11-05 03:05:20'),
(44, 21, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 1, 2700.00, 2700.00, NULL, '2025-11-05 03:05:20'),
(45, 22, 3, 'McNuggets x10 Mediano', NULL, NULL, NULL, 1, 12800.00, 12800.00, NULL, '2025-11-05 03:05:22'),
(46, 22, 16, 'Café Latte Mediano', NULL, NULL, NULL, 1, 4900.00, 4900.00, NULL, '2025-11-05 03:05:22'),
(47, 22, 15, 'Menú McCafé - Desayuno', NULL, NULL, NULL, 1, 1999.00, 1999.00, NULL, '2025-11-05 03:05:22'),
(48, 23, 12, 'Ensalada Caesar', NULL, NULL, NULL, 1, 9200.00, 9200.00, NULL, '2025-11-05 03:05:22'),
(49, 23, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 1, 3800.00, 3800.00, NULL, '2025-11-05 03:05:22'),
(50, 23, 10, 'McShake Vainilla', NULL, NULL, NULL, 2, 5200.00, 10400.00, NULL, '2025-11-05 03:05:22'),
(51, 24, 16, 'Café Latte Mediano', NULL, NULL, NULL, 2, 4900.00, 9800.00, NULL, '2025-11-05 03:05:22'),
(52, 24, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 2, 3800.00, 7600.00, NULL, '2025-11-05 03:05:22'),
(53, 24, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 2, 2700.00, 5400.00, NULL, '2025-11-05 03:05:22'),
(54, 25, 10, 'McShake Vainilla', NULL, NULL, NULL, 1, 5200.00, 5200.00, NULL, '2025-11-05 03:11:39'),
(55, 25, 7, 'Cajita Feliz', NULL, NULL, NULL, 1, 6200.00, 6200.00, NULL, '2025-11-05 03:11:39'),
(56, 25, 4, 'Tasty Feat Cuarto Doble Mediano', NULL, NULL, NULL, 1, 17700.00, 17700.00, NULL, '2025-11-05 03:11:39'),
(57, 26, 16, 'Café Latte Mediano', NULL, NULL, NULL, 2, 4900.00, 9800.00, NULL, '2025-11-05 03:15:11'),
(58, 26, 8, 'McNuggets x20', NULL, NULL, NULL, 1, 7200.00, 7200.00, NULL, '2025-11-05 03:15:11'),
(59, 26, 7, 'Cajita Feliz', NULL, NULL, NULL, 1, 6200.00, 6200.00, NULL, '2025-11-05 03:15:11'),
(60, 27, 11, 'Sundae Chocolate', NULL, NULL, NULL, 2, 3500.00, 7000.00, NULL, '2025-11-05 03:20:18'),
(61, 27, 7, 'Cajita Feliz', NULL, NULL, NULL, 1, 6200.00, 6200.00, NULL, '2025-11-05 03:20:18'),
(62, 27, 10, 'McShake Vainilla', NULL, NULL, NULL, 1, 5200.00, 5200.00, NULL, '2025-11-05 03:20:18'),
(63, 28, 17, 'Tostado Lomo Y Queso', NULL, NULL, NULL, 2, 3700.00, 7400.00, NULL, '2025-11-05 03:31:00'),
(64, 28, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 2, 3800.00, 7600.00, NULL, '2025-11-05 03:31:00'),
(65, 28, 6, 'Hamburguesa Clásica', NULL, NULL, NULL, 2, 9800.00, 19600.00, NULL, '2025-11-05 03:31:00'),
(66, 29, 11, 'Sundae Chocolate', NULL, NULL, NULL, 1, 3500.00, 3500.00, NULL, '2025-11-05 03:34:13'),
(67, 29, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 2, 2700.00, 5400.00, NULL, '2025-11-05 03:34:13'),
(68, 29, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 2, 3800.00, 7600.00, NULL, '2025-11-05 03:34:13'),
(69, 30, 2, 'Cuarto de Libra Mediano', NULL, NULL, NULL, 1, 14500.00, 14500.00, NULL, '2025-11-05 03:34:28'),
(70, 30, 12, 'Ensalada Caesar', NULL, NULL, NULL, 1, 9200.00, 9200.00, NULL, '2025-11-05 03:34:28'),
(71, 30, 8, 'McNuggets x20', NULL, NULL, NULL, 2, 7200.00, 14400.00, NULL, '2025-11-05 03:34:28'),
(72, 31, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 1, 3800.00, 3800.00, NULL, '2025-11-05 03:35:20'),
(73, 31, 10, 'McShake Vainilla', NULL, NULL, NULL, 1, 5200.00, 5200.00, NULL, '2025-11-05 03:35:20'),
(74, 31, 1, 'Small Mac Mediano', NULL, NULL, NULL, 2, 13100.00, 26200.00, NULL, '2025-11-05 03:35:20'),
(75, 32, 15, 'Menú McCafé - Desayuno', NULL, NULL, NULL, 2, 1999.00, 3998.00, NULL, '2025-11-05 03:35:26'),
(76, 32, 12, 'Ensalada Caesar', NULL, NULL, NULL, 1, 9200.00, 9200.00, NULL, '2025-11-05 03:35:26'),
(77, 32, 2, 'Cuarto de Libra Mediano', NULL, NULL, NULL, 2, 14500.00, 29000.00, NULL, '2025-11-05 03:35:26'),
(78, 33, 4, 'Tasty Feat Cuarto Doble Mediano', NULL, NULL, NULL, 2, 17700.00, 35400.00, NULL, '2025-11-05 03:36:34'),
(79, 33, 10, 'McShake Vainilla', NULL, NULL, NULL, 1, 5200.00, 5200.00, NULL, '2025-11-05 03:36:34'),
(80, 33, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 1, 2700.00, 2700.00, NULL, '2025-11-05 03:36:34'),
(81, 34, 1, 'Small Mac Mediano', NULL, NULL, NULL, 1, 13100.00, 13100.00, NULL, '2025-11-05 03:36:47'),
(82, 34, 14, 'Ensalada Guacamole Sin TACC', NULL, NULL, NULL, 2, 10400.00, 20800.00, NULL, '2025-11-05 03:36:47'),
(83, 34, 12, 'Ensalada Caesar', NULL, NULL, NULL, 1, 9200.00, 9200.00, NULL, '2025-11-05 03:36:47'),
(84, 35, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 1, 2700.00, 2700.00, NULL, '2025-11-05 03:36:53'),
(85, 35, 9, 'Papas Clásicas Medianas', NULL, NULL, NULL, 2, 3800.00, 7600.00, NULL, '2025-11-05 03:36:53'),
(86, 35, 14, 'Ensalada Guacamole Sin TACC', NULL, NULL, NULL, 1, 10400.00, 10400.00, NULL, '2025-11-05 03:36:53'),
(87, 36, 11, 'Sundae Chocolate', NULL, NULL, NULL, 1, 3500.00, 3500.00, NULL, '2025-11-05 03:39:27'),
(88, 36, 4, 'Tasty Feat Cuarto Doble Mediano', NULL, NULL, NULL, 2, 17700.00, 35400.00, NULL, '2025-11-05 03:39:27'),
(89, 36, 13, 'Coca-Cola Mediana', NULL, NULL, NULL, 2, 2700.00, 5400.00, NULL, '2025-11-05 03:39:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_rejections`
--

CREATE TABLE `order_rejections` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `rejected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `order_rejections`
--

INSERT INTO `order_rejections` (`id`, `order_id`, `driver_id`, `rejected_at`) VALUES
(2, 21, 3, '2025-11-05 03:05:37'),
(3, 22, 3, '2025-11-05 03:05:39'),
(4, 23, 3, '2025-11-05 03:05:42'),
(5, 33, 3, '2025-11-05 03:36:40'),
(6, 32, 3, '2025-11-05 03:36:43'),
(7, 31, 3, '2025-11-05 03:36:45'),
(8, 34, 3, '2025-11-05 03:36:51'),
(9, 35, 3, '2025-11-05 03:39:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_tracking`
--

CREATE TABLE `order_tracking` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `status` enum('assigned','picked_up','on_way','delivered','cancelled') NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `image_url` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `is_combo` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `category_id`, `base_price`, `image_url`, `is_available`, `is_combo`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'Small Mac Mediano', 'Hamburguesa con doble carne, queso cheddar, lechuga y salsa Big Mac. Incluye papas y bebida medianas', 1, 13100.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26000PRUEBA3.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-11-04 15:32:01'),
(2, 'Cuarto de Libra Mediano', 'Hamburguesa con carne de 1/4 de libra, queso, cebolla y pepino. Incluye papas y bebida medianas', 1, 14500.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26003_AR19JUL24.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:26:56'),
(3, 'McNuggets x10 Mediano', '10 McNuggets crujientes con salsa a elección. Incluye papas y bebida medianas', 1, 12800.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26005_AR19JUL24.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:27:20'),
(4, 'Tasty Feat Cuarto Doble Mediano', 'Doble carne de 1/4 de libra con doble queso cheddar. Incluye papas y bebida medianas', 1, 17700.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_2852_06mar25.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:28:16'),
(6, 'Hamburguesa Clásica', 'Carne, queso cheddar y aderezos.', 2, 9800.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_160_23JUL24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 14:24:23'),
(7, 'Cajita Feliz', 'Cajita feliz con juguete temático y papas pequeñas.', 3, 6200.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_26014_15102025.png', 1, 1, 1, '2025-10-28 18:30:00', '2025-11-01 21:04:44'),
(8, 'McNuggets x20', '20 McNuggets crujientes con salsa a elección.', 4, 7200.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_320_23JUL24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 14:25:55'),
(9, 'Papas Clásicas Medianas', 'Papas fritas clásicas.', 5, 3800.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_370_26JUL24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 14:26:18'),
(10, 'McShake Vainilla', 'Batido cremoso de vainilla.', 6, 5200.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV-1803-DDL-20251017.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:06:39'),
(11, 'Sundae Chocolate', 'Helado con salsa de chocolate.', 7, 3500.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/780PEYA.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:06:57'),
(12, 'Ensalada Caesar', 'Lechuga, parmesano, pollo (opcional) y aderezo Caesar.', 8, 9200.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_48262_26JUL24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:07:15'),
(13, 'Coca-Cola Mediana', 'Bebida cola 350ml.', 9, 2700.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_570_27AGO24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:07:51'),
(14, 'Ensalada Guacamole Sin TACC', 'Ensalada con mezcla de lechugas, guacamole y tomate', 10, 10400.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_49084_27AGO24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:08:29'),
(15, 'Menú McCafé - Desayuno', '2 Medialunas + café.', 11, 1999.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/48029SEP25.png', 1, 1, 1, '2025-10-28 18:30:00', '2025-10-28 15:09:25'),
(16, 'Café Latte Mediano', 'Café con leche preparado a pedido.', 12, 4900.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_783_16oct24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:09:49'),
(17, 'Tostado Lomo Y Queso', 'Tostado con lomo y queso en pan kaiser', 13, 3700.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_13315_16oct24.png', 1, 0, 1, '2025-10-28 18:30:00', '2025-10-28 15:11:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product_ingredients`
--

CREATE TABLE `product_ingredients` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `is_default` tinyint(1) DEFAULT 1,
  `is_removable` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `product_ingredients`
--

INSERT INTO `product_ingredients` (`id`, `product_id`, `ingredient_id`, `is_default`, `is_removable`, `created_at`) VALUES
(1, 6, 2, 1, 1, '2025-10-28 18:30:00'),
(2, 6, 3, 1, 1, '2025-10-28 18:30:00'),
(3, 6, 1, 1, 0, '2025-10-28 18:30:00'),
(6, 12, 5, 1, 1, '2025-10-28 18:30:00'),
(7, 12, 6, 0, 1, '2025-10-28 18:30:00'),
(8, 1, 1, 1, 0, '2025-11-01 18:27:41'),
(9, 1, 2, 1, 1, '2025-11-01 18:27:41'),
(10, 1, 3, 1, 1, '2025-11-01 18:27:41'),
(11, 1, 5, 1, 1, '2025-11-01 18:27:41'),
(12, 1, 9, 1, 1, '2025-11-01 18:27:41'),
(13, 2, 1, 1, 0, '2025-11-01 18:28:44'),
(14, 2, 2, 1, 1, '2025-11-01 18:28:44'),
(15, 2, 3, 1, 1, '2025-11-01 18:28:44'),
(16, 2, 7, 1, 1, '2025-11-01 18:28:44'),
(17, 2, 8, 1, 1, '2025-11-01 18:28:44'),
(18, 6, 7, 1, 1, '2025-11-01 21:00:38'),
(19, 6, 8, 1, 1, '2025-11-01 21:00:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product_sizes`
--

CREATE TABLE `product_sizes` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `size_name` enum('Mediano','Grande') NOT NULL,
  `price_modifier` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `product_sizes`
--

INSERT INTO `product_sizes` (`id`, `product_id`, `size_name`, `price_modifier`, `created_at`) VALUES
(1, 1, 'Mediano', 0.00, '2025-10-26 23:36:39'),
(2, 1, 'Grande', 4820.00, '2025-10-26 23:36:39'),
(3, 2, 'Mediano', 0.00, '2025-10-26 23:36:39'),
(4, 2, 'Grande', 4820.00, '2025-10-26 23:36:39'),
(5, 3, 'Mediano', 0.00, '2025-10-26 23:36:39'),
(6, 3, 'Grande', 4820.00, '2025-10-26 23:36:39'),
(7, 4, 'Mediano', 0.00, '2025-10-26 23:36:39'),
(8, 4, 'Grande', 4820.00, '2025-10-26 23:36:39'),
(10, 6, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(11, 7, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(12, 8, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(13, 9, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(14, 10, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(15, 11, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(16, 12, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(17, 13, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(18, 14, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(19, 15, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(20, 16, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(21, 17, 'Mediano', 0.00, '2025-10-28 18:30:00'),
(25, 6, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(26, 7, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(27, 8, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(28, 9, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(29, 10, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(30, 11, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(31, 12, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(32, 13, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(33, 14, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(34, 15, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(35, 16, 'Grande', 4800.00, '2025-10-28 18:30:00'),
(36, 17, 'Grande', 4800.00, '2025-10-28 18:30:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_open` tinyint(1) DEFAULT 1,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `restaurants`
--

INSERT INTO `restaurants` (`id`, `name`, `address`, `latitude`, `longitude`, `phone`, `is_open`, `opening_time`, `closing_time`, `created_at`, `updated_at`) VALUES
(1, 'McDonald\'s - Mar del Plata Centro', 'San Juan 1532, Mar del Plata, Buenos Aires', -38.00550000, -57.54260000, '+54 223 123-4567', 1, '08:00:00', '23:00:00', '2025-10-26 23:36:39', '2025-10-26 23:36:39'),
(2, 'McDonald\'s - Mar del Plata Centro', 'San Juan 1532, Mar del Plata, Buenos Aires', -38.00550000, -57.54260000, '+54 223 123-4567', 1, '08:00:00', '23:00:00', '2025-10-28 21:19:11', '2025-10-28 21:19:11'),
(3, 'McDonald\'s - Buenos Aires Puerto Madero', 'Alicia Moreau de Justo 1550, CABA', -34.61750000, -58.36330000, '+54 11 4315-0000', 1, '07:00:00', '00:00:00', '2025-10-28 21:19:11', '2025-10-28 21:19:11'),
(4, 'McDonald\'s - Córdoba Centro', 'Av. Colón 350, Córdoba', -31.41350000, -64.18110000, '+54 351 422-1234', 1, '08:00:00', '23:30:00', '2025-10-28 21:19:11', '2025-10-28 21:19:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` enum('admin','cliente','repartidor') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'admin', 'Administrador del sistema', '2025-10-26 23:36:39'),
(2, 'cliente', 'Cliente de la aplicación', '2025-10-26 23:36:39'),
(3, 'repartidor', 'Repartidor de pedidos', '2025-10-26 23:36:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `device_info` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sides`
--

CREATE TABLE `sides` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `extra_price` decimal(10,2) DEFAULT 0.00,
  `image_url` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sides`
--

INSERT INTO `sides` (`id`, `name`, `extra_price`, `image_url`, `is_available`, `created_at`) VALUES
(1, 'Papas Fritas Medianas', 0.00, NULL, 1, '2025-10-26 23:36:39'),
(2, 'Papas Tasty Bacon', 3900.00, NULL, 1, '2025-10-26 23:36:39'),
(3, 'Papas con Cheddar', 3200.00, NULL, 1, '2025-10-26 23:36:39'),
(4, 'Papas Tasty', 3200.00, NULL, 1, '2025-10-26 23:36:39'),
(5, 'Ensalada', 0.00, NULL, 1, '2025-10-26 23:36:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `profile_image_url` text DEFAULT NULL,
  `document_image_url` text DEFAULT NULL,
  `auth_provider` enum('local','google','facebook') DEFAULT 'local',
  `provider_id` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `address`, `latitude`, `longitude`, `profile_image_url`, `document_image_url`, `auth_provider`, `provider_id`, `is_verified`, `created_at`, `updated_at`) VALUES
(1, 'Azul Sofía David', 'azulsofiadavid@gmail.com', NULL, 'Azul Sofía David', '2233445238', 'Avenida Juan B. Justo, Santa Mónica, Mar del Plata', -38.01133580, -57.58086870, 'https://lh3.googleusercontent.com/a/ACg8ocJ2NOsyZuErxj-vvMKSqHK1jaDIgvXE6GOW-SaFLJfboOThmDMo=s96-c', '/uploads/1-1762177857581-727604569.jpg', 'google', '112535185562170301751', 1, '2025-10-27 15:00:20', '2025-11-05 02:38:09'),
(4, 'Planned By Lisa', 'plannedbylisa@gmail.com', NULL, 'Planned By Lisa', NULL, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocK4ClfjX0Do1wlYjh7Ntz74pLtcn47VDIRf89eVGErkUeFr=s96-c', NULL, 'google', '100966337074249506271', 1, '2025-11-03 21:50:44', '2025-11-04 17:10:36'),
(5, 'FUNES Lionel', 'lionel.funes12@gmail.com', NULL, 'FUNES Lionelaa', NULL, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocKTl2muim8xkRpNoym3wc9IlpgwvIHZoS2EKWrKOI21erjstfo=s96-c', NULL, 'google', '108336507326623136508', 1, '2025-11-03 21:58:09', '2025-11-04 16:01:35'),
(6, 'repartidor1', 'repartidor1@test.com', NULL, 'Carlos López', '+54 223 111-1111', NULL, NULL, NULL, NULL, NULL, 'local', NULL, 1, '2025-11-04 15:18:30', '2025-11-04 15:18:30'),
(7, 'repartidor2', 'repartidor2@test.com', NULL, 'Ana Martínezaa', '+54 223 222-2222', NULL, NULL, NULL, NULL, NULL, 'local', NULL, 1, '2025-11-04 15:18:30', '2025-11-04 16:01:41'),
(8, 'repartidor3', 'repartidor3@test.com', NULL, 'Pedro González', '+54 223 333-3333', NULL, NULL, NULL, NULL, NULL, 'local', NULL, 1, '2025-11-04 15:18:30', '2025-11-04 15:18:30'),
(9, 'Azul', 'azul@gmail.com', '$2b$10$GexhTuc8E9QTiDCqv39NOeq6sQDmP58.as0GwEiyA6CRgsrdjran6', 'Azul Sofia Lopez', NULL, NULL, NULL, NULL, NULL, NULL, 'local', NULL, 0, '2025-11-04 17:26:23', '2025-11-04 17:26:23'),
(10, 'Lio', 'lio@gmail.com', '$2b$10$4RT.Z38Xl/YkmLm3V10KkuVhfRwDQN9gHjbO07jHu8PpqzME/4xN2', 'Funes', NULL, NULL, NULL, NULL, NULL, NULL, 'local', NULL, 0, '2025-11-04 17:34:01', '2025-11-04 17:34:01'),
(11, 'azu', 'azu@gmail.com', '$2b$10$tP6hJ1LCOWPoF55bAOWfEuMFJYvVIE8LJ5F1aOQzcjDg/AWWFZRpK', 'sofia', NULL, 'Chaco, 1707, Don Bosco, Mar del Plata', -37.99039660, -57.56531930, NULL, '/uploads/11-1762309943274-189137413.jpeg', 'local', NULL, 0, '2025-11-04 21:29:14', '2025-11-05 02:32:29'),
(12, 'Azu', 'azuulsofiadavid@gmail.com', '$2b$10$3.aHr3H5h4s5smVQqLn8W.N/0LsVgztVuf1KNH2dHHY0rGOnhHclu', 'Azu', NULL, '25 de Mayo, 4188, San Juan, Mar del Plata', -37.98974830, -57.56150530, '/uploads/12-1762314259293-153889934.jpeg', NULL, 'local', NULL, 0, '2025-11-05 03:40:52', '2025-11-05 03:44:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `address` varchar(500) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `label` varchar(100) DEFAULT 'Casa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_addresses`
--

INSERT INTO `user_addresses` (`id`, `user_id`, `address`, `latitude`, `longitude`, `is_default`, `created_at`, `updated_at`, `label`) VALUES
(5, 1, '25 de Mayo, 4191, San Juan, Mar del Plata', -37.98966330, -57.56142950, 0, '2025-10-29 18:00:52', '2025-10-29 21:15:55', 'Mi Casaa'),
(8, 1, 'Avenida Juan B. Justo, Santa Mónica, Mar del Plata', -38.01133580, -57.58086870, 0, '2025-10-29 21:24:36', '2025-10-29 21:25:02', 'La escuela'),
(11, 1, 'Falucho, 4470, Don Bosco, Mar del Plata', -37.99579600, -57.57042240, 0, '2025-11-01 18:50:57', '2025-11-01 18:51:05', 'La casa de Papá'),
(14, 11, 'Chaco, 1707, Don Bosco, Mar del Plata', -37.99039660, -57.56531930, 0, '2025-11-04 22:58:33', '2025-11-04 22:58:33', 'Mi ubicación actual'),
(15, 12, '25 de Mayo, 4188, San Juan, Mar del Plata', -37.98974830, -57.56150530, 0, '2025-11-05 03:40:58', '2025-11-05 03:40:58', 'Mi ubicación actual');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_coupons`
--

CREATE TABLE `user_coupons` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `created_at`) VALUES
(1, 1, 1, '2025-11-04 14:10:04'),
(2, 6, 3, '2025-11-04 15:18:30'),
(3, 7, 3, '2025-11-04 15:18:30'),
(4, 8, 3, '2025-11-04 15:18:30'),
(5, 9, 3, '2025-11-04 17:26:23'),
(6, 10, 3, '2025-11-04 17:34:01'),
(7, 11, 3, '2025-11-04 21:29:14');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `coupon_id` (`coupon_id`);

--
-- Indices de la tabla `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `size_id` (`size_id`),
  ADD KEY `side_id` (`side_id`),
  ADD KEY `drink_id` (`drink_id`),
  ADD KEY `idx_cart` (`cart_id`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indices de la tabla `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `fk_coupons_product` (`product_id`);

--
-- Indices de la tabla `delivery_drivers`
--
ALTER TABLE `delivery_drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indices de la tabla `drinks`
--
ALTER TABLE `drinks`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `flyers`
--
ALTER TABLE `flyers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indices de la tabla `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `oauth_tokens`
--
ALTER TABLE `oauth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_provider` (`user_id`,`provider`);

--
-- Indices de la tabla `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `coupon_id` (`coupon_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_repartidor` (`repartidor_id`),
  ADD KEY `orders_ibfk_5` (`driver_id`);

--
-- Indices de la tabla `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order` (`order_id`);

--
-- Indices de la tabla `order_rejections`
--
ALTER TABLE `order_rejections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_rejection` (`order_id`,`driver_id`),
  ADD KEY `idx_order_rejections_driver` (`driver_id`),
  ADD KEY `idx_order_rejections_order` (`order_id`);

--
-- Indices de la tabla `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `driver_id` (`driver_id`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_is_available` (`is_available`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indices de la tabla `product_ingredients`
--
ALTER TABLE `product_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_ingredient` (`product_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indices de la tabla `product_sizes`
--
ALTER TABLE `product_sizes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_size` (`product_id`,`size_name`);

--
-- Indices de la tabla `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_location` (`latitude`,`longitude`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`(255)),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `sides`
--
ALTER TABLE `sides`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_auth_provider` (`auth_provider`,`provider_id`),
  ADD KEY `idx_username` (`username`);

--
-- Indices de la tabla `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_addresses_user` (`user_id`),
  ADD KEY `idx_user_addresses_default` (`user_id`,`is_default`);

--
-- Indices de la tabla `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coupon_id` (`coupon_id`),
  ADD KEY `idx_user_coupon` (`user_id`,`coupon_id`);

--
-- Indices de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `delivery_drivers`
--
ALTER TABLE `delivery_drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `drinks`
--
ALTER TABLE `drinks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `flyers`
--
ALTER TABLE `flyers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `oauth_tokens`
--
ALTER TABLE `oauth_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT de la tabla `order_rejections`
--
ALTER TABLE `order_rejections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `order_tracking`
--
ALTER TABLE `order_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `product_ingredients`
--
ALTER TABLE `product_ingredients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `product_sizes`
--
ALTER TABLE `product_sizes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sides`
--
ALTER TABLE `sides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `user_coupons`
--
ALTER TABLE `user_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `carts_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `carts_ibfk_3` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`);

--
-- Filtros para la tabla `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`size_id`) REFERENCES `product_sizes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `cart_items_ibfk_4` FOREIGN KEY (`side_id`) REFERENCES `sides` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `cart_items_ibfk_5` FOREIGN KEY (`drink_id`) REFERENCES `drinks` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `coupons`
--
ALTER TABLE `coupons`
  ADD CONSTRAINT `fk_coupons_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `delivery_drivers`
--
ALTER TABLE `delivery_drivers`
  ADD CONSTRAINT `delivery_drivers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `oauth_tokens`
--
ALTER TABLE `oauth_tokens`
  ADD CONSTRAINT `oauth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`repartidor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`driver_id`) REFERENCES `delivery_drivers` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `order_rejections`
--
ALTER TABLE `order_rejections`
  ADD CONSTRAINT `order_rejections_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_rejections_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `delivery_drivers` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD CONSTRAINT `order_tracking_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_tracking_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `delivery_drivers` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `product_ingredients`
--
ALTER TABLE `product_ingredients`
  ADD CONSTRAINT `product_ingredients_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `product_sizes`
--
ALTER TABLE `product_sizes`
  ADD CONSTRAINT `product_sizes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
