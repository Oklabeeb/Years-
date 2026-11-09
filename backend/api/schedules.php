<?php
require_once __DIR__ . '/cors.php';
header('Content-Type: application/json');
session_start();
require_once 'db.php';

// Ensure user is authenticated before returning schedule data
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user = $_SESSION['user'];
$role = $user['role'] ?? 'student';

// Default schedule repository
$schedules = [
    [
        'id' => 1,
        'subject' => 'Mathematics',
        'day' => 'Monday',
        'time' => '09:00 AM - 10:30 AM',
        'room' => 'Room 101'
    ],
    [
        'id' => 2,
        'subject' => 'English Language',
        'day' => 'Tuesday',
        'time' => '11:00 AM - 12:30 PM',
        'room' => 'Room 104'
    ]
];

echo json_encode([
    'success' => true,
    'data' => $schedules
]);
exit;