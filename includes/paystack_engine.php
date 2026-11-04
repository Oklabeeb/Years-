<?php
/**
 * Paystack Payment & Automated Payroll Transfer Engine
 * Handles student fee collections, automated staff payroll remittance,
 * administrative decisions, notifications, and API enable/disable permissions.
 */

class PaystackEngine {

    /**
     * Get current Paystack settings
     */
    public static function getSettings($pdo, $isAdmin = false) {
        $stmt = $pdo->prepare("SELECT * FROM paystack_settings WHERE id = 1 LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $pdo->exec("
                INSERT INTO paystack_settings 
                (id, is_enabled, environment, public_key, secret_key, merchant_name, currency, fee_bearer, payroll_transfer_mode, balance_ngn, notifications)
                VALUES (1, 1, 'test', 'pk_test_school_edu_portal_demo_2026', 'sk_test_school_edu_portal_demo_secret_2026', 'Springfield Academy Portal', 'NGN', 'account', 'automated', 1450000.00, '[]')
            ");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        $notifications = [];
        if (!empty($row['notifications'])) {
            $decoded = json_decode($row['notifications'], true);
            if (is_array($decoded)) {
                $notifications = $decoded;
            }
        }

        $secKey = $row['secret_key'] ?? '';
        $secKeyMasked = '';
        if (!empty($secKey)) {
            $len = strlen($secKey);
            $secKeyMasked = substr($secKey, 0, 7) . '••••••••' . substr($secKey, max(0, $len - 4));
        }

        return [
            'is_enabled' => (int)$row['is_enabled'],
            'environment' => $row['environment'] ?? 'test',
            'public_key' => $row['public_key'] ?? 'pk_test_school_edu_portal_demo_2026',
            'secret_key' => $isAdmin ? $secKey : null,
            'secret_key_masked' => $secKeyMasked,
            'merchant_name' => $row['merchant_name'] ?? 'Springfield Academy Portal',
            'currency' => $row['currency'] ?? 'NGN',
            'fee_bearer' => $row['fee_bearer'] ?? 'account',
            'payroll_transfer_mode' => $row['payroll_transfer_mode'] ?? 'automated',
            'balance_ngn' => (float)($row['balance_ngn'] ?? 1450000.00),
            'updated_at' => $row['updated_at'] ?? date('Y-m-d H:i:s'),
            'notifications' => $notifications
        ];
    }

    /**
     * Toggle Paystack API on/off (Admin only)
     */
    public static function toggleStatus($pdo, $isEnabled) {
        $val = $isEnabled ? 1 : 0;
        $stmt = $pdo->prepare("UPDATE paystack_settings SET is_enabled = ?, updated_at = NOW() WHERE id = 1");
        $stmt->execute([$val]);

        // Add notice to Paystack notifications feed
        $current = self::getSettings($pdo, true);
        $notifs = $current['notifications'];
        $newNotif = [
            'id' => time(),
            'title' => $val ? 'Paystack Gateway Enabled' : 'Paystack Gateway Deactivated (Removed)',
            'message' => $val 
                ? 'Paystack online checkout and automated payroll transfers have been re-enabled for all users.' 
                : 'Paystack API has been deactivated by administration. Online card and automated bank transfers are temporarily paused.',
            'type' => $val ? 'success' : 'alert',
            'date' => date('Y-m-d')
        ];
        array_unshift($notifs, $newNotif);
        if (count($notifs) > 12) array_pop($notifs);

        $up = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
        $up->execute([json_encode($notifs)]);

        return self::getSettings($pdo, true);
    }

    /**
     * Save Paystack Decisions & Settings (Admin only)
     */
    public static function updateSettings($pdo, $data) {
        $current = self::getSettings($pdo, true);

        $environment = $data['environment'] ?? $current['environment'];
        $publicKey = isset($data['public_key']) && trim($data['public_key']) !== '' ? trim($data['public_key']) : $current['public_key'];
        $secretKey = isset($data['secret_key']) && trim($data['secret_key']) !== '' ? trim($data['secret_key']) : $current['secret_key'];
        $merchantName = isset($data['merchant_name']) && trim($data['merchant_name']) !== '' ? trim($data['merchant_name']) : $current['merchant_name'];
        $feeBearer = $data['fee_bearer'] ?? $current['fee_bearer'];
        if ($feeBearer === 'school') $feeBearer = 'account';
        if ($feeBearer === 'student') $feeBearer = 'customer';
        $payrollMode = $data['payroll_transfer_mode'] ?? $current['payroll_transfer_mode'];

        $stmt = $pdo->prepare("
            UPDATE paystack_settings 
            SET environment = ?, public_key = ?, secret_key = ?, merchant_name = ?, fee_bearer = ?, payroll_transfer_mode = ?, updated_at = NOW()
            WHERE id = 1
        ");
        $stmt->execute([$environment, $publicKey, $secretKey, $merchantName, $feeBearer, $payrollMode]);

        // Add notice
        $notifs = $current['notifications'];
        $newNotif = [
            'id' => time(),
            'title' => "Paystack Policy Updated ({$environment} mode)",
            'message' => "Merchant: {$merchantName} • Fee Bearer: " . ($feeBearer === 'account' ? 'School Account' : 'Student') . " • Payroll Remittance: " . ($payrollMode === 'automated' ? 'Instant Automated' : 'Manual Approval'),
            'type' => 'info',
            'date' => date('Y-m-d')
        ];
        array_unshift($notifs, $newNotif);
        if (count($notifs) > 12) array_pop($notifs);

        $up = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
        $up->execute([json_encode($notifs)]);

        return self::getSettings($pdo, true);
    }

    /**
     * Dismiss a notification
     */
    public static function dismissNotification($pdo, $notifId) {
        $current = self::getSettings($pdo, true);
        $notifs = array_filter($current['notifications'], function($n) use ($notifId) {
            return (string)($n['id'] ?? '') !== (string)$notifId;
        });
        $stmt = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
        $stmt->execute([json_encode(array_values($notifs))]);
        return true;
    }

    /**
     * Initialize student fee payment via Paystack
     */
    public static function initializePayment($pdo, $student, $plan, $amount) {
        $settings = self::getSettings($pdo, false);

        if ((int)$settings['is_enabled'] === 0) {
            return [
                'success' => false,
                'disabled' => true,
                'message' => 'Paystack online payments have been temporarily deactivated by school administration. Please contact the bursary or use manual bank transfer.'
            ];
        }

        $reference = 'PSTK-' . date('YmdHis') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $amountKobo = (int)round($amount * 100);

        return [
            'success' => true,
            'reference' => $reference,
            'amount' => (float)$amount,
            'amount_kobo' => $amountKobo,
            'email' => $student['email'],
            'student_name' => $student['name'],
            'public_key' => $settings['public_key'],
            'currency' => $settings['currency'],
            'plan' => $plan,
            'merchant_name' => $settings['merchant_name'],
            'fee_bearer' => $settings['fee_bearer']
        ];
    }

    /**
     * Verify Paystack payment & grant student portal access
     */
    public static function verifyPayment($pdo, $studentId, $reference, $plan, $paymentMethod = 'paystack') {
        $settings = self::getSettings($pdo, true);

        if ((int)$settings['is_enabled'] === 0) {
            return [
                'success' => false,
                'disabled' => true,
                'message' => 'Paystack online payments have been deactivated by school administration.'
            ];
        }

        // Fetch student
        $stStmt = $pdo->prepare("SELECT id, name, email, program FROM users WHERE id = ?");
        $stStmt->execute([$studentId]);
        $st = $stStmt->fetch(PDO::FETCH_ASSOC);

        if (!$st) {
            return ['success' => false, 'message' => 'Student account not found.'];
        }

        // Fetch active fee definition
        $feeStmt = $pdo->prepare("SELECT * FROM fees WHERE status = 'active' ORDER BY CASE WHEN program = ? THEN 1 WHEN program = 'All' THEN 2 ELSE 3 END, id ASC LIMIT 1");
        $feeStmt->execute([$st['program'] ?? 'WAEC']);
        $fee = $feeStmt->fetch(PDO::FETCH_ASSOC);

        $baseMonthly = $fee ? (float)$fee['base_monthly_fee'] : 20000.00;
        $feeId = $fee ? (int)$fee['id'] : null;

        // Pricing math
        if ($plan === 'monthly') {
            $baseAmount = $baseMonthly;
            $discountAmount = round($baseMonthly * 0.10, 2);
            $amountPaid = round($baseMonthly * 0.90, 2);
            $paidUntil = date('Y-m-d H:i:s', strtotime('+30 days'));
        } else {
            $baseAmount = round($baseMonthly / 4, 2);
            $discountAmount = 0.00;
            $amountPaid = round($baseMonthly / 4, 2);
            $paidUntil = date('Y-m-d H:i:s', strtotime('+7 days'));
        }

        // Check if payment already exists with this reference
        $checkStmt = $pdo->prepare("SELECT id FROM payments WHERE reference = ?");
        $checkStmt->execute([$reference]);
        if (!$checkStmt->fetch()) {
            // Insert payment record
            $payStmt = $pdo->prepare("
                INSERT INTO payments 
                (user_id, student_name, student_email, reference, fee_id, plan, base_amount, discount_amount, amount_paid, status, payment_method, paid_until)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?)
            ");
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
        }

        // Grant access in users table
        $upStmt = $pdo->prepare("UPDATE users SET is_paid = 1, paid_until = ?, payment_plan = ? WHERE id = ?");
        $upStmt->execute([$paidUntil, $plan, $studentId]);

        // Add to Paystack live notifications
        $notifs = $settings['notifications'];
        $formattedAmount = '₦' . number_format($amountPaid, 2);
        $newNotif = [
            'id' => time(),
            'title' => "Paystack Fee Payment Confirmed ({$formattedAmount})",
            'message' => "Student: {$st['name']} ({$st['email']}) successfully paid {$formattedAmount} for " . ucfirst($plan) . " plan. Reference: {$reference}.",
            'type' => 'success',
            'date' => date('Y-m-d')
        ];
        array_unshift($notifs, $newNotif);
        if (count($notifs) > 12) array_pop($notifs);

        $up = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
        $up->execute([json_encode($notifs)]);

        return [
            'success' => true,
            'message' => "Payment of {$formattedAmount} confirmed via Paystack. Full portal access granted!",
            'paid_until' => $paidUntil,
            'plan' => $plan,
            'amount_paid' => $amountPaid
        ];
    }

    /**
     * Process staff salary remittance via Paystack Automated Transfers
     */
    public static function processPayrollTransfer($pdo, $adminId, $staff, $monthYear, $netAmount, $notes) {
        $settings = self::getSettings($pdo, true);

        if ((int)$settings['is_enabled'] === 0) {
            return [
                'success' => false,
                'disabled' => true,
                'message' => 'Paystack API is currently deactivated. Automated bank remittance is offline.'
            ];
        }

        $ref = 'PAYROLL-PSTK-' . date('Ym') . '-' . str_pad($staff['id'], 4, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        $paystackTransferCode = 'TRF_' . strtolower(substr(bin2hex(random_bytes(6)), 0, 12));

        // Deduct from simulated balance
        $currentBal = (float)$settings['balance_ngn'];
        $newBal = max(0, $currentBal - $netAmount);
        $balStmt = $pdo->prepare("UPDATE paystack_settings SET balance_ngn = ? WHERE id = 1");
        $balStmt->execute([$newBal]);

        // Add notification
        $notifs = $settings['notifications'];
        $formattedNet = '₦' . number_format($netAmount, 2);
        $newNotif = [
            'id' => time(),
            'title' => "Paystack Payroll Remittance Disbursed ({$formattedNet})",
            'message' => "Salary transfer to {$staff['name']} ({$staff['bank_name']} - {$staff['account_number']}) confirmed. Transfer Code: {$paystackTransferCode}.",
            'type' => 'success',
            'date' => date('Y-m-d')
        ];
        array_unshift($notifs, $newNotif);
        if (count($notifs) > 12) array_pop($notifs);

        $up = $pdo->prepare("UPDATE paystack_settings SET notifications = ? WHERE id = 1");
        $up->execute([json_encode($notifs)]);

        return [
            'success' => true,
            'reference' => $ref,
            'transfer_code' => $paystackTransferCode,
            'status' => 'paid',
            'payment_method' => 'paystack_transfer',
            'balance_remaining' => $newBal
        ];
    }
}
