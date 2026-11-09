<?php
// Ensure this script only executes once per request
if (defined('APP_CORS_LOADED')) {
    return;
}
define('APP_CORS_LOADED', true);

// Configure cross-site PHP session cookies BEFORE session_start()
if (!headers_sent()) {
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_path', '/');
    ini_set('session.use_only_cookies', '1');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None'
    ]);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';
$envAllowed = trim((string)getenv('FRONTEND_ORIGIN'));

$isAllowed = false;

if (!empty($origin)) {
    // 1. Check against FRONTEND_ORIGIN env variable (supports comma-separated list or single origin)
    if (!empty($envAllowed)) {
        if ($envAllowed === '*') {
            $isAllowed = true;
        } else {
            $allowedList = array_map('trim', explode(',', $envAllowed));
            foreach ($allowedList as $allowed) {
                if (rtrim($allowed, '/') === rtrim($origin, '/')) {
                    $isAllowed = true;
                    break;
                }
            }
        }
    }

    // 2. Automatically allow Vercel domains (*.vercel.app), localhost, and 127.0.0.1
    if (!$isAllowed) {
        $parsed = parse_url($origin);
        $host = $parsed['host'] ?? '';
        if (
            str_ends_with($host, '.vercel.app') ||
            $host === 'vercel.app' ||
            $host === 'localhost' ||
            $host === '127.0.0.1' ||
            str_starts_with($host, 'localhost:') ||
            str_starts_with($host, '127.0.0.1:')
        ) {
            $isAllowed = true;
        }
    }
}

// Send CORS headers if origin is allowed
if ($isAllowed && !empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
    header('Access-Control-Max-Age: 86400');
    header('Vary: Origin');
}

// Handle preflight OPTIONS requests immediately
if ($requestMethod === 'OPTIONS') {
    if (!headers_sent()) {
        header('Content-Length: 0');
        header('Content-Type: text/plain');
    }
    http_response_code(204);
    exit;
}
