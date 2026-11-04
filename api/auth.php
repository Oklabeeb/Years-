<?php
// Enable display errors for debugging if needed during local development
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

function formatUserId($role, $id) {
    $prefix = ($role === 'student') ? 'STU' : (($role === 'staff') ? 'STF' : 'ADM');
    return $prefix . '-' . str_pad($id, 4, '0', STR_PAD_LEFT);
}

// Auto-migration & Schema Guarantee for Departments & Subjects
try {
    // 1. Restrict all departments to: Science, Commercial, Art
    $pdo->exec("UPDATE users SET department = 'Science' WHERE department = 'Vocational'");
    $pdo->exec("UPDATE class_schedules SET department = 'Science' WHERE department = 'Vocational'");

    // 2. Ensure existing JAMB students have exactly 4 clean academic subjects (no vocational)
    $jambStudents = $pdo->query("SELECT id, department, subjects FROM users WHERE role = 'student' AND UPPER(program) = 'JAMB'")->fetchAll(PDO::FETCH_ASSOC);
    $vocTradeList = [
        'Fashion Design and Garment Making', 'Livestock Farming', 'Beauty and Cosmetology',
        'Computer Hardware and GSM Repairs', 'Solar Photovoltaic Installation and Maintenance',
        'Horticulture and Crop Production', 'Data Processing', 'Computer Studies',
        'Animal Husbandry', 'Catering Craft Practice', 'Technical Drawing', 'Civic Education'
    ];
    foreach ($jambStudents as $js) {
        $subs = !empty($js['subjects']) ? json_decode($js['subjects'], true) : [];
        if (is_array($subs) && count($subs) > 4) {
            $clean = array_values(array_filter($subs, function($s) use ($vocTradeList) {
                return !in_array($s, $vocTradeList);
            }));
            if (!in_array('English Language', $clean)) {
                array_unshift($clean, 'English Language');
            }
            $clean4 = array_slice($clean, 0, 4);
            $up = $pdo->prepare("UPDATE users SET subjects = ? WHERE id = ?");
            $up->execute([json_encode(array_values($clean4)), $js['id']]);
        }
    }
} catch (Exception $e) {}

/* ==========================================================================
   1. CHECK ACTIVE SESSION
   ========================================================================== */
if ($action === 'check_session') {
    if (isset($_SESSION['user'])) {
        $role = $_SESSION['user']['role'] ?? 'student';
        $id = $_SESSION['user']['id'] ?? 1;

        // Refresh student payment status from database to enforce access lock
        if ($role === 'student') {
            try {
                $stPay = $pdo->prepare("SELECT is_paid, paid_until, payment_plan FROM users WHERE id = ?");
                $stPay->execute([$id]);
                $payInfo = $stPay->fetch(PDO::FETCH_ASSOC);
                if ($payInfo) {
                    $now = new DateTime();
                    $isPaidActive = false;
                    if (!empty($payInfo['paid_until'])) {
                        $isPaidActive = (new DateTime($payInfo['paid_until']) > $now);
                    } else if (!empty($payInfo['is_paid'])) {
                        $isPaidActive = true;
                    }
                    $_SESSION['user']['is_paid'] = $isPaidActive ? 1 : 0;
                    $_SESSION['user']['paid_until'] = $payInfo['paid_until'] ?? null;
                    $_SESSION['user']['payment_plan'] = $payInfo['payment_plan'] ?? null;
                }
            } catch (Exception $e) {}
        }

        // Refresh staff banking and salary from database
        if ($role === 'staff') {
            try {
                $stB = $pdo->prepare("SELECT bank_name, account_number, account_name, monthly_salary FROM users WHERE id = ?");
                $stB->execute([$id]);
                $bInfo = $stB->fetch(PDO::FETCH_ASSOC);
                if ($bInfo) {
                    $_SESSION['user']['bank_name'] = $bInfo['bank_name'] ?? null;
                    $_SESSION['user']['account_number'] = $bInfo['account_number'] ?? null;
                    $_SESSION['user']['account_name'] = $bInfo['account_name'] ?? null;
                    $_SESSION['user']['monthly_salary'] = (float)($bInfo['monthly_salary'] ?? 75000.00);
                }
            } catch (Exception $e) {}
        }

        $_SESSION['user']['formatted_id'] = formatUserId($role, $id);
        $_SESSION['user']['student_id']   = formatUserId('student', $id);
        $_SESSION['user']['staff_id']     = formatUserId('staff', $id);

        echo json_encode([
            'success'  => true,
            'loggedIn' => true,
            'user'     => $_SESSION['user']
        ]);
    } else {
        echo json_encode([
            'success'  => true,
            'loggedIn' => false,
            'user'     => null
        ]);
    }
    exit;
}

