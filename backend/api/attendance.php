<?php
require_once __DIR__ . '/cors.php';
header('Content-Type: application/json');
session_start();
require_once 'db.php';

// Auth check
if (empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user = $_SESSION['user'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : (int)$user['id'];
    
    // Non-admin/staff can only view their own attendance
    if ($user['role'] === 'student' && $studentId !== (int)$user['id']) {
        $studentId = (int)$user['id'];
    }

    try {
        $stmt = $pdo->prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC, created_at DESC');
        $stmt->execute([$studentId]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $present = 0;
        $absent = 0;
        $late = 0;
        foreach ($records as $r) {
            if ($r['status'] === 'present') $present++;
            elseif ($r['status'] === 'absent') $absent++;
            elseif ($r['status'] === 'late') $late++;
        }

        echo json_encode([
            'success' => true,
            'data' => $records,
            'summary' => [
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'total_sessions' => count($records),
                'attendance_points' => ($present * 10) + ($late * 5)
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    // Only staff and admin can mark attendance
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Only teachers and admins can mark attendance.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $action = $input['action'] ?? 'log_single';

    try {
        if ($action === 'mark_batch' && !empty($input['students']) && is_array($input['students'])) {
            $subject = trim($input['subject'] ?? 'General');
            $date = !empty($input['date']) ? $input['date'] : date('Y-m-d');
            
            $stmt = $pdo->prepare('INSERT INTO attendance (student_id, subject, date, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)');
            // Note: If no unique key on (student_id, subject, date), regular INSERT or check
            $chk = $pdo->prepare('SELECT id FROM attendance WHERE student_id = ? AND subject = ? AND date = ?');
            $upd = $pdo->prepare('UPDATE attendance SET status = ? WHERE id = ?');
            $ins = $pdo->prepare('INSERT INTO attendance (student_id, subject, date, status) VALUES (?, ?, ?, ?)');

            $savedCount = 0;
            foreach ($input['students'] as $item) {
                $stId = (int)($item['student_id'] ?? 0);
                $stStatus = in_array($item['status'] ?? '', ['present', 'absent', 'late']) ? $item['status'] : 'present';
                if ($stId <= 0) continue;

                $chk->execute([$stId, $subject, $date]);
                $existing = $chk->fetch(PDO::FETCH_ASSOC);
                if ($existing) {
                    $upd->execute([$stStatus, $existing['id']]);
                } else {
                    $ins->execute([$stId, $subject, $date, $stStatus]);
                }
                $savedCount++;
            }

            echo json_encode(['success' => true, 'message' => "Attendance saved for {$savedCount} students.", 'count' => $savedCount]);
            exit;
        }

        // Single student attendance logging
        $studentId = (int)($input['student_id'] ?? 0);
        $subject = trim($input['subject'] ?? 'General');
        $date = !empty($input['date']) ? $input['date'] : date('Y-m-d');
        $status = in_array($input['status'] ?? '', ['present', 'absent', 'late']) ? $input['status'] : 'present';

        if ($studentId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Valid student ID is required.']);
            exit;
        }

        $chk = $pdo->prepare('SELECT id FROM attendance WHERE student_id = ? AND subject = ? AND date = ?');
        $chk->execute([$studentId, $subject, $date]);
        $existing = $chk->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $upd = $pdo->prepare('UPDATE attendance SET status = ? WHERE id = ?');
            $upd->execute([$status, $existing['id']]);
        } else {
            $ins = $pdo->prepare('INSERT INTO attendance (student_id, subject, date, status) VALUES (?, ?, ?, ?)');
            $ins->execute([$studentId, $subject, $date, $status]);
        }

        echo json_encode([
            'success' => true, 
            'message' => 'Attendance recorded successfully.',
            'status' => $status,
            'student_id' => $studentId,
            'points' => ($status === 'present' ? 10 : ($status === 'late' ? 5 : 0))
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}
