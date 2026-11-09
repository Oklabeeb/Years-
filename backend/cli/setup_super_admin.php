<?php
/**
 * CLI Tool: Initial Super Admin Setup
 * Strictly executable via CLI (server console). Blocked from web/HTTP.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die("Access Denied: This script can only be run from the server command line.\n");
}

require_once __DIR__ . '/../api/db.php';

echo "========================================================\n";
echo "   SCHOOL PORTAL - SUPER ADMINISTRATOR SETUP TOOL      \n";
echo "========================================================\n\n";

// Parse CLI flags
$options = getopt("", ["name:", "email:", "password:", "force"]);

// 1. Check if Super Admin role exists
$stmt = $pdo->prepare("SELECT id FROM roles WHERE slug = 'super_admin' LIMIT 1");
$stmt->execute();
$role = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$role) {
    die("Error: 'super_admin' role not found in database. Please run migrations first.\n");
}
$superAdminRoleId = (int)$role['id'];

// 2. Check if a Super Admin already exists
$stmt = $pdo->prepare("
    SELECT u.id, u.name, u.email 
    FROM users u 
    INNER JOIN user_roles ur ON u.id = ur.user_id 
    WHERE ur.role_id = ? AND u.status = 'active'
    LIMIT 1
");
$stmt->execute([$superAdminRoleId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existing && !isset($options['force'])) {
    echo "NOTICE: An active Super Admin already exists:\n";
    echo "  Name:  {$existing['name']}\n";
    echo "  Email: {$existing['email']}\n";
    echo "To overwrite or add another Super Admin, pass the --force flag:\n";
    echo "  php cli/setup_super_admin.php --force\n\n";
    exit(0);
}

// 3. Collect credentials
$name = $options['name'] ?? null;
$email = $options['email'] ?? null;
$password = $options['password'] ?? null;

if (!$name) {
    echo "Enter Super Admin Full Name [Chief Administrator]: ";
    $input = trim(fgets(STDIN));
    $name = !empty($input) ? $input : 'Chief Administrator';
}

if (!$email) {
    echo "Enter Official School Email [admin@school.edu.ng]: ";
    $input = trim(fgets(STDIN));
    $email = !empty($input) ? $input : 'admin@school.edu.ng';
}

if (!$password) {
    echo "Enter Strong Password (min 8 chars): ";
    $password = trim(fgets(STDIN));
}

if (strlen($password) < 8) {
    die("Error: Password must be at least 8 characters long for security.\n");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Error: Invalid email format: {$email}\n");
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// 4. Create or update user
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    $userId = (int)$user['id'];
    $upStmt = $pdo->prepare("
        UPDATE users 
        SET name = ?, password = ?, role = 'admin', status = 'active', failed_logins = 0, lockout_until = NULL 
        WHERE id = ?
    ");
    $upStmt->execute([$name, $hash, $userId]);
    echo "Updated existing user account (ID: $userId) to Super Admin.\n";
} else {
    $inStmt = $pdo->prepare("
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, 'admin', 'active')
    ");
    $inStmt->execute([$name, $email, $hash]);
    $userId = (int)$pdo->lastInsertId();
    echo "Created new Super Admin user account (ID: $userId).\n";
}

// 5. Assign super_admin role
$assignStmt = $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)");
$assignStmt->execute([$userId, $superAdminRoleId]);

// 6. Record Audit Log
$logStmt = $pdo->prepare("
    INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, details)
    VALUES (?, ?, 'admin.cli_setup_super_admin', 'users', ?, ?)
");
$logStmt->execute([
    $userId,
    $email,
    $userId,
    json_encode(['action' => 'Super Admin initialized via CLI', 'time' => date('Y-m-d H:i:s')])
]);

echo "\n========================================================\n";
echo "SUCCESS: Super Administrator account is now active!\n";
echo "  Name:     {$name}\n";
echo "  Email:    {$email}\n";
echo "  Role:     Super Administrator (Full Wildcard Access)\n";
echo "  Security: CLI-verified, zero public registration exposure\n";
echo "========================================================\n";

