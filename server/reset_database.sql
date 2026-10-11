-- ==============================================================================
-- KLYIA TECHNOLOGY — PRODUCTION DATABASE RESET SCRIPT
-- For Hostinger MySQL Database
--
-- This script safely and permanently purges all transactional and user-created
-- business records in a foreign-key-safe order, while strictly preserving:
-- 1. All table structures, constraints, and indexes
-- 2. Administrator credentials and authentication tables (users, user_sessions)
-- 3. Core company settings and category master configurations
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Purge all financial and transactional business records
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `invoices`;
TRUNCATE TABLE `quotations`;
TRUNCATE TABLE `renewals`;
TRUNCATE TABLE `purchases`;
TRUNCATE TABLE `expenses`;
TRUNCATE TABLE `digital_assets`;
TRUNCATE TABLE `clients`;
TRUNCATE TABLE `activity_logs`;

-- 2. Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Verify clean state (Counts should all be 0)
SELECT 'clients' AS table_name, COUNT(*) AS record_count FROM `clients`
UNION ALL
SELECT 'purchases', COUNT(*) FROM `purchases`
UNION ALL
SELECT 'quotations', COUNT(*) FROM `quotations`
UNION ALL
SELECT 'invoices', COUNT(*) FROM `invoices`
UNION ALL
SELECT 'payments', COUNT(*) FROM `payments`
UNION ALL
SELECT 'renewals', COUNT(*) FROM `renewals`
UNION ALL
SELECT 'expenses', COUNT(*) FROM `expenses`
UNION ALL
SELECT 'digital_assets', COUNT(*) FROM `digital_assets`
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM `activity_logs`;
