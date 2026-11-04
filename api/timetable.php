<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// Check authentication
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user = $_SESSION['user'];
$role = $user['role'] ?? 'student';

/**
 * Subject normalization for strict enrollment filtering
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

// Auto-migration & Schema Guarantee for class_schedules
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS class_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week VARCHAR(20) NOT NULL DEFAULT 'Monday',
        program VARCHAR(50) NOT NULL DEFAULT 'WAEC',
        department VARCHAR(50) NOT NULL DEFAULT 'Science',
        subject VARCHAR(100) NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        room VARCHAR(100) NOT NULL DEFAULT 'Online Class (Google Meet)',
        teacher_id INT NULL,
        teacher_name VARCHAR(100) NULL,
        meet_link VARCHAR(255) NULL,
        notification_message TEXT NULL,
        notification_date DATE NULL,
        notification_sent_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

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

    // Default Seed Data if table is empty
    $count = $pdo->query("SELECT COUNT(*) FROM class_schedules")->fetchColumn();
    if ($count == 0) {
        $tomorrowDate = date('Y-m-d', strtotime('+1 day'));
        $nowDatetime = date('Y-m-d H:i:s');

        $defaultSchedules = [
            ['Monday', 'WAEC', 'Science', 'Physics', '09:00 AM', '10:15 AM', 'Online Class (Google Meet)', 2, 'Teacher John', 'https://meet.google.com/phy-live-waec', 'Reminder: Physics class tomorrow at 09:00 AM. We will be discussing Newton Laws of Motion. Join via Google Meet.', $tomorrowDate, $nowDatetime],
            ['Monday', 'WAEC', 'Science', 'Mathematics', '10:30 AM', '11:45 AM', 'Science Hall 1', 1, 'System Administrator', 'https://meet.google.com/mth-core-2026', null, null, null],
            ['Tuesday', 'WAEC', 'Commercial', 'Economics', '09:00 AM', '10:15 AM', 'Online Class (Google Meet)', 3, 'Mrs. Ngozi', 'https://meet.google.com/eco-clas-waec', 'Reminder: Economics class tomorrow at 09:00 AM. Topic: Demand and Supply curves.', $tomorrowDate, $nowDatetime],
            ['Tuesday', 'WAEC', 'Science', 'Chemistry', '10:30 AM', '11:45 AM', 'Chemistry Lab Alpha', 2, 'Teacher John', 'https://meet.google.com/chm-lab-meet', null, null, null],
            ['Wednesday', 'WAEC', 'Science', 'English Language', '08:30 AM', '09:45 AM', 'Online Class (Google Meet)', 1, 'System Administrator', 'https://meet.google.com/eng-clas-waec', 'Reminder: English Language class tomorrow at 08:30 AM. Lexis and structure review.', $tomorrowDate, $nowDatetime],
            ['Wednesday', 'WAEC', 'Science', 'Biology', '10:00 AM', '11:15 AM', 'Biology Wing 3', 2, 'Teacher John', null, null, null, null],
            ['Thursday', 'WAEC', 'Science', 'Civic Education', '09:00 AM', '10:00 AM', 'Online Class (Google Meet)', 1, 'System Administrator', 'https://meet.google.com/civ-core-meet', null, null, null],
            ['Thursday', 'WAEC', 'Science', 'Further Mathematics', '10:30 AM', '11:45 AM', 'ICT Lab Beta', 1, 'System Administrator', null, null, null, null],
            ['Friday', 'WAEC', 'Science', 'Computer Studies', '09:00 AM', '10:15 AM', 'Computer Lab A', 1, 'System Administrator', 'https://meet.google.com/cpt-tech-room', null, null, null],
            ['Friday', 'WAEC', 'Science', 'Agricultural Science', '10:30 AM', '11:45 AM', 'Agric Field Station', 2, 'Teacher John', null, null, null, null]
        ];

        $ins = $pdo->prepare("INSERT INTO class_schedules (day_of_week, program, department, subject, start_time, end_time, room, teacher_id, teacher_name, meet_link, notification_message, notification_date, notification_sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($defaultSchedules as $ds) {
            $ins->execute($ds);
        }
    }
} catch (Exception $e) {
    // Continue if already set
}

/* ==========================================================================
   1. LIST SCHEDULES
   ========================================================================== */
