<?php
require_once __DIR__ . '/cors.php';
/**
 * api/student_analytics.php
 * Personalized Academic Performance & Visual Analytics for O'Level Students
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json; charset=UTF-8');

if (empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in as a student.']);
    exit;
}

require_once __DIR__ . '/db.php';

$user = $_SESSION['user'];
$userId = (int)$user['id'];

try {
    // 1. Fetch fresh student profile data
    $uStmt = $pdo->prepare("SELECT id, name, email, role, program, department, subjects FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $student = $uStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Student record not found']);
        exit;
    }

    $program = !empty($student['program']) ? strtoupper(trim($student['program'])) : 'WAEC';
    if ($program !== 'JAMB') $program = 'WAEC';
    $department = !empty($student['department']) ? trim($student['department']) : 'Science';

    $subjects = !empty($student['subjects']) ? json_decode($student['subjects'], true) : [];
    if (!is_array($subjects) || empty($subjects)) {
        $subjects = ($program === 'JAMB')
            ? ["English Language", "Mathematics", "Physics", "Chemistry"]
            : ["Mathematics", "English Language", "Civic Education", "Biology", "Chemistry", "Physics"];
    }

    // Helper: Normalize subject names for strict matching
    $normSub = function($s) {
        $s = strtolower(trim((string)$s));
        $s = preg_replace('/\s*\(.*?\)/', '', $s);
        $s = preg_replace('/[^a-z0-9]/', '', $s);
        return $s;
    };

    $enrolledNormMap = [];
    foreach ($subjects as $sub) {
        $enrolledNormMap[$normSub($sub)] = $sub;
    }

    $isEnrolled = function($subject) use ($enrolledNormMap, $normSub) {
        $norm = $normSub($subject);
        if (isset($enrolledNormMap[$norm])) return true;
        foreach ($enrolledNormMap as $k => $orig) {
            if (strpos($norm, $k) !== false || strpos($k, $norm) !== false) return true;
        }
        return false;
    };

    // Helper: Parse numeric score from various formats (e.g. "85", "85/100", "42/50")
    $parseScore = function($scoreStr) {
        $s = trim((string)$scoreStr);
        if (empty($s)) return 0.0;
        if (preg_match('/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/', $s, $m)) {
            $num = (float)$m[1];
            $den = (float)$m[2];
            return $den > 0 ? round(($num / $den) * 100, 1) : 0.0;
        }
        $clean = preg_replace('/[^0-9.]/', '', $s);
        return is_numeric($clean) ? (float)$clean : 0.0;
    };

    // 2. Fetch all assignments strictly matching enrolled subjects
    $assignStmt = $pdo->prepare("SELECT a.id, a.title, a.subject, COALESCE(a.category, 'assignment') as category, a.due_date, a.created_at 
                                FROM assignments a 
                                ORDER BY a.created_at DESC");
    $assignStmt->execute();
    $rawAssignments = $assignStmt->fetchAll(PDO::FETCH_ASSOC);

    $enrolledAssignments = array_values(array_filter($rawAssignments, function($a) use ($isEnrolled) {
        return $isEnrolled($a['subject']);
    }));
    $totalAssignments = count($enrolledAssignments);

    // 3. Fetch student's graded submissions
    $subStmt = $pdo->prepare("SELECT s.id, s.assignment_id, s.score, s.grade, s.submitted_at, s.graded_at,
                                     a.subject, a.title, COALESCE(a.category, 'assignment') as category
                              FROM submissions s
                              JOIN assignments a ON s.assignment_id = a.id
                              WHERE s.student_id = ?");
    $subStmt->execute([$userId]);
    $studentSubmissions = $subStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Calculate Subject Mastery (scores strictly per enrolled subject)
    $subjectScoreBuckets = [];
    foreach ($subjects as $sub) {
        $subjectScoreBuckets[$sub] = [
            'subject' => $sub,
            'scores' => [],
            'count' => 0,
            'avg' => 0.0,
            'letter_grade' => 'N/A'
        ];
    }

    $asgnPoints = 0.0;
    $clswPoints = 0.0;
    $testPoints = 0.0;
    $examPoints = 0.0;
    $totalCourseworkScore = 0.0;
    $gradedCount = 0;
    $submittedAssignmentIds = [];

    foreach ($studentSubmissions as $sub) {
        $submittedAssignmentIds[$sub['assignment_id']] = true;
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

        if ($numScore > 0) {
            $totalCourseworkScore += $numScore;
            $gradedCount++;

            if ($cat === 'classwork') {
                $clswPoints += $numScore;
            } elseif ($cat === 'test') {
                $testPoints += $numScore;
            } elseif ($cat === 'exam') {
                $examPoints += $numScore;
            } else {
                $asgnPoints += $numScore;
            }

            // Find matching enrolled subject bucket
            foreach ($subjects as $enrSub) {
                if ($normSub($enrSub) === $normSub($sub['subject']) ||
                    strpos($normSub($sub['subject']), $normSub($enrSub)) !== false ||
                    strpos($normSub($enrSub), $normSub($sub['subject'])) !== false) {
                    $subjectScoreBuckets[$enrSub]['scores'][] = $numScore;
                    $subjectScoreBuckets[$enrSub]['count']++;
                    break;
                }
            }
        }
    }

    // Helper: O'Level letter grade
    $getOLevelGrade = function($pct) {
        if ($pct >= 75) return 'A1 (Distinction)';
        if ($pct >= 70) return 'B2 (Very Good)';
        if ($pct >= 65) return 'B3 (Good)';
        if ($pct >= 60) return 'C4 (Credit)';
        if ($pct >= 55) return 'C5 (Credit)';
        if ($pct >= 50) return 'C6 (Credit)';
        if ($pct >= 45) return 'D7 (Pass)';
        if ($pct >= 40) return 'E8 (Pass)';
        return 'F9 (Fail)';
    };

    $subjectMasteryList = [];
    foreach ($subjectScoreBuckets as $subName => $b) {
        $avg = (count($b['scores']) > 0) ? round(array_sum($b['scores']) / count($b['scores']), 1) : 0.0;
        $subjectMasteryList[] = [
            'subject' => $subName,
            'score' => $avg,
            'submissions_count' => $b['count'],
            'has_data' => count($b['scores']) > 0,
            'grade' => count($b['scores']) > 0 ? $getOLevelGrade($avg) : 'In Progress'
        ];
    }

    // 5. Attendance & Weekly Consistency
    $attStmt = $pdo->prepare("SELECT id, subject, date, status FROM attendance WHERE student_id = ? ORDER BY date ASC");
    $attStmt->execute([$userId]);
    $attendanceRows = $attStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalAttDays = count($attendanceRows);
    $presentDays = 0;
    $lateDays = 0;
    $absentDays = 0;

    // Day of week counts (1 = Monday, 5 = Friday)
    $dayBuckets = [
        'Monday'    => ['present' => 0, 'total' => 0],
        'Tuesday'   => ['present' => 0, 'total' => 0],
        'Wednesday' => ['present' => 0, 'total' => 0],
        'Thursday'  => ['present' => 0, 'total' => 0],
        'Friday'    => ['present' => 0, 'total' => 0]
    ];

    foreach ($attendanceRows as $row) {
        $st = strtolower($row['status'] ?? 'present');
        if ($st === 'present') $presentDays++;
        elseif ($st === 'late') $lateDays++;
        else $absentDays++;

        $dayName = date('l', strtotime($row['date']));
        if (isset($dayBuckets[$dayName])) {
            $dayBuckets[$dayName]['total']++;
            if ($st === 'present' || $st === 'late') {
                $dayBuckets[$dayName]['present']++;
            }
        }
    }

    $attendanceRate = ($totalAttDays > 0) ? round((($presentDays + ($lateDays * 0.5)) / $totalAttDays) * 100, 1) : 100.0;
    $attendancePoints = ($presentDays * 5) + ($lateDays * 2);

    $weeklyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    $weeklyPcts = [];
    $weeklyCounts = [];
    foreach ($weeklyDays as $day) {
        $t = $dayBuckets[$day]['total'];
        $p = $dayBuckets[$day]['present'];
        $weeklyCounts[] = $p;
        $weeklyPcts[] = ($t > 0) ? round(($p / $t) * 100) : ($p > 0 ? 100 : 85); // default active benchmark
    }

    // 6. 5-Pillar Academic Merit Totals for this student
    $totalMeritPoints = round($asgnPoints + $clswPoints + $testPoints + $examPoints + $attendancePoints, 1);

    // 7. Calculate Student's Rank on Program Leaderboard (WAEC or JAMB)
    $allTrackStudentsStmt = $pdo->prepare("SELECT id FROM users WHERE role = 'student' AND UPPER(COALESCE(program, 'WAEC')) = ?");
    $allTrackStudentsStmt->execute([$program]);
    $trackStudents = $allTrackStudentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all track submissions and attendance to determine relative ranking
    $allTrackSubStmt = $pdo->prepare("SELECT s.student_id, s.score, COALESCE(a.category, 'assignment') as category, a.title 
                                      FROM submissions s
                                      JOIN assignments a ON s.assignment_id = a.id
                                      JOIN users u ON s.student_id = u.id
                                      WHERE UPPER(COALESCE(u.program, 'WAEC')) = ?");
    $allTrackSubStmt->execute([$program]);
    $allTrackSubs = $allTrackSubStmt->fetchAll(PDO::FETCH_ASSOC);

    $allTrackAttStmt = $pdo->prepare("SELECT a.student_id, a.status 
                                      FROM attendance a
                                      JOIN users u ON a.student_id = u.id
                                      WHERE UPPER(COALESCE(u.program, 'WAEC')) = ?");
    $allTrackAttStmt->execute([$program]);
    $allTrackAtts = $allTrackAttStmt->fetchAll(PDO::FETCH_ASSOC);

    $studentScoreTotals = [];
    foreach ($trackStudents as $ts) {
        $studentScoreTotals[$ts['id']] = 0.0;
    }

    foreach ($allTrackSubs as $sub) {
        $sid = $sub['student_id'];
        if (isset($studentScoreTotals[$sid])) {
            $studentScoreTotals[$sid] += $parseScore($sub['score']);
        }
    }

    foreach ($allTrackAtts as $att) {
        $sid = $att['student_id'];
        if (isset($studentScoreTotals[$sid])) {
            $st = strtolower($att['status'] ?? 'present');
            if ($st === 'present') $studentScoreTotals[$sid] += 5;
            elseif ($st === 'late') $studentScoreTotals[$sid] += 2;
        }
    }

    arsort($studentScoreTotals);
    $myRank = 1;
    $rankIdx = 1;
    foreach ($studentScoreTotals as $sid => $pts) {
        if ($sid == $userId) {
            $myRank = $rankIdx;
            break;
        }
        $rankIdx++;
    }
    $totalTrackCandidates = count($studentScoreTotals);

    // 8. O'Level Exam Readiness Index calculation (0 - 100%)
    // - Assessment average (50%)
    // - Assignment submission rate (30%)
    // - Attendance rate (20%)
    $avgAssessmentScore = ($gradedCount > 0) ? ($totalCourseworkScore / $gradedCount) : 75.0; // Default baseline 75%
    $submissionRate = ($totalAssignments > 0) ? (count($submittedAssignmentIds) / $totalAssignments) * 100 : 100.0;
    $submissionRate = min(100.0, max(0.0, $submissionRate));

    $readinessScore = round(($avgAssessmentScore * 0.50) + ($submissionRate * 0.30) + ($attendanceRate * 0.20));
    $readinessScore = max(10, min(100, $readinessScore));

    $readinessCategory = 'Needs Practice';
    $readinessBadgeColor = '#ef4444';
    if ($readinessScore >= 80) {
        $readinessCategory = 'Distinction Pace (A1-B2)';
        $readinessBadgeColor = '#10b981';
    } elseif ($readinessScore >= 65) {
        $readinessCategory = 'Credit Pace (B3-C5)';
        $readinessBadgeColor = '#3b82f6';
    } elseif ($readinessScore >= 50) {
        $readinessCategory = 'Pass Pace (C6-E8)';
        $readinessBadgeColor = '#f59e0b';
    }

    // 9. Motivational Tip Curated for O'Level Candidates
    $motivationalTips = [
        "Consistent daily practice with past questions is the proven key to an A1 parallel in WAEC & 300+ in JAMB!",
        "Double-check your workings in Mathematics and English summary questions. Small margins make big distinctions!",
        "Mastering your core formulas and speed-reading gives you an edge over 90% of exam candidates.",
        "Your hard work today prepares the gateway to your dream university course. Keep your streak alive!",
        "Review your incorrect answers from CBT drills immediately. Every mistake corrected is an extra mark secured!"
    ];
    $selectedTip = $motivationalTips[array_rand($motivationalTips)];

    $pendingCount = 0;
    foreach ($enrolledAssignments as $a) {
        if (!isset($submittedAssignmentIds[$a['id']])) {
            $pendingCount++;
        }
    }

    echo json_encode([
        'success' => true,
        'student' => [
            'id' => $student['id'],
            'name' => $student['name'],
            'email' => $student['email'],
            'program' => $program,
            'department' => $department,
            'subjects' => $subjects
        ],
        'kpis' => [
            'enrolled_count' => count($subjects),
            'readiness_score' => $readinessScore,
            'readiness_category' => $readinessCategory,
            'readiness_color' => $readinessBadgeColor,
            'attendance_rate' => round($attendanceRate),
            'attendance_days' => $totalAttDays,
            'present_days' => $presentDays,
            'pending_assignments' => $pendingCount,
            'completed_assignments' => count($submittedAssignmentIds),
            'total_assignments' => $totalAssignments,
            'leaderboard_rank' => $myRank,
            'leaderboard_total' => $totalMeritPoints,
            'total_track_candidates' => $totalTrackCandidates
        ],
        'subject_mastery' => $subjectMasteryList,
        'exam_readiness' => [
            'overall' => $readinessScore,
            'category' => $readinessCategory,
            'color' => $readinessBadgeColor,
            'breakdown' => [
                'assessment_score' => round($avgAssessmentScore, 1),
                'assignment_completion' => round($submissionRate, 1),
                'attendance_consistency' => round($attendanceRate, 1)
            ]
        ],
        'weekly_attendance' => [
            'days' => $weeklyDays,
            'present_counts' => $weeklyCounts,
            'attendance_pcts' => $weeklyPcts
        ],
        'merit_breakdown' => [
            'assignments' => round($asgnPoints, 1),
            'classwork' => round($clswPoints, 1),
            'tests' => round($testPoints, 1),
            'exams' => round($examPoints, 1),
            'attendance' => round($attendancePoints, 1),
            'total' => $totalMeritPoints
        ],
        'motivational_tip' => $selectedTip
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error generating student analytics: ' . $e->getMessage()]);
}
