<?php
/**
 * includes/student_verification_engine.php
 * Automated Student Payment Verification, ID Generation, and Email Activation Engine
 */

class StudentVerificationEngine {

    /**
     * Issues official Student ID, marks student verified and tuition cleared,
     * generates a secure single-use activation token, and dispatches the activation email.
     */
    public static function issueStudentIdAndSendActivation($pdo, $userId, $verifiedBy = 'system_automated', $amountPaid = null, $plan = 'monthly', $reference = null, $adminNotes = null) {
        $userId = (int)$userId;

        // 1. Fetch student
        $stStmt = $pdo->prepare("SELECT id, name, email, role, program, department, student_id, is_paid, is_verified FROM users WHERE id = ?");
        $stStmt->execute([$userId]);
        $student = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            return ['success' => false, 'message' => "Student record #{$userId} not found."];
        }

        // 2. Generate or confirm official Student ID (e.g. STU-0014)
        $studentId = !empty($student['student_id']) ? $student['student_id'] : ('STU-' . str_pad($userId, 4, '0', STR_PAD_LEFT));

        // 3. Generate secure activation token (64 hex characters)
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

        // Invalidate any older unused tokens for this student
        $invStmt = $pdo->prepare("UPDATE student_activations SET is_used = 1 WHERE user_id = ? AND is_used = 0");
        $invStmt->execute([$userId]);

