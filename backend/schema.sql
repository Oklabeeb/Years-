USE school_portal_db_final;
-- ==========================================================================
-- SPRINGFIELD HIGH SCHOOL & ACADEMY - ENTERPRISE PORTAL DATABASE SCHEMA
-- Fully compatible with TiDB Cloud (Serverless & Dedicated), MySQL 5.7 / 8.0, and MariaDB
-- ==========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create and select database (Safe for TiDB Cloud console or local MySQL)

-- 2. Drop existing tables in reverse dependency order for clean re-creation
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS admin_mfa_codes;
DROP TABLE IF EXISTS admin_invitations;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS student_verification_requests;
DROP TABLE IF EXISTS student_activations;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS school_academic_session;
DROP TABLE IF EXISTS school_notices;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS financial_ledger;
DROP TABLE IF EXISTS paystack_settings;
DROP TABLE IF EXISTS aloc_settings;
DROP TABLE IF EXISTS staff_payroll;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS class_schedules;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS staff_codes;
DROP TABLE IF EXISTS users;

-- ==========================================================================
-- 3. Users Table (Students, Staff, Administrators)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'student') NOT NULL DEFAULT 'student',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
    last_login_at DATETIME NULL,
    student_id VARCHAR(50) NULL UNIQUE,
    program VARCHAR(50) NULL DEFAULT 'WAEC', -- e.g. WAEC, JAMB
    department VARCHAR(50) NULL DEFAULT 'Science', -- e.g. Science, Commercial, Art
    subjects TEXT NULL, -- Stored as JSON array string e.g. ["Mathematics","Physics"]
    bank_name VARCHAR(100) NULL,
    account_number VARCHAR(20) NULL,
    account_name VARCHAR(100) NULL,
    monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 75000.00,
    is_paid TINYINT(1) NOT NULL DEFAULT 0,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    verified_at DATETIME NULL,
    verified_by VARCHAR(100) NULL,
    paid_until DATETIME NULL,
    payment_plan VARCHAR(20) NULL, -- 'weekly', 'monthly'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_status (status),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 4. Staff Access Codes Table (For Admin Verification)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS staff_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_staff_code_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 5. Resources Table (Textbooks & Past Questions Repository)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('textbook', 'past_question') NOT NULL,
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NULL,
    exam VARCHAR(50) NULL, -- e.g. WAEC, JAMB, NECO
    year VARCHAR(10) NULL, -- e.g. 2024
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_res_type (type),
    INDEX idx_res_subject (subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 6. Class Schedules & Notifications Table (Timetable & Google Meet)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS class_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week VARCHAR(20) NOT NULL DEFAULT 'Monday',
    program VARCHAR(50) NOT NULL DEFAULT 'WAEC',
    department VARCHAR(50) NOT NULL DEFAULT 'Science',
    subject VARCHAR(100) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    room VARCHAR(100) NOT NULL DEFAULT 'Online Class (Google Meet)',
    teacher_id INT NULL,
    teacher_name VARCHAR(100) NULL,
    meet_link VARCHAR(255) NULL,
    notification_message TEXT NULL,
    notification_date DATE NULL,
    notification_sent_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sched_day (day_of_week),
    INDEX idx_sched_prog_dept (program, department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 7. Assignments Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'assignment', -- 'assignment', 'classwork', 'test', 'exam'
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_path VARCHAR(255) NULL,
    due_date DATE NOT NULL,
    due_time VARCHAR(20) NULL DEFAULT '23:59',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asgn_subject (subject),
    INDEX idx_asgn_due (due_date),
    CONSTRAINT fk_asgn_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 8. Submissions Table (Student Coursework Submissions)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_path VARCHAR(255) NULL,
    content TEXT NULL,
    score VARCHAR(20) NULL,
    grade VARCHAR(10) NULL,
    remarks TEXT NULL,
    graded_by INT NULL,
    graded_at DATETIME NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sub_asgn (assignment_id),
    INDEX idx_sub_student (student_id),
    CONSTRAINT fk_sub_asgn FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 9. Attendance Logs Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_att_date (date),
    INDEX idx_att_student (student_id),
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 10. Fees Table (Admin Configured Tuition & Access Fees)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL DEFAULT 'School Tuition & Learning Access Fee',
    description TEXT NULL,
    base_monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 20000.00,
    program VARCHAR(50) NOT NULL DEFAULT 'All', -- 'All', 'WAEC', 'JAMB'
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 11. Payments Table (Student Fee Records)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_name VARCHAR(100) NULL,
    student_email VARCHAR(100) NULL,
    reference VARCHAR(100) NOT NULL UNIQUE,
    fee_id INT NULL,
    plan ENUM('weekly', 'monthly') NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'online',
    paid_until DATETIME NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pay_ref (reference),
    INDEX idx_pay_user (user_id),
    CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 12. Staff Payroll & Remittance Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS staff_payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(60) NOT NULL UNIQUE,
    staff_id INT NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    staff_email VARCHAR(100) NOT NULL,
    department VARCHAR(50) NULL,
    subject VARCHAR(100) NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bonus DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    month_year VARCHAR(30) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'platform_transfer',
    status VARCHAR(50) NOT NULL DEFAULT 'paid',
    notes TEXT NULL,
    paid_by_admin_id INT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payroll_ref (reference),
    INDEX idx_payroll_staff (staff_id),
    INDEX idx_payroll_month (month_year),
    CONSTRAINT fk_payroll_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 13. ALOC Station API Settings & Configuration Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS aloc_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    api_key VARCHAR(255) NULL,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'School Pro',
    credits_remaining INT NOT NULL DEFAULT 28450,
    credits_total INT NOT NULL DEFAULT 50000,
    renewal_date DATE NULL,
    notifications LONGTEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 14. Paystack API Settings & Configuration Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS paystack_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    environment ENUM('test', 'live') NOT NULL DEFAULT 'test',
    public_key VARCHAR(255) NULL DEFAULT 'pk_test_school_edu_portal_demo_2026',
    secret_key VARCHAR(255) NULL DEFAULT 'sk_test_school_edu_portal_demo_secret_2026',
    merchant_name VARCHAR(100) NOT NULL DEFAULT 'Springfield Academy Portal',
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    fee_bearer ENUM('account', 'customer') NOT NULL DEFAULT 'account',
    payroll_transfer_mode ENUM('automated', 'manual_approval') NOT NULL DEFAULT 'automated',
    balance_ngn DECIMAL(12,2) NOT NULL DEFAULT 1450000.00,
    notifications LONGTEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 15. Financial Record Book & General Ledger Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS financial_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    source ENUM('platform_paystack', 'manual_external') NOT NULL DEFAULT 'platform_paystack',
    channel VARCHAR(50) NOT NULL DEFAULT 'paystack',
    reference VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    entity_type ENUM('student', 'staff', 'vendor', 'donor', 'general') NOT NULL DEFAULT 'general',
    entity_id INT NULL,
    entity_name VARCHAR(150) NULL,
    entity_email VARCHAR(100) NULL,
    recorded_by_admin_id INT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trans_date (transaction_date),
    INDEX idx_trans_type (transaction_type),
    INDEX idx_source (source),
    INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 16. Campus Chat & Direct Messaging System
-- ==========================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NULL, -- NULL for general community group, user_id for 1-on-1 DMs
    channel_type ENUM('group', 'direct') NOT NULL DEFAULT 'group',
    channel_name VARCHAR(50) NOT NULL DEFAULT 'general',
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    deleted_for_users TEXT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_channel (channel_type, channel_name, created_at),
    INDEX idx_direct (sender_id, recipient_id, created_at),
    INDEX idx_recipient (recipient_id, is_read),
    CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 17. School Notices & Staff Updates Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS school_notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience ENUM('student', 'staff', 'all') NOT NULL DEFAULT 'student',
    category VARCHAR(50) NOT NULL DEFAULT 'official',
    attachment_url VARCHAR(255) NULL,
    attachment_name VARCHAR(255) NULL,
    attachment_type VARCHAR(100) NULL,
    attachment_size VARCHAR(50) NULL,
    author_id INT NULL,
    author_name VARCHAR(100) NOT NULL DEFAULT 'School Administration',
    is_pinned TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_target_audience (target_audience),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_notices_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 18. Role-Based Access Control (RBAC), Admin Security & Governance
-- ==========================================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_system TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    is_granted TINYINT(1) NOT NULL DEFAULT 1,
    assigned_by INT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id),
    CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_up_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_up_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    custom_permissions TEXT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    invited_by INT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_inviter FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_mfa_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mfa_user (user_id, is_used),
    CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_email VARCHAR(100) NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(50) NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 19. Student Activations Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS student_activations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_act_user (user_id),
    CONSTRAINT fk_sa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 20. Student Verification Requests Table (Payment Verification & Gmail Dispatch)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS student_verification_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(150) NOT NULL,
    program VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 18000.00,
    plan VARCHAR(20) NOT NULL DEFAULT 'monthly',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'paystack',
    payment_reference VARCHAR(100) NOT NULL,
    proof_note TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    auto_verification_status VARCHAR(50) NOT NULL DEFAULT 'failed',
    auto_failure_reason VARCHAR(255) NULL,
    verified_by VARCHAR(100) NULL,
    verified_at DATETIME NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verif_status (status),
    INDEX idx_verif_user (user_id),
    CONSTRAINT fk_svr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 21. Email Logs Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(150) NOT NULL,
    recipient_name VARCHAR(150) NULL,
    recipient_id VARCHAR(50) NULL,
    subject VARCHAR(255) NOT NULL,
    message_body LONGTEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL DEFAULT 'student_id_activation',
    activation_link TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'logged',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recip_email (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 22. School Academic Session & Term Configuration Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS school_academic_session (
    id INT PRIMARY KEY DEFAULT 1,
    current_term VARCHAR(50) NOT NULL DEFAULT 'Term 1',
    academic_session VARCHAR(50) NOT NULL DEFAULT '2024/2025',
    term_start_date DATE NULL,
    term_end_date DATE NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 23. Password Resets & Secure Account Recovery Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(191) NOT NULL,
    role ENUM('student', 'staff', 'admin') NOT NULL,
    token VARCHAR(64) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email_code (email, code),
    CONSTRAINT fk_pw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- SEED DATA SETUP (DETERMINISTIC IDS FOR TIDB CLOUD DISTRIBUTED NODES)
-- ==========================================================================

-- 24. Insert Default Users (Password: AdminSecure2026!)
INSERT INTO users (id, name, email, password, role, status, student_id, program, department, subjects, monthly_salary) 
VALUES 
(
  1,
  'System Administrator', 
  'admin@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'admin',
  'active',
  NULL,
  'WAEC',
  'Science',
  '["Mathematics","Physics","Chemistry"]',
  150000.00
),
(
  2,
  'Teacher John', 
  'staff@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'staff',
  'active',
  NULL,
  'WAEC',
  'Science',
  '["Physics"]',
  75000.00
),
(
  3,
  'Mrs. Ngozi', 
  'ngozi@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'staff',
  'active',
  NULL,
  'WAEC',
  'Commercial',
  '["Economics"]',
  75000.00
),
(
  4,
  'Ada Obi', 
  'student@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'active',
  'STU-2026-0001',
  'WAEC',
  'Science',
  '["Mathematics", "English Language", "Civic Education", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Geography", "Health Education", "Computer Studies"]',
  0.00
),
(
  5,
  'Chidi Eze', 
  'chidi@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'active',
  'STU-2026-0002',
  'JAMB',
  'Science',
  '["English Language", "Mathematics", "Physics", "Chemistry"]',
  0.00
),
(
  6,
  'Fatima Bello', 
  'fatima@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'active',
  'STU-2026-0003',
  'WAEC',
  'Commercial',
  '["Mathematics", "English Language", "Civic Education", "Economics", "Financial Accounting / Accounting", "Commerce", "Marketing", "Office Practice", "Government", "Data Processing", "Computer Studies"]',
  0.00
),
(
  7,
  'Emeka Okafor', 
  'emeka@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'active',
  'STU-2026-0004',
  'JAMB',
  'Art',
  '["English Language", "Literature-in-English", "Government", "Christian Religious Studies (CRS)"]',
  0.00
),
(
  8,
  'Babatunde Lawal', 
  'tunde@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'active',
  'STU-2026-0005',
  'WAEC',
  'Science',
  '["Mathematics", "English Language", "Civic Education", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Technical Drawing", "Computer Hardware and GSM Repairs", "Data Processing"]',
  0.00
)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 25. Seed Default Staff Access Codes (For login verification)
INSERT INTO staff_codes (id, email, code, is_used)
VALUES 
(1, 'staff@school.com', 'STAFF-1234', 0),
(2, 'ngozi@school.com', 'STAFF-5678', 0)
ON DUPLICATE KEY UPDATE is_used=VALUES(is_used);

-- 26. Seed Default Educational Resources (Past Questions & Textbooks)
INSERT INTO resources (id, type, subject, title, author, exam, year, file_path) 
VALUES
(1, 'past_question', 'Mathematics', 'WAEC 2024 General Mathematics (Paper 1 & 2)', NULL, 'WAEC', '2024', 'uploads/resources/waec_math_2024.html'),
(2, 'past_question', 'Physics', 'JAMB UTME 2024 Physics CBT Comprehensive Practice', NULL, 'JAMB', '2024', 'uploads/resources/jamb_physics_2024.html'),
(3, 'past_question', 'English Language', 'WAEC 2023 English Language Comprehension & Lexis', NULL, 'WAEC', '2023', 'uploads/resources/waec_math_2024.html'),
(4, 'past_question', 'Chemistry', 'JAMB UTME 2023 Chemistry Practice Paper', NULL, 'JAMB', '2023', 'uploads/resources/jamb_physics_2024.html'),
(5, 'textbook', 'Physics', 'New School Physics for Senior Secondary Schools', 'M.W. Anyakoha, Ph.D.', NULL, NULL, 'uploads/resources/new_school_physics.html'),
(6, 'textbook', 'Mathematics', 'New General Mathematics for SS3', 'M.F. Macrae et al.', NULL, NULL, 'uploads/resources/waec_math_2024.html')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 27. Seed Default Class Timetable Schedules with Google Meet Links
INSERT INTO class_schedules (id, day_of_week, program, department, subject, start_time, end_time, room, teacher_id, teacher_name, meet_link, notification_message, notification_date, notification_sent_at) 
VALUES
(1, 'Monday', 'WAEC', 'Science', 'Physics', '09:00 AM', '10:15 AM', 'Online Class (Google Meet)', 2, 'Teacher John', 'https://meet.google.com/phy-live-waec', 'Reminder: Physics class tomorrow at 09:00 AM. Topic: Newton Laws of Motion.', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), NOW()),
(2, 'Monday', 'WAEC', 'Science', 'Mathematics', '10:30 AM', '11:45 AM', 'Science Hall 1', 1, 'System Administrator', 'https://meet.google.com/mth-core-2026', NULL, NULL, NULL),
(3, 'Tuesday', 'WAEC', 'Commercial', 'Economics', '09:00 AM', '10:15 AM', 'Online Class (Google Meet)', 3, 'Mrs. Ngozi', 'https://meet.google.com/eco-clas-waec', 'Reminder: Economics class tomorrow at 09:00 AM. Topic: Demand and Supply curves.', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), NOW()),
(4, 'Tuesday', 'WAEC', 'Science', 'Chemistry', '10:30 AM', '11:45 AM', 'Chemistry Lab Alpha', 2, 'Teacher John', 'https://meet.google.com/chm-lab-meet', NULL, NULL, NULL),
(5, 'Wednesday', 'WAEC', 'Science', 'English Language', '08:30 AM', '09:45 AM', 'Online Class (Google Meet)', 1, 'System Administrator', 'https://meet.google.com/eng-clas-waec', 'Reminder: English Language class tomorrow at 08:30 AM. Topic: Essay writing module.', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), NOW()),
(6, 'Wednesday', 'WAEC', 'Science', 'Biology', '10:00 AM', '11:15 AM', 'Biology Wing 3', 2, 'Teacher John', NULL, NULL, NULL, NULL),
(7, 'Thursday', 'WAEC', 'Science', 'Civic Education', '09:00 AM', '10:00 AM', 'Online Class (Google Meet)', 1, 'System Administrator', 'https://meet.google.com/civ-core-meet', NULL, NULL, NULL),
(8, 'Thursday', 'WAEC', 'Science', 'Further Mathematics', '10:30 AM', '11:45 AM', 'ICT Lab Beta', 1, 'System Administrator', NULL, NULL, NULL, NULL),
(9, 'Friday', 'WAEC', 'Science', 'Computer Studies', '09:00 AM', '10:15 AM', 'Computer Lab A', 1, 'System Administrator', 'https://meet.google.com/cpt-tech-room', NULL, NULL, NULL),
(10, 'Friday', 'WAEC', 'Science', 'Agricultural Science', '10:30 AM', '11:45 AM', 'Agric Field Station', 2, 'Teacher John', NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE subject=VALUES(subject);

-- 28. Seed Default Assignments
INSERT INTO assignments (id, subject, title, description, file_path, due_date, due_time, created_by) 
VALUES
(1, 'Physics', 'Physics Week 4: Newton Laws of Motion', 'Answer the calculations on page 42 of New School Physics. Show all working clearly.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), '23:59', 2),
(2, 'Economics', 'Economics Week 3: Market Equilibrium Analysis', 'Calculate consumer and producer surplus given the demand and supply curves provided.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), '23:59', 3),
(3, 'Mathematics', 'Mathematics Week 4: Quadratic Equations & Graphs', 'Solve exercises 3A through 3D. Submit typed answers or upload scanned handwriting.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), '23:59', 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 29. Seed Default Submissions with Grades & Remarks
INSERT INTO submissions (id, assignment_id, student_id, content, score, grade, remarks, graded_by, graded_at, submitted_at) 
VALUES
(1, 1, 4, '1. Force = mass * acceleration = 12kg * 4m/s^2 = 48N.\n2. Momentum = mv = 1500kg * 20m/s = 30,000 kg m/s.\n3. Newton third law states action and reaction are equal and opposite.', '88/100', 'A', 'Excellent working! All derivations and units are accurately stated.', 2, NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 1, 5, 'Problem 1: F = 48N. Problem 2: momentum = 30000. Working submitted in draft.', NULL, NULL, NULL, NULL, NULL, NOW()),
(3, 2, 6, 'Equilibrium price is calculated at Pe = 25 Naira, and equilibrium quantity Qe = 120 units. Elasticity is relatively inelastic (Ed = 0.65).', '92/100', 'A+', 'Outstanding equilibrium curve analysis. Very clear presentation.', 3, NOW(), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE content=VALUES(content);

-- 30. Seed Default ALOC Station API Settings
INSERT INTO aloc_settings (id, is_enabled, api_key, plan_tier, credits_remaining, credits_total, renewal_date, notifications) 
VALUES
(1, 1, 'ALOC-DEV-SCHOOL-2026-KEY', 'School Pro', 28450, 50000, DATE_ADD(CURRENT_DATE, INTERVAL 24 DAY), '[{"id":1,"title":"WAEC 2024 Exam Series Indexed","message":"All WAEC 2024 questions across Science, Commercial, and Arts subjects are now live in the CBT simulator.","type":"info","date":"2026-11-01"},{"id":2,"title":"JAMB UTME CBT Calibration Complete","message":"High-fidelity mock CBT mode with live timer and scoring calibrated to the latest JAMB syllabus.","type":"success","date":"2026-10-28"},{"id":3,"title":"Monthly Credit Status Update","message":"Your School Pro tier has 28,450 / 50,000 credits remaining. Auto-renewal scheduled in 24 days.","type":"alert","date":"2026-10-25"}]')
ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled);

-- 31. Seed Default Paystack API Settings
INSERT INTO paystack_settings 
(id, is_enabled, environment, public_key, secret_key, merchant_name, currency, fee_bearer, payroll_transfer_mode, balance_ngn, notifications)
VALUES 
(1, 1, 'test', 'pk_test_school_edu_portal_demo_2026', 'sk_test_school_edu_portal_demo_secret_2026', 'Springfield Academy Portal', 'NGN', 'account', 'automated', 1450000.00, '[{"id":1,"title":"Paystack Gateway Active (Test Mode)","message":"Paystack payment channel initialized. Test cards and bank transfers ready for student fee collection and staff payroll.","type":"success","date":"2026-11-04"},{"id":2,"title":"Staff Payroll Settlement Channel Verified","message":"Direct bank transfer channel configured. All Nigerian commercial banks verified for instant automated remittance.","type":"info","date":"2026-11-03"},{"id":3,"title":"Fee Bearer Policy Set to School Account","message":"Transaction charges are absorbed by school administration. Students pay exact tuition amounts without surcharge.","type":"info","date":"2026-11-02"}]')
ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled);

-- 32. Seed Default School Academic Session & Term Configuration
INSERT INTO school_academic_session (id, current_term, academic_session) 
VALUES (1, 'Term 1', '2024/2025')
ON DUPLICATE KEY UPDATE current_term=VALUES(current_term);

-- 33. Seed Governance Roles
INSERT INTO roles (id, slug, name, description, is_system) 
VALUES
(1, 'super_admin', 'Super Administrator', 'Full unconstrained administrative authority across the entire school platform', 1),
(2, 'principal', 'Principal / Head of School', 'Institutional administrative management and executive school oversight', 1),
(3, 'bursar', 'Bursar / Financial Officer', 'Manages school billing, tuition collections, general ledger, and staff payroll', 1),
(4, 'exam_officer', 'Examination & CBT Officer', 'Manages student CBT examinations, question banks, and gradebook audit', 1),
(5, 'vice_principal', 'Vice Principal (Academics)', 'Academic coordination, timetable schedules, and curriculum oversight', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 34. Seed Administrative Permissions
INSERT INTO permissions (id, slug, category, name, description)
VALUES
(1, 'admin.manage_admins', 'Governance', 'Manage System Administrators', 'Create, invite, update, and manage administrator access accounts'),
(2, 'admin.manage_roles', 'Governance', 'Manage Roles & Permissions', 'Configure RBAC roles, assign permissions, and set operational authority'),
(3, 'admin.view_audit_logs', 'Security', 'View Security Audit Logs', 'Inspect immutable security logs, administrative actions, and IP records'),
(4, 'students.manage', 'Admissions', 'Manage Students Directory', 'View, search, filter, and inspect registered student directories'),
(5, 'students.verify_payment', 'Finance', 'Verify Student Tuition', 'Review tuition payments, verify receipts, and issue Student IDs to Gmail'),
(6, 'finance.manage_fees', 'Finance', 'Configure Tuition Fees', 'Set school fees, monthly 10% discount rates, and weekly 4-part split rules'),
(7, 'finance.manage_payroll', 'Finance', 'Manage Staff Payroll', 'Disburse teacher salaries, manage NUBAN bank accounts, and generate payslips'),
(8, 'finance.view_ledger', 'Finance', 'View Financial General Ledger', 'Review automated Paystack income/expense logs and add manual journal entries'),
(9, 'finance.paystack_config', 'FinTech', 'Configure Paystack Gateway', 'Manage Paystack API credentials, test connection, and toggle gateway status'),
(10, 'academics.manage_timetable', 'Academics', 'Manage School Timetable', 'Create, edit, and assign weekly timetable schedules and Google Meet links'),
(11, 'academics.view_scoresheet', 'Academics', 'View Master Gradebook', 'Access general assignment score sheets across all departments and programs'),
(12, 'academics.manage_resources', 'Academics', 'Manage Learning Resources', 'Upload, update, and catalog WAEC/JAMB past questions and subject textbooks'),
(13, 'communications.notices', 'Communications', 'Publish School Bulletins', 'Post official notices with file attachments for students and staff'),
(14, 'communications.moderate_chat', 'Communications', 'Moderate Campus Messenger', 'Moderate chat channels, delete messages, and clear chat history')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 35. Map All Permissions to Super Admin Role (Role ID 1)
INSERT INTO role_permissions (role_id, permission_id)
VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- 36. Assign User 1 (System Administrator) to Super Admin Role
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES
(1, 1, 1)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- 37. Seed Default School Tuition Fee
INSERT INTO fees (id, title, description, base_monthly_fee, program, status)
VALUES
(1, 'School Tuition & Learning Access Fee', 'Standard academic tuition fee. Students paying monthly receive 10% discount (N18,000). Students paying weekly pay N5,000 per week.', 20000.00, 'All', 'active')
ON DUPLICATE KEY UPDATE base_monthly_fee=VALUES(base_monthly_fee);

-- 38. Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;
