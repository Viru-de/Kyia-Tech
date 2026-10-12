-- ==============================================================================
-- KLYIA TECHNOLOGY — PRODUCTION DATABASE SCHEMA FOR HOSTINGER MYSQL
-- Database Name: (configured in DB_NAME, e.g. u123456789_klyia_db)
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Engine: InnoDB
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `company_name` VARCHAR(255) NOT NULL DEFAULT 'Klyia Technology',
  `tagline` VARCHAR(255) DEFAULT 'Web • Software • Digital • AI Solutions',
  `phone` VARCHAR(50) DEFAULT '8296887643',
  `whatsapp` VARCHAR(50) DEFAULT '8296887643',
  `email` VARCHAR(255) DEFAULT 'klyiatechnology@gmail.com',
  `website` VARCHAR(255) DEFAULT 'https://klyiatechnology.com/',
  `gstin` VARCHAR(50) DEFAULT '22AVSPP4822G1ZF',
  `pan` VARCHAR(50) DEFAULT 'AVSPP4822G',
  `address` TEXT,
  `area` VARCHAR(255) DEFAULT '',
  `city` VARCHAR(100) DEFAULT 'Bengaluru',
  `state` VARCHAR(100) DEFAULT 'Karnataka',
  `pincode` VARCHAR(20) DEFAULT '',
  `country` VARCHAR(100) DEFAULT 'India',
  `bank_name` VARCHAR(255) DEFAULT 'HDFC Bank',
  `account_holder` VARCHAR(255) DEFAULT 'Klyia Technology',
  `account_number` VARCHAR(100) DEFAULT '',
  `ifsc_code` VARCHAR(50) DEFAULT '',
  `branch` VARCHAR(100) DEFAULT '',
  `upi_id` VARCHAR(100) DEFAULT '8296887643@upi',
  `logo_url` TEXT,
  `quotation_prefix` VARCHAR(50) DEFAULT 'KLY-QTN-2026-',
  `invoice_prefix` VARCHAR(50) DEFAULT 'KLY-INV-2026-',
  `receipt_prefix` VARCHAR(50) DEFAULT 'KLY-RCP-2026-',
  `client_prefix` VARCHAR(50) DEFAULT 'KLY-CLI-',
  `quotation_validity_days` INT DEFAULT 15,
  `default_gst_percent` DECIMAL(5,2) DEFAULT 18.00,
  `quotation_terms` JSON,
  `service_categories` JSON,
  `expense_categories` JSON,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `salt` VARCHAR(64) DEFAULT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Admin',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CLIENTS
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(64) PRIMARY KEY,
  `client_id` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) DEFAULT '',
  `contact_person` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `whatsapp` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(255) DEFAULT '',
  `gstin` VARCHAR(50) DEFAULT '',
  `pan` VARCHAR(50) DEFAULT '',
  `address` TEXT,
  `area` VARCHAR(255) DEFAULT '',
  `city` VARCHAR(100) DEFAULT '',
  `district` VARCHAR(100) DEFAULT '',
  `state` VARCHAR(100) DEFAULT '',
  `pincode` VARCHAR(20) DEFAULT '',
  `country` VARCHAR(100) DEFAULT 'India',
  `website` VARCHAR(255) DEFAULT '',
  `industry` VARCHAR(100) DEFAULT '',
  `client_type` VARCHAR(50) DEFAULT 'NEW CLIENT',
  `notes` TEXT,
  `date_added` VARCHAR(50) NOT NULL,
  `last_purchase_date` VARCHAR(50) DEFAULT NULL,
  `next_renewal_date` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `pipeline_stage` VARCHAR(100) NOT NULL DEFAULT 'Requirement Received',
  `map_url` TEXT,
  `assigned_to` VARCHAR(100) DEFAULT '',
  `services` JSON,
  `project_title` VARCHAR(255) DEFAULT '',
  `estimated_value` DECIMAL(12,2) DEFAULT 0.00,
  `total_bill_amount` DECIMAL(12,2) DEFAULT 0.00,
  `advance_received` DECIMAL(12,2) DEFAULT 0.00,
  `pending_amount` DECIMAL(12,2) DEFAULT 0.00,
  `due_date` VARCHAR(50) DEFAULT NULL,
  `payment_status` VARCHAR(50) DEFAULT 'Pending',
  `is_archived` TINYINT(1) DEFAULT 0,
  `archived_at` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_client_status` (`status`),
  INDEX `idx_client_pipeline` (`pipeline_stage`),
  INDEX `idx_client_payment_status` (`payment_status`),
  INDEX `idx_client_archived` (`is_archived`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PURCHASES (Projects, Contracts & Services)
CREATE TABLE IF NOT EXISTS `purchases` (
  `id` VARCHAR(64) PRIMARY KEY,
  `purchase_id` VARCHAR(64) NOT NULL UNIQUE,
  `client_id` VARCHAR(64) NOT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `purchase_date` VARCHAR(50) NOT NULL,
  `service_type` VARCHAR(100) NOT NULL,
  `custom_service_title` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `billing_type` VARCHAR(50) DEFAULT 'One-Time',
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) DEFAULT 0.00,
  `gst_applicable` TINYINT(1) DEFAULT 1,
  `gst_percent` DECIMAL(5,2) DEFAULT 18.00,
  `is_interstate` TINYINT(1) DEFAULT 0,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `advance_paid` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `payment_mode` VARCHAR(50) DEFAULT 'Bank Transfer',
  `due_date` VARCHAR(50) DEFAULT NULL,
  `renewal_date` VARCHAR(50) DEFAULT NULL,
  `is_recurring` TINYINT(1) DEFAULT 0,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_purchases_client` (`client_id`),
  INDEX `idx_purchases_status` (`payment_status`),
  CONSTRAINT `fk_purchases_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. QUOTATIONS
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` VARCHAR(64) PRIMARY KEY,
  `quotation_number` VARCHAR(64) NOT NULL UNIQUE,
  `quotation_date` VARCHAR(50) NOT NULL,
  `valid_until` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(64) NOT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) DEFAULT '',
  `contact_person` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(255) DEFAULT '',
  `gstin` VARCHAR(50) DEFAULT '',
  `address` TEXT,
  `items` JSON NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_percent` DECIMAL(5,2) DEFAULT 18.00,
  `is_interstate` TINYINT(1) DEFAULT 0,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft',
  `notes` TEXT,
  `terms` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_quotations_client` (`client_id`),
  INDEX `idx_quotations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. INVOICES
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(64) PRIMARY KEY,
  `invoice_number` VARCHAR(64) NOT NULL UNIQUE,
  `quotation_number` VARCHAR(64) DEFAULT NULL,
  `invoice_date` VARCHAR(50) NOT NULL,
  `due_date` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(64) NOT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(255) DEFAULT '',
  `contact_person` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(255) DEFAULT '',
  `gstin` VARCHAR(50) DEFAULT '',
  `address` TEXT,
  `items` JSON NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(12,2) DEFAULT 0.00,
  `taxable_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `gst_percent` DECIMAL(5,2) DEFAULT 18.00,
  `is_interstate` TINYINT(1) DEFAULT 0,
  `cgst` DECIMAL(12,2) DEFAULT 0.00,
  `sgst` DECIMAL(12,2) DEFAULT 0.00,
  `igst` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
  `notes` TEXT,
  `terms` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_invoices_client` (`client_id`),
  INDEX `idx_invoices_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PAYMENTS (Receipts & Advances)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `receipt_no` VARCHAR(64) NOT NULL UNIQUE,
  `client_id` VARCHAR(64) NOT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `payment_date` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
  `reference_no` VARCHAR(100) DEFAULT '',
  `notes` TEXT,
  `against_type` VARCHAR(50) DEFAULT 'Direct Advance',
  `against_id` VARCHAR(64) DEFAULT NULL,
  `against_title` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payments_client` (`client_id`),
  INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RENEWALS
CREATE TABLE IF NOT EXISTS `renewals` (
  `id` VARCHAR(64) PRIMARY KEY,
  `client_id` VARCHAR(64) NOT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `domain_or_asset` VARCHAR(255) DEFAULT '',
  `provider` VARCHAR(255) DEFAULT 'Klyia Technology',
  `purchase_date` VARCHAR(50) NOT NULL,
  `expiry_date` VARCHAR(50) NOT NULL,
  `renewal_date` VARCHAR(50) NOT NULL,
  `renewal_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `reminder_days` INT DEFAULT 30,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
  `notes` TEXT,
  `last_reminder_sent_date` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_renewals_client` (`client_id`),
  INDEX `idx_renewals_date` (`renewal_date`),
  INDEX `idx_renewals_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. EXPENSES
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(64) PRIMARY KEY,
  `expense_id` VARCHAR(64) NOT NULL UNIQUE,
  `date` VARCHAR(50) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_mode` VARCHAR(50) DEFAULT 'UPI',
  `vendor` VARCHAR(255) DEFAULT '',
  `invoice_ref` VARCHAR(100) DEFAULT '',
  `is_recurring` TINYINT(1) DEFAULT 0,
  `recurring_period` VARCHAR(50) DEFAULT 'Monthly',
  `next_due_date` VARCHAR(50) DEFAULT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_expenses_date` (`date`),
  INDEX `idx_expenses_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. DIGITAL ASSETS
CREATE TABLE IF NOT EXISTS `digital_assets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `asset_name` VARCHAR(255) NOT NULL,
  `service_type` VARCHAR(100) NOT NULL,
  `client_id` VARCHAR(64) NOT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(255) DEFAULT '',
  `login_url` TEXT,
  `renewal_date` VARCHAR(50) NOT NULL,
  `cost_price` DECIMAL(12,2) DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_assets_client` (`client_id`),
  INDEX `idx_assets_renewal` (`renewal_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `user_name` VARCHAR(100) DEFAULT 'Viru Patel',
  `entity_type` VARCHAR(50) DEFAULT 'System',
  `entity_id` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. USER SESSIONS
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL UNIQUE,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. PASSWORD RESETS
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
