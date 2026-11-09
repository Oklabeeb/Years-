<?php
require_once __DIR__ . '/api/cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/api/db.php';

try {
    $result = $pdo->query('SELECT 1')->fetchColumn();

    echo json_encode([
        'success' => true,
        'backend' => 'working',
        'database' => $result == 1 ? 'connected' : 'not connected',
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
