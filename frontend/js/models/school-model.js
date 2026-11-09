/* ==========================================================================
   SCHOOL MODEL MODULE
   ========================================================================== */

const schoolModel = {
  user: null,

  /**
   * Fetch student overview data (subjects, schedules, assignments)
   */
  async getStudentOverview() {
    const res = await this.safeFetch('api/resources.php?action=student_overview');
    return res.ok && res.data && res.data.success ? res.data : { subjects: [], assignments: [], schedules: [] };
  },

  /**
   * Fetch personalized student performance analytics and data visualizations
   */
  async getStudentAnalytics() {
    const res = await this.safeFetch('api/student_analytics.php');
    return res.ok && res.data && res.data.success ? res.data : null;
  },

  /**
   * Student Payment Verification & Activation Methods
   */
  async verifyOnlinePayment(payload) {
    const res = await this.safeFetch('api/student_verification.php?action=verify_online_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.data || { success: false, message: 'Verification network failed' };
  },

  async submitManualPayment(payload) {
    const res = await this.safeFetch('api/student_verification.php?action=submit_manual_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.data || { success: false, message: 'Manual payment submission failed' };
  },

  async checkVerificationStatus(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await this.safeFetch(`api/student_verification.php?action=check_verification_status&${qs}`);
    return res.data || { success: false };
  },

  async getPendingStudentVerifications() {
    const res = await this.safeFetch('api/student_verification.php?action=admin_list_pending');
    return res.ok && res.data && res.data.success ? res.data : { count: 0, requests: [], recent_verified: [] };
  },

  async adminVerifyStudentPayment(payload) {
    const res = await this.safeFetch('api/student_verification.php?action=admin_manual_verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.data || { success: false, message: 'Admin verification failed' };
  },

  async adminRejectStudentPayment(payload) {
    const res = await this.safeFetch('api/student_verification.php?action=admin_reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.data || { success: false, message: 'Admin rejection failed' };
  },

  /**
   * Fetch textbooks or past questions with optional filters:
   * e.g. { type: 'past_question', exam: 'WAEC', subject: 'Mathematics', year: '2024', search: '' }
   */
  async getResources(filters = {}) {
    let url = 'api/resources.php?action=list_resources';
    if (typeof filters === 'string') {
      if (filters) url += `&type=${encodeURIComponent(filters)}`;
    } else if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.exam) params.append('exam', filters.exam);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.year) params.append('year', filters.year);
      if (filters.search) params.append('search', filters.search);
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    return res.ok && res.data && Array.isArray(res.data.data) ? res.data.data : [];
  },

  /**
   * Fetch single resource by ID
   */
  async getResource(id) {
    const res = await this.safeFetch(`api/resources.php?action=get_resource&id=${encodeURIComponent(id)}`);
    if (res.ok && res.data && res.data.success) return res.data.data;
    throw new Error((res.data && res.data.message) || 'Resource not found.');
  },

  /**
   * Add resource (Staff/Admin)
   * Supports FormData (for file uploads) or plain object
   */
  async addResource(data) {
    let options;
    if (data instanceof FormData) {
      options = {
        method: 'POST',
        body: data
      };
    } else {
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    const res = await this.safeFetch('api/resources.php?action=add_resource', options);
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to add resource.');
  },

  /**
   * Edit resource (Staff/Admin)
   */
  async editResource(id, data) {
    let options;
    if (data instanceof FormData) {
      if (!data.has('id')) data.append('id', id);
      options = {
        method: 'POST',
        body: data
      };
    } else {
      const payload = Object.assign({}, data, { id });
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };
    }

    const res = await this.safeFetch('api/resources.php?action=edit_resource', options);
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to update resource.');
  },

  /**
   * Delete resource (Staff/Admin)
   */
  async deleteResource(id) {
    const res = await this.safeFetch('api/resources.php?action=delete_resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to delete resource.');
  },

  /**
   * Create assignment (Staff/Admin)
   * Supports FormData (for attached assignment files) or JSON
   */
  async createAssignment(data) {
    let options;
    if (data instanceof FormData) {
      options = {
        method: 'POST',
        body: data
      };
    } else {
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }
    const res = await this.safeFetch('api/resources.php?action=create_assignment', options);
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to create assignment.');
  },

  /**
   * Submit coursework / assignment answer (Student)
   * Supports FormData (for attached file + content) or (assignmentId, content)
   */
  async submitAssignment(data, maybeContent = '') {
    let options;
    if (data instanceof FormData) {
      options = {
        method: 'POST',
        body: data
      };
    } else {
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: data, content: maybeContent })
      };
    }
    const res = await this.safeFetch('api/resources.php?action=submit_assignment', options);
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to submit assignment.');
  },

  /**
   * Resolve API endpoint URL dynamically across frontend/ and root paths
   */
  resolveApiUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('../backend/') || url.startsWith('backend/')) {
      return url;
    }
    const inFrontend = (typeof window !== 'undefined' && window.location && window.location.pathname.includes('/frontend'));
    const prefix = inFrontend ? '../backend/' : 'backend/';
    return prefix + url.replace(/^\//, '');
  },

  /**
   * Safe fetch wrapper handling JSON responses and status errors
   */
  async safeFetch(url, options = {}) {
    const resolvedUrl = this.resolveApiUrl(url);
    try {
      const response = await fetch(resolvedUrl, options);
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      console.error(`Fetch error for ${url} (${resolvedUrl}):`, error);
      return { ok: false, status: 500, data: { message: 'Network or server error.' } };
    }
  },

  /**
   * Check active PHP session on app launch
   */
  async checkSession() {
    const res = await this.safeFetch('api/auth.php?action=check_session');
    if (res.ok && res.data && res.data.loggedIn && res.data.user) {
      this.user = res.data.user;
      return this.user;
    }
    this.user = null;
    return null;
  },

  /**
   * Authenticate user with email, password, and active role tab
   */
  async loginWithCredentials(email, password) {
    const role = window.currentRole || 'student';

    const res = await this.safeFetch('api/auth.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    if (res.ok && res.data && res.data.success && res.data.user) {
      this.user = res.data.user;
      return this.user;
    }

    const err = new Error((res.data && res.data.message) || 'Invalid Student ID/email or password.');
    if (res.data && res.data.is_unverified) {
      err.is_unverified = true;
      err.user_id = res.data.user_id;
      err.email = res.data.email;
    }
    throw err;
  },

  /**
   * End current session
   */
  async logout() {
    await this.safeFetch('api/auth.php?action=logout');
    this.user = null;
  },

  /**
   * Fetch all staff accounts (Admin Only)
   */
  async staffAccounts() {
    const res = await this.safeFetch('api/auth.php?action=list_staff');
    return (res.ok && res.data && Array.isArray(res.data.data)) ? res.data.data : [];
  },

  /**
   * Fetch registered students:
   * Admin: all registered students (with optional search, program, department)
   * Staff: students offering the staff member's course/subject
   */
  async getStudents(filters = {}) {
    let url = 'api/auth.php?action=list_students';
    if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.program) params.append('program', filters.program);
      if (filters.department) params.append('department', filters.department);
      if (filters.subject) params.append('subject', filters.subject);
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    return res.ok && res.data && res.data.success ? res.data : { success: false, data: [], total: 0, count: 0 };
  },

  /**
   * Create a new staff record in users table
   */
  async createStaffAccount(details) {
    const res = await this.safeFetch('api/auth.php?action=create_staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });

    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to create staff account.');
  },

  /**
   * Generate an access code entry in staff_codes table
   */
  async issueStaffAccessCode(email) {
    const res = await this.safeFetch('api/auth.php?action=issue_staff_code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to issue access code.');
  },

  /* ------------------------------------------------------------------------
     TIMETABLE & GOOGLE MEET LIVE CLASSES
     ------------------------------------------------------------------------ */
  async getTimetable(filters = {}) {
    let url = 'api/timetable.php?action=list_schedules';
    if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      if (filters.day) params.append('day', filters.day);
      if (filters.department) params.append('department', filters.department);
      if (filters.program) params.append('program', filters.program);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.staff_only) params.append('staff_only', 'true');
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    return (res.ok && res.data && Array.isArray(res.data.data)) ? res.data.data : [];
  },

  async getSchedule(id) {
    const res = await this.safeFetch(`api/timetable.php?action=get_schedule&id=${encodeURIComponent(id)}`);
    if (res.ok && res.data && res.data.success) return res.data.data;
    throw new Error((res.data && res.data.message) || 'Class schedule not found.');
  },

  async createSchedule(data) {
    const res = await this.safeFetch('api/timetable.php?action=create_schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to create timetable class schedule.');
  },

  async editSchedule(id, data) {
    const payload = Object.assign({}, data, { id });
    const res = await this.safeFetch('api/timetable.php?action=edit_schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to update timetable class schedule.');
  },

  async deleteSchedule(id) {
    const res = await this.safeFetch('api/timetable.php?action=delete_schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to delete timetable class schedule.');
  },

  async sendClassNotification(id, details = {}) {
    const payload = Object.assign({}, details, { id });
    const res = await this.safeFetch('api/timetable.php?action=send_notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to send class notification to students.');
  },

  async updateClassMeetLink(id, meet_link) {
    const res = await this.safeFetch('api/timetable.php?action=update_meet_link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, meet_link })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to update Google Meet link.');
  },

  /* ------------------------------------------------------------------------
     ASSIGNMENT SUBMISSIONS, GRADING & GENERAL SCORE SHEET
     ------------------------------------------------------------------------ */
  async getSubmissions(filters = {}) {
    let url = 'api/resources.php?action=list_submissions';
    if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      if (filters.assignment_id) params.append('assignment_id', filters.assignment_id);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.status) params.append('status', filters.status);
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    const list = (res.ok && res.data && Array.isArray(res.data.data)) ? res.data.data : [];
    list.data = list;
    return list;
  },

  async gradeSubmission(data) {
    const res = await this.safeFetch('api/resources.php?action=grade_submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to submit grade and remarks.');
  },

  async getGeneralScoresheet(filters = {}) {
    let url = 'api/resources.php?action=general_scoresheet';
    if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.assignment_id) params.append('assignment_id', filters.assignment_id);
      if (filters.program) params.append('program', filters.program);
      if (filters.department) params.append('department', filters.department);
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) return res.data;
    return { scoresheet: [], summary: {}, subjects: [], assignments: [] };
  },

  /* ------------------------------------------------------------------------
     LEADERBOARD & ACADEMIC RANKINGS
     ------------------------------------------------------------------------ */
  async getLeaderboard(filters = {}) {
    let url = 'api/resources.php?action=get_leaderboard';
    if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.program) params.append('program', filters.program);
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) return res.data;
    return { leaderboard: [], my_standing: null, total_students: 0 };
  },

  /* ------------------------------------------------------------------------
     SCHOOL NOTICES & STAFF UPDATES
     ------------------------------------------------------------------------ */
  async getNotices(filters = {}) {
    let url = 'api/notices.php?action=get_notices';
    if (typeof filters === 'object' && filters !== null) {
      const params = new URLSearchParams();
      const target = filters.target || filters.audience;
      if (target) params.append('target', target);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      const qs = params.toString();
      if (qs) url += `&${qs}`;
    }
    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) return res.data;
    return { notices: [], counts: { total: 0, student: 0, staff: 0, all: 0 }, total: 0 };
  },

  async getNotice(id) {
    const res = await this.safeFetch(`api/notices.php?action=get_notice&id=${encodeURIComponent(id)}`);
    if (res.ok && res.data && res.data.success) return res.data.notice || res.data;
    throw new Error((res.data && res.data.message) || 'Failed to load notice details.');
  },

  async saveNotice(formData) {
    if (!formData.has('action')) {
      const id = formData.get('id');
      formData.append('action', id ? 'update_notice' : 'create_notice');
    }
    // Uses fetch with multipart FormData
    const noticesUrl = this.resolveApiUrl('api/notices.php');
    const res = await fetch(noticesUrl, {
      method: 'POST',
      body: formData
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.success) return data;
    throw new Error((data && data.message) || 'Failed to save notice.');
  },

  async deleteNotice(id) {
    const res = await this.safeFetch(`api/notices.php?action=delete_notice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to delete notice.');
  },

  /* ------------------------------------------------------------------------
     ADMIN ANALYTICS & ADMINISTRATOR GOVERNANCE (RBAC)
     ------------------------------------------------------------------------ */
  async getAdminAnalytics() {
    const res = await this.safeFetch('api/admin_analytics.php');
    if (res.ok && res.data && res.data.success) return res.data.analytics;
    return null;
  },

  async getAdminAccounts() {
    const res = await this.safeFetch('api/admin_management.php?action=get_admins');
    if (res.ok && res.data && res.data.success) return res.data;
    return { admins: [], invitations: [] };
  },

  async getAdminRoles() {
    const res = await this.safeFetch('api/admin_management.php?action=get_roles');
    if (res.ok && res.data && res.data.success) return res.data;
    return { roles: [], permissions: [] };
  },

  async inviteAdmin(data) {
    const res = await this.safeFetch('api/admin_management.php?action=invite_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to create administrator invitation.');
  },

  async toggleAdminStatus(userId, status) {
    const res = await this.safeFetch('api/admin_management.php?action=toggle_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to update administrator status.');
  },

  async updateAdminRole(userId, roleId) {
    const res = await this.safeFetch('api/admin_management.php?action=update_role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role_id: roleId })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to update administrator role.');
  },

  async revokeAdmin(userId) {
    const res = await this.safeFetch('api/admin_management.php?action=revoke_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to revoke administrator privileges.');
  },

  async getAuditLogs(limit = 50) {
    const res = await this.safeFetch(`api/admin_management.php?action=get_audit_logs&limit=${encodeURIComponent(limit)}`);
    if (res.ok && res.data && res.data.success) return res.data.logs || [];
    return [];
  },

  /* ------------------------------------------------------------------------
     ATTENDANCE (STUDENT, STAFF & ADMIN)
     ------------------------------------------------------------------------ */
  async getStudentAttendance(studentId = 0) {
    let url = 'api/attendance.php';
    if (studentId > 0) {
      url += `?student_id=${studentId}`;
    }
    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) return res.data;
    return { data: [], summary: { present: 0, absent: 0, late: 0, total_sessions: 0, attendance_points: 0 } };
  },

  async logAttendance(payload = {}) {
    const res = await this.safeFetch('api/attendance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) return res.data;
    throw new Error((res.data && res.data.message) || 'Failed to record attendance.');
  },

  /* ------------------------------------------------------------------------
     FEES & BILLING (STUDENT & ADMIN)
     ------------------------------------------------------------------------ */
  async getStudentFeeInfo() {
    const res = await this.safeFetch('api/resources.php?action=get_student_fee_info');
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load school fee details.');
  },

  async payStudentFee(payload = {}) {
    const res = await this.safeFetch('api/resources.php?action=pay_student_fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      if (res.data.user && this.user) {
        this.user.is_paid = res.data.user.is_paid;
        this.user.paid_until = res.data.user.paid_until;
        this.user.payment_plan = res.data.user.payment_plan;
      }
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Payment verification failed.');
  },

  async getAdminFees() {
    const res = await this.safeFetch('api/resources.php?action=get_admin_fees');
    if (res.ok && res.data && res.data.success) {
      if (res.data.paystack) {
        this.paystackSettings = res.data.paystack;
      }
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load fee management records.');
  },

  async saveFee(payload) {
    const res = await this.safeFetch('api/resources.php?action=save_fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to save fee settings.');
  },

  async adminToggleStudentPayment(payload) {
    const res = await this.safeFetch('api/resources.php?action=admin_toggle_student_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to update student payment.');
  },

  /* ------------------------------------------------------------------------
     STAFF PAYROLL & BANKING REMITTANCE
     ------------------------------------------------------------------------ */
  async getStaffPayrollInfo(monthYear = '') {
    let url = 'api/resources.php?action=get_staff_payroll_info';
    if (monthYear) url += `&month_year=${encodeURIComponent(monthYear)}`;
    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) {
      if (res.data.paystack) {
        this.paystackSettings = res.data.paystack;
      }
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load staff payroll details.');
  },

  async updateStaffBanking(payload) {
    const res = await this.safeFetch('api/resources.php?action=update_staff_banking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      if (this.user && (!payload.staff_id || payload.staff_id === this.user.id)) {
        this.user.bank_name = payload.bank_name;
        this.user.account_number = payload.account_number;
        this.user.account_name = payload.account_name;
      }
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to update bank details.');
  },

  async processStaffSalary(payload) {
    const res = await this.safeFetch('api/resources.php?action=process_staff_salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Salary payout failed.');
  },

  async getSinglePayslip(referenceOrId) {
    const param = typeof referenceOrId === 'number' ? `id=${referenceOrId}` : `reference=${encodeURIComponent(referenceOrId)}`;
    const res = await this.safeFetch(`api/resources.php?action=get_single_payslip&${param}`);
    if (res.ok && res.data && res.data.success) {
      return res.data.payslip;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load payslip.');
  },

  /* ------------------------------------------------------------------------
     ALOC STATION API METHODS
     ------------------------------------------------------------------------ */
  async getAlocSettings() {
    const res = await this.safeFetch('api/resources.php?action=get_aloc_settings');
    if (res.ok && res.data && res.data.success) {
      this.alocSettings = res.data.settings;
      return res.data.settings;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load ALOC Station API settings.');
  },

  async toggleAlocStatus(isEnabled) {
    const res = await this.safeFetch('api/resources.php?action=toggle_aloc_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: isEnabled ? 1 : 0 })
    });
    if (res.ok && res.data && res.data.success) {
      this.alocSettings = res.data.settings;
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to change ALOC status.');
  },

  async saveAlocSettings(payload) {
    const res = await this.safeFetch('api/resources.php?action=save_aloc_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      this.alocSettings = res.data.settings;
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to save ALOC settings.');
  },

  async dismissAlocNotification(notifId) {
    const res = await this.safeFetch('api/resources.php?action=aloc_dismiss_notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notifId })
    });
    return res.ok && res.data && res.data.success;
  },

  async pingCbtProvider(providerKey = 'aloc') {
    const res = await this.safeFetch(`api/resources.php?action=ping_cbt_provider&provider=${encodeURIComponent(providerKey)}`);
    if (res.ok && res.data) {
      return res.data;
    }
    return { success: false, provider: providerKey, message: 'Ping request failed.' };
  },

  async fetchAlocQuestions(params = {}) {
    const query = new URLSearchParams({
      subject: params.subject || 'Mathematics',
      examType: params.examType || 'waec',
      year: params.year || '2024',
      limit: params.limit || 10
    });
    const res = await this.safeFetch(`api/resources.php?action=aloc_fetch_questions&${query.toString()}`);
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    if (res.data && res.data.disabled) {
      return { disabled: true, message: res.data.message, data: [] };
    }
    throw new Error((res.data && res.data.message) || 'Failed to fetch ALOC questions.');
  },

  /* ------------------------------------------------------------------------
     PAYSTACK API METHODS
     ------------------------------------------------------------------------ */
  async getPaystackSettings() {
    const res = await this.safeFetch('api/resources.php?action=get_paystack_settings');
    if (res.ok && res.data && res.data.success) {
      this.paystackSettings = res.data.settings;
      return res.data.settings;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load Paystack settings.');
  },

  async togglePaystackStatus(isEnabled) {
    const res = await this.safeFetch('api/resources.php?action=toggle_paystack_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: isEnabled ? 1 : 0 })
    });
    if (res.ok && res.data && res.data.success) {
      this.paystackSettings = res.data.settings;
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to change Paystack status.');
  },

  async savePaystackSettings(payload) {
    const res = await this.safeFetch('api/resources.php?action=save_paystack_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      this.paystackSettings = res.data.settings;
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to save Paystack settings.');
  },

  async dismissPaystackNotification(notifId) {
    const res = await this.safeFetch('api/resources.php?action=paystack_dismiss_notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notifId })
    });
    return res.ok && res.data && res.data.success;
  },

  async initializePaystackFee(plan = 'monthly', studentId = null) {
    const payload = { plan };
    if (studentId) payload.student_id = studentId;
    const res = await this.safeFetch('api/resources.php?action=initialize_paystack_fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    if (res.data && res.data.disabled) {
      return { disabled: true, message: res.data.message };
    }
    throw new Error((res.data && res.data.message) || 'Failed to initialize Paystack checkout.');
  },

  async verifyPaystackPayment(reference, plan = 'monthly', studentId = null) {
    const payload = { reference, plan };
    if (studentId) payload.student_id = studentId;
    const res = await this.safeFetch('api/resources.php?action=verify_paystack_payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      if (this.user && (!studentId || Number(this.user.id) === Number(studentId))) {
        this.user.is_paid = 1;
        this.user.paid_until = res.data.paid_until;
        this.user.payment_plan = plan;
      }
      return res.data;
    }
    if (res.data && res.data.disabled) {
      return { disabled: true, message: res.data.message };
    }
    throw new Error((res.data && res.data.message) || 'Failed to verify Paystack payment.');
  },

  /* ------------------------------------------------------------------------
     FINANCIAL RECORD BOOK & BALANCE SHEET METHODS
     ------------------------------------------------------------------------ */
  async getFinancialLedger(filters = {}) {
    let url = 'api/resources.php?action=get_financial_ledger';
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.channel && filters.channel !== 'all') params.append('channel', filters.channel);
    if (filters.source && filters.source !== 'all') params.append('source', filters.source);
    if (filters.period && filters.period !== 'all') params.append('period', filters.period);
    if (filters.search) params.append('search', filters.search);

    const qs = params.toString();
    if (qs) url += '&' + qs;

    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) {
      if (res.data.paystack) this.paystackSettings = res.data.paystack;
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load financial record book and balance sheet.');
  },

  async addExternalTransaction(payload) {
    const res = await this.safeFetch('api/resources.php?action=add_external_transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to record external transaction.');
  },

  async deleteExternalTransaction(id) {
    const res = await this.safeFetch('api/resources.php?action=delete_external_transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to remove transaction from ledger.');
  },

  /* ==========================================================================
     CAMPUS CHAT & DIRECT MESSAGING (DMs)
     ========================================================================== */
  async getChatSidebar() {
    const res = await this.safeFetch('api/chat.php?action=get_sidebar');
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to load chat channels and contacts.');
  },

  async getChatMessages(type = 'group', target = 'general', lastId = 0) {
    const url = `api/chat.php?action=get_messages&type=${encodeURIComponent(type)}&target=${encodeURIComponent(target)}${lastId > 0 ? `&last_id=${lastId}` : ''}`;
    const res = await this.safeFetch(url);
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to fetch conversation messages.');
  },

  async sendChatMessage(payload) {
    const res = await this.safeFetch('api/chat.php?action=send_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to send message.');
  },

  async deleteChatMessage(messageId) {
    const res = await this.safeFetch('api/chat.php?action=delete_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId })
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to delete message.');
  },

  async pollChatUnread() {
    const res = await this.safeFetch('api/chat.php?action=poll_unread');
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    return { success: false, total_unread_dms: 0, latest_general_msg_id: 0 };
  },

  /* ------------------------------------------------------------------------
     ACADEMIC SESSION & TERM CONFIGURATION
     ------------------------------------------------------------------------ */
  async getAcademicSession() {
    const res = await this.safeFetch('api/resources.php?action=get_academic_session');
    if (res.ok && res.data && res.data.success && res.data.academic_session) {
      return res.data.academic_session;
    }
    return { current_term: 'Term 1', academic_session: '2024/2025', display_label: 'Term 1 · 2024/2025' };
  },

  async updateAcademicSession(term, session) {
    const res = await this.safeFetch('api/resources.php?action=update_academic_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_term: term, academic_session: session })
    });
    if (res.ok && res.data && res.data.success) {
      return res.data;
    }
    throw new Error((res.data && res.data.message) || 'Failed to update academic session.');
  }
};

window.schoolModel = schoolModel;
