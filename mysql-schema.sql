-- MySQL Database Schema for Menu Selection System
-- Database: order_menu

-- Table: menu_items
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `tag` VARCHAR(255) DEFAULT NULL COMMENT 'Restaurant name',
  `subtitle` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `price` VARCHAR(50) DEFAULT NULL,
  `image` LONGTEXT DEFAULT NULL COMMENT 'Base64 encoded image',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL COMMENT 'Customer name',
  `order` TEXT DEFAULT NULL COMMENT 'Order details',
  `items` JSON DEFAULT NULL COMMENT 'Order items array',
  `date` VARCHAR(100) DEFAULT NULL COMMENT 'Order date string',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_date` (`date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings for hidden restaurants
INSERT INTO `settings` (`key`, `value`) 
VALUES ('hiddenRestaurants', JSON_ARRAY())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

