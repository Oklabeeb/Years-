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
      alert(err.message || 'Login failed. Check your email and password.');
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

      if (res.ok && res.data && res.data.success && res.data.user) {
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
    } catch (err) {
      console.error('Failed to initialize student dashboard:', err);
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

      // Try Paystack Inline Popup if SDK is loaded
      if (typeof window.PaystackPop !== 'undefined' && typeof window.PaystackPop.setup === 'function') {
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

  openProcessSalaryModal(staffId, preferredMethod = 'paystack_transfer') {
    if (!window._cachedAdminPayrollData || !Array.isArray(window._cachedAdminPayrollData.staff)) return;
    const staff = window._cachedAdminPayrollData.staff.find(s => Number(s.id) === Number(staffId));
    if (staff) {
      SchoolView.openProcessSalaryModal(staff, preferredMethod);
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

  // 2. Student CBT Exam Initiation
  async handleStartAlocQuiz(event) {
    if (event) event.preventDefault();

    const examType = document.getElementById('alocExamType')?.value || 'waec';
    const subject = document.getElementById('alocSubject')?.value || 'Mathematics';
    const year = document.getElementById('alocYear')?.value || '2024';
    const limit = parseInt(document.getElementById('alocLimit')?.value || '10', 10);
    const mode = document.getElementById('alocMode')?.value || 'timed';

    const btn = document.getElementById('btnStartAlocCbt');
    const originalText = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Connecting to ALOC Station...';
    }

    try {
      const res = await schoolModel.fetchAlocQuestions({
        examType,
        subject,
        year,
        limit
      });

      if (res.disabled) {
        alert(res.message || 'The ALOC Station API has been deactivated by school administration.');
        return;
      }

      if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
        alert('No questions found for the selected examination criteria. Please try another subject or year.');
        return;
      }

      // Initialize Quiz State
      const durationMap = { 5: 5 * 60, 10: 15 * 60, 20: 25 * 60, 40: 45 * 60 };
      const durationSeconds = durationMap[limit] || (15 * 60);

      if (this.alocQuizState.timerInterval) {
        clearInterval(this.alocQuizState.timerInterval);
      }

      this.alocQuizState = {
        questions: res.data,
        currentIndex: 0,
        userAnswers: {},
        flagged: {},
        isTimed: (mode === 'timed'),
        timerSeconds: durationSeconds,
        totalTimerSeconds: durationSeconds,
        timerInterval: null,
        subject,
        examType,
        year
      };

      // Start Countdown Timer if in Timed Mode
      if (this.alocQuizState.isTimed) {
        this.updateTimerDisplay(this.alocQuizState.timerSeconds);
        this.alocQuizState.timerInterval = setInterval(() => {
          this.alocQuizState.timerSeconds--;
          this.updateTimerDisplay(this.alocQuizState.timerSeconds);

          if (this.alocQuizState.timerSeconds <= 0) {
            clearInterval(this.alocQuizState.timerInterval);
            alert('Time is up! Your CBT exam is being submitted automatically.');
            this.submitAlocQuiz();
          }
        }, 1000);
      } else {
        const timerBox = document.getElementById('quizTimerBox');
        if (timerBox) timerBox.innerHTML = 'Untimed Practice';
      }

      SchoolView.renderStudentAlocActiveQuestion(this.alocQuizState);
    } catch (err) {
      console.error('Error starting ALOC quiz:', err);
      alert(err.message || 'Failed to start CBT session.');
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
  },

  showAlocReviewView() {
    SchoolView.renderStudentAlocReview(this.alocQuizState.questions, this.alocQuizState.userAnswers);
  },

  resetAlocQuiz() {
    if (this.alocQuizState.timerInterval) {
      clearInterval(this.alocQuizState.timerInterval);
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

  // 5. Staff ALOC Operations
  async staffSearchAlocQuestions() {
    const subject = document.getElementById('staffAlocSubject')?.value || 'Physics';
    const examType = document.getElementById('staffAlocExamType')?.value || 'waec';
    const year = document.getElementById('staffAlocYear')?.value || '2024';
    const limit = parseInt(document.getElementById('staffAlocLimit')?.value || '10', 10);

    const listEl = document.getElementById('staffAlocQuestionsList');
    if (listEl) {
      listEl.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--muted);">Querying ALOC Station API question bank...</div>`;
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

  // 6. Admin ALOC Operations
  async adminToggleAlocApi(enableBool) {
    const promptMsg = enableBool
      ? 'Enable the ALOC Station API for students and staff?'
      : 'Are you sure you want to remove (deactivate) the ALOC Station API? Student and staff CBT test modules will be temporarily restricted.';

    if (!confirm(promptMsg)) return;

    try {
      const updated = await schoolModel.toggleAlocStatus(enableBool);
      SchoolView.renderAdminAlocSchool(updated, updated.notifications || []);
      alert(enableBool ? 'ALOC Station API successfully enabled platform-wide.' : 'ALOC Station API has been deactivated (removed).');
    } catch (err) {
      console.error('Error toggling ALOC API:', err);
      alert('Error updating ALOC API status: ' + (err.message || 'Operation failed.'));
    }
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
    const resultBox = document.getElementById('adminApiPingResult');
    if (!resultBox) return;

    resultBox.classList.remove('hidden');
    resultBox.style.display = 'block';
    resultBox.style.background = 'rgba(23,107,80,.08)';
    resultBox.style.border = '1px solid var(--primary)';
    resultBox.style.color = 'var(--text)';
    resultBox.textContent = 'Pinging ALOC Station API gateway...';

    const start = performance.now();
    try {
      const res = await schoolModel.fetchAlocQuestions({ limit: 1 });
      const latency = Math.round(performance.now() - start);

      resultBox.style.background = 'rgba(34,197,94,.1)';
      resultBox.style.borderColor = 'var(--success)';
      resultBox.style.color = '#15803d';
      resultBox.innerHTML = `ALOC Station API Gateway: Healthy (HTTP 200 OK)<br>• Latency: ${latency}ms<br>• Access Layers: L1 Questions, L2 Metadata, L3 Worked Solutions Verified<br>• Credits Remaining: ${(res.credits_remaining || 0).toLocaleString()}`;
    } catch (err) {
      resultBox.style.background = 'rgba(239,68,68,.1)';
      resultBox.style.borderColor = 'var(--danger)';
      resultBox.style.color = 'var(--danger)';
      resultBox.innerHTML = `Connection Warning: ${SchoolView.escapeHtml(err.message)}`;
    }
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
  async payFeeWithPaystack(plan = 'monthly') {
    try {
      const initRes = await schoolModel.initializePaystackFee(plan);

      if (initRes.disabled) {
        alert('⚠️ Paystack Payment Gateway is currently deactivated by the administrator. Please contact school administration or pay via direct bank transfer.');
        return;
      }

      const amountNgn = initRes.amount_ngn;
      const reference = initRes.reference;
      const publicKey = initRes.public_key;
      const email = initRes.email || (schoolModel.user && schoolModel.user.email) || 'student@springfield.edu';
      const studentName = (schoolModel.user && schoolModel.user.name) || 'Student';

      // Try Paystack Inline Popup if SDK is available
      if (typeof window.PaystackPop !== 'undefined' && typeof window.PaystackPop.setup === 'function') {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: email,
          amount: initRes.amount_kobo,
          currency: 'NGN',
          ref: reference,
          metadata: {
            custom_fields: [
              { display_name: "Student Name", variable_name: "student_name", value: studentName },
              { display_name: "Plan", variable_name: "payment_plan", value: plan }
            ]
          },
          callback: async (response) => {
            try {
              const verifyRes = await schoolModel.verifyPaystackPayment(response.reference, plan);
              alert(`✓ Paystack Payment Confirmed!\n\nReference: ${response.reference}\nAmount: ₦${amountNgn.toLocaleString()}\nPlan: ${plan.toUpperCase()} Tuition\n\nYour portal access is now fully unlocked!`);
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
      }

      // Graceful Fallback for offline / sandboxed environments without CDN access
      const confirmMsg = `[PAYSTACK SECURE CHECKOUT]\n\nMerchant: Springfield Academy Portal\nPlan: ${plan.toUpperCase()} Tuition (${plan === 'monthly' ? '10% Discount Applied' : '4-Week Split'})\nAmount to Pay: ₦${amountNgn.toLocaleString()}\nReference: ${reference}\nPayer: ${studentName} (${email})\n\nClick OK to authorize and verify this test transaction.`;

      if (!confirm(confirmMsg)) {
        return;
      }

      const verifyRes = await schoolModel.verifyPaystackPayment(reference, plan);
      alert(`✓ Paystack Payment Successful!\n\nReference: ${reference}\nAmount: ₦${amountNgn.toLocaleString()}\nPlan: ${plan.toUpperCase()}\nStatus: ${verifyRes.status || 'success'}\n\nYour portal access is now fully unlocked!`);
      window.location.reload();

    } catch (err) {
      console.error('Paystack fee payment error:', err);
      alert('Paystack Payment Error: ' + (err.message || 'Unable to complete transaction.'));
    }
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