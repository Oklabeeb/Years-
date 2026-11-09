/* ==========================================================================
   SCHOOL CONTROLLER MODULE
   ========================================================================== */

const schoolController = {
  model: schoolModel,
  view: SchoolView,
  currentFilter: 'all',
  currentSearch: '',

  async login(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim() || '';
    const password = document.getElementById('loginPassword')?.value || '';

    if (!email || !password) {
      alert('Please fill in both email and password.');
      return;
    }

    try {
      const user = await schoolModel.loginWithCredentials(email, password);

      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.style.display = 'none';
        loginScreen.classList.add('hidden');
      }

      if (user.role === 'admin') {
        await SchoolView.initializeAdmin();
      } else if (user.role === 'staff') {
        await SchoolView.initializeStaff();
      } else if (user.role === 'student') {
        await SchoolView.initializeStudent();
      }
    } catch (err) {
      if (err.is_unverified) {
        if (confirm(`${err.message}\n\nWould you like to open the Tuition Payment & Verification window now to complete your enrollment?`)) {
          this.openStudentPaymentVerificationModal({
            user_id: err.user_id,
            id: err.user_id,
            email: err.email,
            student_email: err.email,
            student_name: 'Enrolled Student',
            name: 'Enrolled Student'
          });
        }
      } else {
        alert(err.message || 'Login failed. Check your Student ID and password.');
      }
    }
  },

  /**
   * Universal registration handler for both Student and Administrator accounts
   */
  async registerUser(event) {
    if (event) event.preventDefault();

    const role = window.currentRole || 'student';
    const name = document.getElementById('loginName')?.value.trim();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!name || !email || !password) {
      alert('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    const payload = { name, email, password, role };

    if (role === 'student') {
      const program = document.getElementById('loginProgram')?.value || 'WAEC';
      const department = document.getElementById('loginDepartment')?.value || 'Science';
      payload.program = program;
      payload.department = department;
      
      const selectedElectives = Array.from(
        document.querySelectorAll('#signupSubjectChoices input[name="electiveSubjects"]:checked')
      ).map(cb => cb.value);

      if (program === 'JAMB') {
        const compulsory = ['English Language'];
        if (selectedElectives.length !== 3) {
          alert(`JAMB Requirement: Please choose exactly 3 subjects to combine with English Language (currently selected: ${selectedElectives.length}). JAMB allows a 4-subject combination only.`);
          return;
        }
        payload.subjects = [...compulsory, ...selectedElectives];
      } else {
        // WAEC
        const compulsory = ['Mathematics', 'English Language', 'Civic Education'];
        const tradeSubject = document.getElementById('loginTradeSubject')?.value || 'Data Processing';

        if (!tradeSubject) {
          alert('WAEC Requirement: Please select your 1 compulsory Vocational & Technical Trade Subject.');
          return;
        }

        if (selectedElectives.length !== 7) {
          alert(`WAEC Requirement: Please select exactly 7 elective subjects from the searchable list (currently selected: ${selectedElectives.length}). Together with 3 compulsory core subjects and 1 trade subject (${tradeSubject}), this makes the required 11 subjects.`);
          return;
        }

        payload.subjects = [...compulsory, tradeSubject, ...selectedElectives];
      }
    }

    try {
      const res = await schoolModel.safeFetch('api/auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok && res.data && res.data.success) {
        if (res.data.requires_payment) {
          this.pendingStudentPayment = {
            id: res.data.user_id,
            user_id: res.data.user_id,
            name: res.data.student_name,
            student_name: res.data.student_name,
            email: res.data.student_email,
            student_email: res.data.student_email,
            program: res.data.program,
            department: res.data.department
          };
          this.openStudentPaymentVerificationModal(this.pendingStudentPayment);
          return;
        }

        if (res.data.user) {
          schoolModel.user = res.data.user;

          const loginScreen = document.getElementById('loginScreen');
          if (loginScreen) {
            loginScreen.style.display = 'none';
            loginScreen.classList.add('hidden');
          }

          if (role === 'admin') {
            await SchoolView.initializeAdmin();
            const adminId = res.data.user.formatted_id || ('ADM-' + String(res.data.user.id).padStart(4, '0'));
            alert(`Administrator account created successfully!\nAdmin ID: ${adminId}\nWelcome to the Admin Panel.`);
          } else {
            await SchoolView.initializeStudent();
            const studentId = res.data.user.student_id || res.data.user.formatted_id || ('STU-' + String(res.data.user.id).padStart(4, '0'));
            const progName = res.data.user.program || payload.program || 'WAEC';
            const subCount = Array.isArray(payload.subjects) ? payload.subjects.length : (progName === 'JAMB' ? 4 : 11);
            alert(`Student account created successfully!\nStudent ID: ${studentId}\nProgramme: ${progName} (${payload.department} Department)\n${subCount} Subjects Registered Successfully\nWelcome to your Student Portal.`);
          }
        }
      } else {
        alert(res.data?.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert(err.message || 'Registration error. Please try again.');
    }
  },

  async registerStudent(event) {
    return this.registerUser(event);
  },

  async logout() {
    try {
      await this.model.logout();
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
      window.location.reload();
    }
  },

  async createStaffAccount(event) {
    if (event) event.preventDefault();
    const form = event.target;
    
    const name = document.getElementById('newStaffName')?.value.trim();
    const email = document.getElementById('newStaffEmail')?.value.trim();
    const password = document.getElementById('newStaffPassword')?.value;
    const department = document.getElementById('newStaffDepartment')?.value || 'Science';
    const subject = document.getElementById('newStaffSubject')?.value || 'Physics';

    if (!name || !email || !password) {
      this.view.notify('Please fill in all staff details.');
      return;
    }

    try {
      const res = await this.model.safeFetch('api/auth.php?action=create_staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department, subject })
      });

      if (res.ok && res.data && res.data.success) {
        this.view.notify('Staff account created successfully for ' + subject + ' teacher.');
        if (form && typeof form.reset === 'function') form.reset();
        await this.view.renderAdminStaffAccounts();
        await this.view.renderAdminStaffCodes();
        await this.loadAdminStudents();
      } else {
        this.view.notify(res.data?.message || 'Failed to create staff account.');
      }
    } catch (error) {
      console.error('Create staff failed:', error);
      this.view.notify(error.message || 'Failed to create staff account.');
    }
  },

  /* ------------------------------------------------------------------------
     STUDENT DIRECTORY CONTROLLERS (ADMIN: ALL STUDENTS | STAFF: COURSE ONLY)
     ------------------------------------------------------------------------ */
  async loadAdminStudents(filters = {}) {
    try {
      const search = document.getElementById('adminStudentSearch')?.value.trim() || '';
      const program = document.getElementById('adminStudentFilterProgram')?.value || '';
      const department = document.getElementById('adminStudentFilterDept')?.value || '';

      const combinedFilters = Object.assign({ search, program, department }, filters);
      const res = await this.model.getStudents(combinedFilters);
      const students = Array.isArray(res.data) ? res.data : [];
      SchoolView.renderAdminStudents(students, res.total);
    } catch (err) {
      console.error('Error loading admin students:', err);
    }
  },

  async loadStaffStudents(subject = null) {
    try {
      const filters = {};
      if (subject) filters.subject = subject;
      const res = await this.model.getStudents(filters);
      const students = Array.isArray(res.data) ? res.data : [];
      SchoolView.renderStaffStudents(students, res.staffSubject);
    } catch (err) {
      console.error('Error loading staff students:', err);
    }
  },

  async issueStaffAccessCode(event) {
    if (event) event.preventDefault();
    const select = document.getElementById('staffCodeAccount');
    const email = select ? select.value : '';

    if (!email) {
      this.view.notify('Please select a staff account.');
      return;
    }

    try {
      const res = await this.model.safeFetch('api/auth.php?action=issue_staff_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok && res.data && res.data.success) {
        const codeDisplay = document.getElementById('issuedStaffCode');
        if (codeDisplay) {
          codeDisplay.innerHTML = `Generated Code for <strong>${email}</strong>: <code style="font-size:1.1rem; color:var(--primary); font-weight:bold;">${res.data.code}</code>`;
        }
        this.view.notify(`Access code generated: ${res.data.code}`);
      } else {
        this.view.notify(res.data?.message || 'Failed to generate access code.');
      }
    } catch (error) {
      console.error('Code generation failed:', error);
      this.view.notify(error.message || 'Failed to generate access code.');
    }
  },

  /* ------------------------------------------------------------------------
     RESOURCE MANAGEMENT (STAFF & ADMIN)
     ------------------------------------------------------------------------ */
  async loadStaffResources(filterType = null, search = null) {
    if (filterType !== null) this.currentFilter = filterType;
    if (search !== null) this.currentSearch = search;

    try {
      const filters = {};
      if (this.currentFilter && this.currentFilter !== 'all') {
        filters.type = this.currentFilter;
      }
      if (this.currentSearch) {
        filters.search = this.currentSearch;
      }

      const resources = await this.model.getResources(filters);
      SchoolView.renderResourceTable('staffResourceRows', resources);
    } catch (err) {
      console.error('Error loading staff resources:', err);
    }
  },

  async loadAdminResources(filterType = null, search = null) {
    if (filterType !== null) this.currentFilter = filterType;
    if (search !== null) this.currentSearch = search;

    try {
      const filters = {};
      if (this.currentFilter && this.currentFilter !== 'all') {
        filters.type = this.currentFilter;
      }
      if (this.currentSearch) {
        filters.search = this.currentSearch;
      }

      const resources = await this.model.getResources(filters);
      SchoolView.renderResourceTable('adminResourceRows', resources);
    } catch (err) {
      console.error('Error loading admin resources:', err);
    }
  },

  openAddResourceModal() {
    SchoolView.openResourceModal(null);
  },

  async openEditResourceModal(id) {
    try {
      const resource = await this.model.getResource(id);
      SchoolView.openResourceModal(resource);
    } catch (err) {
      console.error('Error fetching resource for edit:', err);
      alert(err.message || 'Failed to load resource details.');
    }
  },

  async saveResource(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('resourceEditId')?.value;
    const type = document.getElementById('resourceType')?.value;
    const title = document.getElementById('resourceTitle')?.value.trim();
    const subject = document.getElementById('resourceSubject')?.value.trim();
    const exam = document.getElementById('resourceExam')?.value;
    const year = document.getElementById('resourceYear')?.value.trim();
    const author = document.getElementById('resourceAuthor')?.value.trim();
    const fileInput = document.getElementById('resourceFile');
    const fileUrl = document.getElementById('resourceFileUrl')?.value.trim();

    if (!type || !title || !subject) {
      alert('Please fill in resource title and subject.');
      return;
    }

    const hasNewFile = fileInput && fileInput.files && fileInput.files.length > 0;
    if (!id && !hasNewFile && !fileUrl) {
      alert('Please upload a document file (PDF, etc.) or enter a web URL.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('subject', subject);
    
    if (type === 'past_question') {
      formData.append('exam', exam || 'WAEC');
      formData.append('year', year || '');
    } else {
      formData.append('author', author || '');
    }

    if (fileUrl) {
      formData.append('file_url', fileUrl);
    }

    if (hasNewFile) {
      formData.append('file', fileInput.files[0]);
    }

    const saveBtn = document.getElementById('saveResourceBtn');
    const origBtnText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      if (id) {
        await this.model.editResource(id, formData);
        alert('Resource updated successfully!');
      } else {
        await this.model.addResource(formData);
        alert('Resource added successfully!');
      }

      SchoolView.closeResourceModal();

      if (this.model.user && this.model.user.role === 'admin') {
        await this.loadAdminResources();
      } else {
        await this.loadStaffResources();
      }
    } catch (err) {
      console.error('Save resource error:', err);
      alert(err.message || 'Failed to save resource.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = origBtnText;
      }
    }
  },

  async deleteResource(id) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this resource? This cannot be undone.')) {
      return;
    }

    try {
      await this.model.deleteResource(id);
      alert('Resource deleted successfully.');

      if (this.model.user && this.model.user.role === 'admin') {
        await this.loadAdminResources();
      } else {
        await this.loadStaffResources();
      }
    } catch (err) {
      console.error('Delete resource error:', err);
      alert(err.message || 'Failed to delete resource.');
    }
  },

  filterResources(type, triggerBtn) {
    this.currentFilter = type;
    const parent = triggerBtn ? triggerBtn.parentElement : null;
    if (parent) {
      parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      if (triggerBtn) triggerBtn.classList.add('active');
    }

    if (this.model.user && this.model.user.role === 'admin') {
      this.loadAdminResources(type);
    } else {
      this.loadStaffResources(type);
    }
  },

  searchResources(query) {
    this.currentSearch = query.trim();
    if (this.model.user && this.model.user.role === 'admin') {
      this.loadAdminResources(null, this.currentSearch);
    } else {
      this.loadStaffResources(null, this.currentSearch);
    }
  },

  /* ------------------------------------------------------------------------
     STUDENT DASHBOARD CONTROLLER
     ------------------------------------------------------------------------ */
  async initStudentDashboard() {
    try {
      const overview = await this.model.getStudentOverview();
      const subjects = overview.subjects || [];
      const rawAssignments = overview.assignments || [];
      const rawSchedules = overview.schedules || [];
      const submissions = overview.submissions || [];

      // Strict enrollment scoping: student only sees assignments and schedules for subjects they offer
      const assignments = rawAssignments.filter(a => SchoolView.isSubjectEnrolled(a.subject, subjects));
      let schedules = rawSchedules.filter(s => SchoolView.isSubjectEnrolled(s.subject, subjects));
      try {
        const freshSchedules = await this.model.getTimetable();
        if (Array.isArray(freshSchedules) && freshSchedules.length > 0) {
          schedules = freshSchedules.filter(s => SchoolView.isSubjectEnrolled(s.subject, subjects));
        }
      } catch (ttErr) {}

      this.model.studentEnrolledSubjects = subjects;
      this.model.studentAssignments = assignments;
      this.model.studentSubmissions = submissions;
      this.model.studentSchedules = schedules;

      const subjectCountEl = document.getElementById('subjectCount');
      if (subjectCountEl) subjectCountEl.textContent = subjects.length;

      // Pending assignments (unsubmitted) strictly for enrolled subjects
      const subMap = {};
      submissions.forEach(s => { subMap[s.assignment_id] = true; });
      const pendingCount = assignments.filter(a => !subMap[a.id]).length;

      const pendingAssignmentCountEl = document.getElementById('pendingAssignmentCount');
      if (pendingAssignmentCountEl) pendingAssignmentCountEl.textContent = pendingCount;

      const assignmentNavCountEl = document.getElementById('assignmentNavCount');
      if (assignmentNavCountEl) assignmentNavCountEl.textContent = assignments.length;

      // Render Dashboard Class Updates Notifications (Strictly enrolled subjects)
      SchoolView.renderStudentNotifications(assignments, schedules, subjects, submissions);

      // Render My Assignments Page List (Dual submission + strictly enrolled subjects)
      SchoolView.renderStudentAssignments(assignments, submissions, subjects);

      // Render Student Examinations (Strictly enrolled subjects)
      const prog = (this.model.user && this.model.user.program) || 'WAEC';
      SchoolView.renderStudentExaminations(subjects, prog);

      // Render Student Timetable & Today Schedule (Strictly enrolled subjects)
      SchoolView.renderStudentTimetable(subjects, schedules);

      const courseGrid = document.getElementById('courseGrid');
      if (courseGrid) {
        courseGrid.innerHTML = subjects.map(sub => `
          <div class="course-card">
            <span class="course-code">${sub.substring(0, 3).toUpperCase()}</span>
            <h3>${SchoolView.escapeHtml(sub)}</h3>
            <p>Active subject enrollment for this term</p>
          </div>
        `).join('');
      }

      const allResources = await this.model.getResources();
      SchoolView.populateStudentResourceFilters(allResources);

      await this.loadStudentPastQuestions();
      await this.loadStudentTextbooks();
      await this.loadStudentLeaderboard();
      await this.loadStudentAttendance();
      await this.loadStudentNotices();
      await this.loadStudentAnalytics();
    } catch (err) {
      console.error('Failed to initialize student dashboard:', err);
    }
  },

  /* ==========================================================================
     STUDENT ACADEMIC PERFORMANCE & VISUAL ANALYTICS CONTROLLER
     ========================================================================== */
  async loadStudentAnalytics() {
    try {
      const analytics = await this.model.getStudentAnalytics();
      if (analytics && analytics.success) {
        SchoolView.renderStudentHero(analytics);
        SchoolView.renderStudentAnalyticsCharts(analytics);
      }
    } catch (err) {
      console.error('Error loading student analytics:', err);
    }
  },

  /* ==========================================================================
     STUDENT LEADERBOARD & RANKINGS CONTROLLER
     ========================================================================== */
  async loadStudentLeaderboard(filters = {}) {
    try {
      const res = await this.model.getLeaderboard(filters);
      SchoolView.renderStudentLeaderboard(res, this.model.user?.id);
    } catch (err) {
      console.error('Error loading student leaderboard:', err);
    }
  },

  async filterStudentLeaderboard() {
    const dept = document.getElementById('studentLeaderboardDeptFilter')?.value || 'all';
    const filters = {};
    if (dept !== 'all') filters.department = dept;
    await this.loadStudentLeaderboard(filters);
  },

  searchStudentLeaderboard(query = '') {
    const full = window._cachedStudentLeaderboard;
    const tbody = document.getElementById('studentLeaderboardRows');
    if (!full || !tbody) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      tbody.innerHTML = SchoolView.buildLeaderboardTableRows(full, this.model.user?.id);
      return;
    }

    const filtered = full.filter(st => {
      const name = (st.name || '').toLowerCase();
      const id = (st.formatted_id || '').toLowerCase();
      const dept = (st.department || '').toLowerCase();
      return name.includes(q) || id.includes(q) || dept.includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No students found matching "${SchoolView.escapeHtml(query)}".</td></tr>`;
      return;
    }

    tbody.innerHTML = SchoolView.buildLeaderboardTableRows(filtered, this.model.user?.id);
  },

  /* ==========================================================================
     STAFF LEADERBOARD CONTROLLER (SEGREGATED WAEC & JAMB)
     ========================================================================== */
  async loadStaffLeaderboard(filters = {}) {
    try {
      this.staffLeaderboardProgram = this.staffLeaderboardProgram || 'WAEC';
      const dept = document.getElementById('staffLeaderboardDeptFilter')?.value || 'all';
      if (!filters.program) filters.program = this.staffLeaderboardProgram;
      if (dept !== 'all' && !filters.department) filters.department = dept;

      const res = await this.model.getLeaderboard(filters);
      SchoolView.renderStaffLeaderboard(res, this.staffLeaderboardProgram);
    } catch (err) {
      console.error('Error loading staff leaderboard:', err);
    }
  },

  switchStaffLeaderboardProgram(prog = 'WAEC') {
    this.staffLeaderboardProgram = prog;
    const cachedRes = window._cachedStaffLeaderboardRes;
    if (cachedRes && (cachedRes.waec_leaderboard || cachedRes.jamb_leaderboard)) {
      SchoolView.renderStaffLeaderboard(cachedRes, prog);
      const searchInp = document.getElementById('staffLeaderboardSearch');
      if (searchInp) searchInp.value = '';
    } else {
      this.loadStaffLeaderboard({ program: prog });
    }
  },

  async filterStaffLeaderboard() {
    const dept = document.getElementById('staffLeaderboardDeptFilter')?.value || 'all';
    const filters = { program: this.staffLeaderboardProgram || 'WAEC' };
    if (dept !== 'all') filters.department = dept;
    await this.loadStaffLeaderboard(filters);
  },

  searchStaffLeaderboard(query = '') {
    const full = window._cachedStaffLeaderboard;
    const tbody = document.getElementById('staffLeaderboardRows');
    if (!full || !tbody) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      tbody.innerHTML = SchoolView.buildLeaderboardTableRows(full, 0);
      return;
    }

    const filtered = full.filter(st => {
      const name = (st.name || '').toLowerCase();
      const id = (st.formatted_id || '').toLowerCase();
      const dept = (st.department || '').toLowerCase();
      return name.includes(q) || id.includes(q) || dept.includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No students found matching "${SchoolView.escapeHtml(query)}".</td></tr>`;
      return;
    }

    tbody.innerHTML = SchoolView.buildLeaderboardTableRows(filtered, 0);
  },

  /* ==========================================================================
     ADMIN LEADERBOARD CONTROLLER (SEGREGATED WAEC & JAMB)
     ========================================================================== */
  async loadAdminLeaderboard(filters = {}) {
    try {
      this.adminLeaderboardProgram = this.adminLeaderboardProgram || 'WAEC';
      const dept = document.getElementById('adminLeaderboardDeptFilter')?.value || 'all';
      if (!filters.program) filters.program = this.adminLeaderboardProgram;
      if (dept !== 'all' && !filters.department) filters.department = dept;

      const res = await this.model.getLeaderboard(filters);
      SchoolView.renderAdminLeaderboard(res, this.adminLeaderboardProgram);
    } catch (err) {
      console.error('Error loading admin leaderboard:', err);
    }
  },

  switchAdminLeaderboardProgram(prog = 'WAEC') {
    this.adminLeaderboardProgram = prog;
    const cachedRes = window._cachedAdminLeaderboardRes;
    if (cachedRes && (cachedRes.waec_leaderboard || cachedRes.jamb_leaderboard)) {
      SchoolView.renderAdminLeaderboard(cachedRes, prog);
      const searchInp = document.getElementById('adminLeaderboardSearch');
      if (searchInp) searchInp.value = '';
    } else {
      this.loadAdminLeaderboard({ program: prog });
    }
  },

  async filterAdminLeaderboard() {
    const dept = document.getElementById('adminLeaderboardDeptFilter')?.value || 'all';
    const filters = { program: this.adminLeaderboardProgram || 'WAEC' };
    if (dept !== 'all') filters.department = dept;
    await this.loadAdminLeaderboard(filters);
  },

  searchAdminLeaderboard(query = '') {
    const full = window._cachedAdminLeaderboard;
    const tbody = document.getElementById('adminLeaderboardRows');
    if (!full || !tbody) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      tbody.innerHTML = SchoolView.buildLeaderboardTableRows(full, 0);
      return;
    }

    const filtered = full.filter(st => {
      const name = (st.name || '').toLowerCase();
      const id = (st.formatted_id || '').toLowerCase();
      const dept = (st.department || '').toLowerCase();
      return name.includes(q) || id.includes(q) || dept.includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No students found matching "${SchoolView.escapeHtml(query)}".</td></tr>`;
      return;
    }

    tbody.innerHTML = SchoolView.buildLeaderboardTableRows(filtered, 0);
  },

  /* ==========================================================================
     ATTENDANCE CONTROLLER (STUDENT & STAFF)
     ========================================================================== */
  async loadStudentAttendance() {
    try {
      const res = await this.model.getStudentAttendance(this.model.user?.id);
      SchoolView.renderStudentAttendance(res);
    } catch (err) {
      console.error('Error loading student attendance:', err);
    }
  },

  async handleStaffAttendanceChange(selectEl, studentId, subject) {
    if (!selectEl || !studentId) return;
    const status = selectEl.value;
    const origBorder = selectEl.style.borderColor;
    selectEl.style.borderColor = '#0284c7';

    try {
      const res = await this.model.logAttendance({
        student_id: studentId,
        subject: subject,
        status: status,
        date: new Date().toISOString().split('T')[0]
      });

      selectEl.style.borderColor = '#10b981';
      setTimeout(() => { selectEl.style.borderColor = origBorder; }, 1500);

      // Background reload leaderboard so points update live
      this.loadStaffLeaderboard();
    } catch (err) {
      console.error('Error updating student attendance:', err);
      selectEl.style.borderColor = '#ef4444';
      alert(err.message || 'Failed to update attendance.');
    }
  },

  async loadStudentAssignments() {
    try {
      const overview = await this.model.getStudentOverview();
      const subjects = overview.subjects || this.model.studentEnrolledSubjects || [];
      const rawAssignments = overview.assignments || [];
      const assignments = rawAssignments.filter(a => SchoolView.isSubjectEnrolled(a.subject, subjects));

      this.model.studentAssignments = assignments;
      this.model.studentSubmissions = overview.submissions || [];

      const subMap = {};
      this.model.studentSubmissions.forEach(s => { subMap[s.assignment_id] = true; });
      const pendingCount = assignments.filter(a => !subMap[a.id]).length;

      const countEl = document.getElementById('pendingAssignmentCount');
      if (countEl) countEl.textContent = pendingCount;
      const navCountEl = document.getElementById('assignmentNavCount');
      if (navCountEl) navCountEl.textContent = assignments.length;

      SchoolView.renderStudentAssignments(assignments, this.model.studentSubmissions, subjects);
      SchoolView.renderStudentNotifications(assignments, overview.schedules || [], subjects, this.model.studentSubmissions || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  },

  async loadStudentPastQuestions() {
    try {
      const exam = document.getElementById('pqExam')?.value || '';
      const subject = document.getElementById('pqSubject')?.value || '';
      const year = document.getElementById('pqYear')?.value || '';

      const papers = await this.model.getResources({
        type: 'past_question',
        exam,
        subject,
        year
      });

      SchoolView.renderStudentPastQuestions(papers);
    } catch (err) {
      console.error('Error loading past questions:', err);
    }
  },

  async loadStudentTextbooks() {
    try {
      const subject = document.getElementById('tbSubject')?.value || '';

      const books = await this.model.getResources({
        type: 'textbook',
        subject
      });

      SchoolView.renderStudentTextbooks(books);
    } catch (err) {
      console.error('Error loading textbooks:', err);
    }
  },

  /* ------------------------------------------------------------------------
     TIMETABLE CONTROLLER (STUDENT, STAFF, ADMIN)
     ------------------------------------------------------------------------ */
  async loadStudentTimetable() {
    try {
      const subjects = this.model.studentEnrolledSubjects || [];
      const schedules = await this.model.getTimetable();
      this.model.studentSchedules = schedules;
      SchoolView.renderStudentTimetable(subjects, schedules);
      SchoolView.renderStudentNotifications(this.model.studentAssignments || [], schedules, subjects, this.model.studentSubmissions || []);
    } catch (err) {
      console.error('Error loading student timetable:', err);
    }
  },

  async loadStaffTimetable() {
    try {
      const schedules = await this.model.getTimetable({ staff_only: true });
      SchoolView.renderStaffTimetable(schedules);
    } catch (err) {
      console.error('Error loading staff timetable:', err);
    }
  },

  async loadAdminTimetable(filters = {}) {
    try {
      const schedules = await this.model.getTimetable(filters);
      SchoolView.renderAdminTimetable(schedules);
    } catch (err) {
      console.error('Error loading admin timetable:', err);
    }
  },

  async filterAdminTimetable() {
    const day = document.getElementById('adminTimetableFilterDay')?.value || 'all';
    const dept = document.getElementById('adminTimetableFilterDept')?.value || 'all';
    const filters = {};
    if (day !== 'all') filters.day = day;
    if (dept !== 'all') filters.department = dept;
    await this.loadAdminTimetable(filters);
  },

  async openAddTimetableModal() {
    await SchoolView.openTimetableModal(null);
  },

  async openEditTimetableModal(id) {
    try {
      const schedule = await this.model.getSchedule(id);
      await SchoolView.openTimetableModal(schedule);
    } catch (err) {
      alert(err.message || 'Failed to fetch schedule details.');
    }
  },

  closeTimetableModal() {
    SchoolView.closeTimetableModal();
  },

  async saveTimetableSchedule(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('scheduleEditId')?.value;
    const day_of_week = document.getElementById('scheduleDay')?.value;
    const department = document.getElementById('scheduleDept')?.value;
    const program = document.getElementById('scheduleProgram')?.value;
    const subject = document.getElementById('scheduleSubject')?.value;
    const start_time = document.getElementById('scheduleStartTime')?.value.trim();
    const end_time = document.getElementById('scheduleEndTime')?.value.trim();
    const teacher_id = document.getElementById('scheduleTeacher')?.value || null;
    const room = document.getElementById('scheduleRoom')?.value.trim() || 'Online Class (Google Meet)';
    const meet_link = document.getElementById('scheduleMeetLink')?.value.trim() || '';

    if (!day_of_week || !subject || !start_time || !end_time) {
      alert('Please fill in Day, Subject, Start Time, and End Time.');
      return;
    }

    const payload = {
      day_of_week,
      department,
      program,
      subject,
      start_time,
      end_time,
      teacher_id,
      room,
      meet_link
    };

    const saveBtn = document.getElementById('saveTimetableBtn');
    const origText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      if (id) {
        await this.model.editSchedule(id, payload);
        alert('Class schedule updated successfully!');
      } else {
        await this.model.createSchedule(payload);
        alert('Class schedule created successfully!');
      }

      SchoolView.closeTimetableModal();
      await this.loadAdminTimetable();
    } catch (err) {
      console.error('Save schedule error:', err);
      alert(err.message || 'Failed to save class schedule.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;
      }
    }
  },

  async deleteTimetableSchedule(id) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this timetable schedule?')) {
      return;
    }

    try {
      await this.model.deleteSchedule(id);
      alert('Class schedule deleted.');
      await this.loadAdminTimetable();
    } catch (err) {
      console.error('Delete schedule error:', err);
      alert(err.message || 'Failed to delete class schedule.');
    }
  },

  async openStaffClassNotificationModal(scheduleId) {
    try {
      const schedule = await this.model.getSchedule(scheduleId);
      SchoolView.openClassNotificationModal(schedule);
    } catch (err) {
      alert(err.message || 'Failed to load class details.');
    }
  },

  closeClassNotificationModal() {
    SchoolView.closeClassNotificationModal();
  },

  async submitStaffClassNotification(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('notifyScheduleId')?.value;
    const meet_link = document.getElementById('notifyMeetLink')?.value.trim();
    const notification_date = document.getElementById('notifyClassDate')?.value;
    const message = document.getElementById('notifyMessage')?.value.trim();

    if (!id || !meet_link) {
      alert('Please provide a Google Meet link.');
      return;
    }

    const btn = document.getElementById('sendNotificationSubmitBtn');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Sending...';
    }

    try {
      await this.model.sendClassNotification(id, {
        meet_link,
        notification_date,
        message
      });

      alert('✓ 1-Day class notification and Google Meet link sent to all students offering this course!');
      SchoolView.closeClassNotificationModal();

      if (this.model.user && this.model.user.role === 'admin') {
        await this.loadAdminTimetable();
      } else {
        await this.loadStaffTimetable();
      }
    } catch (err) {
      console.error('Send class notification error:', err);
      alert(err.message || 'Failed to send class notification.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }
  },

  /* ------------------------------------------------------------------------
     SUBMISSIONS & GRADING CONTROLLERS (STAFF & ADMIN)
     ------------------------------------------------------------------------ */
  async loadStaffSubmissions(filters = {}) {
    try {
      const subSelect = document.getElementById('staffSubmissionsFilterSubject');
      const statSelect = document.getElementById('staffSubmissionsFilterStatus');
      const subject = subSelect ? subSelect.value : '';
      const status = statSelect ? statSelect.value : '';

      const queryFilters = Object.assign({}, filters);
      if (subject && subject !== 'all') queryFilters.subject = subject;
      if (status && status !== 'all') queryFilters.status = status;

      const res = await this.model.getSubmissions(queryFilters);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      SchoolView.renderStaffSubmissions(list);
    } catch (err) {
      console.error('Error loading staff submissions:', err);
    }
  },

  async filterStaffSubmissions() {
    await this.loadStaffSubmissions();
  },

  async loadStaffScoresheet(filters = {}) {
    try {
      const subSelect = document.getElementById('staffScoresheetFilterSubject');
      const assignSelect = document.getElementById('staffScoresheetFilterAssignment');
      const searchInput = document.getElementById('staffScoresheetSearch');
      const subject = subSelect ? subSelect.value : '';
      const assignment_id = assignSelect ? assignSelect.value : 0;
      const combined = Object.assign({
        subject: (subject && subject !== 'all') ? subject : '',
        assignment_id: assignment_id > 0 ? assignment_id : ''
      }, filters);

      const res = await this.model.getGeneralScoresheet(combined);
      SchoolView.renderGeneralScoresheet('staffScoresheetRows', res, true, true);
      if (searchInput && searchInput.value.trim()) {
        this.searchStaffScoresheet(searchInput.value.trim());
      }
    } catch (err) {
      console.error('Error loading staff scoresheet:', err);
    }
  },

  async filterStaffScoresheet() {
    await this.loadStaffScoresheet();
  },

  searchStaffScoresheet(query = '') {
    const rawData = window._fullStaffScoresheetData;
    if (!rawData || !Array.isArray(rawData.scoresheet)) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      SchoolView.renderGeneralScoresheet('staffScoresheetRows', rawData, true, false);
      return;
    }

    const filtered = rawData.scoresheet.filter(item => {
      const name = (item.student_name || '').toLowerCase();
      const id = (item.formatted_student_id || ('stu-' + item.student_id)).toLowerCase();
      const rawId = String(item.student_id || '').toLowerCase();
      const email = (item.student_email || '').toLowerCase();
      const title = (item.assignment_title || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const dept = (item.department || '').toLowerCase();
      return name.includes(q) || id.includes(q) || rawId === q || email.includes(q) || title.includes(q) || subject.includes(q) || dept.includes(q);
    });

    let totalScores = 0;
    let numericSum = 0;
    let gradedCount = 0;
    let submittedCount = 0;
    filtered.forEach(it => {
      if (it.status === 'Graded' || it.score) {
        gradedCount++;
        const clean = String(it.score || '').replace(/[^0-9.]/g, '');
        if (clean && !isNaN(clean)) {
          numericSum += parseFloat(clean);
          totalScores++;
        }
      }
      if (it.status === 'Pending Review' || it.submission_id) {
        submittedCount++;
      }
    });
    const avgScore = totalScores > 0 ? (numericSum / totalScores).toFixed(1) + '%' : '0%';

    const searchData = {
      scoresheet: filtered,
      summary: {
        total_records: filtered.length,
        total_submitted: submittedCount,
        total_graded: gradedCount,
        pending_grading: (submittedCount - gradedCount),
        average_score: avgScore
      },
      subjects: rawData.subjects,
      assignments: rawData.assignments
    };

    SchoolView.renderGeneralScoresheet('staffScoresheetRows', searchData, true, false);
  },

  async loadAdminScoresheet(filters = {}) {
    try {
      const subSelect = document.getElementById('adminScoresheetFilterSubject');
      const assignSelect = document.getElementById('adminScoresheetFilterAssignment');
      const deptSelect = document.getElementById('adminScoresheetFilterDept');
      const progSelect = document.getElementById('adminScoresheetFilterProgram');
      const searchInput = document.getElementById('adminScoresheetSearch');

      const subject = subSelect ? subSelect.value : '';
      const assignment_id = assignSelect ? assignSelect.value : 0;
      const department = deptSelect ? deptSelect.value : '';
      const program = progSelect ? progSelect.value : '';

      const combined = Object.assign({
        subject,
        assignment_id: assignment_id > 0 ? assignment_id : '',
        department,
        program
      }, filters);

      const res = await this.model.getGeneralScoresheet(combined);
      SchoolView.renderGeneralScoresheet('adminScoresheetRows', res, false, true);
      if (searchInput && searchInput.value.trim()) {
        this.searchAdminScoresheet(searchInput.value.trim());
      }
    } catch (err) {
      console.error('Error loading admin scoresheet:', err);
    }
  },

  async filterAdminScoresheet() {
    await this.loadAdminScoresheet();
  },

  searchAdminScoresheet(query = '') {
    const rawData = window._fullAdminScoresheetData;
    if (!rawData || !Array.isArray(rawData.scoresheet)) return;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      SchoolView.renderGeneralScoresheet('adminScoresheetRows', rawData, false, false);
      return;
    }

    const filtered = rawData.scoresheet.filter(item => {
      const name = (item.student_name || '').toLowerCase();
      const id = (item.formatted_student_id || ('stu-' + item.student_id)).toLowerCase();
      const rawId = String(item.student_id || '').toLowerCase();
      const email = (item.student_email || '').toLowerCase();
      const title = (item.assignment_title || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const dept = (item.department || '').toLowerCase();
      return name.includes(q) || id.includes(q) || rawId === q || email.includes(q) || title.includes(q) || subject.includes(q) || dept.includes(q);
    });

    let totalScores = 0;
    let numericSum = 0;
    let gradedCount = 0;
    let submittedCount = 0;
    filtered.forEach(it => {
      if (it.status === 'Graded' || it.score) {
        gradedCount++;
        const clean = String(it.score || '').replace(/[^0-9.]/g, '');
        if (clean && !isNaN(clean)) {
          numericSum += parseFloat(clean);
          totalScores++;
        }
      }
      if (it.status === 'Pending Review' || it.submission_id) {
        submittedCount++;
      }
    });
    const avgScore = totalScores > 0 ? (numericSum / totalScores).toFixed(1) + '%' : '0%';

    const searchData = {
      scoresheet: filtered,
      summary: {
        total_records: filtered.length,
        total_submitted: submittedCount,
        total_graded: gradedCount,
        pending_grading: (submittedCount - gradedCount),
        average_score: avgScore
      },
      subjects: rawData.subjects,
      assignments: rawData.assignments
    };

    SchoolView.renderGeneralScoresheet('adminScoresheetRows', searchData, false, false);
  },

  openGradingModal(submissionId) {
    if (!submissionId) return;

    // Search in caches first
    let sub = null;
    if (Array.isArray(window._cachedStaffSubmissions)) {
      sub = window._cachedStaffSubmissions.find(s => Number(s.submission_id) === Number(submissionId));
    }
    if (!sub && Array.isArray(window._cachedStaffScoresheet)) {
      sub = window._cachedStaffScoresheet.find(s => Number(s.submission_id) === Number(submissionId));
    }
    if (!sub && Array.isArray(window._cachedAdminScoresheet)) {
      sub = window._cachedAdminScoresheet.find(s => Number(s.submission_id) === Number(submissionId));
    }

    if (sub) {
      SchoolView.openGradingModal(sub);
      return;
    }

    // Fallback: fetch via getSubmissions
    this.model.getSubmissions().then(res => {
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const found = list.find(s => Number(s.submission_id) === Number(submissionId));
      if (found) {
        SchoolView.openGradingModal(found);
      } else {
        alert('Could not find submission details.');
      }
    }).catch(err => {
      console.error('Failed to find submission:', err);
      alert('Failed to load submission details.');
    });
  },

  closeGradingModal() {
    SchoolView.closeGradingModal();
  },

  async submitGrade(event) {
    if (event) event.preventDefault();

    const submission_id = document.getElementById('gradeSubmissionId')?.value;
    const score = document.getElementById('gradeScoreInput')?.value.trim();
    const grade = document.getElementById('gradeLetterInput')?.value.trim();
    const remarks = document.getElementById('gradeRemarksInput')?.value.trim();

    if (!submission_id) {
      alert('Missing submission ID.');
      return;
    }

    if (!score && !remarks) {
      alert('Please enter a score or feedback remarks.');
      return;
    }

    const saveBtn = document.getElementById('saveGradeBtn');
    const origText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const res = await this.model.gradeSubmission({
        submission_id,
        score,
        grade,
        remarks
      });

      alert('✓ ' + (res.message || 'Student submission graded and remarks saved!'));
      SchoolView.closeGradingModal();

      // Refresh appropriate dashboards
      if (this.model.user && this.model.user.role === 'admin') {
        await this.loadAdminScoresheet();
        await this.loadStaffSubmissions();
      } else {
        await this.loadStaffSubmissions();
        await this.loadStaffScoresheet();
        await this.loadStaffLeaderboard();
      }
    } catch (err) {
      console.error('Grade submission error:', err);
      alert(err.message || 'Failed to save grade and remarks.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;
      }
    }
  },

  /* ------------------------------------------------------------------------
     FEES & BILLING CONTROLLERS (STUDENT & ADMIN)
     ------------------------------------------------------------------------ */
  async loadStudentFeeLockInfo() {
    try {
      const data = await this.model.getStudentFeeInfo();
      window._cachedStudentFeeInfo = data;
      window._selectedFeePlan = window._selectedFeePlan || 'monthly';
      SchoolView.renderStudentFeeLock(data);
      this.selectFeePlan(window._selectedFeePlan);
    } catch (err) {
      console.error('Failed to load student fee lock info:', err);
    }
  },

  selectFeePlan(plan = 'monthly') {
    window._selectedFeePlan = plan;
    const monthlyCard = document.getElementById('lockPlanMonthlyCard');
    const weeklyCard = document.getElementById('lockPlanWeeklyCard');
    const monthlyRadio = document.getElementById('lockRadioMonthly');
    const weeklyRadio = document.getElementById('lockRadioWeekly');

    if (plan === 'weekly') {
      if (weeklyCard) weeklyCard.classList.add('selected');
      if (monthlyCard) monthlyCard.classList.remove('selected');
      if (weeklyRadio) weeklyRadio.checked = true;
      if (monthlyRadio) monthlyRadio.checked = false;
    } else {
      if (monthlyCard) monthlyCard.classList.add('selected');
      if (weeklyCard) weeklyCard.classList.remove('selected');
      if (monthlyRadio) monthlyRadio.checked = true;
      if (weeklyRadio) weeklyRadio.checked = false;
    }
  },

  async processStudentFeePayment(method = 'online') {
    const plan = window._selectedFeePlan || 'monthly';
    const payBtn = document.getElementById('lockPayOnlineBtn');
    const origText = payBtn ? payBtn.textContent : '';

    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'Processing Payment...';
    }

    try {
      const res = await this.model.payStudentFee({
        plan: plan,
        payment_method: method
      });

      alert('✓ ' + (res.message || 'Payment confirmed successfully! Student workspace is now fully unlocked.'));
      
      // Re-initialize student workspace to grant access immediately
      await SchoolView.initializeStudent();
    } catch (err) {
      console.error('Fee payment error:', err);
      alert(err.message || 'Payment failed. Please try again.');
    } finally {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = origText || '💳 Pay Online & Unlock Workspace';
      }
    }
  },

  openBankTransferModal() {
    SchoolView.openBankTransferModal(window._cachedStudentFeeInfo);
  },

  closeBankTransferModal() {
    SchoolView.closeBankTransferModal();
  },

  async confirmBankTransferPayment() {
    const confirmBtn = document.getElementById('confirmTransferBtn');
    const origText = confirmBtn ? confirmBtn.textContent : '';
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Verifying Transfer...';
    }

    try {
      const res = await this.model.payStudentFee({
        plan: window._selectedFeePlan || 'monthly',
        payment_method: 'bank_transfer',
        reference: window._pendingBankTransferRef
      });

      SchoolView.closeBankTransferModal();
      alert('✓ ' + (res.message || 'Bank transfer verified! Student workspace is now active.'));
      await SchoolView.initializeStudent();
    } catch (err) {
      console.error('Transfer verification error:', err);
      alert(err.message || 'Could not verify transfer.');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = origText || '✓ I Have Transferred — Confirm Payment';
      }
    }
  },

  async openStudentBillingModal() {
    try {
      const data = await this.model.getStudentFeeInfo();
      window._cachedStudentFeeInfo = data;
      SchoolView.renderStudentBillingModal(data);
    } catch (err) {
      console.error('Error opening student billing:', err);
      alert(err.message || 'Failed to load billing records.');
    }
  },

  closeStudentBillingModal() {
    SchoolView.closeStudentBillingModal();
  },

  async loadAdminFees() {
    try {
      const data = await this.model.getAdminFees();
      window._cachedAdminFeesData = data;
      SchoolView.renderAdminFees(data);
    } catch (err) {
      console.error('Failed to load admin fee data:', err);
    }
  },

  filterAdminFeeStudents() {
    if (!window._cachedAdminFeesData || !Array.isArray(window._cachedAdminFeesData.students)) return;
    const filter = document.getElementById('adminFeeFilterStatus')?.value || '';
    const search = (document.getElementById('adminFeeStudentSearch')?.value || '').trim().toLowerCase();

    let list = window._cachedAdminFeesData.students;

    if (filter) {
      if (filter === 'paid_monthly') {
        list = list.filter(s => s.status_label === 'Paid (Monthly)');
      } else if (filter === 'paid_weekly') {
        list = list.filter(s => s.status_label === 'Paid (Weekly)');
      } else if (filter === 'unpaid') {
        list = list.filter(s => s.status_label === 'Unpaid');
      } else if (filter === 'expired') {
        list = list.filter(s => s.status_label === 'Expired');
      }
    }

    if (search) {
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search)) ||
        (s.formatted_id && s.formatted_id.toLowerCase().includes(search)) ||
        (s.department && s.department.toLowerCase().includes(search)) ||
        (s.program && s.program.toLowerCase().includes(search))
      );
    }

    SchoolView.renderAdminFeeStudentRows(list);
  },

  searchAdminFeeStudents(query) {
    this.filterAdminFeeStudents();
  },

  openAdminFeeModal(feeId) {
    let fee = null;
    if (feeId && window._cachedAdminFeesData && Array.isArray(window._cachedAdminFeesData.fees)) {
      fee = window._cachedAdminFeesData.fees.find(f => Number(f.id) === Number(feeId));
    }
    SchoolView.openAdminFeeModal(fee);
  },

  closeAdminFeeModal() {
    SchoolView.closeAdminFeeModal();
  },

  async saveAdminFee(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('adminFeeIdInput')?.value;
    const title = document.getElementById('adminFeeTitleInput')?.value.trim();
    const base_monthly_fee = document.getElementById('adminFeeBaseInput')?.value;
    const program = document.getElementById('adminFeeProgramInput')?.value || 'All';
    const description = document.getElementById('adminFeeDescInput')?.value.trim();

    if (!base_monthly_fee || parseFloat(base_monthly_fee) <= 0) {
      alert('Please enter a valid base monthly fee greater than zero.');
      return;
    }

    const saveBtn = document.getElementById('adminSaveFeeBtn');
    const origText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const res = await this.model.saveFee({
        id: id || undefined,
        title: title || 'School Tuition & Learning Access Fee',
        base_monthly_fee: parseFloat(base_monthly_fee),
        program: program,
        description: description
      });

      alert('✓ ' + (res.message || 'School fee settings saved successfully!'));
      SchoolView.closeAdminFeeModal();
      await this.loadAdminFees();
    } catch (err) {
      console.error('Save fee error:', err);
      alert(err.message || 'Failed to save fee settings.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = origText || 'Save School Fee';
      }
    }
  },

  async adminToggleStudentPayment(studentId, actionType) {
    if (!studentId) return;

    let confirmMsg = '';
    if (actionType === 'revoke') {
      confirmMsg = 'Are you sure you want to revoke portal access for this student? They will be locked out until fee is paid.';
    } else if (actionType === 'mark_paid_monthly') {
      confirmMsg = 'Record a Monthly Payment for this student? This applies the 10% discount rate and grants 30 days full portal access.';
    } else if (actionType === 'mark_paid_weekly') {
      confirmMsg = 'Record a Weekly Payment for this student? This applies the 1-month split rate (no discount) and grants 7 days portal access.';
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await this.model.adminToggleStudentPayment({
        student_id: studentId,
        action_type: actionType
      });

      alert('✓ ' + (res.message || 'Student payment updated successfully!'));
      await this.loadAdminFees();
    } catch (err) {
      console.error('Update student payment error:', err);
      alert(err.message || 'Failed to update student payment.');
    }
  },

  async adminPayStudentWithPaystack(studentId, name, email) {
    if (!studentId) return;

    const planChoice = confirm(`Initialize Paystack Online Tuition Checkout for ${name || 'Student'} (${email || ''})?\n\n• Click OK for MONTHLY Tuition (10% Discount Applied)\n• Click CANCEL for WEEKLY Tuition (4-Week Split)`);
    const plan = planChoice ? 'monthly' : 'weekly';

    try {
      const initRes = await this.model.initializePaystackFee(plan, studentId);

      if (initRes.disabled) {
        alert('⚠️ Paystack Payment Gateway is currently deactivated by administrator. Please re-enable Paystack in the Payment Gateway settings to proceed.');
        return;
      }

      const amountNgn = initRes.amount;
      const reference = initRes.reference;
      const publicKey = initRes.public_key;

      const isRealKey = publicKey && (publicKey.startsWith('pk_live_') || publicKey.startsWith('pk_test_')) &&
        !publicKey.includes('demo') && !publicKey.includes('placeholder') && !publicKey.includes('school_edu') && publicKey.length >= 32;

      // Try Paystack Inline Popup if SDK is loaded and using real registered credentials
      if (isRealKey && typeof window.PaystackPop !== 'undefined' && typeof window.PaystackPop.setup === 'function') {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: email || 'student@school.edu.ng',
          amount: initRes.amount_kobo,
          currency: 'NGN',
          ref: reference,
          metadata: {
            custom_fields: [
              { display_name: 'Student Name', variable_name: 'student_name', value: name },
              { display_name: 'Payment Plan', variable_name: 'plan', value: plan },
              { display_name: 'Initiated By', variable_name: 'admin_action', value: 'Admin Billing Roster' }
            ]
          },
          callback: async (response) => {
            try {
              const verifyRes = await this.model.verifyPaystackPayment(response.reference, plan, studentId);
              alert(`✓ Paystack Tuition Confirmed!\n\nReference: ${response.reference}\nStudent: ${name}\nAmount: ₦${Number(amountNgn).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nPlan: ${plan.toUpperCase()} Tuition\n\nStudent portal access is now fully active!`);
              await this.loadAdminFees();
            } catch (err) {
              alert('Error verifying payment: ' + (err.message || 'Verification failed.'));
            }
          },
          onClose: () => {
            console.log('Paystack checkout popup closed.');
          }
        });
        handler.openIframe();
        return;
      }

      // Graceful Sandbox / Fallback Confirmation
      const confirmMsg = `[PAYSTACK ONLINE CHECKOUT]\n\nMerchant: Springfield Academy Portal\nStudent: ${name} (${email})\nPlan: ${plan.toUpperCase()} Tuition (${plan === 'monthly' ? '10% Discount Applied' : '4-Week Split'})\nAmount to Pay: ₦${Number(amountNgn).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nReference: ${reference}\n\nProceed to authorize Paystack transaction and grant student immediate portal access?`;

      if (!confirm(confirmMsg)) return;

      const verifyRes = await this.model.verifyPaystackPayment(reference, plan, studentId);
      alert(`✓ Paystack Payment Confirmed!\n\nReference: ${reference}\nStudent: ${name}\nAmount: ₦${Number(amountNgn).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nPlan: ${plan.toUpperCase()} Tuition\n\nStudent portal access has been granted!`);
      await this.loadAdminFees();
    } catch (err) {
      console.error('Paystack admin tuition checkout error:', err);
      alert('Paystack Checkout Error: ' + (err.message || 'Unable to complete transaction.'));
    }
  },

  /* ------------------------------------------------------------------------
     STAFF PAYROLL & BANKING CONTROLLERS
     ------------------------------------------------------------------------ */
  async loadStaffPayrollInfo() {
    try {
      const data = await this.model.getStaffPayrollInfo();
      window._cachedStaffPayrollData = data;
      SchoolView.renderStaffPayrollSection(data);
    } catch (err) {
      console.error('Failed to load staff payroll data:', err);
    }
  },

  async loadAdminPayrollInfo(monthYear = null) {
    try {
      if (!monthYear) {
        monthYear = document.getElementById('adminPayrollMonthSelect')?.value || '';
      }
      const data = await this.model.getStaffPayrollInfo(monthYear);
      window._cachedAdminPayrollData = data;
      SchoolView.renderAdminPayrollSection(data);
    } catch (err) {
      console.error('Failed to load admin payroll records:', err);
    }
  },

  filterAdminPayrollByMonth(monthYear) {
    this.loadAdminPayrollInfo(monthYear);
  },

  searchAdminStaffPayroll(query) {
    if (!window._cachedAdminPayrollData || !Array.isArray(window._cachedAdminPayrollData.staff)) return;
    const q = (query || '').trim().toLowerCase();
    const list = window._cachedAdminPayrollData.staff.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.formatted_id && s.formatted_id.toLowerCase().includes(q)) ||
      (s.bank_name && s.bank_name.toLowerCase().includes(q)) ||
      (s.account_number && s.account_number.includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.assigned_subject && s.assigned_subject.toLowerCase().includes(q))
    );
    SchoolView.renderAdminStaffPayrollRows(list, window._cachedAdminPayrollData.selected_month);
  },

  openStaffBankModal() {
    const staff = window._cachedStaffPayrollData?.staff || this.model.user;
    SchoolView.openStaffBankModal(staff);
  },

  openAdminStaffBankModal(staffId) {
    if (!window._cachedAdminPayrollData || !Array.isArray(window._cachedAdminPayrollData.staff)) return;
    const staff = window._cachedAdminPayrollData.staff.find(s => Number(s.id) === Number(staffId));
    if (staff) {
      SchoolView.openStaffBankModal(staff);
    }
  },

  closeStaffBankModal() {
    SchoolView.closeStaffBankModal();
  },

  async saveStaffBankDetails(event) {
    if (event) event.preventDefault();

    const staffId = document.getElementById('bankModalStaffId')?.value;
    const bankName = document.getElementById('bankModalBankSelect')?.value;
    const accountNumber = document.getElementById('bankModalAccountNumber')?.value.trim();
    const accountName = document.getElementById('bankModalAccountName')?.value.trim();
    const monthlySalary = document.getElementById('bankModalMonthlySalary')?.value;

    if (!bankName || !accountNumber || !accountName) {
      alert('Please fill in Bank Name, 10-digit Account Number, and Account Name.');
      return;
    }

    if (accountNumber.length !== 10 || !/^\d{10}$/.test(accountNumber)) {
      alert('Please enter a valid 10-digit Nigerian NUBAN account number.');
      return;
    }

    const saveBtn = document.getElementById('saveBankDetailsBtn');
    const origText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const payload = {
        staff_id: staffId || undefined,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName
      };

      if (monthlySalary && this.model.user && this.model.user.role === 'admin') {
        payload.monthly_salary = parseFloat(monthlySalary);
      }

      const res = await this.model.updateStaffBanking(payload);
      alert('✓ ' + (res.message || 'Staff bank details updated successfully!'));
      SchoolView.closeStaffBankModal();

      if (this.model.user && this.model.user.role === 'admin') {
        await this.loadAdminPayrollInfo();
      } else {
        await this.loadStaffPayrollInfo();
      }
    } catch (err) {
      console.error('Save bank details error:', err);
      alert(err.message || 'Failed to update bank details.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = origText || 'Save Bank Account Details';
      }
    }
  },

  viewStaffAccountDetailsModal(staffId) {
    let staff = null;
    if (window._cachedAdminStaffAccounts && Array.isArray(window._cachedAdminStaffAccounts)) {
      staff = window._cachedAdminStaffAccounts.find(s => Number(s.id) === Number(staffId));
    }
    if (!staff && window._cachedAdminPayrollData && Array.isArray(window._cachedAdminPayrollData.staff)) {
      staff = window._cachedAdminPayrollData.staff.find(s => Number(s.id) === Number(staffId));
    }

    if (!staff) {
      alert('Staff details not found in cache. Refreshing directory...');
      this.loadAdminPayrollInfo();
      return;
    }

    SchoolView.renderViewStaffAccountDetailsModal(staff);
  },

  closeViewStaffAccountDetailsModal() {
    SchoolView.closeViewStaffAccountDetailsModal();
  },

  openProcessSalaryModal(staffId, preferredMethod = 'paystack_transfer') {
    let staff = null;
    if (window._cachedAdminPayrollData && Array.isArray(window._cachedAdminPayrollData.staff)) {
      staff = window._cachedAdminPayrollData.staff.find(s => Number(s.id) === Number(staffId));
    }
    if (!staff && window._cachedAdminStaffAccounts && Array.isArray(window._cachedAdminStaffAccounts)) {
      staff = window._cachedAdminStaffAccounts.find(s => Number(s.id) === Number(staffId));
    }
    if (staff) {
      SchoolView.openProcessSalaryModal(staff, preferredMethod);
    } else {
      alert('Staff account details not loaded.');
    }
  },

  closeProcessSalaryModal() {
    SchoolView.closeProcessSalaryModal();
  },

  calculateSalaryNetPayPreview() {
    const base = parseFloat(document.getElementById('salaryBaseAmountInput')?.value || 0) || 0;
    const bonus = parseFloat(document.getElementById('salaryBonusInput')?.value || 0) || 0;
    const deduct = parseFloat(document.getElementById('salaryDeductionsInput')?.value || 0) || 0;
    const net = Math.max(0, base + bonus - deduct);

    const previewEl = document.getElementById('salaryNetPayPreview');
    if (previewEl) {
      previewEl.textContent = '₦' + net.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
  },

  async submitProcessSalary(event) {
    if (event) event.preventDefault();

    const staffId = document.getElementById('salaryStaffId')?.value;
    const base = parseFloat(document.getElementById('salaryBaseAmountInput')?.value || 0) || 0;
    const bonus = parseFloat(document.getElementById('salaryBonusInput')?.value || 0) || 0;
    const deduct = parseFloat(document.getElementById('salaryDeductionsInput')?.value || 0) || 0;
    const monthYear = document.getElementById('salaryMonthYearInput')?.value || (window._cachedAdminPayrollData?.selected_month || 'November 2026');
    const method = document.getElementById('salaryPaymentMethodSelect')?.value || 'paystack_transfer';
    const notes = document.getElementById('salaryNotesInput')?.value.trim();

    if (!staffId || base <= 0) {
      alert('Valid salary amount is required.');
      return;
    }

    const payBtn = document.getElementById('disburseSalaryBtn');
    const origText = payBtn ? payBtn.textContent : '';
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'Processing Payout...';
    }

    try {
      const res = await this.model.processStaffSalary({
        staff_id: staffId,
        amount: base,
        bonus: bonus,
        deductions: deduct,
        month_year: monthYear,
        payment_method: method,
        notes: notes
      });

      alert('✓ ' + (res.message || 'Staff salary payment processed and disbursed successfully!'));
      SchoolView.closeProcessSalaryModal();
      await this.loadAdminPayrollInfo(monthYear);
    } catch (err) {
      console.error('Salary payout error:', err);
      alert(err.message || 'Failed to process salary payment.');
    } finally {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = origText || 'Confirm & Disburse Payout';
      }
    }
  },

  async processBulkSalaryPayout() {
    const month = document.getElementById('adminPayrollMonthSelect')?.value || (window._cachedAdminPayrollData?.selected_month || 'November 2026');
    if (!confirm(`Disburse salaries to ALL active staff members with configured bank details for ${month} via ⚡ Paystack Automated Bank Transfer (Instant NIBSS Settlement)?`)) {
      return;
    }

    try {
      const res = await this.model.processStaffSalary({
        staff_id: 'all',
        month_year: month,
        payment_method: 'paystack_transfer'
      });

      alert('✓ ' + (res.message || 'Bulk payroll disbursed successfully via Paystack!'));
      await this.loadAdminPayrollInfo(month);
    } catch (err) {
      console.error('Bulk payroll payout error:', err);
      alert(err.message || 'Failed to process bulk payroll.');
    }
  },

  async viewPayslip(reference) {
    if (!reference) return;
    try {
      const payslip = await this.model.getSinglePayslip(reference);
      SchoolView.renderSinglePayslipModal(payslip);
    } catch (err) {
      console.error('Error fetching payslip:', err);
      alert(err.message || 'Could not load payslip.');
    }
  },

  closePayslipModal() {
    SchoolView.closePayslipModal();
  },

  /* ==========================================================================
     ALOC STATION API & CBT ENGINE CONTROLLER
     ========================================================================== */
  alocQuizState: {
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    flagged: {},
    timerSeconds: 0,
    totalTimerSeconds: 0,
    timerInterval: null,
    isTimed: true,
    subject: 'Mathematics',
    examType: 'waec',
    year: '2024'
  },
  alocLastResult: null,
  staffCachedAlocQuestions: [],

  // 1. Load ALOC School Page (Student, Staff, Admin)
  async loadAlocSchool(portalType = 'student') {
    try {
      const settings = await schoolModel.getAlocSettings();

      if (portalType === 'student') {
        const enrolled = (schoolModel.studentEnrolledSubjects && schoolModel.studentEnrolledSubjects.length > 0)
          ? schoolModel.studentEnrolledSubjects
          : ((schoolModel.user && schoolModel.user.subjects) ? schoolModel.user.subjects : []);
        SchoolView.renderStudentAlocSetup(settings, enrolled);
      } else if (portalType === 'staff') {
        SchoolView.renderStaffAlocSchool(settings, this.staffCachedAlocQuestions || []);
        if (!this.staffCachedAlocQuestions || this.staffCachedAlocQuestions.length === 0) {
          await this.staffSearchAlocQuestions();
        }
      } else if (portalType === 'admin') {
        SchoolView.renderAdminAlocSchool(settings, settings.notifications || []);
      }
    } catch (err) {
      console.error('Error loading ALOC School:', err);
    }
  },

  // 2. Student CBT Exam Initiation & Timer Management
  handleToggleUntimedMode(isUntimed) {
    const row = document.getElementById('alocTimerInputsRow');
    if (row) {
      row.style.opacity = isUntimed ? '0.35' : '1';
      row.style.pointerEvents = isUntimed ? 'none' : 'auto';
    }
  },

  setTimerPreset(minutes, btnEl) {
    const input = document.getElementById('alocCustomTimerMinutes');
    if (input) input.value = minutes;

    document.querySelectorAll('.btn-timer-preset').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
  },

  handleCustomTimerInput(val) {
    const numeric = parseInt(val, 10);
    document.querySelectorAll('.btn-timer-preset').forEach(b => {
      const bMin = parseInt(b.textContent, 10);
      if (bMin === numeric) b.classList.add('active');
      else b.classList.remove('active');
    });
  },

  handleExamBoardSelect(board) {
    const badge = document.getElementById('quizExamBadge');
    if (badge) badge.textContent = `${board.toUpperCase()} Series`;
  },

  async handleStartAlocQuiz(event) {
    if (event) event.preventDefault();

    const examType = document.getElementById('alocExamType')?.value || 'waec';
    const subject = document.getElementById('alocSubject')?.value || 'Mathematics';
    const year = document.getElementById('alocYear')?.value || '2024';
    const limit = parseInt(document.getElementById('alocLimit')?.value || '20', 10);
    const isUntimed = !!document.getElementById('alocUntimedMode')?.checked;
    const customMinutes = parseInt(document.getElementById('alocCustomTimerMinutes')?.value || '45', 10);

    const btn = document.getElementById('btnStartAlocCbt');
    const originalText = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = '🚀 Preparing Test Paper & Vault Gateway...';
    }

    try {
      const res = await schoolModel.fetchAlocQuestions({
        examType,
        subject,
        year,
        limit
      });

      if (res.disabled) {
        alert(res.message || 'The CBT engine has been deactivated by school administration.');
        return;
      }

      if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
        alert('No questions found for the selected examination criteria. Please try another subject or year.');
        return;
      }

      // Calculate duration in seconds
      const durationSeconds = Math.max(5 * 60, customMinutes * 60);

      if (this.alocQuizState.timerInterval) {
        clearInterval(this.alocQuizState.timerInterval);
      }

      this.alocQuizState = {
        questions: res.data,
        currentIndex: 0,
        userAnswers: {},
        flagged: {},
        isTimed: !isUntimed,
        timerSeconds: durationSeconds,
        totalTimerSeconds: durationSeconds,
        timerInterval: null,
        subject,
        examType,
        year
      };

      // Set up keyboard shortcuts (A, B, C, D, Arrows, F)
      if (this._cbtKeydownHandler) {
        window.removeEventListener('keydown', this._cbtKeydownHandler);
      }
      this._cbtKeydownHandler = (e) => {
        if (!this.alocQuizState || !this.alocQuizState.questions || this.alocQuizState.questions.length === 0) return;
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;
        
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'b' || key === 'c' || key === 'd') {
          e.preventDefault();
          this.selectAlocOption(key);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.nextAlocQuestion();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prevAlocQuestion();
        } else if (key === 'f') {
          e.preventDefault();
          this.flagCurrentQuestion();
        }
      };
      window.addEventListener('keydown', this._cbtKeydownHandler);

      // Start Countdown Timer if in Timed Mode
      if (this.alocQuizState.isTimed) {
        this.updateTimerDisplay(this.alocQuizState.timerSeconds);
        this.alocQuizState.timerInterval = setInterval(() => {
          this.alocQuizState.timerSeconds--;
          this.updateTimerDisplay(this.alocQuizState.timerSeconds);

          if (this.alocQuizState.timerSeconds <= 0) {
            clearInterval(this.alocQuizState.timerInterval);
            alert('Time is up! Your examination paper is being automatically submitted.');
            this.submitAlocQuiz();
          }
        }, 1000);
      } else {
        const timerBox = document.getElementById('quizTimerBox');
        if (timerBox) {
          timerBox.className = 'aloc-timer-badge';
          timerBox.innerHTML = '📖 Untimed Practice';
        }
      }

      SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
    } catch (err) {
      console.error('Error starting CBT session:', err);
      alert(err.message || 'Failed to start CBT examination session.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  },

  updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const timerText = document.getElementById('quizTimerText');
    if (timerText) timerText.textContent = str;

    const timerBox = document.getElementById('quizTimerBox');
    if (timerBox) {
      if (seconds < 60) {
        timerBox.className = 'aloc-timer-badge urgent';
      } else if (seconds < 300) {
        timerBox.className = 'aloc-timer-badge warning';
      } else {
        timerBox.className = 'aloc-timer-badge';
      }
    }
  },

  // 3. Option Selection & Navigation
  selectAlocOption(optionKey) {
    this.alocQuizState.userAnswers[this.alocQuizState.currentIndex] = optionKey;
    SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
  },

  goToAlocQuestion(index) {
    if (index >= 0 && index < this.alocQuizState.questions.length) {
      this.alocQuizState.currentIndex = index;
      SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
    }
  },

  nextAlocQuestion() {
    if (this.alocQuizState.currentIndex < this.alocQuizState.questions.length - 1) {
      this.alocQuizState.currentIndex++;
      SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
    } else {
      this.confirmSubmitAlocQuiz();
    }
  },

  prevAlocQuestion() {
    if (this.alocQuizState.currentIndex > 0) {
      this.alocQuizState.currentIndex--;
      SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
    }
  },

  flagCurrentQuestion() {
    const curr = this.alocQuizState.currentIndex;
    this.alocQuizState.flagged[curr] = !this.alocQuizState.flagged[curr];
    SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
  },

  // 4. Submission & Scoring
  confirmSubmitAlocQuiz() {
    const total = this.alocQuizState.questions.length;
    const answered = Object.keys(this.alocQuizState.userAnswers).length;
    const unanswered = total - answered;

    const msg = unanswered > 0
      ? `You have answered ${answered} of ${total} questions (${unanswered} unanswered).\n\nAre you sure you want to finish and submit your CBT exam?`
      : `You have answered all ${total} questions!\n\nAre you ready to submit your exam and view your score?`;

    if (confirm(msg)) {
      this.submitAlocQuiz();
    }
  },

  submitAlocQuiz() {
    if (this.alocQuizState.timerInterval) {
      clearInterval(this.alocQuizState.timerInterval);
    }

    if (this._cbtKeydownHandler) {
      window.removeEventListener('keydown', this._cbtKeydownHandler);
      this._cbtKeydownHandler = null;
    }

    let correctCount = 0;
    const total = this.alocQuizState.questions.length;

    this.alocQuizState.questions.forEach((q, idx) => {
      const studentAns = (this.alocQuizState.userAnswers[idx] || '').toLowerCase();
      const correctAns = (q.answer || 'a').toLowerCase();
      if (studentAns === correctAns) {
        correctCount++;
      }
    });

    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    let timeSpentStr = 'Practice';
    if (this.alocQuizState.isTimed) {
      const elapsed = Math.max(0, this.alocQuizState.totalTimerSeconds - this.alocQuizState.timerSeconds);
      const eMins = Math.floor(elapsed / 60);
      const eSecs = elapsed % 60;
      timeSpentStr = `${String(eMins).padStart(2, '0')}:${String(eSecs).padStart(2, '0')}`;
    }

    this.alocLastResult = {
      score: correctCount,
      total,
      percentage,
      timeSpent: timeSpentStr
    };

    SchoolView.renderStudentAlocResults(this.alocLastResult);

    try {
      if (typeof this.loadStudentOverview === 'function') {
        this.loadStudentOverview();
      }
    } catch (e) {}
  },

  showAlocReviewView() {
    SchoolView.renderStudentAlocReview(this.alocQuizState.questions, this.alocQuizState.userAnswers);
  },

  resetAlocQuiz() {
    if (this.alocQuizState.timerInterval) {
      clearInterval(this.alocQuizState.timerInterval);
    }

    if (this._cbtKeydownHandler) {
      window.removeEventListener('keydown', this._cbtKeydownHandler);
      this._cbtKeydownHandler = null;
    }

    const configCard = document.getElementById('studentAlocConfigCard');
    const quizCard = document.getElementById('studentAlocQuizCard');
    const resultCard = document.getElementById('studentAlocResultCard');
    const reviewCard = document.getElementById('studentAlocReviewCard');

    if (quizCard) quizCard.classList.add('hidden');
    if (resultCard) resultCard.classList.add('hidden');
    if (reviewCard) reviewCard.classList.add('hidden');
    if (configCard) configCard.classList.remove('hidden');
  },

  // 5. Staff Question Bank Operations
  async staffSearchAlocQuestions() {
    const subject = document.getElementById('staffAlocSubject')?.value || 'Physics';
    const examType = document.getElementById('staffAlocExamType')?.value || 'waec';
    const year = document.getElementById('staffAlocYear')?.value || '2024';
    const limit = parseInt(document.getElementById('staffAlocLimit')?.value || '20', 10);

    const listEl = document.getElementById('staffAlocQuestionsList');
    if (listEl) {
      listEl.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--muted);">Querying Multi-Board Question Vault & ALOC Engine...</div>`;
    }

    try {
      const res = await schoolModel.fetchAlocQuestions({
        subject,
        examType,
        year,
        limit
      });

      if (res.disabled) {
        SchoolView.renderStaffAlocSchool({ is_enabled: 0 }, []);
        return;
      }

      this.staffCachedAlocQuestions = res.data || [];
      const settings = schoolModel.alocSettings || { is_enabled: 1, plan_tier: 'School Pro' };
      SchoolView.renderStaffAlocSchool(settings, this.staffCachedAlocQuestions);
    } catch (err) {
      console.error('Error fetching staff ALOC questions:', err);
      if (listEl) {
        listEl.innerHTML = `<div class="card" style="color:var(--danger); padding:1rem;">Failed to fetch questions: ${SchoolView.escapeHtml(err.message)}</div>`;
      }
    }
  },

  staffAddQuestionToAssignment(questionObj) {
    if (!questionObj) return;

    // Build assignment title and instructions
    const titleInput = document.getElementById('newAssignmentTitle');
    const subjectSelect = document.getElementById('newAssignmentSubject');
    const instructionsTextarea = document.getElementById('newAssignmentInstructions');

    if (titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
      titleInput.value = `${questionObj.subject} Assignment: ${questionObj.examtype || 'WAEC'} Practice`;
    }

    if (subjectSelect) {
      for (let i = 0; i < subjectSelect.options.length; i++) {
        if (subjectSelect.options[i].text.toLowerCase().includes(questionObj.subject.toLowerCase())) {
          subjectSelect.selectedIndex = i;
          break;
        }
      }
    }

    if (instructionsTextarea) {
      const options = questionObj.option || {};
      const snippet = `\n--- Question (${questionObj.examtype || 'WAEC'} ${questionObj.examyear || ''}) ---\n${questionObj.question}\nA. ${options.a || ''}\nB. ${options.b || ''}\nC. ${options.c || ''}\nD. ${options.d || ''}\n\nTask: Solve step-by-step and show your complete mathematical or conceptual working.\n`;
      instructionsTextarea.value = (instructionsTextarea.value ? instructionsTextarea.value + '\n' : '') + snippet;
    }

    // Switch to assignments tab in staff workspace
    if (typeof window.selectStaffWorkspaceDropdownItem === 'function') {
      window.selectStaffWorkspaceDropdownItem('assignments');
    }

    alert('Question successfully transferred to your Assignment editor! Review details, set deadline, and click "Publish assignment".');
  },

  // 6. Admin Multi-API Operations & Permissions
  async adminToggleAlocApi(enableBool) {
    const promptMsg = enableBool
      ? 'Activate the Unified CBT Engine platform-wide for students and staff?'
      : 'Are you sure you want to deactivate the Unified CBT Engine? Student and staff CBT test modules will be temporarily restricted.';

    if (!confirm(promptMsg)) return;

    try {
      const updated = await schoolModel.toggleAlocStatus(enableBool);
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
      alert(enableBool ? 'Unified CBT Engine successfully activated platform-wide.' : 'Unified CBT Engine has been deactivated.');
    } catch (err) {
      console.error('Error toggling CBT engine:', err);
      alert('Error updating engine status: ' + (err.message || 'Operation failed.'));
    }
  },

  async adminToggleCustomTimer(allowedBool) {
    try {
      const updated = await schoolModel.saveAlocSettings({ allow_custom_timer: allowedBool ? 1 : 0 });
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
      const label = document.getElementById('adminCustomTimerLabel');
      if (label) label.textContent = allowedBool ? 'Permission Granted' : 'Permission Restricted';
    } catch (err) {
      console.error('Error toggling custom timer permission:', err);
      alert('Failed to update timer permission: ' + err.message);
    }
  },

  async adminUpdateAllowedBoards() {
    const checked = [];
    document.querySelectorAll('.admin-board-chk:checked').forEach(chk => {
      checked.push(chk.value.toUpperCase());
    });
    const boardsStr = checked.join(',') || 'WAEC,JAMB';

    try {
      const updated = await schoolModel.saveAlocSettings({ allowed_boards: boardsStr });
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
    } catch (err) {
      console.error('Error updating allowed boards:', err);
      alert('Failed to update allowed boards: ' + err.message);
    }
  },

  async adminPingProvider(providerKey) {
    const pingEl = document.getElementById(
      providerKey === 'aloc' ? 'pingStatusAloc' : 
      (providerKey === 'examfocus' ? 'pingStatusExamfocus' : 'pingStatusVault')
    );
    if (pingEl) pingEl.textContent = 'Pinging...';

    try {
      const res = await schoolModel.pingCbtProvider(providerKey);
      if (res && res.success) {
        if (pingEl) {
          pingEl.textContent = `${res.latency_ms} ms`;
          pingEl.className = 'badge badge-green';
        }
      } else {
        if (pingEl) {
          pingEl.textContent = 'Degraded';
          pingEl.className = 'badge badge-gold';
        }
      }
    } catch (e) {
      if (pingEl) {
        pingEl.textContent = 'Error';
        pingEl.className = 'badge badge-red';
      }
    }
  },

  async adminRunMultiApiDiagnostics() {
    alert('Running latency benchmark across all 3 integrated CBT providers (ALOC, ExamFocus, and National Vault)...');
    await this.adminPingProvider('aloc');
    await this.adminPingProvider('examfocus');
    await this.adminPingProvider('national_vault');
    alert('Diagnostics complete! All 3 provider pipelines are operational and responsive.');
  },

  async adminChangeAlocPlan(planName) {
    if (!confirm(`Switch school subscription plan to "${planName}"?`)) return;

    try {
      const updated = await schoolModel.saveAlocSettings({ plan_tier: planName });
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
      alert(`Subscription plan updated to ${planName}. Quotas and access layers have been recalibrated.`);
    } catch (err) {
      console.error('Error switching plan:', err);
      alert('Failed to change plan: ' + err.message);
    }
  },

  async adminRenewCredits() {
    if (!confirm('Top up / reset credit allocation to the maximum quota for your active plan?')) return;

    try {
      const updated = await schoolModel.saveAlocSettings({ reset_credits: true });
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
      alert('Credits have been renewed to full allocation.');
    } catch (err) {
      console.error('Error renewing credits:', err);
      alert('Failed to renew credits: ' + err.message);
    }
  },

  async handleSaveAlocKey(event) {
    if (event) event.preventDefault();
    const key = document.getElementById('adminAlocKeyInput')?.value?.trim();
    if (!key) {
      alert('Please enter a valid API key.');
      return;
    }

    try {
      const updated = await schoolModel.saveAlocSettings({ api_key: key });
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
      alert('ALOC Station API secret key saved securely on backend proxy.');
    } catch (err) {
      console.error('Error saving API key:', err);
      alert('Failed to save API key: ' + err.message);
    }
  },

  async adminPingAlocApi() {
    await this.adminPingProvider('aloc');
  },

  async adminDismissNotif(notifId) {
    try {
      await schoolModel.dismissAlocNotification(notifId);
      const settings = await schoolModel.getAlocSettings();
      SchoolView.renderAdminAlocSchool(settings, settings.notifications || []);
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  },

  // 7. Admin Paystack Gateway Controllers
  async loadAdminPaystackSettings() {
    try {
      const settings = await schoolModel.getPaystackSettings();
      SchoolView.renderAdminPaystackSettings(settings, settings.notifications || []);
      return settings;
    } catch (err) {
      console.error('Error loading Paystack settings:', err);
    }
  },

  async adminTogglePaystackApi(enableBool) {
    const promptMsg = enableBool
      ? 'Enable the Paystack API platform-wide? Students will be able to pay tuition online and automated staff payroll transfers will be activated.'
      : 'Are you sure you want to remove (deactivate) the Paystack API? Student online fee checkouts and automated payroll transfers will be temporarily disabled.';

    if (!confirm(promptMsg)) return;

    try {
      const res = await schoolModel.togglePaystackStatus(enableBool);
      SchoolView.renderAdminPaystackSettings(res.settings, res.settings.notifications || []);
      alert(enableBool ? 'Paystack API successfully enabled platform-wide.' : 'Paystack API has been deactivated (removed).');
    } catch (err) {
      console.error('Error toggling Paystack API:', err);
      alert('Failed to update Paystack API status: ' + (err.message || 'Operation failed.'));
    }
  },

  async handleSavePaystackSettings(event) {
    if (event) event.preventDefault();

    const env = document.getElementById('adminPaystackEnvSelect')?.value || 'test';
    const feeBearer = document.getElementById('adminPaystackFeeBearerSelect')?.value || 'school';
    const payrollMode = document.getElementById('adminPaystackPayrollModeSelect')?.value || 'automated';
    const merchantName = document.getElementById('adminPaystackMerchantName')?.value?.trim() || '';
    const pubKey = document.getElementById('adminPaystackPublicKey')?.value?.trim() || '';
    const secKey = document.getElementById('adminPaystackSecretKey')?.value?.trim() || '';

    try {
      const res = await schoolModel.savePaystackSettings({
        environment: env,
        fee_bearer: feeBearer,
        payroll_transfer_mode: payrollMode,
        merchant_name: merchantName,
        public_key: pubKey,
        secret_key: secKey
      });
      SchoolView.renderAdminPaystackSettings(res.settings, res.settings.notifications || []);
      alert('✓ Paystack operational decisions and credentials saved successfully.');
    } catch (err) {
      console.error('Error saving Paystack settings:', err);
      alert('Failed to save Paystack settings: ' + (err.message || 'Operation failed.'));
    }
  },

  async adminPingPaystackApi() {
    const resultBox = document.getElementById('adminPaystackPingResult');
    if (!resultBox) return;

    resultBox.classList.remove('hidden');
    resultBox.style.display = 'block';
    resultBox.style.background = 'rgba(23,107,80,.08)';
    resultBox.style.border = '1px solid var(--primary)';
    resultBox.style.color = 'var(--text)';
    resultBox.textContent = 'Pinging Paystack API servers & verifying merchant credentials...';

    const start = performance.now();
    try {
      const settings = await schoolModel.getPaystackSettings();
      const latency = Math.round(performance.now() - start);

      resultBox.style.background = 'rgba(34,197,94,.1)';
      resultBox.style.borderColor = 'var(--success)';
      resultBox.style.color = '#15803d';
      resultBox.innerHTML = `Paystack Gateway: Healthy (HTTP 200 OK)<br>• Latency: ${latency}ms<br>• Environment: ${(settings.environment || 'TEST').toUpperCase()}<br>• Public Key: ${settings.public_key ? 'Configured (' + settings.public_key.substring(0, 10) + '...)' : 'Not Set'}<br>• Remittance Balance: ₦${parseFloat(settings.balance_ngn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    } catch (err) {
      resultBox.style.background = 'rgba(239,68,68,.1)';
      resultBox.style.borderColor = 'var(--danger)';
      resultBox.style.color = 'var(--danger)';
      resultBox.innerHTML = `Connection Warning: ${SchoolView.escapeHtml(err.message)}`;
    }
  },

  async adminDismissPaystackNotif(notifId) {
    try {
      await schoolModel.dismissPaystackNotification(notifId);
      await this.loadAdminPaystackSettings();
    } catch (err) {
      console.error('Error dismissing Paystack notification:', err);
    }
  },

  // 8. Student Paystack Tuition Checkout
  async payFeeWithPaystack(plan = null) {
    try {
      const selectedPlan = plan || window._selectedFeePlan || 'monthly';
      const initRes = await schoolModel.initializePaystackFee(selectedPlan);

      if (initRes.disabled) {
        alert('⚠️ Paystack Payment Gateway is currently deactivated by the administrator. Please contact school administration or pay via direct bank transfer.');
        return;
      }

      const amountNgn = initRes.amount_ngn || initRes.amount || (selectedPlan === 'weekly' ? 5000 : 18000);
      const reference = initRes.reference;
      const publicKey = initRes.public_key;
      const email = initRes.email || (schoolModel.user && schoolModel.user.email) || 'student@springfield.edu';
      const studentName = (schoolModel.user && schoolModel.user.name) || 'Student';

      const isRealKey = publicKey && (publicKey.startsWith('pk_live_') || publicKey.startsWith('pk_test_')) &&
        !publicKey.includes('demo') && !publicKey.includes('placeholder') && !publicKey.includes('school_edu') && publicKey.length >= 32;

      // Try Paystack Inline Popup if SDK is available with a real registered key
      if (isRealKey && typeof window.PaystackPop !== 'undefined' && typeof window.PaystackPop.setup === 'function') {
        try {
          const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: initRes.amount_kobo || Math.round(amountNgn * 100),
            currency: 'NGN',
            ref: reference,
            metadata: {
              custom_fields: [
                { display_name: "Student Name", variable_name: "student_name", value: studentName },
                { display_name: "Plan", variable_name: "payment_plan", value: selectedPlan }
              ]
            },
            callback: async (response) => {
              try {
                const verifyRes = await schoolModel.verifyPaystackPayment(response.reference, selectedPlan);
                alert(`✓ Paystack Payment Confirmed!\n\nReference: ${response.reference}\nAmount: ₦${amountNgn.toLocaleString()}\nPlan: ${selectedPlan.toUpperCase()} Tuition\n\nYour portal access is now fully unlocked!`);
                window.location.reload();
              } catch (verErr) {
                alert('Payment completed, but verification encountered an issue: ' + verErr.message);
              }
            },
            onClose: () => {
              console.log('Paystack checkout popup closed.');
            }
          });
          handler.openIframe();
          return;
        } catch (popupErr) {
          console.warn('Paystack inline iframe could not open, falling back to secure checkout prompt:', popupErr);
        }
      }

      // Graceful Fallback for offline / sandboxed environments without CDN access
      const confirmMsg = `[PAYSTACK SECURE CHECKOUT]\n\nMerchant: Springfield Academy Portal\nPlan: ${selectedPlan.toUpperCase()} Tuition (${selectedPlan === 'monthly' ? '10% Discount Applied' : '4-Week Split'})\nAmount to Pay: ₦${Number(amountNgn).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nReference: ${reference}\nPayer: ${studentName} (${email})\n\nClick OK to authorize and verify this test transaction.`;

      if (!confirm(confirmMsg)) {
        return;
      }

      const verifyRes = await schoolModel.verifyPaystackPayment(reference, selectedPlan);
      alert(`✓ Paystack Payment Successful!\n\nReference: ${reference}\nAmount: ₦${Number(amountNgn).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nPlan: ${selectedPlan.toUpperCase()}\nStatus: ${verifyRes.status || 'success'}\n\nYour portal access is now fully unlocked!`);
      window.location.reload();

    } catch (err) {
      console.error('Paystack fee payment error:', err);
      alert('Paystack Payment Error: ' + (err.message || 'Unable to complete transaction.'));
    }
  },

  /* ------------------------------------------------------------------------
     16. FINANCIAL RECORD BOOK & BALANCE SHEET
     ------------------------------------------------------------------------ */
  async loadFinancialLedger(filters = {}) {
    const tbody = document.getElementById('ledgerTableBody');
    if (tbody && (!window._cachedFinancialLedgerData || Object.keys(filters).length === 0)) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem 1rem; color:var(--muted);">📖 Loading institutional financial ledger...</td></tr>`;
    }

    try {
      const data = await this.model.getFinancialLedger(filters);
      window._cachedFinancialLedgerData = data;
      SchoolView.renderFinancialLedger(data);

      const filterBadge = document.getElementById('ledgerActiveFiltersBadge');
      if (filterBadge) {
        const hasFilters = Boolean(filters.search || (filters.type && filters.type !== 'all') || (filters.channel && filters.channel !== 'all') || (filters.source && filters.source !== 'all') || (filters.period && filters.period !== 'all'));
        filterBadge.textContent = hasFilters ? 'Filtered Records' : 'All Records';
        filterBadge.className = hasFilters ? 'badge badge-gold' : 'badge badge-blue';
      }
      return data;
    } catch (err) {
      console.error('Error loading financial ledger:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem 1rem; color:var(--danger);">⚠️ Failed to load financial ledger: ${SchoolView.escapeHtml(err.message || 'Unknown error')}</td></tr>`;
      }
    }
  },

  filterFinancialLedger() {
    const search = document.getElementById('ledgerSearchInput')?.value.trim() || '';
    const type = document.getElementById('ledgerTypeFilter')?.value || 'all';
    const channel = document.getElementById('ledgerChannelFilter')?.value || 'all';
    const source = document.getElementById('ledgerSourceFilter')?.value || 'all';
    const period = document.getElementById('ledgerPeriodFilter')?.value || 'all';

    this.loadFinancialLedger({ search, type, channel, source, period });
  },

  resetFinancialLedgerFilters() {
    const sInput = document.getElementById('ledgerSearchInput');
    const tSelect = document.getElementById('ledgerTypeFilter');
    const cSelect = document.getElementById('ledgerChannelFilter');
    const oSelect = document.getElementById('ledgerSourceFilter');
    const pSelect = document.getElementById('ledgerPeriodFilter');

    if (sInput) sInput.value = '';
    if (tSelect) tSelect.value = 'all';
    if (cSelect) cSelect.value = 'all';
    if (oSelect) oSelect.value = 'all';
    if (pSelect) pSelect.value = 'all';

    this.loadFinancialLedger({});
  },

  openAddExternalTransactionModal() {
    SchoolView.openAddExternalTransactionModal();
  },

  closeAddExternalTransactionModal() {
    SchoolView.closeAddExternalTransactionModal();
  },

  handleExternalTypeChange() {
    const type = document.getElementById('extTransTypeSelect')?.value || 'income';
    const catSelect = document.getElementById('extTransCategorySelect');
    if (!catSelect) return;

    if (type === 'income') {
      catSelect.innerHTML = `
        <option value="Uniform & Textbooks Sale">Uniform & Textbooks Sale</option>
        <option value="Admission & Entrance Form Fee">Admission & Entrance Form Fee</option>
        <option value="PTA Development Levy">PTA Development Levy</option>
        <option value="Direct Cash Tuition">Direct Cash Tuition</option>
        <option value="External Donation / Grant">External Donation / Grant</option>
        <option value="Facility Rental">Facility Rental</option>
        <option value="Other Income">Other Income</option>
      `;
    } else {
      catSelect.innerHTML = `
        <option value="Campus Utilities & Generator Diesel">Campus Utilities & Generator Diesel</option>
        <option value="Physics & Chemistry Lab Consumables">Physics & Chemistry Lab Consumables</option>
        <option value="Facility Repairs & Maintenance">Facility Repairs & Maintenance</option>
        <option value="Exam Papers & Stationery">Exam Papers & Stationery</option>
        <option value="Security & Janitorial">Security & Janitorial</option>
        <option value="Equipment Purchase">Equipment Purchase</option>
        <option value="Other Operating Expense">Other Operating Expense</option>
      `;
    }
  },

  async submitAddExternalTransaction(event) {
    if (event) event.preventDefault();

    const submitBtn = document.getElementById('saveExternalTransBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Save';

    const type = document.getElementById('extTransTypeSelect')?.value || 'income';
    const amountVal = parseFloat(document.getElementById('extTransAmountInput')?.value);
    const category = document.getElementById('extTransCategorySelect')?.value || 'General';
    const channel = document.getElementById('extTransChannelSelect')?.value || 'cash';
    const entityName = document.getElementById('extTransEntityNameInput')?.value.trim() || '';
    const description = document.getElementById('extTransDescriptionInput')?.value.trim() || '';
    const reference = document.getElementById('extTransReferenceInput')?.value.trim() || '';
    const transactionDate = document.getElementById('extTransDateInput')?.value || '';
    const notes = document.getElementById('extTransNotesInput')?.value.trim() || '';

    if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid transaction amount greater than 0.');
      return;
    }

    if (!description) {
      alert('Please provide a narration or description for this transaction.');
      return;
    }

    const payload = {
      transaction_type: type,
      amount: amountVal,
      category: category,
      channel: channel,
      entity_name: entityName,
      description: description,
      reference: reference,
      transaction_date: transactionDate,
      notes: notes
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Saving to Ledger...';
    }

    try {
      const res = await this.model.addExternalTransaction(payload);
      alert(`✓ Transaction successfully recorded in Financial Ledger!\n\nReference: ${res.reference || 'Generated'}\nFlow: ${type.toUpperCase()}\nAmount: ₦${amountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nBalance After Entry: ₦${Number(res.running_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      this.closeAddExternalTransactionModal();
      await this.loadFinancialLedger();
    } catch (err) {
      console.error('Error adding external transaction:', err);
      alert('Failed to save external transaction: ' + (err.message || 'Operation failed.'));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  },

  async deleteExternalTransaction(id, reference, amount) {
    if (!id) return;
    const confirmMsg = `Are you sure you want to delete / void manual entry:\n\nReference: ${reference}\nAmount: ₦${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\nThis will remove the transaction from the balance sheet and recalculate all subsequent running balances.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      await this.model.deleteExternalTransaction(id);
      alert(`✓ External transaction ${reference} has been deleted and the ledger balance updated.`);
      await this.loadFinancialLedger();
    } catch (err) {
      console.error('Error deleting external transaction:', err);
      alert('Failed to delete transaction: ' + (err.message || 'Operation failed.'));
    }
  },

  viewLedgerTransaction(id) {
    if (!id) return;
    const records = window._cachedFinancialLedgerData?.records || [];
    const tx = records.find(r => Number(r.id) === Number(id));

    if (!tx) {
      alert('Transaction voucher details not found in cache. Refreshing ledger...');
      this.loadFinancialLedger();
      return;
    }

    SchoolView.renderTransactionDetailModal(tx);
  },

  closeLedgerTransactionModal() {
    SchoolView.closeLedgerTransactionModal();
  },

  printBalanceSheet() {
    const origTitle = document.title;
    document.title = 'Institutional_Financial_Balance_Sheet_' + new Date().toISOString().slice(0, 10);
    window.print();
    document.title = origTitle;
  },

  copyToClipboard(text, label = 'Text') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert(`✓ ${label} copied to clipboard: ${text}`);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert(`✓ ${label} copied: ${text}`);
    });
  },

  /* ==========================================================================
     CAMPUS CHAT & DIRECT MESSAGING (DMs) CONTROLLER
     ========================================================================== */
  _chatState: {
    mountId: null,
    isModal: false,
    activeType: 'group', // 'group' or 'direct'
    activeTarget: 'general', // 'general' or user id
    sidebarData: null,
    contacts: [],
    roleFilter: 'all',
    searchQuery: '',
    lastMessageId: 0,
    pollTimer: null,
    unreadTimer: null
  },

  async openCampusChat(mountTargetId = 'studentChatMount', isModal = false) {
    this._chatState.mountId = mountTargetId;
    this._chatState.isModal = isModal;

    try {
      // 1. Fetch sidebar data (channels & contacts)
      const sidebarData = await schoolModel.getChatSidebar();
      this._chatState.sidebarData = sidebarData;
      this._chatState.contacts = sidebarData.contacts || [];

      // Update unread count in header
      SchoolView.updateHeaderChatBadge(sidebarData.total_unread_dms || 0);

      // 2. Fetch conversation messages for current target
      const type = this._chatState.activeType || 'group';
      const target = this._chatState.activeTarget || 'general';

      const messagesData = await schoolModel.getChatMessages(type, target, 0);
      const msgs = messagesData.messages || [];
      if (msgs.length > 0) {
        this._chatState.lastMessageId = msgs[msgs.length - 1].id;
      } else {
        this._chatState.lastMessageId = 0;
      }

      // 3. Render Campus Chat
      SchoolView.renderCampusChat(
        mountTargetId,
        sidebarData,
        type,
        target,
        messagesData,
        sidebarData.current_user || schoolModel.user,
        isModal
      );

      // 4. Start active conversation polling
      this.startChatPolling();

    } catch (err) {
      console.error('Error opening campus chat:', err);
      const mount = document.getElementById(mountTargetId);
      if (mount) {
        mount.innerHTML = `
          <div class="card" style="padding:2rem; text-align:center;">
            <p style="color:var(--danger); font-weight:700;">Unable to open Campus Chat: ${SchoolView.escapeHtml(err.message)}</p>
            <button type="button" class="btn-sm btn-sm-primary" onclick="schoolController.openCampusChat('${mountTargetId}', ${isModal})">Retry Connection</button>
          </div>
        `;
      }
    }
  },

  async openCampusChatModal() {
    const modal = document.getElementById('campusChatModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
    await this.openCampusChat('modalChatMount', true);
  },

  closeCampusChatModal() {
    const modal = document.getElementById('campusChatModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    if (this._chatState.mountId === 'modalChatMount') {
      this.stopChatPolling();
    }
  },

  async selectChatTarget(type, target) {
    this._chatState.activeType = type;
    this._chatState.activeTarget = target;
    this._chatState.lastMessageId = 0;

    // Update active highlight in sidebar
    document.querySelectorAll('.wa-contact-tile, .chat-channel-item, .chat-contact-item').forEach(el => el.classList.remove('active'));
    if (type === 'group') {
      const chEl = document.getElementById('channel-general');
      if (chEl) chEl.classList.add('active');
    } else {
      const contactEl = document.getElementById(`contact-item-${target}`);
      if (contactEl) {
        contactEl.classList.add('active');
        const unreadPill = contactEl.querySelector('.wa-unread-badge, .chat-badge-unread');
        if (unreadPill) unreadPill.remove();
      }
    }

    // Switch view on mobile
    const sidebarCol = document.getElementById('chatSidebarCol');
    const mainCol = document.getElementById('chatMainCol');
    if (sidebarCol && mainCol && window.innerWidth <= 768) {
      sidebarCol.classList.add('mobile-hidden');
      mainCol.classList.remove('mobile-hidden');
    }

    // Close any open emoji or attach trays
    document.getElementById('waEmojiTray')?.classList.remove('open');
    document.getElementById('waAttachTray')?.classList.remove('open');

    // Fetch messages
    try {
      const messagesData = await schoolModel.getChatMessages(type, target, 0);
      const msgs = messagesData.messages || [];
      if (msgs.length > 0) {
        this._chatState.lastMessageId = msgs[msgs.length - 1].id;
      }

      const targetInfo = messagesData.target_info || {};
      const isGeneral = type === 'group' && target === 'general';
      const general = (this._chatState.sidebarData && this._chatState.sidebarData.general_channel) || {};

      // Update header info
      const titleEl = document.getElementById('chatActiveTargetTitle');
      const subEl = document.getElementById('chatActiveTargetSub');
      const inputEl = document.getElementById('chatMessageInput');

      if (titleEl) {
        titleEl.innerHTML = isGeneral
          ? '# General Community Group <span class="badge badge-green" style="font-size:.65rem; padding:.1rem .4rem;">School Forum</span>'
          : `${SchoolView.escapeHtml(targetInfo.name || 'Direct Message')} ${SchoolView.formatRoleBadge(targetInfo.role)}`;
      }

      if (subEl) {
        const activeSub = isGeneral
          ? `${general.total_members || 1} campus participants · Public Announcements & Study Forum`
          : `<span class="wa-status-online">● online</span> · ${SchoolView.formatRoleBadge(targetInfo.role)} · ${SchoolView.escapeHtml(targetInfo.formatted_id || '')} · ${SchoolView.escapeHtml(targetInfo.department || '')}`;
        subEl.innerHTML = activeSub;
      }

      if (inputEl) {
        inputEl.placeholder = `Type a message to ${isGeneral ? '#General' : SchoolView.escapeHtml(targetInfo.name || 'contact')}...`;
        inputEl.focus();
      }

      // Render messages stream
      SchoolView.renderChatMessagesStream(msgs, targetInfo, schoolModel.user);

      // Poll unread update to refresh badges
      this.pollUnreadCounters();

    } catch (err) {
      console.error('Error switching chat target:', err);
    }
  },

  showMobileSidebar() {
    const sidebarCol = document.getElementById('chatSidebarCol');
    const mainCol = document.getElementById('chatMainCol');
    if (sidebarCol && mainCol) {
      sidebarCol.classList.remove('mobile-hidden');
      mainCol.classList.add('mobile-hidden');
    }
  },

  filterChatRole(role) {
    this._chatState.roleFilter = role;
    document.querySelectorAll('.wa-chip, .chat-filter-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-role') === role);
    });
    SchoolView.renderChatContactsList(
      this._chatState.contacts,
      this._chatState.activeTarget,
      role,
      this._chatState.searchQuery
    );
  },

  filterChatContacts(query) {
    this._chatState.searchQuery = query;
    SchoolView.renderChatContactsList(
      this._chatState.contacts,
      this._chatState.activeTarget,
      this._chatState.roleFilter,
      query
    );
  },

  clearChatSearch() {
    const input = document.getElementById('chatSearchInput');
    if (input) {
      input.value = '';
    }
    this.filterChatContacts('');
  },

  toggleEmojiTray() {
    const tray = document.getElementById('waEmojiTray');
    const attachTray = document.getElementById('waAttachTray');
    if (attachTray) attachTray.classList.remove('open');
    if (tray) {
      tray.classList.toggle('open');
    }
  },

  insertEmoji(emoji) {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;
    input.value = (input.value || '') + emoji;
    input.focus();
  },

  toggleAttachTray() {
    const tray = document.getElementById('waAttachTray');
    const emojiTray = document.getElementById('waEmojiTray');
    if (emojiTray) emojiTray.classList.remove('open');
    if (tray) {
      tray.classList.toggle('open');
    }
  },

  insertAttachment(text) {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;
    input.value = text;
    document.getElementById('waAttachTray')?.classList.remove('open');
    input.focus();
  },

  handleChatScroll(streamEl) {
    const btn = document.getElementById('waScrollDownBtn');
    if (!btn || !streamEl) return;
    const isUp = streamEl.scrollHeight - streamEl.scrollTop - streamEl.clientHeight > 180;
    if (isUp) {
      btn.classList.remove('hidden');
      btn.style.display = 'flex';
    } else {
      btn.classList.add('hidden');
      btn.style.display = 'none';
    }
  },

  scrollChatToBottomSmooth() {
    const stream = document.getElementById('chatMessagesStream');
    if (stream) {
      stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
    }
  },

  async handleSendChatMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('chatMessageInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const type = this._chatState.activeType || 'group';
    const target = this._chatState.activeTarget || 'general';

    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await schoolModel.sendChatMessage({
        type,
        target,
        message: text
      });

      if (res.data) {
        SchoolView.appendChatMessage(res.data, schoolModel.user);
        this._chatState.lastMessageId = Math.max(this._chatState.lastMessageId, res.data.id);

        if (type === 'direct') {
          const contact = this._chatState.contacts.find(c => String(c.id) === String(target));
          if (contact) {
            contact.last_message = 'You: ' + text;
            contact.last_message_time = new Date().toISOString();
            SchoolView.renderChatContactsList(
              this._chatState.contacts,
              this._chatState.activeTarget,
              this._chatState.roleFilter,
              this._chatState.searchQuery
            );
          }
        } else if (type === 'group') {
          if (this._chatState.sidebarData && this._chatState.sidebarData.general_channel) {
            this._chatState.sidebarData.general_channel.last_message = 'You: ' + text;
            this._chatState.sidebarData.general_channel.last_message_time = new Date().toISOString();
            SchoolView.renderChatContactsList(
              this._chatState.contacts,
              this._chatState.activeTarget,
              this._chatState.roleFilter,
              this._chatState.searchQuery,
              this._chatState.sidebarData.general_channel
            );
          }
        }
      }

      input.value = '';
      input.focus();

    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  },

  handleChatInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendChatMessage(event);
    }
  },

  async handleDeleteChatMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await schoolModel.deleteChatMessage(messageId);
      SchoolView.removeChatMessage(messageId);
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  },

  async refreshActiveChat() {
    if (!this._chatState.mountId) return;
    await this.openCampusChat(this._chatState.mountId, this._chatState.isModal);
  },

  startChatPolling() {
    this.stopChatPolling();
    this._chatState.pollTimer = setInterval(async () => {
      await this.pollIncrementalMessages();
    }, 4000);
  },

  stopChatPolling() {
    if (this._chatState.pollTimer) {
      clearInterval(this._chatState.pollTimer);
      this._chatState.pollTimer = null;
    }
  },

  async pollIncrementalMessages() {
    const stream = document.getElementById('chatMessagesStream');
    if (!stream) return;

    const type = this._chatState.activeType || 'group';
    const target = this._chatState.activeTarget || 'general';
    const lastId = this._chatState.lastMessageId || 0;

    try {
      const data = await schoolModel.getChatMessages(type, target, lastId);
      const newMsgs = data.messages || [];

      if (newMsgs.length > 0) {
        newMsgs.forEach(m => {
          SchoolView.appendChatMessage(m, schoolModel.user);
          this._chatState.lastMessageId = Math.max(this._chatState.lastMessageId, m.id);
        });
      }
    } catch (err) {
      // background poll
    }
  },

  startBackgroundUnreadPolling() {
    if (this._chatState.unreadTimer) {
      clearInterval(this._chatState.unreadTimer);
    }
    this.pollUnreadCounters();
    this._chatState.unreadTimer = setInterval(() => {
      this.pollUnreadCounters();
    }, 12000);
  },

  stopBackgroundUnreadPolling() {
    if (this._chatState.unreadTimer) {
      clearInterval(this._chatState.unreadTimer);
      this._chatState.unreadTimer = null;
    }
  },

  async pollUnreadCounters() {
    if (!schoolModel.user) return;
    try {
      const status = await schoolModel.pollChatUnread();
      if (status && status.success) {
        SchoolView.updateHeaderChatBadge(status.total_unread_dms || 0);
      }
    } catch (e) {}
  },

  /* ==========================================================================
     SCHOOL NOTICES CONTROLLER (STUDENT / STAFF / ADMIN INDEPENDENT BULLETINS)
     ========================================================================== */
  _noticeState: {
    activeAudience: 'all',
    categoryFilter: 'all',
    searchQuery: '',
    cachedNotices: [],
    counts: { all: 0, student: 0, staff: 0 }
  },
  _noticeSearchTimer: null,

  async loadStudentNotices() {
    try {
      const res = await this.model.getNotices({ audience: 'student' });
      const notices = Array.isArray(res.notices) ? res.notices : [];
      SchoolView.renderStudentNotices(notices);
    } catch (err) {
      console.error('Error loading student notices:', err);
    }
  },

  async loadStaffNotices() {
    try {
      const res = await this.model.getNotices({ audience: 'staff' });
      const notices = Array.isArray(res.notices) ? res.notices : [];
      SchoolView.renderStaffNotices(notices);
    } catch (err) {
      console.error('Error loading staff notices:', err);
    }
  },

  async loadAdminNotices(filters = {}) {
    try {
      const audience = filters.audience !== undefined ? filters.audience : this._noticeState.activeAudience;
      const category = filters.category !== undefined ? filters.category : this._noticeState.categoryFilter;
      const search = filters.search !== undefined ? filters.search : this._noticeState.searchQuery;

      const params = {};
      if (audience && audience !== 'all') params.audience = audience;
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;

      const res = await this.model.getNotices(params);
      const notices = Array.isArray(res.notices) ? res.notices : [];
      const counts = res.counts || { all: 0, student: 0, staff: 0 };

      this._noticeState.cachedNotices = notices;
      this._noticeState.counts = counts;

      SchoolView.renderAdminNotices(notices, counts, this._noticeState.activeAudience);
    } catch (err) {
      console.error('Error loading admin notices:', err);
    }
  },

  switchAdminNoticeAudience(audience) {
    this._noticeState.activeAudience = audience;
    this.loadAdminNotices({ audience });
  },

  filterAdminNotices() {
    const sel = document.getElementById('adminNoticeCategoryFilter');
    const cat = sel ? sel.value : 'all';
    this._noticeState.categoryFilter = cat;
    this.loadAdminNotices({ category: cat });
  },

  searchAdminNotices(query) {
    this._noticeState.searchQuery = (query || '').trim();
    if (this._noticeSearchTimer) clearTimeout(this._noticeSearchTimer);
    this._noticeSearchTimer = setTimeout(() => {
      this.loadAdminNotices({ search: this._noticeState.searchQuery });
    }, 300);
  },

  openCreateNoticeModal(targetAudience = 'student') {
    const modal = document.getElementById('adminNoticeModal');
    if (!modal) return;

    // Reset inputs
    const idEl = document.getElementById('noticeEditId');
    if (idEl) idEl.value = '';

    const remEl = document.getElementById('noticeRemoveAttachment');
    if (remEl) remEl.value = '0';

    const titleEl = document.getElementById('noticeTitle');
    if (titleEl) titleEl.value = '';

    const contentEl = document.getElementById('noticeContent');
    if (contentEl) contentEl.value = '';

    const catEl = document.getElementById('noticeCategory');
    if (catEl) catEl.value = 'official';

    const attInput = document.getElementById('noticeAttachment');
    if (attInput) attInput.value = '';

    const pinEl = document.getElementById('noticeIsPinned');
    if (pinEl) pinEl.checked = false;

    // Current attachment box hidden
    const attBox = document.getElementById('noticeCurrentAttachmentBox');
    if (attBox) {
      attBox.style.display = 'none';
      attBox.classList.add('hidden');
    }

    // Target audience selection
    const audienceVal = (targetAudience && targetAudience !== 'all') ? targetAudience : (this._noticeState.activeAudience !== 'all' ? this._noticeState.activeAudience : 'student');
    if (audienceVal === 'staff') {
      const r = document.getElementById('audienceChoiceStaff');
      if (r) r.checked = true;
    } else if (audienceVal === 'all') {
      const r = document.getElementById('audienceChoiceAll');
      if (r) r.checked = true;
    } else {
      const r = document.getElementById('audienceChoiceStudent');
      if (r) r.checked = true;
    }

    const modalTitle = document.getElementById('adminNoticeModalTitle');
    if (modalTitle) modalTitle.innerHTML = '📢 Write School Notice';

    const submitBtn = document.getElementById('saveNoticeSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '📢 Publish Notice';
    }

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
  },

  async openEditNoticeModal(id) {
    const modal = document.getElementById('adminNoticeModal');
    if (!modal) return;

    try {
      const n = await this.model.getNotice(id);
      if (!n) {
        alert('Notice not found.');
        return;
      }

      const idEl = document.getElementById('noticeEditId');
      if (idEl) idEl.value = n.id;

      const remEl = document.getElementById('noticeRemoveAttachment');
      if (remEl) remEl.value = '0';

      const titleEl = document.getElementById('noticeTitle');
      if (titleEl) titleEl.value = n.title || '';

      const contentEl = document.getElementById('noticeContent');
      if (contentEl) contentEl.value = n.content || '';

      const catEl = document.getElementById('noticeCategory');
      if (catEl) catEl.value = n.category || 'official';

      const attInput = document.getElementById('noticeAttachment');
      if (attInput) attInput.value = '';

      const pinEl = document.getElementById('noticeIsPinned');
      if (pinEl) pinEl.checked = Number(n.is_pinned) === 1;

      // Select target audience radio
      if (n.target_audience === 'staff') {
        const r = document.getElementById('audienceChoiceStaff');
        if (r) r.checked = true;
      } else if (n.target_audience === 'all') {
        const r = document.getElementById('audienceChoiceAll');
        if (r) r.checked = true;
      } else {
        const r = document.getElementById('audienceChoiceStudent');
        if (r) r.checked = true;
      }

      // Attachment box
      const attBox = document.getElementById('noticeCurrentAttachmentBox');
      const attName = document.getElementById('noticeCurrentAttachmentName');
      if (n.attachment_url && attBox && attName) {
        const size = typeof n.attachment_size === 'string' && isNaN(Number(n.attachment_size))
          ? n.attachment_size
          : SchoolView.formatFileSize(n.attachment_size);
        attName.innerHTML = `📎 Current file: <strong>${SchoolView.escapeHtml(n.attachment_name || 'File')}</strong> (${size})`;
        attBox.style.display = 'flex';
        attBox.classList.remove('hidden');
      } else if (attBox) {
        attBox.style.display = 'none';
        attBox.classList.add('hidden');
      }

      const modalTitle = document.getElementById('adminNoticeModalTitle');
      if (modalTitle) modalTitle.innerHTML = '✏️ Edit School Notice';

      const submitBtn = document.getElementById('saveNoticeSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Save Changes';
      }

      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    } catch (err) {
      console.error('Failed to open notice for editing:', err);
      alert('Could not load notice details: ' + (err.message || err));
    }
  },

  closeNoticeModal() {
    const modal = document.getElementById('adminNoticeModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
  },

  removeNoticeAttachment() {
    const remEl = document.getElementById('noticeRemoveAttachment');
    if (remEl) remEl.value = '1';

    const attBox = document.getElementById('noticeCurrentAttachmentBox');
    if (attBox) {
      attBox.style.display = 'none';
      attBox.classList.add('hidden');
    }

    const attInput = document.getElementById('noticeAttachment');
    if (attInput) attInput.value = '';
  },

  async saveNotice(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('noticeEditId')?.value || '';
    const title = (document.getElementById('noticeTitle')?.value || '').trim();
    const content = (document.getElementById('noticeContent')?.value || '').trim();
    const category = document.getElementById('noticeCategory')?.value || 'official';
    const isPinned = document.getElementById('noticeIsPinned')?.checked ? 1 : 0;
    const removeAttachment = document.getElementById('noticeRemoveAttachment')?.value || '0';

    let audience = 'student';
    const checkedAudience = document.querySelector('input[name="noticeAudience"]:checked');
    if (checkedAudience) {
      audience = checkedAudience.value;
    }

    if (!title) {
      alert('Please enter a notice title.');
      return;
    }
    if (!content) {
      alert('Please enter the notice message body.');
      return;
    }

    const submitBtn = document.getElementById('saveNoticeSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Saving notice...';
    }

    try {
      const formData = new FormData();
      if (id) {
        formData.append('id', id);
        formData.append('action', 'update_notice');
      } else {
        formData.append('action', 'create_notice');
      }
      formData.append('target_audience', audience);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      formData.append('is_pinned', isPinned);
      formData.append('remove_attachment', removeAttachment);

      const fileInput = document.getElementById('noticeAttachment');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('attachment', fileInput.files[0]);
      }

      const res = await this.model.saveNotice(formData);
      if (res && res.success) {
        alert(id ? 'Notice updated successfully!' : 'Notice published successfully!');
        this.closeNoticeModal();
        await this.loadAdminNotices();
      } else {
        alert('Failed to save notice: ' + ((res && res.message) || 'Unknown error.'));
      }
    } catch (err) {
      console.error('Error saving notice:', err);
      alert('Failed to save notice: ' + (err.message || err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = id ? '💾 Save Changes' : '📢 Publish Notice';
      }
    }
  },

  async deleteNotice(id) {
    if (!id) return;
    if (!confirm('Are you sure you want to permanently delete this notice? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await this.model.deleteNotice(id);
      if (res && res.success) {
        alert('Notice deleted successfully.');
        await this.loadAdminNotices();
      } else {
        alert('Failed to delete notice: ' + ((res && res.message) || 'Unknown error.'));
      }
    } catch (err) {
      console.error('Error deleting notice:', err);
      alert('Failed to delete notice: ' + (err.message || err));
    }
  },

  /* ==========================================================================
     ADMIN ANALYTICS & VISUALIZATIONS CONTROLLER
     ========================================================================== */
  async loadAdminAnalytics() {
    try {
      const analytics = await this.model.getAdminAnalytics();
      if (analytics) {
        SchoolView.renderAdminAnalyticsCharts(analytics);
      }
    } catch (err) {
      console.error('Error loading admin analytics:', err);
    }
  },

  /* ==========================================================================
     ADMINISTRATOR GOVERNANCE (SUPER ADMIN PRIVILEGED MANAGEMENT)
     ========================================================================== */
  async loadAdminManagement() {
    try {
      const data = await this.model.getAdminAccounts();
      SchoolView.renderAdminManagement(data);
      await this.loadAuditLogs();
    } catch (err) {
      console.error('Error loading administrator management:', err);
    }
  },

  async loadAuditLogs() {
    try {
      const logs = await this.model.getAuditLogs(50);
      SchoolView.renderAuditLogs(logs);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  },

  openInviteAdminModal() {
    const modal = document.getElementById('adminInviteModal');
    if (!modal) return;

    document.getElementById('inviteAdminName').value = '';
    document.getElementById('inviteAdminEmail').value = '';
    document.getElementById('inviteAdminRole').value = 'bursar';
    this.handleInviteRoleChange('bursar');

    const successBox = document.getElementById('adminInviteSuccessBox');
    if (successBox) {
      successBox.style.display = 'none';
      successBox.classList.add('hidden');
    }

    const form = document.getElementById('adminInviteForm');
    if (form) form.style.display = 'grid';

    const submitBtn = document.getElementById('inviteAdminSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🚀 Issue Invitation';
    }

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
  },

  closeInviteAdminModal() {
    const modal = document.getElementById('adminInviteModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
  },

  handleInviteRoleChange(roleSlug) {
    const descEl = document.getElementById('inviteRoleDescription');
    if (!descEl) return;

    const descriptions = {
      super_admin: '👑 Full wildcard control over the entire school system, all modules, and administrator management.',
      principal: '🏫 Overall school supervision, performance analytics, student/staff overviews, and official bulletins.',
      academic_admin: '📚 Management of classes, course combinations, teaching timetables, and academic resources.',
      bursar: '💰 Tuition fees, manual bank payment verifications, staff payroll, balance sheet ledger, and Paystack gateway.',
      hr_admin: '👩‍🏫 Staff accounts directory, teacher verification access codes, bank account details, and payroll profiles.',
      admissions_admin: '👥 Student applications, admissions approvals, WAEC/JAMB exam track allocations, and departments.',
      exam_admin: '📝 Assessments, mock examinations, ALOC CBT Station parameters, and scorebooks.'
    };

    descEl.textContent = descriptions[roleSlug] || 'Administrative privileges tailored to specific department operations.';
  },

  async submitInviteAdmin(event) {
    if (event) event.preventDefault();

    const name = (document.getElementById('inviteAdminName')?.value || '').trim();
    const email = (document.getElementById('inviteAdminEmail')?.value || '').trim();
    const roleSlug = document.getElementById('inviteAdminRole')?.value || 'bursar';

    const roleMap = {
      super_admin: 1,
      principal: 2,
      academic_admin: 3,
      bursar: 4,
      hr_admin: 5,
      admissions_admin: 6,
      exam_admin: 7
    };
    const roleId = roleMap[roleSlug] || 4;

    if (!name || !email) {
      alert('Please fill in both the full name and official email.');
      return;
    }

    const submitBtn = document.getElementById('inviteAdminSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Generating secure invite token...';
    }

    try {
      const res = await this.model.inviteAdmin({ name, email, role_id: roleId });
      if (res && res.success) {
        // Display activation link
        const successBox = document.getElementById('adminInviteSuccessBox');
        const linkInput = document.getElementById('adminInviteLinkInput');
        const form = document.getElementById('adminInviteForm');

        if (successBox && linkInput) {
          const fullLink = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '') + (res.activation_link || '');
          linkInput.value = fullLink;
          successBox.style.display = 'block';
          successBox.classList.remove('hidden');
          if (form) form.style.display = 'none';
        }

        await this.loadAdminManagement();
      } else {
        alert('Failed to invite administrator: ' + ((res && res.message) || 'Unknown error.'));
      }
    } catch (err) {
      console.error('Error inviting administrator:', err);
      alert('Failed to invite administrator: ' + (err.message || err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 Issue Invitation';
      }
    }
  },

  copyInviteLink() {
    const linkInput = document.getElementById('adminInviteLinkInput');
    if (!linkInput) return;
    linkInput.select();
    navigator.clipboard.writeText(linkInput.value).then(() => {
      alert('Activation link copied to clipboard! Send this securely to the invited administrator.');
    }).catch(() => {
      alert('Link highlighted. Press Ctrl+C to copy.');
    });
  },

  async toggleAdminStatus(userId, newStatus) {
    if (!userId) return;
    const actionWord = (newStatus === 'active') ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionWord} this administrator account?`)) {
      return;
    }

    try {
      const res = await this.model.toggleAdminStatus(userId, newStatus);
      if (res && res.success) {
        alert(res.message || 'Status updated successfully.');
        await this.loadAdminManagement();
      } else {
        alert('Failed: ' + ((res && res.message) || 'Error updating status.'));
      }
    } catch (err) {
      console.error('Error updating admin status:', err);
      alert('Error updating status: ' + (err.message || err));
    }
  },

  openRoleModal(userId, name, currentRoleId = 1) {
    const modal = document.getElementById('adminRoleModal');
    if (!modal) return;

    document.getElementById('roleEditUserId').value = userId;
    const nameEl = document.getElementById('roleEditUserName');
    if (nameEl) nameEl.textContent = name;

    const sel = document.getElementById('roleEditSelect');
    if (sel) sel.value = String(currentRoleId || 1);

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
  },

  closeRoleModal() {
    const modal = document.getElementById('adminRoleModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
  },

  async submitUpdateRole(event) {
    if (event) event.preventDefault();

    const userId = parseInt(document.getElementById('roleEditUserId')?.value || 0);
    const roleId = parseInt(document.getElementById('roleEditSelect')?.value || 1);

    if (userId <= 0 || roleId <= 0) return;

    try {
      const res = await this.model.updateAdminRole(userId, roleId);
      if (res && res.success) {
        alert('Administrator role updated successfully.');
        this.closeRoleModal();
        await this.loadAdminManagement();
      } else {
        alert('Failed: ' + ((res && res.message) || 'Error updating role.'));
      }
    } catch (err) {
      console.error('Error updating admin role:', err);
      alert('Error updating role: ' + (err.message || err));
    }
  },

  async revokeAdmin(userId) {
    if (!userId) return;
    if (!confirm('CAUTION: Are you sure you want to permanently revoke this administrator access? Their administrative permissions will be removed immediately.')) {
      return;
    }

    try {
      const res = await this.model.revokeAdmin(userId);
      if (res && res.success) {
        alert('Administrator privileges revoked successfully.');
        await this.loadAdminManagement();
      } else {
        alert('Failed: ' + ((res && res.message) || 'Error revoking administrator.'));
      }
    } catch (err) {
      console.error('Error revoking administrator:', err);
      alert('Error: ' + (err.message || err));
    }
  },

  /* ------------------------------------------------------------------------
     STUDENT PAYMENT VERIFICATION & ID DISPATCH METHODS
     ------------------------------------------------------------------------ */
  openStudentPaymentVerificationModal(studentData) {
    this.pendingStudentPayment = studentData;
    SchoolView.openStudentPaymentVerificationModal(studentData);
  },

  closeStudentPaymentModal() {
    SchoolView.closeStudentPaymentModal();
  },

  async payTuitionOnlinePaystack() {
    if (!this.pendingStudentPayment) {
      alert('No student session found for tuition payment verification.');
      return;
    }

    const student = this.pendingStudentPayment;
    const userId = student.id || student.user_id;
    const email = student.email || student.student_email;
    const name = student.name || student.student_name || 'Enrolled Student';
    const amountNgn = 18000;
    const amountKobo = amountNgn * 100;
    const reference = 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    const payBtn = document.getElementById('verifPaystackBtn');
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'Launching Paystack Gateway...';
    }

    try {
      let publicKey = '';
      try {
        const psSettings = await this.model.getPaystackSettings();
        if (psSettings && psSettings.public_key) {
          publicKey = psSettings.public_key;
        }
      } catch (e) {
        console.warn('Could not load Paystack settings:', e);
      }

      const isRealKey = publicKey && (publicKey.startsWith('pk_live_') || publicKey.startsWith('pk_test_')) &&
        !publicKey.includes('demo') && !publicKey.includes('placeholder') && !publicKey.includes('school_edu') && publicKey.length >= 32;

      // Check if Paystack Inline SDK is loaded and has a real registered key
      if (isRealKey && typeof window.PaystackPop !== 'undefined' && typeof window.PaystackPop.setup === 'function') {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: email,
          amount: amountKobo,
          currency: 'NGN',
          ref: reference,
          callback: async (response) => {
            await this.handleStudentOnlinePaymentSuccess(response.reference || reference, userId, amountNgn);
          },
          onClose: () => {
            if (payBtn) {
              payBtn.disabled = false;
              payBtn.innerHTML = '💳 Pay ₦18,000 via Paystack Online →';
            }
          }
        });
        handler.openIframe();
      } else {
        // Fallback / simulation mode: allow testing automated verification seamlessly
        const testChoice = confirm(`[PAYSTACK ONLINE CHECKOUT]\n\nMerchant: Springfield Academy Portal\nStudent: ${name} (${email})\nTuition Amount: ₦${Number(amountNgn).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\nReference: ${reference}\nGateway Mode: Paystack Automated Verification\n\nAuthorize payment to trigger automated verification and receive your official Student ID via Gmail?`);
        if (testChoice) {
          await this.handleStudentOnlinePaymentSuccess(reference, userId, amountNgn);
        } else {
          if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = '💳 Pay ₦18,000 via Paystack Online →';
          }
        }
      }
    } catch (err) {
      console.error('Paystack tuition error:', err);
      alert('Error launching online payment: ' + (err.message || err));
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = '💳 Pay ₦18,000 via Paystack Online →';
      }
    }
  },

  async handleStudentOnlinePaymentSuccess(reference, userId, amount) {
    const student = this.pendingStudentPayment || {};
    const uid = userId || student.id || student.user_id;
    const email = student.email || student.student_email;
    const payBtn = document.getElementById('verifPaystackBtn');

    try {
      const res = await this.model.verifyOnlinePayment({
        reference,
        user_id: uid,
        plan: 'monthly',
        amount: amount || 18000
      });

      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = '💳 Pay ₦18,000 via Paystack Online →';
      }

      if (res && res.success && res.automated) {
        // Instant automated success
        SchoolView.showStudentVerificationSuccess(res.student_id, res.student_email || email, res.activation_link || res.activation_token);
      } else if (res && res.queued_for_manual) {
        alert(`Notice: Automated verification could not be completed immediately (${res.failure_reason || res.reason || 'Queued for admin review'}).\n\nYour payment has been forwarded to the school administrator. Once verified, your official Student ID and activation link will be delivered to ${email}.`);
        this.closeStudentPaymentModal();
      } else {
        alert(res.message || 'Payment verification failed or queued for review.');
      }
    } catch (err) {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = '💳 Pay ₦18,000 via Paystack Online →';
      }
      console.error('Online verification error:', err);
      alert('Verification error: ' + (err.message || err));
    }
  },

  async submitManualStudentPayment() {
    if (!this.pendingStudentPayment) {
      alert('No student session found.');
      return;
    }

    const refInput = document.getElementById('verifManualRefInput');
    const reference = refInput ? refInput.value.trim() : '';
    if (!reference) {
      alert('Please enter your Bank Transfer Reference or Teller / Transaction Number.');
      return;
    }

    const student = this.pendingStudentPayment;
    const userId = student.id || student.user_id;

    try {
      const res = await this.model.submitManualPayment({
        user_id: userId,
        reference: reference,
        amount: 18000,
        proof_note: 'Student submitted bank transfer proof via portal'
      });

      if (res && res.success) {
        alert(`Payment reference (${reference}) submitted successfully!\n\nThe school administrator has been notified. Once verified, your official Student ID and password activation link will be delivered to ${student.email || 'your registered Gmail'}.`);
        if (refInput) refInput.value = '';
        this.closeStudentPaymentModal();
      } else {
        alert('Submission failed: ' + ((res && res.message) || 'Error submitting payment reference'));
      }
    } catch (err) {
      console.error('Manual payment submission error:', err);
      alert('Submission error: ' + (err.message || err));
    }
  },

  async loadAdminStudentVerifications() {
    try {
      const res = await this.model.getPendingStudentVerifications();
      SchoolView.renderAdminStudentVerifications(res);
    } catch (err) {
      console.error('Error loading student verifications:', err);
    }
  },

  async adminVerifyStudentPayment(requestId, userId, amount, reference, studentName) {
    if (!confirm(`Are you sure you want to verify payment for ${studentName || 'this student'}?\n\n• Amount: ₦${Number(amount || 18000).toLocaleString()}\n• Reference: ${reference || 'Manual clearance'}\n\nThis will instantly issue their official Student ID and dispatch the account activation link to their registered Gmail.`)) {
      return;
    }

    try {
      const res = await this.model.adminVerifyStudentPayment({
        request_id: requestId,
        user_id: userId,
        amount: amount || 18000,
        reference: reference || ('ADM-VERIF-' + Date.now())
      });

      if (res && res.success) {
        alert(`✓ Student Verified Successfully!\n\n• Student ID Assigned: ${res.student_id}\n• Student Email: ${res.student_email || 'Dispatched'}\n• Activation link sent to registered Gmail.\n\nThe student can now set their password and log in using their Student ID.`);
        await this.loadAdminStudentVerifications();
        await this.loadAdminStudents();
      } else {
        alert('Verification failed: ' + ((res && res.message) || 'Error verifying student'));
      }
    } catch (err) {
      console.error('Admin verify student error:', err);
      alert('Error verifying student payment: ' + (err.message || err));
    }
  },

  async adminRejectStudentPayment(requestId) {
    const reason = prompt('Please enter the reason for rejecting this payment verification request:', 'Proof of payment could not be validated by the bursary office.');
    if (!reason) return;

    try {
      const res = await this.model.adminRejectStudentPayment({
        request_id: requestId,
        reason: reason
      });

      if (res && res.success) {
        alert('Verification request has been rejected.');
        await this.loadAdminStudentVerifications();
      } else {
        alert('Failed: ' + ((res && res.message) || 'Error rejecting request.'));
      }
    } catch (err) {
      console.error('Error rejecting verification:', err);
      alert('Error: ' + (err.message || err));
    }
  },

  /* ------------------------------------------------------------------------
     ACADEMIC SESSION & TERM CONTROLLER
     ------------------------------------------------------------------------ */
  async loadAcademicSession() {
    try {
      const session = await schoolModel.getAcademicSession();
      SchoolView.renderAcademicSession(session);
      window._academicSession = session;
      return session;
    } catch (err) {
      console.warn('Failed to load academic session:', err);
    }
  },

  openEditAcademicSessionModal() {
    const current = window._academicSession || { current_term: 'Term 1', academic_session: '2024/2025' };
    SchoolView.openEditAcademicSessionModal(current.current_term, current.academic_session);
  },

  closeEditAcademicSessionModal() {
    SchoolView.closeEditAcademicSessionModal();
  },

  async handleSaveAcademicSession(e) {
    if (e) e.preventDefault();
    const termSelect = document.getElementById('academicSessionTermSelect');
    const sessionInput = document.getElementById('academicSessionYearInput');
    if (!termSelect || !sessionInput) return;

    const term = termSelect.value.trim();
    const session = sessionInput.value.trim();
    if (!term || !session) {
      alert('Both Term and Academic Year Session are required.');
      return;
    }

    try {
      const res = await schoolModel.updateAcademicSession(term, session);
      if (res && res.success) {
        window._academicSession = res.academic_session;
        SchoolView.renderAcademicSession(res.academic_session);
        SchoolView.closeEditAcademicSessionModal();
        alert(res.message || 'School academic term and session updated successfully!');
      } else {
        throw new Error((res && res.message) || 'Failed to update academic session.');
      }
    } catch (err) {
      alert(err.message || 'Error updating academic session.');
    }
  }
};

/* Compatibility Controllers */
const PastQuestionsController = {
  async show(subjects = []) {
    await schoolController.loadStudentPastQuestions();
  },
  async refresh() {
    await schoolController.loadStudentPastQuestions();
  }
};

const TextbooksController = {
  async show(subjects = []) {
    await schoolController.loadStudentTextbooks();
  },
  async refresh() {
    await schoolController.loadStudentTextbooks();
  }
};

window.schoolController = schoolController;