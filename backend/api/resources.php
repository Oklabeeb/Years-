<?php
require_once __DIR__ . '/cors.php';
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../includes/aloc_engine.php';
require_once __DIR__ . '/../includes/paystack_engine.php';

$action = $_GET['action'] ?? '';

// Publicly readable academic session & term
if ($action === 'get_academic_session') {
    try {
        $stmt = $pdo->query("SELECT current_term, academic_session, term_start_date, term_end_date, updated_at FROM school_academic_session WHERE id = 1");
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$data) {
            $data = [
                'current_term' => 'Term 1',
                'academic_session' => '2024/2025',
                'term_start_date' => null,
                'term_end_date' => null,
                'updated_at' => date('Y-m-d H:i:s')
            ];
        }
        $data['display_label'] = trim(($data['current_term'] ?? 'Term 1') . ' · ' . ($data['academic_session'] ?? '2024/2025'));
        echo json_encode([
            'success' => true,
            'academic_session' => $data
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => true,
            'academic_session' => [
                'current_term' => 'Term 1',
                'academic_session' => '2024/2025',
                'display_label' => 'Term 1 · 2024/2025'
            ]
        ]);
    }
    exit;
}

// Check authentication session
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$user = $_SESSION['user'];

/**
 * Canonical subject normalization for consistent enrollment checking
 */
function getSubjectCanonical($name) {
    if (empty($name)) return '';
    $norm = strtolower(trim((string)$name));
    $norm = preg_replace('/[^a-z0-9]/', '', $norm);

    if ($norm === 'crs' || str_contains($norm, 'christianreligious')) return 'crs';
    if ($norm === 'irs' || str_contains($norm, 'islamicstudies') || str_contains($norm, 'islamicreligious')) return 'irs';
    if ($norm === 'math' || $norm === 'maths' || $norm === 'mathematics' || $norm === 'generalmathematics') return 'mathematics';
    if ($norm === 'furthermath' || $norm === 'furthermaths' || $norm === 'furthermathematics') return 'furthermathematics';
    if ($norm === 'english' || $norm === 'englishlanguage') return 'englishlanguage';
    if ($norm === 'civic' || $norm === 'civiceducation') return 'civiceducation';
    if (str_contains($norm, 'financialaccounting') || $norm === 'accounting') return 'accounting';
    if (str_contains($norm, 'literature')) return 'literature';
    if (str_contains($norm, 'nigerianlanguages') || $norm === 'hausa' || $norm === 'igbo' || $norm === 'yoruba') return 'nigerianlanguages';
    if (str_contains($norm, 'fashiondesign')) return 'fashiondesign';
    if (str_contains($norm, 'computerhardware')) return 'computerhardware';
    if (str_contains($norm, 'solarphotovoltaic')) return 'solarphotovoltaic';
    if (str_contains($norm, 'horticulture')) return 'horticulture';
    if (str_contains($norm, 'dataprocessing')) return 'dataprocessing';
    if (str_contains($norm, 'computerstudies')) return 'computerstudies';
    if (str_contains($norm, 'animalhusbandry')) return 'animalhusbandry';
    if (str_contains($norm, 'livestockfarming')) return 'livestockfarming';
    if (str_contains($norm, 'beautyandcosmetology')) return 'beautyandcosmetology';
    if (str_contains($norm, 'cateringcraft')) return 'cateringcraft';
    if (str_contains($norm, 'homemanagement')) return 'homemanagement';
    if (str_contains($norm, 'technicaldrawing')) return 'technicaldrawing';
    if (str_contains($norm, 'physicaleducation') || $norm === 'pe') return 'physicaleducation';
    if (str_contains($norm, 'healtheducation')) return 'healtheducation';
    if (str_contains($norm, 'foodsandnutrition') || str_contains($norm, 'foodnutrition')) return 'foodnutrition';

    return $norm;
}

function isEnrolledSubject($subjectName, $enrolledList) {
    if (empty($subjectName) || !is_array($enrolledList) || empty($enrolledList)) {
        return false;
    }
    $cTarget = getSubjectCanonical($subjectName);
    foreach ($enrolledList as $item) {
        if (getSubjectCanonical($item) === $cTarget) {
            return true;
        }
    }
    return false;
}