/* ==========================================================================
   2. LOGIN WITH CREDENTIALS
   ========================================================================== */
if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email    = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role     = trim($input['role'] ?? '');

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing email or password field.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => "No account found for email: {$email}"]);
            exit;
        }

        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Password hash verification failed.']);
            exit;
        }

        if (!empty($role) && strtolower($user['role']) !== strtolower($role)) {
            http_response_code(401);
            echo json_encode([
                'success' => false, 
                'message' => "Role mismatch: Account is '{$user['role']}', portal selected '{$role}'"
            ]);
            exit;
        }

        unset($user['password']);
        
        // Enforce student fee payment check
        if (strtolower($user['role'] ?? '') === 'student') {
            $now = new DateTime();
            $isPaidActive = false;
            if (!empty($user['paid_until'])) {
                $isPaidActive = (new DateTime($user['paid_until']) > $now);
            } else if (!empty($user['is_paid'])) {
                $isPaidActive = true;
            }
            $user['is_paid'] = $isPaidActive ? 1 : 0;
        }

        $user['formatted_id'] = formatUserId($user['role'] ?? 'student', $user['id']);
        $user['student_id']   = formatUserId('student', $user['id']);
        $user['staff_id']     = formatUserId('staff', $user['id']);
        $_SESSION['user'] = $user;
        echo json_encode(['success' => true, 'user' => $user]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   3. REGISTER / SIGNUP (STUDENT & ADMIN)
   ========================================================================== */
if ($action === 'register') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $name       = trim($input['name'] ?? '');
    $email      = trim($input['email'] ?? '');
    $password   = $input['password'] ?? '';
    $role       = strtolower(trim($input['role'] ?? 'student'));
    $program    = trim($input['program'] ?? 'WAEC');
    $department = trim($input['department'] ?? 'Science');
    $subjects   = $input['subjects'] ?? [];

    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Full name, email, and password are required.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
        exit;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
        exit;
    }

    if (!in_array($role, ['student', 'admin'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Registration is available for Student and Administrator accounts.']);
        exit;
    }

    try {
        $checkStmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        $subjectsJson = null;
        if ($role === 'student') {
            // Strictly 3 departments allowed: Science, Commercial, Art
            $validDepts = ['Science', 'Commercial', 'Art'];
            if (!in_array($department, $validDepts)) {
                $department = 'Science';
            }

            $isJamb = (strtoupper($program) === 'JAMB');

            $chosen = [];
            if (is_array($subjects)) {
                $chosen = $subjects;
            } elseif (is_string($subjects) && !empty($subjects)) {
                $decoded = json_decode($subjects, true);
                $chosen = is_array($decoded) ? $decoded : [$subjects];
            }

            $vocationalList = [
                'Data Processing', 'Computer Studies', 'Technical Drawing',
                'Catering Craft Practice', 'Fashion Design and Garment Making',
                'Livestock Farming', 'Beauty and Cosmetology',
                'Computer Hardware and GSM Repairs', 'Solar Photovoltaic Installation and Maintenance',
                'Horticulture and Crop Production', 'Animal Husbandry'
            ];

            if ($isJamb) {
                // JAMB: exactly 4 subjects combination, English Language is compulsory, NO vocational subjects
                $compulsory = ['English Language'];

                // Filter out vocational trade subjects and Civic Education
                $filteredChosen = array_values(array_filter($chosen, function($s) use ($vocationalList) {
                    return !in_array($s, $vocationalList) && $s !== 'Civic Education';
                }));

                $merged = array_values(array_unique(array_merge($compulsory, $filteredChosen)));

                // Supplement with departmental defaults if under 4
                if (count($merged) < 4) {
                    $deptDefaults = [
                        'Science' => ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Agricultural Science', 'Geography'],
                        'Commercial' => ['Mathematics', 'Economics', 'Commerce', 'Financial Accounting / Accounting', 'Government'],
                        'Art' => ['Literature-in-English', 'Government', 'Christian Religious Studies (CRS)', 'Nigerian History', 'Visual Art']
                    ];
                    $pool = $deptDefaults[$department] ?? $deptDefaults['Science'];
                    foreach ($pool as $extra) {
                        if (!in_array($extra, $merged) && count($merged) < 4) {
                            $merged[] = $extra;
                        }
                    }
                }

                // Keep exactly 4 subjects
                if (count($merged) > 4) {
                    $electives = array_values(array_diff($merged, $compulsory));
                    $merged = array_merge($compulsory, array_slice($electives, 0, 3));
                }

                $subjectsJson = json_encode($merged);
            } else {
                // WAEC: 11 subjects total, Maths, English, Civic compulsory, at least 1 vocational trade subject
                $compulsory = ['Mathematics', 'English Language', 'Civic Education'];

                $merged = array_values(array_unique(array_merge($compulsory, $chosen)));

                // Check if at least 1 vocational trade subject is included
                $hasVocational = false;
                foreach ($merged as $s) {
                    if (in_array($s, $vocationalList)) {
                        $hasVocational = true;
                        break;
                    }
                }
                if (!$hasVocational) {
                    $merged[] = 'Data Processing';
                }

                // Supplement with departmental defaults if under 11
                if (count($merged) < 11) {
                    $deptDefaults = [
                        'Science' => ['Biology', 'Chemistry', 'Physics', 'Agricultural Science', 'Further Mathematics', 'Geography', 'Health Education'],
                        'Commercial' => ['Economics', 'Financial Accounting / Accounting', 'Commerce', 'Marketing', 'Office Practice', 'Government'],
                        'Art' => ['Literature-in-English', 'Government', 'Nigerian History', 'Christian Religious Studies (CRS)', 'Islamic Studies (IRS)', 'French']
                    ];
                    $pool = $deptDefaults[$department] ?? $deptDefaults['Science'];
                    foreach ($pool as $extra) {
                        if (!in_array($extra, $merged) && count($merged) < 11) {
                            $merged[] = $extra;
                        }
                    }
                }

                // If still under 11, add from vocational list
                if (count($merged) < 11) {
                    foreach ($vocationalList as $v) {
                        if (!in_array($v, $merged) && count($merged) < 11) {
                            $merged[] = $v;
                        }
                    }
                }

                // Keep exactly 11 subjects (3 compulsory + 8 electives, with at least 1 vocational guaranteed)
                if (count($merged) > 11) {
                    $electives = array_values(array_diff($merged, $compulsory));
                    $vocs = array_values(array_intersect($electives, $vocationalList));
                    $nonVocs = array_values(array_diff($electives, $vocationalList));
                    $finalElectives = [];
                    if (!empty($vocs)) {
                        $finalElectives[] = $vocs[0]; // guarantee 1 vocational trade subject
                        $remainingPool = array_merge(array_slice($vocs, 1), $nonVocs);
                        $finalElectives = array_merge($finalElectives, array_slice($remainingPool, 0, 7));
                    } else {
                        $finalElectives = array_slice($electives, 0, 8);
                    }
                    $merged = array_merge($compulsory, array_slice($finalElectives, 0, 8));
                }

                $subjectsJson = json_encode($merged);
            }
        }

        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role, program, department, subjects) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $name,
            $email,
            $hashedPassword,
            $role,
            $role === 'student' ? $program : null,
            $role === 'student' ? $department : null,
            $subjectsJson
        ]);

        $userId = (int)$pdo->lastInsertId();
        $formattedId = formatUserId($role, $userId);
        $user = [
            'id'           => $userId,
            'formatted_id' => $formattedId,
            'student_id'   => formatUserId('student', $userId),
            'staff_id'     => formatUserId('staff', $userId),
            'name'         => $name,
            'email'        => $email,
            'role'         => $role,
            'program'      => $role === 'student' ? $program : null,
            'department'   => $role === 'student' ? $department : null,
            'subjects'     => $subjectsJson,
            'is_paid'      => 0,
            'paid_until'   => null,
            'payment_plan' => null
        ];

        $_SESSION['user'] = $user;

        echo json_encode([
            'success' => true,
            'user'    => $user,
            'message' => ucfirst($role) . ' account created successfully with ID: ' . $formattedId
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   4. LOGOUT
   ========================================================================== */
if ($action === 'logout') {
    $_SESSION = array();

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
    exit;
}

/* ==========================================================================
   5. LIST REGISTERED STUDENTS (ADMIN: ALL STUDENTS | STAFF: ONLY THEIR COURSE)
   ========================================================================== */
if ($action === 'list_students') {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
        exit;
    }

    $currentUser = $_SESSION['user'];
    $role = $currentUser['role'];

    if (!in_array($role, ['admin', 'staff'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden. Admin or Staff access required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, name, email, role, program, department, subjects, created_at FROM users WHERE role = 'student' ORDER BY name ASC");
        $stmt->execute();
        $allStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode subjects JSON for clean frontend presentation
        foreach ($allStudents as &$student) {
            $parsed = !empty($student['subjects']) ? json_decode($student['subjects'], true) : [];
            $student['subjects_list'] = is_array($parsed) ? $parsed : (!empty($student['subjects']) ? [$student['subjects']] : []);
            $student['student_id']    = formatUserId('student', $student['id']);
            $student['formatted_id']  = $student['student_id'];
        }
        unset($student);

        // 1. ADMIN: Returns ALL registered students with optional search/filters
        if ($role === 'admin') {
            $search = trim($_GET['search'] ?? '');
            $programFilter = trim($_GET['program'] ?? '');
            $deptFilter = trim($_GET['department'] ?? '');

            $filtered = array_values(array_filter($allStudents, function($st) use ($search, $programFilter, $deptFilter) {
                if (!empty($programFilter) && strcasecmp($st['program'] ?? '', $programFilter) !== 0) {
                    return false;
                }
                if (!empty($deptFilter) && strcasecmp($st['department'] ?? '', $deptFilter) !== 0) {
                    return false;
                }
                if (!empty($search)) {
                    $haystack = strtolower($st['name'] . ' ' . $st['email'] . ' ' . ($st['student_id'] ?? '') . ' ' . implode(' ', $st['subjects_list']));
                    if (strpos($haystack, strtolower($search)) === false) {
                        return false;
                    }
                }
                return true;
            }));

            echo json_encode([
                'success' => true,
                'scope'   => 'all',
                'total'   => count($allStudents),
                'count'   => count($filtered),
                'data'    => $filtered
            ]);
            exit;
        }

        // 2. STAFF: Returns ONLY students offering his or her course
        if ($role === 'staff') {
            // Determine the staff teacher's subject
            $staffSubject = trim($_GET['subject'] ?? '');
            
            if (empty($staffSubject)) {
                if (isset($currentUser['id'])) {
                    $staffStmt = $pdo->prepare("SELECT department, subjects FROM users WHERE id = ?");
                    $staffStmt->execute([$currentUser['id']]);
                    $freshStaff = $staffStmt->fetch(PDO::FETCH_ASSOC);
                    if ($freshStaff) {
                        $currentUser['department'] = $freshStaff['department'] ?? ($currentUser['department'] ?? '');
                        $currentUser['subjects']   = $freshStaff['subjects'] ?? ($currentUser['subjects'] ?? '');
                    }
                }

                if (!empty($currentUser['subjects'])) {
                    $decoded = json_decode($currentUser['subjects'], true);
                    if (is_array($decoded) && !empty($decoded)) {
                        $staffSubject = $decoded[0];
                    } elseif (is_string($currentUser['subjects'])) {
                        $staffSubject = $currentUser['subjects'];
                    }
                }
            }

            // Fallback default course if unassigned
            if (empty($staffSubject)) {
                $staffSubject = (($currentUser['department'] ?? '') === 'Commercial') ? 'Economics' : 'Physics';
            }

            // Filter for students whose subjects list contains the staff's course
            $courseStudents = array_values(array_filter($allStudents, function($st) use ($staffSubject) {
                $list = $st['subjects_list'] ?? [];
                $target = strtolower(trim($staffSubject));
                $targetClean = preg_replace('/[^a-z0-9]/', '', $target);

                foreach ($list as $sub) {
                    $item = strtolower(trim($sub));
                    if ($item === $target) {
                        return true;
                    }
                    $itemClean = preg_replace('/[^a-z0-9]/', '', $item);
                    if ($itemClean === $targetClean) {
                        return true;
                    }
                    if (strlen($targetClean) > 3 && (strpos($itemClean, $targetClean) !== false || strpos($targetClean, $itemClean) !== false)) {
                        return true;
                    }
                }
                return false;
            }));

            echo json_encode([
                'success'      => true,
                'scope'        => 'course',
                'staffSubject' => $staffSubject,
                'total'        => count($allStudents),
                'count'        => count($courseStudents),
                'data'         => $courseStudents
            ]);
            exit;
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   6. LIST STAFF ACCOUNTS (ADMIN ONLY)
   ========================================================================== */
if ($action === 'list_staff') {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, name, email, role, department, subjects, created_at FROM users WHERE role = 'staff' ORDER BY name ASC");
        $stmt->execute();
        $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($staff as &$s) {
            $parsed = !empty($s['subjects']) ? json_decode($s['subjects'], true) : [];
            $s['assigned_subject'] = is_array($parsed) ? ($parsed[0] ?? 'Unassigned') : ($s['subjects'] ?? 'Unassigned');
            $s['staff_id']         = formatUserId('staff', $s['id']);
            $s['formatted_id']     = $s['staff_id'];
        }
        unset($s);

        echo json_encode(['success' => true, 'data' => $staff]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

/* ==========================================================================
   7. CREATE STAFF ACCOUNT (ADMIN ONLY)
   ========================================================================== */
if ($action === 'create_staff') {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $name       = trim($input['name'] ?? '');
    $email      = trim($input['email'] ?? '');
    $password   = $input['password'] ?? 'StaffPass2026!';
    $department = trim($input['department'] ?? 'Science');
    $subject    = trim($input['subject'] ?? 'Mathematics');

    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Name and email are required.']);
        exit;
    }

    try {
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role, department, subjects) VALUES (?, ?, ?, "staff", ?, ?)');
        $stmt->execute([$name, $email, $hashedPassword, $department, json_encode([$subject])]);

        $newId = (int)$pdo->lastInsertId();
        $staffId = formatUserId('staff', $newId);

        echo json_encode([
            'success'  => true, 
            'staff_id' => $staffId,
            'message'  => 'Staff account created successfully for ' . $subject . ' teacher (ID: ' . $staffId . ').'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create account (Email may already exist).']);
    }
    exit;
}

/* ==========================================================================
   8. ISSUE STAFF ACCESS CODE (ADMIN ONLY)
   ========================================================================== */
if ($action === 'issue_staff_code') {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Staff email is required.']);
        exit;
    }

    try {
        $code = 'STF-' . strtoupper(bin2hex(random_bytes(3)));
        $stmt = $pdo->prepare('INSERT INTO staff_codes (email, code, is_used) VALUES (?, ?, 0)');
        $stmt->execute([$email, $code]);

        echo json_encode(['success' => true, 'code' => $code]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// Fallback for unknown action
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
