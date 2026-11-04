-- 1. Create and select database
CREATE DATABASE IF NOT EXISTS school_portal_db;
USE school_portal_db;

-- Drop existing tables to establish clean constraints (Optional)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS class_schedules;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS staff_codes;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Users Table (Students, Staff, Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'student') NOT NULL DEFAULT 'student',
    program VARCHAR(50) NULL DEFAULT 'WAEC', -- e.g., WAEC, JAMB
    department VARCHAR(50) NULL DEFAULT 'Science', -- e.g., Science, Commercial, Art
    subjects TEXT NULL, -- Stored as JSON array string e.g. ["Mathematics","Physics"]
    bank_name VARCHAR(100) NULL,
    account_number VARCHAR(20) NULL,
    account_name VARCHAR(100) NULL,
    monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 75000.00,
    is_paid TINYINT(1) NOT NULL DEFAULT 0,
    paid_until DATETIME NULL,
    payment_plan VARCHAR(20) NULL, -- 'weekly', 'monthly'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Staff Access Codes Table (For Admin Verification)
CREATE TABLE IF NOT EXISTS staff_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Resources Table (Textbooks & Past Questions)
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('textbook', 'past_question') NOT NULL,
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NULL,
    exam VARCHAR(50) NULL, -- e.g., WAEC, JAMB
    year VARCHAR(10) NULL, -- e.g., 2024
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Class Schedules & Notifications Table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_path VARCHAR(255) NULL,
    due_date DATE NOT NULL,
    due_time VARCHAR(20) NULL DEFAULT '23:59',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Submissions Table
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
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Fees Table (Admin Configured Tuition & Access Fees)
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL DEFAULT 'School Tuition & Learning Access Fee',
    description TEXT NULL,
    base_monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 20000.00,
    program VARCHAR(50) NOT NULL DEFAULT 'All', -- 'All', 'WAEC', 'JAMB'
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Payments Table (Student Fee Records)
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
    status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'success',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'online', -- 'online', 'bank_transfer', 'cash', 'manual_admin'
    paid_until DATETIME NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Staff Payroll & Remittance Table
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
    status ENUM('paid', 'processing', 'failed') NOT NULL DEFAULT 'paid',
    notes TEXT NULL,
    paid_by_admin_id INT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================================
-- SEED DATA SETUP
-- ==========================================================================

-- Insert Default Admin (Password: AdminSecure2026!)
INSERT INTO users (name, email, password, role) 
VALUES (
  'System Administrator', 
  'admin@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'admin'
);

-- Insert Default Staff: Teacher John (Physics Teacher) & Mrs. Ngozi (Economics Teacher)
INSERT INTO users (name, email, password, role, department, subjects) 
VALUES 
(
  'Teacher John', 
  'staff@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'staff',
  'Science',
  '["Physics"]'
),
(
  'Mrs. Ngozi', 
  'ngozi@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'staff',
  'Commercial',
  '["Economics"]'
);

-- Insert Default Staff Access Codes (For login verification)
INSERT INTO staff_codes (email, code, is_used)
VALUES 
('staff@school.com', 'STAFF-1234', 0),
('ngozi@school.com', 'STAFF-5678', 0);

-- Insert Registered Students
INSERT INTO users (name, email, password, role, program, department, subjects) 
VALUES 
(
  'Ada Obi', 
  'student@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'WAEC',
  'Science',
  '["Mathematics", "English Language", "Civic Education", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Geography", "Health Education", "Computer Studies"]'
),
(
  'Chidi Eze', 
  'chidi@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'JAMB',
  'Science',
  '["English Language", "Mathematics", "Physics", "Chemistry"]'
),
(
  'Fatima Bello', 
  'fatima@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'WAEC',
  'Commercial',
  '["Mathematics", "English Language", "Civic Education", "Economics", "Financial Accounting / Accounting", "Commerce", "Marketing", "Office Practice", "Government", "Data Processing", "Computer Studies"]'
),
(
  'Emeka Okafor', 
  'emeka@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'JAMB',
  'Art',
  '["English Language", "Literature-in-English", "Government", "Christian Religious Studies (CRS)"]'
),
(
  'Babatunde Lawal', 
  'tunde@school.com', 
  '$2y$10$e0myzXyjpJS7Pd0RVvHwHeFz2d8K8G6JvA0T/L13xT7NqA1gE4m26', 
  'student',
  'WAEC',
  'Science',
  '["Mathematics", "English Language", "Civic Education", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Technical Drawing", "Computer Hardware and GSM Repairs", "Data Processing"]'
);

