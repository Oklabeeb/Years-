<?php
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
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Private Administrator Gateway - School Portal</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --bg: #0b1120;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0b1120 75%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.4rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 35px -10px rgba(0,0,0,0.6);
      position: relative;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 800;
      background: rgba(2, 132, 199, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      margin-bottom: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.35rem; }
    p.sub { color: var(--muted); font-size: 0.86rem; margin-bottom: 1.6rem; line-height: 1.45; }
    .form-group { margin-bottom: 1.15rem; }
    label { display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1; }
    input[type="email"], input[type="password"], input[type="text"] {
      width: 100%;
      padding: 0.8rem 0.95rem;
      border-radius: 9px;
      border: 1px solid var(--border);
      background: #0f172a;
      color: #f8fafc;
      font-size: 0.92rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.25);
    }
    .btn {
      width: 100%;
      padding: 0.88rem;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 9px;
      font-size: 0.95rem;
      font-weight: 750;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      margin-top: 0.4rem;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 0.75rem 0.9rem;
      border-radius: 8px;
      font-size: 0.84rem;
      margin-bottom: 1.2rem;
      display: none;
    }
    .alert-info {
      background: rgba(2, 132, 199, 0.15);
      border: 1px solid rgba(2, 132, 199, 0.35);
      color: #7dd3fc;
      padding: 0.75rem 0.9rem;
      border-radius: 8px;
      font-size: 0.84rem;
      margin-bottom: 1.2rem;
      display: none;
    }
    .footer-note {
      text-align: center;
      margin-top: 1.6rem;
      font-size: 0.76rem;
      color: var(--muted);
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 1.2rem;
    }
    .footer-note a { color: var(--primary); text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">🔒 RESTRICTED ENVIRONMENT</span>
    <h1>Administrator Gateway</h1>
    <p class="sub">Private management area strictly for authorized school leadership and administrative personnel.</p>

    <div id="errorAlert" class="alert-error"></div>
    <div id="infoAlert" class="alert-info"></div>

    <!-- Step 1: Email + Password -->
    <form id="adminLoginForm" onsubmit="handleAdminLogin(event)">
      <div class="form-group">
        <label for="adminEmail">School Email</label>
        <input type="email" id="adminEmail" required placeholder="admin@school.edu.ng" autocomplete="email">
      </div>

      <div class="form-group">
        <label for="adminPassword">Password</label>
        <input type="password" id="adminPassword" required placeholder="Enter administrative password" autocomplete="current-password">
      </div>

      <button type="submit" id="loginSubmitBtn" class="btn">Authenticate & Access</button>
    </form>

    <!-- Step 2: MFA Code Verification -->
    <form id="adminMfaForm" onsubmit="handleMfaVerify(event)" style="display:none;">
      <div class="form-group">
        <label for="mfaCode">Multi-Factor Security Code</label>
        <input type="text" id="mfaCode" required maxlength="6" pattern="[0-9]{6}" placeholder="6-digit code" style="letter-spacing: 4px; font-size: 1.3rem; text-align: center; font-weight: 800;">
        <small style="color:var(--muted); font-size:0.75rem; margin-top:0.35rem; display:block;">
          Enter the 6-digit confirmation code generated for this privileged session.
        </small>
      </div>

      <button type="submit" id="mfaSubmitBtn" class="btn">Verify MFA & Unlock</button>
      <button type="button" class="btn" onclick="backToLogin()" style="background:transparent; border:1px solid var(--border); color:var(--muted); margin-top:0.5rem;">
        ← Back to Credentials
      </button>
    </form>

    <div class="footer-note">
      Unauthenticated sessions are monitored and logged.<br>
      Student or teacher? <a href="../">Go to Student & Staff Portal</a>
    </div>
  </div>

  <script>
    const errorAlert = document.getElementById('errorAlert');
    const infoAlert = document.getElementById('infoAlert');
    const loginForm = document.getElementById('adminLoginForm');
    const mfaForm = document.getElementById('adminMfaForm');

    function showError(msg) {
      errorAlert.textContent = '⚠️ ' + msg;
      errorAlert.style.display = 'block';
      infoAlert.style.display = 'none';
    }

    function showInfo(msg) {
      infoAlert.innerHTML = 'ℹ️ ' + msg;
      infoAlert.style.display = 'block';
      errorAlert.style.display = 'none';
    }

    function clearAlerts() {
      errorAlert.style.display = 'none';
      infoAlert.style.display = 'none';
    }

    async function handleAdminLogin(e) {
      e.preventDefault();
      clearAlerts();

      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
      const btn = document.getElementById('loginSubmitBtn');

      btn.disabled = true;
      btn.textContent = 'Verifying credentials...';

      try {
        const res = await fetch('../api/auth.php?action=admin_login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!data.success) {
          showError(data.message || 'Login failed.');
          return;
        }

        if (data.mfa_required) {
          // Switch to MFA form
          loginForm.style.display = 'none';
          mfaForm.style.display = 'block';
          showInfo(data.message + (data.dev_code ? `<br><strong>Test Code:</strong> <span style="font-family:monospace; font-size:1.1rem; color:#38bdf8;">${data.dev_code}</span>` : ''));
          document.getElementById('mfaCode').focus();
          return;
        }

        // Direct Login Success
        showInfo('Authentication successful! Loading administrator workspace...');
        setTimeout(() => {
          window.location.href = <?php echo json_encode($portalUrl . '/#admin'); ?>;
        }, 600);

      } catch (err) {
        showError('Network or server error occurred: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Authenticate & Access';
      }
    }

    async function handleMfaVerify(e) {
      e.preventDefault();
      clearAlerts();

      const code = document.getElementById('mfaCode').value.trim();
      const btn = document.getElementById('mfaSubmitBtn');

      btn.disabled = true;
      btn.textContent = 'Verifying code...';

      try {
        const res = await fetch('../api/auth.php?action=admin_verify_mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (!data.success) {
          showError(data.message || 'MFA verification failed.');
          return;
        }

        showInfo('Security verification passed! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = <?php echo json_encode($portalUrl . '/#admin'); ?>;
        }, 600);

      } catch (err) {
        showError('Verification error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Verify MFA & Unlock';
      }
    }

    function backToLogin() {
      clearAlerts();
      mfaForm.style.display = 'none';
      loginForm.style.display = 'block';
    }
  </script>
</body>
</html>

