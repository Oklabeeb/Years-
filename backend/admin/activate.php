<?php
/**
 * Administrator Account Activation Page
 * Allows invited administrators to set their password and activate their account.
 */
require_once __DIR__ . '/../api/db.php';
require_once __DIR__ . '/../includes/admin_guard.php';

$token = trim($_GET['token'] ?? ($_POST['token'] ?? ''));
$error = '';
$success = '';

// Determine Portal Frontend URL dynamically across local and cloud environments
$frontendEnv = trim((string)(getenv('FRONTEND_ORIGIN') ?: ''));
if (!empty($frontendEnv)) {
    $origins = array_map('trim', explode(',', $frontendEnv));
    $portalUrl = rtrim($origins[0], '/');
} else {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $isLocal = in_array($host, ['localhost', '127.0.0.1']) || strpos($host, 'localhost:') === 0;
    $portalUrl = $isLocal ? '../../frontend/index.html' : 'https://years-frontend-amber.vercel.app';
}

if (empty($token)) {
    $error = 'Missing activation token. Please use the complete link provided by your Super Administrator.';
} else {
    $tokenHash = hash('sha256', $token);
    $stmt = $pdo->prepare("
        SELECT ai.*, r.name as role_name, r.slug as role_slug 
        FROM admin_invitations ai
        JOIN roles r ON ai.role_id = r.id
        WHERE ai.token_hash = ? AND ai.used_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$tokenHash]);
    $invitation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invitation) {
        $error = 'This invitation token is invalid or has already been used.';
    } elseif (strtotime($invitation['expires_at']) < time()) {
        $error = 'This invitation has expired. Please request a new invitation from your Super Administrator.';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($error)) {
    $password = $_POST['password'] ?? '';
    $passwordConfirm = $_POST['password_confirm'] ?? '';
    $enableMfa = !empty($_POST['enable_mfa']) ? 1 : 0;

    if (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters long.';
    } elseif ($password !== $passwordConfirm) {
        $error = 'Passwords do not match. Please re-enter.';
    } else {
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $email = $invitation['email'];

        // Update user account
        $stmt = $pdo->prepare("
            UPDATE users 
            SET password = ?, status = 'active', mfa_enabled = ?, failed_logins = 0 
            WHERE email = ? AND role = 'admin'
        ");
        $stmt->execute([$hash, $enableMfa, $email]);

        // Mark invitation consumed
        $stmt = $pdo->prepare("UPDATE admin_invitations SET used_at = NOW() WHERE id = ?");
        $stmt->execute([$invitation['id']]);

        // Audit Log
        AdminGuard::logAudit('admin.invitation_activated', 'users', null, [
            'email' => $email,
            'role' => $invitation['role_name']
        ]);

        $success = 'Account activated successfully! You can now log in to the Administrator Portal.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Administrator Account Activation - School Portal</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 2.2rem; max-width: 480px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4); }
    .badge { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: rgba(2, 132, 199, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 0.75rem; }
    h1 { font-size: 1.45rem; font-weight: 800; margin-bottom: 0.4rem; }
    p.sub { color: var(--muted); font-size: 0.88rem; margin-bottom: 1.5rem; line-height: 1.45; }
    .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #6ee7b7; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .form-group { margin-bottom: 1.1rem; }
    label { display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1; }
    input[type="password"], input[type="text"] { width: 100%; padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: #0f172a; color: #f8fafc; font-size: 0.9rem; }
    input:focus { outline: none; border-color: var(--primary); }
    .password-input-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
    .password-input-wrapper input { width: 100% !important; padding-right: 2.8rem !important; }
    .password-toggle-btn {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; cursor: pointer; padding: 4px;
      font-size: 1.15rem; line-height: 1; color: var(--muted); border-radius: 6px;
    }
    .password-toggle-btn:hover { color: #f8fafc; background: rgba(255,255,255,0.08); }
    .btn { width: 100%; padding: 0.85rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 750; cursor: pointer; transition: background 0.15s; margin-top: 0.5rem; }
    .btn:hover { background: var(--primary-hover); }
    .mfa-box { display: flex; align-items: flex-start; gap: 0.6rem; margin: 1rem 0; padding: 0.8rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); font-size: 0.8rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">SECURE ONBOARDING</span>
    <h1>Administrator Activation</h1>
    <p class="sub">Establish your authentication credentials to activate your privileged administrative access.</p>

    <?php if (!empty($error)): ?>
      <div class="alert-error">⚠️ <?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>

    <?php if (!empty($success)): ?>
      <div class="alert-success">✅ <?php echo htmlspecialchars($success); ?></div>
      <a href="<?php echo htmlspecialchars($portalUrl . '/#admin'); ?>" class="btn" style="display:block; text-align:center; text-decoration:none; margin-top:1rem;">Proceed to Administrator Portal</a>
    <?php elseif (empty($error) && !empty($invitation)): ?>
      <div style="background:rgba(255,255,255,0.03); padding:0.85rem; border-radius:8px; margin-bottom:1.25rem; font-size:0.82rem;">
        <div>Invited User: <strong><?php echo htmlspecialchars($invitation['name']); ?></strong></div>
        <div style="color:var(--muted); margin-top:2px;">Email: <?php echo htmlspecialchars($invitation['email']); ?></div>
        <div style="color:#38bdf8; margin-top:2px;">Role: <strong><?php echo htmlspecialchars($invitation['role_name']); ?></strong></div>
      </div>

      <form method="POST">
        <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
        
        <div class="form-group">
          <label for="password">Create Strong Password *</label>
          <div class="password-input-wrapper">
            <input type="password" id="password" name="password" required minlength="8" placeholder="At least 8 characters">
            <button type="button" class="password-toggle-btn" aria-label="Toggle password visibility" title="Show password">👁️</button>
          </div>
        </div>

        <div class="form-group">
          <label for="password_confirm">Confirm Password *</label>
          <div class="password-input-wrapper">
            <input type="password" id="password_confirm" name="password_confirm" required minlength="8" placeholder="Re-enter password">
            <button type="button" class="password-toggle-btn" aria-label="Toggle password visibility" title="Show password">👁️</button>
          </div>
        </div>

        <div class="mfa-box">
          <input type="checkbox" id="enable_mfa" name="enable_mfa" value="1" checked style="accent-color:var(--primary); margin-top:2px;">
          <label for="enable_mfa" style="margin:0; cursor:pointer;">
            <strong>Enable Two-Factor Authentication (MFA)</strong>
            <span style="display:block; font-size:0.75rem; margin-top:2px;">Requires one-time security confirmation on privileged logins.</span>
          </label>
        </div>

        <button type="submit" class="btn">Activate Account & Begin</button>
      </form>
    <?php endif; ?>
  </div>

  <script>
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.password-toggle-btn');
      if (!btn) return;
      const wrap = btn.closest('.password-input-wrapper');
      if (!wrap) return;
      const input = wrap.querySelector('input');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.setAttribute('title', 'Hide password');
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.setAttribute('title', 'Show password');
      }
    });
  </script>
</body>
</html>

