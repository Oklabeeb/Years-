<?php
/**
 * Administrator Root Gateway
 * Validates privileged session and redirects to Admin Portal or Login.
 */
require_once __DIR__ . '/../includes/admin_guard.php';

$user = $_SESSION['user'] ?? ($_SESSION['admin_user'] ?? null);

if (!$user || ($user['role'] ?? '') !== 'admin' || empty($_SESSION['admin_mfa_verified'])) {
    header('Location: login.php');
    exit;
}

// User is verified admin -> redirect to Admin Workspace
header('Location: ../#admin');
exit;

