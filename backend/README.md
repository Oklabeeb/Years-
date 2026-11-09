# School Portal & Management System

An all-in-one school administration, student management, staff portal, and multi-API national examination system (WAEC, JAMB, GCE, NECO, A'Level).

---

## 📁 Project Architecture & Folder Organization

The codebase is organized into two primary folders: `frontend` and `backend`.

```text
├── frontend/                     # Client-side user interface
│   ├── index.html                # Main single-page application (SPA)
│   ├── js/
│   │   ├── app.js                # Core UI router, workspace switching, modals
│   │   ├── controllers/
│   │   │   └── school-controller.js # Action dispatcher & coordinator
│   │   ├── models/
│   │   │   └── school-model.js      # API data layer & safeFetch
│   │   ├── views/
│   │   │   └── school-view.js       # DOM rendering & WhatsApp chat UI
│   │   └── libs/
│   │       └── chart.umd.min.js     # Chart.js visualization engine
│   └── uploads/                  # Static asset download mirrors
│
├── backend/                      # Server-side business logic & storage
│   ├── api/                      # REST JSON API endpoints
│   │   ├── chat.php              # Campus Chat & direct messaging API
│   │   ├── student_verification.php # Automated payment verification & ID dispatch
│   │   ├── admin_analytics.php   # Data visualization & reporting metrics
│   │   ├── admin_management.php  # Role-based admin RBAC & invitations
│   │   ├── resources.php         # CBT test engine, subjects, assignments & fees
│   │   ├── auth.php              # Authentication & MFA security
│   │   ├── attendance.php        # Daily attendance tracking
│   │   ├── notices.php           # Independent bulletins for student/staff
│   │   ├── timetable.php         # Timetable & schedule management
│   │   └── db.php                # PDO database connection
│   ├── includes/                 # Core domain services & engines
│   │   ├── aloc_engine.php       # Multi-board question bank & past questions (1978-2026)
│   │   ├── paystack_engine.php   # Paystack payment gateway integration
│   │   ├── student_verification_engine.php # Payment verification & token dispatch
│   │   ├── admin_guard.php       # RBAC & permissions enforcer
│   │   └── auth_guard.php        # Session access guard
│   ├── admin/                    # Admin portal authentication & setup
│   │   ├── login.php             # Admin private login & MFA gate
│   │   ├── activate.php          # Admin invitation activation
│   │   └── index.php             # Private admin redirector
│   ├── cli/                      # Server CLI administrative tools
│   │   └── setup_super_admin.php # Controlled first Super Admin setup
│   ├── uploads/                  # Upload directories for assignments & notices
│   ├── activate_student.php      # Student account activation page
│   └── schema.sql                # Full database migration & tables
│
├── index.php                     # Root entrypoint: forwards to frontend/index.html
├── index.html                    # Root redirect fallback
└── activate_student.php          # Root proxy forwarder for activation links
```

---

## 🚀 Running the Application

### Local Web Server (XAMPP / Apache):
1. Place the project folder in your web server root, for example: `C:\xampp\htdocs\school-portal`
2. Ensure Apache and MySQL are running in XAMPP.
3. Access the application in your browser:
   - Root URL: `http://localhost/school-portal/` (automatically opens `frontend/index.html`)
   - Direct Frontend URL: `http://localhost/school-portal/frontend/`
   - Admin Login URL: `http://localhost/school-portal/backend/admin/login.php`

### Automated Tests:
Run backend unit and flow tests via PHP CLI:
```bash
php scratch/test_chat_isolated.php
php scratch/test_chat_complete_e2e.php
php scratch/test_paystack_and_analytics.php
php scratch/test_multi_api_cbt.php
```
