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
   * Safe fetch wrapper handling JSON responses and status errors
   */
  async safeFetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
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
    const role = window.currentRole || 'admin';

    const res = await this.safeFetch('api/auth.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    if (res.ok && res.data && res.data.success && res.data.user) {
      this.user = res.data.user;
      return this.user;
    }

    throw new Error((res.data && res.data.message) || 'Invalid email or password.');
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
  }
};
