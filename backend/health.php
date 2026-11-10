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
            $pdo->exec("ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended', 'invited') NOT NULL DEFAULT 'active' AFTER role");
        }
        $mfaCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'mfa_enabled'")->fetchAll();
        if (empty($mfaCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status");
        }
        $loginCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'last_login_at'")->fetchAll();
        if (empty($loginCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL AFTER mfa_enabled");
        }
    } catch (Throwable $migErr) {
        error_log("Schema auto-migration notice: " . $migErr->getMessage());
    }

    echo json_encode([
        'success' => true,
        'backend' => 'working',
        'database' => $result == 1 ? 'connected' : 'not connected',
        'schema_migrated' => true,
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
