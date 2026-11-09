<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function paymentError(int $statusCode, string $message): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => true, 'message' => $message]);
    exit;
}

if (empty($_SESSION['user_id'])) {
    paymentError(401, 'Please sign in before verifying a payment.');
}

$reference = $_GET['reference'] ?? '';
if (!is_string($reference) || !preg_match('/\A[A-Za-z0-9._=-]{1,100}\z/', $reference)) {
    paymentError(400, 'A valid payment reference is required.');
}

$secretKey = getenv('PAYSTACK_SECRET_KEY');
if ($secretKey === false || $secretKey === '') {
    error_log('PAYSTACK_SECRET_KEY is not configured.');
    paymentError(500, 'Payment verification is not configured.');
}

$userQuery = $pdo->prepare('SELECT id, email, student_id FROM users WHERE id = ?');
$userQuery->execute([$_SESSION['user_id']]);
$user = $userQuery->fetch();

if (!$user) {
    paymentError(401, 'Your signed-in account could not be found.');
}

// 1. Call Paystack Verification Endpoint
$curl = curl_init('https://api.paystack.co/transaction/verify/' . rawurlencode($reference));
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $secretKey],
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => 15,
]);

$responseBody = curl_exec($curl);
$curlError    = curl_error($curl);
$httpStatus   = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($responseBody === false) {
    error_log('Paystack verification request failed: ' . $curlError);
    paymentError(502, 'Unable to verify payment right now. Please try again.');
}

try {
    $response = json_decode($responseBody, true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $exception) {
    error_log('Paystack returned invalid JSON: ' . $exception->getMessage());
    paymentError(502, 'Paystack returned an invalid response.');
}

$payment       = $response['data'] ?? null;
$customerEmail = is_array($payment) ? ($payment['customer']['email'] ?? null) : null;

if (
    $httpStatus !== 200
    || ($response['status'] ?? false) !== true
    || !is_array($payment)
    || ($payment['status'] ?? '') !== 'success'
    || ($payment['reference'] ?? '') !== $reference
    || !is_string($customerEmail)
    || strcasecmp(trim($customerEmail), trim($user['email'])) !== 0
) {
    paymentError(400, 'Payment verification failed. Confirm payment details and try again.');
}

// 2. Database Atomic Update
try {
    $pdo->beginTransaction();

    $userLock = $pdo->prepare('SELECT id, student_id FROM users WHERE id = ? FOR UPDATE');
    $userLock->execute([$user['id']]);
    $lockedUser = $userLock->fetch();

    if (!$lockedUser) {
        $pdo->rollBack();
        paymentError(401, 'Your account could not be found.');
    }

    $paymentQuery = $pdo->prepare('SELECT user_id, status FROM payments WHERE reference = ? FOR UPDATE');
    $paymentQuery->execute([$reference]);
    $existingPayment = $paymentQuery->fetch();

    if ($existingPayment && (int) $existingPayment['user_id'] !== (int) $lockedUser['id']) {
        $pdo->rollBack();
        paymentError(409, 'This payment reference is already linked to another account.');
    }

    if ($existingPayment && $existingPayment['status'] === 'success') {
        $pdo->commit();
        $_SESSION['user']['is_paid'] = true;
        jsonResponse(['message' => 'Payment already verified.', 'is_paid' => true]);
    }

    if ($existingPayment) {
        $savePayment = $pdo->prepare(
            "UPDATE payments SET amount = ?, status = 'success', paid_at = NOW() WHERE reference = ?"
        );
        $savePayment->execute([$payment['amount'], $reference]);
    } else {
        $savePayment = $pdo->prepare(
            "INSERT INTO payments (user_id, reference, amount, status, paid_at) VALUES (?, ?, ?, 'success', NOW())"
        );
        $savePayment->execute([$lockedUser['id'], $reference, $payment['amount']]);
    }

    $studentId = $lockedUser['student_id'];
    if ($studentId === null || $studentId === '') {
        $studentId = 'EDU-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(4)));
    }

    $updateUser = $pdo->prepare('UPDATE users SET is_paid = 1, student_id = ? WHERE id = ?');
    $updateUser->execute([$studentId, $lockedUser['id']]);

    $pdo->commit();

    // Update Session
    $_SESSION['user']['is_paid'] = true;

    jsonResponse(['message' => 'Payment verified successfully.', 'student_id' => $studentId, 'is_paid' => true]);

} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Unable to record verified payment: ' . $exception->getMessage());
    paymentError(500, 'Payment verified, but account status could not be updated. Contact support.');
}