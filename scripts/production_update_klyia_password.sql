-- ==============================================================================
-- KLYIA TECHNOLOGY — PRODUCTION HOSTINGER MYSQL PASSWORD RECOVERY SCRIPT
-- Target Table:        users
-- Associated Sessions: user_sessions
-- Target Admin Email:  klyiatechnology@gmail.com
-- Hashing Algorithm:   bcrypt (cost factor 10, generated via bcryptjs)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PRE-CHECK 1: Confirm exactly ONE matching administrator account exists
-- Expected output: exactly 1 row returned.
-- Verify that role is 'Admin' and status is 'Active'.
-- ------------------------------------------------------------------------------
SELECT `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`
FROM `users`
WHERE LOWER(`email`) = 'klyiatechnology@gmail.com';

-- PRE-CHECK 2: Count active sessions for this administrator before invalidation
SELECT COUNT(*) AS active_admin_sessions
FROM `user_sessions`
WHERE `user_id` IN (
    SELECT `id` FROM `users` WHERE LOWER(`email`) = 'klyiatechnology@gmail.com'
);


-- ------------------------------------------------------------------------------
-- STEP 1: Update the administrator password hash
-- IMPORTANT: Replace '<PASTE_FRESH_BCRYPT_HASH_HERE>' with your freshly generated
-- bcrypt hash (e.g. from `node scripts/generate-password-hash.js`).
-- Expected result: Exactly 1 row affected.
-- ------------------------------------------------------------------------------
UPDATE `users`
SET `password_hash` = '<PASTE_FRESH_BCRYPT_HASH_HERE>',
    `updated_at` = NOW()
WHERE LOWER(`email`) = 'klyiatechnology@gmail.com'
LIMIT 1;


-- ------------------------------------------------------------------------------
-- STEP 2: Invalidate all existing sessions for this administrator
-- Forces any active browser sessions to immediately authenticate with the new password.
-- ------------------------------------------------------------------------------
DELETE FROM `user_sessions`
WHERE `user_id` IN (
    SELECT `id` FROM `users` WHERE LOWER(`email`) = 'klyiatechnology@gmail.com'
);


-- ------------------------------------------------------------------------------
-- POST-CHECK 1: Confirm the administrator account has updated_at timestamp renewed
-- Expected output: Exactly 1 row showing updated_at reflecting current time.
-- ------------------------------------------------------------------------------
SELECT `id`, `name`, `email`, `role`, `status`, `updated_at`
FROM `users`
WHERE LOWER(`email`) = 'klyiatechnology@gmail.com';

-- POST-CHECK 2: Confirm 0 active sessions remain for this user
SELECT COUNT(*) AS remaining_sessions
FROM `user_sessions`
WHERE `user_id` IN (
    SELECT `id` FROM `users` WHERE LOWER(`email`) = 'klyiatechnology@gmail.com'
);

-- POST-CHECK 3: Safety verification — ensure business records were not modified
SELECT
    (SELECT COUNT(*) FROM `clients`) AS total_clients,
    (SELECT COUNT(*) FROM `invoices`) AS total_invoices,
    (SELECT COUNT(*) FROM `payments`) AS total_payments,
    (SELECT COUNT(*) FROM `expenses`) AS total_expenses,
    (SELECT COUNT(*) FROM `quotations`) AS total_quotations;
