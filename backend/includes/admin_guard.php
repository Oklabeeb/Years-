<?php
require_once __DIR__ . '/../api/cors.php';
/**
 * Admin Security & RBAC Guard Engine
 * Enforces Role-Based Access Control, session verification,
 * MFA state, and comprehensive audit logging.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../api/db.php';

class AdminGuard {
    /**
     * Authenticates that the current request has an active, MFA-verified administrator session.
     * Returns the administrator user record.
     */
    public static function requireAuth(): array {
        global $pdo;

        $user = $_SESSION['user'] ?? ($_SESSION['admin_user'] ?? null);

        if (!$user || !isset($user['id'])) {
            self::deny('Unauthorized: Please log in as an administrator.', 401);
        }

        $userId = (int)$user['id'];

        // Live verification against database
        $stmt = $pdo->prepare("SELECT id, name, email, role, status, mfa_enabled FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $liveUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$liveUser || strtolower($liveUser['role']) !== 'admin') {
            self::logAudit('auth.unauthorized_admin_access_attempt', 'users', $userId, [
                'reason' => 'User does not possess admin role',
                'actual_role' => $liveUser['role'] ?? 'unknown'
            ]);
            self::deny('Access Denied: Administrative privileges required.', 403);
        }

        if (($liveUser['status'] ?? 'active') !== 'active') {
            self::logAudit('auth.suspended_admin_access_attempt', 'users', $userId, [
                'status' => $liveUser['status']
            ]);
            self::deny('Access Denied: Your administrator account has been suspended or is inactive.', 403);
        }

        // Verify MFA status if enabled or if session requires it
        $mfaVerified = $_SESSION['admin_mfa_verified'] ?? false;
        if (!empty($liveUser['mfa_enabled']) && !$mfaVerified) {
            self::deny('MFA Verification Required: Please complete two-factor authentication.', 403, [
                'mfa_required' => true
            ]);
        }

        // Load permissions if not in session or refresh
        if (empty($_SESSION['admin_permissions']) || empty($_SESSION['admin_roles'])) {
            self::refreshAdminSessionData($userId);
        }

        return $liveUser;
    }

    /**
     * Checks if current admin has a specific permission.
     * Super Admin has wildcard access to all permissions.
     */
    public static function hasPermission(string $permissionSlug): bool {
        $roles = $_SESSION['admin_roles'] ?? [];
        $perms = $_SESSION['admin_permissions'] ?? [];

        // Super Admin wildcard: can perform the work of all other administrators
        if (in_array('super_admin', $roles, true) || in_array('*', $perms, true)) {
            return true;
        }

        if (in_array($permissionSlug, $perms, true)) {
            return true;
        }

        // Check category wildcard e.g. "finance.*"
        $parts = explode('.', $permissionSlug);
        if (count($parts) === 2) {
            $catWildcard = $parts[0] . '.*';
            if (in_array($catWildcard, $perms, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enforces that current admin has the requested permission; exits with 403 if not.
     */
    public static function requirePermission(string $permissionSlug): void {
        $user = self::requireAuth();

        if (!self::hasPermission($permissionSlug)) {
            self::logAudit('auth.permission_denied', 'permissions', null, [
                'attempted_permission' => $permissionSlug,
                'user_roles' => $_SESSION['admin_roles'] ?? []
            ]);
            self::deny("Permission Denied: You do not possess the required privilege '{$permissionSlug}'.", 403);
        }
    }

    /**
     * Refreshes roles and effective permissions into the session.
     */
    public static function refreshAdminSessionData(int $userId): void {
        global $pdo;

        // 1. Fetch user roles
        $stmt = $pdo->prepare("
            SELECT r.slug 
            FROM roles r 
            INNER JOIN user_roles ur ON r.id = ur.role_id 
            WHERE ur.user_id = ?
        ");
        $stmt->execute([$userId]);
        $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $_SESSION['admin_roles'] = $roles;

        // If Super Admin, wildcard
        if (in_array('super_admin', $roles, true)) {
            $_SESSION['admin_permissions'] = ['*'];
            return;
        }

        // 2. Fetch role permissions
        $stmt = $pdo->prepare("
            SELECT DISTINCT p.slug 
            FROM permissions p 
            INNER JOIN role_permissions rp ON p.id = rp.permission_id 
            INNER JOIN user_roles ur ON rp.role_id = ur.role_id 
            WHERE ur.user_id = ?
        ");
        $stmt->execute([$userId]);
        $rolePerms = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // 3. Apply custom user_permissions overrides
        $stmt = $pdo->prepare("
            SELECT p.slug, up.is_granted 
            FROM permissions p 
            INNER JOIN user_permissions up ON p.id = up.permission_id 
            WHERE up.user_id = ?
        ");
        $stmt->execute([$userId]);
        $customPerms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $effective = array_flip($rolePerms);
        foreach ($customPerms as $cp) {
            if ($cp['is_granted'] == 1) {
                $effective[$cp['slug']] = true;
            } else {
                unset($effective[$cp['slug']]);
            }
        }

        $_SESSION['admin_permissions'] = array_keys($effective);
    }

    /**
     * Records an immutable administrative audit log entry.
     */
    public static function logAudit(string $action, ?string $resourceType = null, $resourceId = null, $details = null): void {
        global $pdo;

        $user = $_SESSION['user'] ?? ($_SESSION['admin_user'] ?? null);
        $userId = $user['id'] ?? null;
        $userEmail = $user['email'] ?? null;

        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

        $detailsJson = null;
        if ($details !== null) {
            $detailsJson = is_string($details) ? $details : json_encode($details);
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$userId, $userEmail, $action, $resourceType, $resourceId ? (string)$resourceId : null, $detailsJson, $ip, $ua]);
        } catch (Exception $e) {
            error_log("Failed to write audit log: " . $e->getMessage());
        }
    }

    /**
     * Rejects request with JSON error and terminates.
     */
    public static function deny(string $message, int $statusCode = 403, array $extra = []): void {
        http_response_code($statusCode);
        $payload = array_merge(['success' => false, 'message' => $message], $extra);
        echo json_encode($payload);
        exit;
    }
}

