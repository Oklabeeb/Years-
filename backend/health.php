<?php
require_once __DIR__ . '/api/cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/api/db.php';

try {
    $result = $pdo->query('SELECT 1')->fetchColumn();

    // Auto-migrate newly required tables and columns if not already existing
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                email VARCHAR(191) NOT NULL,
                role ENUM('student', 'staff', 'admin') NOT NULL,
                token VARCHAR(64) NOT NULL,
                code VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                is_used TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_token (token),
                INDEX idx_email_code (email, code),
                CONSTRAINT fk_pw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $cols = $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'deleted_for_users'")->fetchAll();
        if (empty($cols)) {
            $pdo->exec("ALTER TABLE chat_messages ADD COLUMN deleted_for_users TEXT NULL DEFAULT NULL AFTER is_read");
        }

        $uCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'status'")->fetchAll();
        if (empty($uCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active' AFTER role");
        } else {
            // Ensure status column is VARCHAR(50) so 'pending_verification' never triggers Warning 1265 (Data truncated)
            $pdo->exec("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active'");
        }
        $mfaCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'mfa_enabled'")->fetchAll();
        if (empty($mfaCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status");
        }
        $loginCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'last_login_at'")->fetchAll();
        if (empty($loginCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL AFTER mfa_enabled");
        }

        $flCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'failed_logins'")->fetchAll();
        if (empty($flCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN failed_logins INT NOT NULL DEFAULT 0 AFTER mfa_enabled");
        }

        $chatReadCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'last_read_group_msg_id'")->fetchAll();
        if (empty($chatReadCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN last_read_group_msg_id INT NOT NULL DEFAULT 0 AFTER status");
        }

        $loCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'lockout_until'")->fetchAll();
        if (empty($loCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN lockout_until DATETIME NULL AFTER failed_logins");
        }

        try {
            $pdo->exec("ALTER TABLE student_verification_requests MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'");
            $pdo->exec("ALTER TABLE student_verification_requests MODIFY COLUMN auto_verification_status VARCHAR(50) NOT NULL DEFAULT 'failed'");
        } catch (Throwable $e) {}

        try {
            $pdo->exec("ALTER TABLE email_logs MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'logged'");
        } catch (Throwable $e) {}

        // Guarantee Super Administrator account for okehabeeb72@gmail.com
        $habeebHash = password_hash('AdminSecure2026!', PASSWORD_BCRYPT);
        $checkHabeeb = $pdo->prepare("SELECT id, email, role, status FROM users WHERE email = ?");
        $checkHabeeb->execute(['okehabeeb72@gmail.com']);
        $habeebUser = $checkHabeeb->fetch(PDO::FETCH_ASSOC);

        $habeebUserId = 0;
        if (!$habeebUser) {
            $insHabeeb = $pdo->prepare("
                INSERT INTO users (name, email, password, role, status, mfa_enabled, failed_logins, lockout_until, program, department, monthly_salary)
                VALUES ('Oke Habeeb', 'okehabeeb72@gmail.com', ?, 'admin', 'active', 0, 0, NULL, 'WAEC', 'Science', 150000.00)
            ");
            $insHabeeb->execute([$habeebHash]);
            $habeebUserId = (int)$pdo->lastInsertId();
        } else {
            $habeebUserId = (int)$habeebUser['id'];
            $pdo->prepare("
                UPDATE users 
                SET role = 'admin', status = 'active', password = ?, mfa_enabled = 0, failed_logins = 0, lockout_until = NULL 
                WHERE id = ?
            ")->execute([$habeebHash, $habeebUserId]);
        }

        if ($habeebUserId > 0) {
            $pdo->prepare("
                INSERT INTO user_roles (user_id, role_id, assigned_by)
                VALUES (?, 1, 1)
                ON DUPLICATE KEY UPDATE role_id = 1
            ")->execute([$habeebUserId]);
        }

        // Also ensure admin@school.com has failed_logins cleared
        $pdo->exec("UPDATE users SET failed_logins = 0, lockout_until = NULL WHERE email = 'admin@school.com'");

        // Guarantee demo student@school.com and staff@school.com have active status & known test credentials
        $demoHash = password_hash('Password123!', PASSWORD_BCRYPT);
        $pdo->prepare("
            UPDATE users 
            SET password = ?, status = 'active', is_verified = 1, is_paid = 1, failed_logins = 0, lockout_until = NULL 
            WHERE email = 'student@school.com'
        ")->execute([$demoHash]);

        $pdo->prepare("
            UPDATE users 
            SET password = ?, status = 'active', failed_logins = 0, lockout_until = NULL 
            WHERE email = 'staff@school.com'
        ")->execute([$demoHash]);

        // Auto-migrate resources table to support direct mediumtext content persistence
        $resContentCols = $pdo->query("SHOW COLUMNS FROM resources LIKE 'content'")->fetchAll();
        if (empty($resContentCols)) {
            $pdo->exec("ALTER TABLE resources ADD COLUMN content MEDIUMTEXT NULL AFTER file_path");
        }

        // Seed and sync curriculum library (WAEC, JAMB, textbooks across all departments)
        require_once __DIR__ . '/includes/curriculum_library.php';
        $curriculumSeeded = seedCurriculumLibrary($pdo);
        $totalResources = (int)$pdo->query("SELECT COUNT(*) FROM resources")->fetchColumn();

        $migCol = $pdo->query("SHOW COLUMNS FROM users LIKE 'status'")->fetch(PDO::FETCH_ASSOC);
        $chatReadMigCol = $pdo->query("SHOW COLUMNS FROM users LIKE 'last_read_group_msg_id'")->fetch(PDO::FETCH_ASSOC);
        $verifiedAdmin = $pdo->query("SELECT id, email, role, status FROM users WHERE email = 'okehabeeb72@gmail.com'")->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable $migErr) {
        $migrationError = $migErr->getMessage();
    }

    echo json_encode([
        'success' => true,
        'backend' => 'working',
        'database' => $result == 1 ? 'connected' : 'not connected',
        'schema_migrated' => true,
        'user_status_type' => $migCol['Type'] ?? null,
        'last_read_group_migrated' => !empty($chatReadMigCol),
        'habeeb_admin_ready' => !empty($verifiedAdmin) && $verifiedAdmin['role'] === 'admin',
        'curriculum_seeded' => $curriculumSeeded ?? 0,
        'total_resources' => $totalResources ?? 0,
        'migration_error' => $migrationError ?? null,
        'env_frontend_origin' => getenv('FRONTEND_ORIGIN') ?: '(not set)',
        'received_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No origin received'
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'backend' => 'working',
        'database' => 'not connected',
        'error' => $e->getMessage(),
        'env_frontend_origin' => getenv('FRONTEND_ORIGIN') ?: '(not set)',
        'received_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No origin received'
    ]);
}
