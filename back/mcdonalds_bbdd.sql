-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-10-2025 a las 15:18:54
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `code` varchar(50) NOT NULL,
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
(1, 'Menú Fórmula 1 La Película! ', 'Pasá por McDonald’s y disfrutá del sabor de las carreras con una edición limitada del Cuarto de Libra con Salsa Barbacoa y Bacon👌Ah y no te olvides que, por un precio extra, te podés llevar un auto de colección🏎️', 'https://pbs.twimg.com/media/GuKWXk1WMAA_e-I.jpg:large', 'https://x.com/McDonalds_Ar/status/1937526128098603295', 1, '2025-10-27 03:00:00', '2025-11-11 02:59:59', 1, '2025-10-27 15:47:47', '2025-10-27 16:17:44'),
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
(1, 1, 'google', 'ya29.A0ATi6K2vI29Dciyoubk2L4chTtSO2uTVEFn2FFlreaOjG3M8gJVWr-4MzPq3-YG_WNYsVuA5enzAqxQ1WdvIbC9dP_Ow-C887nTQvYSNtge9HEQg-WSQCgb9qHtNPJNXmQNThTqiOS3FrbC-z0jITbKDRtKAOnTNQuoVFjOp-7uUHkbktRwWwPbfvSlrnhGLcZj1TclI-cMcXRlpWj6jsK3sbzLVhjMS8ufbBQcWSdr9qyIxoX_V-hdU_7Wp2lZSw45BT__JN9WDS2unU1msbCRG9krxvaCgYKAfUSARUSFQHGX2MiodAscmx75AUgHAx5DSiewA0291', NULL, '2025-10-27 23:41:18', '2025-10-27 15:00:20', '2025-10-27 22:41:18'),
(3, 2, 'google', 'ya29.A0ATi6K2sEk8yanvnxKkr5j5OpH-MXD8hcOJgI-QPuhVZz98Hyh6mbfK7u4u-3t1pV179qzEBVKQqllVtcR79ufrJRbOJB-ySLoRjlzqKx5nocNW5aKQEJz29dmJJvfsiCj7qoJ4Ubi37gaBMjzodxinCwjDM-MO9ohAw3dx8ek7SuQAH5mo4awh7rP5XUSY3cBWTXKlKSpDMCI2uvKCJ5Q-YAMBXnhfpKeOHw6ED-CvF8lWkPXHd43ZXz8kIcjTFBj1kX2HNpQRJOKzn5o4vpCMCuuQX5aCgYKARsSARESFQHGX2MijqGMNU8Ne1IQdEh3h4rBAw0291', NULL, '2025-10-27 19:08:30', '2025-10-27 17:58:30', '2025-10-27 18:08:30');

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
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'Big Mac Mediano', 'Hamburguesa con doble carne, queso cheddar, lechuga y salsa Big Mac. Incluye papas y bebida medianas', 1, 13100.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26000PRUEBA3.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:26:01'),
(2, 'Cuarto de Libra Mediano', 'Hamburguesa con carne de 1/4 de libra, queso, cebolla y pepino. Incluye papas y bebida medianas', 1, 14500.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26003_AR19JUL24.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:26:56'),
(3, 'McNuggets x10 Mediano', '10 McNuggets crujientes con salsa a elección. Incluye papas y bebida medianas', 1, 12800.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/26005_AR19JUL24.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:27:20'),
(4, 'Tasty Feat Cuarto Doble Mediano', 'Doble carne de 1/4 de libra con doble queso cheddar. Incluye papas y bebida medianas', 1, 17700.00, 'https://d2umxhib5z7frz.cloudfront.net/Argentina/DLV_2852_06mar25.png', 1, 1, 0, '2025-10-26 23:36:39', '2025-10-27 15:28:16');

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
(8, 4, 'Grande', 4820.00, '2025-10-26 23:36:39');

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
(1, 'McDonald\'s - Mar del Plata Centro', 'San Juan 1532, Mar del Plata, Buenos Aires', -38.00550000, -57.54260000, '+54 223 123-4567', 1, '08:00:00', '23:00:00', '2025-10-26 23:36:39', '2025-10-26 23:36:39');

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
(1, 'Azul Sofía David', 'azulsofiadavid@gmail.com', NULL, 'Azul Sofía David', NULL, '25 de Mayo, 4178, San Juan, Mar del Plata, Buenos Aires, CP 7606, Argentina', -37.98986540, -57.56147350, 'https://lh3.googleusercontent.com/a/ACg8ocJ2NOsyZuErxj-vvMKSqHK1jaDIgvXE6GOW-SaFLJfboOThmDMo=s96-c', NULL, 'google', '112535185562170301751', 1, '2025-10-27 15:00:20', '2025-10-28 14:16:24'),
(2, 'Azul David 2', 'azuulsofiadavid@gmail.com', NULL, 'Azul David 2', NULL, NULL, NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIWPd-OyqI5hSJQJuBkpVePF2Ge8AvYYxfj9aQbj6bv2esPDV-s=s400-c', NULL, 'google', '117112216497659378073', 1, '2025-10-27 17:58:30', '2025-10-27 18:08:30');

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
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `idx_user` (`user_id`);

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
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_is_active` (`is_active`);

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
  ADD KEY `idx_repartidor` (`repartidor_id`);

--
-- Indices de la tabla `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order` (`order_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `product_ingredients`
--
ALTER TABLE `product_ingredients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `product_sizes`
--
ALTER TABLE `product_sizes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `user_coupons`
--
ALTER TABLE `user_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `carts_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`repartidor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

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