if ($action === 'list_schedules') {
    try {
        $dayFilter        = trim($_GET['day'] ?? '');
        $deptFilter       = trim($_GET['department'] ?? '');
        $programFilter    = trim($_GET['program'] ?? '');
        $subjectFilter    = trim($_GET['subject'] ?? '');
        $staffOnly        = isset($_GET['staff_only']) && $_GET['staff_only'] === 'true';

        $sql = "SELECT * FROM class_schedules WHERE 1=1";
        $params = [];

        if (!empty($dayFilter) && $dayFilter !== 'all') {
            $sql .= " AND day_of_week = ?";
            $params[] = $dayFilter;
        }
        if (!empty($deptFilter) && $deptFilter !== 'all') {
            $sql .= " AND (department = ? OR department = 'All')";
            $params[] = $deptFilter;
        }
        if (!empty($programFilter) && $programFilter !== 'all') {
            $sql .= " AND (program = ? OR program = 'All')";
            $params[] = $programFilter;
        }
        if (!empty($subjectFilter) && $subjectFilter !== 'all') {
            $sql .= " AND subject = ?";
            $params[] = $subjectFilter;
        }

        $sql .= " ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $all = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Filter based on role
        if ($role === 'student') {
            // Strict subject filtering: Only subjects the student is enrolled in
            $studentSubjects = !empty($user['subjects']) ? json_decode($user['subjects'], true) : [];
            if (!is_array($studentSubjects) || empty($studentSubjects)) {
                $studentSubjects = ["Mathematics", "English Language", "Civic Education"];
            }

            $filtered = array_values(array_filter($all, function($s) use ($studentSubjects) {
                return isEnrolledSubject($s['subject'], $studentSubjects);
            }));

            echo json_encode([
                'success' => true,
                'data'    => $filtered,
                'total'   => count($filtered)
            ]);
            exit;
        }

        if ($role === 'staff' && $staffOnly) {
            // Staff member viewing only their taught classes
            $staffSubjects = !empty($user['subjects']) ? json_decode($user['subjects'], true) : [];
            if (!is_array($staffSubjects) && !empty($user['subjects'])) {
                $staffSubjects = [$user['subjects']];
            }

            $filtered = array_values(array_filter($all, function($s) use ($user, $staffSubjects) {
                if (!empty($s['teacher_id']) && (int)$s['teacher_id'] === (int)$user['id']) {
                    return true;
                }
                if (!empty($staffSubjects) && isEnrolledSubject($s['subject'], $staffSubjects)) {
                    return true;
                }
                return false;
            }));

            echo json_encode([
                'success' => true,
                'data'    => $filtered,
                'total'   => count($filtered)
            ]);
            exit;
        }

        // Admin (or staff viewing full school schedule)
        echo json_encode([
            'success' => true,
            'data'    => $all,
            'total'   => count($all)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   2. GET SINGLE SCHEDULE
   ========================================================================== */
if ($action === 'get_schedule') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid schedule ID required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM class_schedules WHERE id = ?");
        $stmt->execute([$id]);
        $schedule = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$schedule) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Schedule not found.']);
            exit;
        }

        echo json_encode(['success' => true, 'data' => $schedule]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   3. CREATE SCHEDULE (ADMIN ONLY)
   ========================================================================== */
if ($action === 'create_schedule') {
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Admin access required to create timetable.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $dayOfWeek  = trim($input['day_of_week'] ?? 'Monday');
    $subject    = trim($input['subject'] ?? '');
    $department = trim($input['department'] ?? 'Science');
    $program    = trim($input['program'] ?? 'WAEC');
    $startTime  = trim($input['start_time'] ?? '');
    $endTime    = trim($input['end_time'] ?? '');
    $room       = trim($input['room'] ?? 'Online Class (Google Meet)');
    $teacherId  = !empty($input['teacher_id']) ? (int)$input['teacher_id'] : null;
    $meetLink   = trim($input['meet_link'] ?? '');

    if (empty($subject) || empty($startTime) || empty($endTime)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Subject, start time, and end time are required.']);
        exit;
    }

    // Auto-clean meet link if provided
    if (!empty($meetLink) && !str_starts_with($meetLink, 'http://') && !str_starts_with($meetLink, 'https://')) {
        $meetLink = 'https://' . $meetLink;
    }

    // Find teacher name
    $teacherName = null;
    if ($teacherId > 0) {
        $tStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $tStmt->execute([$teacherId]);
        $teacherName = $tStmt->fetchColumn();
    }
    if (empty($teacherName) && !empty($input['teacher_name'])) {
        $teacherName = trim($input['teacher_name']);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO class_schedules (day_of_week, program, department, subject, start_time, end_time, room, teacher_id, teacher_name, meet_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $dayOfWeek,
            $program,
            $department,
            $subject,
            $startTime,
            $endTime,
            $room,
            $teacherId,
            $teacherName,
            !empty($meetLink) ? $meetLink : null
        ]);

        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Timetable class scheduled successfully.',
            'data'    => [
                'id'           => $newId,
                'day_of_week'  => $dayOfWeek,
                'subject'      => $subject,
                'department'   => $department,
                'program'      => $program,
                'start_time'   => $startTime,
                'end_time'     => $endTime,
                'room'         => $room,
                'teacher_id'   => $teacherId,
                'teacher_name' => $teacherName,
                'meet_link'    => $meetLink
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   4. EDIT SCHEDULE (ADMIN ONLY)
   ========================================================================== */
if ($action === 'edit_schedule') {
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Admin access required.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $id         = (int)($input['id'] ?? 0);
    $dayOfWeek  = trim($input['day_of_week'] ?? 'Monday');
    $subject    = trim($input['subject'] ?? '');
    $department = trim($input['department'] ?? 'Science');
    $program    = trim($input['program'] ?? 'WAEC');
    $startTime  = trim($input['start_time'] ?? '');
    $endTime    = trim($input['end_time'] ?? '');
    $room       = trim($input['room'] ?? 'Online Class (Google Meet)');
    $teacherId  = !empty($input['teacher_id']) ? (int)$input['teacher_id'] : null;
    $meetLink   = trim($input['meet_link'] ?? '');

    if ($id <= 0 || empty($subject) || empty($startTime) || empty($endTime)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid ID, subject, start time, and end time are required.']);
        exit;
    }

    if (!empty($meetLink) && !str_starts_with($meetLink, 'http://') && !str_starts_with($meetLink, 'https://')) {
        $meetLink = 'https://' . $meetLink;
    }

    $teacherName = null;
    if ($teacherId > 0) {
        $tStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $tStmt->execute([$teacherId]);
        $teacherName = $tStmt->fetchColumn();
    }
    if (empty($teacherName) && !empty($input['teacher_name'])) {
        $teacherName = trim($input['teacher_name']);
    }

    try {
        $stmt = $pdo->prepare("UPDATE class_schedules SET day_of_week = ?, program = ?, department = ?, subject = ?, start_time = ?, end_time = ?, room = ?, teacher_id = ?, teacher_name = ?, meet_link = ? WHERE id = ?");
        $stmt->execute([
            $dayOfWeek,
            $program,
            $department,
            $subject,
            $startTime,
            $endTime,
            $room,
            $teacherId,
            $teacherName,
            !empty($meetLink) ? $meetLink : null,
            $id
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Class timetable entry updated successfully.',
            'data'    => [
                'id'           => $id,
                'day_of_week'  => $dayOfWeek,
                'subject'      => $subject,
                'department'   => $department,
                'program'      => $program,
                'start_time'   => $startTime,
                'end_time'     => $endTime,
                'room'         => $room,
                'teacher_id'   => $teacherId,
                'teacher_name' => $teacherName,
                'meet_link'    => $meetLink
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   5. DELETE SCHEDULE (ADMIN ONLY)
   ========================================================================== */
if ($action === 'delete_schedule') {
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Admin access required.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid schedule ID required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM class_schedules WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Class schedule deleted successfully.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   6. SEND CLASS NOTIFICATION & GOOGLE MEET LINK (STAFF & ADMIN)
   ========================================================================== */
if ($action === 'send_notification') {
    if (!in_array($role, ['staff', 'admin'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $id          = (int)($input['id'] ?? 0);
    $meetLink    = trim($input['meet_link'] ?? '');
    $message     = trim($input['message'] ?? '');
    $remindDate  = trim($input['notification_date'] ?? date('Y-m-d', strtotime('+1 day')));

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid schedule ID required.']);
        exit;
    }

    // Auto-prefix meet link
    if (!empty($meetLink) && !str_starts_with($meetLink, 'http://') && !str_starts_with($meetLink, 'https://')) {
        $meetLink = 'https://' . $meetLink;
    }

    try {
        $sStmt = $pdo->prepare("SELECT * FROM class_schedules WHERE id = ?");
        $sStmt->execute([$id]);
        $schedule = $sStmt->fetch(PDO::FETCH_ASSOC);

        if (!$schedule) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Schedule not found.']);
            exit;
        }

        // If staff member, verify they teach this subject or are assigned
        if ($role === 'staff') {
            $staffSubjects = !empty($user['subjects']) ? json_decode($user['subjects'], true) : [];
            if (!is_array($staffSubjects) && !empty($user['subjects'])) {
                $staffSubjects = [$user['subjects']];
            }

            $isAssigned = ((int)($schedule['teacher_id'] ?? 0) === (int)$user['id']) || isEnrolledSubject($schedule['subject'], $staffSubjects);
            if (!$isAssigned) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You are only authorized to send notifications for classes you teach.']);
                exit;
            }
        }

        // Default reminder message if empty
        if (empty($message)) {
            $message = "Class Reminder: Tomorrow's {$schedule['subject']} class starts at {$schedule['start_time']}. Please join on time on Google Meet.";
        }

        // Update schedule with meet link, notification message, and timestamp
        $finalMeet = !empty($meetLink) ? $meetLink : $schedule['meet_link'];
        if (empty($finalMeet)) {
            $finalMeet = 'https://meet.google.com/new';
        }

        $upStmt = $pdo->prepare("UPDATE class_schedules SET meet_link = ?, notification_message = ?, notification_date = ?, notification_sent_at = NOW() WHERE id = ?");
        $upStmt->execute([$finalMeet, $message, $remindDate, $id]);

        echo json_encode([
            'success'   => true,
            'message'   => '1-day class notification and Google Meet link sent successfully to all enrolled students!',
            'meet_link' => $finalMeet,
            'data'      => [
                'id'                   => $id,
                'subject'              => $schedule['subject'],
                'start_time'           => $schedule['start_time'],
                'meet_link'            => $finalMeet,
                'notification_message' => $message,
                'notification_date'    => $remindDate,
                'notification_sent_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   7. UPDATE GOOGLE MEET LINK ONLY (STAFF & ADMIN)
   ========================================================================== */
if ($action === 'update_meet_link') {
    if (!in_array($role, ['staff', 'admin'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Staff or Admin access required.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int)($input['id'] ?? 0);
    $meetLink = trim($input['meet_link'] ?? '');

    if ($id <= 0 || empty($meetLink)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Schedule ID and Google Meet link are required.']);
        exit;
    }

    if (!str_starts_with($meetLink, 'http://') && !str_starts_with($meetLink, 'https://')) {
        $meetLink = 'https://' . $meetLink;
    }

    try {
        $stmt = $pdo->prepare("UPDATE class_schedules SET meet_link = ? WHERE id = ?");
        $stmt->execute([$meetLink, $id]);

        echo json_encode([
            'success'   => true,
            'message'   => 'Google Meet link updated successfully.',
            'meet_link' => $meetLink
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);

