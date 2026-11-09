<?php

$host = getenv('DB_HOST') ?: (getenv('TIDB_HOST') ?: '127.0.0.1');
$db   = getenv('DB_NAME') ?: (getenv('TIDB_DB_NAME') ?: 'school_portal_db');
$user = getenv('DB_USER') ?: (getenv('TIDB_USER') ?: 'root');
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : (getenv('TIDB_PASSWORD') ?: '');
$port = getenv('DB_PORT') ?: (getenv('TIDB_PORT') ?: ($host === '127.0.0.1' || $host === 'localhost' ? '3306' : '4000'));

$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";

$isLocal = ($host === '127.0.0.1' || $host === 'localhost');

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

// Apply TiDB Cloud SSL CA certificate when connecting to cloud database
if (!$isLocal) {
    $caFile = __DIR__ . '/../certs/isrgrootx1.pem';
    if (file_exists($caFile)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $caFile;
    } elseif (file_exists('/etc/ssl/certs/ca-certificates.crt')) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = '/etc/ssl/certs/ca-certificates.crt';
    }
    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());

    header('Content-Type: application/json');
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}
