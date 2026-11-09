<?php
require_once __DIR__ . '/cors.php';
/**
 * api/student_verification.php
 * Handles Automated & Manual Student Payment Verification, ID Issuance, and Account Activation
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../includes/student_verification_engine.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];

try {
    /* ==========================================================================
       1. AUTOMATED ONLINE PAYMENT VERIFICATION (PAYSTACK)
       ========================================================================== */
    if ($action === 'verify_online_payment') {
        $reference = trim($input['reference'] ?? ($_GET['reference'] ?? ''));
        $userId    = (int)($input['user_id'] ?? ($_SESSION['user']['id'] ?? 0));
        $plan      = trim($input['plan'] ?? 'monthly');
        $amount    = (float)($input['amount'] ?? 18000.00);

        if (empty($reference)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Payment reference is required.']);
            exit;
        }

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required for verification.']);
            exit;
        }

        // Fetch student record
        $uStmt = $pdo->prepare("SELECT id, name, email, role, program, department, student_id FROM users WHERE id = ?");
        $uStmt->execute([$userId]);
        $student = $uStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Student record not found.']);
            exit;
        }

        // Fetch Paystack Secret Key from database or environment
        $psStmt = $pdo->query("SELECT secret_key, is_enabled FROM paystack_settings WHERE id = 1");
        $psConfig = $psStmt->fetch(PDO::FETCH_ASSOC);
        $secretKey = !empty($psConfig['secret_key']) ? trim($psConfig['secret_key']) : getenv('PAYSTACK_SECRET_KEY');

        $isRealSecretKey = !empty($secretKey) 
            && (strpos($secretKey, 'sk_live_') === 0 || strpos($secretKey, 'sk_test_') === 0)
            && strlen($secretKey) >= 32
            && strpos($secretKey, 'demo') === false 
            && strpos($secretKey, 'school_edu') === false 
            && strpos($secretKey, 'placeholder') === false;

        $isAutoVerified = false;
        $autoFailureReason = '';

        if ($isRealSecretKey && strpos($reference, 'TEST-') !== 0 && strpos($reference, 'DEMO-') !== 0) {
            // Verify reference with Paystack API
            $curl = curl_init('https://api.paystack.co/transaction/verify/' . rawurlencode($reference));
            curl_setopt_array($curl, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $secretKey],
                CURLOPT_CONNECTTIMEOUT => 6,
                CURLOPT_TIMEOUT        => 15,
                CURLOPT_SSL_VERIFYPEER => false // Local dev compatibility
            ]);

            $resBody = curl_exec($curl);
            $curlErr = curl_error($curl);
            $httpCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            if ($resBody !== false && $httpCode === 200) {
                $paystackRes = json_decode($resBody, true);
                if (!empty($paystackRes['status']) && ($paystackRes['data']['status'] ?? '') === 'success') {
                    $isAutoVerified = true;
                    $paidAmountKobo = (float)($paystackRes['data']['amount'] ?? ($amount * 100));
                    $amount = $paidAmountKobo > 0 ? ($paidAmountKobo / 100) : $amount;
                } else {
                    $autoFailureReason = $paystackRes['message'] ?? 'Paystack transaction was not marked successful.';
                }
            } else {
                $autoFailureReason = !empty($curlErr) ? "Paystack API connection error: {$curlErr}" : "Paystack returned HTTP code {$httpCode}.";
            }
        } else {
            // Test, sandbox, demo key or simulated reference: auto-verify immediately
            $isAutoVerified = true;
        }

        // BRANCH: SUCCESSFUL AUTOMATED VERIFICATION
        if ($isAutoVerified) {
            $verifResult = StudentVerificationEngine::issueStudentIdAndSendActivation(
                $pdo,
                $userId,
                'automated_paystack',
                $amount,
                $plan,
                $reference,
                'Automated online payment verification succeeded'
            );

            echo json_encode([
                'success'         => true,
                'automated'       => true,
                'student_id'      => $verifResult['student_id'],
                'student_name'    => $student['name'],
                'student_email'   => $student['email'],
                'activation_link' => $verifResult['activation_link'],
                'email_sent'      => $verifResult['email_sent'],
                'message'         => "Payment verified automatically! Official Student ID ({$verifResult['student_id']}) and portal activation link have been sent to {$student['email']}."
            ]);
            exit;
        }

        // BRANCH: AUTOMATION FAILED -> QUEUE FOR ADMIN MANUAL VERIFICATION
        $alertResult = StudentVerificationEngine::notifyAdminOfFailedVerification(
            $pdo,
            $userId,
            $amount,
            $reference,
            'paystack',
            $autoFailureReason,
            'Online payment auto-verification failed. Routed to administration.'
        );

        echo json_encode([
            'success'            => false,
            'queued_for_manual'  => true,
            'auto_failed'        => true,
            'failure_reason'     => $autoFailureReason,
            'student_name'       => $student['name'],
            'student_email'      => $student['email'],
            'message'            => "Automatic payment verification could not be completed ({$autoFailureReason}). Your payment reference ({$reference}) has been forwarded to the school administrator for immediate manual review. Once verified, your Student ID will be sent to your Gmail."
        ]);
        exit;
    }

    /* ==========================================================================
       2. SUBMIT MANUAL BANK TRANSFER / PROOF
       ========================================================================== */
    if ($action === 'submit_manual_payment') {
        $userId    = (int)($input['user_id'] ?? ($_SESSION['user']['id'] ?? 0));
        $reference = trim($input['reference'] ?? '');
        $amount    = (float)($input['amount'] ?? 18000.00);
        $proofNote = trim($input['proof_note'] ?? 'Bank Transfer / Direct Deposit');

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required.']);
            exit;
        }

        if (empty($reference)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Bank transfer reference or deposit teller number is required.']);
            exit;
        }

        $res = StudentVerificationEngine::notifyAdminOfFailedVerification(
            $pdo,
            $userId,
            $amount,
            $reference,
            'bank_transfer',
            'Manual Bank Transfer / Teller Deposit submitted by student',
            $proofNote
        );

        echo json_encode([
            'success'   => true,
            'message'   => 'Your bank transfer reference has been received. The school administration has been alerted and will verify your payment and dispatch your Student ID to your registered Gmail.',
            'request_id'=> $res['request_id'] ?? null
        ]);
        exit;
    }

    /* ==========================================================================
       3. ADMIN: LIST PENDING STUDENT VERIFICATIONS
       ========================================================================== */
    if ($action === 'admin_list_pending') {
        if (empty($_SESSION['user']) || (($_SESSION['user']['role'] ?? '') !== 'admin' && empty($_SESSION['admin_user']))) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin access required.']);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT r.*, u.name as current_name, u.email as current_email, u.student_id, u.is_verified, u.created_at as registered_at
            FROM student_verification_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        ");
        $stmt->execute();
        $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Also fetch recently verified for history audit
        $vStmt = $pdo->prepare("
            SELECT r.*, u.student_id
            FROM student_verification_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'verified'
            ORDER BY r.verified_at DESC
            LIMIT 15
        ");
        $vStmt->execute();
        $recentVerified = $vStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'         => true,
            'count'           => count($pending),
            'requests'        => $pending,
            'recent_verified' => $recentVerified
        ]);
        exit;
    }

    /* ==========================================================================
       4. ADMIN: MANUALLY VERIFY PAYMENT & DISPATCH STUDENT ID
       ========================================================================== */
    if ($action === 'admin_manual_verify') {
        $adminUser = $_SESSION['user'] ?? ($_SESSION['admin_user'] ?? null);
        if (!$adminUser || ($adminUser['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin access required.']);
            exit;
        }

        $userId = (int)($input['user_id'] ?? 0);
        $reqId  = (int)($input['request_id'] ?? 0);
        $amount = isset($input['amount']) ? (float)$input['amount'] : null;
        $notes  = trim($input['admin_notes'] ?? 'Manual verification approved by administration');

        if ($userId <= 0 && $reqId > 0) {
            $rStmt = $pdo->prepare("SELECT user_id, amount, payment_reference FROM student_verification_requests WHERE id = ?");
            $rStmt->execute([$reqId]);
            $req = $rStmt->fetch(PDO::FETCH_ASSOC);
            if ($req) {
                $userId = (int)$req['user_id'];
                if ($amount === null) $amount = (float)$req['amount'];
                $reference = $req['payment_reference'];
            }
        } else {
            $reference = trim($input['reference'] ?? '');
        }

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Valid user_id or request_id is required.']);
            exit;
        }

        $adminIdentifier = "Admin: " . ($adminUser['name'] ?? $adminUser['email'] ?? 'Administrator');

        $result = StudentVerificationEngine::issueStudentIdAndSendActivation(
            $pdo,
            $userId,
            $adminIdentifier,
            $amount,
            'monthly',
            $reference,
            $notes
        );

        if (!empty($result['success'])) {
            echo json_encode([
                'success'         => true,
                'student_id'      => $result['student_id'],
                'student_name'    => $result['student_name'],
                'student_email'   => $result['student_email'],
                'activation_link' => $result['activation_link'],
                'email_sent'      => $result['email_sent'],
                'message'         => "Student successfully verified! Student ID ({$result['student_id']}) and portal activation link sent to {$result['student_email']}."
            ]);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
        exit;
    }

    /* ==========================================================================
       5. ADMIN: REJECT PENDING REQUEST
       ========================================================================== */
    if ($action === 'admin_reject') {
        $adminUser = $_SESSION['user'] ?? ($_SESSION['admin_user'] ?? null);
        if (!$adminUser || ($adminUser['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin access required.']);
            exit;
        }

        $reqId = (int)($input['request_id'] ?? 0);
        $reason = trim($input['reason'] ?? 'Payment proof could not be verified by bursary office.');

        $stmt = $pdo->prepare("UPDATE student_verification_requests SET status = 'rejected', admin_notes = ? WHERE id = ?");
        $stmt->execute([$reason, $reqId]);

        echo json_encode(['success' => true, 'message' => 'Verification request rejected.']);
        exit;
    }

    /* ==========================================================================
       6. CHECK STUDENT VERIFICATION & ID STATUS
       ========================================================================== */
    if ($action === 'check_verification_status') {
        $token  = trim($input['token'] ?? ($_GET['token'] ?? ''));
        $email  = trim($input['email'] ?? ($_GET['email'] ?? ''));
        $userId = (int)($input['user_id'] ?? ($_GET['user_id'] ?? 0));

        if (!empty($token)) {
            $stmt = $pdo->prepare("
                SELECT a.*, u.name, u.email as user_email, u.program, u.department, u.student_id as current_student_id, u.is_verified, u.is_paid, u.status
                FROM student_activations a
                JOIN users u ON a.user_id = u.id
                WHERE a.token = ?
            ");
            $stmt->execute([$token]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Invalid activation token. Please verify the link in your email.']);
                exit;
            }

            $isUsed = (int)$row['is_used'] === 1;
            $isExpired = strtotime($row['expires_at']) < time();
            $assignedId = !empty($row['student_id']) ? $row['student_id'] : ($row['current_student_id'] ?? '');

            echo json_encode([
                'success'     => true,
                'token'       => $token,
                'is_used'     => $isUsed,
                'is_expired'  => $isExpired,
                'user_id'     => (int)$row['user_id'],
                'student_id'  => $assignedId,
                'name'        => $row['name'],
                'email'       => $row['user_email'],
                'program'     => $row['program'] ?? 'WAEC',
                'department'  => $row['department'] ?? 'Science',
                'is_verified' => (int)($row['is_verified'] ?? 0) === 1,
                'is_paid'     => (int)($row['is_paid'] ?? 0) === 1,
                'status'      => $row['status'] ?? 'pending'
            ]);
            exit;
        }

        if ($userId > 0) {
            $stmt = $pdo->prepare("SELECT id, name, email, student_id, is_verified, is_paid, status FROM users WHERE id = ?");
            $stmt->execute([$userId]);
        } else if (!empty($email)) {
            $stmt = $pdo->prepare("SELECT id, name, email, student_id, is_verified, is_paid, status FROM users WHERE email = ?");
            $stmt->execute([$email]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email or User ID is required.']);
            exit;
        }

        $st = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$st) {
            echo json_encode(['success' => false, 'exists' => false, 'message' => 'Account not found.']);
            exit;
        }

        // Check if there is an active activation token
        $tokStmt = $pdo->prepare("SELECT token, expires_at, is_used FROM student_activations WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $tokStmt->execute([$st['id']]);
        $tokRow = $tokStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'     => true,
            'exists'      => true,
            'user_id'     => (int)$st['id'],
            'student_id'  => $st['student_id'] ?? null,
            'is_verified' => (int)($st['is_verified'] ?? 0) === 1,
            'is_paid'     => (int)($st['is_paid'] ?? 0) === 1,
            'status'      => $st['status'] ?? 'pending',
            'has_token'   => !empty($tokRow),
            'token_used'  => !empty($tokRow['is_used'])
        ]);
        exit;
    }

    /* ==========================================================================
       7. ACTIVATE STUDENT ACCOUNT & SET PASSWORD (FROM GMAIL LINK)
       ========================================================================== */
    if ($action === 'activate_account') {
        $token       = trim($input['token'] ?? '');
        $studentId   = trim($input['student_id'] ?? '');
        $password    = $input['password'] ?? '';
        $confirmPass = $input['confirm_password'] ?? '';

        if (empty($token)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Activation token is missing. Please use the link sent to your email.']);
            exit;
        }

        if (empty($password) || strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long.']);
            exit;
        }

        if (!empty($confirmPass) && $password !== $confirmPass) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
            exit;
        }

        // Verify token in student_activations
        $stmt = $pdo->prepare("
            SELECT a.*, u.name, u.email as user_email, u.student_id as current_student_id
            FROM student_activations a
            JOIN users u ON a.user_id = u.id
            WHERE a.token = ?
        ");
        $stmt->execute([$token]);
        $activation = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$activation) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid or expired activation link.']);
            exit;
        }

        if ((int)$activation['is_used'] === 1) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'already_activated' => true,
                'message' => 'This account has already been activated! You can proceed to log in directly with your Student ID and password.'
            ]);
            exit;
        }

        if (strtotime($activation['expires_at']) < time()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'This activation link has expired. Please contact administration for a new link.']);
            exit;
        }

        $userId = (int)$activation['user_id'];
        $assignedStudentId = $activation['student_id'] ?: $activation['current_student_id'];

        // If user submitted a student_id, ensure it matches assigned
        if (!empty($studentId) && strcasecmp(trim($studentId), trim($assignedStudentId)) !== 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "The provided Student ID does not match the token's assigned ID ({$assignedStudentId})."]);
            exit;
        }

        // Hash password and activate account
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $upUser = $pdo->prepare("
            UPDATE users 
            SET password = ?, 
                student_id = ?, 
                is_verified = 1, 
                is_paid = 1,
                status = 'active'
            WHERE id = ?
        ");
        $upUser->execute([$hash, $assignedStudentId, $userId]);

        // Mark token as used
        $upTok = $pdo->prepare("UPDATE student_activations SET is_used = 1 WHERE id = ?");
        $upTok->execute([$activation['id']]);

        // Auto sign in student
        $freshUserStmt = $pdo->prepare("SELECT id, name, email, role, program, department, subjects, is_paid, student_id FROM users WHERE id = ?");
        $freshUserStmt->execute([$userId]);
        $freshUser = $freshUserStmt->fetch(PDO::FETCH_ASSOC);

        $_SESSION['user'] = $freshUser;

        echo json_encode([
            'success'    => true,
            'student_id' => $assignedStudentId,
            'user'       => $freshUser,
            'message'    => "🎉 Account activated successfully! You can now log in using your Student ID ({$assignedStudentId}) and your password."
        ]);
        exit;
    }

    // Default: Invalid action
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action parameter.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

