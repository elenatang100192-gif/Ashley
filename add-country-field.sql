-- Add country field to menu_items table
-- Run this to add country support

ALTER TABLE `menu_items` 
ADD COLUMN `country` VARCHAR(50) DEFAULT 'China Office' AFTER `tag`,
ADD INDEX `idx_country` (`country`);

-- Update existing data to China Office
UPDATE `menu_items` SET `country` = 'China Office' WHERE `country` IS NULL OR `country` = '';

-- Add country field to orders table
ALTER TABLE `orders` 
ADD COLUMN `country` VARCHAR(50) DEFAULT 'China Office' AFTER `name`,
ADD INDEX `idx_country` (`country`);

-- Update existing orders to China Office
UPDATE `orders` SET `country` = 'China Office' WHERE `country` IS NULL OR `country` = '';

