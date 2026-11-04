<?php
header('Content-Type: application/json');
session_start();
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $subject = $_GET['subject'] ?? '';
    
    if (!empty($subject)) {
        $stmt = $pdo->prepare('SELECT * FROM assignments WHERE subject = ? ORDER BY due_date ASC');
        $stmt->execute([$subject]);
    } else {
        $stmt = $pdo->query('SELECT * FROM assignments ORDER BY due_date ASC');
    }
    
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $action = $_GET['action'] ?? 'create';

    if ($action === 'create') {
        $input = json_decode(file_get_contents('php://input'), true);
        $subject = $input['subject'] ?? '';
        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        $dueDate = $input['due_date'] ?? '';
        $createdBy = $_SESSION['user']['id'] ?? 1;

        $stmt = $pdo->prepare('INSERT INTO assignments (subject, title, description, due_date, created_by) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$subject, $title, $description, $dueDate, $createdBy]);

        echo json_encode(['success' => true, 'message' => 'Assignment created.']);
        exit;
    }
}