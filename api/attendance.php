<?php
header('Content-Type: application/json');
session_start();
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $studentId = $_GET['student_id'] ?? ($_SESSION['user']['id'] ?? 0);
    
    $stmt = $pdo->prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC');
    $stmt->execute([$studentId]);
    
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $studentId = $input['student_id'] ?? 0;
    $subject = $input['subject'] ?? '';
    $date = $input['date'] ?? date('Y-m-d');
    $status = $input['status'] ?? 'present';

    $stmt = $pdo->prepare('INSERT INTO attendance (student_id, subject, date, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([$studentId, $subject, $date, $status]);

    echo json_encode(['success' => true, 'message' => 'Attendance logged.']);
    exit;
}<?php
header('Content-Type: application/json');
session_start();
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $studentId = $_GET['student_id'] ?? ($_SESSION['user']['id'] ?? 0);
    
    $stmt = $pdo->prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC');
    $stmt->execute([$studentId]);
    
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $studentId = $input['student_id'] ?? 0;
    $subject = $input['subject'] ?? '';
    $date = $input['date'] ?? date('Y-m-d');
    $status = $input['status'] ?? 'present';

    $stmt = $pdo->prepare('INSERT INTO attendance (student_id, subject, date, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([$studentId, $subject, $date, $status]);

    echo json_encode(['success' => true, 'message' => 'Attendance logged.']);
    exit;
}