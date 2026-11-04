<?php
require_once __DIR__ . '/api/db.php';

$password = 'AdminSecure2026!';
$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    // Wipe existing test users and re-insert with PHP-generated hash
    $pdo->exec("DELETE FROM users WHERE email IN (
        'admin@school.com', 
        'staff@school.com', 
        'ngozi@school.com', 
        'student@school.com', 
        'chidi@school.com', 
        'fatima@school.com', 
        'emeka@school.com',
        'tunde@school.com'
    )");

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, program, department, subjects) VALUES (?, ?, ?, ?, ?, ?, ?)");

    // 1. Admin
    $stmt->execute(['System Admin', 'admin@school.com', $hash, 'admin', NULL, NULL, NULL]);

    // 2. Staff: Teacher John teaches Physics (Science)
    $stmt->execute(['Teacher John', 'staff@school.com', $hash, 'staff', NULL, 'Science', '["Physics"]']);

    // 3. Staff: Mrs. Ngozi teaches Economics (Commercial)
    $stmt->execute(['Mrs. Ngozi', 'ngozi@school.com', $hash, 'staff', NULL, 'Commercial', '["Economics"]']);

    // 4. Students (Each has 11 subjects: Mathematics, English Language, Civic Education + 8 department electives)
    // Ada Obi: Science student offering Physics (WAEC) - 11 Subjects
    $adaSubjects = json_encode([
        "Mathematics", "English Language", "Civic Education",
        "Physics", "Chemistry", "Biology", "Agricultural Science",
        "Further Mathematics", "Geography", "Health Education", "Computer Studies"
    ]);
    $stmt->execute(['Ada Obi', 'student@school.com', $hash, 'student', 'WAEC', 'Science', $adaSubjects]);

    // Chidi Eze: Science student offering Engineering/Science courses (JAMB) - 4 Subjects Combination
    $chidiSubjects = json_encode([
        "English Language", "Mathematics", "Physics", "Chemistry"
    ]);
    $stmt->execute(['Chidi Eze', 'chidi@school.com', $hash, 'student', 'JAMB', 'Science', $chidiSubjects]);

    // Fatima Bello: Commercial student offering Economics, Commerce (WAEC) - 11 Subjects
    $fatimaSubjects = json_encode([
        "Mathematics", "English Language", "Civic Education",
        "Economics", "Financial Accounting / Accounting", "Commerce", "Marketing",
        "Office Practice", "Government", "Data Processing", "Computer Studies"
    ]);
    $stmt->execute(['Fatima Bello', 'fatima@school.com', $hash, 'student', 'WAEC', 'Commercial', $fatimaSubjects]);

    // Emeka Okafor: Art student offering Literature, Government, CRS (JAMB) - 4 Subjects Combination
    $emekaSubjects = json_encode([
        "English Language", "Literature-in-English", "Government", "Christian Religious Studies (CRS)"
    ]);
    $stmt->execute(['Emeka Okafor', 'emeka@school.com', $hash, 'student', 'JAMB', 'Art', $emekaSubjects]);

    // Babatunde Lawal: Science student offering Technical Trade courses (WAEC) - 11 Subjects
    $tundeSubjects = json_encode([
        "Mathematics", "English Language", "Civic Education",
        "Physics", "Chemistry", "Biology", "Agricultural Science",
        "Further Mathematics", "Technical Drawing", "Computer Hardware and GSM Repairs", "Data Processing"
    ]);
    $stmt->execute(['Babatunde Lawal', 'tunde@school.com', $hash, 'student', 'WAEC', 'Science', $tundeSubjects]);

    // Ensure staff code table has an active code for Teacher John
    $pdo->exec("DELETE FROM staff_codes WHERE email IN ('staff@school.com', 'ngozi@school.com')");
    $codeStmt = $pdo->prepare("INSERT INTO staff_codes (email, code, is_used) VALUES (?, ?, 0)");
    $codeStmt->execute(['staff@school.com', 'STAFF-1234']);
    $codeStmt->execute(['ngozi@school.com', 'STAFF-5678']);

    // Seed sample resources if table is empty
    $countStmt = $pdo->query("SELECT COUNT(*) FROM resources");
    if ($countStmt->fetchColumn() == 0) {
        $resStmt = $pdo->prepare("INSERT INTO resources (type, subject, title, author, exam, year, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $resStmt->execute(['past_question', 'Mathematics', 'WAEC 2024 General Mathematics (Paper 1 & 2)', NULL, 'WAEC', '2024', 'uploads/resources/waec_math_2024.html']);
        $resStmt->execute(['past_question', 'Physics', 'JAMB UTME 2024 Physics CBT Comprehensive Practice', NULL, 'JAMB', '2024', 'uploads/resources/jamb_physics_2024.html']);
        $resStmt->execute(['past_question', 'English Language', 'WAEC 2023 English Language Comprehension & Lexis', NULL, 'WAEC', '2023', 'uploads/resources/waec_math_2024.html']);
        $resStmt->execute(['past_question', 'Chemistry', 'JAMB UTME 2023 Chemistry Practice Paper', NULL, 'JAMB', '2023', 'uploads/resources/jamb_physics_2024.html']);
        $resStmt->execute(['textbook', 'Physics', 'New School Physics for Senior Secondary Schools', 'M.W. Anyakoha, Ph.D.', NULL, NULL, 'uploads/resources/new_school_physics.html']);
        $resStmt->execute(['textbook', 'Mathematics', 'New General Mathematics for SS3', 'M.F. Macrae et al.', NULL, NULL, 'uploads/resources/waec_math_2024.html']);
    }

    // Ensure file_path column exists in assignments
    try {
        $pdo->query("SELECT file_path FROM assignments LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE assignments ADD COLUMN file_path VARCHAR(255) NULL AFTER description");
    }

    // Ensure file_path column exists in submissions
    try {
        $pdo->query("SELECT file_path FROM submissions LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE submissions ADD COLUMN file_path VARCHAR(255) NULL AFTER student_id");
    }

    // Re-seed sample assignments across multiple subjects to thoroughly test subject filtering
    $pdo->exec("DELETE FROM assignments WHERE title LIKE '%Week 4%' OR title LIKE '%Algebraic%' OR title LIKE '%Economics%' OR title LIKE '%Government%'");
    
    $teacherJohnId = $pdo->query("SELECT id FROM users WHERE email = 'staff@school.com'")->fetchColumn();
    $mrsNgoziId    = $pdo->query("SELECT id FROM users WHERE email = 'ngozi@school.com'")->fetchColumn();
    $adminId       = $pdo->query("SELECT id FROM users WHERE email = 'admin@school.com'")->fetchColumn();

    $insAssign = $pdo->prepare("INSERT INTO assignments (subject, title, description, file_path, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?)");

    if ($teacherJohnId) {
        // Physics Assignment (Offers: Ada Obi, Chidi Eze)
        $insAssign->execute([
            'Physics', 
            'Week 4: Newton\'s Laws & Linear Momentum', 
            "Solve all practice problems from Chapter 3. Show complete working for Questions 1 through 10, including calculations of force, impulse, and conservation of linear momentum.",
            'uploads/resources/new_school_physics.html',
            date('Y-m-d', strtotime('+7 days')),
            $teacherJohnId
        ]);

        // Mathematics Assignment (Core Compulsory: All students offer this)
        $insAssign->execute([
            'Mathematics',
            'Algebraic Fractions & Quadratic Equations Worksheet',
            "Refer to the attached practice worksheet. Complete all exercises on Section B and write your answers in the submission box below.",
            'uploads/resources/waec_math_2024.html',
            date('Y-m-d', strtotime('+5 days')),
            $teacherJohnId
        ]);
    }

    if ($mrsNgoziId) {
        // Economics Assignment (Offers: Fatima Bello. Ada Obi and Emeka do NOT offer this!)
        $insAssign->execute([
            'Economics',
            'Economics Week 3: Elasticity of Demand & Market Equilibrium',
            "Calculate price elasticity of demand using the provided schedules. Explain the determinants of price elasticity and graph the equilibrium price shift.",
            NULL,
            date('Y-m-d', strtotime('+6 days')),
            $mrsNgoziId
        ]);
    }

    if ($adminId) {
        // Government Assignment (Offers: Emeka Okafor. Ada Obi and Fatima do NOT offer this!)
        $insAssign->execute([
            'Government',
            'Government: Structure and Functions of the Arms of Government in Nigeria',
            "Compare the parliamentary and presidential systems of government. Highlight checks and balances under the 1999 Constitution of Nigeria.",
            NULL,
            date('Y-m-d', strtotime('+4 days')),
            $adminId
        ]);
    }

    // Seed sample class schedules across departments
    $pdo->exec("DELETE FROM class_schedules");
    $schedStmt = $pdo->prepare("INSERT INTO class_schedules (program, department, subject, schedule_date, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    // Physics (Science)
    $schedStmt->execute(['WAEC', 'Science', 'Physics', date('Y-m-d'), '08:30:00', '09:45:00', 'Physics Lab']);
    $schedStmt->execute(['JAMB', 'Science', 'Chemistry', date('Y-m-d'), '10:00:00', '11:15:00', 'Chem Lab']);
    // Mathematics (Core)
    $schedStmt->execute(['WAEC', 'Science', 'Mathematics', date('Y-m-d'), '11:30:00', '12:45:00', 'Hall A']);
    // Economics (Commercial)
    $schedStmt->execute(['WAEC', 'Commercial', 'Economics', date('Y-m-d'), '08:30:00', '09:45:00', 'Room 2B']);
    // Government (Art)
    $schedStmt->execute(['WAEC', 'Art', 'Government', date('Y-m-d'), '08:30:00', '09:45:00', 'Room 1A']);

    echo "<h3>Database Seeded Successfully!</h3>";
    echo "<p>Password for all seed users: <strong>AdminSecure2026!</strong></p>";
    echo "<ul>";
    echo "<li><strong>Admin:</strong> admin@school.com</li>";
    echo "<li><strong>Physics Teacher:</strong> staff@school.com (Code: STAFF-1234, Assigned: Physics)</li>";
    echo "<li><strong>Economics Teacher:</strong> ngozi@school.com (Code: STAFF-5678, Assigned: Economics)</li>";
    echo "<li><strong>Ada Obi (Science):</strong> student@school.com (Offers Physics, Maths, Chemistry, etc. - NEVER sees Economics or Government updates)</li>";
    echo "<li><strong>Fatima Bello (Commercial):</strong> fatima@school.com (Offers Economics, Maths, Commerce, etc. - NEVER sees Physics or Government updates)</li>";
    echo "<li><strong>Emeka Okafor (Art):</strong> emeka@school.com (Offers Government, Literature, Maths, etc. - NEVER sees Physics or Economics updates)</li>";
    echo "</ul>";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