-- Insert Default Educational Resources (Past Questions & Textbooks)
INSERT INTO resources (type, subject, title, author, exam, year, file_path) VALUES
('past_question', 'Mathematics', 'WAEC 2024 General Mathematics (Paper 1 & 2)', NULL, 'WAEC', '2024', 'uploads/resources/waec_math_2024.html'),
('past_question', 'Physics', 'JAMB UTME 2024 Physics CBT Comprehensive Practice', NULL, 'JAMB', '2024', 'uploads/resources/jamb_physics_2024.html'),
('past_question', 'English Language', 'WAEC 2023 English Language Comprehension & Lexis', NULL, 'WAEC', '2023', 'uploads/resources/waec_math_2024.html'),
('past_question', 'Chemistry', 'JAMB UTME 2023 Chemistry Practice Paper', NULL, 'JAMB', '2023', 'uploads/resources/jamb_physics_2024.html'),
('textbook', 'Physics', 'New School Physics for Senior Secondary Schools', 'M.W. Anyakoha, Ph.D.', NULL, NULL, 'uploads/resources/new_school_physics.html'),
('textbook', 'Mathematics', 'New General Mathematics for SS3', 'M.F. Macrae et al.', NULL, NULL, 'uploads/resources/waec_math_2024.html');

-- Insert Default Class Timetable Schedules with Google Meet Links & 1-Day Reminders
INSERT INTO class_schedules (day_of_week, program, department, subject, start_time, end_time, room, teacher_id, teacher_name, meet_link, notification_message, notification_date, notification_sent_at) VALUES
('Monday', 'WAEC', 'Science', 'Physics', '09:00 AM', '10:15 AM', 'Online Class (Google Meet)', 2, 'Teacher John', 'https://meet.google.com/phy-live-waec', 'Reminder: Physics class tomorrow at 09:00 AM. We will be discussing Newton Laws of Motion. Join via Google Meet.', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), NOW()),
('Monday', 'WAEC', 'Science', 'Mathematics', '10:30 AM', '11:45 AM', 'Science Hall 1', 1, 'System Administrator', 'https://meet.google.com/mth-core-2026', NULL, NULL, NULL),
('Tuesday', 'WAEC', 'Commercial', 'Economics', '09:00 AM', '10:15 AM', 'Online Class (Google Meet)', 3, 'Mrs. Ngozi', 'https://meet.google.com/eco-clas-waec', 'Reminder: Economics class tomorrow at 09:00 AM. Topic: Demand and Supply curves.', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), NOW()),
('Tuesday', 'WAEC', 'Science', 'Chemistry', '10:30 AM', '11:45 AM', 'Chemistry Lab Alpha', 2, 'Teacher John', 'https://meet.google.com/chm-lab-meet', NULL, NULL, NULL),
('Wednesday', 'WAEC', 'Science', 'English Language', '08:30 AM', '09:45 AM', 'Online Class (Google Meet)', 1, 'System Administrator', 'https://meet.google.com/eng-clas-waec', 'Reminder: English Language class tomorrow at 08:30 AM. Essay writing module.', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), NOW()),
('Wednesday', 'WAEC', 'Science', 'Biology', '10:00 AM', '11:15 AM', 'Biology Wing 3', 2, 'Teacher John', NULL, NULL, NULL, NULL),
('Thursday', 'WAEC', 'Science', 'Civic Education', '09:00 AM', '10:00 AM', 'Online Class (Google Meet)', 1, 'System Administrator', 'https://meet.google.com/civ-core-meet', NULL, NULL, NULL),
('Thursday', 'WAEC', 'Science', 'Further Mathematics', '10:30 AM', '11:45 AM', 'ICT Lab Beta', 1, 'System Administrator', NULL, NULL, NULL, NULL),
('Friday', 'WAEC', 'Science', 'Computer Studies', '09:00 AM', '10:15 AM', 'Computer Lab A', 1, 'System Administrator', 'https://meet.google.com/cpt-tech-room', NULL, NULL, NULL),
('Friday', 'WAEC', 'Science', 'Agricultural Science', '10:30 AM', '11:45 AM', 'Agric Field Station', 2, 'Teacher John', NULL, NULL, NULL, NULL);

