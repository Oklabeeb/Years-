/* ==========================================================================
   SCHOOL VIEW MODULE
   ========================================================================== */

const SchoolView = {
  element(id) {
    return document.getElementById(id);
  },

  notify(message) {
    alert(message);
  },

  /* ------------------------------------------------------------------------
     1. ADMIN INITIALIZATION
     ------------------------------------------------------------------------ */
  async initializeAdmin() {
    const mainHeader = this.element('mainHeader');
    if (mainHeader) {
      mainHeader.style.display = 'flex';
      mainHeader.classList.remove('hidden');
    }

    const loginScreen = this.element('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
      loginScreen.classList.add('hidden');
    }

    this.hideAllDashboards();

    const adminPanel = this.element('adminPanel') || this.element('adminDashboard');
    if (adminPanel) {
      adminPanel.style.display = 'block';
      adminPanel.classList.remove('hidden');
    }

    const headerUser = this.element('headerUser');
    const adminName = this.element('adminName');
    const name = (schoolModel.user && schoolModel.user.name) ? schoolModel.user.name : 'Administrator';
    const adminId = (schoolModel.user && schoolModel.user.formatted_id)
      ? schoolModel.user.formatted_id
      : ('ADM-' + String(schoolModel.user?.id || 1).padStart(4, '0'));
    
    if (headerUser) {
      headerUser.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-red" style="margin-left:6px; font-size:.7rem; font-family:monospace; font-weight:800;">ID: ${adminId}</span> <span class="badge badge-red" style="margin-left:4px; font-size:.7rem;">Admin</span>`;
    }
    if (adminName) {
      adminName.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-red" style="font-size:.85rem; font-family:monospace; font-weight:800; vertical-align:middle; margin-left:8px;">ID: ${adminId}</span>`;
    }

    await this.renderAdminStaffAccounts();
    await this.renderAdminStaffCodes();
    await schoolController.loadAdminStudents();
    await schoolController.loadAdminResources();
    await schoolController.loadAdminTimetable();
    await schoolController.loadAdminScoresheet();
    await schoolController.loadAdminFees();
    await schoolController.loadAdminPayrollInfo();
    await schoolController.loadAdminPaystackSettings();
    await schoolController.loadAlocSchool('admin');
  },

  /* ------------------------------------------------------------------------
     2. STAFF INITIALIZATION
     ------------------------------------------------------------------------ */
  async initializeStaff() {
    const mainHeader = this.element('mainHeader');
    if (mainHeader) {
      mainHeader.style.display = 'flex';
      mainHeader.classList.remove('hidden');
    }

    const loginScreen = this.element('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
      loginScreen.classList.add('hidden');
    }

    this.hideAllDashboards();

    const staffDashboard = this.element('staffDashboard');
    if (staffDashboard) {
      staffDashboard.style.display = 'block';
      staffDashboard.classList.remove('hidden');
    }

    const headerUser = this.element('headerUser');
    const staffName = this.element('staffName');
    const staffDept = this.element('staffDeptDisplay');
    const name = (schoolModel.user && schoolModel.user.name) ? schoolModel.user.name : 'Teacher';
    const dept = (schoolModel.user && schoolModel.user.department) ? schoolModel.user.department : 'Science';
    const staffId = (schoolModel.user && (schoolModel.user.staff_id || schoolModel.user.formatted_id))
      ? (schoolModel.user.staff_id || schoolModel.user.formatted_id)
      : ('STF-' + String(schoolModel.user?.id || 1).padStart(4, '0'));

    if (headerUser) {
      headerUser.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-blue" style="margin-left:6px; font-size:.7rem; font-family:monospace; font-weight:800;">ID: ${staffId}</span> <span class="badge badge-blue" style="margin-left:4px; font-size:.7rem;">Staff · ${this.escapeHtml(dept)}</span>`;
    }
    if (staffName) {
      staffName.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-blue" style="font-size:.85rem; font-family:monospace; font-weight:800; vertical-align:middle; margin-left:8px;">ID: ${staffId}</span>`;
    }
    if (staffDept) {
      staffDept.innerHTML = `Staff ID: <strong style="font-family:monospace;">${staffId}</strong> · ${this.escapeHtml(dept)} Department`;
    }

    const staffToday = this.element('staffToday');
    if (staffToday) {
      staffToday.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    await schoolController.loadStaffStudents();
    await schoolController.loadStaffResources();
    await schoolController.loadStaffTimetable();
    await schoolController.loadStaffSubmissions();
    await schoolController.loadStaffScoresheet();
    await schoolController.loadStaffPayrollInfo();
  },

  /* ------------------------------------------------------------------------
     3. STUDENT INITIALIZATION
     ------------------------------------------------------------------------ */
  async initializeStudent() {
    const mainHeader = this.element('mainHeader');
    if (mainHeader) {
      mainHeader.style.display = 'flex';
      mainHeader.classList.remove('hidden');
    }

    const loginScreen = this.element('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
      loginScreen.classList.add('hidden');
    }

    this.hideAllDashboards();

    const isPaid = schoolModel.user && (schoolModel.user.is_paid == 1 || schoolModel.user.is_paid === true);
    const feeLockScreen = this.element('feeLockScreen');

    if (!isPaid) {
      if (feeLockScreen) {
        feeLockScreen.style.display = 'block';
        feeLockScreen.classList.remove('hidden');
      }
      const headerUser = this.element('headerUser');
      const name = (schoolModel.user && schoolModel.user.name) ? schoolModel.user.name : 'Student';
      const prog = (schoolModel.user && schoolModel.user.program) ? schoolModel.user.program : 'WAEC';
      const dept = (schoolModel.user && schoolModel.user.department) ? schoolModel.user.department : 'Science';
      const studentId = (schoolModel.user && (schoolModel.user.student_id || schoolModel.user.formatted_id))
        ? (schoolModel.user.student_id || schoolModel.user.formatted_id)
        : ('STU-' + String(schoolModel.user?.id || 1).padStart(4, '0'));

      if (headerUser) {
        headerUser.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-gold" style="margin-left:6px; font-size:.7rem; font-family:monospace; font-weight:800;">ID: ${studentId}</span> <span class="badge badge-red" style="margin-left:4px; font-size:.7rem;">${this.escapeHtml(prog)} · Unpaid</span>`;
      }
      await schoolController.loadStudentFeeLockInfo();
      return;
    }

    if (feeLockScreen) {
      feeLockScreen.style.display = 'none';
      feeLockScreen.classList.add('hidden');
    }

    const studentDashboard = this.element('studentDashboard') || this.element('studentPanel');
    if (studentDashboard) {
      studentDashboard.style.removeProperty('display');
      studentDashboard.classList.add('school-workspace');
      studentDashboard.classList.remove('hidden');
    }

    const headerUser = this.element('headerUser');
    const studentName = this.element('studentName');
    const studentDept = this.element('studentDeptDisplay');
    const name = (schoolModel.user && schoolModel.user.name) ? schoolModel.user.name : 'Student';
    const dept = (schoolModel.user && schoolModel.user.department) ? schoolModel.user.department : 'Science';
    const prog = (schoolModel.user && schoolModel.user.program) ? schoolModel.user.program : 'WAEC';
    const studentId = (schoolModel.user && (schoolModel.user.student_id || schoolModel.user.formatted_id))
      ? (schoolModel.user.student_id || schoolModel.user.formatted_id)
      : ('STU-' + String(schoolModel.user?.id || 1).padStart(4, '0'));

    if (headerUser) {
      headerUser.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-gold" style="margin-left:6px; font-size:.7rem; font-family:monospace; font-weight:800;">ID: ${studentId}</span> <span class="badge badge-gold" style="margin-left:4px; font-size:.7rem;">${this.escapeHtml(prog)} · ${this.escapeHtml(dept)}</span>`;
    }
    if (studentName) {
      studentName.innerHTML = `${this.escapeHtml(name)} <span class="badge badge-gold" style="font-size:.85rem; font-family:monospace; font-weight:800; vertical-align:middle; margin-left:8px;">ID: ${studentId}</span>`;
    }
    if (studentDept) {
      studentDept.innerHTML = `Student ID: <strong style="font-family:monospace;">${studentId}</strong> · ${this.escapeHtml(prog)} · ${this.escapeHtml(dept)} Department`;
    }

    const todayLabel = this.element('todayLabel');
    if (todayLabel) {
      todayLabel.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Default to workspace dashboard page
    this.switchWorkspacePage('dashboard');

    // Load student data & setup resources
    await schoolController.initStudentDashboard();
  },

  /* Helper to clear visible dashboards before rendering active panel */
  hideAllDashboards() {
    ['adminPanel', 'adminDashboard', 'staffDashboard', 'studentDashboard', 'studentPanel', 'feeLockScreen'].forEach(id => {
      const el = this.element(id);
      if (el) {
        el.style.display = 'none';
        el.classList.add('hidden');
      }
    });
  },

  /* Switch between workspace tabs in student portal */
  switchWorkspacePage(pageId, triggerEl) {
    const titles = {
      dashboard: 'Dashboard',
      school: 'School (ALOC CBT Practice)',
      examinations: 'Examinations',
      timetable: 'Timetable',
      attendance: 'Attendance',
      assignments: 'Assignments',
      courses: 'My Subjects',
      pastquestions: 'Past Questions',
      textbooks: 'Textbooks'
    };
    const activeTitle = titles[pageId] || 'Dashboard';

    // Highlight active link in dropdown menu and any legacy buttons
    document.querySelectorAll('.ws-dropdown-link, .workspace-link').forEach(btn => {
      btn.classList.remove('active');
    });

    const matchingLinks = document.querySelectorAll(`[data-page="${pageId}"]`);
    matchingLinks.forEach(link => {
      link.classList.add('active');
    });

    // Update the active badge inside the Workspace dropdown button
    const badge = this.element('workspaceActiveBadge');
    if (badge) {
      badge.textContent = activeTitle;
    }

    document.querySelectorAll('.workspace-page').forEach(page => {
      page.classList.add('hidden');
    });

    const targetPage = this.element(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
    }

    const titleEl = this.element('workspaceTitle');
    if (titleEl) {
      titleEl.textContent = activeTitle;
    }

    // Scroll smoothly to top of the content area so view resets cleanly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ------------------------------------------------------------------------
     4. STAFF & ADMIN RESOURCE TABLE RENDERER
     ------------------------------------------------------------------------ */
  renderResourceTable(containerId, resources = []) {
    const tbody = this.element(containerId);
    if (!tbody) return;

    if (!Array.isArray(resources) || resources.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No resources found. Click "+ Add Resource" above to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = resources.map(res => {
      const isPastQ = res.type === 'past_question';
      const typeBadge = isPastQ
        ? '<span class="badge badge-gold">Past Question</span>'
        : '<span class="badge badge-green">Textbook</span>';

      const detailsHtml = isPastQ
        ? `<strong style="color:var(--primary); font-size:.82rem;">${res.exam || 'WAEC'}</strong> ${res.year ? `<span style="color:var(--muted); font-size:.78rem;">(${res.year})</span>` : ''}`
        : `<span style="color:var(--muted); font-size:.82rem;">${res.author ? `By ${this.escapeHtml(res.author)}` : 'Curriculum Text'}</span>`;

      const fileBtn = res.file_path
        ? `<a href="${res.file_path}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" title="Open and read document"><span>📖</span> Read / Open</a>`
        : '<span style="color:var(--muted); font-size:.75rem;">No file</span>';

      return `
        <tr>
          <td>
            <strong style="display:block; font-size:.85rem; color:var(--text);">${this.escapeHtml(res.title)}</strong>
            <small style="color:var(--muted); font-size:.72rem;">Added on ${new Date(res.created_at || Date.now()).toLocaleDateString()}</small>
          </td>
          <td>${typeBadge}</td>
          <td>${detailsHtml}</td>
          <td><span class="subject-tag">${this.escapeHtml(res.subject)}</span></td>
          <td>${fileBtn}</td>
          <td>
            <div class="resource-actions">
              <button type="button" class="btn-sm btn-sm-edit" onclick="openEditResourceModal(${res.id})" title="Edit details">✏️ Edit</button>
              <button type="button" class="btn-sm btn-sm-danger" onclick="handleDeleteResource(${res.id})" title="Delete resource">🗑️ Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     5. STUDENT DASHBOARD PAST QUESTIONS RENDERER
     ------------------------------------------------------------------------ */
  renderStudentPastQuestions(papers = []) {
    const list = this.element('pqList');
    if (!list) return;

    if (!Array.isArray(papers) || papers.length === 0) {
      list.innerHTML = '<div class="pq-empty">No past questions match your selected filters. Try choosing "All exams" or "All subjects".</div>';
      return;
    }

    list.innerHTML = papers.map(paper => {
      const examBadgeClass = paper.exam === 'JAMB' ? 'badge-green' : 'badge-gold';
      const yearBadge = paper.year ? `<span class="badge badge-blue">${paper.year}</span>` : '';
      const filePath = paper.file_path || '#';

      return `
        <div class="pq-card">
          <div>
            <div class="pq-card-meta">
              <span class="badge ${examBadgeClass}">${paper.exam || 'WAEC'}</span>
              ${yearBadge}
              <span class="subject-tag">${this.escapeHtml(paper.subject)}</span>
            </div>
            <h3>${this.escapeHtml(paper.title)}</h3>
            <p>${paper.year ? `${paper.year} Examination practice paper` : 'Official past question paper with detailed solutions.'}</p>
          </div>
          <div style="margin-top:auto; padding-top:.7rem; border-top:1px solid var(--border);">
            <a href="${filePath}" target="_blank" rel="noopener noreferrer">
              <span>📖</span> Read & Practise Paper
            </a>
          </div>
        </div>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     6. STUDENT DASHBOARD TEXTBOOKS RENDERER
     ------------------------------------------------------------------------ */
  renderStudentTextbooks(books = []) {
    const list = this.element('tbList');
    if (!list) return;

    if (!Array.isArray(books) || books.length === 0) {
      list.innerHTML = '<div class="pq-empty">No textbooks found for the selected subject. Select "All subjects" to view available titles.</div>';
      return;
    }

    list.innerHTML = books.map(book => {
      const filePath = book.file_path || '#';
      const authorText = book.author ? `By ${this.escapeHtml(book.author)}` : 'Approved Curriculum Material';

      return `
        <div class="pq-card">
          <div>
            <div class="pq-card-meta">
              <span class="badge badge-green">Textbook</span>
              <span class="subject-tag">${this.escapeHtml(book.subject)}</span>
            </div>
            <h3>${this.escapeHtml(book.title)}</h3>
            <p>${authorText}</p>
          </div>
          <div style="margin-top:auto; padding-top:.7rem; border-top:1px solid var(--border);">
            <a href="${filePath}" target="_blank" rel="noopener noreferrer">
              <span>📖</span> Read Textbook
            </a>
          </div>
        </div>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     6b. STUDENT DASHBOARD NOTIFICATIONS & ASSIGNMENTS RENDERERS
     ------------------------------------------------------------------------ */
  getSubjectCanonical(name) {
    if (!name) return '';
    const norm = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm === 'crs' || norm.includes('christianreligious')) return 'crs';
    if (norm === 'irs' || norm.includes('islamicstudies') || norm.includes('islamicreligious')) return 'irs';
    if (norm === 'math' || norm === 'maths' || norm === 'mathematics' || norm === 'generalmathematics') return 'mathematics';
    if (norm === 'furthermath' || norm === 'furthermaths' || norm === 'furthermathematics') return 'furthermathematics';
    if (norm === 'english' || norm === 'englishlanguage') return 'englishlanguage';
    if (norm === 'civic' || norm === 'civiceducation') return 'civiceducation';
    if (norm.includes('financialaccounting') || norm === 'accounting') return 'accounting';
    if (norm.includes('literature')) return 'literature';
    if (norm.includes('nigerianlanguages') || norm === 'hausa' || norm === 'igbo' || norm === 'yoruba') return 'nigerianlanguages';
    if (norm.includes('fashiondesign')) return 'fashiondesign';
    if (norm.includes('computerhardware')) return 'computerhardware';
    if (norm.includes('solarphotovoltaic')) return 'solarphotovoltaic';
    if (norm.includes('horticulture')) return 'horticulture';
    if (norm.includes('dataprocessing')) return 'dataprocessing';
    if (norm.includes('computerstudies')) return 'computerstudies';
    if (norm.includes('animalhusbandry')) return 'animalhusbandry';
    if (norm.includes('livestockfarming')) return 'livestockfarming';
    if (norm.includes('beautyandcosmetology')) return 'beautyandcosmetology';
    if (norm.includes('cateringcraft')) return 'cateringcraft';
    if (norm.includes('homemanagement')) return 'homemanagement';
    if (norm.includes('technicaldrawing')) return 'technicaldrawing';
    if (norm.includes('physicaleducation') || norm === 'pe') return 'physicaleducation';
    if (norm.includes('healtheducation')) return 'healtheducation';
    if (norm.includes('foodsandnutrition') || norm.includes('foodnutrition')) return 'foodnutrition';
    return norm;
  },

  isSubjectEnrolled(subjectName, enrolledList) {
    if (!subjectName || !Array.isArray(enrolledList) || enrolledList.length === 0) return false;
    const target = this.getSubjectCanonical(subjectName);
    return enrolledList.some(item => this.getSubjectCanonical(item) === target);
  },

  renderStudentNotifications(assignments = [], schedules = [], enrolledSubjects = [], submissions = []) {
    const container = this.element('classScheduleNotifications');
    if (!container) return;

    let filteredAssignments = assignments;
    let filteredSchedules = schedules;
    if (Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0) {
      filteredAssignments = assignments.filter(a => this.isSubjectEnrolled(a.subject, enrolledSubjects));
      filteredSchedules = schedules.filter(s => this.isSubjectEnrolled(s.subject, enrolledSubjects));
    }

    // Find class notifications sent by staff (e.g. 1-day reminders or classes with Google Meet links)
    const classNotifs = filteredSchedules.filter(s => !!(s.notification_message || s.meet_link));

    // Map student submissions
    const subMap = {};
    if (Array.isArray(submissions)) {
      submissions.forEach(s => { subMap[s.assignment_id] = s; });
    }

    // Find graded assignments with scores or remarks
    const gradedAssignments = filteredAssignments.filter(a => subMap[a.id] && (subMap[a.id].score || subMap[a.id].remarks));

    if (filteredAssignments.length === 0 && classNotifs.length === 0 && gradedAssignments.length === 0) {
      container.innerHTML = '<div class="empty-state">No assignment updates or class notifications for your enrolled subjects.</div>';
      return;
    }

    let html = '';

    // 0. Graded Assignment Feedback (Render at top when teacher has graded an assignment)
    if (gradedAssignments.length > 0) {
      html += gradedAssignments.map(a => {
        const sub = subMap[a.id];
        return `
          <div class="class-notification" style="padding:1rem .95rem; border:1.5px solid rgba(22,101,52,.35); border-radius:14px; margin-bottom:.85rem; background:rgba(22,101,52,.04);">
            <div class="class-notification-heading" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.4rem; margin-bottom:.35rem;">
              <div style="display:flex; align-items:center; gap:.45rem; flex-wrap:wrap;">
                <span class="badge badge-green" style="font-weight:800; background:#168566; color:#fff;">🎯 Assignment Graded</span>
                <span class="badge badge-gold">${this.escapeHtml(a.subject)}</span>
              </div>
              <span class="badge badge-green" style="font-weight:800; font-size:.84rem;">Score: <strong>${this.escapeHtml(sub.score || 'Graded')}</strong> ${sub.grade ? `(${this.escapeHtml(sub.grade)})` : ''}</span>
            </div>
            <strong style="font-size:.95rem; color:var(--text); display:block; margin-bottom:.25rem;">${this.escapeHtml(a.title)}</strong>
            ${sub.remarks ? `
              <div style="margin:.35rem 0 .5rem; font-size:.85rem; color:#14532d; font-style:italic; background:var(--card); padding:.65rem .85rem; border-radius:8px; border:1px solid var(--border); line-height:1.5;">
                <strong style="color:#166534; font-size:.74rem; text-transform:uppercase; font-style:normal; display:block; margin-bottom:.2rem;">Teacher Remarks & Feedback:</strong>
                “${this.escapeHtml(sub.remarks)}”
              </div>
            ` : ''}
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem; margin-top:.4rem;">
              <small style="color:var(--muted); font-size:.75rem;">Your submission has been reviewed and graded by your teacher.</small>
              <button type="button" class="btn-sm btn-sm-primary" onclick="openWorkspace('assignments', document.querySelector('.workspace-link[data-page=\\'assignments\\']'))" style="font-size:.76rem;">View Score Breakdown →</button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 1. Class 1-Day Notifications & Google Meet Live Links (Render after graded notices)
    if (classNotifs.length > 0) {
      html += classNotifs.map(s => {
        const hasMeet = !!s.meet_link;
        const msg = s.notification_message || `Class scheduled for ${s.day_of_week} at ${s.start_time}`;
        const teacher = s.teacher_name ? `Teacher: ${this.escapeHtml(s.teacher_name)}` : 'Assigned Staff';
        const dateNote = s.notification_date ? new Date(s.notification_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : (s.day_of_week || 'Upcoming');

        return `
          <div class="class-notification" style="padding:1.1rem 1rem; border:1.5px solid rgba(0,121,107,.3); border-radius:14px; margin-bottom:.85rem; background:rgba(0,121,107,.04);">
            <div class="class-notification-heading" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.4rem; margin-bottom:.45rem;">
              <div style="display:flex; align-items:center; gap:.45rem; flex-wrap:wrap;">
                <span class="badge badge-green" style="font-weight:800; background:#00796b; color:#fff;">📹 Live Class Notification</span>
                <span class="badge badge-gold">${this.escapeHtml(s.subject)}</span>
                <span style="font-size:.76rem; color:var(--muted);">${teacher}</span>
              </div>
              <span style="font-size:.78rem; color:var(--primary); font-weight:750;">Class Time: <strong>${s.start_time} - ${s.end_time}</strong> (${dateNote})</span>
            </div>
            <strong style="font-size:.96rem; color:var(--text); display:block; margin-bottom:.35rem;">
              🔔 ${this.escapeHtml(s.subject)} Class Announcement
            </strong>
            <p style="margin:.3rem 0 .75rem; color:var(--text); font-size:.86rem; line-height:1.55; background:var(--card); padding:.75rem .95rem; border-radius:10px; border:1px solid var(--border);">
              ${this.escapeHtml(msg)}
            </p>
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.6rem; margin-top:.6rem;">
              <span style="font-size:.76rem; color:var(--muted);">Platform: <strong>Google Meet</strong> · Click to join live class</span>
              ${hasMeet ? `
                <a href="${s.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn" style="padding:.5rem 1.15rem; font-size:.82rem;">
                  <span>📹</span> Join Google Meet Class
                </a>
              ` : `
                <span class="badge badge-gold">Meeting link pending from teacher</span>
              `}
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Assignment Notifications
    if (filteredAssignments.length > 0) {
      html += filteredAssignments.map(a => {
        let isPastDeadline = false;
        let dueFormatted = 'Soon';
        if (a.due_date) {
          const timePart = (a.due_time && a.due_time.trim()) ? a.due_time.trim() : '23:59';
          const [y, m, d] = a.due_date.split('-').map(Number);
          const [hh, mm] = timePart.split(':').map(Number);
          const deadlineDate = new Date(y, (m - 1), d, hh || 23, mm || 59, 59);
          isPastDeadline = new Date() > deadlineDate;
          const dateStr = deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = deadlineDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
          dueFormatted = `${dateStr} (${timeStr})`;
        }

        const hasFile = !!a.file_path;
        const hasDesc = !!(a.description && a.description.trim());

        let descPreview = '';
        if (hasDesc) {
          descPreview = a.description.length > 130 ? a.description.substring(0, 130) + '...' : a.description;
        } else if (hasFile) {
          descPreview = 'An assignment document has been attached by your teacher.';
        }

        const deadlineBadge = isPastDeadline
          ? `<span class="badge badge-red" style="font-weight:700; font-size:.74rem; background:#fee2e2; color:#b91c1c;">⛔ Deadline Expired</span>`
          : `<span style="font-size:.76rem; color:var(--muted); font-weight:600;">Deadline: <strong>${dueFormatted}</strong></span>`;

        return `
          <div class="class-notification" style="padding:.95rem .85rem; border:1px solid var(--border); border-radius:12px; margin-bottom:.65rem; background:var(--card);">
            <div class="class-notification-heading" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.4rem; margin-bottom:.35rem;">
              <div style="display:flex; align-items:center; gap:.45rem; flex-wrap:wrap;">
                <span class="badge badge-gold" style="font-weight:700;">📝 Assignment</span>
                <span class="subject-tag">${this.escapeHtml(a.subject)}</span>
                ${hasFile ? '<span class="badge badge-blue">📎 Document Attached</span>' : ''}
              </div>
              ${deadlineBadge}
            </div>
            <strong style="font-size:.92rem; color:var(--text); display:block; margin-bottom:.25rem;">${this.escapeHtml(a.title)}</strong>
            ${descPreview ? `<p style="margin:.25rem 0 .55rem; color:var(--muted); font-size:.82rem; line-height:1.5;">${this.escapeHtml(descPreview)}</p>` : ''}
            <div style="display:flex; align-items:center; gap:.5rem; margin-top:.5rem; flex-wrap:wrap;">
              ${hasFile ? `<a href="${a.file_path}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="font-size:.75rem;"><span>📎</span> Open Attached File</a>` : ''}
              <button type="button" class="btn-sm btn-sm-edit" onclick="openWorkspace('assignments', document.querySelector('.workspace-link[data-page=\\'assignments\\']'))" style="font-size:.75rem;">View Assignment Details →</button>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = html;
  },

  renderStudentAssignments(assignments = [], submissions = [], enrolledSubjects = []) {
    const container = this.element('assignmentList');
    if (!container) return;

    let filteredAssignments = assignments;
    if (Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0) {
      filteredAssignments = assignments.filter(a => this.isSubjectEnrolled(a.subject, enrolledSubjects));
    }

    if (!Array.isArray(filteredAssignments) || filteredAssignments.length === 0) {
      container.innerHTML = '<div class="empty-state">No assignments currently assigned for your enrolled subjects. Check back later or contact your class teacher.</div>';
      return;
    }

    const subMap = {};
    if (Array.isArray(submissions)) {
      submissions.forEach(s => {
        subMap[s.assignment_id] = s;
      });
    }

    container.innerHTML = filteredAssignments.map(a => {
      const isSubmitted = !!subMap[a.id];
      const subInfo = subMap[a.id];
      const teacher = a.teacher_name ? `Teacher: ${this.escapeHtml(a.teacher_name)}` : 'Assigned by Staff';
      const hasFile = !!a.file_path;
      const hasDesc = !!(a.description && a.description.trim());

      // Calculate deadline & expiration status
      let isPastDeadline = false;
      let deadlineFormatted = 'No deadline';
      if (a.due_date) {
        const timePart = (a.due_time && a.due_time.trim()) ? a.due_time.trim() : '23:59';
        const [y, m, d] = a.due_date.split('-').map(Number);
        const [hh, mm] = timePart.split(':').map(Number);
        const deadlineDate = new Date(y, (m - 1), d, hh || 23, mm || 59, 59);
        isPastDeadline = new Date() > deadlineDate;

        const dateStr = deadlineDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = deadlineDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
        deadlineFormatted = `${dateStr} at ${timeStr}`;
      }

      let statusBadge = '';
      if (isSubmitted) {
        statusBadge = `<span class="badge ${subInfo?.score ? 'badge-green' : 'badge-gold'}">${subInfo?.score ? `✓ Score: ${this.escapeHtml(subInfo.score)}` : '✓ Coursework Submitted'}</span>`;
      } else if (isPastDeadline) {
        statusBadge = `<span class="badge badge-red" style="font-weight:800; background:#fee2e2; color:#b91c1c;">⛔ Deadline Expired</span>`;
      } else {
        statusBadge = `<span class="badge badge-blue">⏳ Due: ${deadlineFormatted}</span>`;
      }

      return `
        <div class="assignment-card" style="display:block; padding:1.25rem; border:1px solid var(--border); border-radius:14px; background:var(--card); margin-bottom:1rem; box-shadow:0 4px 14px rgba(0,0,0,.02);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.5rem; margin-bottom:.65rem;">
            <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
              <span class="badge badge-gold" style="font-weight:700;">${this.escapeHtml(a.subject)}</span>
              <span style="font-size:.78rem; color:var(--muted);">${teacher}</span>
            </div>
            <div style="display:flex; align-items:center; gap:.5rem;">
              ${statusBadge}
            </div>
          </div>

          <h3 style="font-size:1.15rem; color:var(--text); margin:0 0 .5rem; letter-spacing:-.02em;">${this.escapeHtml(a.title)}</h3>

          <!-- Assignment Description / Instructions (If provided) -->
          ${hasDesc ? `
            <div style="margin:.75rem 0; padding:.85rem 1rem; background:var(--bg); border:1px solid var(--border); border-radius:10px;">
              <div style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem; color:var(--primary); font-size:.8rem; font-weight:750; text-transform:uppercase; letter-spacing:.04em;">
                <span>📝</span> Descriptive Instructions
              </div>
              <p style="margin:0; font-size:.87rem; line-height:1.6; color:var(--text); white-space:pre-wrap;">${this.escapeHtml(a.description)}</p>
            </div>
          ` : ''}

          <!-- Assignment File Attachment (If uploaded by teacher) -->
          ${hasFile ? `
            <div style="margin:.75rem 0; padding:.8rem 1rem; background:rgba(23,107,80,.05); border:1px solid rgba(23,107,80,.2); border-radius:10px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.6rem;">
              <div style="display:flex; align-items:center; gap:.6rem;">
                <span style="font-size:1.4rem;">📎</span>
                <div>
                  <strong style="font-size:.85rem; color:var(--text); display:block;">Attached Assignment Worksheet / File</strong>
                  <small style="color:var(--muted); font-size:.75rem; font-family:monospace;">${this.escapeHtml(a.file_path.split('/').pop())}</small>
                </div>
              </div>
              <a href="${a.file_path}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="padding:.5rem 1rem; text-decoration:none;">
                <span>📖</span> Open & Read File
              </a>
            </div>
          ` : ''}

          <!-- Student Coursework Submission Section -->
          <div style="margin-top:1.1rem; padding-top:1rem; border-top:1px solid var(--border);">
            ${isSubmitted ? `
              <div style="padding:.95rem 1.15rem; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; color:#065f46;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.4rem; margin-bottom:.45rem;">
                  <strong style="font-size:.88rem; color:#065f46; display:flex; align-items:center; gap:.35rem;">
                    <span>✓</span> Coursework Submitted Successfully
                  </strong>
                  <span style="font-size:.76rem; color:#047857; font-weight:600;">
                    ${subInfo.submitted_at ? new Date(subInfo.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                  </span>
                </div>

                <!-- Teacher Grading, Score & Remarks Display -->
                ${subInfo.score ? `
                  <div style="margin:.6rem 0 .75rem; padding:.85rem 1rem; background:rgba(23,107,80,.08); border:1.5px solid rgba(23,107,80,.28); border-radius:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.4rem; margin-bottom:.35rem;">
                      <span style="font-weight:800; font-size:.92rem; color:var(--primary); display:flex; align-items:center; gap:.4rem;">
                        <span>🎯</span> Awarded Score: <span style="font-size:1.12rem; color:#065f46; font-weight:800;">${this.escapeHtml(subInfo.score)}</span>
                      </span>
                      ${subInfo.grade ? `<span class="badge badge-green" style="font-weight:800; font-size:.82rem;">Grade: ${this.escapeHtml(subInfo.grade)}</span>` : ''}
                    </div>
                    ${subInfo.remarks ? `
                      <div style="margin-top:.45rem; font-size:.85rem; color:var(--text); line-height:1.5;">
                        <strong style="color:#166534; font-size:.74rem; text-transform:uppercase; display:block; margin-bottom:.2rem;">Teacher Remarks & Feedback:</strong>
                        <div style="font-style:italic; background:var(--card); padding:.6rem .85rem; border-radius:8px; border:1px solid var(--border); color:#14532d;">
                          “${this.escapeHtml(subInfo.remarks)}”
                        </div>
                      </div>
                    ` : ''}
                    ${subInfo.graded_at ? `<small style="display:block; margin-top:.4rem; font-size:.73rem; color:var(--muted);">Evaluated on ${new Date(subInfo.graded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>` : ''}
                  </div>
                ` : `
                  <div style="margin:.45rem 0 .6rem; padding:.45rem .8rem; background:rgba(217,119,6,.08); border:1px dashed rgba(217,119,6,.4); border-radius:8px; display:inline-flex; align-items:center; gap:.4rem; font-size:.8rem; color:#92400e; font-weight:600;">
                    <span>⏳</span> Awaiting Teacher Review & Scoring
                  </div>
                `}

                ${subInfo.content ? `
                  <div style="margin:.4rem 0 .6rem; padding:.65rem .85rem; background:#ffffff; border:1px solid #d1fae5; border-radius:8px;">
                    <small style="display:block; color:#065f46; font-weight:750; margin-bottom:.2rem; text-transform:uppercase; font-size:.72rem;">Your Typed Answer / Solution:</small>
                    <p style="margin:0; color:#064e3b; white-space:pre-wrap; font-size:.84rem; line-height:1.5;">${this.escapeHtml(subInfo.content)}</p>
                  </div>
                ` : ''}
                ${subInfo.file_path ? `
                  <div style="margin-top:.4rem; display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
                    <a href="${subInfo.file_path}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="background:#059669; font-size:.78rem; text-decoration:none;">
                      <span>📎</span> View / Download Submitted Document (${this.escapeHtml(subInfo.file_path.split('/').pop())})
                    </a>
                  </div>
                ` : ''}
              </div>
            ` : (isPastDeadline ? `
              <div style="padding:1.15rem 1.25rem; background:#fef2f2; border:1.5px solid #fecaca; border-radius:12px; color:#991b1b;">
                <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:.35rem;">
                  <span style="font-size:1.35rem;">⛔</span>
                  <strong style="font-size:.95rem; color:#991b1b;">Submission Closed: Deadline Expired</strong>
                </div>
                <p style="margin:0; font-size:.85rem; line-height:1.55; color:#7f1d1d;">
                  The deadline for this coursework submission was <strong>${deadlineFormatted}</strong>. The submission portal is now closed and can no longer accept submissions for this assignment.
                </p>
              </div>
            ` : `
              <form onsubmit="handleStudentSubmitAssignment(event, ${a.id})" style="display:grid; gap:.75rem;">
                <div style="display:grid; gap:.3rem;">
                  <label for="assignSubmitText_${a.id}" style="font-size:.82rem; font-weight:700; color:var(--text); display:flex; justify-content:space-between; align-items:center;">
                    <span>Option 1: Type Your Coursework Answer</span>
                    <small style="color:var(--muted); font-weight:normal;">(Type, upload file, or both)</small>
                  </label>
                  <textarea id="assignSubmitText_${a.id}" style="width:100%; min-height:85px; padding:.7rem; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text); font-family:inherit; font-size:.84rem;" placeholder="Type your answer, solution, calculations, or notes to your teacher here..."></textarea>
                </div>

                <div style="display:grid; gap:.3rem;">
                  <label for="assignSubmitFile_${a.id}" style="font-size:.82rem; font-weight:700; color:var(--text); display:flex; justify-content:space-between; align-items:center;">
                    <span>Option 2: Attach / Upload Coursework File</span>
                    <small style="color:var(--muted); font-weight:normal;">(PDF, Word, Image, Scan, etc.)</small>
                  </label>
                  <input type="file" id="assignSubmitFile_${a.id}" accept=".pdf,.doc,.docx,.txt,.epub,.html,.png,.jpg,.jpeg,.ppt,.pptx,.xlsx,.zip,.csv" style="padding:.5rem; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text); font-size:.82rem;">
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.5rem; margin-top:.2rem;">
                  <small style="color:var(--muted); font-size:.76rem;">💡 You can submit your coursework by typing, uploading a document file, or doing both before the deadline (<strong>${deadlineFormatted}</strong>).</small>
                  <button type="submit" id="submitAssignBtn_${a.id}" class="btn-sm btn-sm-primary" style="padding:.55rem 1.25rem; font-size:.84rem; font-weight:750;">Submit Coursework</button>
                </div>
              </form>
            `)}
          </div>
        </div>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     6c. STUDENT EXAMINATIONS RENDERER (ONLY ENROLLED SUBJECTS)
     ------------------------------------------------------------------------ */
  renderStudentExaminations(enrolledSubjects = [], program = 'WAEC') {
    const examTable = this.element('examinationRows');
    const dashExams = this.element('dashboardExams');
    const examCountEl = this.element('upcomingExamCount');

    if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) {
      if (examTable) examTable.innerHTML = '<tr><td colspan="6" class="empty-state">No examination papers scheduled for your subjects.</td></tr>';
      if (dashExams) dashExams.innerHTML = '<div class="empty-state">No examinations scheduled.</div>';
      if (examCountEl) examCountEl.textContent = '0';
      return;
    }

    const venues = ['Main Exam Hall 1', 'Main Exam Hall 2', 'Science Wing Lab A', 'ICT Centre Alpha', 'Lecture Theatre 3'];
    const times = ['09:00 AM - 11:30 AM', '12:00 PM - 02:00 PM', '02:30 PM - 04:30 PM'];

    // Generate examination paper for each enrolled subject
    const examPapers = enrolledSubjects.map((subject, idx) => {
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 10 + Math.floor(idx * 2));
      const dateStr = examDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = times[idx % times.length];
      const venueStr = venues[idx % venues.length];
      const examTitle = `${program} Senior Examination`;

      return {
        subject,
        title: examTitle,
        date: dateStr,
        time: timeStr,
        venue: venueStr,
        status: 'Scheduled'
      };
    });

    if (examCountEl) {
      examCountEl.textContent = examPapers.length;
    }

    // Populate dashboard upcoming examinations widget (first 4)
    if (dashExams) {
      dashExams.innerHTML = examPapers.slice(0, 4).map(p => `
        <div class="simple-row">
          <div>
            <strong style="color:var(--text); font-size:.85rem;">${this.escapeHtml(p.subject)}</strong>
            <small style="color:var(--muted);">${p.date} · ${p.time} · ${this.escapeHtml(p.venue)}</small>
          </div>
          <span class="badge badge-gold">${this.escapeHtml(program)}</span>
        </div>
      `).join('');
    }

    // Populate full examination timetable on Examinations page
    if (examTable) {
      examTable.innerHTML = examPapers.map(p => `
        <tr>
          <td><strong style="color:var(--text);">${this.escapeHtml(p.title)}</strong></td>
          <td><span class="badge badge-gold" style="font-weight:700;">${this.escapeHtml(p.subject)}</span></td>
          <td>${p.date}</td>
          <td>${p.time}</td>
          <td>${this.escapeHtml(p.venue)}</td>
          <td><span class="badge badge-green">Scheduled</span></td>
        </tr>
      `).join('');
    }
  },

  /* ------------------------------------------------------------------------
     6d. STUDENT TIMETABLE RENDERER (ONLY ENROLLED SUBJECTS + GOOGLE MEET)
     ------------------------------------------------------------------------ */
  renderStudentTimetable(enrolledSubjects = [], schedules = []) {
    const dayPicker = this.element('dayPicker');
    const selectedDayLabel = this.element('selectedDayLabel');
    const timetableContainer = this.element('timetableDay');
    const timetableWeekContainer = this.element('timetableWeek');
    const todayScheduleContainer = this.element('todaySchedule');
    const liveClassBanner = this.element('studentLiveClassBanner');
    const liveClassAlert = this.element('studentLiveClassAlert');

    if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) {
      if (timetableContainer) timetableContainer.innerHTML = '<div class="empty-state">No enrolled subjects found.</div>';
      if (todayScheduleContainer) todayScheduleContainer.innerHTML = '<div class="empty-state">No classes scheduled for today.</div>';
      if (liveClassBanner) liveClassBanner.innerHTML = '';
      if (liveClassAlert) liveClassAlert.innerHTML = '';
      return;
    }

    // Strict subject filtering: Only schedules for subjects this student offers
    const enrolledSchedules = Array.isArray(schedules)
      ? schedules.filter(s => this.isSubjectEnrolled(s.subject, enrolledSubjects))
      : [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Group real schedules by day
    const timetableByDay = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
    };

    enrolledSchedules.forEach(s => {
      const d = s.day_of_week || 'Monday';
      if (timetableByDay[d]) {
        timetableByDay[d].push(s);
      } else {
        timetableByDay[d] = [s];
      }
    });

    // 1. Render Top Live Class Alert Banner (For upcoming/active Google Meet classes with links)
    const upcomingMeetClass = enrolledSchedules.find(s => !!s.meet_link && (s.notification_message || s.day_of_week));
    if (upcomingMeetClass) {
      const meetHtml = `
        <div class="live-class-banner">
          <div>
            <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:.35rem; flex-wrap:wrap;">
              <span class="live-dot"></span>
              <span class="badge badge-green" style="background:#00796b; color:#fff; font-weight:800; font-size:.72rem;">ONLINE CLASS (GOOGLE MEET)</span>
              <span class="badge badge-gold">${this.escapeHtml(upcomingMeetClass.day_of_week)} · ${this.escapeHtml(upcomingMeetClass.start_time)} - ${this.escapeHtml(upcomingMeetClass.end_time)}</span>
            </div>
            <h3 style="margin:0 0 .3rem; font-size:1.18rem; color:var(--text); letter-spacing:-.02em;">
              ${this.escapeHtml(upcomingMeetClass.subject)}
            </h3>
            <p style="margin:0; font-size:.85rem; color:var(--muted); line-height:1.5;">
              ${upcomingMeetClass.notification_message ? `<strong>Teacher Notice:</strong> "${this.escapeHtml(upcomingMeetClass.notification_message)}"` : `Classroom session with ${this.escapeHtml(upcomingMeetClass.teacher_name || 'Staff')}`}
            </p>
          </div>
          <a href="${upcomingMeetClass.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn">
            <span>📹</span> Join Live Class (Google Meet)
          </a>
        </div>
      `;
      if (liveClassBanner) liveClassBanner.innerHTML = meetHtml;
      if (liveClassAlert) liveClassAlert.innerHTML = meetHtml;
    } else {
      if (liveClassBanner) liveClassBanner.innerHTML = '';
      if (liveClassAlert) liveClassAlert.innerHTML = '';
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[new Date().getDay()];
    let activeDay = days.includes(currentDayName) ? currentDayName : 'Monday';

    // Day View renderer
    const renderActiveDaySchedule = (dayToRender) => {
      activeDay = dayToRender;
      if (selectedDayLabel) selectedDayLabel.textContent = `${dayToRender} Schedule`;
      if (!timetableContainer) return;

      const dayRows = timetableByDay[dayToRender] || [];
      if (dayRows.length === 0) {
        timetableContainer.innerHTML = `<div class="empty-state">No classes scheduled for ${dayToRender} for your enrolled subjects.</div>`;
        return;
      }

      timetableContainer.innerHTML = dayRows.map(slot => {
        const hasMeet = !!slot.meet_link;
        const teacher = slot.teacher_name ? `👨‍🏫 ${this.escapeHtml(slot.teacher_name)}` : 'Assigned Staff';
        const venue = hasMeet
          ? `<span style="color:#00796b; font-weight:700;">📹 Google Meet Online Class</span>`
          : `<span style="color:var(--muted);">🏛️ ${this.escapeHtml(slot.room || 'Classroom')}</span>`;

        return `
          <div class="timetable-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:.6rem;">
              <div style="display:grid; gap:.25rem;">
                <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
                  <span class="schedule-time" style="font-size:.82rem; font-weight:800; color:var(--primary);">${this.escapeHtml(slot.start_time)} - ${this.escapeHtml(slot.end_time)}</span>
                  <span class="badge badge-gold" style="font-weight:750;">${this.escapeHtml(slot.subject)}</span>
                  <span style="font-size:.76rem; color:var(--muted);">${teacher}</span>
                </div>
                <div style="font-size:.8rem; margin-top:.2rem;">${venue}</div>
                ${slot.notification_message ? `
                  <div style="margin-top:.4rem; padding:.4rem .65rem; border-radius:8px; background:rgba(244,162,97,.12); border:1px solid rgba(244,162,97,.3); font-size:.78rem; color:var(--text);">
                    <strong>🔔 1-Day Reminder:</strong> ${this.escapeHtml(slot.notification_message)}
                  </div>
                ` : ''}
              </div>

              ${hasMeet ? `
                <a href="${slot.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn-sm" style="align-self:center;">
                  <span>📹</span> Join Google Meet Class
                </a>
              ` : `
                <span class="badge badge-blue" style="align-self:center;">In-Person Session</span>
              `}
            </div>
          </div>
        `;
      }).join('');
    };

    // Full Week Grid View renderer
    const renderWeekGrid = () => {
      if (!timetableWeekContainer) return;
      timetableWeekContainer.innerHTML = days.map(d => {
        const slots = timetableByDay[d] || [];
        const slotsHtml = slots.length > 0 ? slots.map(slot => {
          const hasMeet = !!slot.meet_link;
          return `
            <div style="padding:.7rem .8rem; border:1px solid var(--border); border-radius:10px; background:var(--card); margin-bottom:.55rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:.3rem; margin-bottom:.25rem;">
                <span style="font-size:.75rem; font-weight:800; color:var(--primary);">${this.escapeHtml(slot.start_time)}</span>
                <span class="badge badge-gold" style="font-size:.68rem;">${this.escapeHtml(slot.subject)}</span>
              </div>
              <small style="color:var(--muted); font-size:.72rem; display:block;">${slot.teacher_name ? this.escapeHtml(slot.teacher_name) : 'Staff'}</small>
              ${hasMeet ? `
                <div style="margin-top:.4rem;">
                  <a href="${slot.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn-sm" style="font-size:.7rem; padding:.25rem .55rem; width:100%; justify-content:center;">
                    <span>📹</span> Join Meet
                  </a>
                </div>
              ` : `
                <small style="color:var(--muted); font-size:.7rem; display:block; margin-top:.3rem;">🏛️ ${this.escapeHtml(slot.room || 'Classroom')}</small>
              `}
            </div>
          `;
        }).join('') : `<div style="color:var(--muted); font-size:.76rem; text-align:center; padding:1rem 0;">No classes</div>`;

        return `
          <div class="timetable-day-col">
            <div class="timetable-day-col-header">
              <span>${d}</span>
              <span class="badge badge-blue" style="font-size:.68rem;">${slots.length} Classes</span>
            </div>
            ${slotsHtml}
          </div>
        `;
      }).join('');
    };

    if (dayPicker) {
      dayPicker.innerHTML = days.map(d => {
        const count = (timetableByDay[d] || []).length;
        return `
          <button type="button" class="day-button ${d === activeDay ? 'active' : ''}" data-day="${d}">
            ${d.substring(0, 3)} <small style="opacity:.85; font-size:.7rem;">(${count})</small>
          </button>
        `;
      }).join('');

      dayPicker.querySelectorAll('.day-button').forEach(btn => {
        btn.addEventListener('click', () => {
          dayPicker.querySelectorAll('.day-button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const chosenDay = btn.getAttribute('data-day');
          renderActiveDaySchedule(chosenDay);
        });
      });
    }

    renderActiveDaySchedule(activeDay);
    renderWeekGrid();

    // Populate dashboard today's schedule widget with Google Meet link
    if (todayScheduleContainer) {
      const todaySlots = timetableByDay[activeDay] || [];
      if (todaySlots.length === 0) {
        todayScheduleContainer.innerHTML = '<div class="empty-state">No classes scheduled for today.</div>';
      } else {
        todayScheduleContainer.innerHTML = todaySlots.map(s => {
          const hasMeet = !!s.meet_link;
          return `
            <div class="schedule-row">
              <span class="schedule-time">${this.escapeHtml(s.start_time)}</span>
              <div>
                <span class="schedule-subject">${this.escapeHtml(s.subject)}</span>
                <div class="schedule-room">${s.teacher_name ? this.escapeHtml(s.teacher_name) + ' · ' : ''}${hasMeet ? 'Online Google Meet' : this.escapeHtml(s.room || 'Classroom')}</div>
              </div>
              ${hasMeet ? `
                <a href="${s.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn-sm" title="Join Google Meet">
                  <span>📹</span> Join
                </a>
              ` : `
                <span class="subject-tag">Enrolled</span>
              `}
            </div>
          `;
        }).join('');
      }
    }
  },

  /* ------------------------------------------------------------------------
     6e. STAFF TIMETABLE & GOOGLE MEET LIVE CLASSES RENDERER
     ------------------------------------------------------------------------ */
  renderStaffTimetable(schedules = []) {
    const tbody = this.element('staffTimetableRows');
    const badge = this.element('staffTimetableCountBadge');
    if (badge) badge.textContent = `${schedules.length} Scheduled Class${schedules.length === 1 ? '' : 'es'}`;
    if (!tbody) return;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No classes currently scheduled for your subjects. Contact the school administrator to schedule your timetable.</td></tr>';
      return;
    }

    tbody.innerHTML = schedules.map(s => {
      const hasMeet = !!s.meet_link;
      const reminderSent = !!s.notification_sent_at;
      const remindText = reminderSent
        ? `<span class="badge badge-green" title="${this.escapeHtml(s.notification_message || '')}">✓ Sent (${s.notification_date || 'Upcoming'})</span>`
        : `<span class="badge badge-gold">Not sent yet</span>`;

      return `
        <tr>
          <td><strong style="color:var(--text);">${this.escapeHtml(s.day_of_week)}</strong></td>
          <td><span style="font-family:monospace; font-weight:700; color:var(--primary);">${this.escapeHtml(s.start_time)} - ${this.escapeHtml(s.end_time)}</span></td>
          <td>
            <strong style="font-size:.88rem; color:var(--text); display:block;">${this.escapeHtml(s.subject)}</strong>
            <small style="color:var(--muted);">${this.escapeHtml(s.department || 'Science')} · ${this.escapeHtml(s.program || 'WAEC')}</small>
          </td>
          <td><span style="font-size:.82rem; color:var(--text);">${this.escapeHtml(s.room || 'Online')}</span></td>
          <td style="max-width:220px;">
            ${hasMeet ? `
              <div style="display:flex; align-items:center; gap:.4rem;">
                <a href="${s.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn-sm" style="font-size:.72rem; padding:.25rem .6rem;">
                  <span>📹</span> Test Link
                </a>
                <button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openStaffClassNotificationModal(${s.id})" title="Change Meet Link">Change</button>
              </div>
              <small style="color:var(--muted); font-size:.72rem; font-family:monospace; display:block; margin-top:.2rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escapeHtml(s.meet_link)}</small>
            ` : `
              <button type="button" class="btn-sm btn-sm-primary" onclick="schoolController.openStaffClassNotificationModal(${s.id})">+ Add Google Meet Link</button>
            `}
          </td>
          <td>${remindText}</td>
          <td>
            <button type="button" class="google-meet-btn-sm" onclick="schoolController.openStaffClassNotificationModal(${s.id})" style="font-size:.75rem;">
              <span>📢</span> Send 1-Day Reminder
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     6f. ADMIN TIMETABLE MANAGEMENT RENDERER
     ------------------------------------------------------------------------ */
  renderAdminTimetable(schedules = []) {
    const tbody = this.element('adminTimetableRows');
    const badge = this.element('adminTimetableBadge');
    if (badge) badge.textContent = `${schedules.length} Class${schedules.length === 1 ? '' : 'es'}`;
    if (!tbody) return;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No timetable entries found. Click "+ Add Class Schedule" to create a timetable period.</td></tr>';
      return;
    }

    tbody.innerHTML = schedules.map(s => {
      const hasMeet = !!s.meet_link;
      const teacher = s.teacher_name ? this.escapeHtml(s.teacher_name) : '<span style="color:var(--muted);">Unassigned</span>';

      return `
        <tr>
          <td><strong style="color:var(--text);">${this.escapeHtml(s.day_of_week)}</strong></td>
          <td><span style="font-family:monospace; font-weight:700; color:var(--primary); font-size:.84rem;">${this.escapeHtml(s.start_time)} - ${this.escapeHtml(s.end_time)}</span></td>
          <td><span class="badge badge-gold" style="font-weight:750;">${this.escapeHtml(s.subject)}</span></td>
          <td><span style="font-size:.82rem; font-weight:600;">${this.escapeHtml(s.department || 'Science')} · ${this.escapeHtml(s.program || 'WAEC')}</span></td>
          <td><span style="font-size:.84rem; font-weight:650; color:var(--text);">${teacher}</span></td>
          <td style="max-width:240px;">
            ${hasMeet ? `
              <div style="display:flex; align-items:center; gap:.4rem;">
                <a href="${s.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn-sm" style="font-size:.72rem; padding:.2rem .55rem;">
                  <span>📹</span> Meet Link
                </a>
              </div>
              <small style="color:var(--muted); font-size:.72rem; font-family:monospace; display:block; margin-top:.2rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escapeHtml(s.meet_link)}</small>
            ` : `
              <span style="color:var(--muted); font-size:.8rem;">🏛️ ${this.escapeHtml(s.room || 'Classroom')}</span>
            `}
          </td>
          <td>
            <div style="display:flex; gap:.35rem; align-items:center;">
              <button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openEditTimetableModal(${s.id})" title="Edit class schedule">✏️ Edit</button>
              <button type="button" class="btn-sm btn-sm-danger" onclick="schoolController.deleteTimetableSchedule(${s.id})" title="Delete class schedule">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     6g. TIMETABLE & NOTIFICATION MODAL CONTROLS
     ------------------------------------------------------------------------ */
  async openTimetableModal(schedule = null) {
    const modal = this.element('timetableModal');
    const heading = this.element('timetableModalHeading');
    const desc = this.element('timetableModalDesc');
    const form = this.element('timetableForm');
    const saveBtn = this.element('saveTimetableBtn');
    const teacherSelect = this.element('scheduleTeacher');
    const subjectSelect = this.element('scheduleSubject');

    if (!modal) return;
    if (form) form.reset();

    // Populate subjects from master curriculum list
    if (subjectSelect && window.ALL_CURRICULUM_SUBJECTS) {
      subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>' +
        window.ALL_CURRICULUM_SUBJECTS.map(sub => `<option value="${this.escapeHtml(sub)}">${this.escapeHtml(sub)}</option>`).join('');
    }

    // Populate teachers from registered staff accounts
    if (teacherSelect) {
      try {
        const staffList = await schoolModel.staffAccounts();
        teacherSelect.innerHTML = '<option value="">-- Select Staff Member --</option>' +
          staffList.map(st => `<option value="${st.id}">${this.escapeHtml(st.name)} (${this.escapeHtml(st.assigned_subject || 'Staff')})</option>`).join('');
      } catch (e) {
        console.error('Error loading staff dropdown:', e);
      }
    }

    if (schedule && schedule.id) {
      if (heading) heading.textContent = 'Edit Timetable Class';
      if (desc) desc.textContent = 'Modify class day, time, teacher, or Google Meet link.';
      if (saveBtn) saveBtn.textContent = 'Update Class Schedule';

      this.element('scheduleEditId').value = schedule.id;
      this.element('scheduleDay').value = schedule.day_of_week || 'Monday';
      this.element('scheduleDept').value = schedule.department || 'Science';
      this.element('scheduleProgram').value = schedule.program || 'WAEC';
      this.element('scheduleSubject').value = schedule.subject || '';
      this.element('scheduleStartTime').value = schedule.start_time || '09:00 AM';
      this.element('scheduleEndTime').value = schedule.end_time || '10:15 AM';
      this.element('scheduleRoom').value = schedule.room || 'Online Class (Google Meet)';
      this.element('scheduleMeetLink').value = schedule.meet_link || '';
      if (teacherSelect && schedule.teacher_id) {
        teacherSelect.value = schedule.teacher_id;
      }
    } else {
      if (heading) heading.textContent = 'Add Timetable Class';
      if (desc) desc.textContent = 'Schedule a new class period with day, time, teacher, and Google Meet link.';
      if (saveBtn) saveBtn.textContent = 'Save Class Schedule';

      this.element('scheduleEditId').value = '';
      this.element('scheduleStartTime').value = '09:00 AM';
      this.element('scheduleEndTime').value = '10:15 AM';
      this.element('scheduleRoom').value = 'Online Class (Google Meet)';
      this.element('scheduleMeetLink').value = 'https://meet.google.com/new';
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeTimetableModal() {
    const modal = this.element('timetableModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  openClassNotificationModal(schedule) {
    const modal = this.element('classNotificationModal');
    if (!modal || !schedule) return;

    this.element('notifyScheduleId').value = schedule.id;
    this.element('notifyClassSubject').textContent = schedule.subject;
    this.element('notifyClassTime').textContent = `${schedule.day_of_week} · ${schedule.start_time} - ${schedule.end_time}`;
    this.element('notifyClassMeta').textContent = `${schedule.department || 'Science'} Department · ${schedule.program || 'WAEC'} Programme`;

    const meetInput = this.element('notifyMeetLink');
    if (meetInput) {
      meetInput.value = schedule.meet_link || 'https://meet.google.com/new';
    }

    // Set target class date default to tomorrow (1 day to class)
    const dateInput = this.element('notifyClassDate');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    const msgInput = this.element('notifyMessage');
    if (msgInput) {
      msgInput.value = schedule.notification_message ||
        `Reminder: We have ${schedule.subject} class tomorrow at ${schedule.start_time}. Please join on time on Google Meet via the link provided.`;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeClassNotificationModal() {
    const modal = this.element('classNotificationModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  /* Populate student filter select options dynamically */
  populateStudentResourceFilters(allResources = []) {
    const pqSubjectSelect = this.element('pqSubject');
    const pqYearSelect = this.element('pqYear');
    const tbSubjectSelect = this.element('tbSubject');

    const pqList = allResources.filter(r => r.type === 'past_question');
    const tbList = allResources.filter(r => r.type === 'textbook');

    if (pqSubjectSelect) {
      const currentVal = pqSubjectSelect.value;
      const subjects = Array.from(new Set(pqList.map(r => r.subject).filter(Boolean))).sort();
      pqSubjectSelect.innerHTML = '<option value="">All subjects</option>' + 
        subjects.map(s => `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`).join('');
      if (currentVal) pqSubjectSelect.value = currentVal;
    }

    if (pqYearSelect) {
      const currentVal = pqYearSelect.value;
      const years = Array.from(new Set(pqList.map(r => r.year).filter(Boolean))).sort((a,b) => b - a);
      pqYearSelect.innerHTML = '<option value="">All years</option>' + 
        years.map(y => `<option value="${this.escapeHtml(y)}">${this.escapeHtml(y)}</option>`).join('');
      if (currentVal) pqYearSelect.value = currentVal;
    }

    if (tbSubjectSelect) {
      const currentVal = tbSubjectSelect.value;
      const subjects = Array.from(new Set(tbList.map(r => r.subject).filter(Boolean))).sort();
      tbSubjectSelect.innerHTML = '<option value="">All subjects</option>' + 
        subjects.map(s => `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`).join('');
      if (currentVal) tbSubjectSelect.value = currentVal;
    }
  },

  /* ------------------------------------------------------------------------
     7. RESOURCE MODAL CONTROLS (ADD & EDIT)
     ------------------------------------------------------------------------ */
  openResourceModal(resource = null) {
    const modal = this.element('resourceModal');
    const heading = this.element('resourceModalHeading');
    const desc = this.element('resourceModalDesc');
    const form = this.element('resourceForm');
    const saveBtn = this.element('saveResourceBtn');
    const currentNotice = this.element('currentFileNotice');

    if (!modal) return;

    if (form) form.reset();

    if (resource && resource.id) {
      if (heading) heading.textContent = 'Edit Resource';
      if (desc) desc.textContent = 'Update resource details, subject, or upload a replacement file.';
      if (saveBtn) saveBtn.textContent = 'Update Resource';

      this.element('resourceEditId').value = resource.id;
      this.element('resourceType').value = resource.type || 'past_question';
      this.element('resourceTitle').value = resource.title || '';
      this.element('resourceSubject').value = resource.subject || '';
      
      if (resource.exam) this.element('resourceExam').value = resource.exam;
      if (resource.year) this.element('resourceYear').value = resource.year;
      if (resource.author) this.element('resourceAuthor').value = resource.author;

      if (resource.file_path && resource.file_path.startsWith('http')) {
        this.element('resourceFileUrl').value = resource.file_path;
      } else {
        this.element('resourceFileUrl').value = '';
      }

      if (currentNotice && resource.file_path) {
        currentNotice.style.display = 'block';
        currentNotice.innerHTML = `Current attachment: <a href="${resource.file_path}" target="_blank" style="color:var(--primary); font-weight:600;">${resource.file_path}</a> (upload a new file below only if you want to replace it)`;
      } else if (currentNotice) {
        currentNotice.style.display = 'none';
      }
    } else {
      if (heading) heading.textContent = 'Add Educational Resource';
      if (desc) desc.textContent = 'Fill in the details below to publish WAEC/JAMB past questions or subject textbooks.';
      if (saveBtn) saveBtn.textContent = 'Save Resource';

      this.element('resourceEditId').value = '';
      this.element('resourceType').value = 'past_question';
      if (currentNotice) currentNotice.style.display = 'none';
    }

    if (typeof window.handleResourceTypeChange === 'function') {
      window.handleResourceTypeChange();
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeResourceModal() {
    const modal = this.element('resourceModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    const form = this.element('resourceForm');
    if (form) form.reset();
  },

  /* ------------------------------------------------------------------------
     8. ADMIN STAFF DIRECTORY RENDERERS
     ------------------------------------------------------------------------ */
  async renderAdminStaffAccounts() {
    const container = this.element('staffAccountList');
    const countEl = this.element('adminStaffCount');
    const badgeEl = this.element('adminStaffBadge');
    if (!container) return;

    try {
      const staffList = await schoolModel.staffAccounts();
      const count = Array.isArray(staffList) ? staffList.length : 0;
      if (countEl) countEl.textContent = count;
      if (badgeEl) badgeEl.textContent = `${count} Staff Member${count === 1 ? '' : 's'}`;

      if (!Array.isArray(staffList) || staffList.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="empty-state">No staff accounts created yet.</td></tr>';
        return;
      }

      container.innerHTML = staffList.map(s => {
        const staffId = s.staff_id || s.formatted_id || ('STF-' + String(s.id).padStart(4, '0'));
        const regDate = s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Active';

        return `
          <tr>
            <td>
              <span class="badge badge-blue" style="font-family:monospace; font-weight:800; font-size:.82rem;">${this.escapeHtml(staffId)}</span>
            </td>
            <td>
              <strong style="color:var(--text); font-size:.88rem; display:block;">${this.escapeHtml(s.name)}</strong>
            </td>
            <td><span style="font-size:.84rem; color:var(--text); font-family:monospace;">${this.escapeHtml(s.email)}</span></td>
            <td><span style="font-size:.84rem; font-weight:600; color:var(--text);">${this.escapeHtml(s.department || 'Science')}</span></td>
            <td><span class="badge badge-gold">📖 ${this.escapeHtml(s.assigned_subject || 'Physics')}</span></td>
            <td><span class="badge badge-green">Teacher / Staff</span></td>
            <td><span style="color:var(--muted); font-size:.78rem;">${regDate}</span></td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error('Error rendering staff accounts:', e);
    }
  },

  async renderAdminStaffCodes() {
    const select = this.element('staffCodeAccount');
    if (!select) return;

    try {
      const staffList = await schoolModel.staffAccounts();
      if (!Array.isArray(staffList)) return;

      select.innerHTML = '<option value="">-- Select Staff Member --</option>' + 
        staffList.map(s => `<option value="${this.escapeHtml(s.email)}">${this.escapeHtml(s.name)} (${this.escapeHtml(s.email)} - ${this.escapeHtml(s.assigned_subject || 'Teaching Staff')})</option>`).join('');
    } catch (e) {
      console.error('Error rendering staff codes dropdown:', e);
    }
  },

  /* ------------------------------------------------------------------------
     9. REGISTERED STUDENTS DIRECTORY (ADMIN: ALL STUDENTS)
     ------------------------------------------------------------------------ */
  renderAdminStudents(students = [], totalCount = null) {
    const tbody = this.element('adminStudentRows');
    const countStat = this.element('adminStudentCount');
    const badge = this.element('adminStudentBadge');

    const total = totalCount !== null ? totalCount : students.length;
    if (countStat) countStat.textContent = total;
    if (badge) badge.textContent = `${students.length} Registered Student${students.length === 1 ? '' : 's'}`;

    if (!tbody) return;

    if (!Array.isArray(students) || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No registered students found matching your search or filters.</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(st => {
      const studentId = st.student_id || st.formatted_id || ('STU-' + String(st.id).padStart(4, '0'));
      const progBadgeClass = (st.program === 'JAMB') ? 'badge-green' : 'badge-gold';
      const subjectsList = Array.isArray(st.subjects_list) ? st.subjects_list : [];
      const subjectsHtml = subjectsList.length > 0
        ? subjectsList.map(sub => `<span class="subject-tag" style="margin:2px 3px 2px 0;">${this.escapeHtml(sub)}</span>`).join('')
        : '<span style="color:var(--muted); font-size:.78rem;">None specified</span>';

      const regDate = st.created_at ? new Date(st.created_at).toLocaleDateString() : 'Active';

      return `
        <tr>
          <td>
            <span class="badge badge-gold" style="font-family:monospace; font-weight:800; font-size:.82rem;">${this.escapeHtml(studentId)}</span>
          </td>
          <td>
            <strong style="color:var(--text); font-size:.88rem; display:block;">${this.escapeHtml(st.name)}</strong>
          </td>
          <td><span style="font-size:.84rem; color:var(--text); font-family:monospace;">${this.escapeHtml(st.email)}</span></td>
          <td><span class="badge ${progBadgeClass}">${this.escapeHtml(st.program || 'WAEC')}</span></td>
          <td><span style="font-size:.84rem; font-weight:600; color:var(--text);">${this.escapeHtml(st.department || 'Science')}</span></td>
          <td style="max-width:340px;">
            <div style="margin-bottom:4px;">
              <span class="badge badge-blue" style="font-size:.7rem; font-weight:700;">${subjectsList.length} Subjects</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:3px;">
              ${subjectsHtml}
            </div>
          </td>
          <td><span style="color:var(--muted); font-size:.78rem;">${regDate}</span></td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     10. STAFF COURSE ROSTER (STAFF: ONLY STUDENTS OFFERING HIS/HER COURSE)
     ------------------------------------------------------------------------ */
  renderStaffStudents(students = [], staffSubject = 'Physics') {
    const tbody = this.element('staffRosterRows');
    const rosterCount = this.element('staffRosterCount');
    const courseBadge = this.element('staffCourseCountBadge');
    const activeCourseBadge = this.element('staffActiveCourseBadge');
    const courseTitle = this.element('staffCourseTitle');

    const courseName = staffSubject || 'Assigned Course';

    if (rosterCount) rosterCount.textContent = students.length;
    if (courseBadge) courseBadge.textContent = `${students.length} Student${students.length === 1 ? '' : 's'}`;
    if (activeCourseBadge) activeCourseBadge.textContent = `Course: ${courseName}`;
    if (courseTitle) courseTitle.textContent = courseName;

    if (!tbody) return;

    if (!Array.isArray(students) || students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No registered students are currently offering <strong>${this.escapeHtml(courseName)}</strong>.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map((st, index) => {
      const progBadgeClass = (st.program === 'JAMB') ? 'badge-green' : 'badge-gold';
      const studentId = st.student_id || st.formatted_id || ('STU-' + String(st.id).padStart(4, '0'));

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:.5rem;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:#dbeafe; color:#1e40af; font-size:.75rem; font-weight:700;">${index + 1}</span>
              <div>
                <strong style="color:var(--text); font-size:.88rem; display:block;">${this.escapeHtml(st.name)}</strong>
                <small style="color:var(--muted); font-size:.72rem; font-family:monospace; font-weight:700;">${this.escapeHtml(studentId)}</small>
              </div>
            </div>
          </td>
          <td><span style="font-size:.82rem; color:var(--text); font-family:monospace;">${this.escapeHtml(st.email)}</span></td>
          <td><span class="badge ${progBadgeClass}">${this.escapeHtml(st.program || 'WAEC')}</span></td>
          <td><span style="font-size:.82rem; font-weight:600;">${this.escapeHtml(st.department || 'Science')}</span></td>
          <td>
            <span class="badge badge-green" title="Enrolled in your subject">✓ Offers ${this.escapeHtml(courseName)}</span>
          </td>
          <td>
            <select class="attendance-select" style="padding:.3rem .55rem; border:1px solid var(--border); border-radius:7px; background:var(--card); color:var(--text); font-size:.8rem; font-weight:600;">
              <option value="present">✓ Present</option>
              <option value="absent">✗ Absent</option>
              <option value="late">⏳ Late</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     11. STAFF ASSIGNMENT SUBMISSIONS & GRADING RENDERER
     ------------------------------------------------------------------------ */
  renderStaffSubmissions(submissions = []) {
    const tbody = this.element('staffSubmissionsRows');
    const badge = this.element('staffSubmissionCountBadge');
    const assignStat = this.element('staffAssignmentCount');
    if (badge) {
      badge.textContent = `${submissions.length} Submission${submissions.length === 1 ? '' : 's'}`;
    }
    if (assignStat) {
      assignStat.textContent = submissions.length;
    }

    if (!tbody) return;

    // Dynamically populate subject filter options if dropdown exists
    const subFilter = this.element('staffSubmissionsFilterSubject');
    if (subFilter && Array.isArray(submissions) && submissions.length > 0) {
      const currentVal = subFilter.value;
      const subjectsInSubs = Array.from(new Set(submissions.map(s => s.subject).filter(Boolean))).sort();
      let opts = '<option value="all">All Subjects (All Coursework)</option><option value="my_course">My Assigned Subject</option>';
      subjectsInSubs.forEach(s => {
        opts += `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`;
      });
      subFilter.innerHTML = opts;
      if (currentVal) subFilter.value = currentVal;
    }

    if (!Array.isArray(submissions) || submissions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No student coursework submissions found matching your filters.</td></tr>';
      return;
    }

    // Cache submissions on window for modal lookup
    window._cachedStaffSubmissions = submissions;

    tbody.innerHTML = submissions.map(sub => {
      const studentId = sub.formatted_student_id || ('STU-' + String(sub.student_id).padStart(4, '0'));
      const isGraded = (sub.score !== null && sub.score !== '') || (sub.grade !== null && sub.grade !== '');
      const dateStr = sub.submitted_at
        ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Submitted';

      const contentPreview = sub.submission_content && sub.submission_content.trim()
        ? (sub.submission_content.length > 80 ? this.escapeHtml(sub.submission_content.substring(0, 80)) + '...' : this.escapeHtml(sub.submission_content))
        : '<span style="color:var(--muted); font-size:.78rem; font-style:italic;">No typed text</span>';

      const fileHtml = sub.submission_file
        ? `<a href="${sub.submission_file}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="font-size:.74rem; text-decoration:none; padding:.3rem .6rem;">📎 View File</a>`
        : '<span style="color:var(--muted); font-size:.78rem;">—</span>';

      const scoreHtml = isGraded
        ? `<span class="badge badge-green" style="font-weight:800; font-size:.82rem;">${this.escapeHtml(sub.score || '')} ${sub.grade ? `(${this.escapeHtml(sub.grade)})` : ''}</span>`
        : '<span class="badge badge-gold" style="font-size:.76rem;">⏳ Pending Review</span>';

      const remarksHtml = sub.remarks && sub.remarks.trim()
        ? `<span style="font-size:.8rem; color:#166534; font-style:italic;" title="${this.escapeHtml(sub.remarks)}">“${this.escapeHtml(sub.remarks.length > 60 ? sub.remarks.substring(0, 60) + '...' : sub.remarks)}”</span>`
        : '<span style="color:var(--muted); font-size:.78rem;">No remarks yet</span>';

      return `
        <tr>
          <td>
            <strong style="color:var(--text); font-size:.88rem; display:block;">${this.escapeHtml(sub.student_name)}</strong>
            <small style="color:var(--muted); font-size:.74rem; font-family:monospace;">${this.escapeHtml(studentId)} · ${this.escapeHtml(sub.student_program || 'WAEC')} (${this.escapeHtml(sub.student_department || 'Science')})</small>
          </td>
          <td>
            <strong style="color:var(--text); font-size:.86rem; display:block;">${this.escapeHtml(sub.assignment_title)}</strong>
            <span class="badge badge-gold" style="font-size:.72rem;">${this.escapeHtml(sub.subject)}</span>
          </td>
          <td style="max-width:220px; font-size:.82rem;">${contentPreview}</td>
          <td>${fileHtml}</td>
          <td><span style="font-size:.78rem; color:var(--muted);">${dateStr}</span></td>
          <td>${scoreHtml}</td>
          <td style="max-width:200px;">${remarksHtml}</td>
          <td>
            <button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openGradingModal(${sub.submission_id})" style="font-size:.78rem; font-weight:700; white-space:nowrap;">
              ✏️ Grade / Remarks
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     12. GENERAL SCORE SHEET & MASTER GRADEBOOK RENDERER
     ------------------------------------------------------------------------ */
  renderGeneralScoresheet(targetTableId, data = {}, isStaff = false, updateMasterCache = true) {
    if (updateMasterCache) {
      if (isStaff) {
        window._fullStaffScoresheetData = data;
      } else {
        window._fullAdminScoresheetData = data;
      }
    }

    const tbody = this.element(targetTableId);
    const prefix = isStaff ? 'staffScoresheet' : 'adminScoresheet';

    const records = Array.isArray(data.scoresheet) ? data.scoresheet : [];
    const summary = data.summary || {};
    const subjects = data.subjects || [];
    const assignments = data.assignments || [];

    // Summary badges
    const avgBadge = this.element(`${prefix}AvgBadge`);
    const gradedBadge = this.element(`${prefix}GradedBadge`);
    const totalBadge = this.element(`${prefix}TotalBadge`);

    if (avgBadge) avgBadge.textContent = `Avg: ${summary.average_score || '0%'}`;
    if (gradedBadge) gradedBadge.textContent = `${summary.total_graded || 0} Graded`;
    if (totalBadge) totalBadge.textContent = `${records.length} Record${records.length === 1 ? '' : 's'}`;

    // Populate filter dropdowns if present
    const subSelect = isStaff ? this.element('staffScoresheetFilterSubject') : this.element('adminScoresheetFilterSubject');
    if (subSelect && subjects.length > 0) {
      subjects.forEach(s => {
        const exists = Array.from(subSelect.options).some(o => o.value === s);
        if (!exists) {
          const opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          subSelect.appendChild(opt);
        }
      });
    }

    const assignSelect = this.element(`${prefix}FilterAssignment`);
    if (assignSelect && assignSelect.options.length <= 1 && assignments.length > 0) {
      assignments.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${a.title} (${a.subject})`;
        assignSelect.appendChild(opt);
      });
    }

    if (!tbody) return;

    if (records.length === 0) {
      const colSpan = isStaff ? 8 : 9;
      tbody.innerHTML = `<tr><td colspan="${colSpan}" class="empty-state">No score records found matching your query or filters.</td></tr>`;
      return;
    }

    // Cache records for modal lookups
    if (isStaff) {
      window._cachedStaffScoresheet = records;
    } else {
      window._cachedAdminScoresheet = records;
    }

    tbody.innerHTML = records.map(item => {
      const studentId = item.formatted_student_id || ('STU-' + String(item.student_id).padStart(4, '0'));
      const progBadgeClass = (item.program === 'JAMB') ? 'badge-green' : 'badge-gold';

      let statusBadge = '<span class="badge" style="background:#f3f4f6; color:#6b7280; font-size:.76rem;">Not Submitted</span>';
      if (item.status === 'Graded') {
        statusBadge = '<span class="badge badge-green" style="font-weight:800; font-size:.76rem;">✓ Graded</span>';
      } else if (item.status === 'Pending Review') {
        statusBadge = '<span class="badge badge-gold" style="font-weight:700; font-size:.76rem;">⏳ Pending Review</span>';
      }

      const scoreDisplay = item.score
        ? `<strong style="font-size:.92rem; color:#065f46;">${this.escapeHtml(item.score)}</strong>`
        : '<span style="color:var(--muted); font-size:.85rem;">—</span>';

      const gradeDisplay = item.grade
        ? `<span class="badge badge-green" style="font-weight:800;">${this.escapeHtml(item.grade)}</span>`
        : '<span style="color:var(--muted); font-size:.85rem;">—</span>';

      let remarksDisplay = '<span style="color:var(--muted); font-size:.78rem;">—</span>';
      if (item.remarks) {
        const graderNote = item.grader_name ? ` · by ${this.escapeHtml(item.grader_name)}` : '';
        remarksDisplay = `
          <div>
            <span style="font-size:.8rem; color:#14532d; font-style:italic;" title="${this.escapeHtml(item.remarks)}">“${this.escapeHtml(item.remarks.length > 55 ? item.remarks.substring(0, 55) + '...' : item.remarks)}”</span>
            <small style="display:block; color:var(--muted); font-size:.7rem;">${graderNote}</small>
          </div>
        `;
      }

      let dueNote = item.due_date || '—';
      if (item.due_date && item.due_time) {
        dueNote += ` (${item.due_time})`;
      }

      const actionBtn = item.submission_id
        ? `<button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openGradingModal(${item.submission_id})" style="font-size:.76rem; font-weight:700; white-space:nowrap;">✏️ Grade / Edit</button>`
        : '<span style="color:var(--muted); font-size:.76rem;">No submission</span>';

      if (isStaff) {
        return `
          <tr>
            <td>
              <strong style="color:var(--text); font-size:.88rem; display:block;">${this.escapeHtml(item.student_name)}</strong>
              <small style="color:var(--muted); font-size:.74rem; font-family:monospace;">${this.escapeHtml(studentId)} · ${this.escapeHtml(item.student_email)}</small>
            </td>
            <td>
              <span class="badge ${progBadgeClass}">${this.escapeHtml(item.program || 'WAEC')}</span>
              <span style="font-size:.8rem; font-weight:600; display:block; margin-top:2px;">${this.escapeHtml(item.department || 'Science')}</span>
            </td>
            <td>
              <strong style="color:var(--text); font-size:.85rem; display:block;">${this.escapeHtml(item.assignment_title)}</strong>
              <small style="color:var(--muted); font-size:.72rem;">Due: ${dueNote}</small>
            </td>
            <td>${statusBadge}</td>
            <td>${scoreDisplay}</td>
            <td>${gradeDisplay}</td>
            <td style="max-width:200px;">${remarksDisplay}</td>
            <td>${actionBtn}</td>
          </tr>
        `;
      } else {
        // Admin row includes Subject column
        return `
          <tr>
            <td>
              <strong style="color:var(--text); font-size:.88rem; display:block;">${this.escapeHtml(item.student_name)}</strong>
              <small style="color:var(--muted); font-size:.74rem; font-family:monospace;">${this.escapeHtml(studentId)} · ${this.escapeHtml(item.student_email)}</small>
            </td>
            <td>
              <span class="badge ${progBadgeClass}">${this.escapeHtml(item.program || 'WAEC')}</span>
              <span style="font-size:.8rem; font-weight:600; display:block; margin-top:2px;">${this.escapeHtml(item.department || 'Science')}</span>
            </td>
            <td><span class="badge badge-gold">${this.escapeHtml(item.subject)}</span></td>
            <td>
              <strong style="color:var(--text); font-size:.85rem; display:block;">${this.escapeHtml(item.assignment_title)}</strong>
              <small style="color:var(--muted); font-size:.72rem;">Due: ${dueNote}</small>
            </td>
            <td>${statusBadge}</td>
            <td>${scoreDisplay}</td>
            <td>${gradeDisplay}</td>
            <td style="max-width:200px;">${remarksDisplay}</td>
            <td>${actionBtn}</td>
          </tr>
        `;
      }
    }).join('');
  },

  /* ------------------------------------------------------------------------
     13. GRADING MODAL CONTROLS
     ------------------------------------------------------------------------ */
  openGradingModal(sub) {
    const modal = this.element('gradingModal');
    if (!modal || !sub) return;

    this.element('gradeSubmissionId').value = sub.submission_id || sub.id || '';
    this.element('gradeStudentName').textContent = sub.student_name || 'Student';
    this.element('gradeStudentId').textContent = sub.formatted_student_id || ('STU-' + String(sub.student_id).padStart(4, '0'));
    this.element('gradeAssignmentTitle').textContent = sub.assignment_title || 'Assignment';
    this.element('gradeAssignmentSubject').textContent = sub.subject || 'Course';

    const dateStr = sub.submitted_at
      ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Submitted';
    this.element('gradeSubmittedAt').textContent = `Submitted: ${dateStr}`;

    const contentBox = this.element('gradeStudentContent');
    if (contentBox) {
      const content = sub.submission_content || sub.content;
      if (content && content.trim()) {
        contentBox.textContent = content;
        contentBox.style.color = 'var(--text)';
        contentBox.style.fontStyle = 'normal';
      } else {
        contentBox.textContent = 'No typed answer provided by student (file submission only).';
        contentBox.style.color = 'var(--muted)';
        contentBox.style.fontStyle = 'italic';
      }
    }

    const fileWrap = this.element('gradeStudentFileWrap');
    const fileLink = this.element('gradeStudentFileLink');
    const filePath = sub.submission_file || sub.file_path;
    if (fileWrap && fileLink) {
      if (filePath) {
        fileWrap.style.display = 'block';
        fileLink.href = filePath;
        fileLink.textContent = `📎 View / Download Document (${filePath.split('/').pop()})`;
      } else {
        fileWrap.style.display = 'none';
      }
    }

    const scoreInput = this.element('gradeScoreInput');
    const letterInput = this.element('gradeLetterInput');
    const remarksInput = this.element('gradeRemarksInput');

    if (scoreInput) scoreInput.value = sub.score || '';
    if (letterInput) letterInput.value = sub.grade || '';
    if (remarksInput) remarksInput.value = sub.remarks || '';

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeGradingModal() {
    const modal = this.element('gradingModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  /* ------------------------------------------------------------------------
     15. FEES & BILLING VIEWS (STUDENT & ADMIN)
     ------------------------------------------------------------------------ */
  renderStudentFeeLock(data) {
    if (!data || !data.fee) return;
    const fee = data.fee;
    const student = data.student_status || (schoolModel.user || {});

    const nameEl = this.element('lockStudentName');
    const metaEl = this.element('lockStudentMeta');
    const baseStrikethrough = this.element('lockBaseStrikethrough');
    const monthlyPriceEl = this.element('lockMonthlyPrice');
    const savingsEl = this.element('lockSavingsBadge');
    const weeklyPriceEl = this.element('lockWeeklyPrice');

    if (nameEl) nameEl.textContent = student.name || 'Student';
    if (metaEl) {
      const studentId = student.student_id ? ('STU-' + String(student.student_id).padStart(4, '0')) : (schoolModel.user?.student_id || 'STU-0001');
      metaEl.textContent = `ID: ${studentId} · ${student.program || 'WAEC'} · ${student.department || 'Science'} Department`;
    }

    if (baseStrikethrough) {
      baseStrikethrough.textContent = '₦' + Number(fee.base_monthly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
    if (monthlyPriceEl) {
      monthlyPriceEl.textContent = '₦' + Number(fee.monthly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
    if (savingsEl) {
      savingsEl.textContent = 'Save ₦' + Number(fee.monthly_savings).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (10% Discount)';
    }
    if (weeklyPriceEl) {
      weeklyPriceEl.textContent = '₦' + Number(fee.weekly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
  },

  renderStudentBillingModal(data) {
    if (!data || !data.fee) return;
    const fee = data.fee;
    const student = data.student_status || {};
    const recent = data.recent_payments || [];

    const planBadge = this.element('billingCurrentPlanBadge');
    const expiryEl = this.element('billingExpiryDisplay');
    const daysLeftEl = this.element('billingDaysLeft');
    const monthlyRate = this.element('billingMonthlyRate');
    const weeklyRate = this.element('billingWeeklyRate');
    const paymentRows = this.element('billingPaymentRows');

    if (planBadge) {
      const isPaid = student.is_paid == 1;
      const plan = (student.plan || 'monthly').toUpperCase();
      planBadge.textContent = isPaid ? `Active Plan: ${plan}` : 'Status: Unpaid / Expired';
      planBadge.className = isPaid ? 'badge badge-green' : 'badge badge-red';
    }

    if (expiryEl) {
      expiryEl.textContent = student.paid_until_formatted || 'No active payment recorded';
    }
    if (daysLeftEl) {
      daysLeftEl.textContent = student.days_left ? `${student.days_left} days remaining` : 'Access Inactive';
    }
    if (monthlyRate) {
      monthlyRate.textContent = '₦' + Number(fee.monthly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (10% Off Applied)';
    }
    if (weeklyRate) {
      weeklyRate.textContent = '₦' + Number(fee.weekly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (Month / 4)';
    }

    if (paymentRows) {
      if (!recent || recent.length === 0) {
        paymentRows.innerHTML = '<tr><td colspan="5" class="empty-state">No payment receipts found.</td></tr>';
      } else {
        paymentRows.innerHTML = recent.map(p => `
          <tr>
            <td><strong style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(p.reference)}</strong></td>
            <td><span class="badge ${p.plan === 'monthly' ? 'badge-green' : 'badge-blue'}">${p.plan === 'monthly' ? 'Monthly (10% Off)' : 'Weekly (Split)'}</span></td>
            <td><strong>₦${Number(p.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
            <td><span class="badge badge-green">Successful</span></td>
            <td><small style="color:var(--muted);">${new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></td>
          </tr>
        `).join('');
      }
    }

    const modal = this.element('studentBillingModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  },

  closeStudentBillingModal() {
    const modal = this.element('studentBillingModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  renderAdminFees(data) {
    if (!data) return;

    // 0. Paystack Connection Banner Status
    const pstk = data.paystack || schoolModel.paystackSettings || {};
    const feePstkStatus = this.element('adminFeePaystackStatusPill');
    const feePstkEnv = this.element('adminFeePaystackEnvPill');
    if (feePstkStatus) {
      if (pstk.is_enabled) {
        feePstkStatus.className = 'badge badge-green';
        feePstkStatus.textContent = '● Gateway Active';
      } else {
        feePstkStatus.className = 'badge badge-red';
        feePstkStatus.textContent = '● Gateway Deactivated';
      }
    }
    if (feePstkEnv) {
      feePstkEnv.textContent = (pstk.environment === 'live') ? 'Live Mode' : 'Test Mode';
      feePstkEnv.className = (pstk.environment === 'live') ? 'badge badge-green' : 'badge badge-blue';
    }

    // 1. Summary Cards
    const summary = data.summary || {};
    const revEl = this.element('adminFeeTotalRevenue');
    const paidEl = this.element('adminFeePaidCount');
    const unpaidEl = this.element('adminFeeUnpaidCount');
    const subBreakdownEl = this.element('adminFeeSubBreakdown');

    if (revEl) revEl.textContent = summary.total_revenue_formatted || '₦0.00';
    if (paidEl) paidEl.textContent = summary.paid_students ?? 0;
    if (unpaidEl) unpaidEl.textContent = summary.unpaid_students ?? 0;
    if (subBreakdownEl) {
      subBreakdownEl.textContent = `${summary.monthly_subscribers || 0} Monthly · ${summary.weekly_subscribers || 0} Weekly`;
    }

    // 2. Active Fee Card
    const fees = data.fees || [];
    const activeFee = fees[0] || {
      id: 1,
      title: 'School Tuition & Learning Access Fee',
      base_monthly_fee: 20000,
      monthly_fee: 18000,
      monthly_savings: 2000,
      weekly_fee: 5000,
      program: 'All',
      status: 'active'
    };

    const feeTitle = this.element('adminFeeTitleDisplay');
    const feeBase = this.element('adminFeeBaseDisplay');
    const feeMonthly = this.element('adminFeeMonthlyDisplay');
    const feeWeekly = this.element('adminFeeWeeklyDisplay');
    const feeProgram = this.element('adminFeeProgramBadge');
    const editFeeBtn = this.element('adminEditFeeBtn');

    if (feeTitle) feeTitle.textContent = activeFee.title || 'School Tuition & Learning Access Fee';
    if (feeBase) feeBase.textContent = '₦' + Number(activeFee.base_monthly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    if (feeMonthly) feeMonthly.textContent = '₦' + Number(activeFee.monthly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (-10% Discount)';
    if (feeWeekly) feeWeekly.textContent = '₦' + Number(activeFee.weekly_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (1 Mo / 4)';
    if (feeProgram) feeProgram.textContent = `Programme: ${activeFee.program || 'All'}`;
    if (editFeeBtn) {
      editFeeBtn.onclick = () => schoolController.openAdminFeeModal(activeFee.id);
    }

    // 3. Student Billing Roster
    this.renderAdminFeeStudentRows(data.students || []);

    // 4. Payment Transactions
    const payRows = this.element('adminFeePaymentRows');
    const payments = data.payments || [];
    if (payRows) {
      if (payments.length === 0) {
        payRows.innerHTML = '<tr><td colspan="7" class="empty-state">No payment transactions recorded yet.</td></tr>';
      } else {
        payRows.innerHTML = payments.map(p => {
          const isPstk = (p.payment_method === 'paystack') || (p.reference && p.reference.startsWith('PSTK'));
          const methodBadge = isPstk
            ? '<span class="badge badge-green" style="font-size:.72rem; font-weight:700;">⚡ Paystack Online</span>'
            : `<span class="badge badge-gold" style="font-size:.72rem;">${this.escapeHtml((p.payment_method || 'Online').replace('_', ' ').toUpperCase())}</span>`;

          return `
          <tr>
            <td><strong style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(p.reference)}</strong></td>
            <td><strong>${this.escapeHtml(p.student_name || 'Student')}</strong><br><small style="color:var(--muted);">${this.escapeHtml(p.student_email || '')}</small></td>
            <td><span class="badge ${p.plan === 'monthly' ? 'badge-green' : 'badge-blue'}">${p.plan === 'monthly' ? 'Monthly (10% Off)' : 'Weekly (Split)'}</span></td>
            <td><strong>₦${Number(p.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
            <td>${methodBadge}</td>
            <td><small style="color:var(--muted);">${new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></td>
            <td><span class="badge badge-green">Successful</span></td>
          </tr>
        `;
        }).join('');
      }
    }
  },

  renderAdminFeeStudentRows(students = []) {
    const tbody = this.element('adminFeeStudentRows');
    const countBadge = this.element('adminFeeStudentRosterBadge');
    if (countBadge) countBadge.textContent = `${students.length} Students`;
    if (!tbody) return;

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No students match current billing criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(s => {
      let badgeHtml = '';
      if (s.status_label === 'Paid (Monthly)') {
        badgeHtml = `<span class="badge badge-green">Paid (Monthly)</span>`;
      } else if (s.status_label === 'Paid (Weekly)') {
        badgeHtml = `<span class="badge badge-blue">Paid (Weekly)</span>`;
      } else if (s.status_label === 'Expired') {
        badgeHtml = `<span class="badge badge-gold">Expired</span>`;
      } else {
        badgeHtml = `<span class="badge badge-red">Unpaid</span>`;
      }

      const expiryText = s.paid_until_formatted
        ? `<span style="font-size:.82rem; font-weight:600;">${this.escapeHtml(s.paid_until_formatted)}</span><br><small style="color:${s.is_paid ? 'var(--success)' : 'var(--danger)'};">${s.days_left > 0 ? s.days_left + ' days left' : 'Expired'}</small>`
        : '<span style="color:var(--muted); font-size:.82rem;">Never paid</span>';

      let actionsHtml = '';
      if (s.is_paid) {
        actionsHtml = `
          <button type="button" class="btn-sm btn-sm-delete" onclick="schoolController.adminToggleStudentPayment(${s.id}, 'revoke')" title="Revoke portal access">Revoke</button>
        `;
      } else {
        actionsHtml = `
          <div style="display:flex; gap:.35rem; flex-wrap:wrap;">
            <button type="button" class="btn-sm" style="background:#0b2d4b; color:white; border-radius:6px; font-weight:750; padding:.3rem .6rem;" onclick="schoolController.adminPayStudentWithPaystack(${s.id}, '${this.escapeHtml(s.name)}', '${this.escapeHtml(s.email)}')" title="Initialize Paystack Tuition Checkout">⚡ Paystack</button>
            <button type="button" class="btn-sm btn-sm-enroll" onclick="schoolController.adminToggleStudentPayment(${s.id}, 'mark_paid_monthly')" title="Mark as paid for 1 Month (10% Off rate)">Paid (Mo)</button>
            <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.adminToggleStudentPayment(${s.id}, 'mark_paid_weekly')" title="Mark as paid for 1 Week (Split rate)">Paid (Wk)</button>
          </div>
        `;
      }

      return `
        <tr>
          <td><strong style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(s.formatted_id)}</strong></td>
          <td><strong>${this.escapeHtml(s.name)}</strong><br><small style="color:var(--muted);">${this.escapeHtml(s.email)}</small></td>
          <td><span class="badge badge-gold" style="font-size:.72rem;">${this.escapeHtml(s.program || 'WAEC')}</span> <span class="badge badge-blue" style="font-size:.72rem;">${this.escapeHtml(s.department || 'Science')}</span></td>
          <td><span style="font-weight:600; text-transform:capitalize;">${this.escapeHtml(s.plan || 'None')}</span></td>
          <td>${badgeHtml}</td>
          <td>${expiryText}</td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join('');
  },

  openAdminFeeModal(fee) {
    const modal = this.element('adminFeeModal');
    if (!modal) return;

    const idInput = this.element('adminFeeIdInput');
    const titleInput = this.element('adminFeeTitleInput');
    const baseFeeInput = this.element('adminFeeBaseInput');
    const programInput = this.element('adminFeeProgramInput');
    const descInput = this.element('adminFeeDescInput');

    if (fee) {
      if (idInput) idInput.value = fee.id || '';
      if (titleInput) titleInput.value = fee.title || 'School Tuition & Learning Access Fee';
      if (baseFeeInput) baseFeeInput.value = fee.base_monthly_fee || 20000;
      if (programInput) programInput.value = fee.program || 'All';
      if (descInput) descInput.value = fee.description || '';
    } else {
      if (idInput) idInput.value = '';
      if (titleInput) titleInput.value = 'School Tuition & Learning Access Fee';
      if (baseFeeInput) baseFeeInput.value = '20000';
      if (programInput) programInput.value = 'All';
      if (descInput) descInput.value = '';
    }

    this.updateAdminFeeModalCalculations();

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeAdminFeeModal() {
    const modal = this.element('adminFeeModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  updateAdminFeeModalCalculations() {
    const baseInput = this.element('adminFeeBaseInput');
    const previewMonthly = this.element('adminFeeModalMonthlyPreview');
    const previewSavings = this.element('adminFeeModalSavingsPreview');
    const previewWeekly = this.element('adminFeeModalWeeklyPreview');

    const base = parseFloat(baseInput?.value || 0) || 0;
    const monthly = Math.round(base * 0.90 * 100) / 100;
    const savings = Math.round(base * 0.10 * 100) / 100;
    const weekly = Math.round((base / 4) * 100) / 100;

    if (previewMonthly) previewMonthly.textContent = '₦' + monthly.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    if (previewSavings) previewSavings.textContent = 'Save ₦' + savings.toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (10% Off)';
    if (previewWeekly) previewWeekly.textContent = '₦' + weekly.toLocaleString('en-NG', { minimumFractionDigits: 2 }) + ' (Base / 4)';
  },

  openBankTransferModal(data) {
    const modal = this.element('bankTransferModal');
    if (!modal) return;

    const ref = 'TRANSFER-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const refEl = this.element('bankTransferRefCode');
    const amountEl = this.element('bankTransferAmount');
    const planEl = this.element('bankTransferPlanBadge');

    if (refEl) refEl.textContent = ref;
    window._pendingBankTransferRef = ref;

    const selectedPlan = window._selectedFeePlan || 'monthly';
    const amount = (selectedPlan === 'weekly') ? (data?.fee?.weekly_fee || 5000) : (data?.fee?.monthly_fee || 18000);

    if (amountEl) {
      amountEl.textContent = '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }
    if (planEl) {
      planEl.textContent = (selectedPlan === 'weekly') ? 'Weekly Plan (7 Days Access)' : 'Monthly Plan (30 Days Access · 10% Off)';
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeBankTransferModal() {
    const modal = this.element('bankTransferModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  /* ------------------------------------------------------------------------
     16. STAFF PAYROLL & BANKING VIEWS
     ------------------------------------------------------------------------ */
  renderStaffPayrollSection(data) {
    if (!data) return;
    const staff = data.staff || {};
    const payslips = data.payslips || [];

    // 1. Staff Bank Overview Card
    const bankDisplay = this.element('staffBankNameDisplay');
    const accNumDisplay = this.element('staffAccountNumberDisplay');
    const accNameDisplay = this.element('staffAccountNameDisplay');
    const salaryDisplay = this.element('staffSalaryDisplay');
    const statusBadge = this.element('staffMonthPaymentStatusBadge');

    if (bankDisplay) bankDisplay.textContent = staff.bank_name || 'Not Configured';
    if (accNumDisplay) accNumDisplay.textContent = staff.account_number || '----------';
    if (accNameDisplay) accNameDisplay.textContent = staff.account_name || 'Account Name Not Set';
    if (salaryDisplay) salaryDisplay.textContent = staff.monthly_salary_formatted || '₦75,000.00';

    if (statusBadge) {
      if (staff.is_paid_this_month) {
        statusBadge.textContent = `Paid (${data.current_month || 'Current Month'}) ✓`;
        statusBadge.className = 'badge badge-green';
      } else {
        statusBadge.textContent = `Pending Disbursal (${data.current_month || 'Current Month'})`;
        statusBadge.className = 'badge badge-gold';
      }
    }

    // 2. Payslip History Table
    const tbody = this.element('staffPayslipRows');
    if (tbody) {
      if (payslips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No salary disbursement records found yet.</td></tr>';
      } else {
        tbody.innerHTML = payslips.map(p => {
          const dateStr = p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
          return `
            <tr>
              <td><strong style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(p.reference)}</strong></td>
              <td><strong>${this.escapeHtml(p.month_year)}</strong></td>
              <td>₦${Number(p.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
              <td><strong style="color:var(--primary);">₦${Number(p.net_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
              <td>${this.escapeHtml(p.bank_name)} · <span style="font-family:monospace;">${this.escapeHtml(p.account_number)}</span></td>
              <td><small style="color:var(--muted);">${dateStr}</small></td>
              <td>
                <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.viewPayslip('${this.escapeHtml(p.reference)}')">📄 Payslip</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  renderAdminPayrollSection(data) {
    if (!data) return;
    const summary = data.summary || {};
    const staffList = data.staff || [];
    const history = data.history || [];

    // 0. Paystack Automated Remittance Status & Balance
    const pstk = data.paystack || schoolModel.paystackSettings || {};
    const statusPill = this.element('adminPayrollPaystackStatusPill');
    const walletPill = this.element('adminPayrollWalletPill');
    const walletVal = this.element('adminPayrollPaystackWallet');
    const walletHint = this.element('adminPayrollPaystackHint');
    const formattedBal = '₦' + Number(pstk.balance_ngn ?? 2450000).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    if (statusPill) {
      if (pstk.is_enabled) {
        statusPill.className = 'badge badge-green';
        statusPill.textContent = '● Transfer API Active';
      } else {
        statusPill.className = 'badge badge-red';
        statusPill.textContent = '● Transfer API Offline';
      }
    }
    if (walletPill) {
      walletPill.textContent = `Wallet: ${formattedBal}`;
    }
    if (walletVal) {
      walletVal.textContent = formattedBal;
    }
    if (walletHint) {
      walletHint.textContent = pstk.is_enabled ? '● Ready for automated transfer' : '⚠️ API deactivated by admin';
      walletHint.style.color = pstk.is_enabled ? 'var(--success)' : 'var(--danger)';
    }

    // 1. Summary Cards
    const liabilityEl = this.element('adminPayrollLiability');
    const paidEl = this.element('adminPayrollPaidTotal');
    const unpaidEl = this.element('adminPayrollUnpaidTotal');
    const staffCountEl = this.element('adminPayrollStaffCount');

    if (liabilityEl) liabilityEl.textContent = summary.total_payroll_formatted || '₦0.00';
    if (paidEl) paidEl.textContent = summary.total_paid_formatted || '₦0.00';
    if (unpaidEl) unpaidEl.textContent = summary.total_unpaid_formatted || '₦0.00';
    if (staffCountEl) {
      staffCountEl.textContent = `${summary.paid_count || 0} Paid · ${summary.unpaid_count || 0} Pending Disbursal`;
    }

    // 2. Staff Payroll & Bank Details Roster Table
    this.renderAdminStaffPayrollRows(staffList, data.selected_month);

    // 3. Historical Disbursements Log Table
    const histTable = this.element('adminPayrollHistoryRows');
    if (histTable) {
      if (history.length === 0) {
        histTable.innerHTML = '<tr><td colspan="8" class="empty-state">No payroll disbursement records logged yet.</td></tr>';
      } else {
        histTable.innerHTML = history.map(h => {
          const dateStr = h.paid_at ? new Date(h.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
          const isPaystack = (h.payment_method === 'paystack_transfer') || (h.reference && h.reference.includes('PSTK'));
          const methodBadge = isPaystack
            ? '<span class="badge badge-green" style="font-size:.7rem; font-weight:700;">⚡ PAYSTACK TRANSFER</span>'
            : `<span class="badge badge-gold" style="font-size:.7rem;">${this.escapeHtml((h.payment_method || 'transfer').replace('_', ' ').toUpperCase())}</span>`;

          return `
            <tr>
              <td><strong style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(h.reference)}</strong></td>
              <td><strong>${this.escapeHtml(h.staff_name)}</strong><br><small style="color:var(--muted);">${this.escapeHtml(h.staff_email)}</small></td>
              <td><strong>${this.escapeHtml(h.month_year)}</strong></td>
              <td>${this.escapeHtml(h.bank_name)}<br><span style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(h.account_number)}</span> (${this.escapeHtml(h.account_name)})</td>
              <td><strong style="color:var(--primary);">₦${Number(h.net_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></td>
              <td>${methodBadge}</td>
              <td><small style="color:var(--muted);">${dateStr}</small></td>
              <td>
                <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.viewPayslip('${this.escapeHtml(h.reference)}')">📄 Payslip</button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  renderAdminStaffPayrollRows(staffList = [], selectedMonth = '') {
    const tbody = this.element('adminStaffPayrollRows');
    const badgeEl = this.element('adminStaffPayrollRosterBadge');
    if (badgeEl) badgeEl.textContent = `${staffList.length} Teachers`;
    if (!tbody) return;

    if (staffList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No staff accounts found.</td></tr>';
      return;
    }

    tbody.innerHTML = staffList.map(s => {
      let bankHtml = '';
      if (s.has_bank_details) {
        bankHtml = `
          <div>
            <strong>${this.escapeHtml(s.bank_name)}</strong><br>
            <span style="font-family:monospace; font-weight:700; font-size:.9rem; color:var(--text);">${this.escapeHtml(s.account_number)}</span>
            <button type="button" class="btn-sm btn-sm-view" style="padding:.15rem .45rem; font-size:.7rem; margin-left:.3rem;" onclick="schoolController.copyToClipboard('${this.escapeHtml(s.account_number)}', 'Account Number')">📋 Copy</button>
            <br><small style="color:var(--muted);">${this.escapeHtml(s.account_name)}</small>
          </div>
        `;
      } else {
        bankHtml = `<span class="badge badge-red" style="font-size:.72rem;">⚠️ Bank Details Missing</span>`;
      }

      let statusHtml = '';
      let actionButtons = '';

      if (s.is_paid_this_month) {
        const isPstkPaid = (s.payout_info?.payment_method === 'paystack_transfer') || (s.payout_info?.reference && s.payout_info.reference.includes('PSTK'));
        statusHtml = isPstkPaid
          ? `<span class="badge badge-green" style="font-size:.72rem; font-weight:750;">⚡ Paystack Paid</span>`
          : `<span class="badge badge-green">Paid ✓</span>`;
        const ref = s.payout_info?.reference || '';
        actionButtons = `
          <div style="display:flex; gap:.35rem; flex-wrap:wrap;">
            <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.viewPayslip('${this.escapeHtml(ref)}')">📄 Payslip</button>
            <button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openAdminStaffBankModal(${s.id})" title="Edit Bank Details or Salary">✏ Edit</button>
          </div>
        `;
      } else {
        statusHtml = `<span class="badge badge-gold">Pending Disbursal</span>`;
        if (s.has_bank_details) {
          actionButtons = `
            <div style="display:flex; gap:.35rem; flex-wrap:wrap;">
              <button type="button" class="btn-sm" style="background:#0b2d4b; color:white; border-radius:6px; font-weight:750; padding:.3rem .6rem;" onclick="schoolController.openProcessSalaryModal(${s.id}, 'paystack_transfer')" title="Disburse salary via Paystack automated bank transfer">⚡ Paystack Remit</button>
              <button type="button" class="btn-sm btn-sm-enroll" onclick="schoolController.openProcessSalaryModal(${s.id}, 'platform_transfer')">💳 Pay Salary</button>
              <button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openAdminStaffBankModal(${s.id})" title="Edit Bank Details or Salary">✏ Edit</button>
            </div>
          `;
        } else {
          actionButtons = `
            <button type="button" class="btn-sm btn-sm-edit" onclick="schoolController.openAdminStaffBankModal(${s.id})">+ Add Bank Details</button>
          `;
        }
      }

      return `
        <tr>
          <td><strong style="font-family:monospace; font-size:.82rem;">${this.escapeHtml(s.formatted_id)}</strong></td>
          <td><strong>${this.escapeHtml(s.name)}</strong><br><small style="color:var(--muted);">${this.escapeHtml(s.email)}</small></td>
          <td><span class="badge badge-blue" style="font-size:.72rem;">${this.escapeHtml(s.department || 'Science')}</span><br><small style="color:var(--text); font-weight:600;">${this.escapeHtml(s.assigned_subject || 'General')}</small></td>
          <td>${bankHtml}</td>
          <td><strong style="font-size:.95rem; color:var(--text);">${this.escapeHtml(s.monthly_salary_formatted)}</strong></td>
          <td>${statusHtml}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');
  },

  openStaffBankModal(staffData) {
    const modal = this.element('staffBankModal');
    if (!modal) return;

    const idInput = this.element('bankModalStaffId');
    const bankSelect = this.element('bankModalBankSelect');
    const accNumInput = this.element('bankModalAccountNumber');
    const accNameInput = this.element('bankModalAccountName');
    const salaryGroup = this.element('bankModalSalaryGroup');
    const salaryInput = this.element('bankModalMonthlySalary');
    const staffNotice = this.element('bankModalStaffNotice');

    const isAdmin = schoolModel.user && schoolModel.user.role === 'admin';

    if (idInput) idInput.value = staffData?.id || '';
    if (bankSelect) bankSelect.value = staffData?.bank_name || '';
    if (accNumInput) accNumInput.value = staffData?.account_number || '';
    if (accNameInput) accNameInput.value = staffData?.account_name || '';

    if (salaryGroup && salaryInput) {
      if (isAdmin) {
        salaryGroup.style.display = 'block';
        salaryInput.value = staffData?.monthly_salary || 75000;
      } else {
        salaryGroup.style.display = 'none';
      }
    }

    if (staffNotice) {
      if (staffData && staffData.name) {
        staffNotice.textContent = `Configuring payout bank account for ${staffData.name} (${staffData.formatted_id || ''})`;
        staffNotice.style.display = 'block';
      } else {
        staffNotice.style.display = 'none';
      }
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeStaffBankModal() {
    const modal = this.element('staffBankModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  openProcessSalaryModal(staff, preferredMethod = 'paystack_transfer') {
    const modal = this.element('processSalaryModal');
    if (!modal) return;

    this.element('salaryStaffId').value = staff.id;
    this.element('salaryStaffName').textContent = staff.name;
    this.element('salaryStaffIdDisplay').textContent = staff.formatted_id;
    this.element('salaryStaffDept').textContent = `${staff.department} · ${staff.assigned_subject}`;
    this.element('salaryBankDisplay').textContent = `${staff.bank_name} - ${staff.account_number} (${staff.account_name})`;

    const methodSelect = this.element('salaryPaymentMethodSelect');
    if (methodSelect) {
      methodSelect.value = preferredMethod;
    }

    const pstkBal = schoolModel.paystackSettings?.balance_ngn ?? 2450000;
    const balDisplay = this.element('salaryModalPaystackBalance');
    if (balDisplay) {
      balDisplay.textContent = '₦' + Number(pstkBal).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    }

    const baseInput = this.element('salaryBaseAmountInput');
    const bonusInput = this.element('salaryBonusInput');
    const deductInput = this.element('salaryDeductionsInput');

    if (baseInput) baseInput.value = staff.monthly_salary || 75000;
    if (bonusInput) bonusInput.value = 0;
    if (deductInput) deductInput.value = 0;

    schoolController.calculateSalaryNetPayPreview();

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeProcessSalaryModal() {
    const modal = this.element('processSalaryModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  renderSinglePayslipModal(payslip) {
    const modal = this.element('payslipModal');
    if (!modal || !payslip) return;

    this.element('payslipRefNumber').textContent = payslip.reference || 'PAYROLL-REF';
    this.element('payslipDate').textContent = payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    this.element('payslipPeriod').textContent = payslip.month_year || 'Current Month';
    this.element('payslipStaffName').textContent = payslip.staff_name || payslip.staff_full_name || 'Staff Member';
    this.element('payslipStaffId').textContent = 'STF-' + String(payslip.staff_id).padStart(4, '0');
    this.element('payslipDept').textContent = `${payslip.department || 'Academic'} Department · Course: ${payslip.subject || 'Teaching'}`;
    this.element('payslipBank').textContent = `${payslip.bank_name} · ${payslip.account_number}`;
    this.element('payslipAccountName').textContent = payslip.account_name || '—';

    const isPstkTransfer = (payslip.payment_method === 'paystack_transfer') || (payslip.reference && payslip.reference.includes('PSTK'));
    const methodEl = this.element('payslipMethod');
    if (methodEl) {
      if (isPstkTransfer) {
        methodEl.className = 'badge badge-green';
        methodEl.textContent = '⚡ PAYSTACK AUTOMATED TRANSFER';
      } else {
        methodEl.className = 'badge badge-gold';
        methodEl.textContent = (payslip.payment_method || 'Platform Transfer').replace('_', ' ').toUpperCase();
      }
    }

    const base = parseFloat(payslip.amount) || 0;
    const bonus = parseFloat(payslip.bonus) || 0;
    const deduct = parseFloat(payslip.deductions) || 0;
    const net = parseFloat(payslip.net_amount) || (base + bonus - deduct);

    this.element('payslipBaseAmount').textContent = '₦' + base.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    this.element('payslipBonusAmount').textContent = bonus > 0 ? '+₦' + bonus.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '₦0.00';
    this.element('payslipDeductAmount').textContent = deduct > 0 ? '-₦' + deduct.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '₦0.00';
    this.element('payslipNetAmount').textContent = '₦' + net.toLocaleString('en-NG', { minimumFractionDigits: 2 });

    let notesText = payslip.notes || 'Official teaching compensation remittance';
    if (isPstkTransfer && !notesText.includes('NIBSS')) {
      notesText += ' • Instant NIBSS Settlement Verified';
    }
    this.element('payslipNotes').textContent = notesText;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closePayslipModal() {
    const modal = this.element('payslipModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  /* ------------------------------------------------------------------------
     ALOC STATION API VIEW METHODS (STUDENT, STAFF, ADMIN)
     ------------------------------------------------------------------------ */

  // 1. STUDENT ALOC CBT SETUP & CONTROLS
  renderStudentAlocSetup(settings, enrolledSubjects = []) {
    const disabledAlert = this.element('studentAlocDisabledAlert');
    const activeContainer = this.element('studentAlocActiveContainer');
    const statusBadge = this.element('studentAlocStatusBadge');
    const planBadge = this.element('studentAlocPlanBadge');
    const subjectSelect = this.element('alocSubject');

    if (planBadge && settings.plan_tier) {
      planBadge.textContent = `${settings.plan_tier} CBT`;
    }

    if (!settings.is_enabled) {
      if (disabledAlert) disabledAlert.classList.remove('hidden');
      if (activeContainer) activeContainer.classList.add('hidden');
      if (statusBadge) {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● ALOC API Deactivated';
      }
      return;
    }

    if (disabledAlert) disabledAlert.classList.add('hidden');
    if (activeContainer) activeContainer.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.className = 'aloc-status-badge online';
      statusBadge.textContent = '● ALOC API Live';
    }

    // Populate enrolled subjects
    if (subjectSelect) {
      const defaultSubjects = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature in English', 'Financial Accounting', 'Commerce', 'Christian Religious Studies', 'Civic Education', 'Further Mathematics', 'Agricultural Science'];
      const subjectsToUse = (Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0)
        ? enrolledSubjects
        : defaultSubjects;

      subjectSelect.innerHTML = subjectsToUse.map(sub => `<option value="${this.escapeHtml(sub)}">${this.escapeHtml(sub)}</option>`).join('');
    }
  },

  // 2. STUDENT ACTIVE CBT QUESTION & NAVIGATOR
  renderStudentAlocActiveQuestion(quizState) {
    const configCard = this.element('studentAlocConfigCard');
    const quizCard = this.element('studentAlocQuizCard');
    const resultCard = this.element('studentAlocResultCard');
    const reviewCard = this.element('studentAlocReviewCard');

    if (configCard) configCard.classList.add('hidden');
    if (resultCard) resultCard.classList.add('hidden');
    if (reviewCard) reviewCard.classList.add('hidden');
    if (quizCard) quizCard.classList.remove('hidden');

    const q = quizState.questions[quizState.currentIndex];
    if (!q) return;

    // Badges & Counter
    const examBadge = this.element('quizExamBadge');
    if (examBadge) examBadge.textContent = `${q.examtype || quizState.examType.toUpperCase()} ${q.examyear || quizState.year}`;
    const subjectBadge = this.element('quizSubjectBadge');
    if (subjectBadge) subjectBadge.textContent = q.subject || quizState.subject;
    const counter = this.element('quizQuestionCounter');
    if (counter) counter.textContent = `Question ${quizState.currentIndex + 1} of ${quizState.questions.length}`;
    const qId = this.element('quizQuestionId');
    if (qId) qId.textContent = `ID: #${q.id || (quizState.currentIndex + 1)}`;

    // Question Text
    const qText = this.element('quizQuestionText');
    if (qText) qText.textContent = q.question;

    // Options A, B, C, D
    const options = q.option || {};
    ['a', 'b', 'c', 'd'].forEach(key => {
      const optEl = this.element(`optText${key.toUpperCase()}`);
      if (optEl) optEl.textContent = options[key] || '';
    });

    // Update selected state
    const currentAnswer = quizState.userAnswers[quizState.currentIndex];
    const optButtons = document.querySelectorAll('#quizOptionsList .aloc-opt-btn');
    optButtons.forEach(btn => btn.classList.remove('selected'));
    if (currentAnswer) {
      const idx = ['a', 'b', 'c', 'd'].indexOf(currentAnswer);
      if (idx !== -1 && optButtons[idx]) {
        optButtons[idx].classList.add('selected');
      }
    }

    // Flag button text
    const flagBtn = this.element('btnFlagQuestion');
    if (flagBtn) {
      const isFlagged = !!quizState.flagged[quizState.currentIndex];
      flagBtn.textContent = isFlagged ? '🚩 Flagged' : '🚩 Flag Question';
      flagBtn.style.color = isFlagged ? '#ca8a04' : 'var(--text)';
      flagBtn.style.borderColor = isFlagged ? '#eab308' : 'var(--border)';
    }

    // Navigation pills
    const navGrid = this.element('quizNavGrid');
    if (navGrid) {
      navGrid.innerHTML = quizState.questions.map((item, idx) => {
        let cls = 'aloc-nav-pill';
        if (idx === quizState.currentIndex) cls += ' active';
        if (quizState.userAnswers[idx]) cls += ' answered';
        if (quizState.flagged[idx]) cls += ' flagged';
        return `<button type="button" class="${cls}" onclick="schoolController.goToAlocQuestion(${idx})">${idx + 1}</button>`;
      }).join('');
    }

    // Prev / Next button states
    const prevBtn = this.element('btnPrevQuestion');
    if (prevBtn) {
      prevBtn.disabled = (quizState.currentIndex === 0);
      prevBtn.style.opacity = (quizState.currentIndex === 0) ? '0.5' : '1';
    }
    const nextBtn = this.element('btnNextQuestion');
    if (nextBtn) {
      const isLast = (quizState.currentIndex === quizState.questions.length - 1);
      nextBtn.textContent = isLast ? 'Finish Test' : 'Next →';
    }
  },

  // 3. STUDENT QUIZ RESULTS SCREEN
  renderStudentAlocResults(result) {
    const quizCard = this.element('studentAlocQuizCard');
    const resultCard = this.element('studentAlocResultCard');
    const reviewCard = this.element('studentAlocReviewCard');

    if (quizCard) quizCard.classList.add('hidden');
    if (reviewCard) reviewCard.classList.add('hidden');
    if (resultCard) resultCard.classList.remove('hidden');

    const scoreEl = this.element('resultScoreText');
    const percentEl = this.element('resultPercentText');
    const gradeEl = this.element('resultGradeText');
    const timeEl = this.element('resultTimeText');
    const emojiEl = this.element('resultEmoji');
    const headEl = this.element('resultHeading');

    if (scoreEl) scoreEl.textContent = `${result.score} / ${result.total}`;
    if (percentEl) percentEl.textContent = `${result.percentage}%`;
    if (timeEl) timeEl.textContent = result.timeSpent || '05:00';

    if (gradeEl) {
      if (result.percentage >= 75) {
        gradeEl.textContent = 'A (Distinction)';
        gradeEl.style.color = 'var(--success)';
        if (emojiEl) emojiEl.textContent = '🏆';
        if (headEl) headEl.textContent = 'Outstanding Performance!';
      } else if (result.percentage >= 60) {
        gradeEl.textContent = 'B (Credit)';
        gradeEl.style.color = 'var(--primary)';
        if (emojiEl) emojiEl.textContent = '🎉';
        if (headEl) headEl.textContent = 'Great Work!';
      } else if (result.percentage >= 50) {
        gradeEl.textContent = 'C (Pass)';
        gradeEl.style.color = '#ca8a04';
        if (emojiEl) emojiEl.textContent = '👍';
        if (headEl) headEl.textContent = 'Good Effort - Keep Practicing!';
      } else {
        gradeEl.textContent = 'F (Needs Improvement)';
        gradeEl.style.color = 'var(--danger)';
        if (emojiEl) emojiEl.textContent = '📚';
        if (headEl) headEl.textContent = 'Practice Makes Perfect!';
      }
    }
  },

  // 4. STUDENT WORKED EXPLANATIONS REVIEW
  renderStudentAlocReview(questions, userAnswers) {
    const resultCard = this.element('studentAlocResultCard');
    const reviewCard = this.element('studentAlocReviewCard');
    const listEl = this.element('quizReviewList');

    if (resultCard) resultCard.classList.add('hidden');
    if (reviewCard) reviewCard.classList.remove('hidden');

    if (!listEl) return;

    listEl.innerHTML = questions.map((q, idx) => {
      const studentAns = (userAnswers[idx] || '').toLowerCase();
      const correctAns = (q.answer || 'a').toLowerCase();
      const isCorrect = (studentAns === correctAns);

      const options = q.option || {};
      const optionsHtml = ['a', 'b', 'c', 'd'].map(optKey => {
        let style = 'padding:.65rem .9rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); margin-bottom:.4rem; font-size:.9rem; display:flex; align-items:center; gap:.6rem;';
        let badge = `<span style="font-weight:800; font-family:monospace; min-width:24px;">${optKey.toUpperCase()}.</span>`;
        let tag = '';

        if (optKey === correctAns) {
          style += ' border-color:var(--success); background:rgba(34,197,94,.12); color:#15803d; font-weight:750;';
          tag = `<span class="badge badge-green" style="margin-left:auto; font-size:.7rem;">✓ Correct Answer</span>`;
        } else if (optKey === studentAns && !isCorrect) {
          style += ' border-color:var(--danger); background:rgba(239,68,68,.1); color:var(--danger); font-weight:750;';
          tag = `<span class="badge badge-red" style="margin-left:auto; font-size:.7rem;">✗ Your Choice</span>`;
        }

        return `<div style="${style}">${badge} <span>${this.escapeHtml(options[optKey] || '')}</span> ${tag}</div>`;
      }).join('');

      return `
        <div class="card" style="border-left: 4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.6rem;">
            <div style="display:flex; align-items:center; gap:.5rem;">
              <span class="badge ${isCorrect ? 'badge-green' : 'badge-red'}">Question ${idx + 1}</span>
              <span class="badge badge-blue">${this.escapeHtml(q.subject || 'Subject')} • ${this.escapeHtml(q.examtype || 'WAEC')} ${this.escapeHtml(q.examyear || '')}</span>
            </div>
            <span style="font-weight:800; font-size:.85rem; color:${isCorrect ? 'var(--success)' : 'var(--danger)'};">
              ${isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
            </span>
          </div>

          <h4 style="font-size:1.05rem; line-height:1.5; margin:0 0 1rem; color:var(--text);">${this.escapeHtml(q.question)}</h4>

          <div style="margin-bottom:1rem;">
            ${optionsHtml}
          </div>

          <div class="aloc-explanation-box">
            <strong style="color:var(--primary); font-size:.85rem; display:block; margin-bottom:.3rem;">💡 Step-by-Step Worked Explanation (L3):</strong>
            <p style="margin:0; font-size:.88rem; color:var(--text);">${this.escapeHtml(q.solution || 'Standard derivation applied.')}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  // 5. STAFF ALOC CURRICULUM EXPLORER & QUESTION CARDS
  renderStaffAlocSchool(settings, questions = []) {
    const statusBadge = this.element('staffAlocStatusBadge');
    const planBadge = this.element('staffAlocPlanBadge');
    const listEl = this.element('staffAlocQuestionsList');

    if (planBadge && settings.plan_tier) planBadge.textContent = `${settings.plan_tier} Tier`;
    if (statusBadge) {
      if (settings.is_enabled) {
        statusBadge.className = 'aloc-status-badge online';
        statusBadge.textContent = '● ALOC API Live';
      } else {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● Deactivated by Admin';
      }
    }

    if (!listEl) return;

    if (!settings.is_enabled) {
      listEl.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--danger); background: rgba(239, 68, 68, 0.05);">
          <h3 style="color:var(--danger); margin:0 0 .4rem;">ALOC Station API Currently Deactivated</h3>
          <p style="margin:0; font-size:.9rem; color:var(--text);">The school administrator has temporarily removed/deactivated the ALOC Station API. Question bank exploration and CBT features are paused until re-enabled.</p>
        </div>
      `;
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      listEl.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--muted);">No questions currently loaded. Click <strong>"Browse Questions"</strong> above to explore the curriculum.</div>`;
      return;
    }

    listEl.innerHTML = questions.map((q, idx) => {
      const options = q.option || {};
      const optionsHtml = ['a', 'b', 'c', 'd'].map(key => {
        const isAnswer = (key.toLowerCase() === (q.answer || 'a').toLowerCase());
        const style = isAnswer 
          ? 'padding:.45rem .8rem; border-radius:6px; background:rgba(34,197,94,.12); color:#15803d; font-weight:750; border:1px solid rgba(34,197,94,.3);'
          : 'padding:.45rem .8rem; border-radius:6px; background:var(--bg); border:1px solid var(--border); color:var(--text);';
        return `
          <div style="${style} margin-bottom:.3rem; font-size:.88rem; display:flex; align-items:center; gap:.5rem;">
            <strong style="font-family:monospace;">${key.toUpperCase()}.</strong>
            <span>${this.escapeHtml(options[key] || '')}</span>
            ${isAnswer ? '<span class="badge badge-green" style="margin-left:auto; font-size:.65rem;">Correct Answer</span>' : ''}
          </div>
        `;
      }).join('');

      const serializedQ = JSON.stringify(q).replace(/"/g, '&quot;');

      return `
        <div class="card" style="border-left:4px solid var(--primary);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:.8rem; margin-bottom:.8rem;">
            <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
              <span class="badge badge-blue">Question #${idx + 1}</span>
              <span class="badge badge-gold">${this.escapeHtml(q.subject || 'Subject')}</span>
              <span class="badge badge-green">${this.escapeHtml(q.examtype || 'WAEC')} ${this.escapeHtml(q.examyear || '')}</span>
            </div>
            <button type="button" class="btn-sm btn-primary" onclick="schoolController.staffAddQuestionToAssignment(${serializedQ})" style="padding:.45rem 1rem; border-radius:8px; font-weight:750;">
              ➕ Add to Classroom Assignment
            </button>
          </div>

          <h3 style="font-size:1.1rem; line-height:1.5; margin:0 0 1rem; color:var(--text); font-weight:650;">${this.escapeHtml(q.question)}</h3>

          <div style="margin-bottom:1rem;">
            ${optionsHtml}
          </div>

          <div class="aloc-explanation-box">
            <strong style="color:var(--primary); font-size:.84rem; display:block; margin-bottom:.25rem;">💡 Official Worked Solution & Marking Guide:</strong>
            <p style="margin:0; font-size:.86rem; color:var(--text); line-height:1.45;">${this.escapeHtml(q.solution || 'Standard academic derivation.')}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  // 6. ADMIN ALOC CONTROL, SUBSCRIPTIONS & NOTIFICATIONS
  renderAdminAlocSchool(settings, notifications = []) {
    const statusBadge = this.element('adminAlocStatusBadge');
    const planBadge = this.element('adminAlocPlanBadge');
    const actionBtnContainer = this.element('adminAlocActionBtnContainer');
    const statusDesc = this.element('adminAlocStatusDescription');
    const statusPill = this.element('adminAlocStatusPill');

    const isEnabled = !!settings.is_enabled;

    if (planBadge && settings.plan_tier) planBadge.textContent = `${settings.plan_tier} Tier`;

    if (statusBadge) {
      if (isEnabled) {
        statusBadge.className = 'aloc-status-badge online';
        statusBadge.textContent = '● Active & Online';
      } else {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● Removed / Deactivated';
      }
    }

    if (actionBtnContainer) {
      actionBtnContainer.innerHTML = isEnabled
        ? `<button type="button" class="btn-sm btn-sm-danger" id="adminToggleAlocBtn" onclick="schoolController.adminToggleAlocApi(false)" style="padding:.6rem 1.4rem; font-weight:800; border-radius:10px;">🚫 Remove ALOC Station API</button>`
        : `<button type="button" class="btn-sm btn-primary" id="adminToggleAlocBtn" onclick="schoolController.adminToggleAlocApi(true)" style="padding:.6rem 1.4rem; font-weight:800; border-radius:10px;">✅ Enable ALOC Station API</button>`;
    }

    if (statusDesc) {
      statusDesc.innerHTML = isEnabled
        ? `The ALOC Station API is currently <strong style="color:var(--success);">ACTIVE</strong> across the school. Students can practice CBT past questions and teachers can explore questions and worked explanations.`
        : `The ALOC Station API has been <strong style="color:var(--danger);">DEACTIVATED / REMOVED</strong> by the administration. Student and staff CBT practice modules are temporarily offline.`;
    }

    if (statusPill) {
      statusPill.innerHTML = isEnabled
        ? `<span class="badge badge-green" style="font-size:.85rem; padding:.35rem .75rem;">Status: Enabled</span>`
        : `<span class="badge badge-red" style="font-size:.85rem; padding:.35rem .75rem;">Status: Deactivated</span>`;
    }

    // Credits Quota Meter
    const rem = parseInt(settings.credits_remaining || 0, 10);
    const tot = parseInt(settings.credits_total || 50000, 10);
    const pct = tot > 0 ? Math.round((rem / tot) * 100) : 0;

    const metricText = this.element('adminCreditMetricText');
    if (metricText) metricText.textContent = `${rem.toLocaleString()} / ${tot.toLocaleString()} Credits (${pct}% Remaining)`;

    const meterFill = this.element('adminCreditMeterFill');
    if (meterFill) {
      meterFill.style.width = `${pct}%`;
      meterFill.style.background = pct < 20 ? 'var(--danger)' : (pct < 50 ? '#eab308' : 'linear-gradient(90deg, var(--primary) 0%, #22c55e 100%)');
    }

    const renewalDate = this.element('adminRenewalDateDisplay');
    if (renewalDate && settings.renewal_date) {
      renewalDate.textContent = `Auto-Renewal: ${settings.renewal_date}`;
    }

    // Highlight active plan card
    ['Discovery', 'Pro', 'Enterprise'].forEach(tier => {
      const card = this.element(`planCard${tier}`);
      const check = this.element(`planCheck${tier}`);
      if (card && check) {
        const matches = (settings.plan_tier || '').toLowerCase().includes(tier.toLowerCase());
        if (matches) {
          card.classList.add('active');
          check.style.display = 'inline';
        } else {
          card.classList.remove('active');
          check.style.display = 'none';
        }
      }
    });

    // API Key input
    const keyInput = this.element('adminAlocKeyInput');
    if (keyInput && settings.api_key) {
      keyInput.value = settings.api_key;
    }

    // Notifications List
    const notifList = this.element('adminAlocNotifList');
    if (notifList) {
      const notifs = Array.isArray(notifications) && notifications.length > 0
        ? notifications
        : (settings.notifications || []);

      if (notifs.length === 0) {
        notifList.innerHTML = `<div style="color:var(--muted); font-size:.88rem; padding:.5rem 0;">No active broadcasts or alerts from ALOC Station.</div>`;
      } else {
        notifList.innerHTML = notifs.map(n => {
          let badgeClass = 'badge-blue';
          let icon = '📢';
          if (n.type === 'success') { badgeClass = 'badge-green'; icon = '✅'; }
          else if (n.type === 'alert') { badgeClass = 'badge-red'; icon = '⚠️'; }

          return `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:1rem 1.15rem; border-radius:10px; background:var(--bg); border:1px solid var(--border); gap:1rem;">
              <div style="display:flex; align-items:flex-start; gap:.8rem;">
                <span style="font-size:1.3rem;">${icon}</span>
                <div>
                  <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:.2rem;">
                    <strong style="color:var(--text); font-size:.92rem;">${this.escapeHtml(n.title)}</strong>
                    <span class="badge ${badgeClass}" style="font-size:.68rem;">${this.escapeHtml(n.type || 'info')}</span>
                    <small style="color:var(--muted); font-size:.74rem;">${this.escapeHtml(n.date || '')}</small>
                  </div>
                  <p style="margin:0; font-size:.84rem; color:var(--muted); line-height:1.45;">${this.escapeHtml(n.message)}</p>
                </div>
              </div>
              <button type="button" onclick="schoolController.adminDismissNotif('${this.escapeHtml(n.id)}')" title="Dismiss notification" style="background:transparent; border:0; color:var(--muted); font-size:1.15rem; cursor:pointer; padding:.2rem .4rem; line-height:1;">×</button>
            </div>
          `;
        }).join('');
      }
    }
  },

  // 7. ADMIN PAYSTACK GATEWAY CONTROL, DECISIONS & NOTIFICATIONS
  renderAdminPaystackSettings(settings, notifications = []) {
    if (!settings) return;

    const isEnabled = !!settings.is_enabled;
    const isLive = settings.environment === 'live';
    const balanceNgn = parseFloat(settings.balance_ngn || 0);

    // Badges
    const statusBadge = this.element('adminPaystackStatusBadge');
    if (statusBadge) {
      if (isEnabled) {
        statusBadge.className = 'aloc-status-badge online';
        statusBadge.textContent = '● Active & Online';
      } else {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● Removed / Deactivated';
      }
    }

    const envBadge = this.element('adminPaystackEnvBadge');
    if (envBadge) {
      envBadge.className = isLive ? 'badge badge-green' : 'badge badge-blue';
      envBadge.textContent = isLive ? 'Live Production' : 'Test Mode';
    }

    const heroBalance = this.element('adminPaystackHeroBalanceBadge');
    if (heroBalance) {
      heroBalance.textContent = `Wallet: ₦${balanceNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Toggle button container
    const actionBtnContainer = this.element('adminPaystackActionBtnContainer');
    if (actionBtnContainer) {
      actionBtnContainer.innerHTML = isEnabled
        ? `<button type="button" class="btn-sm btn-sm-danger" id="adminTogglePaystackBtn" onclick="schoolController.adminTogglePaystackApi(false)" style="padding:.6rem 1.4rem; font-weight:800; border-radius:10px;">🚫 Remove Paystack API</button>`
        : `<button type="button" class="btn-sm btn-primary" id="adminTogglePaystackBtn" onclick="schoolController.adminTogglePaystackApi(true)" style="padding:.6rem 1.4rem; font-weight:800; border-radius:10px;">✅ Enable Paystack API</button>`;
    }

    // Status description
    const statusDesc = this.element('adminPaystackStatusDescription');
    if (statusDesc) {
      statusDesc.innerHTML = isEnabled
        ? `The Paystack API is currently <strong style="color:var(--success);">ACTIVE</strong>. Students can pay tuition fees online (with automatic portal unlocking), and staff salaries can be remitted directly to their bank accounts.`
        : `The Paystack API has been <strong style="color:var(--danger);">DEACTIVATED / REMOVED</strong> by the administration. Student online card/bank checkouts and automated payroll transfers are temporarily offline.`;
    }

    // Status pill
    const statusPill = this.element('adminPaystackStatusPill');
    if (statusPill) {
      statusPill.innerHTML = isEnabled
        ? `<span class="badge badge-green" style="font-size:.85rem; padding:.35rem .75rem;">Status: Enabled</span>`
        : `<span class="badge badge-red" style="font-size:.85rem; padding:.35rem .75rem;">Status: Deactivated</span>`;
    }

    // Form inputs
    const envSelect = this.element('adminPaystackEnvSelect');
    if (envSelect && settings.environment) envSelect.value = settings.environment;

    const feeBearer = this.element('adminPaystackFeeBearerSelect');
    if (feeBearer && settings.fee_bearer) feeBearer.value = settings.fee_bearer;

    const payrollMode = this.element('adminPaystackPayrollModeSelect');
    if (payrollMode && settings.payroll_transfer_mode) payrollMode.value = settings.payroll_transfer_mode;

    const merchantName = this.element('adminPaystackMerchantName');
    if (merchantName && settings.merchant_name) merchantName.value = settings.merchant_name;

    const pubKey = this.element('adminPaystackPublicKey');
    if (pubKey && settings.public_key) pubKey.value = settings.public_key;

    const secKey = this.element('adminPaystackSecretKey');
    if (secKey && settings.secret_key) secKey.value = settings.secret_key;

    // Balance overview display
    const balanceDisplay = this.element('adminPaystackBalanceDisplay');
    if (balanceDisplay) {
      balanceDisplay.textContent = `₦${balanceNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Notifications List
    const notifList = this.element('adminPaystackNotifList');
    if (notifList) {
      const notifs = Array.isArray(notifications) && notifications.length > 0
        ? notifications
        : (settings.notifications || []);

      if (notifs.length === 0) {
        notifList.innerHTML = `<div style="color:var(--muted); font-size:.88rem; padding:.5rem 0;">No active broadcasts or webhook alerts from Paystack Gateway.</div>`;
      } else {
        notifList.innerHTML = notifs.map(n => {
          let badgeClass = 'badge-blue';
          let icon = '💳';
          if (n.type === 'success') { badgeClass = 'badge-green'; icon = '✅'; }
          else if (n.type === 'alert') { badgeClass = 'badge-red'; icon = '⚠️'; }

          return `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:1rem 1.15rem; border-radius:10px; background:var(--bg); border:1px solid var(--border); gap:1rem;">
              <div style="display:flex; align-items:flex-start; gap:.8rem;">
                <span style="font-size:1.3rem;">${icon}</span>
                <div>
                  <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:.2rem;">
                    <strong style="color:var(--text); font-size:.92rem;">${this.escapeHtml(n.title)}</strong>
                    <span class="badge ${badgeClass}" style="font-size:.68rem;">${this.escapeHtml(n.type || 'info')}</span>
                    <small style="color:var(--muted); font-size:.74rem;">${this.escapeHtml(n.date || '')}</small>
                  </div>
                  <p style="margin:0; font-size:.84rem; color:var(--muted); line-height:1.45;">${this.escapeHtml(n.message)}</p>
                </div>
              </div>
              <button type="button" onclick="schoolController.adminDismissPaystackNotif('${this.escapeHtml(n.id)}')" title="Dismiss notification" style="background:transparent; border:0; color:var(--muted); font-size:1.15rem; cursor:pointer; padding:.2rem .4rem; line-height:1;">×</button>
            </div>
          `;
        }).join('');
      }
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};