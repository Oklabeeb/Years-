<?php
/**
 * activate_student.php
 * Standalone Student Account Activation & Password Setup Form
 * Opened when the student clicks the activation link sent to their Gmail.
 */
require_once __DIR__ . '/api/db.php';

$token = trim($_GET['token'] ?? '');
$activationData = null;
$error = null;
$alreadyActivated = false;

if (empty($token)) {
    $error = 'No activation token was provided. Please use the exact link sent to your Gmail.';
} else {
    try {
        $stmt = $pdo->prepare("
            SELECT a.*, u.name, u.email as user_email, u.program, u.department, u.student_id as current_student_id
            FROM student_activations a
            JOIN users u ON a.user_id = u.id
            WHERE a.token = ?
        ");
        $stmt->execute([$token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $error = 'Invalid activation token. Please verify the link in your email or contact administration.';
        } elseif ((int)$row['is_used'] === 1) {
            $alreadyActivated = true;
            $activationData = $row;
        } elseif (strtotime($row['expires_at']) < time()) {
            $error = 'This activation link has expired (links are valid for 48 hours). Please contact school administration for a new link.';
        } else {
            $activationData = $row;
        }
    } catch (Exception $e) {
        $error = 'Database connection error: ' . $e->getMessage();
    }
}

$assignedStudentId = $activationData['student_id'] ?? ($activationData['current_student_id'] ?? '');

// Determine Portal Frontend URL dynamically across local and cloud environments
$frontendEnv = trim((string)(getenv('FRONTEND_ORIGIN') ?: ''));
if (!empty($frontendEnv)) {
    $origins = array_map('trim', explode(',', $frontendEnv));
    $portalUrl = rtrim($origins[0], '/');
} else {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $isLocal = in_array($host, ['localhost', '127.0.0.1']) || strpos($host, 'localhost:') === 0;
    $portalUrl = $isLocal ? '../frontend/index.html' : 'https://years-frontend-amber.vercel.app';
}
$loginUrlWithId = $portalUrl . (!empty($assignedStudentId) ? '?student_id=' . urlencode($assignedStudentId) : '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Activate Student Account · Years Secondary School</title>
<style>
  :root {
    --bg: #f1f5f9; --card: #ffffff; --text: #0b2d4b; --muted: #64748b;
    --primary: #0284c7; --accent: #f59e0b; --success: #10b981; --danger: #ef4444;
    --border: #e2e8f0;
  }
  * { margin:0; padding:0; box-sizing:border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  body {
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background-image: radial-gradient(circle at 15% 15%, rgba(2, 132, 199, 0.08), transparent 45%),
                      radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.08), transparent 45%);
  }
  .activation-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.5rem;
    width: 100%;
    max-width: 490px;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.08);
  }
  .brand-header {
    text-align: center;
    margin-bottom: 1.8rem;
  }
  .brand-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 62px;
    height: 62px;
    border-radius: 16px;
    background: linear-gradient(135deg, #0284c7, #2563eb);
    color: white;
    font-size: 1.85rem;
    margin-bottom: 0.85rem;
    box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
  }
  h1 { font-size: 1.55rem; font-weight: 850; letter-spacing: -0.5px; margin-bottom: 0.3rem; }
  .subtitle { font-size: 0.88rem; color: var(--muted); line-height: 1.45; }

  .id-callout {
    background: rgba(2, 132, 199, 0.07);
    border: 1.5px dashed rgba(2, 132, 199, 0.35);
    border-radius: 14px;
    padding: 1.15rem;
    text-align: center;
    margin-bottom: 1.6rem;
  }
  .id-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); margin-bottom: 0.25rem; }
  .id-display { font-size: 1.75rem; font-weight: 900; letter-spacing: 1px; font-family: monospace; color: #0284c7; }
  .id-note { font-size: 0.74rem; color: var(--muted); margin-top: 0.35rem; }

  .meta-chips {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.6rem;
  }
  .chip { font-size: 0.74rem; font-weight: 750; padding: 0.25rem 0.65rem; border-radius: 20px; background: rgba(0,0,0,0.05); }

  .form-group { margin-bottom: 1.15rem; text-align: left; }
  label { display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; }
  input {
    width: 100%;
    padding: 0.82rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    font-size: 0.92rem;
    background: #f8fafc;
    color: var(--text);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15); background: #ffffff; }

  .btn-submit {
    width: 100%;
    padding: 0.95rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #0284c7, #2563eb);
    color: white;
    font-size: 0.98rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(2, 132, 199, 0.3);
    transition: transform 0.2s, opacity 0.2s;
    margin-top: 0.5rem;
  }
  .btn-submit:hover { opacity: 0.95; transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .alert {
    padding: 1rem 1.15rem;
    border-radius: 12px;
    font-size: 0.86rem;
    line-height: 1.5;
    margin-bottom: 1.4rem;
  }
  .alert-danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #dc2626; }
  .alert-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #059669; }
  .alert-warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #d97706; }

  .login-link-btn {
    display: inline-block;
    width: 100%;
    text-align: center;
    padding: 0.85rem;
    border-radius: 12px;
    background: var(--text);
    color: white;
    text-decoration: none;
    font-weight: 750;
    font-size: 0.92rem;
    margin-top: 0.9rem;
  }
</style>
</head>
<body>

<div class="activation-card">
  <div class="brand-header">
    <div class="brand-logo">🎓</div>
    <h1>Account Activation</h1>
    <p class="subtitle">Complete your enrollment & set up your Student Portal password.</p>
  </div>

  <?php if ($error): ?>
    <div class="alert alert-danger">
      <strong>⚠️ Activation Notice:</strong><br>
      <?php echo htmlspecialchars($error); ?>
    </div>
    <a href="<?php echo htmlspecialchars($portalUrl); ?>" class="login-link-btn">← Return to School Portal</a>

  <?php elseif ($alreadyActivated): ?>
    <div class="alert alert-warning">
      <strong>🎉 Account Already Activated!</strong><br>
      Your account for <strong><?php echo htmlspecialchars($assignedStudentId); ?></strong> is already active and verified.
    </div>
    <div class="id-callout">
      <div class="id-label">YOUR REGISTERED STUDENT ID</div>
      <div class="id-display"><?php echo htmlspecialchars($assignedStudentId); ?></div>
      <div class="id-note">You will use this Student ID and your password to sign in.</div>
    </div>
    <a href="<?php echo htmlspecialchars($loginUrlWithId); ?>" class="login-link-btn">Proceed to Student Login →</a>

  <?php else: ?>
    <!-- ID Callout Card -->
    <div class="id-callout">
      <div class="id-label">OFFICIAL ASSIGNED STUDENT ID</div>
      <div class="id-display"><?php echo htmlspecialchars($assignedStudentId); ?></div>
      <div class="meta-chips">
        <span class="chip">👤 <?php echo htmlspecialchars($activationData['name'] ?? 'Student'); ?></span>
        <span class="chip">📘 <?php echo htmlspecialchars($activationData['program'] ?? 'WAEC'); ?> Track</span>
        <span class="chip">🔬 <?php echo htmlspecialchars($activationData['department'] ?? 'Science'); ?></span>
      </div>
      <div class="id-note">Verified Tuition Clearance • Access Active</div>
    </div>

    <div id="activationAlert" class="alert hidden" style="display:none;"></div>

    <form id="activationForm" onsubmit="handleStudentActivation(event)">
      <div class="form-group">
        <label for="studentId">Official Student ID</label>
        <input type="text" id="studentId" name="studentId" value="<?php echo htmlspecialchars($assignedStudentId); ?>" readonly style="font-weight:750; letter-spacing:0.5px; background:rgba(0,0,0,0.03);">
      </div>

      <div class="form-group">
        <label for="newPassword">Create Password (min. 6 characters)</label>
        <input type="password" id="newPassword" name="newPassword" placeholder="Enter secure password" required minlength="6" autocomplete="new-password">
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required minlength="6" autocomplete="new-password">
      </div>

      <button type="submit" class="btn-submit" id="submitBtn">
        Activate Student Portal Account →
      </button>
    </form>

    <div id="activationSuccessBlock" class="hidden" style="display:none; text-align:center; margin-top:1.2rem;">
      <div class="alert alert-success">
        <strong>🎉 Welcome aboard!</strong><br>
        Your portal account is now active. Your Student ID is <strong><?php echo htmlspecialchars($assignedStudentId); ?></strong>.
      </div>
      <a href="<?php echo htmlspecialchars($loginUrlWithId); ?>" id="activationFinalLoginBtn" class="login-link-btn" style="background:#0284c7;">Go to Student Portal Login →</a>
    </div>

    <script>
      const activationToken = <?php echo json_encode($token); ?>;
      const assignedId = <?php echo json_encode($assignedStudentId); ?>;

      async function handleStudentActivation(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        const alertBox = document.getElementById('activationAlert');
        const form = document.getElementById('activationForm');
        const successBlock = document.getElementById('activationSuccessBlock');

        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
          alertBox.className = 'alert alert-danger';
          alertBox.style.display = 'block';
          alertBox.textContent = 'Passwords do not match. Please ensure both fields are identical.';
          return;
        }

        if (password.length < 6) {
          alertBox.className = 'alert alert-danger';
          alertBox.style.display = 'block';
          alertBox.textContent = 'Password must be at least 6 characters long.';
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Activating account...';
        alertBox.style.display = 'none';

        try {
          const res = await fetch('api/student_verification.php?action=activate_account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: activationToken,
              student_id: assignedId,
              password: password,
              confirm_password: confirmPassword
            })
          });

          const data = await res.json();

          if (res.ok && data.success) {
            form.style.display = 'none';
            successBlock.style.display = 'block';
            const confirmedId = data.student_id || assignedId;
            const btn = document.getElementById('activationFinalLoginBtn');
            if (btn && confirmedId) {
              const basePortal = <?php echo json_encode($portalUrl); ?>;
              btn.href = basePortal + '?student_id=' + encodeURIComponent(confirmedId);
            }
          } else {
            alertBox.className = 'alert alert-danger';
            alertBox.style.display = 'block';
            alertBox.textContent = data.message || 'Activation failed. Please contact school office.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Activate Student Portal Account →';
          }
        } catch (err) {
          alertBox.className = 'alert alert-danger';
          alertBox.style.display = 'block';
          alertBox.textContent = 'Network or server error during activation. Please try again.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Activate Student Portal Account →';
        }
      }
    </script>
  <?php endif; ?>
</div>

</body>
</html>