-- Insert Default Assignments
INSERT INTO assignments (id, subject, title, description, file_path, due_date, due_time, created_by) VALUES
(1, 'Physics', 'Physics Week 4: Newton Laws of Motion', 'Answer the calculations on page 42 of New School Physics. Show all working clearly.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), '23:59', 2),
(2, 'Economics', 'Economics Week 3: Market Equilibrium Analysis', 'Calculate consumer and producer surplus given the demand and supply curves provided.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), '23:59', 3),
(3, 'Mathematics', 'Mathematics Week 4: Quadratic Equations & Graphs', 'Solve exercises 3A through 3D. Submit typed answers or upload scanned handwriting.', NULL, DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), '23:59', 1);

-- Insert Default Submissions with Grades & Remarks
INSERT INTO submissions (id, assignment_id, student_id, content, score, grade, remarks, graded_by, graded_at, submitted_at) VALUES
(1, 1, 4, '1. Force = mass * acceleration = 12kg * 4m/s^2 = 48N.\n2. Momentum = mv = 1500kg * 20m/s = 30,000 kg m/s.\n3. Newton third law states action and reaction are equal and opposite.', '88/100', 'A', 'Excellent working! All derivations and units are accurately stated.', 2, NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 1, 5, 'Problem 1: F = 48N. Problem 2: momentum = 30000. Working submitted in draft.', NULL, NULL, NULL, NULL, NULL, NOW()),
(3, 2, 6, 'Equilibrium price is calculated at Pe = 25 Naira, and equilibrium quantity Qe = 120 units. Elasticity is relatively inelastic (Ed = 0.65).', '92/100', 'A+', 'Outstanding equilibrium curve analysis. Very clear presentation.', 3, NOW(), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ==========================================================================
-- 12. ALOC Station API Settings & Configuration Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default ALOC Station API Settings
INSERT INTO aloc_settings (id, is_enabled, api_key, plan_tier, credits_remaining, credits_total, renewal_date, notifications) VALUES
(1, 1, 'ALOC-DEV-SCHOOL-2026-KEY', 'School Pro', 28450, 50000, DATE_ADD(CURRENT_DATE, INTERVAL 24 DAY), '[{"id":1,"title":"WAEC 2024 Exam Series Indexed","message":"All WAEC 2024 questions across Science, Commercial, and Arts subjects are now live in the CBT simulator.","type":"info","date":"2026-11-01"},{"id":2,"title":"JAMB UTME CBT Calibration Complete","message":"High-fidelity mock CBT mode with live timer and scoring calibrated to the latest JAMB syllabus.","type":"success","date":"2026-10-28"},{"id":3,"title":"Monthly Credit Status Update","message":"Your School Pro tier has 28,450 / 50,000 credits remaining. Auto-renewal scheduled in 24 days.","type":"alert","date":"2026-10-25"}]');

-- ==========================================================================
-- 13. Paystack API Settings & Configuration Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Paystack API Settings
INSERT INTO paystack_settings 
(id, is_enabled, environment, public_key, secret_key, merchant_name, currency, fee_bearer, payroll_transfer_mode, balance_ngn, notifications)
VALUES 
(1, 1, 'test', 'pk_test_school_edu_portal_demo_2026', 'sk_test_school_edu_portal_demo_secret_2026', 'Springfield Academy Portal', 'NGN', 'account', 'automated', 1450000.00, '[{"id":1,"title":"Paystack Gateway Active (Test Mode)","message":"Paystack payment channel initialized. Test cards and bank transfers ready for student fee collection and staff payroll.","type":"success","date":"2026-11-04"},{"id":2,"title":"Staff Payroll Settlement Channel Verified","message":"Direct bank transfer channel configured. All Nigerian commercial banks verified for instant automated remittance.","type":"info","date":"2026-11-03"},{"id":3,"title":"Fee Bearer Policy Set to School Account","message":"Transaction charges are absorbed by school administration. Students pay exact tuition amounts without surcharge.","type":"info","date":"2026-11-02"}]');