        // Insert new activation token
        $tokStmt = $pdo->prepare("
            INSERT INTO student_activations (user_id, student_id, email, token, expires_at, is_used)
            VALUES (?, ?, ?, ?, ?, 0)
        ");
        $tokStmt->execute([$userId, $studentId, $student['email'], $token, $expiresAt]);

        // 4. Update student user record
        $paidUntil = date('Y-m-d H:i:s', strtotime('+30 days'));
        $upStmt = $pdo->prepare("
            UPDATE users 
            SET student_id = ?,
                is_verified = 1,
                is_paid = 1,
                status = 'active',
                verified_at = NOW(),
                verified_by = ?,
                paid_until = ?,
                payment_plan = ?
            WHERE id = ?
        ");
        $upStmt->execute([$studentId, $verifiedBy, $paidUntil, $plan, $userId]);

        // 5. Update any pending verification request
        try {
            $reqUp = $pdo->prepare("
                UPDATE student_verification_requests 
                SET status = 'verified', 
                    verified_by = ?, 
                    verified_at = NOW(),
                    admin_notes = COALESCE(?, admin_notes)
                WHERE user_id = ? AND status = 'pending'
            ");
            $reqUp->execute([$verifiedBy, $adminNotes, $userId]);
        } catch (Exception $e) {}

        // 6. Record in financial ledger if amount and reference provided
        $finalAmount = $amountPaid !== null ? (float)$amountPaid : 18000.00;
        $ref = !empty($reference) ? $reference : ('VERIF-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 12)));

        try {
            // Check if payment row exists
            $chkPay = $pdo->prepare("SELECT id FROM payments WHERE reference = ?");
            $chkPay->execute([$ref]);
            if (!$chkPay->fetch()) {
                $payIns = $pdo->prepare("
                    INSERT INTO payments (user_id, student_name, student_email, reference, plan, base_amount, discount_amount, amount_paid, status, payment_method, paid_until)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'success', 'verified_gateway', ?)
                ");
                $payIns->execute([$userId, $student['name'], $student['email'], $ref, $plan, $finalAmount, $finalAmount, $paidUntil]);
            }

            // Check financial ledger
            $chkLedger = $pdo->prepare("SELECT id FROM financial_ledger WHERE reference = ?");
            $chkLedger->execute([$ref]);
            if (!$chkLedger->fetch()) {
                $cat = 'Student Tuition (' . ucfirst($plan) . ')';
                $desc = "Tuition Fee Verification & Student ID Issuance - {$student['name']} ({$studentId})";
                $ledgerIns = $pdo->prepare("
                    INSERT INTO financial_ledger 
                    (transaction_type, category, amount, source, channel, reference, description, entity_type, entity_id, entity_name, entity_email, transaction_date, notes)
                    VALUES ('income', ?, ?, 'admissions_verification', 'admin_verified', ?, ?, 'student', ?, ?, ?, NOW(), ?)
                ");
                $ledgerIns->execute([
                    $cat,
                    $finalAmount,
                    $ref,
                    $desc,
                    $userId,
                    $student['name'],
                    $student['email'],
                    "Official Student ID: {$studentId} • Verified by: {$verifiedBy}"
                ]);
            }
        } catch (Exception $lex) {
            error_log("Verification ledger error: " . $lex->getMessage());
        }

        // 7. Construct Activation URL
        $cloudBackend = getenv('BACKEND_URL') ?: (getenv('RENDER_EXTERNAL_URL') ?: '');
        if (!empty($cloudBackend)) {
            $activationUrl = rtrim($cloudBackend, '/') . "/activate_student.php?token={$token}";
        } else {
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                       (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
            $protocol = $isHttps ? "https://" : "http://";
            $host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? ($_SERVER['HTTP_HOST'] ?? 'localhost');

            // Strip internal container ports (e.g. :10000) on cloud environments
            if (strpos($host, 'onrender.com') !== false || $isHttps) {
                $host = preg_replace('/:\d+$/', '', $host);
            }

            // Compute base web path dynamically
            $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '/');
            $scriptDir = str_replace('\\', '/', $scriptDir);
            $scriptDir = preg_replace('#/(api|scratch|cli|admin|includes)$#', '', $scriptDir);
            $basePath = rtrim($scriptDir, '/');

            $activationUrl = "{$protocol}{$host}{$basePath}/activate_student.php?token={$token}";
        }

        // 8. Build HTML Email
        $formattedAmount = '₦' . number_format($finalAmount, 2);
        $programTitle = (strtoupper($student['program'] ?? '') === 'JAMB') ? 'JAMB UTME Examination Track' : 'WAEC Senior High School Track';
        $deptTitle = ($student['department'] ?? 'Science') . ' Department';

        $subject = "Official Student ID & Portal Activation — {$studentId}";

        $messageBody = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Official Student ID & Account Activation</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f4f6f9; color:#1e293b; margin:0; padding:20px; }
  .email-container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 10px 25px rgba(0,0,0,0.05); }
  .email-header { background:linear-gradient(135deg, #0b2d4b, #1e3a5f); color:#ffffff; padding:28px 30px; text-align:center; }
  .email-header h1 { margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px; }
  .email-header p { margin:6px 0 0; font-size:13px; opacity:0.85; }
  .email-body { padding:32px 30px; }
  .greeting { font-size:18px; font-weight:750; color:#0f172a; margin-top:0; }
  .alert-box { background:rgba(16,185,129,0.08); border:1.5px solid rgba(16,185,129,0.3); border-radius:12px; padding:18px 20px; margin:20px 0; }
  .id-badge-container { text-align:center; margin:22px 0; padding:16px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:12px; }
  .id-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:750; margin-bottom:5px; }
  .id-value { font-size:28px; font-weight:900; color:#0284c7; letter-spacing:1px; font-family:monospace; }
  .meta-table { width:100%; border-collapse:collapse; margin:18px 0; font-size:14px; }
  .meta-table td { padding:8px 0; border-bottom:1px solid #f1f5f9; }
  .meta-table td:first-child { color:#64748b; font-weight:600; width:40%; }
  .meta-table td:last-child { color:#0f172a; font-weight:700; text-align:right; }
  .btn-action { display:block; text-align:center; background:linear-gradient(135deg, #0284c7, #2563eb); color:#ffffff !important; text-decoration:none; padding:15px 25px; border-radius:10px; font-weight:800; font-size:15px; margin:26px 0; box-shadow:0 4px 15px rgba(2,132,199,0.3); }
  .btn-action:hover { opacity:0.95; }
  .login-note { background:#f1f5f9; border-radius:10px; padding:14px 18px; font-size:13px; line-height:1.5; color:#475569; }
  .email-footer { padding:20px 30px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; text-align:center; line-height:1.5; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    <h1>Years Secondary School</h1>
    <p>Official Admissions & Payment Verification Office</p>
  </div>
  <div class="email-body">
    <h2 class="greeting">Hello, {$student['name']}!</h2>
    <p style="font-size:14px; line-height:1.55; color:#334155;">
      We are delighted to confirm that your tuition payment of <strong>{$formattedAmount}</strong> has been officially verified by school administration.
    </p>

    <div class="id-badge-container">
      <div class="id-label">YOUR OFFICIAL STUDENT IDENTIFICATION NUMBER</div>
      <div class="id-value">{$studentId}</div>
    </div>

    <table class="meta-table">
      <tr><td>Student Name:</td><td>{$student['name']}</td></tr>
      <tr><td>Registered Gmail:</td><td>{$student['email']}</td></tr>
      <tr><td>Academic Track:</td><td>{$programTitle}</td></tr>
      <tr><td>Department:</td><td>{$deptTitle}</td></tr>
      <tr><td>Verification Channel:</td><td>{$verifiedBy}</td></tr>
      <tr><td>Access Status:</td><td><strong style="color:#10b981;">Verified & Active</strong></td></tr>
    </table>

    <p style="font-size:14px; line-height:1.55; color:#334155;">
      To complete your registration and set your secure password, please click the button below. This activation link is unique to you and valid for 48 hours:
    </p>

    <a href="{$activationUrl}" class="btn-action" target="_blank">
      👉 Set Password & Activate Student Portal
    </a>

    <div class="login-note">
      <strong>🔑 Important Note on Logging In:</strong><br>
      Once your password has been set, your student portal login will <strong>only require your Student ID ({$studentId}) and your password</strong>. Please store your Student ID safely!
    </div>

    <p style="font-size:12px; color:#64748b; margin-top:20px;">
      If the button above does not work, copy and paste this URL into your browser:<br>
      <a href="{$activationUrl}" style="color:#0284c7; word-break:break-all;">{$activationUrl}</a>
    </p>
  </div>
  <div class="email-footer">
    Years Secondary School • Private Management Environment<br>
    This automated notification was generated by the School Admissions & Verification System.
  </div>
</div>
</body>
</html>
HTML;

        // 9. Dispatch Email via PHP mail()
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: Years Admissions <no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'school.edu') . '>',
            'Reply-To: admissions@' . ($_SERVER['HTTP_HOST'] ?? 'school.edu'),
            'X-Mailer: PHP/' . phpversion()
        ];
        $headersStr = implode("\r\n", $headers);

        $mailSent = false;
        try {
            $mailSent = @mail($student['email'], $subject, $messageBody, $headersStr);
        } catch (Exception $mex) {
            $mailSent = false;
        }

        // 10. Record in email_logs table
        $statusStr = $mailSent ? 'sent' : 'logged';
        try {
            $logStmt = $pdo->prepare("
                INSERT INTO email_logs 
                (recipient_email, recipient_name, recipient_id, subject, message_body, action_type, activation_link, status)
                VALUES (?, ?, ?, ?, ?, 'student_id_activation', ?, ?)
            ");
            $logStmt->execute([
                $student['email'],
                $student['name'],
                $studentId,
                $subject,
                $messageBody,
                $activationUrl,
                $statusStr
            ]);
        } catch (Exception $lex) {
            error_log("Email log error: " . $lex->getMessage());
        }

        // 11. Add to Admin / Paystack notifications
        try {
            $psStmt = $pdo->query("SELECT notifications FROM paystack_settings WHERE id = 1");
            $psRow = $psStmt->fetch(PDO::FETCH_ASSOC);
            $notifs = $psRow && !empty($psRow['notifications']) ? json_decode($psRow['notifications'], true) : [];
            if (!is_array($notifs)) $notifs = [];

            $adminAlert = [
                'id' => time(),
                'title' => "Student ID Issued: {$studentId}",
                'message' => "Payment verified ({$formattedAmount}) for {$student['name']} ({$student['email']}). Activation link dispatched to student's Gmail.",
                'type' => 'success',
                'date' => date('Y-m-d')
            ];
            array_unshift($notifs, $adminAlert);
            if (count($notifs) > 15) array_pop($notifs);

            $upPs = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
            $upPs->execute([json_encode($notifs)]);
        } catch (Exception $e) {}

        return [
            'success' => true,
            'user_id' => $userId,
            'student_id' => $studentId,
            'student_name' => $student['name'],
            'student_email' => $student['email'],
            'token' => $token,
            'activation_token' => $token,
            'activation_link' => $activationUrl,
            'email_sent' => $mailSent,
            'verified_by' => $verifiedBy,
            'amount_paid' => $finalAmount
        ];
    }

    /**
     * Records a verification failure or unsupported manual payment,
     * and notifies administration to inspect and verify manually from the Admin Portal.
     */
    public static function notifyAdminOfFailedVerification($pdo, $userId, $amount, $reference, $method = 'paystack', $failureReason = 'Automatic gateway verification failed', $proofNote = null) {
        $userId = (int)$userId;

        // Fetch student
        $stStmt = $pdo->prepare("SELECT id, name, email, program, department FROM users WHERE id = ?");
        $stStmt->execute([$userId]);
        $student = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            return ['success' => false, 'message' => "Student #{$userId} not found."];
        }

        $amt = (float)$amount > 0 ? (float)$amount : 18000.00;
        $ref = !empty($reference) ? trim($reference) : ('MANUAL-' . strtoupper(substr(md5(uniqid()), 0, 10)));
        $autoStatus = ($method === 'paystack') ? 'failed' : 'unsupported';

        // Check if request already recorded
        $chkStmt = $pdo->prepare("SELECT id FROM student_verification_requests WHERE user_id = ? AND status = 'pending'");
        $chkStmt->execute([$userId]);
        $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $up = $pdo->prepare("
                UPDATE student_verification_requests 
                SET amount = ?, 
                    payment_method = ?, 
                    payment_reference = ?, 
                    auto_failure_reason = ?, 
                    proof_note = ?,
                    created_at = NOW()
                WHERE id = ?
            ");
            $up->execute([$amt, $method, $ref, $failureReason, $proofNote, $existing['id']]);
            $reqId = $existing['id'];
        } else {
            $ins = $pdo->prepare("
                INSERT INTO student_verification_requests 
                (user_id, student_name, student_email, program, department, amount, payment_method, payment_reference, proof_note, status, auto_verification_status, auto_failure_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            ");
            $ins->execute([
                $userId,
                $student['name'],
                $student['email'],
                $student['program'] ?? 'WAEC',
                $student['department'] ?? 'Science',
                $amt,
                $method,
                $ref,
                $proofNote,
                $autoStatus,
                $failureReason
            ]);
            $reqId = (int)$pdo->lastInsertId();
        }

        // Post high-priority alert to Paystack notifications & audit logs
        try {
            $psStmt = $pdo->query("SELECT notifications FROM paystack_settings WHERE id = 1");
            $psRow = $psStmt->fetch(PDO::FETCH_ASSOC);
            $notifs = $psRow && !empty($psRow['notifications']) ? json_decode($psRow['notifications'], true) : [];
            if (!is_array($notifs)) $notifs = [];

            $formattedAmt = '₦' . number_format($amt, 2);
            $alert = [
                'id' => time(),
                'title' => "⚠️ Manual Verification Required: {$student['name']}",
                'message' => "Payment of {$formattedAmt} ({$method}) by {$student['name']} ({$student['email']}) requires manual verification. Reason: {$failureReason}. Reference: {$ref}.",
                'type' => 'warning',
                'date' => date('Y-m-d')
            ];
            array_unshift($notifs, $alert);
            if (count($notifs) > 15) array_pop($notifs);

            $upPs = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
            $upPs->execute([json_encode($notifs)]);
        } catch (Exception $e) {}

        return [
            'success' => true,
            'queued' => true,
            'request_id' => $reqId,
            'message' => 'Payment recorded. Administrator has been notified for manual verification.'
        ];
    }
}