// Auto-migration & Schema Guarantee for submissions & class_schedules
try {
    $cols = $pdo->query("SHOW COLUMNS FROM submissions")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('score', $cols)) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN score VARCHAR(20) NULL AFTER content");
    }
    if (!in_array('grade', $cols)) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN grade VARCHAR(10) NULL AFTER score");
    }
    if (!in_array('remarks', $cols)) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN remarks TEXT NULL AFTER grade");
    }
    if (!in_array('graded_by', $cols)) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN graded_by INT NULL AFTER remarks");
    }
    if (!in_array('graded_at', $cols)) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN graded_at DATETIME NULL AFTER graded_by");
    }

    // Auto-migrate due_time for assignments if missing
    $aCols = $pdo->query("SHOW COLUMNS FROM assignments")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('due_time', $aCols)) {
        $pdo->exec("ALTER TABLE assignments ADD COLUMN due_time VARCHAR(20) NULL DEFAULT '23:59' AFTER due_date");
    }

    // Default Seed Assignments if table empty
    $aCount = $pdo->query("SELECT COUNT(*) FROM assignments")->fetchColumn();
    if ($aCount == 0) {
        $pdo->exec("INSERT INTO assignments (id, subject, title, description, file_path, due_date, created_by) VALUES
            (1, 'Physics', 'Physics Week 4: Newton Laws of Motion', 'Answer the calculations on page 42 of New School Physics. Show all working clearly.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 2),
            (2, 'Economics', 'Economics Week 3: Market Equilibrium Analysis', 'Calculate consumer and producer surplus given the demand and supply curves provided.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), 3),
            (3, 'Mathematics', 'Mathematics Week 4: Quadratic Equations & Graphs', 'Solve exercises 3A through 3D. Submit typed answers or upload scanned handwriting.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), 1)");
    }

    // Default Seed Submissions if table empty
    $sCount = $pdo->query("SELECT COUNT(*) FROM submissions")->fetchColumn();
    if ($sCount == 0) {
        $pdo->exec("INSERT INTO submissions (id, assignment_id, student_id, content, score, grade, remarks, graded_by, graded_at, submitted_at) VALUES
            (1, 1, 4, '1. Force = mass * acceleration = 12kg * 4m/s^2 = 48N.\n2. Momentum = mv = 1500kg * 20m/s = 30,000 kg m/s.\n3. Newton third law states action and reaction are equal and opposite.', '88/100', 'A', 'Excellent working! All derivations and units are accurately stated.', 2, NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
            (2, 1, 5, 'Problem 1: F = 48N. Problem 2: momentum = 30000. Working submitted in draft.', NULL, NULL, NULL, NULL, NULL, NOW()),
            (3, 2, 6, 'Equilibrium price is calculated at Pe = 25 Naira, and equilibrium quantity Qe = 120 units. Elasticity is relatively inelastic (Ed = 0.65).', '92/100', 'A+', 'Outstanding equilibrium curve analysis. Very clear presentation.', 3, NOW(), DATE_SUB(NOW(), INTERVAL 2 DAY))");
    }
} catch (Exception $e) {}

/* ==========================================================================
   1. DASHBOARD STATS & STUDENT DATA
   ========================================================================== */
if ($action === 'student_overview') {
    try {
        // Refresh student record from DB to ensure subjects are current
        $uStmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $uStmt->execute([$user['id']]);
        $freshUser = $uStmt->fetch(PDO::FETCH_ASSOC);
        if ($freshUser) {
            $user = array_merge($user, $freshUser);
            $_SESSION['user'] = $user;
        }

        $subjects = !empty($user['subjects']) ? json_decode($user['subjects'], true) : [];
        if (!is_array($subjects) || empty($subjects)) {
            $subjects = ["Mathematics", "English Language", "Civic Education"];
        }
        
        // Fetch student assignments
        $assignStmt = $pdo->prepare("SELECT a.*, u.name as teacher_name FROM assignments a JOIN users u ON a.created_by = u.id ORDER BY a.due_date ASC, a.created_at DESC");
        $assignStmt->execute();
        $rawAssignments = $assignStmt->fetchAll(PDO::FETCH_ASSOC);

        // Strict subject filtering: Only assignments matching the student's enrolled subjects
        $assignments = array_values(array_filter($rawAssignments, function($a) use ($subjects) {
            return isEnrolledSubject($a['subject'], $subjects);
        }));

        // Fetch student submissions (including file_path, content, score, grade, remarks)
        $submissions = [];
        try {
            $subStmt = $pdo->prepare("SELECT id, assignment_id, file_path, content, score, grade, remarks, graded_at, submitted_at FROM submissions WHERE student_id = ?");
            $subStmt->execute([$user['id']]);
            $submissions = $subStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $subErr) {
            // Ignore if submissions table or column needs update
        }

        // Auto-migrate class_schedules columns if needed
        try {
            $cols = $pdo->query("SHOW COLUMNS FROM class_schedules")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('day_of_week', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN day_of_week VARCHAR(20) NOT NULL DEFAULT 'Monday' AFTER id");
            }
            if (!in_array('teacher_id', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN teacher_id INT NULL AFTER room");
            }
            if (!in_array('teacher_name', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN teacher_name VARCHAR(100) NULL AFTER teacher_id");
            }
            if (!in_array('meet_link', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN meet_link VARCHAR(255) NULL AFTER teacher_name");
            }
            if (!in_array('notification_message', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN notification_message TEXT NULL AFTER meet_link");
            }
            if (!in_array('notification_date', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN notification_date DATE NULL AFTER notification_message");
            }
            if (!in_array('notification_sent_at', $cols)) {
                $pdo->exec("ALTER TABLE class_schedules ADD COLUMN notification_sent_at DATETIME NULL AFTER notification_date");
            }
            // Ensure department in class_schedules is restricted to Science, Commercial, Art
            $pdo->exec("UPDATE class_schedules SET department = 'Science' WHERE department = 'Vocational'");
        } catch (Exception $colErr) {}

        // Fetch class schedules
        $schedStmt = $pdo->prepare("SELECT * FROM class_schedules ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC");
        $schedStmt->execute();
        $rawSchedules = $schedStmt->fetchAll(PDO::FETCH_ASSOC);

        // Strict subject filtering: Only class schedules matching the student's enrolled subjects
        $schedules = array_values(array_filter($rawSchedules, function($s) use ($subjects) {
            return isEnrolledSubject($s['subject'], $subjects);
        }));

        // Current academic session & term
        $sessRow = $pdo->query("SELECT current_term, academic_session FROM school_academic_session WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
        $academicSession = $sessRow ?: ['current_term' => 'Term 1', 'academic_session' => '2024/2025'];
        $academicSession['display_label'] = trim(($academicSession['current_term'] ?? 'Term 1') . ' · ' . ($academicSession['academic_session'] ?? '2024/2025'));

        echo json_encode([
            'success'          => true,
            'subjects'         => $subjects,
            'assignments'      => $assignments,
            'submissions'      => $submissions,
            'schedules'        => $schedules,
            'academic_session' => $academicSession
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   2. LIST RESOURCES (FILTERABLE)
   ========================================================================== */
if ($action === 'list_resources') {
    $type    = trim($_GET['type'] ?? '');       // 'textbook' or 'past_question'
    $exam    = trim($_GET['exam'] ?? '');       // 'WAEC', 'JAMB', etc.
    $subject = trim($_GET['subject'] ?? '');    // e.g. 'Mathematics'
    $year    = trim($_GET['year'] ?? '');       // e.g. '2024'
    $search  = trim($_GET['search'] ?? '');     // keyword search
    
    try {
        $sql = "SELECT * FROM resources WHERE 1=1";
        $params = [];

        if (!empty($type)) {
            $sql .= " AND type = ?";
            $params[] = $type;
        }
        if (!empty($exam)) {
            $sql .= " AND exam = ?";
            $params[] = $exam;
        }
        if (!empty($subject)) {
            $sql .= " AND subject = ?";
            $params[] = $subject;
        }
        if (!empty($year)) {
            $sql .= " AND year = ?";
            $params[] = $year;
        }
        if (!empty($search)) {
            $sql .= " AND (title LIKE ? OR subject LIKE ? OR author LIKE ?)";
            $term = '%' . $search . '%';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $resources]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   3. GET SINGLE RESOURCE BY ID
   ========================================================================== */
if ($action === 'get_resource') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid resource ID required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM resources WHERE id = ?");
        $stmt->execute([$id]);
        $resource = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$resource) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Resource not found.']);
            exit;
        }

        echo json_encode(['success' => true, 'data' => $resource]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   4. ADD RESOURCE (STAFF / ADMIN ONLY)
   ========================================================================== */
if ($action === 'add_resource') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    // Support both FormData ($_POST) and JSON
    $input = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $type    = trim($input['type'] ?? '');
    $title   = trim($input['title'] ?? '');
    $subject = trim($input['subject'] ?? '');
    $author  = trim($input['author'] ?? '');
    $exam    = trim($input['exam'] ?? '');
    $year    = trim($input['year'] ?? '');
    $fileUrl = trim($input['file_url'] ?? '');

    if (empty($type) || !in_array($type, ['textbook', 'past_question'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Resource type must be "textbook" or "past_question".']);
        exit;
    }

    if (empty($title) || empty($subject)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title and Subject are required fields.']);
        exit;
    }

    // Handle File Upload or External URL
    $filePath = '';
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/resources/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $origName = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowedExts = ['pdf', 'doc', 'docx', 'epub', 'txt', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];

        if (!in_array($ext, $allowedExts)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file format. Allowed: ' . implode(', ', $allowedExts)]);
            exit;
        }

        $cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
        $newFileName = 'res_' . time() . '_' . substr(uniqid(), -6) . '_' . $cleanBase . '.' . $ext;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
            $filePath = 'uploads/resources/' . $newFileName;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
            exit;
        }
    } elseif (!empty($fileUrl)) {
        $filePath = $fileUrl;
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please upload a resource file or provide a valid file URL.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO resources (type, subject, title, author, exam, year, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $type,
            $subject,
            $title,
            !empty($author) ? $author : null,
            !empty($exam) ? $exam : null,
            !empty($year) ? $year : null,
            $filePath
        ]);

        $newId = (int)$pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => ($type === 'past_question' ? 'Past question paper' : 'Textbook') . ' added successfully.',
            'id' => $newId,
            'data' => [
                'id'        => $newId,
                'type'      => $type,
                'subject'   => $subject,
                'title'     => $title,
                'author'    => $author,
                'exam'      => $exam,
                'year'      => $year,
                'file_path' => $filePath
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   5. EDIT / UPDATE RESOURCE (STAFF / ADMIN ONLY)
   ========================================================================== */
if ($action === 'edit_resource') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    $input = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $id = (int)($input['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid resource ID required for edit.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM resources WHERE id = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Resource not found.']);
            exit;
        }

        $type    = trim($input['type'] ?? $existing['type']);
        $title   = trim($input['title'] ?? $existing['title']);
        $subject = trim($input['subject'] ?? $existing['subject']);
        $author  = isset($input['author']) ? trim($input['author']) : $existing['author'];
        $exam    = isset($input['exam']) ? trim($input['exam']) : $existing['exam'];
        $year    = isset($input['year']) ? trim($input['year']) : $existing['year'];
        $fileUrl = trim($input['file_url'] ?? '');

        if (empty($title) || empty($subject)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Title and Subject are required fields.']);
            exit;
        }

        $filePath = $existing['file_path'];

        // If a new file is uploaded
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/resources/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $origName = basename($_FILES['file']['name']);
            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $allowedExts = ['pdf', 'doc', 'docx', 'epub', 'txt', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];

            if (!in_array($ext, $allowedExts)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid file format. Allowed: ' . implode(', ', $allowedExts)]);
                exit;
            }

            $cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
            $newFileName = 'res_' . time() . '_' . substr(uniqid(), -6) . '_' . $cleanBase . '.' . $ext;
            $destPath = $uploadDir . $newFileName;

            if (move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
                // Safely remove previous local file if it was in uploads/resources/
                if (!empty($existing['file_path']) && str_starts_with($existing['file_path'], 'uploads/resources/')) {
                    $oldFilePath = __DIR__ . '/../' . $existing['file_path'];
                    if (file_exists($oldFilePath)) {
                        @unlink($oldFilePath);
                    }
                }
                $filePath = 'uploads/resources/' . $newFileName;
            }
        } elseif (!empty($fileUrl)) {
            $filePath = $fileUrl;
        }

        $upStmt = $pdo->prepare("UPDATE resources SET type = ?, subject = ?, title = ?, author = ?, exam = ?, year = ?, file_path = ? WHERE id = ?");
        $upStmt->execute([
            $type,
            $subject,
            $title,
            !empty($author) ? $author : null,
            !empty($exam) ? $exam : null,
            !empty($year) ? $year : null,
            $filePath,
            $id
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Resource updated successfully.',
            'data' => [
                'id'        => $id,
                'type'      => $type,
                'subject'   => $subject,
                'title'     => $title,
                'author'    => $author,
                'exam'      => $exam,
                'year'      => $year,
                'file_path' => $filePath
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   6. DELETE RESOURCE (STAFF / ADMIN ONLY)
   ========================================================================== */
if ($action === 'delete_resource') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    $input = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid resource ID required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM resources WHERE id = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Unlink local file
            if (!empty($existing['file_path']) && str_starts_with($existing['file_path'], 'uploads/resources/')) {
                $fileOnDisk = __DIR__ . '/../' . $existing['file_path'];
                if (file_exists($fileOnDisk)) {
                    @unlink($fileOnDisk);
                }
            }
            $delStmt = $pdo->prepare("DELETE FROM resources WHERE id = ?");
            $delStmt->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Resource deleted successfully.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   7. CREATE ASSIGNMENT (STAFF / ADMIN)
   ========================================================================== */
if ($action === 'create_assignment') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden.']);
        exit;
    }

    // Auto-migrate file_path column if missing
    try {
        $pdo->query("SELECT file_path FROM assignments LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE assignments ADD COLUMN file_path VARCHAR(255) NULL AFTER description");
    }

    // Accept either multipart/form-data ($_POST & $_FILES) or JSON
    $input = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $subject     = trim($input['subject'] ?? '');
    $title       = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $dueDate     = trim($input['due_date'] ?? '');
    $dueTime     = trim($input['due_time'] ?? '23:59');
    if (empty($dueTime)) $dueTime = '23:59';
    $filePath    = null;

    if (empty($subject) || empty($title) || empty($dueDate)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Subject, title, and deadline date are required.']);
        exit;
    }

    // Handle file upload if present
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/assignments/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }

        $origName = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowedExts = ['pdf', 'doc', 'docx', 'epub', 'txt', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'xlsx', 'zip'];

        if (!in_array($ext, $allowedExts)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file format. Allowed: ' . implode(', ', $allowedExts)]);
            exit;
        }

        $cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
        $newFileName = 'assign_' . time() . '_' . substr(uniqid(), -6) . '_' . $cleanBase . '.' . $ext;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
            $filePath = 'uploads/assignments/' . $newFileName;
        }
    }

    // Validation: staff must provide either a descriptive instruction, an uploaded file, or both
    if (empty($description) && empty($filePath)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide either descriptive instructions, upload an assignment file, or do both.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO assignments (subject, title, description, file_path, due_date, due_time, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $subject, 
            $title, 
            !empty($description) ? $description : null, 
            $filePath, 
            $dueDate, 
            $dueTime,
            $user['id']
        ]);

        echo json_encode([
            'success' => true, 
            'message' => 'Assignment published successfully with deadline.',
            'data' => [
                'subject'     => $subject,
                'title'       => $title,
                'description' => $description,
                'file_path'   => $filePath,
                'due_date'    => $dueDate,
                'due_time'    => $dueTime
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   8. SUBMIT ASSIGNMENT (STUDENTS)
   ========================================================================== */
if ($action === 'submit_assignment') {
    // Ensure file_path column exists in submissions table
    try {
        $pdo->query("SELECT file_path FROM submissions LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN file_path VARCHAR(255) NULL AFTER student_id");
    }

    // Support both FormData ($_POST & $_FILES) and JSON payload
    $input = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $assignmentId = (int)($input['assignment_id'] ?? 0);
    $content      = trim($input['content'] ?? '');
    $filePath     = null;

    if ($assignmentId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid assignment ID is required.']);
        exit;
    }

    // Verify assignment exists, student offers the subject, and deadline is not expired
    try {
        $assignStmt = $pdo->prepare("SELECT subject, title, due_date, due_time FROM assignments WHERE id = ?");
        $assignStmt->execute([$assignmentId]);
        $assign = $assignStmt->fetch(PDO::FETCH_ASSOC);

        if (!$assign) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Assignment not found.']);
            exit;
        }

        // Deadline check: reject if current timestamp > deadline timestamp
        $dueDate = $assign['due_date'] ?? '';
        $dueTime = !empty($assign['due_time']) ? $assign['due_time'] : '23:59';
        if (!empty($dueDate)) {
            $deadlineStr = trim($dueDate . ' ' . $dueTime);
            $deadlineTs = strtotime($deadlineStr);
            if ($deadlineTs !== false && time() > $deadlineTs) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Submission closed: The deadline for this assignment expired on ' . date('D, M j, Y \a\t g:i A', $deadlineTs) . '. Late submissions are not accepted.'
                ]);
                exit;
            }
        }

        $userSubjects = !empty($user['subjects']) ? json_decode($user['subjects'], true) : [];
        if (!empty($userSubjects) && !isEnrolledSubject($assign['subject'], $userSubjects)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'You are not enrolled in ' . $assign['subject'] . ' and cannot submit coursework for it.']);
            exit;
        }
    } catch (Exception $e) {
        // Proceed if table check fails
    }

    // Handle student file upload if present
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/submissions/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }

        $origName = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowedExts = ['pdf', 'doc', 'docx', 'epub', 'txt', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'xlsx', 'zip', 'csv'];

        if (!in_array($ext, $allowedExts)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file format. Allowed: ' . implode(', ', $allowedExts)]);
            exit;
        }

        $cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
        $newFileName = 'sub_' . time() . '_' . substr(uniqid(), -6) . '_' . $cleanBase . '.' . $ext;
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
            $filePath = 'uploads/submissions/' . $newFileName;
        }
    }

    // Student can type coursework, upload a file, or do both!
    if (empty($content) && empty($filePath)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide typed coursework answer, upload a file, or do both before submitting.']);
        exit;
    }

    try {
        // Check if student already submitted to update or insert
        $checkStmt = $pdo->prepare("SELECT id, file_path FROM submissions WHERE assignment_id = ? AND student_id = ?");
        $checkStmt->execute([$assignmentId, $user['id']]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $finalFile = !empty($filePath) ? $filePath : $existing['file_path'];
            $upStmt = $pdo->prepare("UPDATE submissions SET content = ?, file_path = ?, submitted_at = NOW() WHERE id = ?");
            $upStmt->execute([!empty($content) ? $content : null, $finalFile, $existing['id']]);
        } else {
            $insStmt = $pdo->prepare("INSERT INTO submissions (assignment_id, student_id, content, file_path) VALUES (?, ?, ?, ?)");
            $insStmt->execute([$assignmentId, $user['id'], !empty($content) ? $content : null, $filePath]);
        }

        echo json_encode([
            'success'   => true, 
            'message'   => 'Coursework submitted successfully!',
            'content'   => $content,
            'file_path' => $filePath
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   9. LIST SUBMISSIONS (STAFF & ADMIN)
   ========================================================================== */
if ($action === 'list_submissions') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    try {
        $sql = "SELECT 
                    s.id as submission_id,
                    s.assignment_id,
                    s.student_id,
                    s.file_path as submission_file,
                    s.content as submission_content,
                    s.score,
                    s.grade,
                    s.remarks,
                    s.graded_by,
                    s.graded_at,
                    s.submitted_at,
                    a.title as assignment_title,
                    a.subject,
                    a.due_date,
                    a.due_time,
                    a.file_path as assignment_file,
                    a.description as assignment_desc,
                    u.name as student_name,
                    u.email as student_email,
                    u.program as student_program,
                    u.department as student_department,
                    u.subjects as student_subjects,
                    grader.name as grader_name
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                JOIN users u ON s.student_id = u.id
                LEFT JOIN users grader ON s.graded_by = grader.id
                WHERE 1=1";
        $params = [];
        $subjectFilter = trim($_GET['subject'] ?? '');

        // Scoping for Staff & Admin:
        if ($user['role'] === 'staff') {
            $freshStmt = $pdo->prepare("SELECT department, subjects FROM users WHERE id = ?");
            $freshStmt->execute([$user['id']]);
            $fresh = $freshStmt->fetch(PDO::FETCH_ASSOC);
            $rawSubs = !empty($fresh['subjects']) ? $fresh['subjects'] : ($user['subjects'] ?? '');

            $staffSubjects = !empty($rawSubs) ? json_decode($rawSubs, true) : [];
            if (!is_array($staffSubjects) && !empty($rawSubs)) {
                $staffSubjects = [$rawSubs];
            }
            if (empty($staffSubjects)) {
                $fallbackSub = (($fresh['department'] ?? '') === 'Commercial') ? 'Economics' : 'Physics';
                $staffSubjects = [$fallbackSub];
            }

            if ($subjectFilter === 'my_course') {
                $placeholders = implode(',', array_fill(0, count($staffSubjects), '?'));
                $sql .= " AND (a.created_by = ? OR a.subject IN ($placeholders))";
                $params[] = $user['id'];
                foreach ($staffSubjects as $sub) {
                    $params[] = $sub;
                }
            } elseif (!empty($subjectFilter) && $subjectFilter !== 'all') {
                $sql .= " AND a.subject = ?";
                $params[] = $subjectFilter;
            }
        } else {
            // Admin: filter by subject if provided
            if (!empty($subjectFilter) && $subjectFilter !== 'all') {
                $sql .= " AND a.subject = ?";
                $params[] = $subjectFilter;
            }
        }

        // Optional filters
        $assignmentId = (int)($_GET['assignment_id'] ?? 0);
        if ($assignmentId > 0) {
            $sql .= " AND s.assignment_id = ?";
            $params[] = $assignmentId;
        }

        $statusFilter = trim($_GET['status'] ?? '');
        if ($statusFilter === 'graded') {
            $sql .= " AND s.score IS NOT NULL AND s.score != ''";
        } else if ($statusFilter === 'pending') {
            $sql .= " AND (s.score IS NULL OR s.score = '')";
        }

        $sql .= " ORDER BY s.submitted_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$r) {
            $r['formatted_student_id'] = 'STU-' . str_pad($r['student_id'], 4, '0', STR_PAD_LEFT);
            $r['status'] = (!empty($r['score']) || !empty($r['grade'])) ? 'graded' : 'pending';
        }
        unset($r);

        echo json_encode([
            'success' => true,
            'total'   => count($rows),
            'data'    => $rows
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   10. GRADE SUBMISSION (STAFF & ADMIN)
   ========================================================================== */
if ($action === 'grade_submission') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    $input = !empty($_POST) ? $_POST : json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $submissionId = (int)($input['submission_id'] ?? 0);
    $score        = trim((string)($input['score'] ?? ''));
    $grade        = trim((string)($input['grade'] ?? ''));
    $remarks      = trim((string)($input['remarks'] ?? ''));

    if ($submissionId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid submission ID required.']);
        exit;
    }

    if (empty($score) && empty($remarks)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide a score or remarks for the student.']);
        exit;
    }

    // Auto-calculate letter grade if empty and score is numeric
    if (empty($grade) && is_numeric(str_replace(['%', '/100'], '', $score))) {
        $num = (float)str_replace(['%', '/100'], '', $score);
        if ($num >= 75) $grade = 'A';
        elseif ($num >= 65) $grade = 'B';
        elseif ($num >= 50) $grade = 'C';
        elseif ($num >= 45) $grade = 'D';
        elseif ($num >= 40) $grade = 'E';
        else $grade = 'F';
    }

    try {
        $stmt = $pdo->prepare("UPDATE submissions SET score = ?, grade = ?, remarks = ?, graded_by = ?, graded_at = NOW() WHERE id = ?");
        $stmt->execute([
            !empty($score) ? $score : null,
            !empty($grade) ? $grade : null,
            !empty($remarks) ? $remarks : null,
            $user['id'],
            $submissionId
        ]);

        echo json_encode([
            'success'       => true,
            'message'       => 'Student submission graded and remarks saved successfully!',
            'submission_id' => $submissionId,
            'score'         => $score,
            'grade'         => $grade,
            'remarks'       => $remarks,
            'graded_by'     => $user['id'],
            'grader_name'   => $user['name'] ?? 'Teacher'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   11. GENERAL SCORE SHEET (STAFF & ADMIN)
   ========================================================================== */
if ($action === 'general_scoresheet') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    try {
        $subjectFilter    = trim($_GET['subject'] ?? '');
        $assignmentFilter = (int)($_GET['assignment_id'] ?? 0);
        $programFilter    = trim($_GET['program'] ?? '');
        $deptFilter       = trim($_GET['department'] ?? '');

        // 1. Fetch Students
        $stSql = "SELECT id, name, email, role, program, department, subjects FROM users WHERE role = 'student' ORDER BY name ASC";
        $students = $pdo->query($stSql)->fetchAll(PDO::FETCH_ASSOC);

        // 2. Fetch Assignments
        $asSql = "SELECT a.*, u.name as teacher_name FROM assignments a JOIN users u ON a.created_by = u.id WHERE 1=1";
        $asParams = [];

        if ($user['role'] === 'staff') {
            $freshStmt = $pdo->prepare("SELECT department, subjects FROM users WHERE id = ?");
            $freshStmt->execute([$user['id']]);
            $fresh = $freshStmt->fetch(PDO::FETCH_ASSOC);
            $rawSubs = !empty($fresh['subjects']) ? $fresh['subjects'] : ($user['subjects'] ?? '');

            $staffSubjects = !empty($rawSubs) ? json_decode($rawSubs, true) : [];
            if (!is_array($staffSubjects) && !empty($rawSubs)) {
                $staffSubjects = [$rawSubs];
            }
            if (empty($staffSubjects)) {
                $fallbackSub = (($fresh['department'] ?? '') === 'Commercial') ? 'Economics' : 'Physics';
                $staffSubjects = [$fallbackSub];
            }

            if ($subjectFilter === 'my_course') {
                $placeholders = implode(',', array_fill(0, count($staffSubjects), '?'));
                $asSql .= " AND (a.created_by = ? OR a.subject IN ($placeholders))";
                $asParams[] = $user['id'];
                foreach ($staffSubjects as $sub) $asParams[] = $sub;
            } elseif (!empty($subjectFilter) && $subjectFilter !== 'all') {
                $asSql .= " AND a.subject = ?";
                $asParams[] = $subjectFilter;
            }
        } elseif (!empty($subjectFilter) && $subjectFilter !== 'all') {
            $asSql .= " AND a.subject = ?";
            $asParams[] = $subjectFilter;
        }
        $asSql .= " ORDER BY a.due_date DESC, a.created_at DESC";
        $asStmt = $pdo->prepare($asSql);
        $asStmt->execute($asParams);
        $assignments = $asStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Fetch Submissions
        $subSql = "SELECT s.*, grader.name as grader_name 
                   FROM submissions s 
                   LEFT JOIN users grader ON s.graded_by = grader.id";
        $allSubmissions = $pdo->query($subSql)->fetchAll(PDO::FETCH_ASSOC);

        // Map submissions by assignment_id + student_id
        $subMap = [];
        foreach ($allSubmissions as $sub) {
            $key = $sub['assignment_id'] . '_' . $sub['student_id'];
            $subMap[$key] = $sub;
        }

        // Build score sheet rows
        $scoresheet = [];
        $totalScores = 0;
        $numericScoreSum = 0;
        $gradedCount = 0;
        $submittedCount = 0;

        foreach ($assignments as $a) {
            // Apply assignment filter if given
            if ($assignmentFilter > 0 && (int)$a['id'] !== $assignmentFilter) {
                continue;
            }
            if (!empty($subjectFilter) && $subjectFilter !== 'all' && $subjectFilter !== 'my_course' && strcasecmp($a['subject'], $subjectFilter) !== 0) {
                continue;
            }

            foreach ($students as $st) {
                // Check if student offers this subject
                $stSubjects = !empty($st['subjects']) ? json_decode($st['subjects'], true) : [];
                if (!is_array($stSubjects)) $stSubjects = [];
                if (!isEnrolledSubject($a['subject'], $stSubjects)) {
                    continue; // Student does not offer this subject
                }

                // Apply program/department filters
                if (!empty($programFilter) && $programFilter !== 'all' && strcasecmp($st['program'] ?? '', $programFilter) !== 0) {
                    continue;
                }
                if (!empty($deptFilter) && $deptFilter !== 'all' && strcasecmp($st['department'] ?? '', $deptFilter) !== 0) {
                    continue;
                }

                $key = $a['id'] . '_' . $st['id'];
                $sub = $subMap[$key] ?? null;

                $hasSubmitted = !empty($sub);
                $isGraded = $hasSubmitted && (!empty($sub['score']) || !empty($sub['grade']));

                if ($hasSubmitted) $submittedCount++;
                if ($isGraded) {
                    $gradedCount++;
                    // Try to extract numeric score
                    $cleanScore = preg_replace('/[^0-9.]/', '', (string)$sub['score']);
                    if (is_numeric($cleanScore)) {
                        $numericScoreSum += (float)$cleanScore;
                        $totalScores++;
                    }
                }

                $status = $isGraded ? 'Graded' : ($hasSubmitted ? 'Pending Review' : 'Not Submitted');
                $formattedStudentId = 'STU-' . str_pad($st['id'], 4, '0', STR_PAD_LEFT);

                $scoresheet[] = [
                    'student_id'           => $st['id'],
                    'formatted_student_id' => $formattedStudentId,
                    'student_name'         => $st['name'],
                    'student_email'        => $st['email'],
                    'program'              => $st['program'] ?? 'WAEC',
                    'department'           => $st['department'] ?? 'Science',
                    'assignment_id'        => $a['id'],
                    'assignment_title'     => $a['title'],
                    'subject'              => $a['subject'],
                    'due_date'             => $a['due_date'],
                    'due_time'             => $a['due_time'] ?? '23:59',
                    'submission_id'        => $sub ? $sub['id'] : null,
                    'submission_file'      => $sub ? $sub['file_path'] : null,
                    'submission_content'   => $sub ? $sub['content'] : null,
                    'submitted_at'         => $sub ? $sub['submitted_at'] : null,
                    'score'                => $sub ? $sub['score'] : null,
                    'grade'                => $sub ? $sub['grade'] : null,
                    'remarks'              => $sub ? $sub['remarks'] : null,
                    'graded_by'            => $sub ? $sub['graded_by'] : null,
                    'grader_name'          => $sub ? ($sub['grader_name'] ?? null) : null,
                    'graded_at'            => $sub ? $sub['graded_at'] : null,
                    'status'               => $status
                ];
            }
        }

        $avgScore = ($totalScores > 0) ? round($numericScoreSum / $totalScores, 1) : 0;

        // Unique filter options
        $availableSubjects = array_values(array_unique(array_column($assignments, 'subject')));
        sort($availableSubjects);

        $availableAssignments = array_map(function($a) {
            return ['id' => $a['id'], 'title' => $a['title'], 'subject' => $a['subject']];
        }, $assignments);

        echo json_encode([
            'success'     => true,
            'scoresheet'  => $scoresheet,
            'summary'     => [
                'total_records'   => count($scoresheet),
                'total_submitted' => $submittedCount,
                'total_graded'    => $gradedCount,
                'pending_grading' => ($submittedCount - $gradedCount),
                'average_score'   => $avgScore . '%'
            ],
            'subjects'    => $availableSubjects,
            'assignments' => $availableAssignments
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   11B. STUDENT LEADERBOARD & ACADEMIC RANKINGS
   Calculates total points from:
   - Assignments (category = 'assignment')
   - Classwork (category = 'classwork')
   - Tests (category = 'test')
   - Exams (category = 'exam')
   - Attendance (status = 'present' -> 10 pts, 'late' -> 5 pts)
   Ranks all students and returns the logged-in student's standing,
   JAMB and WAEC are segregated:
   - Students only see and are ranked against their own track (JAMB or WAEC).
   - Staff and Admin can view both tracks distinctly.
   ========================================================================== */
if ($action === 'get_leaderboard') {
    try {
        $deptFilter = trim($_GET['department'] ?? 'all');
        $progFilter = trim($_GET['program'] ?? '');
        $userRole   = $user['role'] ?? 'student';

        // 1. If student, strictly enforce their enrolled program track
        $studentProgram = null;
        if ($userRole === 'student') {
            $uStmt = $pdo->prepare("SELECT program, department FROM users WHERE id = ?");
            $uStmt->execute([$user['id']]);
            $uData = $uStmt->fetch(PDO::FETCH_ASSOC);
            $rawProg = !empty($uData['program']) ? $uData['program'] : ($user['program'] ?? 'WAEC');
            $studentProgram = (strtoupper(trim($rawProg)) === 'JAMB') ? 'JAMB' : 'WAEC';
            $progFilter = $studentProgram;
        }

        // 2. Fetch students
        $stSql = "SELECT id, name, email, role, program, department, subjects FROM users WHERE role = 'student'";
        $stParams = [];

        if ($userRole === 'student') {
            $stSql .= " AND UPPER(COALESCE(program, 'WAEC')) = ?";
            $stParams[] = $studentProgram;
        }

        if (!empty($deptFilter) && $deptFilter !== 'all') {
            $stSql .= " AND department = ?";
            $stParams[] = $deptFilter;
        }

        $stSql .= " ORDER BY name ASC";
        $stStmt = $pdo->prepare($stSql);
        $stStmt->execute($stParams);
        $students = $stStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Fetch all graded submissions with assignment info & category
        try {
            $cols = $pdo->query("SHOW COLUMNS FROM assignments")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('category', $cols)) {
                $pdo->exec("ALTER TABLE assignments ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'assignment' AFTER subject");
            }
        } catch (Exception $e) {}

        $subSql = "SELECT s.id, s.assignment_id, s.student_id, s.score, s.grade, a.subject, a.title, 
                          COALESCE(a.category, 'assignment') as category
                   FROM submissions s
                   JOIN assignments a ON s.assignment_id = a.id
                   WHERE s.score IS NOT NULL AND s.score != ''";
        $submissions = $pdo->query($subSql)->fetchAll(PDO::FETCH_ASSOC);

        // 4. Fetch all attendance logs
        $attSql = "SELECT student_id, subject, date, status FROM attendance";
        $attendanceLogs = [];
        try {
            $attendanceLogs = $pdo->query($attSql)->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $attErr) {}

        // Helper to parse numeric scores
        $parseScore = function($scoreStr) {
            $s = trim((string)$scoreStr);
            if (empty($s)) return 0;
            if (preg_match('/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/', $s, $m)) {
                $num = (float)$m[1];
                $den = (float)$m[2];
                return $den > 0 ? round(($num / $den) * 100, 1) : 0;
            }
            $clean = preg_replace('/[^0-9.]/', '', $s);
            return is_numeric($clean) ? (float)$clean : 0;
        };

        // Group submissions by student
        $studentSubmissions = [];
        foreach ($submissions as $s) {
            $studentSubmissions[$s['student_id']][] = $s;
        }

        // Group attendance by student
        $studentAttendance = [];
        foreach ($attendanceLogs as $a) {
            $studentAttendance[$a['student_id']][] = $a;
        }

        // Reusable ranking function for a given list of students
        $computeRankings = function($stList) use ($studentSubmissions, $studentAttendance, $parseScore) {
            $ranked = [];
            foreach ($stList as $st) {
                $sId = (int)$st['id'];
                $stSubs = $studentSubmissions[$sId] ?? [];
                $stAtt  = $studentAttendance[$sId] ?? [];

                $asgnPoints = 0;
                $clswPoints = 0;
                $testPoints = 0;
                $examPoints = 0;
                $asgnCount = 0;
                $clswCount = 0;
                $testCount = 0;
                $examCount = 0;
                $totalCourseworkScore = 0;
                $totalCourseworkCount = 0;

                foreach ($stSubs as $sub) {
                    $numScore = $parseScore($sub['score']);
                    $cat = strtolower(trim($sub['category'] ?? 'assignment'));

                    if ($cat === 'assignment') {
                        if (stripos($sub['title'], 'test') !== false || stripos($sub['title'], 'quiz') !== false) {
                            $cat = 'test';
                        } elseif (stripos($sub['title'], 'exam') !== false) {
                            $cat = 'exam';
                        } elseif (stripos($sub['title'], 'classwork') !== false || stripos($sub['title'], 'worksheet') !== false) {
                            $cat = 'classwork';
                        }
                    }

                    if ($cat === 'classwork') {
                        $clswPoints += $numScore;
                        $clswCount++;
                    } elseif ($cat === 'test') {
                        $testPoints += $numScore;
                        $testCount++;
                    } elseif ($cat === 'exam') {
                        $examPoints += $numScore;
                        $examCount++;
                    } else {
                        $asgnPoints += $numScore;
                        $asgnCount++;
                    }

                    $totalCourseworkScore += $numScore;
                    $totalCourseworkCount++;
                }

                // Attendance points: Present = 10 pts, Late = 5 pts, Absent = 0 pts
                $attPoints = 0;
                $presentDays = 0;
                $lateDays = 0;
                $absentDays = 0;
                foreach ($stAtt as $att) {
                    if ($att['status'] === 'present') {
                        $attPoints += 10;
                        $presentDays++;
                    } elseif ($att['status'] === 'late') {
                        $attPoints += 5;
                        $lateDays++;
                    } elseif ($att['status'] === 'absent') {
                        $absentDays++;
                    }
                }

                $totalPoints = round($asgnPoints + $clswPoints + $testPoints + $examPoints + $attPoints, 1);
                $avgScore = ($totalCourseworkCount > 0) ? round($totalCourseworkScore / $totalCourseworkCount, 1) : 0;
                $prog = (strtoupper(trim($st['program'] ?? 'WAEC')) === 'JAMB') ? 'JAMB' : 'WAEC';
                $formattedId = 'STU-' . str_pad($st['id'], 4, '0', STR_PAD_LEFT);

                $ranked[] = [
                    'id'                     => $sId,
                    'formatted_id'           => $formattedId,
                    'name'                   => $st['name'],
                    'email'                  => $st['email'],
                    'department'             => $st['department'] ?? 'Science',
                    'program'                => $prog,
                    'total_points'           => $totalPoints,
                    'average_score'          => $avgScore,
                    'total_coursework_count' => $totalCourseworkCount,
                    'breakdown'              => [
                        'assignment' => round($asgnPoints, 1),
                        'classwork'  => round($clswPoints, 1),
                        'test'       => round($testPoints, 1),
                        'exam'       => round($examPoints, 1),
                        'attendance' => $attPoints
                    ],
                    'counts'                 => [
                        'assignment' => $asgnCount,
                        'classwork'  => $clswCount,
                        'test'       => $testCount,
                        'exam'       => $examCount,
                        'attendance' => count($stAtt),
                        'present'    => $presentDays,
                        'late'       => $lateDays,
                        'absent'     => $absentDays
                    ]
                ];
            }

            // Sort: total_points DESC, average_score DESC, name ASC
            usort($ranked, function($a, $b) {
                if ($b['total_points'] != $a['total_points']) {
                    return ($b['total_points'] <=> $a['total_points']);
                }
                if ($b['average_score'] != $a['average_score']) {
                    return ($b['average_score'] <=> $a['average_score']);
                }
                return strcmp($a['name'], $b['name']);
            });

            // Assign ranks within this cohort
            $currentRank = 1;
            $tot = count($ranked);
            for ($i = 0; $i < $tot; $i++) {
                $ranked[$i]['rank'] = $currentRank++;
                $ranked[$i]['is_top_three'] = ($ranked[$i]['rank'] <= 3);

                if ($ranked[$i]['rank'] === 1) {
                    $ranked[$i]['tier'] = '🥇 1st Place (Gold Medalist)';
                } elseif ($ranked[$i]['rank'] === 2) {
                    $ranked[$i]['tier'] = '🥈 2nd Place (Silver Medalist)';
                } elseif ($ranked[$i]['rank'] === 3) {
                    $ranked[$i]['tier'] = '🥉 3rd Place (Bronze Medalist)';
                } elseif ($ranked[$i]['rank'] <= ceil($tot * 0.25)) {
                    $ranked[$i]['tier'] = '🌟 Top 25% High Achiever';
                } elseif ($ranked[$i]['rank'] <= ceil($tot * 0.50)) {
                    $ranked[$i]['tier'] = '⭐ Top Half (Good Standing)';
                } else {
                    $ranked[$i]['tier'] = '📘 Active Participant';
                }
            }

            return $ranked;
        };

        if ($userRole === 'student') {
            // Student ONLY gets their own program
            $ranked = $computeRankings($students);
            $totalStudents = count($ranked);

            $myStanding = null;
            $currentUserId = (int)$user['id'];
            $myIdx = -1;
            for ($i = 0; $i < $totalStudents; $i++) {
                if ($ranked[$i]['id'] === $currentUserId) {
                    $myIdx = $i;
                    break;
                }
            }

            if ($myIdx !== -1) {
                $me = $ranked[$myIdx];
                $before = ($myIdx > 0) ? $ranked[$myIdx - 1] : null;
                $after = ($myIdx < $totalStudents - 1) ? $ranked[$myIdx + 1] : null;

                $myStanding = [
                    'id'                 => $me['id'],
                    'name'               => $me['name'],
                    'formatted_id'       => $me['formatted_id'],
                    'department'         => $me['department'],
                    'program'            => $me['program'],
                    'rank'               => $me['rank'],
                    'total_students'     => $totalStudents,
                    'total_points'       => $me['total_points'],
                    'average_score'      => $me['average_score'],
                    'tier'               => $me['tier'],
                    'breakdown'          => $me['breakdown'],
                    'counts'             => $me['counts'],
                    'is_first'           => ($myIdx === 0),
                    'is_last'            => ($myIdx === $totalStudents - 1),
                    'immediately_before' => $before ? [
                        'id'           => $before['id'],
                        'name'         => $before['name'],
                        'formatted_id' => $before['formatted_id'],
                        'rank'         => $before['rank'],
                        'department'   => $before['department'],
                        'program'      => $before['program'],
                        'total_points' => $before['total_points'],
                        'points_ahead' => round($before['total_points'] - $me['total_points'], 1)
                    ] : null,
                    'immediately_after'  => $after ? [
                        'id'            => $after['id'],
                        'name'          => $after['name'],
                        'formatted_id'  => $after['formatted_id'],
                        'rank'          => $after['rank'],
                        'department'    => $after['department'],
                        'program'       => $after['program'],
                        'total_points'  => $after['total_points'],
                        'points_behind' => round($me['total_points'] - $after['total_points'], 1)
                    ] : null
                ];
            }

            echo json_encode([
                'success'        => true,
                'program'        => $studentProgram,
                'leaderboard'    => $ranked,
                'my_standing'    => $myStanding,
                'total_students' => $totalStudents,
                'filters'        => [
                    'department' => $deptFilter,
                    'program'    => $studentProgram
                ]
            ]);
            exit;
        }

        // Staff and Admin: Segregated calculations for WAEC and JAMB
        $waecStudents = [];
        $jambStudents = [];
        foreach ($students as $st) {
            $p = strtoupper(trim($st['program'] ?? 'WAEC'));
            if ($p === 'JAMB') {
                $jambStudents[] = $st;
            } else {
                $waecStudents[] = $st;
            }
        }

        $waecRanked = $computeRankings($waecStudents);
        $jambRanked = $computeRankings($jambStudents);

        $activeProg = (strtoupper($progFilter) === 'JAMB') ? 'JAMB' : 'WAEC';
        $activeList = ($activeProg === 'JAMB') ? $jambRanked : $waecRanked;

        echo json_encode([
            'success'          => true,
            'active_program'   => $activeProg,
            'program'          => $activeProg,
            'leaderboard'      => $activeList,
            'waec_leaderboard' => $waecRanked,
            'jamb_leaderboard' => $jambRanked,
            'total_waec'       => count($waecRanked),
            'total_jamb'       => count($jambRanked),
            'total_students'   => count($activeList),
            'filters'          => [
                'department' => $deptFilter,
                'program'    => $activeProg
            ]
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   FEES & BILLING ACTIONS
   ========================================================================== */

// 1. GET STUDENT FEE INFO (Accessible by Student & Admin; BLOCKED for Staff)
if ($action === 'get_student_fee_info') {
    if ($user['role'] === 'staff') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Staff members are restricted from accessing fee records.']);
        exit;
    }

    try {
        $studentId = (int)$user['id'];
        $userProg = $user['program'] ?? 'WAEC';

        // Fetch active fee matching student's programme or 'All'
        $feeStmt = $pdo->prepare("SELECT * FROM fees WHERE status = 'active' ORDER BY CASE WHEN program = ? THEN 1 WHEN program = 'All' THEN 2 ELSE 3 END, id ASC LIMIT 1");
        $feeStmt->execute([$userProg]);
        $fee = $feeStmt->fetch(PDO::FETCH_ASSOC);

        if (!$fee) {
            $fee = [
                'id' => 1,
                'title' => 'General School Tuition & Digital Learning Access Fee',
                'description' => 'Full access to online classes, Google Meet links, past questions, textbooks, and teacher graded assignments.',
                'base_monthly_fee' => 20000.00,
                'program' => 'All',
                'status' => 'active'
            ];
        }

        $baseMonthly = (float)$fee['base_monthly_fee'];
        // Monthly payment: 10% OFF discount
        $discountPercent = 10;
        $monthlySavings = round($baseMonthly * 0.10, 2);
        $monthlyFee = round($baseMonthly * 0.90, 2);
        // Weekly payment: 1 month fee splitted into 4 weeks without 10% discount
        $weeklyFee = round($baseMonthly / 4, 2);

        // Fetch student's current payment info
        $stStmt = $pdo->prepare("SELECT id, name, email, role, program, department, is_paid, paid_until, payment_plan FROM users WHERE id = ?");
        $stStmt->execute([$studentId]);
        $stInfo = $stStmt->fetch(PDO::FETCH_ASSOC);

        $now = new DateTime();
        $isPaidActive = false;
        $daysLeft = 0;
        $paidUntilFormatted = null;

        if (!empty($stInfo['paid_until'])) {
            $expiry = new DateTime($stInfo['paid_until']);
            $paidUntilFormatted = $expiry->format('d M Y, h:i A');
            if ($expiry > $now) {
                $isPaidActive = true;
                $diff = $now->diff($expiry);
                $daysLeft = (int)$diff->format('%a') + 1;
            }
        } else if (!empty($stInfo['is_paid'])) {
            $isPaidActive = true;
            $daysLeft = 30;
        }

        // Fetch student recent payment transactions
        $payStmt = $pdo->prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 5");
        $payStmt->execute([$studentId]);
        $payments = $payStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'fee' => [
                'id' => (int)$fee['id'],
                'title' => $fee['title'],
                'description' => $fee['description'],
                'base_monthly_fee' => $baseMonthly,
                'monthly_discount_percent' => $discountPercent,
                'monthly_savings' => $monthlySavings,
                'monthly_fee' => $monthlyFee,
                'weekly_fee' => $weeklyFee,
                'program' => $fee['program']
            ],
            'student_status' => [
                'student_id' => $studentId,
                'name' => $stInfo['name'],
                'email' => $stInfo['email'],
                'program' => $stInfo['program'] ?? 'WAEC',
                'department' => $stInfo['department'] ?? 'Science',
                'is_paid' => $isPaidActive ? 1 : 0,
                'plan' => $stInfo['payment_plan'] ?? null,
                'paid_until' => $stInfo['paid_until'] ?? null,
                'paid_until_formatted' => $paidUntilFormatted,
                'days_left' => $daysLeft
            ],
            'recent_payments' => $payments
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 2. GET ADMIN FEES & STUDENT BILLING ROSTER (Admin Only)
if ($action === 'get_admin_fees') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can manage school fees.']);
        exit;
    }

    try {
        // 1. Fetch fees
        $feesStmt = $pdo->query("SELECT * FROM fees ORDER BY id ASC");
        $rawFees = $feesStmt->fetchAll(PDO::FETCH_ASSOC);
        $fees = array_map(function($f) {
            $base = (float)$f['base_monthly_fee'];
            return [
                'id' => (int)$f['id'],
                'title' => $f['title'],
                'description' => $f['description'],
                'base_monthly_fee' => $base,
                'monthly_fee' => round($base * 0.90, 2),
                'monthly_savings' => round($base * 0.10, 2),
                'weekly_fee' => round($base / 4, 2),
                'program' => $f['program'],
                'status' => $f['status'],
                'created_at' => $f['created_at']
            ];
        }, $rawFees);

        // 2. Fetch all registered students and their payment statuses
        $studentsStmt = $pdo->query("SELECT id, name, email, program, department, is_paid, paid_until, payment_plan, created_at FROM users WHERE role = 'student' ORDER BY id ASC");
        $rawStudents = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

        $now = new DateTime();
        $paidCount = 0;
        $unpaidCount = 0;
        $monthlySubCount = 0;
        $weeklySubCount = 0;

        $studentRoster = array_map(function($s) use ($now, &$paidCount, &$unpaidCount, &$monthlySubCount, &$weeklySubCount) {
            $isPaidActive = false;
            $statusLabel = 'Unpaid';
            $daysLeft = 0;
            $paidUntilFormatted = null;

            if (!empty($s['paid_until'])) {
                $expiry = new DateTime($s['paid_until']);
                $paidUntilFormatted = $expiry->format('d M Y, h:i A');
                if ($expiry > $now) {
                    $isPaidActive = true;
                    $diff = $now->diff($expiry);
                    $daysLeft = (int)$diff->format('%a') + 1;
                    $plan = strtolower($s['payment_plan'] ?? 'monthly');
                    $statusLabel = ($plan === 'weekly') ? 'Paid (Weekly)' : 'Paid (Monthly)';
                    if ($plan === 'weekly') $weeklySubCount++;
                    else $monthlySubCount++;
                } else {
                    $statusLabel = 'Expired';
                }
            } else if (!empty($s['is_paid'])) {
                $isPaidActive = true;
                $statusLabel = 'Paid';
                $monthlySubCount++;
            }

            if ($isPaidActive) {
                $paidCount++;
            } else {
                $unpaidCount++;
            }

            return [
                'id' => (int)$s['id'],
                'formatted_id' => 'STU-' . str_pad($s['id'], 4, '0', STR_PAD_LEFT),
                'name' => $s['name'],
                'email' => $s['email'],
                'program' => $s['program'] ?? 'WAEC',
                'department' => $s['department'] ?? 'Science',
                'is_paid' => $isPaidActive ? 1 : 0,
                'status_label' => $statusLabel,
                'plan' => $s['payment_plan'] ?? 'None',
                'paid_until' => $s['paid_until'],
                'paid_until_formatted' => $paidUntilFormatted,
                'days_left' => $daysLeft,
                'created_at' => $s['created_at']
            ];
        }, $rawStudents);

        // 3. Fetch recent payment transactions
        $payStmt = $pdo->query("SELECT p.*, u.name as student_name, u.email as student_email FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.id DESC LIMIT 30");
        $payments = $payStmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Calculate total revenue collected
        $revStmt = $pdo->query("SELECT SUM(amount_paid) as total_rev FROM payments WHERE status = 'success'");
        $totalRevenue = (float)($revStmt->fetchColumn() ?: 0);
        $paystackSettings = PaystackEngine::getSettings($pdo, false);

        echo json_encode([
            'success' => true,
            'fees' => $fees,
            'students' => $studentRoster,
            'payments' => $payments,
            'paystack' => $paystackSettings,
            'summary' => [
                'total_students' => count($studentRoster),
                'paid_students' => $paidCount,
                'unpaid_students' => $unpaidCount,
                'monthly_subscribers' => $monthlySubCount,
                'weekly_subscribers' => $weeklySubCount,
                'total_revenue' => $totalRevenue,
                'total_revenue_formatted' => '₦' . number_format($totalRevenue, 2)
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 3. SAVE / EDIT FEE (Admin Only)
if ($action === 'save_fee') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can configure school fees.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $id = !empty($input['id']) ? (int)$input['id'] : null;
    $title = trim($input['title'] ?? 'School Tuition & Learning Access Fee');
    $baseFee = (float)($input['base_monthly_fee'] ?? 0);
    $program = trim($input['program'] ?? 'All');
    $description = trim($input['description'] ?? '');
    $status = trim($input['status'] ?? 'active');

    if ($baseFee <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide a valid base monthly fee greater than zero.']);
        exit;
    }

    try {
        if ($id) {
            $stmt = $pdo->prepare("UPDATE fees SET title = ?, description = ?, base_monthly_fee = ?, program = ?, status = ? WHERE id = ?");
            $stmt->execute([$title, $description, $baseFee, $program, $status, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO fees (title, description, base_monthly_fee, program, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $baseFee, $program, $status]);
            $id = (int)$pdo->lastInsertId();
        }

        echo json_encode([
            'success' => true,
            'message' => 'School fee saved successfully.',
            'fee' => [
                'id' => $id,
                'title' => $title,
                'base_monthly_fee' => $baseFee,
                'monthly_fee' => round($baseFee * 0.90, 2),
                'weekly_fee' => round($baseFee / 4, 2),
                'program' => $program,
                'status' => $status
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 4. PAY STUDENT FEE (Student or Admin on behalf of student)
if ($action === 'pay_student_fee') {
    if ($user['role'] === 'staff') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Staff members are restricted from processing student payments.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $plan = strtolower(trim($input['plan'] ?? 'monthly'));
    if ($plan !== 'weekly' && $plan !== 'monthly') {
        $plan = 'monthly';
    }

    $paymentMethod = trim($input['payment_method'] ?? 'online');
    $studentId = ($user['role'] === 'admin' && !empty($input['student_id'])) ? (int)$input['student_id'] : (int)$user['id'];
    $reference = trim($input['reference'] ?? ('PAY-' . date('YmdHis') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6))));

    try {
        // Fetch target student
        $stStmt = $pdo->prepare("SELECT id, name, email, program FROM users WHERE id = ?");
        $stStmt->execute([$studentId]);
        $st = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$st) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Student account not found.']);
            exit;
        }

        // Fetch active fee
        $feeStmt = $pdo->prepare("SELECT * FROM fees WHERE status = 'active' ORDER BY CASE WHEN program = ? THEN 1 WHEN program = 'All' THEN 2 ELSE 3 END, id ASC LIMIT 1");
        $feeStmt->execute([$st['program'] ?? 'WAEC']);
        $fee = $feeStmt->fetch(PDO::FETCH_ASSOC);

        $baseMonthly = $fee ? (float)$fee['base_monthly_fee'] : 20000.00;
        $feeId = $fee ? (int)$fee['id'] : null;

        // Pricing math:
        // Monthly: 10% OFF discount applied
        // Weekly: 1 month fee splitted into 4 weeks without 10% discount
        if ($plan === 'monthly') {
            $baseAmount = $baseMonthly;
            $discountAmount = round($baseMonthly * 0.10, 2);
            $amountPaid = round($baseMonthly * 0.90, 2);
            $paidUntil = date('Y-m-d H:i:s', strtotime('+30 days'));
        } else {
            // Weekly
            $baseAmount = round($baseMonthly / 4, 2);
            $discountAmount = 0.00;
            $amountPaid = round($baseMonthly / 4, 2);
            $paidUntil = date('Y-m-d H:i:s', strtotime('+7 days'));
        }

        // Insert payment record
        $payStmt = $pdo->prepare("INSERT INTO payments (user_id, student_name, student_email, reference, fee_id, plan, base_amount, discount_amount, amount_paid, status, payment_method, paid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?)");
        $payStmt->execute([
            $studentId,
            $st['name'],
            $st['email'],
            $reference,
            $feeId,
            $plan,
            $baseAmount,
            $discountAmount,
            $amountPaid,
            $paymentMethod,
            $paidUntil
        ]);

        // Automatically log into institutional financial_ledger
        $cat = "Student Tuition (" . ucfirst($plan) . ")";
        $channel = ($paymentMethod === 'bank_transfer') ? 'bank_transfer' : 'paystack_online';
        $source = ($paymentMethod === 'bank_transfer') ? 'manual_external' : 'platform_paystack';
        $desc = "Student Tuition (" . ucfirst($plan) . " Plan) - " . $st['name'] . ($paymentMethod === 'bank_transfer' ? ' via Direct Bank Transfer' : ' via Paystack Online');
        $notes = "Tuition payment ref: {$reference} | Plan: {$plan} | Method: {$paymentMethod}";

        $ledStmt = $pdo->prepare("
            INSERT INTO financial_ledger 
            (transaction_type, category, amount, source, channel, reference, description, entity_type, entity_id, entity_name, entity_email, transaction_date, notes)
            VALUES ('income', ?, ?, ?, ?, ?, ?, 'student', ?, ?, ?, NOW(), ?)
        ");
        $ledStmt->execute([
            $cat,
            $amountPaid,
            $source,
            $channel,
            $reference,
            $desc,
            $studentId,
            $st['name'],
            $st['email'],
            $notes
        ]);

        // Push real-time notification to Paystack / admin alerts
        try {
            $pstkSet = PaystackEngine::getSettings($pdo, false);
            $notifs = $pstkSet['notifications'] ?? [];
            $newNotif = [
                'id' => time(),
                'title' => "Student Tuition Payment Received (" . ($paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Online') . " - ₦" . number_format($amountPaid, 2) . ")",
                'message' => "Student: {$st['name']} ({$st['email']}) paid ₦" . number_format($amountPaid, 2) . " for " . ucfirst($plan) . " tuition plan. Ref: {$reference}.",
                'type' => 'success',
                'date' => date('Y-m-d')
            ];
            array_unshift($notifs, $newNotif);
            if (count($notifs) > 15) array_pop($notifs);
            $upN = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
            $upN->execute([json_encode($notifs)]);
        } catch (Exception $ign) {}

        // Update user status
        $upStmt = $pdo->prepare("UPDATE users SET is_paid = 1, paid_until = ?, payment_plan = ? WHERE id = ?");
        $upStmt->execute([$paidUntil, $plan, $studentId]);

        // If paying user is currently logged in, update their session
        if ($user['id'] === $studentId) {
            $_SESSION['user']['is_paid'] = 1;
            $_SESSION['user']['paid_until'] = $paidUntil;
            $_SESSION['user']['payment_plan'] = $plan;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Payment verified successfully! Full portal access is now granted.',
            'payment' => [
                'reference' => $reference,
                'plan' => $plan,
                'amount_paid' => $amountPaid,
                'discount_amount' => $discountAmount,
                'paid_until' => $paidUntil,
                'paid_until_formatted' => date('d M Y, h:i A', strtotime($paidUntil))
            ],
            'user' => [
                'id' => $studentId,
                'is_paid' => 1,
                'paid_until' => $paidUntil,
                'payment_plan' => $plan
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 5. ADMIN TOGGLE STUDENT PAYMENT (Mark Paid / Revoke)
if ($action === 'admin_toggle_student_payment') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can record manual student payments.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $studentId = (int)($input['student_id'] ?? 0);
    $actionType = strtolower(trim($input['action_type'] ?? 'mark_paid_monthly'));

    if ($studentId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A valid student ID is required.']);
        exit;
    }

    try {
        $stStmt = $pdo->prepare("SELECT id, name, email, program FROM users WHERE id = ? AND role = 'student'");
        $stStmt->execute([$studentId]);
        $st = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$st) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Student not found.']);
            exit;
        }

        if ($actionType === 'revoke') {
            $upStmt = $pdo->prepare("UPDATE users SET is_paid = 0, paid_until = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = ?");
            $upStmt->execute([$studentId]);
            $msg = "Access for {$st['name']} has been revoked.";
        } else {
            // Fetch fee
            $feeStmt = $pdo->prepare("SELECT * FROM fees WHERE status = 'active' ORDER BY id ASC LIMIT 1");
            $feeStmt->execute();
            $fee = $feeStmt->fetch(PDO::FETCH_ASSOC);
            $baseMonthly = $fee ? (float)$fee['base_monthly_fee'] : 20000.00;
            $feeId = $fee ? (int)$fee['id'] : null;

            $isWeekly = ($actionType === 'mark_paid_weekly');
            $plan = $isWeekly ? 'weekly' : 'monthly';
            $paidUntil = $isWeekly ? date('Y-m-d H:i:s', strtotime('+7 days')) : date('Y-m-d H:i:s', strtotime('+30 days'));
            $baseAmount = $isWeekly ? round($baseMonthly / 4, 2) : $baseMonthly;
            $discountAmount = $isWeekly ? 0.00 : round($baseMonthly * 0.10, 2);
            $amountPaid = $isWeekly ? round($baseMonthly / 4, 2) : round($baseMonthly * 0.90, 2);
            $ref = 'ADM-MANUAL-' . date('YmdHis') . '-' . $studentId;

            $payStmt = $pdo->prepare("INSERT INTO payments (user_id, student_name, student_email, reference, fee_id, plan, base_amount, discount_amount, amount_paid, status, payment_method, paid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', 'manual_admin', ?)");
            $payStmt->execute([$studentId, $st['name'], $st['email'], $ref, $feeId, $plan, $baseAmount, $discountAmount, $amountPaid, $paidUntil]);

            // Log into financial_ledger
            $cat = "Student Tuition (" . ucfirst($plan) . ")";
            $desc = "Student Tuition (" . ucfirst($plan) . " Plan) - " . $st['name'] . " recorded manually by Bursary/Admin";
            $notes = "Manual administrative payment ref: {$ref}";
            $ledStmt = $pdo->prepare("
                INSERT INTO financial_ledger 
                (transaction_type, category, amount, source, channel, reference, description, entity_type, entity_id, entity_name, entity_email, transaction_date, notes)
                VALUES ('income', ?, ?, 'manual_external', 'cash', ?, ?, 'student', ?, ?, ?, NOW(), ?)
            ");
            $ledStmt->execute([
                $cat,
                $amountPaid,
                $ref,
                $desc,
                $studentId,
                $st['name'],
                $st['email'],
                $notes
            ]);

            $upStmt = $pdo->prepare("UPDATE users SET is_paid = 1, paid_until = ?, payment_plan = ? WHERE id = ?");
            $upStmt->execute([$paidUntil, $plan, $studentId]);
            $msg = "Recorded {$plan} payment for {$st['name']} successfully. Access active until " . date('d M Y', strtotime($paidUntil));
        }

        echo json_encode([
            'success' => true,
            'message' => $msg
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   STAFF PAYROLL & BANKING MANAGEMENT (STAFF & ADMIN ONLY)
   ========================================================================== */

// 1. GET STAFF PAYROLL & BANKING INFO
if ($action === 'get_staff_payroll_info') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Students are restricted from payroll records.']);
        exit;
    }

    $currentMonth = date('F Y'); // e.g. "November 2026"
    $selectedMonth = trim($_GET['month_year'] ?? $currentMonth);

    // List of major Nigerian Commercial Banks & Fintechs
    $nigerianBanks = [
        'Zenith Bank',
        'Guaranty Trust Bank (GTBank)',
        'Access Bank',
        'First Bank of Nigeria',
        'United Bank for Africa (UBA)',
        'Stanbic IBTC Bank',
        'Fidelity Bank',
        'Ecobank Nigeria',
        'First City Monument Bank (FCMB)',
        'Union Bank of Nigeria',
        'Sterling Bank',
        'Wema Bank (ALAT)',
        'Polaris Bank',
        'Kuda Bank',
        'Opay Digital Services',
        'Moniepoint Microfinance Bank',
        'PalmPay'
    ];

    try {
        if ($user['role'] === 'staff') {
            // Staff only sees their own bank details and payslip history
            $stStmt = $pdo->prepare("SELECT id, name, email, department, subjects, bank_name, account_number, account_name, monthly_salary FROM users WHERE id = ?");
            $stStmt->execute([$user['id']]);
            $staffData = $stStmt->fetch(PDO::FETCH_ASSOC);

            // Fetch this staff's payment history
            $payStmt = $pdo->prepare("SELECT * FROM staff_payroll WHERE staff_id = ? ORDER BY id DESC LIMIT 20");
            $payStmt->execute([$user['id']]);
            $payslips = $payStmt->fetchAll(PDO::FETCH_ASSOC);

            // Check if paid for current month
            $curCheck = $pdo->prepare("SELECT id, reference, net_amount, paid_at FROM staff_payroll WHERE staff_id = ? AND month_year = ? LIMIT 1");
            $curCheck->execute([$user['id'], $currentMonth]);
            $currentMonthPay = $curCheck->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'banks' => $nigerianBanks,
                'staff' => [
                    'id' => (int)$staffData['id'],
                    'formatted_id' => 'STF-' . str_pad($staffData['id'], 4, '0', STR_PAD_LEFT),
                    'name' => $staffData['name'],
                    'email' => $staffData['email'],
                    'department' => $staffData['department'],
                    'assigned_subject' => !empty($staffData['subjects']) ? (json_decode($staffData['subjects'], true)[0] ?? 'General') : 'General',
                    'bank_name' => $staffData['bank_name'] ?? '',
                    'account_number' => $staffData['account_number'] ?? '',
                    'account_name' => $staffData['account_name'] ?? '',
                    'monthly_salary' => (float)($staffData['monthly_salary'] ?? 75000),
                    'monthly_salary_formatted' => '₦' . number_format((float)($staffData['monthly_salary'] ?? 75000), 2),
                    'is_paid_this_month' => (bool)$currentMonthPay,
                    'current_month_payout' => $currentMonthPay
                ],
                'payslips' => $payslips,
                'current_month' => $currentMonth
            ]);
            exit;
        }

        // ADMIN ROLE: full staff roster with bank details, current month status, and total payroll metrics
        $allStaffStmt = $pdo->query("SELECT id, name, email, department, subjects, bank_name, account_number, account_name, monthly_salary FROM users WHERE role = 'staff' ORDER BY id ASC");
        $rawStaff = $allStaffStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all payroll disbursements for selected month
        $monthPaysStmt = $pdo->prepare("SELECT staff_id, reference, net_amount, status, paid_at FROM staff_payroll WHERE month_year = ?");
        $monthPaysStmt->execute([$selectedMonth]);
        $monthPaidMap = [];
        foreach ($monthPaysStmt->fetchAll(PDO::FETCH_ASSOC) as $mp) {
            $monthPaidMap[$mp['staff_id']] = $mp;
        }

        $totalPayrollLiability = 0;
        $totalPaidThisMonth = 0;
        $totalUnpaidThisMonth = 0;
        $paidCount = 0;
        $unpaidCount = 0;

        $staffRoster = array_map(function($s) use ($monthPaidMap, &$totalPayrollLiability, &$totalPaidThisMonth, &$totalUnpaidThisMonth, &$paidCount, &$unpaidCount) {
            $salary = (float)($s['monthly_salary'] ?? 75000);
            $totalPayrollLiability += $salary;
            $subs = !empty($s['subjects']) ? json_decode($s['subjects'], true) : [];
            $assignedSubject = is_array($subs) && count($subs) > 0 ? $subs[0] : 'General';
            $isPaid = isset($monthPaidMap[$s['id']]);

            if ($isPaid) {
                $paidCount++;
                $totalPaidThisMonth += (float)$monthPaidMap[$s['id']]['net_amount'];
            } else {
                $unpaidCount++;
                $totalUnpaidThisMonth += $salary;
            }

            $hasBankDetails = !empty($s['bank_name']) && !empty($s['account_number']) && !empty($s['account_name']);

            return [
                'id' => (int)$s['id'],
                'formatted_id' => 'STF-' . str_pad($s['id'], 4, '0', STR_PAD_LEFT),
                'name' => $s['name'],
                'email' => $s['email'],
                'department' => $s['department'] ?? 'Science',
                'assigned_subject' => $assignedSubject,
                'bank_name' => $s['bank_name'] ?? '',
                'account_number' => $s['account_number'] ?? '',
                'account_name' => $s['account_name'] ?? '',
                'has_bank_details' => $hasBankDetails,
                'monthly_salary' => $salary,
                'monthly_salary_formatted' => '₦' . number_format($salary, 2),
                'is_paid_this_month' => $isPaid,
                'payout_info' => $monthPaidMap[$s['id']] ?? null
            ];
        }, $rawStaff);

        // Fetch recent payroll history
        $histStmt = $pdo->query("SELECT * FROM staff_payroll ORDER BY id DESC LIMIT 50");
        $history = $histStmt->fetchAll(PDO::FETCH_ASSOC);
        $paystackSettings = PaystackEngine::getSettings($pdo, false);

        echo json_encode([
            'success' => true,
            'current_month' => $currentMonth,
            'selected_month' => $selectedMonth,
            'banks' => $nigerianBanks,
            'paystack' => $paystackSettings,
            'summary' => [
                'total_staff' => count($staffRoster),
                'total_payroll_liability' => $totalPayrollLiability,
                'total_payroll_formatted' => '₦' . number_format($totalPayrollLiability, 2),
                'total_paid' => $totalPaidThisMonth,
                'total_paid_formatted' => '₦' . number_format($totalPaidThisMonth, 2),
                'total_unpaid' => $totalUnpaidThisMonth,
                'total_unpaid_formatted' => '₦' . number_format($totalUnpaidThisMonth, 2),
                'paid_count' => $paidCount,
                'unpaid_count' => $unpaidCount
            ],
            'staff' => $staffRoster,
            'history' => $history
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 2. UPDATE STAFF BANKING & SALARY DETAILS
if ($action === 'update_staff_banking') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    
    // If staff, target is always themselves. If admin, can specify target staff_id.
    $targetStaffId = ($user['role'] === 'admin' && !empty($input['staff_id'])) ? (int)$input['staff_id'] : (int)$user['id'];

    $bankName = trim($input['bank_name'] ?? '');
    $accountNumber = preg_replace('/[^0-9]/', '', trim($input['account_number'] ?? ''));
    $accountName = trim($input['account_name'] ?? '');
    $monthlySalary = isset($input['monthly_salary']) ? (float)$input['monthly_salary'] : null;

    if (empty($bankName) || empty($accountNumber) || empty($accountName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide Bank Name, 10-digit Account Number, and Account Name.']);
        exit;
    }

    if (strlen($accountNumber) !== 10) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nigerian NUBAN account number must be exactly 10 digits.']);
        exit;
    }

    try {
        if ($user['role'] === 'admin' && $monthlySalary !== null && $monthlySalary > 0) {
            $upStmt = $pdo->prepare("UPDATE users SET bank_name = ?, account_number = ?, account_name = ?, monthly_salary = ? WHERE id = ? AND role = 'staff'");
            $upStmt->execute([$bankName, $accountNumber, $accountName, $monthlySalary, $targetStaffId]);
        } else {
            $upStmt = $pdo->prepare("UPDATE users SET bank_name = ?, account_number = ?, account_name = ? WHERE id = ? AND role = 'staff'");
            $upStmt->execute([$bankName, $accountNumber, $accountName, $targetStaffId]);
        }

        // If logged-in staff updated their own, refresh session
        if ($user['id'] === $targetStaffId) {
            $_SESSION['user']['bank_name'] = $bankName;
            $_SESSION['user']['account_number'] = $accountNumber;
            $_SESSION['user']['account_name'] = $accountName;
            if ($monthlySalary !== null && $user['role'] === 'admin') {
                $_SESSION['user']['monthly_salary'] = $monthlySalary;
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Staff bank account details saved successfully.',
            'banking' => [
                'bank_name' => $bankName,
                'account_number' => $accountNumber,
                'account_name' => $accountName
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 3. PROCESS STAFF SALARY PAYMENT (Admin Only)
if ($action === 'process_staff_salary') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can disburse payroll payments.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $target = trim($input['staff_id'] ?? '');
    $monthYear = trim($input['month_year'] ?? date('F Y'));
    $method = trim($input['payment_method'] ?? 'platform_transfer');
    $notes = trim($input['notes'] ?? "{$monthYear} Teaching Staff Remittance");
    $bonus = max(0, (float)($input['bonus'] ?? 0));
    $deductions = max(0, (float)($input['deductions'] ?? 0));

    if ($method === 'paystack_transfer') {
        $paystackSettings = PaystackEngine::getSettings($pdo, true);
        if ((int)$paystackSettings['is_enabled'] === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Paystack API is currently deactivated by administrator. Cannot disburse via Paystack Transfer.']);
            exit;
        }
    }

    try {
        if ($target === 'all') {
            // Bulk payout to all unpaid staff with bank details configured
            $staffListStmt = $pdo->query("SELECT id, name, email, department, subjects, bank_name, account_number, account_name, monthly_salary FROM users WHERE role = 'staff'");
            $allStaff = $staffListStmt->fetchAll(PDO::FETCH_ASSOC);

            $alreadyPaidStmt = $pdo->prepare("SELECT staff_id FROM staff_payroll WHERE month_year = ?");
            $alreadyPaidStmt->execute([$monthYear]);
            $alreadyPaidIds = $alreadyPaidStmt->fetchAll(PDO::FETCH_COLUMN);

            $processedCount = 0;
            $totalDisbursed = 0;

            $insertStmt = $pdo->prepare("
                INSERT INTO staff_payroll 
                (reference, staff_id, staff_name, staff_email, department, subject, bank_name, account_number, account_name, amount, bonus, deductions, net_amount, month_year, payment_method, status, notes, paid_by_admin_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
            ");

            foreach ($allStaff as $st) {
                if (in_array($st['id'], $alreadyPaidIds)) continue;
                if (empty($st['bank_name']) || empty($st['account_number']) || empty($st['account_name'])) continue;

                $salary = (float)($st['monthly_salary'] ?? 75000);
                $net = $salary;
                $ref = 'PAYROLL-' . date('Ym') . '-' . str_pad($st['id'], 4, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
                $subs = !empty($st['subjects']) ? json_decode($st['subjects'], true) : [];
                $subj = is_array($subs) && count($subs) > 0 ? $subs[0] : 'General';
                $itemNotes = $notes;

                if ($method === 'paystack_transfer') {
                    $pstkRes = PaystackEngine::processPayrollTransfer($pdo, $user['id'], $st, $monthYear, $net, $notes);
                    $ref = $pstkRes['reference'];
                    $itemNotes .= " | Paystack: " . $pstkRes['transfer_code'];
                }

                $insertStmt->execute([
                    $ref,
                    $st['id'],
                    $st['name'],
                    $st['email'],
                    $st['department'] ?? 'Science',
                    $subj,
                    $st['bank_name'],
                    $st['account_number'],
                    $st['account_name'],
                    $salary,
                    0.00,
                    0.00,
                    $net,
                    $monthYear,
                    $method,
                    $itemNotes,
                    $user['id']
                ]);

                $processedCount++;
                $totalDisbursed += $net;
            }

            echo json_encode([
                'success' => true,
                'message' => "Bulk payroll processed: Successfully disbursed ₦" . number_format($totalDisbursed, 2) . " across {$processedCount} staff members for {$monthYear}."
            ]);
            exit;
        }

        // Single Staff Payout
        $staffId = (int)$target;
        if ($staffId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'A valid staff ID is required.']);
            exit;
        }

        $stStmt = $pdo->prepare("SELECT id, name, email, department, subjects, bank_name, account_number, account_name, monthly_salary FROM users WHERE id = ? AND role = 'staff'");
        $stStmt->execute([$staffId]);
        $st = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$st) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Staff account not found.']);
            exit;
        }

        if (empty($st['bank_name']) || empty($st['account_number']) || empty($st['account_name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Cannot process payment: {$st['name']} has not provided their bank account details."]);
            exit;
        }

        // Check if already paid for this month
        $checkStmt = $pdo->prepare("SELECT id, reference FROM staff_payroll WHERE staff_id = ? AND month_year = ?");
        $checkStmt->execute([$staffId, $monthYear]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $prevCount = (int)$pdo->query("SELECT COUNT(*) FROM staff_payroll WHERE staff_id = {$staffId} AND month_year = " . $pdo->quote($monthYear))->fetchColumn();
            $notes = (trim($notes) ?: "{$monthYear} Salary Remittance") . " (Payout #" . ($prevCount + 1) . ")";
        }

        $baseSalary = isset($input['amount']) ? max(0, (float)$input['amount']) : (float)($st['monthly_salary'] ?? 75000);
        $netAmount = round($baseSalary + $bonus - $deductions, 2);

        $ref = 'PAYROLL-' . date('Ym') . '-' . str_pad($staffId, 4, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        $subs = !empty($st['subjects']) ? json_decode($st['subjects'], true) : [];
        $subj = is_array($subs) && count($subs) > 0 ? $subs[0] : 'General';
        $itemNotes = $notes;

        if ($method === 'paystack_transfer') {
            $pstkRes = PaystackEngine::processPayrollTransfer($pdo, $user['id'], $st, $monthYear, $netAmount, $notes);
            $ref = $pstkRes['reference'];
            $itemNotes .= " | Paystack: " . $pstkRes['transfer_code'];
        }

        $insStmt = $pdo->prepare("
            INSERT INTO staff_payroll 
            (reference, staff_id, staff_name, staff_email, department, subject, bank_name, account_number, account_name, amount, bonus, deductions, net_amount, month_year, payment_method, status, notes, paid_by_admin_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
        ");
        $insStmt->execute([
            $ref,
            $staffId,
            $st['name'],
            $st['email'],
            $st['department'] ?? 'Science',
            $subj,
            $st['bank_name'],
            $st['account_number'],
            $st['account_name'],
            $baseSalary,
            $bonus,
            $deductions,
            $netAmount,
            $monthYear,
            $method,
            $itemNotes,
            $user['id']
        ]);

        echo json_encode([
            'success' => true,
            'message' => "Salary payment of ₦" . number_format($netAmount, 2) . " processed successfully for {$st['name']} ({$st['bank_name']} - {$st['account_number']}).",
            'payout' => [
                'reference' => $ref,
                'staff_name' => $st['name'],
                'bank_name' => $st['bank_name'],
                'account_number' => $st['account_number'],
                'account_name' => $st['account_name'],
                'net_amount' => $netAmount,
                'net_amount_formatted' => '₦' . number_format($netAmount, 2),
                'month_year' => $monthYear,
                'paid_at' => date('d M Y, h:i A')
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// 4. GET SINGLE PAYSLIP DETAILS
if ($action === 'get_single_payslip') {
    if (!in_array($user['role'], ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden.']);
        exit;
    }

    $reference = trim($_GET['reference'] ?? '');
    $id = (int)($_GET['id'] ?? 0);

    try {
        if (!empty($reference)) {
            $stmt = $pdo->prepare("SELECT p.*, u.name as staff_full_name, u.email as staff_email_addr FROM staff_payroll p LEFT JOIN users u ON p.staff_id = u.id WHERE p.reference = ?");
            $stmt->execute([$reference]);
        } else {
            $stmt = $pdo->prepare("SELECT p.*, u.name as staff_full_name, u.email as staff_email_addr FROM staff_payroll p LEFT JOIN users u ON p.staff_id = u.id WHERE p.id = ?");
            $stmt->execute([$id]);
        }
        $payslip = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$payslip) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Payslip record not found.']);
            exit;
        }

        // If staff, verify they are only requesting their own payslip
        if ($user['role'] === 'staff' && (int)$payslip['staff_id'] !== (int)$user['id']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied. You can only view your own payslips.']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'payslip' => $payslip
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   ALOC STATION API INTEGRATION & MANAGEMENT ENDPOINTS
   ========================================================================== */

// 1. GET ALOC STATION API SETTINGS & STATUS (Student, Staff, Admin)
if ($action === 'get_aloc_settings') {
    try {
        $isAdmin = ($user['role'] === 'admin');
        $settings = AlocEngine::getSettings($pdo, $isAdmin);
        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error retrieving ALOC settings: ' . $e->getMessage()]);
    }
    exit;
}

// 2. TOGGLE ALOC STATUS (Admin Only: Enable or Remove/Disable API)
if ($action === 'toggle_aloc_status') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can modify ALOC API status.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $isEnabled = isset($input['is_enabled']) ? (bool)$input['is_enabled'] : false;
        $settings = AlocEngine::toggleStatus($pdo, $isEnabled);

        echo json_encode([
            'success' => true,
            'settings' => $settings,
            'message' => $isEnabled ? 'ALOC Station API has been enabled.' : 'ALOC Station API has been deactivated (removed).'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error updating ALOC status: ' . $e->getMessage()]);
    }
    exit;
}

// 3. SAVE / UPDATE ALOC SUBSCRIPTION PLAN & CREDENTIALS (Admin Only)
if ($action === 'save_aloc_settings') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can configure ALOC settings.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $settings = AlocEngine::updateSettings($pdo, $input);

        echo json_encode([
            'success' => true,
            'settings' => $settings,
            'message' => 'ALOC Station API subscription plan and configuration updated.'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error saving ALOC settings: ' . $e->getMessage()]);
    }
    exit;
}

// 4. DISMISS ALOC NOTIFICATION (Admin Only)
if ($action === 'aloc_dismiss_notification') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can manage notifications.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $notifId = $input['id'] ?? ($_GET['id'] ?? '');
        AlocEngine::dismissNotification($pdo, $notifId);

        echo json_encode([
            'success' => true,
            'message' => 'Notification dismissed.'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error dismissing notification: ' . $e->getMessage()]);
    }
    exit;
}

// 4b. PING CBT PROVIDER LATENCY (Admin, Staff)
if ($action === 'ping_cbt_provider') {
    try {
        $providerKey = trim($_GET['provider'] ?? ($_POST['provider'] ?? 'aloc'));
        $res = AlocEngine::pingProvider($pdo, $providerKey);
        echo json_encode($res);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error pinging provider: ' . $e->getMessage()]);
    }
    exit;
}

// 5. FETCH QUESTIONS FROM UNIFIED CBT & QUESTION BANK ENGINE (Student, Staff, Admin)
if ($action === 'aloc_fetch_questions') {
    try {
        $subject = trim($_GET['subject'] ?? ($_POST['subject'] ?? 'Mathematics'));
        $examType = trim($_GET['examType'] ?? ($_POST['examType'] ?? 'waec'));
        $year = trim($_GET['year'] ?? ($_POST['year'] ?? '2024'));
        $limit = (int)($_GET['limit'] ?? ($_POST['limit'] ?? 20));

        $res = AlocEngine::fetchQuestions($pdo, $subject, $examType, $year, $limit);

        if (isset($res['disabled']) && $res['disabled']) {
            http_response_code(403);
            echo json_encode($res);
            exit;
        }

        echo json_encode($res);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error fetching questions: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   PAYSTACK PAYMENT & PAYROLL DISBURSEMENT INTEGRATION
   ========================================================================== */

// 1. GET PAYSTACK SETTINGS (Student, Staff, Admin)
if ($action === 'get_paystack_settings') {
    try {
        $isAdmin = ($user['role'] === 'admin');
        $settings = PaystackEngine::getSettings($pdo, $isAdmin);
        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error fetching Paystack settings: ' . $e->getMessage()]);
    }
    exit;
}

// 2. TOGGLE PAYSTACK STATUS (Admin Only: Enable or Remove/Disable API)
if ($action === 'toggle_paystack_status') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can modify Paystack API status.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $isEnabled = isset($input['is_enabled']) ? (bool)$input['is_enabled'] : false;
        $settings = PaystackEngine::toggleStatus($pdo, $isEnabled);

        echo json_encode([
            'success' => true,
            'settings' => $settings,
            'message' => $isEnabled ? 'Paystack Gateway has been enabled.' : 'Paystack API has been deactivated (removed).'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error updating Paystack status: ' . $e->getMessage()]);
    }
    exit;
}

// 3. SAVE PAYSTACK DECISIONS & CREDENTIALS (Admin Only)
if ($action === 'save_paystack_settings') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can configure Paystack settings.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $settings = PaystackEngine::updateSettings($pdo, $input);

        echo json_encode([
            'success' => true,
            'settings' => $settings,
            'message' => 'Paystack configuration and decision policies updated successfully.'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error saving Paystack settings: ' . $e->getMessage()]);
    }
    exit;
}

// 4. DISMISS PAYSTACK NOTIFICATION (Admin Only)
if ($action === 'paystack_dismiss_notification') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can manage notifications.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $notifId = $input['id'] ?? ($_GET['id'] ?? '');
        PaystackEngine::dismissNotification($pdo, $notifId);

        echo json_encode([
            'success' => true,
            'message' => 'Notification dismissed.'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error dismissing notification: ' . $e->getMessage()]);
    }
    exit;
}

// 5. INITIALIZE PAYSTACK STUDENT FEE CHECKOUT (Student or Admin)
if ($action === 'initialize_paystack_fee') {
    if ($user['role'] === 'staff') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Staff members cannot initialize student fees.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $plan = strtolower(trim($input['plan'] ?? 'monthly'));
        if ($plan !== 'weekly' && $plan !== 'monthly') $plan = 'monthly';

        $studentId = ($user['role'] === 'admin' && !empty($input['student_id'])) ? (int)$input['student_id'] : (int)$user['id'];

        $stStmt = $pdo->prepare("SELECT id, name, email, program FROM users WHERE id = ?");
        $stStmt->execute([$studentId]);
        $st = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$st) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Student not found.']);
            exit;
        }

        // Active fee
        $feeStmt = $pdo->prepare("SELECT * FROM fees WHERE status = 'active' ORDER BY CASE WHEN program = ? THEN 1 WHEN program = 'All' THEN 2 ELSE 3 END, id ASC LIMIT 1");
        $feeStmt->execute([$st['program'] ?? 'WAEC']);
        $fee = $feeStmt->fetch(PDO::FETCH_ASSOC);

        $baseMonthly = $fee ? (float)$fee['base_monthly_fee'] : 20000.00;
        $amount = ($plan === 'monthly') ? round($baseMonthly * 0.90, 2) : round($baseMonthly / 4, 2);

        $res = PaystackEngine::initializePayment($pdo, $st, $plan, $amount);

        if (isset($res['disabled']) && $res['disabled']) {
            http_response_code(403);
            echo json_encode($res);
            exit;
        }

        echo json_encode($res);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error initializing Paystack checkout: ' . $e->getMessage()]);
    }
    exit;
}

// 6. VERIFY PAYSTACK PAYMENT & UNLOCK ACCESS (Student or Admin)
if ($action === 'verify_paystack_payment') {
    if ($user['role'] === 'staff') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Staff members cannot verify student fees.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $reference = trim($input['reference'] ?? '');
        $plan = strtolower(trim($input['plan'] ?? 'monthly'));
        if ($plan !== 'weekly' && $plan !== 'monthly') $plan = 'monthly';

        $studentId = ($user['role'] === 'admin' && !empty($input['student_id'])) ? (int)$input['student_id'] : (int)$user['id'];

        if (empty($reference)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Paystack transaction reference is required.']);
            exit;
        }

        $res = PaystackEngine::verifyPayment($pdo, $studentId, $reference, $plan, 'paystack');

        if (isset($res['disabled']) && $res['disabled']) {
            http_response_code(403);
            echo json_encode($res);
            exit;
        }

        echo json_encode($res);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error verifying Paystack payment: ' . $e->getMessage()]);
    }
    exit;
}

// ==========================================================================
// 15. FINANCIAL RECORD BOOK & BALANCE SHEET ENDPOINTS
// ==========================================================================

if (!function_exists('formatLedgerChannelLabel')) {
function formatLedgerChannelLabel($channel) {
    switch ($channel) {
        case 'paystack_online':
        case 'paystack':
        case 'online':
            return '⚡ Paystack Online';
        case 'paystack_transfer':
        case 'platform_transfer':
            return '⚡ Paystack Remit';
        case 'cash':
            return '💵 Cash';
        case 'pos':
            return '💳 POS Terminal';
        case 'bank_transfer':
            return '🏦 Direct Bank Deposit';
        case 'cheque':
            return '📄 Bank Cheque';
        case 'manual_admin':
            return '📝 Bursary Desk';
        default:
            return ucwords(str_replace('_', ' ', $channel));
    }
}
}

// 1. GET FINANCIAL LEDGER & BALANCE SHEET (Admin Only)
if ($action === 'get_financial_ledger') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can access the financial record book and balance sheet.']);
        exit;
    }

    try {
        $filterType = trim($_GET['type'] ?? 'all');
        $filterChannel = trim($_GET['channel'] ?? 'all');
        $filterSource = trim($_GET['source'] ?? 'all');
        $filterPeriod = trim($_GET['period'] ?? 'all');
        $search = trim($_GET['search'] ?? '');

        // Summary metrics
        $summaryStmt = $pdo->query("
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(CASE WHEN transaction_type = 'income' AND source = 'platform_paystack' THEN amount ELSE 0 END), 0) as paystack_income,
                COALESCE(SUM(CASE WHEN transaction_type = 'income' AND source = 'manual_external' THEN amount ELSE 0 END), 0) as external_income,
                COALESCE(SUM(CASE WHEN transaction_type = 'expense' AND source = 'platform_paystack' THEN amount ELSE 0 END), 0) as paystack_expense,
                COALESCE(SUM(CASE WHEN transaction_type = 'expense' AND source = 'manual_external' THEN amount ELSE 0 END), 0) as external_expense,
                COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
                COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
            FROM financial_ledger
        ");
        $rawSummary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        $totIncome = (float)$rawSummary['total_income'];
        $totExpense = (float)$rawSummary['total_expense'];
        $netBalance = $totIncome - $totExpense;

        $paystackSettings = PaystackEngine::getSettings($pdo, false);
        $walletBalance = (float)($paystackSettings['balance_ngn'] ?? 0);

        // Filtered transactions query
        $whereClauses = [];
        $params = [];

        if ($filterType === 'income' || $filterType === 'expense') {
            $whereClauses[] = "transaction_type = ?";
            $params[] = $filterType;
        }

        if ($filterSource === 'platform_paystack' || $filterSource === 'manual_external') {
            $whereClauses[] = "source = ?";
            $params[] = $filterSource;
        }

        if ($filterChannel !== 'all' && $filterChannel !== '') {
            $whereClauses[] = "channel = ?";
            $params[] = $filterChannel;
        }

        if ($filterPeriod === 'this_month') {
            $whereClauses[] = "transaction_date >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')";
        } elseif ($filterPeriod === 'last_month') {
            $whereClauses[] = "transaction_date >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00'), INTERVAL 1 MONTH) AND transaction_date < DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')";
        } elseif ($filterPeriod === 'this_year') {
            $whereClauses[] = "transaction_date >= DATE_FORMAT(NOW(), '%Y-01-01 00:00:00')";
        }

        if ($search !== '') {
            $whereClauses[] = "(reference LIKE ? OR description LIKE ? OR entity_name LIKE ? OR category LIKE ? OR notes LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereSql = count($whereClauses) > 0 ? "WHERE " . implode(" AND ", $whereClauses) : "";

        $stmt = $pdo->prepare("SELECT * FROM financial_ledger {$whereSql} ORDER BY transaction_date DESC, id DESC LIMIT 500");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cumulative running balance across full ledger
        $allTxStmt = $pdo->query("SELECT id, transaction_type, amount FROM financial_ledger ORDER BY transaction_date ASC, id ASC");
        $allTx = $allTxStmt->fetchAll(PDO::FETCH_ASSOC);
        $runningBalances = [];
        $runBal = 0;
        foreach ($allTx as $tx) {
            $amt = (float)$tx['amount'];
            if ($tx['transaction_type'] === 'income') {
                $runBal += $amt;
            } else {
                $runBal -= $amt;
            }
            $runningBalances[$tx['id']] = $runBal;
        }

        $formattedRows = array_map(function($r) use ($runningBalances) {
            $amt = (float)$r['amount'];
            $rBal = $runningBalances[$r['id']] ?? 0;
            return [
                'id' => (int)$r['id'],
                'transaction_type' => $r['transaction_type'],
                'category' => $r['category'],
                'amount' => $amt,
                'amount_formatted' => '₦' . number_format($amt, 2),
                'amount_signed' => ($r['transaction_type'] === 'income' ? '+₦' : '-₦') . number_format($amt, 2),
                'source' => $r['source'],
                'channel' => $r['channel'],
                'channel_label' => formatLedgerChannelLabel($r['channel']),
                'reference' => $r['reference'],
                'description' => $r['description'],
                'entity_type' => $r['entity_type'],
                'entity_name' => $r['entity_name'] ?: 'General',
                'entity_email' => $r['entity_email'] ?: '',
                'transaction_date' => $r['transaction_date'],
                'transaction_date_formatted' => date('d M Y, h:i A', strtotime($r['transaction_date'])),
                'running_balance' => $rBal,
                'running_balance_formatted' => ($rBal >= 0 ? '₦' : '-₦') . number_format(abs($rBal), 2),
                'notes' => $r['notes'] ?: '',
                'is_deletable' => ($r['source'] === 'manual_external')
            ];
        }, $rows);

        echo json_encode([
            'success' => true,
            'summary' => [
                'total_income' => $totIncome,
                'total_income_formatted' => '₦' . number_format($totIncome, 2),
                'total_expense' => $totExpense,
                'total_expense_formatted' => '₦' . number_format($totExpense, 2),
                'net_balance' => $netBalance,
                'net_balance_formatted' => ($netBalance >= 0 ? '₦' : '-₦') . number_format(abs($netBalance), 2),
                'net_status' => $netBalance >= 0 ? 'surplus' : 'deficit',
                'paystack_income' => (float)$rawSummary['paystack_income'],
                'paystack_income_formatted' => '₦' . number_format((float)$rawSummary['paystack_income'], 2),
                'external_income' => (float)$rawSummary['external_income'],
                'external_income_formatted' => '₦' . number_format((float)$rawSummary['external_income'], 2),
                'paystack_expense' => (float)$rawSummary['paystack_expense'],
                'paystack_expense_formatted' => '₦' . number_format((float)$rawSummary['paystack_expense'], 2),
                'external_expense' => (float)$rawSummary['external_expense'],
                'external_expense_formatted' => '₦' . number_format((float)$rawSummary['external_expense'], 2),
                'paystack_wallet_balance' => $walletBalance,
                'paystack_wallet_formatted' => '₦' . number_format($walletBalance, 2),
                'platform_income' => (float)$rawSummary['paystack_income'],
                'manual_income' => (float)$rawSummary['external_income'],
                'platform_expense' => (float)$rawSummary['paystack_expense'],
                'manual_expense' => (float)$rawSummary['external_expense'],
                'total_count' => (int)$rawSummary['total_count'],
                'total_transactions' => (int)$rawSummary['total_count'],
                'income_count' => (int)$rawSummary['income_count'],
                'expense_count' => (int)$rawSummary['expense_count']
            ],
            'filters' => [
                'type' => $filterType,
                'source' => $filterSource,
                'channel' => $filterChannel,
                'period' => $filterPeriod,
                'search' => $search
            ],
            'records' => $formattedRows,
            'paystack' => $paystackSettings
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error fetching financial ledger: ' . $e->getMessage()]);
    }
    exit;
}

// 2. ADD EXTERNAL / MANUAL FINANCIAL TRANSACTION (Admin Only)
if ($action === 'add_external_transaction') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can record external financial transactions.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $type = strtolower(trim($input['transaction_type'] ?? 'income'));
        if ($type !== 'income' && $type !== 'expense') $type = 'income';

        $category = trim($input['category'] ?? ($type === 'income' ? 'Miscellaneous Income' : 'General Operating Expense'));
        $amount = max(0, (float)($input['amount'] ?? 0));
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'A valid transaction amount greater than zero is required.']);
            exit;
        }

        $channel = trim($input['channel'] ?? 'cash');
        $validChannels = ['cash', 'pos', 'bank_transfer', 'cheque', 'other'];
        if (!in_array($channel, $validChannels)) $channel = 'cash';

        $ref = trim($input['reference'] ?? '');
        if (empty($ref)) {
            $prefix = ($type === 'income') ? 'EXT-REC-' : 'EXT-EXP-';
            $ref = $prefix . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        }

        $desc = trim($input['description'] ?? '');
        if (empty($desc)) {
            $desc = "External {$category} (" . ucfirst($channel) . ")";
        }

        $entityName = trim($input['entity_name'] ?? '');
        $entityEmail = trim($input['entity_email'] ?? '');
        $entityType = trim($input['entity_type'] ?? 'general');
        $notes = trim($input['notes'] ?? '');
        $txDate = !empty($input['transaction_date']) ? trim($input['transaction_date']) : date('Y-m-d H:i:s');

        // Check reference uniqueness
        $checkRef = $pdo->prepare("SELECT id FROM financial_ledger WHERE reference = ?");
        $checkRef->execute([$ref]);
        if ($checkRef->fetch()) {
            $ref .= '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        }

        $stmt = $pdo->prepare("
            INSERT INTO financial_ledger 
            (transaction_type, category, amount, source, channel, reference, description, entity_type, entity_name, entity_email, recorded_by_admin_id, transaction_date, notes)
            VALUES (?, ?, ?, 'manual_external', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $type,
            $category,
            $amount,
            $channel,
            $ref,
            $desc,
            $entityType,
            $entityName ?: 'General Payer/Beneficiary',
            $entityEmail,
            $user['id'],
            $txDate,
            $notes
        ]);

        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => "External " . ucfirst($type) . " of ₦" . number_format($amount, 2) . " recorded in the ledger successfully! (Ref: {$ref})",
            'id' => $newId,
            'transaction_id' => $newId,
            'reference' => $ref
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error adding external transaction: ' . $e->getMessage()]);
    }
    exit;
}

// 3. DELETE EXTERNAL TRANSACTION (Admin Only)
if ($action === 'delete_external_transaction') {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only administrators can delete ledger entries.']);
        exit;
    }

    try {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $id = (int)($input['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Valid transaction ID is required.']);
            exit;
        }

        $checkStmt = $pdo->prepare("SELECT id, source, reference, amount, transaction_type FROM financial_ledger WHERE id = ?");
        $checkStmt->execute([$id]);
        $row = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Transaction not found in ledger.']);
            exit;
        }

        if ($row['source'] !== 'manual_external') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Protected transaction: Platform Paystack transactions cannot be deleted. Only manual off-platform entries can be removed.']);
            exit;
        }

        $delStmt = $pdo->prepare("DELETE FROM financial_ledger WHERE id = ?");
        $delStmt->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => "Manual transaction ({$row['reference']}) of ₦" . number_format($row['amount'], 2) . " has been removed from the ledger."
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error deleting transaction: ' . $e->getMessage()]);
    }
    exit;
}

// ============================================================================
// 4. ACADEMIC SESSION & TERM CONFIGURATION
// ============================================================================
if ($action === 'update_academic_session') {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Only school administrators can update the academic session and term.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $term = trim($input['current_term'] ?? ($input['term'] ?? ''));
    $session = trim($input['academic_session'] ?? ($input['session'] ?? ''));
    $startDate = !empty($input['term_start_date']) ? trim($input['term_start_date']) : null;
    $endDate = !empty($input['term_end_date']) ? trim($input['term_end_date']) : null;

    if (empty($term) || empty($session)) {
        echo json_encode(['success' => false, 'message' => 'Both term (e.g. Term 1) and academic session (e.g. 2024/2025) are required.']);
        exit;
    }

    try {
        $adminId = $_SESSION['user']['id'] ?? null;
        $adminName = $_SESSION['user']['name'] ?? 'Admin';

        $stmt = $pdo->prepare("INSERT INTO school_academic_session (id, current_term, academic_session, term_start_date, term_end_date, updated_by)
            VALUES (1, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                current_term = VALUES(current_term),
                academic_session = VALUES(academic_session),
                term_start_date = VALUES(term_start_date),
                term_end_date = VALUES(term_end_date),
                updated_by = VALUES(updated_by)");
        $stmt->execute([$term, $session, $startDate, $endDate, $adminId]);

        // Audit log
        try {
            $logStmt = $pdo->prepare("INSERT INTO audit_logs (user_id, admin_name, action, details) VALUES (?, ?, ?, ?)");
            $logStmt->execute([
                $adminId,
                $adminName,
                'Updated Academic Session & Term',
                "Changed academic session to {$term} · {$session}"
            ]);
        } catch (Exception $ign) {}

        echo json_encode([
            'success' => true,
            'message' => 'Academic session and term updated successfully!',
            'academic_session' => [
                'current_term' => $term,
                'academic_session' => $session,
                'display_label' => "{$term} · {$session}",
                'term_start_date' => $startDate,
                'term_end_date' => $endDate
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update academic session: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
