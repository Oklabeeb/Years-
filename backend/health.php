<?php

header('Content-Type: application/json');

require_once __DIR__ . '/api/db.php';

try {
    $result = $pdo->query('SELECT 1')->fetchColumn();

    echo json_encode([
        'success' => true,
        'backend' => 'working',
        'database' => $result == 1 ? 'connected' : 'not connected'
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
    'success' => true,
    'backend' => 'working',
    'database' => $result == 1 ? 'connected' : 'not connected',

    // Temporary CORS diagnostics
    'auto_prepend_file' => ini_get('auto_prepend_file'),
    'frontend_origin' => getenv('FRONTEND_ORIGIN'),
    'received_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No origin received',
    'cors_headers' => headers_list()
]);