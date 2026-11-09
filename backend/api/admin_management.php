<?php
/**
 * Administrator Governance API (Super Admin Management)
 * Handles inviting, role assignment, permissions, activation/suspension,
 * and security audit logs.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../includes/admin_guard.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

try {
    // 1. All management actions require authenticated admin
    $currentAdmin = AdminGuard::requireAuth();
    global $pdo;

    // -------------------------------------------------------------------------
    // 1. GET ALL ADMINISTRATORS
    // -------------------------------------------------------------------------
    if ($action === 'get_admins') {
        AdminGuard::requirePermission('admin.manage_admins');

        $stmt = $pdo->query("
            SELECT 
                u.id, u.name, u.email, u.role, u.status, u.mfa_enabled, 
                u.last_login_at, u.created_at,
                r.id as role_id, r.slug as role_slug, r.name as role_name,
                (SELECT COUNT(*) FROM audit_logs WHERE user_id = u.id) as actions_count
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.role = 'admin'
            ORDER BY (r.slug = 'super_admin') DESC, u.created_at ASC
        ");
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch pending invitations
        $invStmt = $pdo->query("
            SELECT ai.id, ai.email, ai.name, ai.expires_at, ai.created_at, r.name as role_name, r.slug as role_slug, u.name as invited_by_name
            FROM admin_invitations ai
            JOIN roles r ON ai.role_id = r.id
            LEFT JOIN users u ON ai.invited_by = u.id
            WHERE ai.used_at IS NULL AND ai.expires_at > NOW()
            ORDER BY ai.created_at DESC
        ");
        $pendingInvites = $invStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'admins' => $admins,
            'invitations' => $pendingInvites
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 2. GET ROLES & PERMISSIONS LIST
    // -------------------------------------------------------------------------
    if ($action === 'get_roles') {
        AdminGuard::requirePermission('admin.manage_roles');

        $stmt = $pdo->query("SELECT * FROM roles ORDER BY id ASC");
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $permStmt = $pdo->query("SELECT * FROM permissions ORDER BY category, id ASC");
        $permissions = $permStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'roles' => $roles,
            'permissions' => $permissions
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 3. INVITE NEW ADMINISTRATOR
    // -------------------------------------------------------------------------
    if ($action === 'invite_admin') {
        AdminGuard::requirePermission('admin.manage_admins');

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $roleId = (int)($input['role_id'] ?? 0);
        $customPerms = $input['custom_permissions'] ?? null;

        if (empty($name) || empty($email) || $roleId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Full name, email, and administrative role are required.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email address provided.']);
            exit;
        }

        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id, role, status FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing && $existing['role'] === 'admin') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'An administrator account with this email already exists.']);
            exit;
        }

        // Generate cryptographically secure token (48h expiry)
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

        // Save invitation record
        $invStmt = $pdo->prepare("
            INSERT INTO admin_invitations (email, name, role_id, custom_permissions, token_hash, invited_by, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $invStmt->execute([
            $email, $name, $roleId, 
            $customPerms ? json_encode($customPerms) : null,
            $tokenHash, $currentAdmin['id'], $expiresAt
        ]);

        $inviteId = $pdo->lastInsertId();

        // Also pre-create or mark user as invited in users table
        if (!$existing) {
            $tempPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
            $uStmt = $pdo->prepare("
                INSERT INTO users (name, email, password, role, status)
                VALUES (?, ?, ?, 'admin', 'invited')
            ");
            $uStmt->execute([$name, $email, $tempPass]);
            $newUserId = (int)$pdo->lastInsertId();
        } else {
            $newUserId = (int)$existing['id'];
            $uStmt = $pdo->prepare("UPDATE users SET role = 'admin', status = 'invited' WHERE id = ?");
            $uStmt->execute([$newUserId]);
        }

        // Assign role in user_roles
        $assignStmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), assigned_by = VALUES(assigned_by)");
        $assignStmt->execute([$newUserId, $roleId, $currentAdmin['id']]);

        // Audit Log
        AdminGuard::logAudit('admin.invited', 'users', $newUserId, [
            'invited_email' => $email,
            'role_id' => $roleId,
            'invite_id' => $inviteId
        ]);

        // Build invitation activation link
        $activationUrl = "admin/activate.php?token={$rawToken}";

        echo json_encode([
            'success' => true,
            'message' => "Invitation created successfully for {$name} ({$email}).",
            'activation_link' => $activationUrl,
            'expires_at' => $expiresAt
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 4. SUSPEND OR ACTIVATE ADMINISTRATOR
    // -------------------------------------------------------------------------
    if ($action === 'toggle_status') {
        AdminGuard::requirePermission('admin.manage_admins');

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $targetUserId = (int)($input['user_id'] ?? 0);
        $newStatus = trim($input['status'] ?? '');

        if ($targetUserId <= 0 || !in_array($newStatus, ['active', 'suspended'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid admin ID or status specified.']);
            exit;
        }

        if ($targetUserId === (int)$currentAdmin['id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Security Error: You cannot suspend your own administrator account.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ? AND role = 'admin'");
        $stmt->execute([$newStatus, $targetUserId]);

        AdminGuard::logAudit("admin.status_change_{$newStatus}", 'users', $targetUserId, [
            'new_status' => $newStatus
        ]);

        echo json_encode([
            'success' => true,
            'message' => "Administrator account status updated to '{$newStatus}'."
        ]);
        exit;
    }

    // -------------------------------------------------------------------------
    // 5. CHANGE ADMINISTRATOR ROLE OR PERMISSIONS
    // -------------------------------------------------------------------------
    if ($action === 'update_role') {
        AdminGuard::requirePermission('admin.manage_admins');

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $targetUserId = (int)($input['user_id'] ?? 0);
        $newRoleId = (int)($input['role_id'] ?? 0);

        if ($targetUserId <= 0 || $newRoleId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Target user ID and new role ID are required.']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO user_roles (user_id, role_id, assigned_by) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), assigned_by = VALUES(assigned_by), assigned_at = NOW()
        ");
        $stmt->execute([$targetUserId, $newRoleId, $currentAdmin['id']]);

        AdminGuard::logAudit('admin.role_changed', 'users', $targetUserId, [
            'new_role_id' => $newRoleId
        ]);

        echo json_encode(['success' => true, 'message' => 'Administrator role updated successfully.']);
        exit;
    }

    // -------------------------------------------------------------------------
    // 6. REVOKE ADMINISTRATOR
    // -------------------------------------------------------------------------
    if ($action === 'revoke_admin') {
        AdminGuard::requirePermission('admin.manage_admins');

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $targetUserId = (int)($input['user_id'] ?? 0);

        if ($targetUserId <= 0 || $targetUserId === (int)$currentAdmin['id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cannot revoke this administrator account.']);
            exit;
        }

        // Delete from user_roles and set status to suspended
        $pdo->prepare("DELETE FROM user_roles WHERE user_id = ?")->execute([$targetUserId]);
        $pdo->prepare("UPDATE users SET role = 'student', status = 'suspended' WHERE id = ?")->execute([$targetUserId]);

        AdminGuard::logAudit('admin.revoked', 'users', $targetUserId, [
            'action' => 'Admin privileges permanently revoked'
        ]);

        echo json_encode(['success' => true, 'message' => 'Administrator privileges revoked successfully.']);
        exit;
    }

    // -------------------------------------------------------------------------
    // 7. GET AUDIT LOGS
    // -------------------------------------------------------------------------
    if ($action === 'get_audit_logs') {
        AdminGuard::requirePermission('admin.view_audit_logs');

        $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
        $stmt = $pdo->prepare("
            SELECT al.*, u.name as admin_name 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.id DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'logs' => $logs
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error: ' . $e->getMessage()]);
}

