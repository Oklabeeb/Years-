
<?php

$allowedOrigin = trim(getenv('FRONTEND_ORIGIN') ?: '');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';

if ($allowedOrigin !== '' && $origin === $allowedOrigin) {
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Vary: Origin');
}

// Handle browser preflight requests.
if ($requestMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configure cross-site PHP session cookies before session_start().
if (PHP_SAPI !== 'cli' && !headers_sent()) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None'
    ]);
}
