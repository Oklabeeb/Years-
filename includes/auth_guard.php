<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

/**
 * Ensures the visiting user is logged in and verifies trial/payment status.
 * Required variables before including this script:
 *   - $pdo (PDO instance)
 *   - $user (array from session or database query)
 */
if (!isset($pdo, $user) || !$pdo instanceof PDO || !is_array($user)) {
    throw new RuntimeException('auth_guard.php requires active $pdo and $user variables.');
}

if (!isset($user['id'], $user['is_paid'])) {
    throw new RuntimeException('The authenticated user record must include "id" and "is_paid" fields.');
}

// 1. Check payment or trial validity
if (empty($user['is_paid'])) {
    $trialEndsAt = $user['trial_ends_at'] ?? null;
    if ($trialEndsAt === null || new DateTimeImmutable($trialEndsAt) < new DateTimeImmutable()) {
        if (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
            http_response_code(402);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => true, 'message' => 'Account access locked. Payment or active trial required.']);
            exit;
        }
        header('Location: /locked.php', true, 303);
        exit;
    }
}