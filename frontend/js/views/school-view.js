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
    await schoolController.loadAcademicSession();
    await schoolController.loadAdminStudents();
    await schoolController.loadAdminStudentVerifications();
    await schoolController.loadAdminResources();
    await schoolController.loadAdminTimetable();
    await schoolController.loadAdminScoresheet();
    await schoolController.loadAdminFees();
    await schoolController.loadAdminPayrollInfo();
    await schoolController.loadAdminPaystackSettings();
    await schoolController.loadAlocSchool('admin');
    await schoolController.loadAdminAnalytics();
    await schoolController.loadAdminNotices();
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

    // Staff Hero Banner initials
    const nameParts = name.trim().split(/\s+/);
    const initials = nameParts.length >= 2 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
    const avatarInitials = this.element('staffAvatarInitials');
    if (avatarInitials) avatarInitials.textContent = initials;

    const staffIdBadge = this.element('staffIdBadge');
    if (staffIdBadge) staffIdBadge.textContent = `ID: ${staffId}`;

    const staffDeptBadge = this.element('staffDeptBadge');
    if (staffDeptBadge) staffDeptBadge.textContent = `${dept} Faculty`;

    const staffActiveCourseText = this.element('staffActiveCourseText');
    if (staffActiveCourseText) {
      const course = (schoolModel.user && schoolModel.user.course) ? schoolModel.user.course : `${dept} & General Studies`;
      staffActiveCourseText.textContent = course;
    }

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

    await schoolController.loadAcademicSession();
    await schoolController.loadStaffStudents();
    await schoolController.loadStaffResources();
    await schoolController.loadStaffTimetable();
    await schoolController.loadStaffSubmissions();
    await schoolController.loadStaffScoresheet();
    await schoolController.loadStaffPayrollInfo();
    await schoolController.loadStaffNotices();

    // Calculate pending grading submissions and subject mastery stats
    const submissions = schoolModel.staffSubmissions || [];
    let pendingCount = 0;
    let totalScore = 0;
    let gradedCount = 0;
    const gradeCounts = { 'A1': 0, 'B2': 0, 'B3': 0, 'C4': 0, 'C5': 0, 'C6': 0, 'D7': 0, 'E8': 0, 'F9': 0 };

    submissions.forEach(s => {
      if (!s.score || s.score === 'Pending' || s.score === null) {
        pendingCount++;
      } else {
        gradedCount++;
        const numericScore = parseFloat(String(s.score).replace(/[^0-9.]/g, ''));
        if (!isNaN(numericScore)) {
          totalScore += numericScore;
          if (numericScore >= 80) gradeCounts['A1']++;
          else if (numericScore >= 75) gradeCounts['B2']++;
          else if (numericScore >= 70) gradeCounts['B3']++;
          else if (numericScore >= 65) gradeCounts['C4']++;
          else if (numericScore >= 60) gradeCounts['C5']++;
          else if (numericScore >= 50) gradeCounts['C6']++;
          else if (numericScore >= 45) gradeCounts['D7']++;
          else if (numericScore >= 40) gradeCounts['E8']++;
          else gradeCounts['F9']++;
        }
      }
    });

    const pendingEl = this.element('staffPendingGradingCount');
    if (pendingEl) pendingEl.textContent = String(pendingCount);

    const masteryEl = this.element('staffMasteryScoreDisplay');
    if (masteryEl) {
      const avg = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : '84.5';
      masteryEl.textContent = `${avg}%`;
    }

    // Default grade count seed if submissions are few
    if (gradedCount === 0) {
      gradeCounts['A1'] = 8;
      gradeCounts['B2'] = 14;
      gradeCounts['B3'] = 11;
      gradeCounts['C4'] = 7;
      gradeCounts['C5'] = 4;
      gradeCounts['C6'] = 2;
    }

    // Render Staff Class Grade Distribution Chart
    this.renderStaffGradeDistributionChart(gradeCounts);
  },

  renderStaffGradeDistributionChart(gradeCounts = {}) {
    const labels = Object.keys(gradeCounts);
    const data = Object.values(gradeCounts);

    this._safeChartCreate('staffGradeDistChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Students in Grade Band',
          data: data,
          backgroundColor: [
            '#10b981', '#059669', '#3b82f6', '#2563eb', 
            '#6366f1', '#8b5cf6', '#f59e0b', '#d97706', '#ef4444'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: 'var(--muted)', font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          x: {
            ticks: { color: 'var(--muted)', font: { size: 10, weight: '700' } },
            grid: { display: false }
          }
        }
      }
    });
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
    await schoolController.loadAcademicSession();
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
      textbooks: 'Textbooks',
      leaderboard: 'Academic Leaderboard & Rankings',
      analytics: 'Academic Analytics & Exam Insights',
      notices: 'Official School Notices',
      chat: 'Campus Chat & DMs'
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

    // Resize Chart.js canvases inside newly displayed workspace page
    setTimeout(() => {
      if (window._appCharts) {
        Object.values(window._appCharts).forEach(c => {
          try { c.resize(); } catch (e) {}
        });
      }
    }, 80);

    // Scroll smoothly to top of the content area so view resets cleanly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* Switch between dedicated pages in Staff Workspace */
  switchStaffPage(pageId) {
    const titles = {
      overview: 'Dashboard Overview',
      school: 'School (ALOC Station)',
      chat: 'School Chat & DMs',
      roster: 'Course Enrollment Roster',
      assignments: 'Classwork & Assignments',
      timetable: 'Teaching Schedule & Meet',
      scoresheet: 'General Score Sheet',
      resources: 'Learning Resources Repository',
      payroll: 'My Salary & Remittance',
      leaderboard: 'Student Leaderboard',
      notices: 'Notices & Bulletins Hub'
    };
    const activeTitle = titles[pageId] || 'Dashboard Overview';

    document.querySelectorAll('#staffWorkspaceDropdownMenu .ws-dropdown-link').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`#staffWorkspaceDropdownMenu [data-staff-page="${pageId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const badge = this.element('staffWorkspaceActiveBadge');
    if (badge) badge.textContent = activeTitle;

    document.querySelectorAll('.staff-workspace-page').forEach(page => {
      page.style.display = 'none';
      page.classList.add('hidden');
    });

    const target = this.element(`staffPage-${pageId}`) || this.element(`staff${pageId.charAt(0).toUpperCase() + pageId.slice(1)}Page`);
    if (target) {
      target.style.display = 'block';
      target.classList.remove('hidden');
      target.querySelectorAll('.collapsible-content').forEach(c => {
        c.style.display = 'block';
      });
    }

    setTimeout(() => {
      if (window._appCharts) {
        Object.values(window._appCharts).forEach(c => {
          try { c.resize(); } catch (e) {}
        });
      }
    }, 100);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* Switch between dedicated pages in Admin Workspace */
  switchAdminPage(pageId) {
    const titles = {
      overview: 'Executive Dashboard Overview',
      school: 'Curriculum Vault (ALOC Station)',
      chat: 'Campus Chat & Governance',
      students: 'Registered Students Directory',
      staff: 'Staff Account Directory',
      timetable: 'School Timetable Management',
      scoresheet: 'General Score Sheet & Gradebook',
      resources: 'Learning Resources Repository',
      fees: 'School Fees & Billing',
      payroll: 'Staff Payroll & Remittance',
      ledger: 'Financial Record Book',
      leaderboard: 'School-Wide Leaderboard',
      notices: 'Notices & Bulletins Hub',
      admins: 'Administrator Governance Hub',
      paystack: 'Paystack Payment Gateway'
    };
    const activeTitle = titles[pageId] || 'Overview';

    document.querySelectorAll('#adminWorkspaceDropdownMenu .ws-dropdown-link').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`#adminWorkspaceDropdownMenu [data-admin-page="${pageId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const badge = this.element('adminWorkspaceActiveBadge');
    if (badge) badge.textContent = activeTitle;

    document.querySelectorAll('.admin-workspace-page').forEach(page => {
      page.style.display = 'none';
      page.classList.add('hidden');
    });

    const target = this.element(`adminPage-${pageId}`) || this.element(`admin${pageId.charAt(0).toUpperCase() + pageId.slice(1)}Page`);
    if (target) {
      target.style.display = 'block';
      target.classList.remove('hidden');
      target.querySelectorAll('.collapsible-content').forEach(c => {
        c.style.display = 'block';
      });
    }

    setTimeout(() => {
      if (window._appCharts) {
        Object.values(window._appCharts).forEach(c => {
          try { c.resize(); } catch (e) {}
        });
      }
    }, 100);

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

      const resolvedFilePath = res.file_path ? this.resolveAssetUrl(res.file_path) : '';
      const fileBtn = resolvedFilePath
        ? `<a href="${resolvedFilePath}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" title="Open and read document"><span>📖</span> Read / Open</a>`
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
      const filePath = paper.file_path ? this.resolveAssetUrl(paper.file_path) : '#';

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
      const filePath = book.file_path ? this.resolveAssetUrl(book.file_path) : '#';
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
              ${hasFile ? `<a href="${this.resolveAssetUrl(a.file_path)}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="font-size:.75rem;"><span>📎</span> Open Attached File</a>` : ''}
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
              <a href="${this.resolveAssetUrl(a.file_path)}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="padding:.5rem 1rem; text-decoration:none;">
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
                    <a href="${this.resolveAssetUrl(subInfo.file_path)}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="background:#059669; font-size:.78rem; text-decoration:none;">
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

    const staffAlertEl = this.element('staffLiveClassAlert');
    if (staffAlertEl) {
      const todayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = todayNames[new Date().getDay()];
      const todayClasses = Array.isArray(schedules) ? schedules.filter(s => s.day_of_week === todayDay && s.meet_link) : [];
      if (todayClasses.length > 0) {
        const cls = todayClasses[0];
        staffAlertEl.innerHTML = `
          <div class="google-meet-card live-pulse" style="margin-bottom:0.75rem;">
            <div>
              <div class="live-tag"><span>●</span> LIVE GOOGLE MEET CLASS TODAY</div>
              <h3 style="margin:0.25rem 0 0.2rem; font-size:1.05rem;">
                ${this.escapeHtml(cls.subject)} (${this.escapeHtml(cls.start_time)} - ${this.escapeHtml(cls.end_time)})
              </h3>
              <p style="margin:0; font-size:.85rem; color:var(--muted); line-height:1.5;">
                Class venue: ${this.escapeHtml(cls.room || 'Online Video Class')} • ${cls.notification_sent_at ? 'Students alerted' : 'Reminder active'}
              </p>
            </div>
            <a href="${cls.meet_link}" target="_blank" rel="noopener noreferrer" class="google-meet-btn">
              <span>📹</span> Start Video Class (Google Meet)
            </a>
          </div>
        `;
      } else {
        staffAlertEl.innerHTML = '';
      }
    }

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
        const resAssetUrl = this.resolveAssetUrl(resource.file_path);
        currentNotice.innerHTML = `Current attachment: <a href="${resAssetUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:600;">${this.escapeHtml(resource.file_path.split('/').pop())}</a> (upload a new file below only if you want to replace it)`;
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

      const rawSubFile = sub.submission_file || sub.file_path;
      const fileHtml = rawSubFile
        ? `<a href="${this.resolveAssetUrl(rawSubFile)}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-sm-primary" style="font-size:.74rem; text-decoration:none; padding:.3rem .6rem;">📎 View File</a>`
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
        fileLink.href = this.resolveAssetUrl(filePath);
        fileLink.target = '_blank';
        fileLink.rel = 'noopener noreferrer';
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
     UNIFIED MULTI-API NATIONAL CBT & QUESTION BANK VIEW METHODS
     ------------------------------------------------------------------------ */

  // 1. STUDENT CBT SETUP & CONTROLS
  renderStudentAlocSetup(settings, enrolledSubjects = []) {
    const disabledAlert = this.element('studentAlocDisabledAlert');
    const activeContainer = this.element('studentAlocActiveContainer');
    const statusBadge = this.element('studentAlocStatusBadge');
    const planBadge = this.element('studentAlocPlanBadge');
    const subjectSelect = this.element('alocSubject');
    const timerControlsContainer = this.element('studentTimerControlsContainer');

    if (planBadge && settings.plan_tier) {
      planBadge.textContent = `${settings.plan_tier} CBT`;
    }

    if (!settings.is_enabled) {
      if (disabledAlert) disabledAlert.classList.remove('hidden');
      if (activeContainer) activeContainer.classList.add('hidden');
      if (statusBadge) {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● CBT Engine Deactivated';
      }
      return;
    }

    if (disabledAlert) disabledAlert.classList.add('hidden');
    if (activeContainer) activeContainer.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.className = 'aloc-status-badge online';
      statusBadge.textContent = '● Unified Engine Online';
    }

    // Populate All 35+ Subjects Grouped into Categorical Optgroups
    if (subjectSelect) {
      subjectSelect.innerHTML = `
        <optgroup label="Core Compulsory">
          <option value="Mathematics" selected>General Mathematics</option>
          <option value="English Language">English Language</option>
          <option value="Civic Education">Civic Education</option>
        </optgroup>
        <optgroup label="Science Discipline">
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Biology">Biology</option>
          <option value="Further Mathematics">Further Mathematics</option>
          <option value="Agricultural Science">Agricultural Science</option>
          <option value="Computer Studies">Computer Studies & ICT</option>
          <option value="Health Science">Health Science / PHE</option>
        </optgroup>
        <optgroup label="Commercial Discipline">
          <option value="Financial Accounting">Financial Accounting</option>
          <option value="Commerce">Commerce</option>
          <option value="Economics">Economics</option>
          <option value="Book Keeping">Book Keeping</option>
          <option value="Office Practice">Office Practice</option>
          <option value="Insurance">Insurance</option>
          <option value="Marketing">Marketing</option>
        </optgroup>
        <optgroup label="Arts & Humanities">
          <option value="Literature in English">Literature in English</option>
          <option value="Government">Government</option>
          <option value="Christian Religious Studies">Christian Religious Studies (CRS)</option>
          <option value="Islamic Religious Studies">Islamic Religious Studies (IRS)</option>
          <option value="History">History</option>
          <option value="Geography">Geography</option>
          <option value="Visual Arts">Visual Arts</option>
          <option value="Music">Music</option>
        </optgroup>
        <optgroup label="Trade & Vocational Subjects">
          <option value="Data Processing">Data Processing (Trade)</option>
          <option value="Catering Craft Practice">Catering Craft Practice (Trade)</option>
          <option value="GSM Phone Repairs">GSM & Computer Hardware Repairs (Trade)</option>
          <option value="Animal Husbandry">Animal Husbandry (Trade)</option>
          <option value="Garment Making">Fashion Design & Garment Making (Trade)</option>
          <option value="Cosmetology">Beauty & Cosmetology (Trade)</option>
          <option value="Electrical Installation">Electrical Installation & Solar PV (Trade)</option>
          <option value="Bricklaying">Bricklaying & Blocklaying (Trade)</option>
          <option value="Carpentry">Carpentry & Joinery (Trade)</option>
          <option value="Auto Mechanics">Auto Mechanical Work (Trade)</option>
          <option value="Painting & Decorating">Painting & Decorating (Trade)</option>
          <option value="Fishery">Fishery & Aquaculture (Trade)</option>
          <option value="Plumbing">Plumbing & Pipe Fitting (Trade)</option>
          <option value="Welding">Welding & Fabrication Craft (Trade)</option>
        </optgroup>
      `;

      // Select student's first enrolled subject if present
      if (Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0) {
        const match = Array.from(subjectSelect.options).find(opt => 
          enrolledSubjects.some(sub => sub.toLowerCase().includes(opt.value.toLowerCase()) || opt.value.toLowerCase().includes(sub.toLowerCase()))
        );
        if (match) match.selected = true;
      }
    }

    // Custom Timer Permission Handling
    if (timerControlsContainer) {
      const isTimerAllowed = (settings.allow_custom_timer !== 0 && settings.allow_custom_timer !== false);
      if (!isTimerAllowed) {
        timerControlsContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:.5rem;">
            <div>
              <strong style="color:var(--text); font-size:.88rem;">⏱️ Test Duration: Standard Institutional Timing</strong>
              <small style="color:var(--muted); font-size:.78rem; display:block;">Custom timer adjustments are restricted by school administration. Standard exam duration (1.5 mins / question) will be applied.</small>
            </div>
            <span class="badge badge-blue">Standard Timer</span>
          </div>
        `;
      }
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
    const boardBadge = this.element('quizBoardBadge');
    if (boardBadge) boardBadge.textContent = `${quizState.examType.toUpperCase()} Certified`;

    const counter = this.element('quizQuestionCounter');
    if (counter) counter.textContent = `Question ${quizState.currentIndex + 1} of ${quizState.questions.length}`;
    const qId = this.element('quizQuestionId');
    if (qId) qId.textContent = `ID: #${q.id || (quizState.currentIndex + 1)}`;

    // Progress counter
    const progressText = this.element('quizNavProgressText');
    if (progressText) {
      const answeredCount = Object.keys(quizState.userAnswers).length;
      progressText.textContent = `${answeredCount} of ${quizState.questions.length} Answered`;
    }

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

    // Navigation pills (Supports up to 50 questions)
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
      nextBtn.textContent = isLast ? 'Finish & Submit' : 'Next →';
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
    const boostTitle = this.element('alocMeritBoostTitle');
    const boostSubtitle = this.element('alocMeritBoostSubtitle');

    if (scoreEl) scoreEl.textContent = `${result.score} / ${result.total}`;
    if (percentEl) percentEl.textContent = `${result.percentage}%`;
    if (timeEl) timeEl.textContent = result.timeSpent || '05:00';

    const meritPoints = result.score * 2;
    if (boostTitle) boostTitle.textContent = `🎉 +${meritPoints} Academic Merit Points Awarded!`;
    if (boostSubtitle) boostSubtitle.textContent = `Your score of ${result.score}/${result.total} (${result.percentage}%) has been added to your overall Student Leaderboard ranking across tests, assignments, and exams!`;

    if (gradeEl) {
      if (result.percentage >= 75) {
        gradeEl.textContent = 'A1 (Distinction)';
        gradeEl.style.color = 'var(--success)';
        if (emojiEl) emojiEl.textContent = '🏆';
        if (headEl) headEl.textContent = 'Outstanding Performance!';
      } else if (result.percentage >= 60) {
        gradeEl.textContent = 'B2 (Credit)';
        gradeEl.style.color = 'var(--primary)';
        if (emojiEl) emojiEl.textContent = '🎉';
        if (headEl) headEl.textContent = 'Great Work!';
      } else if (result.percentage >= 50) {
        gradeEl.textContent = 'C4 (Pass)';
        gradeEl.style.color = '#ca8a04';
        if (emojiEl) emojiEl.textContent = '👍';
        if (headEl) headEl.textContent = 'Good Effort - Keep Practicing!';
      } else {
        gradeEl.textContent = 'F9 (Needs Practice)';
        gradeEl.style.color = 'var(--danger)';
        if (emojiEl) emojiEl.textContent = '📚';
        if (headEl) headEl.textContent = 'Review Solutions & Try Again!';
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
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.6rem; flex-wrap:wrap; gap:.5rem;">
            <div style="display:flex; align-items:center; gap:.5rem;">
              <span class="badge ${isCorrect ? 'badge-green' : 'badge-red'}">Question ${idx + 1}</span>
              <span class="badge badge-blue">${this.escapeHtml(q.subject || 'Subject')} • ${this.escapeHtml(q.examtype || 'WAEC')} ${this.escapeHtml(q.examyear || '')}</span>
            </div>
            <span style="font-weight:800; font-size:.85rem; color:${isCorrect ? 'var(--success)' : 'var(--danger)'};">
              ${isCorrect ? '✓ Correct (+1 Mark)' : '✗ Incorrect (0 Marks)'}
            </span>
          </div>

          <h4 style="font-size:1.05rem; line-height:1.5; margin:0 0 1rem; color:var(--text);">${this.escapeHtml(q.question)}</h4>

          <div style="margin-bottom:1rem;">
            ${optionsHtml}
          </div>

          <div class="aloc-explanation-box">
            <strong style="color:var(--primary); font-size:.85rem; display:block; margin-bottom:.3rem;">💡 Step-by-Step Worked Explanation (L3):</strong>
            <p style="margin:0; font-size:.88rem; color:var(--text); line-height:1.5;">${this.escapeHtml(q.solution || 'Standard derivation applied.')}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  // 5. STAFF CURRICULUM EXPLORER & QUESTION CARDS
  renderStaffAlocSchool(settings, questions = []) {
    const statusBadge = this.element('staffAlocStatusBadge');
    const planBadge = this.element('staffAlocPlanBadge');
    const listEl = this.element('staffAlocQuestionsList');

    if (planBadge && settings.plan_tier) planBadge.textContent = `${settings.plan_tier} Tier`;
    if (statusBadge) {
      if (settings.is_enabled) {
        statusBadge.className = 'aloc-status-badge online';
        statusBadge.textContent = '● Multi-API Online';
      } else {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● Deactivated by Admin';
      }
    }

    if (!listEl) return;

    if (!settings.is_enabled) {
      listEl.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--danger); background: rgba(239, 68, 68, 0.05);">
          <h3 style="color:var(--danger); margin:0 0 .4rem;">Unified CBT & Question Bank Engine Deactivated</h3>
          <p style="margin:0; font-size:.9rem; color:var(--text);">The school administrator has temporarily deactivated the multi-API question engine. Question bank exploration and CBT test building are paused until re-enabled.</p>
        </div>
      `;
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      listEl.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--muted);">No questions currently loaded. Click <strong>"Browse Questions"</strong> above to explore the multi-board curriculum.</div>`;
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

  // 6. ADMIN MULTI-API CONTROL, PERMISSIONS & SETTINGS
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
        statusBadge.textContent = '● Multi-API Online';
      } else {
        statusBadge.className = 'aloc-status-badge offline';
        statusBadge.textContent = '● CBT Engine Deactivated';
      }
    }

    if (actionBtnContainer) {
      actionBtnContainer.innerHTML = isEnabled
        ? `<button type="button" class="btn-sm btn-sm-danger" id="adminToggleAlocBtn" onclick="schoolController.adminToggleAlocApi(false)" style="padding:.6rem 1.4rem; font-weight:800; border-radius:10px;">🚫 Deactivate CBT Engine</button>`
        : `<button type="button" class="btn-sm btn-primary" id="adminToggleAlocBtn" onclick="schoolController.adminToggleAlocApi(true)" style="padding:.6rem 1.4rem; font-weight:800; border-radius:10px;">✅ Activate CBT Engine</button>`;
    }

    if (statusDesc) {
      statusDesc.innerHTML = isEnabled
        ? `The Unified National Examination CBT engine is currently <strong style="color:var(--success);">ACTIVE</strong> across the school. Students and staff have access to all integrated APIs, 35+ subjects, and 1978–2026 archives.`
        : `The Unified National Examination CBT engine has been <strong style="color:var(--danger);">DEACTIVATED / PAUSED</strong> by the administrator. Student and staff CBT practice modules are temporarily offline.`;
    }

    if (statusPill) {
      statusPill.innerHTML = isEnabled
        ? `<span class="badge badge-green" style="font-size:.85rem; padding:.35rem .75rem;">Status: Enabled</span>`
        : `<span class="badge badge-red" style="font-size:.85rem; padding:.35rem .75rem;">Status: Deactivated</span>`;
    }

    // Provider latencies
    const providers = settings.providers_config || {};
    const alocPing = this.element('pingStatusAloc');
    if (alocPing) alocPing.textContent = `${providers.aloc?.latency_ms || 42} ms`;
    const examfocusPing = this.element('pingStatusExamfocus');
    if (examfocusPing) examfocusPing.textContent = `${providers.examfocus?.latency_ms || 58} ms`;
    const vaultPing = this.element('pingStatusVault');
    if (vaultPing) vaultPing.textContent = `${providers.national_vault?.latency_ms || 4} ms`;

    // Custom Timer Permission Checkbox
    const timerChk = this.element('adminAllowCustomTimerCheck');
    const timerLabel = this.element('adminCustomTimerLabel');
    if (timerChk) {
      timerChk.checked = (settings.allow_custom_timer !== 0 && settings.allow_custom_timer !== false);
      if (timerLabel) {
        timerLabel.textContent = timerChk.checked ? 'Permission Granted' : 'Permission Restricted';
      }
    }

    // Allowed Boards Checkboxes
    const allowedBoardsStr = (settings.allowed_boards || 'WAEC,JAMB,GCE,NECO,ALEVEL').toUpperCase();
    document.querySelectorAll('.admin-board-chk').forEach(chk => {
      chk.checked = allowedBoardsStr.includes(chk.value.toUpperCase());
    });

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
        : [{
            id: 1,
            title: 'Unified Examination Station Operational',
            message: 'All 3 provider pipelines (ALOC, ExamFocus, and National Vault) are active and responding.',
            type: 'info',
            date: new Date().toLocaleDateString('en-GB')
          }];

      notifList.innerHTML = notifs.map(n => {
        const isSuccess = (n.type === 'success');
        const isAlert = (n.type === 'alert' || n.type === 'danger');
        const borderColor = isSuccess ? 'var(--success)' : (isAlert ? 'var(--danger)' : 'var(--primary)');
        const tagBadge = isSuccess ? 'badge-green' : (isAlert ? 'badge-red' : 'badge-blue');

        return `
          <div style="padding:1rem 1.2rem; border-radius:10px; background:var(--bg); border:1px solid var(--border); border-left:4px solid ${borderColor};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.3rem;">
              <span class="badge ${tagBadge}">${this.escapeHtml(n.title || 'System Notice')}</span>
              <small style="color:var(--muted); font-size:.75rem;">${this.escapeHtml(n.date || '')}</small>
            </div>
            <p style="margin:.4rem 0 0; font-size:.85rem; color:var(--text); line-height:1.45;">${this.escapeHtml(n.message || '')}</p>
          </div>
        `;
      }).join('');
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

  /* ==========================================================================
     STUDENT HERO & ANALYTICS DATA VISUALIZATIONS (CHART.JS)
     ========================================================================== */
  _safeChartCreate(canvasId, config) {
    if (!window.Chart) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    window._appCharts = window._appCharts || {};
    if (window._appCharts[canvasId]) {
      try {
        window._appCharts[canvasId].destroy();
      } catch (e) {}
    }

    try {
      window._appCharts[canvasId] = new Chart(ctx, config);
      return window._appCharts[canvasId];
    } catch (err) {
      console.error('Error creating chart ' + canvasId, err);
      return null;
    }
  },

  renderStudentHero(analytics = {}) {
    const student = analytics.student || {};
    const kpis = analytics.kpis || {};
    const tip = analytics.motivational_tip || '';

    // 1. Student Name & Initials
    const name = student.name || (window.schoolModel && window.schoolModel.user && window.schoolModel.user.name) || 'Student';
    const nameEl = this.element('studentName');
    if (nameEl) nameEl.textContent = name;

    const parts = name.trim().split(/\s+/);
    let initials = 'ST';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }
    const initialsEl = this.element('studentHeroInitials');
    if (initialsEl) initialsEl.textContent = initials;

    // 2. Program Track & Department Pills
    const program = (student.program || (window.schoolModel && window.schoolModel.user && window.schoolModel.user.program) || 'WAEC').toUpperCase();
    const trackPill = this.element('studentHeroTrackBadge');
    if (trackPill) {
      trackPill.textContent = program === 'JAMB' ? '📙 JAMB UTME Track' : '📘 WAEC Senior High Track';
    }

    const dept = student.department || (window.schoolModel && window.schoolModel.user && window.schoolModel.user.department) || 'General';
    const deptPill = this.element('studentHeroDeptBadge');
    if (deptPill) {
      const icon = dept.toLowerCase() === 'science' ? '🔬' : (dept.toLowerCase() === 'commercial' ? '💼' : '🎨');
      deptPill.textContent = `${icon} ${dept} Department`;
    }

    // 3. Motivational Study Quote
    const quoteEl = this.element('studentMotivationalQuote');
    if (quoteEl && tip) {
      quoteEl.textContent = tip;
    }

    // 4. Hero Quick Meta Pills
    const heroReadinessPill = this.element('studentHeroReadinessPill');
    if (heroReadinessPill && kpis.readiness_score !== undefined) {
      heroReadinessPill.textContent = `🔥 ${kpis.readiness_score}% Exam Ready`;
      heroReadinessPill.style.color = kpis.readiness_color || '#10b981';
    }

    const heroRankPill = this.element('studentHeroRankPill');
    if (heroRankPill && kpis.leaderboard_rank) {
      heroRankPill.textContent = `🏆 Rank #${kpis.leaderboard_rank} of ${kpis.total_track_candidates || 1}`;
    }

    // 5. Quick Launchpad Badges
    const pendingAsgnPill = this.element('launchPendingAsgnCount');
    if (pendingAsgnPill) {
      const pCount = kpis.pending_assignments !== undefined ? kpis.pending_assignments : 0;
      pendingAsgnPill.textContent = `${pCount} to do`;
      pendingAsgnPill.style.background = pCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      pendingAsgnPill.style.color = pCount > 0 ? '#dc2626' : '#059669';
    }

    // 6. KPI Card elements
    const kpiReadiness = this.element('studentKpiReadiness');
    if (kpiReadiness && kpis.readiness_score !== undefined) {
      kpiReadiness.textContent = `${kpis.readiness_score}%`;
      kpiReadiness.style.color = kpis.readiness_color || '#10b981';
    }

    const kpiReadinessCat = this.element('studentKpiReadinessCategory');
    if (kpiReadinessCat && kpis.readiness_category) {
      kpiReadinessCat.textContent = kpis.readiness_category;
    }
  },

  renderStudentAnalyticsCharts(analytics = {}) {
    if (!analytics || !window.Chart) return;

    const emerald = '#10b981';

    // 1. Subject Mastery & Strength Horizontal Bar Chart
    const subjectsList = Array.isArray(analytics.subject_mastery) ? analytics.subject_mastery : [];
    if (subjectsList.length > 0) {
      const subLabels = subjectsList.map(s => s.subject);
      const subScores = subjectsList.map(s => s.score);
      const subColors = subjectsList.map(s => {
        if (!s.has_data) return 'rgba(148, 163, 184, 0.35)';
        if (s.score >= 75) return '#10b981'; // Distinction
        if (s.score >= 60) return '#3b82f6'; // Credit
        if (s.score >= 50) return '#f59e0b'; // Pass
        return '#ef4444';
      });

      this._safeChartCreate('studentSubjectMasteryChart', {
        type: 'bar',
        data: {
          labels: subLabels,
          datasets: [{
            label: 'Average Score (%)',
            data: subScores,
            backgroundColor: subColors,
            borderColor: subColors.map(c => c.replace('0.35', '0.7')),
            borderWidth: 1.5,
            borderRadius: 6,
            maxBarThickness: 22
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const s = subjectsList[ctx.dataIndex];
                  if (!s || !s.has_data) return 'No graded submissions yet';
                  return `Score: ${ctx.raw}% • Grade: ${s.grade}`;
                }
              }
            }
          },
          scales: {
            x: {
              min: 0,
              max: 100,
              ticks: { callback: v => v + '%' },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y: {
              grid: { display: false },
              ticks: {
                font: { size: 11, weight: '600' }
              }
            }
          }
        }
      });
    }

    // 2. O'Level Exam Readiness Index Gauge
    const readiness = analytics.exam_readiness || {};
    const rScore = readiness.overall !== undefined ? readiness.overall : 75;
    const rColor = readiness.color || '#10b981';
    const rCat = readiness.category || 'Distinction Pace';

    const rTag = this.element('studentReadinessTag');
    if (rTag) {
      rTag.textContent = rCat;
      rTag.style.color = rColor;
    }

    const b = readiness.breakdown || {};
    const pAssess = this.element('pillarAssessVal');
    if (pAssess) pAssess.textContent = `${b.assessment_score || 0}%`;
    const pTask = this.element('pillarTaskVal');
    if (pTask) pTask.textContent = `${b.assignment_completion || 0}%`;
    const pAtt = this.element('pillarAttVal');
    if (pAtt) pAtt.textContent = `${b.attendance_consistency || 0}%`;

    this._safeChartCreate('studentReadinessGaugeChart', {
      type: 'doughnut',
      data: {
        labels: ['Readiness Index', 'Remaining Target'],
        datasets: [{
          data: [rScore, Math.max(0, 100 - rScore)],
          backgroundColor: [rColor, 'rgba(203, 213, 225, 0.3)'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.label === 'Readiness Index' ? `Readiness: ${rScore}% (${rCat})` : `Remaining Target: ${100 - rScore}%`
            }
          }
        }
      },
      plugins: [{
        id: 'studentCenterTextPlugin',
        beforeDraw: (chart) => {
          const { width, height, ctx } = chart;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 1.85rem system-ui, sans-serif';
          ctx.fillStyle = rColor;
          ctx.fillText(`${rScore}%`, width / 2, height / 2 - 8);
          ctx.font = '600 0.72rem system-ui, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText('EXAM READY', width / 2, height / 2 + 16);
          ctx.restore();
        }
      }]
    });

    // 3. Weekly Attendance & Study Consistency Trend
    const weekly = analytics.weekly_attendance || {};
    const wDays = weekly.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const wPcts = weekly.attendance_pcts || [100, 100, 100, 100, 100];
    const wCounts = weekly.present_counts || [1, 1, 1, 1, 1];

    this._safeChartCreate('studentAttendanceTrendChart', {
      type: 'line',
      data: {
        labels: wDays,
        datasets: [{
          label: 'Attendance Rate (%)',
          data: wPcts,
          borderColor: emerald,
          backgroundColor: 'rgba(16, 185, 129, 0.14)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointBackgroundColor: emerald,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Attendance: ${ctx.raw}% (${wCounts[ctx.dataIndex] || 0} active logs)`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: v => v + '%' },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });

    // 4. 5-Pillar Academic Merit Breakdown
    const merit = analytics.merit_breakdown || {};
    const meritValues = [
      merit.assignments || 0,
      merit.classwork || 0,
      merit.tests || 0,
      merit.exams || 0,
      merit.attendance || 0
    ];

    const meritTotalTag = this.element('studentTotalMeritTag');
    if (meritTotalTag) {
      meritTotalTag.textContent = `${merit.total || 0} Pts`;
    }

    const tipBox = this.element('studentMeritBoostTip');
    if (tipBox) {
      if (merit.assignments === 0) {
        tipBox.innerHTML = '💡 <strong>Pro Tip:</strong> You have unscored assignments! Submitting your pending tasks can instantly earn you +50 points to boost your leaderboard rank.';
      } else if (merit.tests === 0) {
        tipBox.innerHTML = '💡 <strong>Pro Tip:</strong> Take the upcoming class test or practice CBT drills to gain test points and jump your set position.';
      } else {
        tipBox.innerHTML = `💡 <strong>Outstanding Effort:</strong> You have amassed <strong>${merit.total} points</strong> across all 5 academic pillars! Keep practicing CBT daily to maintain your lead.`;
      }
    }

    this._safeChartCreate('studentMeritBreakdownChart', {
      type: 'doughnut',
      data: {
        labels: ['Assignments', 'Classwork', 'Tests & Quizzes', 'Examinations', 'Attendance'],
        datasets: [{
          data: meritValues,
          backgroundColor: [
            'rgba(37, 99, 235, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(239, 68, 68, 0.85)',
            'rgba(16, 185, 129, 0.85)'
          ],
          borderColor: ['#2563eb', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'],
          borderWidth: 1.5,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11, weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = meritValues.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                return `${ctx.label}: ${ctx.raw} pts (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  /* ==========================================================================
     ADMIN DATA VISUALIZATIONS & CHARTS (CHART.JS)
     ========================================================================== */
  renderAdminAnalyticsCharts(analytics = {}) {
    if (!window.Chart) return;
    const students = analytics.students || {};
    const staff = analytics.staff || {};
    const finance = analytics.finance || {};
    const academics = analytics.academics || {};
    const leaderboard = analytics.leaderboard || {};
    const notices = analytics.notices || {};
    const security = analytics.security || {};

    // 1. Demographics Bar Chart (Departments and Programs)
    const depts = students.departments || { Science: 0, Commercial: 0, Art: 0 };
    const prog = students.programs || { WAEC: 0, JAMB: 0 };
    this._safeChartCreate('chartStudentDemographics', {
      type: 'bar',
      data: {
        labels: ['Science', 'Commercial', 'Art', 'WAEC Track', 'JAMB Track'],
        datasets: [{
          label: 'Enrolled Students',
          data: [
            depts.Science || 0,
            depts.Commercial || 0,
            depts.Art || 0,
            prog.WAEC || 0,
            prog.JAMB || 0
          ],
          backgroundColor: [
            'rgba(37, 99, 235, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: ['#2563eb', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899'],
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw} students`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });

    // 2. Student Fees Status Doughnut (Paid Active vs Pending)
    const fees = students.fees_status || { paid: 0, unpaid: 0 };
    this._safeChartCreate('chartStudentFeesStatus', {
      type: 'doughnut',
      data: {
        labels: ['Tuition Paid (Active)', 'Payment Pending / Defaulters'],
        datasets: [{
          data: [fees.paid || 0, fees.unpaid || 0],
          backgroundColor: ['#10b981', '#ef4444'],
          borderColor: ['#059669', '#dc2626'],
          borderWidth: 1.5,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: '600' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (fees.paid || 0) + (fees.unpaid || 0);
                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                return `${ctx.label}: ${ctx.raw} students (${pct}%)`;
              }
            }
          }
        }
      }
    });

    // 3. Student Enrollment Trend Line Chart
    const trend = Array.isArray(students.trend) ? students.trend : [];
    const trendLabels = trend.length > 0 ? trend.map(t => t.month_label) : ['Recent'];
    const trendCounts = trend.length > 0 ? trend.map(t => t.cnt) : [0];
    this._safeChartCreate('chartStudentEnrollmentTrend', {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [{
          label: 'Total Enrollments',
          data: trendCounts,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#0284c7'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    // 4. Staff Monthly Salary Outlay by Department
    const staffDepts = Array.isArray(staff.departments) ? staff.departments : [];
    const staffDeptLabels = staffDepts.map(d => d.department || 'General');
    const staffSalaries = staffDepts.map(d => Number(d.total_salary) || 0);
    this._safeChartCreate('chartStaffSalaries', {
      type: 'bar',
      data: {
        labels: staffDeptLabels.length > 0 ? staffDeptLabels : ['Science', 'Commercial', 'Art'],
        datasets: [{
          label: 'Monthly Salary (₦)',
          data: staffSalaries.length > 0 ? staffSalaries : [0, 0, 0],
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: '#d97706',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Salary: ₦${Number(ctx.raw).toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '₦' + (val >= 1000 ? (val / 1000) + 'k' : val)
            }
          }
        }
      }
    });

    // 5. Staff Distribution by Department (Doughnut)
    const staffCounts = staffDepts.map(d => Number(d.staff_count) || 0);
    this._safeChartCreate('chartStaffDistribution', {
      type: 'doughnut',
      data: {
        labels: staffDeptLabels.length > 0 ? staffDeptLabels : ['Science', 'Commercial', 'Art'],
        datasets: [{
          data: staffCounts.length > 0 ? staffCounts : [1, 1, 1],
          backgroundColor: ['#2563eb', '#f59e0b', '#8b5cf6', '#10b981'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw} staff members`
            }
          }
        }
      }
    });

    // 6. Assessment Correlation Scatter Plot (Coursework vs Exam)
    const scatterScores = Array.isArray(academics.scatter_scores) ? academics.scatter_scores : [];
    const waecScatter = scatterScores
      .filter(s => (s.program || 'WAEC').toUpperCase() === 'WAEC')
      .map(s => ({ x: Number(s.assignment_score) || 0, y: Number(s.exam_score) || 0, name: s.student_name }));
    const jambScatter = scatterScores
      .filter(s => (s.program || '').toUpperCase() === 'JAMB')
      .map(s => ({ x: Number(s.assignment_score) || 0, y: Number(s.exam_score) || 0, name: s.student_name }));

    this._safeChartCreate('chartExamScoreScatter', {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'WAEC Students',
            data: waecScatter.length > 0 ? waecScatter : [{ x: 65, y: 72 }, { x: 78, y: 84 }, { x: 88, y: 91 }, { x: 55, y: 60 }],
            backgroundColor: 'rgba(37, 99, 235, 0.75)',
            borderColor: '#2563eb',
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'JAMB Students',
            data: jambScatter.length > 0 ? jambScatter : [{ x: 70, y: 68 }, { x: 82, y: 89 }, { x: 92, y: 94 }, { x: 60, y: 64 }],
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
            borderColor: '#f59e0b',
            pointRadius: 6,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pt = ctx.raw;
                return `${pt.name || ctx.dataset.label}: Coursework ${pt.x}% • Exam ${pt.y}%`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Coursework / Assignment (%)' }, min: 0, max: 100 },
          y: { title: { display: true, text: 'Exam Score (%)' }, min: 0, max: 100 }
        }
      }
    });

    // 7. Subject Mastery Horizontal Bar Chart
    const subAverages = Array.isArray(academics.subject_averages) ? academics.subject_averages : [];
    this._safeChartCreate('chartSubjectMastery', {
      type: 'bar',
      data: {
        labels: subAverages.length > 0 ? subAverages.map(s => s.subject) : ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics'],
        datasets: [{
          label: 'Class Average Score (%)',
          data: subAverages.length > 0 ? subAverages.map(s => Number(s.avg_score) || 0) : [74, 82, 68, 71, 79, 85],
          backgroundColor: 'rgba(139, 92, 246, 0.75)',
          borderColor: '#8b5cf6',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 22
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } }
      }
    });

    // 8. Leaderboard Scatter (Attendance vs Merit Points)
    const lbScatter = Array.isArray(leaderboard.scatter) ? leaderboard.scatter : [];
    const lbPoints = lbScatter.map(s => ({
      x: Number(s.x_attendance) || 0,
      y: Number(s.y_merit) || 0,
      name: s.name,
      program: s.program
    }));
    this._safeChartCreate('chartLeaderboardScatter', {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Merit Distribution',
          data: lbPoints.length > 0 ? lbPoints : [{ x: 5, y: 150 }, { x: 8, y: 280 }, { x: 12, y: 410 }, { x: 15, y: 550 }],
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#10b981',
          pointRadius: 6,
          pointHoverRadius: 9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw.name || 'Student'}: ${ctx.raw.x} days att • ${ctx.raw.y} pts`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Attendance Days' }, beginAtZero: true },
          y: { title: { display: true, text: 'Total Merit Points' }, beginAtZero: true }
        }
      }
    });

    // 9. Top 10 High Achievers (Bar)
    const topStudents = Array.isArray(leaderboard.top_students) ? leaderboard.top_students : [];
    this._safeChartCreate('chartTopStudents', {
      type: 'bar',
      data: {
        labels: topStudents.length > 0 ? topStudents.map(s => s.name || 'Student') : ['Student 1', 'Student 2', 'Student 3'],
        datasets: [{
          label: 'Total Merit Points',
          data: topStudents.length > 0 ? topStudents.map(s => Number(s.total_points) || 0) : [450, 380, 320],
          backgroundColor: 'rgba(234, 179, 8, 0.8)',
          borderColor: '#ca8a04',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // 10. Notices Target Audience (Doughnut)
    const nAudience = notices.audience || { all: 0, students: 0, staff: 0 };
    this._safeChartCreate('chartNoticesAudience', {
      type: 'doughnut',
      data: {
        labels: ['All School', 'Students Only', 'Staff Only'],
        datasets: [{
          data: [
            nAudience.all || 1,
            nAudience.students || 0,
            nAudience.staff || 0
          ],
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });

    // 11. Notices Categories (Doughnut)
    const nCategories = notices.categories || {};
    const catKeys = Object.keys(nCategories);
    const catLabels = catKeys.length > 0 ? catKeys.map(k => k.charAt(0).toUpperCase() + k.slice(1)) : ['Official', 'Academic', 'General'];
    const catCounts = catKeys.length > 0 ? catKeys.map(k => nCategories[k]) : [1, 1, 1];
    this._safeChartCreate('chartNoticesCategories', {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catCounts,
          backgroundColor: ['#8b5cf6', '#ef4444', '#0284c7', '#10b981', '#f59e0b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });

    // 12. Staff Payroll Current Status (Doughnut)
    const curPayroll = Array.isArray(staff.current_payroll) ? staff.current_payroll : [];
    const payStatusLabels = curPayroll.map(p => (p.status || 'pending').toUpperCase());
    const payStatusTotals = curPayroll.map(p => Number(p.total) || 0);
    this._safeChartCreate('chartStaffPayrollStatus', {
      type: 'doughnut',
      data: {
        labels: payStatusLabels.length > 0 ? payStatusLabels : ['PAID', 'PENDING'],
        datasets: [{
          data: payStatusTotals.length > 0 ? payStatusTotals : [1, 0],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ₦${Number(ctx.raw).toLocaleString()}` } }
        }
      }
    });

    // 13. Payroll Burn Trend (Line)
    const pTrend = Array.isArray(staff.payroll_trend) ? staff.payroll_trend : [];
    this._safeChartCreate('chartPayrollBurnTrend', {
      type: 'line',
      data: {
        labels: pTrend.length > 0 ? pTrend.map(p => p.month_year) : ['Current Month'],
        datasets: [{
          label: 'Payroll Disbursed (₦)',
          data: pTrend.length > 0 ? pTrend.map(p => Number(p.disbursed) || 0) : [0],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `₦${Number(ctx.raw).toLocaleString()}` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '₦' + (v >= 1000 ? (v / 1000) + 'k' : v) }
          }
        }
      }
    });

    // 14. Finance Timeline (Income vs Expenditure)
    const fTimeline = Array.isArray(finance.timeline) ? finance.timeline : [];
    this._safeChartCreate('chartFinanceTimeline', {
      type: 'line',
      data: {
        labels: fTimeline.length > 0 ? fTimeline.map(t => t.m_label) : ['Recent'],
        datasets: [
          {
            label: 'Revenue / Inflows (₦)',
            data: fTimeline.length > 0 ? fTimeline.map(t => Number(t.income) || 0) : [0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          },
          {
            label: 'Expenditure / Outflows (₦)',
            data: fTimeline.length > 0 ? fTimeline.map(t => Number(t.expense) || 0) : [0],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ₦${Number(ctx.raw).toLocaleString()}` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '₦' + (v >= 1000 ? (v / 1000) + 'k' : v) }
          }
        }
      }
    });

    // 15. Finance Categories Breakdown (Bar)
    const fCats = Array.isArray(finance.categories) ? finance.categories : [];
    this._safeChartCreate('chartFinanceCategories', {
      type: 'bar',
      data: {
        labels: fCats.length > 0 ? fCats.map(c => c.category) : ['Tuition Fees', 'Salaries'],
        datasets: [{
          label: 'Total Amount (₦)',
          data: fCats.length > 0 ? fCats.map(c => Number(c.total) || 0) : [0, 0],
          backgroundColor: fCats.length > 0 ? fCats.map(c => c.type === 'income' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)') : ['#10b981', '#ef4444'],
          borderRadius: 6,
          maxBarThickness: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `Amount: ₦${Number(ctx.raw).toLocaleString()}` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '₦' + (v >= 1000 ? (v / 1000) + 'k' : v) }
          }
        }
      }
    });

    // 16. Audit Log Velocity Timeline (Line)
    const aTimeline = Array.isArray(security.audit_timeline) ? security.audit_timeline : [];
    this._safeChartCreate('chartAuditTimeline', {
      type: 'line',
      data: {
        labels: aTimeline.length > 0 ? aTimeline.map(a => a.log_date) : ['Today'],
        datasets: [{
          label: 'Administrative Actions',
          data: aTimeline.length > 0 ? aTimeline.map(a => Number(a.action_count) || 0) : [0],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    // 17. Admin Roles Distribution (Doughnut)
    const aRoles = Array.isArray(security.admin_roles) ? security.admin_roles : [];
    this._safeChartCreate('chartAdminRoles', {
      type: 'doughnut',
      data: {
        labels: aRoles.length > 0 ? aRoles.map(r => r.name) : ['Super Admin'],
        datasets: [{
          data: aRoles.length > 0 ? aRoles.map(r => Number(r.cnt) || 0) : [1],
          backgroundColor: ['#ef4444', '#f59e0b', '#2563eb', '#10b981', '#8b5cf6', '#0284c7'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /* ------------------------------------------------------------------------
     STUDENT PAYMENT VERIFICATION & ID DISPATCH VIEW CONTROLS
     ------------------------------------------------------------------------ */
  renderAdminStudentVerifications(data) {
    const pending = (data && (data.requests || data.pending)) ? (data.requests || data.pending) : [];
    const recent = (data && data.recent_verified) ? data.recent_verified : [];
    const pendingCount = (data && typeof data.count === 'number')
      ? data.count
      : ((data && typeof data.pending_count === 'number') ? data.pending_count : pending.length);

    // Update Header Badges & Alert Banner
    const headerBadge = document.getElementById('adminPendingVerifHeaderBadge');
    if (headerBadge) {
      headerBadge.textContent = `${pendingCount} Pending Verification`;
      headerBadge.className = pendingCount > 0 ? 'badge badge-gold' : 'badge badge-green';
    }

    const alertBanner = document.getElementById('adminPendingVerifAlertBanner');
    if (alertBanner) {
      if (pendingCount > 0) {
        alertBanner.classList.remove('hidden');
        alertBanner.style.display = 'block';
      } else {
        alertBanner.classList.add('hidden');
        alertBanner.style.display = 'none';
      }
    }

    // Pending Verification Requests Table
    const pendingBody = document.getElementById('adminPendingVerifTableBody');
    if (pendingBody) {
      if (pending.length === 0) {
        pendingBody.innerHTML = `<tr><td colspan="6" class="empty-state" style="text-align:center; padding:2rem; color:var(--muted);">✅ No pending student verifications. All admissions are verified and up to date!</td></tr>`;
      } else {
        pendingBody.innerHTML = pending.map(req => {
          const reqId = req.id;
          const userId = req.user_id;
          const studentName = this.escapeHtml(req.student_name || req.current_name || 'New Student');
          const email = this.escapeHtml(req.student_email || req.email || req.current_email || '');
          const prog = this.escapeHtml(req.program || 'WAEC');
          const dept = this.escapeHtml(req.department || 'General');
          const amount = Number(req.amount || 18000).toLocaleString();
          const ref = this.escapeHtml(req.payment_reference || 'N/A');
          const method = this.escapeHtml(req.payment_method || 'transfer');
          const autoStatus = req.auto_verification_status || 'pending';
          const failureReason = this.escapeHtml(req.auto_failure_reason || (method === 'manual_transfer' ? 'Direct bank transfer - manual clearance requested' : 'Awaiting admin clearance'));

          let autoStatusBadge = `<span class="badge badge-gold">Pending</span>`;
          if (autoStatus === 'failed') {
            autoStatusBadge = `<span class="badge badge-red" title="${failureReason}">Auto-Verify Failed</span><br><small style="color:var(--muted); font-size:0.72rem;">${failureReason}</small>`;
          } else if (autoStatus === 'queued') {
            autoStatusBadge = `<span class="badge badge-gold">Queued for Review</span><br><small style="color:var(--muted); font-size:0.72rem;">${failureReason}</small>`;
          }

          const safeName = studentName.replace(/'/g, "\\'");
          const safeRef = ref.replace(/'/g, "\\'");

          return `
            <tr>
              <td>
                <strong style="color:var(--text);">${studentName}</strong>
                <div style="font-size:0.78rem; color:var(--muted);">${email}</div>
              </td>
              <td>
                <span class="badge badge-blue" style="font-size:0.72rem;">${prog}</span>
                <span class="badge badge-gold" style="font-size:0.72rem;">${dept}</span>
              </td>
              <td>
                <span style="font-family:monospace; font-size:0.8rem; background:rgba(0,0,0,0.04); padding:2px 6px; border-radius:4px;">${ref}</span>
                <div style="font-size:0.74rem; color:var(--muted); text-transform:capitalize;">${method.replace('_', ' ')}</div>
              </td>
              <td style="text-align:right; font-weight:700; color:var(--success);">
                ₦${amount}
              </td>
              <td>${autoStatusBadge}</td>
              <td style="text-align:center;">
                <div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">
                  <button type="button" class="btn-sm btn-sm-success" style="background:#10b981; color:white; font-weight:700;" onclick="schoolController.adminVerifyStudentPayment(${reqId}, ${userId}, ${req.amount || 18000}, '${safeRef}', '${safeName}')">
                    ✔ Verify & Dispatch ID
                  </button>
                  <button type="button" class="btn-sm btn-sm-danger" onclick="schoolController.adminRejectStudentPayment(${reqId})">
                    ✕ Reject
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Recently Verified Audit Table
    const recentBody = document.getElementById('adminRecentVerifiedTableBody');
    if (recentBody) {
      if (recent.length === 0) {
        recentBody.innerHTML = `<tr><td colspan="6" class="empty-state" style="text-align:center; padding:1.5rem; color:var(--muted);">No recently verified students recorded yet.</td></tr>`;
      } else {
        recentBody.innerHTML = recent.map(st => {
          const stuId = this.escapeHtml(st.student_id || 'STU-????');
          const name = this.escapeHtml(st.student_name || st.name || 'Student');
          const email = this.escapeHtml(st.student_email || st.email || '');
          const prog = this.escapeHtml(st.program || 'WAEC');
          const amount = Number(st.amount || 18000).toLocaleString();
          const verifiedBy = this.escapeHtml(st.verified_by || 'automated_gateway');
          const verifiedAt = st.verified_at ? new Date(st.verified_at).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Recently';

          return `
            <tr>
              <td><strong style="color:#0284c7; font-family:monospace; font-size:0.88rem;">${stuId}</strong></td>
              <td>
                <div style="font-weight:600; color:var(--text);">${name}</div>
                <small style="color:var(--muted);">${email}</small>
              </td>
              <td><span class="badge badge-blue" style="font-size:0.72rem;">${prog}</span></td>
              <td style="font-weight:700; color:var(--success);">₦${amount}</td>
              <td><span class="badge ${verifiedBy.includes('auto') ? 'badge-green' : 'badge-gold'}" style="font-size:0.7rem;">${verifiedBy}</span></td>
              <td style="color:var(--muted); font-size:0.82rem;">${verifiedAt}</td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  openStudentPaymentVerificationModal(studentData) {
    const modal = document.getElementById('studentVerificationPaymentModal');
    if (!modal) return;

    // Reset views
    const actionsView = document.getElementById('verifActionsView');
    const successView = document.getElementById('verifSuccessView');
    const alertBox = document.getElementById('verifModalAlert');

    if (actionsView) actionsView.style.display = 'block';
    if (successView) {
      successView.classList.add('hidden');
      successView.style.display = 'none';
    }
    if (alertBox) {
      alertBox.classList.add('hidden');
      alertBox.style.display = 'none';
      alertBox.textContent = '';
    }

    // Populate student summary
    const nameEl = document.getElementById('verifStudentName');
    const emailEl = document.getElementById('verifStudentEmail');
    const progEl = document.getElementById('verifStudentProgram');

    if (nameEl) nameEl.textContent = studentData.student_name || studentData.name || studentData.full_name || 'Enrolled Student';
    if (emailEl) emailEl.textContent = studentData.student_email || studentData.email || '-';
    if (progEl) {
      const prog = (studentData.program || 'WAEC').toUpperCase();
      const dept = studentData.department ? ` - ${studentData.department}` : '';
      progEl.textContent = `${prog}${dept}`;
    }

    const payBtn = document.getElementById('verifPaystackBtn');
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.innerHTML = '💳 Pay ₦18,000 via Paystack Online →';
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  showStudentVerificationSuccess(studentId, email, activationTokenOrLink) {
    const actionsView = document.getElementById('verifActionsView');
    const successView = document.getElementById('verifSuccessView');
    const alertBox = document.getElementById('verifModalAlert');

    if (alertBox) {
      alertBox.classList.add('hidden');
      alertBox.style.display = 'none';
    }
    if (actionsView) actionsView.style.display = 'none';
    if (successView) {
      successView.classList.remove('hidden');
      successView.style.display = 'block';
    }

    const idEl = document.getElementById('verifIssuedStudentId');
    const mailEl = document.getElementById('verifDispatchedEmail');
    const linkBtn = document.getElementById('verifActivationLinkBtn');

    if (idEl) idEl.textContent = studentId;
    if (mailEl) mailEl.textContent = email;
    if (linkBtn) {
      let resolvedLink = '';
      if (activationTokenOrLink && (activationTokenOrLink.startsWith('http://') || activationTokenOrLink.startsWith('https://'))) {
        resolvedLink = activationTokenOrLink;
        if (resolvedLink.includes('onrender.com') && resolvedLink.startsWith('http://')) {
          resolvedLink = resolvedLink.replace('http://', 'https://');
        }
      } else {
        const token = activationTokenOrLink ? encodeURIComponent(activationTokenOrLink) : '';
        const target = token ? `activate_student.php?token=${token}` : 'activate_student.php';
        resolvedLink = (window.schoolModel && typeof window.schoolModel.resolveApiUrl === 'function')
          ? window.schoolModel.resolveApiUrl(target)
          : target;
      }
      linkBtn.href = resolvedLink;
    }
  },

  closeStudentPaymentModal() {
    const modal = document.getElementById('studentVerificationPaymentModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  /* ------------------------------------------------------------------------
     CAMPUS CHAT & DIRECT MESSAGING (WHATSAPP UI/UX) VIEW METHODS
     ------------------------------------------------------------------------ */
  updateHeaderChatBadge(count) {
    this.updateAllChatBadges(count);
  },

  updateAllChatBadges(count) {
    const num = Math.max(0, Number(count) || 0);
    const countText = num > 99 ? '99+' : String(num);

    // 1. Global Header Chat Button Badge
    const headerBadge = document.getElementById('headerChatBadge');
    if (headerBadge) {
      if (num > 0) {
        headerBadge.textContent = countText;
        headerBadge.classList.remove('hidden');
        headerBadge.style.display = 'inline-block';
      } else {
        headerBadge.textContent = '0';
        headerBadge.classList.add('hidden');
        headerBadge.style.display = 'none';
      }
    }

    // 2. Student Workspace Dropdown Menu Badge
    const studentMenuBadge = document.getElementById('studentChatMenuBadge');
    if (studentMenuBadge) {
      if (num > 0) {
        studentMenuBadge.textContent = `${countText} Unread`;
        studentMenuBadge.className = 'badge badge-red chat-unread-count-pill';
      } else {
        studentMenuBadge.textContent = 'Live';
        studentMenuBadge.className = 'badge badge-blue';
      }
    }

    // 3. Staff Workspace Dropdown Menu Badge
    const staffMenuBadge = document.getElementById('staffChatMenuBadge');
    if (staffMenuBadge) {
      if (num > 0) {
        staffMenuBadge.textContent = `${countText} Unread`;
        staffMenuBadge.className = 'badge badge-red chat-unread-count-pill';
      } else {
        staffMenuBadge.textContent = 'Live';
        staffMenuBadge.className = 'badge badge-blue';
      }
    }

    // 4. Admin Workspace Dropdown Menu Badge
    const adminMenuBadge = document.getElementById('adminChatMenuBadge');
    if (adminMenuBadge) {
      if (num > 0) {
        adminMenuBadge.textContent = `${countText} Unread`;
        adminMenuBadge.className = 'badge badge-red chat-unread-count-pill';
      } else {
        adminMenuBadge.textContent = 'Live';
        adminMenuBadge.className = 'badge badge-gold';
      }
    }

    // 5. Dashboard Feature Hub Card Badges (Student, Staff, Admin)
    ['studentChatCardBadge', 'staffChatCardBadge', 'adminChatCardBadge'].forEach(cardBadgeId => {
      const el = document.getElementById(cardBadgeId);
      if (el) {
        if (num > 0) {
          el.textContent = `${countText} Unread`;
          el.classList.remove('hidden');
          el.style.display = 'inline-flex';
        } else {
          el.textContent = '0 Unread';
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      }
    });
  },

  /* ------------------------------------------------------------------------
     5-SECOND CHAT DROPDOWN NOTIFICATION
     ------------------------------------------------------------------------ */
  _chatDropdownTimer: null,

  showChatDropdownNotification(msg) {
    if (!msg || !msg.message) return;

    let dropdown = document.getElementById('chatNotificationDropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'chatNotificationDropdown';
      dropdown.className = 'chat-dropdown-notification hidden';
      dropdown.setAttribute('role', 'alert');
      dropdown.setAttribute('aria-live', 'assertive');
      document.body.appendChild(dropdown);
    }

    // Clear any previous countdown timer
    if (this._chatDropdownTimer) {
      clearTimeout(this._chatDropdownTimer);
      this._chatDropdownTimer = null;
    }

    const isGroup = msg.channel_type === 'group';
    const senderName = msg.sender_name || 'School Member';
    const senderRole = (msg.sender_role || 'user').toLowerCase();
    const initials = senderName.split(' ').map(w => w.charAt(0)).filter(Boolean).slice(0, 2).join('').toUpperCase() || '💬';

    let roleBadgeClass = 'badge-blue';
    let roleBadgeText = 'Staff';
    if (senderRole === 'admin') {
      roleBadgeClass = 'badge-gold';
      roleBadgeText = 'Admin';
    } else if (senderRole === 'student') {
      roleBadgeClass = 'badge-green';
      roleBadgeText = 'Student';
    }

    const cleanSnippet = this.escapeHtml(msg.message.length > 85 ? (msg.message.slice(0, 85) + '...') : msg.message);
    const headerTitle = isGroup ? `💬 Campus General: ${this.escapeHtml(senderName)}` : `💬 ${this.escapeHtml(senderName)}`;

    dropdown.innerHTML = `
      <div class="chat-dropdown-inner" onclick="schoolController.handleChatNotificationClick(${JSON.stringify(msg).replace(/"/g, '&quot;')})">
        <div class="chat-dropdown-avatar">${this.escapeHtml(initials)}</div>
        <div class="chat-dropdown-content">
          <div class="chat-dropdown-header">
            <div style="display:flex; align-items:center; gap:0.4rem; min-width:0;">
              <span class="chat-dropdown-sender">${headerTitle}</span>
              <span class="badge ${roleBadgeClass} chat-dropdown-badge">${roleBadgeText}</span>
            </div>
            <button type="button" class="chat-dropdown-close" onclick="event.stopPropagation(); SchoolView.hideChatDropdownNotification();" title="Dismiss">✕</button>
          </div>
          <p class="chat-dropdown-message">${cleanSnippet}</p>
        </div>
      </div>
      <div class="chat-dropdown-progress"></div>
    `;

    // Make visible with smooth slide-down animation
    dropdown.classList.remove('hidden');
    // Force browser reflow to restart css animation
    void dropdown.offsetWidth;
    dropdown.classList.add('show');

    // Play subtle audio chime
    this.playChatNotificationChime();

    // Auto-dismiss exactly after 5 seconds (5000ms)
    this._chatDropdownTimer = setTimeout(() => {
      this.hideChatDropdownNotification();
    }, 5000);
  },

  hideChatDropdownNotification() {
    if (this._chatDropdownTimer) {
      clearTimeout(this._chatDropdownTimer);
      this._chatDropdownTimer = null;
    }
    const dropdown = document.getElementById('chatNotificationDropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      setTimeout(() => {
        if (!dropdown.classList.contains('show')) {
          dropdown.classList.add('hidden');
        }
      }, 350);
    }
  },

  playChatNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(698.46, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => { ctx.close().catch(() => {}); }, 400);
    } catch (e) {
      // Audio context may require prior user interaction
    }
  },

  formatRoleBadge(role) {
    const r = (role || '').toLowerCase();
    if (r === 'admin') {
      return '<span class="badge badge-gold" style="font-size:0.68rem; padding:2px 7px;">Admin</span>';
    }
    if (r === 'staff') {
      return '<span class="badge badge-blue" style="font-size:0.68rem; padding:2px 7px;">Staff / Faculty</span>';
    }
    if (r === 'student') {
      return '<span class="badge badge-green" style="font-size:0.68rem; padding:2px 7px;">Student</span>';
    }
    return `<span class="badge" style="font-size:0.68rem; padding:2px 7px;">${this.escapeHtml(role || 'User')}</span>`;
  },

  _formatChatTime(dateString) {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  },

  renderCampusChat(mountTargetId, sidebarData, type = 'group', target = 'general', messagesData = {}, currentUser = null, isModal = false) {
    const mount = document.getElementById(mountTargetId);
    if (!mount) return;

    const myUser = currentUser || (sidebarData && sidebarData.current_user) || {};
    const myName = this.escapeHtml(myUser.name || 'User');
    const myRole = (myUser.role || 'student').toLowerCase();
    const myId = myUser.formatted_id || `ID: ${myUser.id || ''}`;
    const myInitials = (myName.split(' ').map(n => n[0]).join('').slice(0, 2)).toUpperCase();

    const general = (sidebarData && sidebarData.general_channel) || {
      id: 'general',
      name: 'General Community Group',
      topic: 'Public campus forum for all Students, Staff & Administration',
      total_members: 1,
      last_message: 'No messages yet'
    };

    const contacts = (sidebarData && sidebarData.contacts) || [];
    const isGeneral = (type === 'group' && target === 'general');
    const targetInfo = (messagesData && messagesData.target_info) || {};

    const targetTitle = isGeneral
      ? '# General Community Group <span class="badge badge-green" style="font-size:.65rem; padding:.1rem .4rem;">School Forum</span>'
      : `${this.escapeHtml(targetInfo.name || 'Direct Message')} ${this.formatRoleBadge(targetInfo.role)}`;

    const targetSub = isGeneral
      ? `${general.total_members || 1} campus participants · Public Announcements & Study Forum`
      : `<span class="wa-status-online">● online</span> · ${this.formatRoleBadge(targetInfo.role)} · ${this.escapeHtml(targetInfo.formatted_id || '')} · ${this.escapeHtml(targetInfo.department || '')}`;

    mount.innerHTML = `
      <div class="wa-chat-container">
        <div class="wa-chat-layout">
          <!-- LEFT SIDEBAR -->
          <div class="wa-sidebar" id="chatSidebarCol">
            <!-- Sidebar Header -->
            <div class="wa-sidebar-top">
              <div class="wa-user-profile-bar" title="${myName} (${myRole.toUpperCase()})">
                <div class="wa-avatar-self ${myRole}-avatar">${myInitials}</div>
                <div class="wa-self-info">
                  <div class="wa-self-name">${myName}</div>
                  <div class="wa-self-badge">${this.formatRoleBadge(myRole)} • ${this.escapeHtml(myId)}</div>
                </div>
              </div>
              <div class="wa-header-actions">
                <button type="button" class="wa-icon-action" onclick="schoolController.refreshActiveChat()" title="Refresh channels">🔄</button>
                ${isModal ? `<button type="button" class="wa-icon-action" onclick="schoolController.closeCampusChatModal()" title="Close chat">✕</button>` : ''}
              </div>
            </div>

            <!-- Search Section -->
            <div class="wa-search-section">
              <div class="wa-search-capsule">
                <span class="wa-search-icon">🔍</span>
                <input type="text" id="chatSearchInput" class="wa-search-input" placeholder="Search contacts, faculty or staff..." oninput="schoolController.filterChatContacts(this.value)" autocomplete="off">
                <button type="button" class="wa-search-clear" onclick="schoolController.clearChatSearch()" title="Clear search">✕</button>
              </div>
            </div>

            <!-- Filter Chips -->
            <div class="wa-filter-chips">
              <button type="button" class="wa-chip active" data-role="all" onclick="schoolController.filterChatRole('all')">All Chats</button>
              <button type="button" class="wa-chip" data-role="admin" onclick="schoolController.filterChatRole('admin')">Admins</button>
              <button type="button" class="wa-chip" data-role="staff" onclick="schoolController.filterChatRole('staff')">Staff & Teachers</button>
              <button type="button" class="wa-chip" data-role="student" onclick="schoolController.filterChatRole('student')">Students</button>
            </div>

            <!-- Contacts & Channel List -->
            <div class="wa-contact-list" id="chatContactsList">
              <!-- General Channel Tile -->
              <div class="wa-contact-tile ${isGeneral ? 'active' : ''}" id="channel-general" onclick="schoolController.selectChatTarget('group', 'general')">
                <div class="wa-avatar-wrap">
                  <div class="wa-avatar group-avatar">👥</div>
                  <span class="wa-online-dot" style="background:#10b981;"></span>
                </div>
                <div class="wa-tile-main">
                  <div class="wa-tile-top">
                    <span class="wa-tile-name"># General Community Group</span>
                    <span class="wa-tile-time">${general.last_message_time ? this._formatChatTime(general.last_message_time) : ''}</span>
                  </div>
                  <div class="wa-tile-bottom">
                    <div class="wa-tile-preview-wrap">
                      <span class="wa-tile-preview">${this.escapeHtml(general.last_message || 'Public campus forum')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contact Tiles List (populated dynamically) -->
              <div id="chatContactsItems"></div>
            </div>
          </div>

          <!-- RIGHT MAIN CHAT AREA -->
          <div class="wa-chat-area" id="chatMainCol">
            <!-- Chat Header -->
            <div class="wa-chat-header">
              <div class="wa-chat-header-profile">
                <button type="button" class="wa-mobile-back" onclick="schoolController.showMobileSidebar()" title="Back to chat list">←</button>
                <div class="wa-chat-header-info">
                  <div class="wa-chat-header-name" id="chatActiveTargetTitle">${targetTitle}</div>
                  <div class="wa-chat-header-status" id="chatActiveTargetSub">${targetSub}</div>
                </div>
              </div>
              <div class="wa-chat-header-actions" style="display:flex; align-items:center; gap:.5rem;">
                <button type="button" class="btn-sm" onclick="schoolController.handleClearChatPrompt()" title="Clear messages from chat" style="background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.25); border-radius:8px; padding:.32rem .65rem; font-size:.75rem; font-weight:750; cursor:pointer; display:inline-flex; align-items:center; gap:.3rem;">
                  <span>🧹</span> Clear Chat
                </button>
                <button type="button" class="wa-icon-action" onclick="schoolController.refreshActiveChat()" title="Refresh messages">🔄</button>
                ${isModal ? `<button type="button" class="wa-icon-action" onclick="schoolController.closeCampusChatModal()" title="Close chat">✕</button>` : ''}
              </div>
            </div>

            <!-- Chat Wallpaper & Messages Stream -->
            <div class="wa-chat-wallpaper" style="flex:1; display:flex; flex-direction:column; min-height:0; position:relative; overflow:hidden;">
              <div class="wa-messages-stream" id="chatMessagesStream" onscroll="schoolController.handleChatScroll(this)"></div>

              <!-- Scroll to bottom button -->
              <button type="button" class="wa-scroll-down-btn hidden" id="waScrollDownBtn" onclick="schoolController.scrollChatToBottomSmooth()" title="Scroll to latest">
                ↓
              </button>
            </div>

            <!-- Composer Wrapper -->
            <div class="wa-composer-wrap">
              <!-- Quick Emoji Tray -->
              <div class="wa-emoji-tray" id="waEmojiTray">
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('👍')">👍</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('👏')">👏</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('❤️')">❤️</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('😊')">😊</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('📚')">📚</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('✍️')">✍️</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('🎯')">🎯</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('🔥')">🔥</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('🎉')">🎉</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('💡')">💡</span>
                <span class="wa-emoji-item" onclick="schoolController.insertEmoji('🙏')">🙏</span>
              </div>

              <!-- Quick Academic Attachment Tray -->
              <div class="wa-attach-tray" id="waAttachTray">
                <button type="button" class="wa-attach-pill" onclick="schoolController.insertAttachment('📖 Question about WAEC past question: ')"><span>📖</span> WAEC Question</button>
                <button type="button" class="wa-attach-pill" onclick="schoolController.insertAttachment('⚡ Question about JAMB CBT test: ')"><span>⚡</span> JAMB Query</button>
                <button type="button" class="wa-attach-pill" onclick="schoolController.insertAttachment('📝 Assignment clarification request: ')"><span>📝</span> Assignment Help</button>
                <button type="button" class="wa-attach-pill" onclick="schoolController.insertAttachment('💳 School fees verification inquiry: ')"><span>💳</span> Fees Inquiry</button>
              </div>

              <!-- Bar -->
              <form class="wa-composer-bar" onsubmit="schoolController.handleSendChatMessage(event)">
                <button type="button" class="wa-tool-btn" onclick="schoolController.toggleEmojiTray()" title="Insert emoji">😊</button>
                <button type="button" class="wa-tool-btn" onclick="schoolController.toggleAttachTray()" title="Quick academic prompts">📎</button>
                <div class="wa-input-capsule">
                  <input type="text" id="chatMessageInput" class="wa-chat-input" placeholder="Type a message to ${isGeneral ? '#General' : this.escapeHtml(targetInfo.name || 'contact')}..." onkeydown="schoolController.handleChatInputKeydown(event)" autocomplete="off">
                </div>
                <button type="submit" id="chatSendBtn" class="wa-send-circle" title="Send message">
                  <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Populate contacts
    this.renderChatContactsList(contacts, target, 'all', '', general);

    // Populate messages
    const msgs = (messagesData && messagesData.messages) || [];
    this.renderChatMessagesStream(msgs, targetInfo, myUser);
  },

  renderChatContactsList(contacts = [], activeTarget = 'general', roleFilter = 'all', searchQuery = '', generalChannel = null) {
    const listEl = document.getElementById('chatContactsItems');
    if (!listEl) return;

    // Filter contacts
    let filtered = contacts.slice();
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(c => (c.role || '').toLowerCase() === roleFilter.toLowerCase());
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => {
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const id = (c.formatted_id || '').toLowerCase();
        const dept = (c.department || '').toLowerCase();
        const prog = (c.program || '').toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q) || dept.includes(q) || prog.includes(q);
      });
    }

    // Optionally update general channel preview if provided
    if (generalChannel) {
      const genTile = document.getElementById('channel-general');
      if (genTile) {
        const pEl = genTile.querySelector('.wa-tile-preview');
        const tEl = genTile.querySelector('.wa-tile-time');
        if (pEl && generalChannel.last_message) pEl.textContent = generalChannel.last_message;
        if (tEl && generalChannel.last_message_time) tEl.textContent = this._formatChatTime(generalChannel.last_message_time);
      }
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--wa-text-secondary); font-size: 0.8rem;">
          No contacts found matching criteria.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(c => {
      const cid = c.id;
      const isActive = String(activeTarget) === String(cid);
      const role = (c.role || 'student').toLowerCase();
      const initials = (c.name.split(' ').map(n => n[0]).join('').slice(0, 2)).toUpperCase();
      const unreadCount = Number(c.unread_count) || 0;
      const lastMsg = c.last_message || `Tap to message ${role}`;
      const lastTime = c.last_message_time ? this._formatChatTime(c.last_message_time) : '';

      return `
        <div class="wa-contact-tile ${isActive ? 'active' : ''}" id="contact-item-${cid}" onclick="schoolController.selectChatTarget('direct', ${cid})">
          <div class="wa-avatar-wrap">
            <div class="wa-avatar ${role}-avatar">${initials}</div>
            <span class="wa-online-dot"></span>
          </div>
          <div class="wa-tile-main">
            <div class="wa-tile-top">
              <span class="wa-tile-name">${this.escapeHtml(c.name)}</span>
              <span class="wa-tile-time">${lastTime}</span>
            </div>
            <div class="wa-tile-bottom">
              <div class="wa-tile-preview-wrap">
                <span class="wa-tile-preview">${this.escapeHtml(lastMsg)}</span>
              </div>
              ${unreadCount > 0 ? `<span class="wa-unread-badge">${unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderChatMessagesStream(msgs = [], targetInfo = {}, currentUser = {}) {
    const stream = document.getElementById('chatMessagesStream');
    if (!stream) return;

    if (!msgs || msgs.length === 0) {
      stream.innerHTML = `
        <div class="wa-empty-chat">
          <div class="wa-empty-card">
            <div class="wa-empty-icon">💬</div>
            <h4>No messages here yet</h4>
            <p>Send a message below to start the conversation with <strong>${this.escapeHtml(targetInfo.name || 'this contact')}</strong>.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    let lastDate = '';

    const myId = Number(currentUser.id || (schoolModel.user && schoolModel.user.id) || 0);
    const myRole = (currentUser.role || (schoolModel.user && schoolModel.user.role) || '').toLowerCase();

    msgs.forEach(m => {
      const msgDate = m.created_at ? new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
      if (msgDate !== lastDate) {
        html += `<div class="wa-date-divider"><span>${msgDate}</span></div>`;
        lastDate = msgDate;
      }

      const isMine = m.is_mine !== undefined ? !!m.is_mine : (Number(m.sender_id) === myId);
      const isGroup = (m.channel_type === 'group');
      const senderRole = (m.sender_role || 'student').toLowerCase();
      const senderName = this.escapeHtml(m.sender_name || 'User');
      const timeStr = m.formatted_time || (m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

      // Delete permission logic:
      // - If my own message: can delete (for me or for everyone)
      // - In direct chat (DM): can delete any message "for me"
      // - In community group: admin can delete anyone's message; non-admin can only delete their own
      const canDelete = isMine || (myRole === 'admin') || (!isGroup);

      html += `
        <div class="wa-msg-row ${isMine ? 'sent' : 'received'}" id="msg-row-${m.id}">
          <div class="wa-bubble">
            ${(!isMine && isGroup) ? `
              <div class="wa-bubble-sender-line ${senderRole}-name">
                <span>${senderName}</span>
                ${this.formatRoleBadge(senderRole)}
              </div>
            ` : ''}
            <p class="wa-bubble-text">${this.escapeHtml(m.message)}</p>
            <span class="wa-bubble-meta">
              ${canDelete ? `<button type="button" class="wa-msg-delete-btn" onclick="schoolController.promptDeleteChatMessage(${m.id}, ${isMine ? 'true' : 'false'}, ${isGroup ? 'true' : 'false'})" title="Delete message">🗑</button>` : ''}
              <span>${timeStr}</span>
              ${isMine ? `<span class="wa-double-check">✓✓</span>` : ''}
            </span>
          </div>
        </div>
      `;
    });

    stream.innerHTML = html;
    // Scroll to bottom
    stream.scrollTop = stream.scrollHeight;
  },

  appendChatMessage(m, currentUser = {}) {
    const stream = document.getElementById('chatMessagesStream');
    if (!stream) return;

    // Check if already in stream
    if (document.getElementById(`msg-row-${m.id}`)) return;

    // Remove empty chat state if present
    const empty = stream.querySelector('.wa-empty-chat');
    if (empty) empty.remove();

    const myId = Number(currentUser.id || (schoolModel.user && schoolModel.user.id) || 0);
    const myRole = (currentUser.role || (schoolModel.user && schoolModel.user.role) || '').toLowerCase();

    const isMine = m.is_mine !== undefined ? !!m.is_mine : (Number(m.sender_id) === myId);
    const isGroup = (m.channel_type === 'group');
    const senderRole = (m.sender_role || 'student').toLowerCase();
    const senderName = this.escapeHtml(m.sender_name || 'User');
    const timeStr = m.formatted_time || (m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    const canDelete = isMine || (myRole === 'admin') || (!isGroup);

    const row = document.createElement('div');
    row.className = `wa-msg-row ${isMine ? 'sent' : 'received'}`;
    row.id = `msg-row-${m.id}`;
    row.innerHTML = `
      <div class="wa-bubble">
        ${(!isMine && isGroup) ? `
          <div class="wa-bubble-sender-line ${senderRole}-name">
            <span>${senderName}</span>
            ${this.formatRoleBadge(senderRole)}
          </div>
        ` : ''}
        <p class="wa-bubble-text">${this.escapeHtml(m.message)}</p>
        <span class="wa-bubble-meta">
          ${canDelete ? `<button type="button" class="wa-msg-delete-btn" onclick="schoolController.promptDeleteChatMessage(${m.id}, ${isMine ? 'true' : 'false'}, ${isGroup ? 'true' : 'false'})" title="Delete message">🗑</button>` : ''}
          <span>${timeStr}</span>
          ${isMine ? `<span class="wa-double-check">✓✓</span>` : ''}
        </span>
      </div>
    `;

    stream.appendChild(row);
    stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
  },

  removeChatMessage(messageId) {
    const el = document.getElementById(`msg-row-${messageId}`);
    if (el) {
      el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9)';
      setTimeout(() => el.remove(), 200);
    }
  },

  /* ------------------------------------------------------------------------
     ASSET URL RESOLVER (FOR CLEAN FRONTEND / BACKEND PATH RESOLUTION)
     ------------------------------------------------------------------------ */
  resolveAssetUrl(url) {
    if (!url || typeof url !== 'string' || url === '#' || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const isLocalhost = (typeof window !== 'undefined' && window.location && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

    if (isLocalhost && !window.USE_REMOTE_BACKEND) {
      const inFrontend = window.location.pathname.includes('/frontend');
      if (inFrontend) {
        if (url.startsWith('../backend/')) return url;
        if (url.startsWith('backend/')) return '../' + url;
        if (url.startsWith('uploads/')) return '../backend/' + url;
        if (!url.startsWith('../')) return '../' + url.replace(/^\//, '');
      }
      return url;
    }

    if (window.schoolModel && typeof window.schoolModel.resolveApiUrl === 'function') {
      return window.schoolModel.resolveApiUrl(url);
    }

    const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL)
        ? window.API_BASE_URL.replace(/\/+$/, '')
        : 'https://school-portal-backend-l4l2.onrender.com';
    return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
  },

  /* ==========================================================================
     STUDENT LEADERBOARD & PEER PROXIMITY RENDERER
     ========================================================================== */
  renderStudentLeaderboard(res = {}, currentUserId = 0) {
    const standingContainer = this.element('studentStandingContainer');
    const tbody = this.element('studentLeaderboardRows');
    const totalBadge = this.element('studentLeaderboardTotalBadge');

    const leaderboard = Array.isArray(res.leaderboard) ? res.leaderboard : [];
    const myStanding = res.my_standing;

    // Cache for client search / filter
    window._cachedStudentLeaderboard = leaderboard;
    window._cachedStudentMyStanding = myStanding;

    if (totalBadge) {
      totalBadge.textContent = `${res.total_students || leaderboard.length} Students Ranked`;
    }

    // 1. Render Student's Own Standing & Peer Proximity Card
    if (standingContainer) {
      if (myStanding) {
        const myRank = myStanding.rank;
        const total = myStanding.total_students;
        const b = myStanding.breakdown || {};
        const c = myStanding.counts || {};
        const before = myStanding.immediately_before;
        const after = myStanding.immediately_after;

        let medalEmoji = myRank === 1 ? '🥇' : (myRank === 2 ? '🥈' : (myRank === 3 ? '🥉' : '🎖️'));
        let rankBadgeClass = myRank === 1 ? 'rank-1' : (myRank === 2 ? 'rank-2' : (myRank === 3 ? 'rank-3' : 'rank-other'));

        let proximityHtml = '';
        if (myStanding.is_first) {
          proximityHtml = `
            <div class="lb-peer-card is-ahead" style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 2px solid #eab308;">
              <div class="lb-peer-header" style="color:#b45309;">👑 LEADER OF THE SCHOOL • 1ST PLACE</div>
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.5rem;">
                <div>
                  <div class="lb-peer-name" style="font-size:1.1rem; color:#854d0e;">🏆 Congratulations, ${this.escapeHtml(myStanding.name)}!</div>
                  <p style="margin:0; font-size:.82rem; color:var(--text);">You are holding the #1 position on the school-wide leaderboard with <strong>${myStanding.total_points} total points</strong>.</p>
                </div>
                ${after ? `
                  <div style="text-align:right;">
                    <span style="font-size:.76rem; color:var(--muted); display:block;">Lead Cushion</span>
                    <strong style="color:#10b981; font-size:1.05rem;">+${after.points_behind} pts</strong> ahead of #${after.rank}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        } else if (before) {
          proximityHtml = `
            <div class="lb-peer-card is-ahead">
              <div class="lb-peer-header">⚡ IMMEDIATELY AHEAD OF YOU (#${before.rank})</div>
              <div class="lb-peer-name">${this.escapeHtml(before.name)}</div>
              <div class="lb-peer-meta">${this.escapeHtml(before.department)} • ${before.total_points} pts</div>
              <div class="lb-gap-badge">
                🎯 Target: <strong>+${before.points_needed} pts</strong> to claim Rank #${before.rank}
              </div>
            </div>
            ${after ? `
              <div class="lb-peer-card is-behind">
                <div class="lb-peer-header">🛡️ RIGHT BEHIND YOU (#${after.rank})</div>
                <div class="lb-peer-name">${this.escapeHtml(after.name)}</div>
                <div class="lb-peer-meta">${this.escapeHtml(after.department)} • ${after.total_points} pts</div>
                <div class="lb-gap-badge" style="background:rgba(234, 179, 8, 0.12); color:#b45309;">
                  ⚠️ Cushion: <strong>+${after.points_behind} pts</strong> ahead of #${after.rank}
                </div>
              </div>
            ` : `
              <div class="lb-peer-card is-behind" style="display:flex; align-items:center; justify-content:center; text-align:center;">
                <p style="margin:0; font-size:.8rem; color:var(--muted);">You are currently defending the boundary rank of your division!</p>
              </div>
            `}
          `;
        }

        standingContainer.innerHTML = `
          <div class="lb-standing-card">
            <div class="lb-rank-badge ${rankBadgeClass}">
              <span>${medalEmoji}</span>
              <span>#${myRank}</span>
            </div>
            <div class="lb-standing-body">
              <div class="lb-standing-title">
                <span>${this.escapeHtml(myStanding.name)}</span>
                <span class="badge badge-blue">${this.escapeHtml(myStanding.department || 'General')}</span>
                <span class="badge badge-gold">${this.escapeHtml(myStanding.program || 'WAEC')}</span>
              </div>
              <p style="margin:0; font-size:.82rem; color:var(--muted);">
                Rank <strong>#${myRank}</strong> of <strong>${total}</strong> registered students • <strong>${myStanding.total_points} Total Merit Points</strong> (Avg Score: ${myStanding.average_score}%)
              </p>
              <div class="lb-breakdown-bar">
                <span class="lb-pill" title="Assignments Points">📝 ${b.assignment || 0} pts (${c.assignment || 0} tasks)</span>
                <span class="lb-pill" title="Classwork Points">📚 ${b.classwork || 0} pts (${c.classwork || 0} tasks)</span>
                <span class="lb-pill" title="Tests Points">🧪 ${b.test || 0} pts (${c.test || 0} tests)</span>
                <span class="lb-pill" title="Exams Points">🎓 ${b.exam || 0} pts (${c.exam || 0} exams)</span>
                <span class="lb-pill" title="Attendance Points">📅 ${b.attendance || 0} pts (${c.attendance_days || 0} days)</span>
              </div>
              <div class="lb-peers-grid">
                ${proximityHtml}
              </div>
            </div>
          </div>
        `;
      } else {
        standingContainer.innerHTML = `
          <div class="card" style="padding:1rem; text-align:center; color:var(--muted); font-size:.85rem;">
            Log in with an enrolled student account to view your live standing and peer proximity.
          </div>
        `;
      }
    }

    // 2. Render Full Leaderboard Table Rows
    if (tbody) {
      if (leaderboard.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No student scores or attendance recorded yet. Complete CBT tests and assignments to earn rank points!</td></tr>`;
        return;
      }
      tbody.innerHTML = this.buildLeaderboardTableRows(leaderboard, currentUserId || (schoolModel.user && schoolModel.user.id));
    }
  },

  buildLeaderboardTableRows(students = [], currentUserId = 0) {
    const curUserId = parseInt(currentUserId || (schoolModel.user && schoolModel.user.id) || 0);

    return students.map(st => {
      const isMe = (parseInt(st.id) === curUserId);
      const rank = st.rank;
      let medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
      const b = st.breakdown || {};
      const initials = (st.name.split(' ').map(n => n[0]).join('').slice(0, 2)).toUpperCase();

      return `
        <tr class="${isMe ? 'lb-row-you' : ''}" id="lb-row-${st.id}">
          <td style="text-align:center; font-weight:800; font-size:1.05rem;">
            <span class="lb-table-medal">${medal}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:.5rem;">
              <div class="wa-avatar student-avatar" style="width:30px; height:30px; font-size:.72rem; flex-shrink:0;">${initials}</div>
              <div>
                <strong style="color:var(--text); font-size:.88rem; display:flex; align-items:center; gap:4px;">
                  ${this.escapeHtml(st.name)}
                  ${isMe ? '<span class="badge badge-green" style="font-size:.65rem; padding:.1rem .35rem;">YOU</span>' : ''}
                </strong>
                <small style="color:var(--muted); font-size:.72rem; font-family:monospace;">${this.escapeHtml(st.formatted_id)}</small>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-blue" style="font-size:.72rem;">${this.escapeHtml(st.department)}</span>
            <span class="badge badge-gold" style="font-size:.72rem; margin-left:3px;">${this.escapeHtml(st.program)}</span>
          </td>
          <td>
            <div class="lb-breakdown-cell">
              <span class="lb-pill-mini" title="Assignments">📝 ${b.assignment || 0}</span>
              <span class="lb-pill-mini" title="Classwork">📚 ${b.classwork || 0}</span>
              <span class="lb-pill-mini" title="Tests">🧪 ${b.test || 0}</span>
              <span class="lb-pill-mini" title="Exams">🎓 ${b.exam || 0}</span>
              <span class="lb-pill-mini" title="Attendance">📅 ${b.attendance || 0}</span>
            </div>
          </td>
          <td style="text-align:right;">
            <span style="font-size:1.05rem; font-weight:850; color:#10b981;">${st.total_points}</span>
            <small style="display:block; color:var(--muted); font-size:.7rem;">Avg: ${st.average_score}%</small>
          </td>
          <td style="text-align:center;">
            <span class="badge ${rank <= 3 ? 'badge-gold' : 'badge-green'}" style="font-size:.7rem;">
              ${this.escapeHtml(st.tier || 'Active')}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ==========================================================================
     STAFF LEADERBOARD RENDERER (SEGREGATED WAEC & JAMB)
     ========================================================================== */
  renderStaffLeaderboard(res = {}, prog = 'WAEC') {
    const tbody = this.element('staffLeaderboardRows');
    const badge = this.element('staffLeaderboardTotalBadge');

    const leaderboard = Array.isArray(res.leaderboard) 
      ? res.leaderboard 
      : ((prog === 'JAMB' ? res.jamb_leaderboard : res.waec_leaderboard) || []);

    window._cachedStaffLeaderboard = leaderboard;
    window._cachedStaffLeaderboardRes = res;

    // Update program tabs
    const waecTab = this.element('staffLbTabWaec');
    const jambTab = this.element('staffLbTabJamb');
    if (waecTab) waecTab.classList.toggle('active', prog === 'WAEC');
    if (jambTab) jambTab.classList.toggle('active', prog === 'JAMB');

    if (badge) {
      badge.textContent = `${res.total_students || leaderboard.length} ${prog} Students Ranked`;
    }

    if (!tbody) return;

    if (leaderboard.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No ${prog} student scores or attendance recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.buildLeaderboardTableRows(leaderboard, 0);
  },

  /* ==========================================================================
     ADMIN LEADERBOARD RENDERER (SEGREGATED WAEC & JAMB)
     ========================================================================== */
  renderAdminLeaderboard(res = {}, prog = 'WAEC') {
    const tbody = this.element('adminLeaderboardRows');
    const badge = this.element('adminLeaderboardTotalBadge');

    const leaderboard = Array.isArray(res.leaderboard) 
      ? res.leaderboard 
      : ((prog === 'JAMB' ? res.jamb_leaderboard : res.waec_leaderboard) || []);

    window._cachedAdminLeaderboard = leaderboard;
    window._cachedAdminLeaderboardRes = res;

    // Update program tabs
    const waecTab = this.element('adminLbTabWaec');
    const jambTab = this.element('adminLbTabJamb');
    if (waecTab) waecTab.classList.toggle('active', prog === 'WAEC');
    if (jambTab) jambTab.classList.toggle('active', prog === 'JAMB');

    if (badge) {
      badge.textContent = `${res.total_students || leaderboard.length} ${prog} Students Ranked`;
    }

    if (!tbody) return;

    if (leaderboard.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No ${prog} student scores or attendance recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.buildLeaderboardTableRows(leaderboard, 0);
  },

  /* ==========================================================================
     STUDENT ATTENDANCE RENDERER
     ========================================================================== */
  renderStudentAttendance(res = {}) {
    const summary = res.summary || {};
    const records = Array.isArray(res.data) ? res.data : [];

    const presentEl = this.element('presentCount');
    const absentEl = this.element('absentCount');
    const lateEl = this.element('lateCount');
    const tbody = this.element('attendanceRows');

    if (presentEl) presentEl.textContent = summary.present || 0;
    if (absentEl) absentEl.textContent = summary.absent || 0;
    if (lateEl) lateEl.textContent = summary.late || 0;

    if (tbody) {
      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No attendance logs found. Active class attendance automatically earns leaderboard points!</td></tr>`;
        return;
      }

      tbody.innerHTML = records.map(r => {
        let badge = '<span class="badge badge-green">✓ Present (+10 pts)</span>';
        if (r.status === 'absent') badge = '<span class="badge badge-red">✗ Absent</span>';
        else if (r.status === 'late') badge = '<span class="badge badge-gold">⏳ Late (+5 pts)</span>';

        const d = r.date ? new Date(r.date) : new Date();
        const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const dayStr = d.toLocaleDateString('en-GB', { weekday: 'long' });

        return `
          <tr>
            <td><strong>${dateStr}</strong></td>
            <td>${dayStr}</td>
            <td><span class="badge badge-blue">${this.escapeHtml(r.subject || 'Class Session')}</span></td>
            <td>${badge}</td>
            <td><small style="color:var(--muted);">Regular class session attendance</small></td>
          </tr>
        `;
      }).join('');
    }
  },

  /* ==========================================================================
     SCHOOL NOTICES & BULLETINS RENDERERS
     ========================================================================== */
  formatFileSize(bytes) {
    if (!bytes || isNaN(bytes) || Number(bytes) <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let num = Number(bytes);
    while (num >= 1024 && i < units.length - 1) {
      num /= 1024;
      i++;
    }
    return `${num.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  },

  formatNoticeCategoryBadge(cat) {
    const map = {
      official: { label: 'Official Announcement', class: 'badge-blue' },
      urgent: { label: '🚨 Urgent Alert', class: 'badge-red' },
      academic: { label: '📚 Academic', class: 'badge-purple' },
      administrative: { label: '📋 Directive', class: 'badge-gold' },
      event: { label: '🎉 Event & Holiday', class: 'badge-green' }
    };
    const c = map[cat] || { label: cat || 'General', class: 'badge-blue' };
    return `<span class="badge ${c.class}">${c.label}</span>`;
  },

  formatNoticeAudienceBadge(aud) {
    const map = {
      student: { label: '🎓 Students Only', class: 'badge-green' },
      staff: { label: '👨‍🏫 Staff Only', class: 'badge-gold' },
      all: { label: '🌐 School-Wide (All)', class: 'badge-blue' }
    };
    const a = map[aud] || { label: aud || 'All', class: 'badge-blue' };
    return `<span class="badge ${a.class}">${a.label}</span>`;
  },

  renderNoticeAttachment(n) {
    if (!n.attachment_url) return '';
    const name = n.attachment_name || 'Attachment File';
    const size = typeof n.attachment_size === 'string' && isNaN(Number(n.attachment_size))
      ? n.attachment_size 
      : this.formatFileSize(n.attachment_size);
    const ext = (n.attachment_type || '').toLowerCase();
    let icon = '📎';
    if (ext === 'pdf') icon = '📄';
    else if (['doc', 'docx'].includes(ext)) icon = '📝';
    else if (['xls', 'xlsx'].includes(ext)) icon = '📊';
    else if (['ppt', 'pptx'].includes(ext)) icon = '📑';
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) icon = '🖼️';
    else if (ext === 'zip') icon = '🗜️';

    return `
      <div style="margin-top:0.75rem;">
        <a href="${this.escapeHtml(this.resolveAssetUrl(n.attachment_url))}" target="_blank" rel="noopener noreferrer" download="${this.escapeHtml(name)}" class="notice-attachment-pill" title="Click to view or download ${this.escapeHtml(name)}">
          <span>${icon}</span>
          <span style="font-weight:750;">${this.escapeHtml(name)}</span>
          <span style="opacity:0.75; font-size:0.74rem; font-weight:600;">(${size})</span>
          <span style="margin-left:auto; font-size:0.75rem;">⬇️ Download</span>
        </a>
      </div>
    `;
  },

  renderTopNoticeBanner(notices = [], targetType = 'student') {
    const bannerId = targetType === 'student' ? 'studentTopNoticesBanner' : (targetType === 'staff' ? 'staffTopNoticesBanner' : 'adminTopNoticesBanner');
    const el = this.element(bannerId);
    if (!el) return;

    if (!Array.isArray(notices) || notices.length === 0) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';
    const topNotice = notices.find(n => Number(n.is_pinned) === 1) || notices[0];
    const isUrgent = topNotice.category === 'urgent';
    const otherCount = notices.length - 1;

    const navAction = targetType === 'student' 
      ? `openWorkspace('notices')` 
      : (targetType === 'staff' ? `selectStaffWorkspaceDropdownItem('notices')` : `selectAdminWorkspaceDropdownItem('notices')`);

    el.innerHTML = `
      <div class="top-notice-alert-bar ${isUrgent ? 'urgent' : ''}" style="display:flex; align-items:center; justify-content:space-between; gap:.85rem; padding:.65rem 1rem; border-radius:12px; margin-bottom:1rem; background:${isUrgent ? 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08))' : 'linear-gradient(90deg, rgba(59,130,246,0.10), rgba(16,185,129,0.07))'}; border:1.5px solid ${isUrgent ? '#ef4444' : '#3b82f6'};">
        <div style="display:flex; align-items:center; gap:.75rem; flex:1; min-width:0;">
          <span style="font-size:1.35rem; line-height:1;">${isUrgent ? '🚨' : '📢'}</span>
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
              <span class="badge ${isUrgent ? 'badge-red' : 'badge-blue'}" style="font-size:.68rem; padding:.15rem .45rem; font-weight:800; text-transform:uppercase;">
                ${isUrgent ? 'Urgent Alert' : 'School Bulletin'}
              </span>
              <strong style="font-size:.88rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${this.escapeHtml(topNotice.title)}
              </strong>
            </div>
            <p style="margin:.15rem 0 0; font-size:.78rem; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:850px;">
              ${this.escapeHtml(topNotice.content)}
            </p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:.55rem; flex-shrink:0;">
          ${otherCount > 0 ? `<span class="badge badge-gold" style="font-size:.7rem; padding:.2rem .5rem;">+${otherCount} more</span>` : ''}
          <button type="button" class="btn-sm btn-primary" onclick="${navAction}" style="padding:.32rem .75rem; font-size:.75rem; font-weight:750; border-radius:8px; white-space:nowrap; cursor:pointer;">
            View All Bulletins →
          </button>
        </div>
      </div>
    `;
  },

  renderStudentNotices(notices = []) {
    this.renderTopNoticeBanner(notices, 'student');
    const container = this.element('studentSchoolNoticesContainer');
    const badge = this.element('studentNoticesCountBadge');
    if (badge) {
      badge.textContent = `${notices.length} Notice${notices.length === 1 ? '' : 's'}`;
    }
    if (!container) return;

    if (!Array.isArray(notices) || notices.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:2.2rem 1rem; text-align:center;">
          <div style="font-size:2rem; margin-bottom:.5rem;">📢</div>
          <strong style="display:block; font-size:1rem; margin-bottom:.3rem;">No Student Notices at this time</strong>
          <p style="color:var(--muted); font-size:.85rem; margin:0;">All official school announcements, examination schedules, and circulars for students will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notices.map(n => {
      const isPinned = Number(n.is_pinned) === 1;
      const targetLabel = n.target_audience === 'all' ? '🌐 School-Wide' : '🎓 Student Circular';
      const createdStr = n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

      return `
        <article class="notice-card ${isPinned ? 'is-pinned' : ''}" id="student-notice-${n.id}">
          <div class="notice-card-header">
            <div>
              <h3 class="notice-card-title">
                ${isPinned ? '<span title="Pinned announcement" style="color:#eab308; font-size:1.1rem;">📌</span>' : ''}
                <span>${this.escapeHtml(n.title)}</span>
              </h3>
              <div class="notice-card-meta">
                <span>By <strong>${this.escapeHtml(n.author_name || 'School Administration')}</strong></span>
                <span>•</span>
                <span>${createdStr}</span>
                <span>•</span>
                <span class="badge ${n.target_audience === 'all' ? 'badge-blue' : 'badge-green'}" style="font-size:0.68rem; padding:0.15rem 0.5rem;">${targetLabel}</span>
              </div>
            </div>
            <div>
              ${this.formatNoticeCategoryBadge(n.category)}
            </div>
          </div>
          <div class="notice-card-body">${this.escapeHtml(n.content)}</div>
          ${this.renderNoticeAttachment(n)}
        </article>
      `;
    }).join('');
  },

  renderStaffNotices(notices = []) {
    this.renderTopNoticeBanner(notices, 'staff');
    const container = this.element('staffNotifications');
    const badge = this.element('staffNoticesCountBadge');
    if (badge) {
      badge.textContent = `${notices.length} Update${notices.length === 1 ? '' : 's'}`;
    }
    if (!container) return;

    if (!Array.isArray(notices) || notices.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:2.2rem 1rem; text-align:center;">
          <div style="font-size:2rem; margin-bottom:.5rem;">📢</div>
          <strong style="display:block; font-size:1rem; margin-bottom:.3rem;">No Staff Updates at this time</strong>
          <p style="color:var(--muted); font-size:.85rem; margin:0;">Internal administrative directives, academic deadlines, guidelines, and directives published specifically for staff will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notices.map(n => {
      const isPinned = Number(n.is_pinned) === 1;
      const targetLabel = n.target_audience === 'all' ? '🌐 School-Wide' : '👨‍🏫 Staff Directive';
      const createdStr = n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

      return `
        <article class="notice-card ${isPinned ? 'is-pinned' : ''}" id="staff-notice-${n.id}">
          <div class="notice-card-header">
            <div>
              <h3 class="notice-card-title">
                ${isPinned ? '<span title="Pinned announcement" style="color:#eab308; font-size:1.1rem;">📌</span>' : ''}
                <span>${this.escapeHtml(n.title)}</span>
              </h3>
              <div class="notice-card-meta">
                <span>By <strong>${this.escapeHtml(n.author_name || 'School Administration')}</strong></span>
                <span>•</span>
                <span>${createdStr}</span>
                <span>•</span>
                <span class="badge ${n.target_audience === 'all' ? 'badge-blue' : 'badge-gold'}" style="font-size:0.68rem; padding:0.15rem 0.5rem;">${targetLabel}</span>
              </div>
            </div>
            <div>
              ${this.formatNoticeCategoryBadge(n.category)}
            </div>
          </div>
          <div class="notice-card-body">${this.escapeHtml(n.content)}</div>
          ${this.renderNoticeAttachment(n)}
        </article>
      `;
    }).join('');
  },

  renderAdminNotices(notices = [], counts = {}, activeAudience = 'all') {
    this.renderTopNoticeBanner(notices, 'admin');
    const tbody = this.element('adminNoticesRows');
    const countAll = this.element('adminNoticeCountAll');
    const countStudent = this.element('adminNoticeCountStudent');
    const countStaff = this.element('adminNoticeCountStaff');

    if (countAll) countAll.textContent = counts.all !== undefined ? (counts.total || 0) : (counts.total || 0);
    if (countStudent) countStudent.textContent = counts.student || 0;
    if (countStaff) countStaff.textContent = counts.staff || 0;

    // Update audience tabs
    ['all', 'student', 'staff'].forEach(aud => {
      const tabId = 'adminNoticeTab' + aud.charAt(0).toUpperCase() + aud.slice(1);
      const tabEl = this.element(tabId);
      if (tabEl) {
        if (aud === activeAudience) tabEl.classList.add('active');
        else tabEl.classList.remove('active');
      }
    });

    if (!tbody) return;

    if (!Array.isArray(notices) || notices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="text-align:center; padding:2rem 1rem;">No notices found for this selection. Click "➕ Post New Notice" to publish one.</td></tr>`;
      return;
    }

    tbody.innerHTML = notices.map(n => {
      const isPinned = Number(n.is_pinned) === 1;
      const createdStr = n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      const contentSnippet = (n.content || '').length > 65 ? (n.content.substring(0, 65) + '...') : (n.content || '');

      let fileCell = '<span style="color:var(--muted); font-size:0.75rem;">None</span>';
      if (n.attachment_url) {
        const size = typeof n.attachment_size === 'string' && isNaN(Number(n.attachment_size))
          ? n.attachment_size
          : this.formatFileSize(n.attachment_size);
        fileCell = `
          <a href="${this.escapeHtml(this.resolveAssetUrl(n.attachment_url))}" target="_blank" rel="noopener noreferrer" download="${this.escapeHtml(n.attachment_name || 'file')}" style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.78rem; font-weight:700; color:var(--primary); text-decoration:none;" title="Download file">
            📎 <span style="max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${this.escapeHtml(n.attachment_name || 'File')}</span>
            <span style="color:var(--muted); font-size:0.7rem; font-weight:normal;">(${size})</span>
          </a>
        `;
      }

      return `
        <tr>
          <td style="text-align:center; font-size:1.1rem;">
            ${isPinned ? '<span title="Pinned notice">📌</span>' : '<span style="color:var(--muted); opacity:0.35;">-</span>'}
          </td>
          <td>
            <div style="font-weight:750; font-size:0.86rem; color:var(--text);">${this.escapeHtml(n.title)}</div>
            <div style="font-size:0.74rem; color:var(--muted); margin-top:2px;">${this.escapeHtml(contentSnippet)}</div>
          </td>
          <td>${this.formatNoticeAudienceBadge(n.target_audience)}</td>
          <td>${this.formatNoticeCategoryBadge(n.category)}</td>
          <td>${fileCell}</td>
          <td>
            <div style="font-size:0.78rem; font-weight:650;">${this.escapeHtml(n.author_name || 'Admin')}</div>
            <div style="font-size:0.72rem; color:var(--muted);">${createdStr}</div>
          </td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.openEditNoticeModal(${n.id})" style="padding:.28rem .55rem; font-size:.74rem; margin-right:.3rem;" title="Edit notice">✏️ Edit</button>
            <button type="button" class="btn-sm btn-sm-danger" onclick="schoolController.deleteNotice(${n.id})" style="padding:.28rem .55rem; font-size:.74rem;" title="Delete notice">🗑 Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     16. FINANCIAL RECORD BOOK & BALANCE SHEET
     ------------------------------------------------------------------------ */
  renderFinancialLedger(data = {}) {
    const summary = data.summary || {
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
      income_count: 0,
      expense_count: 0,
      platform_income: 0,
      manual_income: 0,
      platform_expense: 0,
      manual_expense: 0,
      total_transactions: 0,
      paystack_wallet_balance: 0
    };

    const totalIncomeEl = this.element('ledgerTotalIncome');
    const incomeCountBadge = this.element('ledgerIncomeCountBadge');
    const incomeBreakdown = this.element('ledgerIncomeBreakdown');

    const totalExpenseEl = this.element('ledgerTotalExpense');
    const expenseCountBadge = this.element('ledgerExpenseCountBadge');
    const expenseBreakdown = this.element('ledgerExpenseBreakdown');

    const netBalanceEl = this.element('ledgerNetBalance');
    const netStatusHint = this.element('ledgerNetStatusHint');

    const paystackWalletEl = this.element('ledgerPaystackWallet');
    const totalRowsBadge = this.element('ledgerTotalRowsBadge');

    if (totalIncomeEl) {
      totalIncomeEl.textContent = `₦${Number(summary.total_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (incomeCountBadge) {
      incomeCountBadge.textContent = `${summary.income_count || 0} Inflow${(summary.income_count === 1) ? '' : 's'}`;
    }
    if (incomeBreakdown) {
      incomeBreakdown.textContent = `⚡ ₦${Number(summary.platform_income || 0).toLocaleString()} Online | 📝 ₦${Number(summary.manual_income || 0).toLocaleString()} Manual`;
    }

    if (totalExpenseEl) {
      totalExpenseEl.textContent = `₦${Number(summary.total_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (expenseCountBadge) {
      expenseCountBadge.textContent = `${summary.expense_count || 0} Outflow${(summary.expense_count === 1) ? '' : 's'}`;
    }
    if (expenseBreakdown) {
      expenseBreakdown.textContent = `⚡ ₦${Number(summary.platform_expense || 0).toLocaleString()} Payroll | 📝 ₦${Number(summary.manual_expense || 0).toLocaleString()} Operations`;
    }

    const netVal = Number(summary.net_balance || 0);
    if (netBalanceEl) {
      if (netVal >= 0) {
        netBalanceEl.textContent = `₦${netVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        netBalanceEl.style.color = 'var(--success)';
      } else {
        netBalanceEl.textContent = `-₦${Math.abs(netVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        netBalanceEl.style.color = 'var(--danger)';
      }
    }
    if (netStatusHint) {
      if (netVal > 0) {
        netStatusHint.innerHTML = `<span style="color:var(--success); font-weight:700;">● Net Operating Surplus</span>`;
      } else if (netVal < 0) {
        netStatusHint.innerHTML = `<span style="color:var(--danger); font-weight:700;">● Net Operating Deficit</span>`;
      } else {
        netStatusHint.innerHTML = `<span>● Balanced Operating Position</span>`;
      }
    }

    if (paystackWalletEl) {
      paystackWalletEl.textContent = `₦${Number(summary.paystack_wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const records = Array.isArray(data.records) ? data.records : [];
    if (totalRowsBadge) {
      totalRowsBadge.textContent = `${records.length} Transaction${records.length === 1 ? '' : 's'}`;
    }

    this.renderLedgerRows(records);
  },

  renderLedgerRows(records = []) {
    const tbody = this.element('ledgerTableBody');
    if (!tbody) return;

    if (!records || records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2.5rem 1rem; color:var(--muted);">
            <div style="font-size:1.8rem; margin-bottom:.5rem;">📖</div>
            <strong style="color:var(--text); font-size:1rem; display:block; margin-bottom:.3rem;">No Ledger Records Found</strong>
            <span>No financial transactions match your selected search or filter criteria.</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = records.map(r => {
      const isIncome = (r.transaction_type === 'income');
      const flowBadge = isIncome
        ? `<span class="badge badge-green" style="font-size:.72rem; padding:.2rem .55rem; font-weight:800;">🟢 INFLOW</span>`
        : `<span class="badge badge-red" style="font-size:.72rem; padding:.2rem .55rem; font-weight:800;">🔴 OUTFLOW</span>`;

      const numAmount = parseFloat(r.amount) || 0;
      const formattedAmount = numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const amountCell = isIncome
        ? `<span style="color:var(--success); font-weight:800; font-size:.95rem;">+₦${formattedAmount}</span>`
        : `<span style="color:var(--danger); font-weight:800; font-size:.95rem;">-₦${formattedAmount}</span>`;

      const runningBal = parseFloat(r.running_balance) || 0;
      const runningBalStr = runningBal >= 0
        ? `₦${runningBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `-₦${Math.abs(runningBal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const channelBadge = `<span class="badge badge-gold" style="font-size:.72rem; font-weight:700;">${this.escapeHtml(r.channel_label || r.channel || 'N/A')}</span>`;

      const sourceBadge = (r.source === 'platform_paystack')
        ? `<span class="badge badge-blue" style="font-size:.65rem; display:inline-block; margin-top:.2rem;">⚡ Paystack Auto</span>`
        : `<span class="badge badge-gold" style="font-size:.65rem; display:inline-block; margin-top:.2rem;">📝 External Entry</span>`;

      const entityDisplay = r.entity_name
        ? `<div style="font-weight:700; color:var(--text); font-size:.85rem;">${this.escapeHtml(r.entity_name)}</div>
           ${r.entity_type ? `<small style="color:var(--muted); font-size:.72rem; text-transform:capitalize;">(${this.escapeHtml(r.entity_type)})</small>` : ''}`
        : `<span style="color:var(--muted); font-size:.82rem;">N/A</span>`;

      const deleteBtn = r.is_deletable
        ? `<button type="button" class="btn-sm btn-sm-delete" onclick="schoolController.deleteExternalTransaction(${r.id}, '${this.escapeHtml(r.reference)}', ${numAmount})" style="padding:.28rem .5rem; font-size:.75rem; border-radius:6px; margin-left:.3rem; cursor:pointer;" title="Delete manual entry">🗑</button>`
        : '';

      const dt = r.transaction_date ? new Date(r.transaction_date.replace(' ', 'T')) : new Date();
      const formattedDate = isNaN(dt.getTime())
        ? (r.transaction_date || '')
        : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      return `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="font-size:.8rem; color:var(--muted); white-space:nowrap;">${formattedDate}</td>
          <td>
            <div style="font-family:monospace; font-weight:800; font-size:.82rem; color:var(--primary);">${this.escapeHtml(r.reference)}</div>
            ${sourceBadge}
          </td>
          <td>${flowBadge}</td>
          <td>
            <strong style="color:var(--text); font-size:.86rem; display:block;">${this.escapeHtml(r.category || 'General')}</strong>
            <div style="font-size:.8rem; color:var(--muted); line-height:1.35; margin-top:.15rem;">${this.escapeHtml(r.description || '')}</div>
          </td>
          <td>${entityDisplay}</td>
          <td>${channelBadge}</td>
          <td style="text-align:right;">${amountCell}</td>
          <td style="text-align:right; font-weight:750; font-size:.88rem; color:var(--text); font-family:monospace;">${runningBalStr}</td>
          <td style="text-align:center; white-space:nowrap;">
            <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.viewLedgerTransaction(${r.id})" style="padding:.28rem .6rem; font-size:.75rem; border-radius:6px; cursor:pointer;" title="View Voucher">👁 Voucher</button>
            ${deleteBtn}
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddExternalTransactionModal() {
    const modal = this.element('addExternalTransactionModal');
    if (!modal) return;

    const form = this.element('addExternalTransactionForm');
    if (form) form.reset();

    const dateInput = this.element('extTransDateInput');
    if (dateInput) {
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dateInput.value = localIso;
    }

    if (window.schoolController && typeof window.schoolController.handleExternalTypeChange === 'function') {
      window.schoolController.handleExternalTypeChange();
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeAddExternalTransactionModal() {
    const modal = this.element('addExternalTransactionModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  renderTransactionDetailModal(tx) {
    if (!tx) return;
    const modal = this.element('ledgerTransactionDetailModal');
    if (!modal) return;

    const flowBadge = this.element('voucherFlowBadge');
    const isIncome = (tx.transaction_type === 'income');
    if (flowBadge) {
      if (isIncome) {
        flowBadge.textContent = '🟢 INFLOW / CREDIT VOUCHER';
        flowBadge.style.background = 'rgba(22,163,74,.12)';
        flowBadge.style.color = 'var(--success)';
      } else {
        flowBadge.textContent = '🔴 OUTFLOW / DEBIT VOUCHER';
        flowBadge.style.background = 'rgba(220,38,38,.12)';
        flowBadge.style.color = 'var(--danger)';
      }
    }

    const refEl = this.element('voucherReference');
    if (refEl) refEl.textContent = tx.reference || 'N/A';

    const dateEl = this.element('voucherDate');
    if (dateEl) {
      const dt = tx.transaction_date ? new Date(tx.transaction_date.replace(' ', 'T')) : new Date();
      dateEl.textContent = isNaN(dt.getTime())
        ? (tx.transaction_date || '')
        : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    const catEl = this.element('voucherCategory');
    if (catEl) catEl.textContent = tx.category || 'General';

    const entityEl = this.element('voucherEntity');
    if (entityEl) {
      entityEl.textContent = tx.entity_name
        ? `${tx.entity_name}${tx.entity_email ? ` (${tx.entity_email})` : ''}`
        : 'N/A';
    }

    const channelEl = this.element('voucherChannel');
    if (channelEl) channelEl.textContent = tx.channel_label || tx.channel || 'N/A';

    const sourceEl = this.element('voucherSource');
    if (sourceEl) {
      sourceEl.textContent = (tx.source === 'platform_paystack')
        ? '⚡ Platform Automated (Paystack)'
        : '📝 External Off-Platform Manual';
      sourceEl.className = (tx.source === 'platform_paystack') ? 'badge badge-blue' : 'badge badge-gold';
    }

    const descEl = this.element('voucherDescription');
    if (descEl) descEl.textContent = tx.description || 'No description provided';

    const numAmount = parseFloat(tx.amount) || 0;
    const amountEl = this.element('voucherAmount');
    if (amountEl) {
      const formatted = numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (isIncome) {
        amountEl.textContent = `+₦${formatted}`;
        amountEl.style.color = 'var(--success)';
      } else {
        amountEl.textContent = `-₦${formatted}`;
        amountEl.style.color = 'var(--danger)';
      }
    }

    const balEl = this.element('voucherRunningBalance');
    if (balEl) {
      const runningBal = parseFloat(tx.running_balance) || 0;
      balEl.textContent = runningBal >= 0
        ? `₦${runningBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `-₦${Math.abs(runningBal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const auditEl = this.element('voucherAuditNote');
    if (auditEl) {
      auditEl.textContent = tx.notes || ((tx.source === 'platform_paystack') ? 'Verified Paystack Gateway Ledger Entry' : 'Verified Internal Off-Platform Ledger Entry');
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeLedgerTransactionModal() {
    const modal = this.element('ledgerTransactionDetailModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  openAddExternalTransactionModal() {
    const modal = this.element('addExternalTransactionModal');
    if (!modal) return;

    const form = this.element('addExternalTransactionForm');
    if (form) form.reset();

    const dateInput = this.element('extTransDateInput');
    if (dateInput) {
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dateInput.value = localIso;
    }

    const typeSelect = this.element('extTransTypeSelect');
    if (typeSelect) typeSelect.value = 'income';

    const catSelect = this.element('extTransCategorySelect');
    if (catSelect) {
      catSelect.innerHTML = `
        <option value="Uniform & Textbooks Sale">Uniform & Textbooks Sale</option>
        <option value="Admission & Entrance Form Fee">Admission & Entrance Form Fee</option>
        <option value="PTA Development Levy">PTA Development Levy</option>
        <option value="Direct Cash Tuition">Direct Cash Tuition</option>
        <option value="External Donation / Grant">External Donation / Grant</option>
        <option value="Facility Rental">Facility Rental</option>
        <option value="Other Income">Other Income</option>
      `;
    }

    if (window.schoolController && typeof window.schoolController.handleExternalTypeChange === 'function') {
      window.schoolController.handleExternalTypeChange();
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeAddExternalTransactionModal() {
    const modal = this.element('addExternalTransactionModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  renderViewStaffAccountDetailsModal(staff) {
    if (!staff) return;
    const modal = this.element('viewStaffAccountDetailsModal');
    if (!modal) return;

    const nameEl = this.element('staffAccountModalName');
    const emailEl = this.element('staffAccountModalEmail');
    const idEl = this.element('staffAccountModalId');
    const deptEl = this.element('staffAccountModalDept');
    const subjEl = this.element('staffAccountModalSubject');
    const bankEl = this.element('staffAccountModalBank');
    const accNumEl = this.element('staffAccountModalAccNum');
    const accNameEl = this.element('staffAccountModalAccName');
    const salaryEl = this.element('staffAccountModalSalary');
    const payBtn = this.element('staffAccountModalPayBtn');
    const editBtn = this.element('staffAccountModalEditBtn');

    const formattedId = staff.staff_id || staff.formatted_id || ('STF-' + String(staff.id).padStart(4, '0'));

    if (nameEl) nameEl.textContent = staff.name || 'Staff Member';
    if (emailEl) emailEl.textContent = staff.email || '';
    if (idEl) idEl.textContent = formattedId;
    if (deptEl) deptEl.textContent = staff.department || 'Science';
    if (subjEl) subjEl.textContent = staff.assigned_subject || 'General Studies';
    if (bankEl) bankEl.textContent = staff.bank_name || 'Not Configured Yet';
    if (accNumEl) accNumEl.textContent = staff.account_number || '----------';
    if (accNameEl) accNameEl.textContent = staff.account_name || 'Account Name Not Provided';
    
    const salary = staff.monthly_salary || 75000;
    if (salaryEl) salaryEl.textContent = '₦' + Number(salary).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    if (payBtn) {
      payBtn.onclick = () => {
        this.closeViewStaffAccountDetailsModal();
        if (window.schoolController) {
          window.schoolController.openProcessSalaryModal(staff.id, 'paystack_transfer');
        }
      };
    }

    if (editBtn) {
      editBtn.onclick = () => {
        this.closeViewStaffAccountDetailsModal();
        if (window.schoolController) {
          window.schoolController.openAdminStaffBankModal(staff.id);
        }
      };
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeViewStaffAccountDetailsModal() {
    const modal = this.element('viewStaffAccountDetailsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  /* ==========================================================================
     ADMINISTRATOR MANAGEMENT & AUDIT LOGS
     ========================================================================== */
  renderAdminManagement(data = {}) {
    const admins = Array.isArray(data.admins) ? data.admins : [];
    const invitations = Array.isArray(data.invitations) ? data.invitations : [];

    // 1. Render Administrators Table
    const tbody = this.element('adminAccountsRows');
    if (tbody) {
      if (admins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No administrators registered.</td></tr>`;
      } else {
        const curUserId = schoolModel.user?.id || 0;
        tbody.innerHTML = admins.map(a => {
          const isMe = (parseInt(a.id) === parseInt(curUserId));
          const isSuper = (a.role_slug === 'super_admin');
          const isSuspended = (a.status === 'suspended');
          const lastLogin = a.last_login_at ? new Date(a.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';

          return `
            <tr>
              <td>
                <div style="font-weight:750; font-size:.86rem; color:var(--text);">${this.escapeHtml(a.name)} ${isMe ? '<span class="badge badge-blue" style="font-size:.65rem;">You</span>' : ''}</div>
                <div style="font-size:.74rem; color:var(--muted);">${this.escapeHtml(a.email)}</div>
              </td>
              <td>
                <span class="badge ${isSuper ? 'badge-gold' : 'badge-blue'}" style="font-weight:750;">
                  ${isSuper ? '👑 ' : ''}${this.escapeHtml(a.role_name || 'Admin')}
                </span>
              </td>
              <td>
                <span class="badge ${isSuspended ? 'badge-red' : 'badge-green'}">
                  ${isSuspended ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td>
                <span style="font-size:.78rem; font-weight:700; color:${a.mfa_enabled == 1 ? 'var(--success)' : 'var(--muted)'};">
                  ${a.mfa_enabled == 1 ? '🛡️ Enabled' : 'Disabled'}
                </span>
              </td>
              <td>
                <span class="badge badge-purple" style="font-family:monospace; font-size:.76rem;">${a.actions_count || 0} Actions</span>
              </td>
              <td style="font-size:.76rem; color:var(--muted);">${lastLogin}</td>
              <td style="text-align:right; white-space:nowrap;">
                ${isMe ? '<span style="color:var(--muted); font-size:.75rem;">Self</span>' : `
                  <button type="button" class="btn-sm btn-sm-view" onclick="schoolController.openRoleModal(${a.id}, '${this.escapeHtml(a.name)}', ${a.role_id || 1})" style="padding:.28rem .55rem; font-size:.74rem; margin-right:.3rem;" title="Change Role">🛡️ Role</button>
                  <button type="button" class="btn-sm ${isSuspended ? 'btn-sm-enroll' : 'btn-sm-danger'}" onclick="schoolController.toggleAdminStatus(${a.id}, '${isSuspended ? 'active' : 'suspended'}')" style="padding:.28rem .55rem; font-size:.74rem; margin-right:.3rem;">
                    ${isSuspended ? 'Activate' : 'Suspend'}
                  </button>
                  <button type="button" class="btn-sm btn-sm-danger" onclick="schoolController.revokeAdmin(${a.id})" style="padding:.28rem .55rem; font-size:.74rem;" title="Revoke Admin Access">🗑</button>
                `}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 2. Render Pending Invitations Table
    const invTbody = this.element('adminInvitationsRows');
    if (invTbody) {
      if (invitations.length === 0) {
        invTbody.innerHTML = `<tr><td colspan="6" class="empty-state">No pending invitations.</td></tr>`;
      } else {
        invTbody.innerHTML = invitations.map(inv => {
          const exp = inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Soon';
          return `
            <tr>
              <td style="font-weight:750; font-size:.85rem; color:var(--text);">${this.escapeHtml(inv.name)}</td>
              <td style="font-size:.82rem; color:var(--muted);">${this.escapeHtml(inv.email)}</td>
              <td><span class="badge badge-gold">${this.escapeHtml(inv.role_name)}</span></td>
              <td style="font-size:.78rem; color:var(--muted);">${this.escapeHtml(inv.invited_by_name || 'Super Admin')}</td>
              <td style="font-size:.76rem; color:var(--muted);">${exp}</td>
              <td style="text-align:right;">
                <span class="badge badge-green" style="font-size:.72rem;">Pending Acceptance</span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  renderAuditLogs(logs = []) {
    const tbody = this.element('adminAuditLogsRows');
    if (!tbody) return;

    if (!Array.isArray(logs) || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No audit logs recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const dt = l.created_at ? new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
      let detailsStr = '';
      try {
        if (l.details) {
          const obj = typeof l.details === 'string' ? JSON.parse(l.details) : l.details;
          detailsStr = Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('; ');
        }
      } catch (e) {
        detailsStr = String(l.details || '');
      }

      return `
        <tr>
          <td style="font-size:.74rem; font-family:monospace; color:var(--muted); white-space:nowrap;">${dt}</td>
          <td>
            <div style="font-weight:750; font-size:.82rem; color:var(--text);">${this.escapeHtml(l.admin_name || 'System / CLI')}</div>
            <div style="font-size:.72rem; color:var(--muted);">${this.escapeHtml(l.user_email || '')}</div>
          </td>
          <td>
            <span class="badge badge-purple" style="font-family:monospace; font-size:.72rem;">${this.escapeHtml(l.action)}</span>
          </td>
          <td style="font-size:.78rem; color:var(--muted); font-family:monospace;">${this.escapeHtml(l.resource_type || '-')}${l.resource_id ? (' #' + l.resource_id) : ''}</td>
          <td style="font-size:.74rem; color:var(--text); max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.escapeHtml(detailsStr)}">
            ${this.escapeHtml(detailsStr || '-')} <small style="color:var(--muted);">(${this.escapeHtml(l.ip_address || '')})</small>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* ------------------------------------------------------------------------
     ACADEMIC SESSION & TERM RENDERING
     ------------------------------------------------------------------------ */
  renderAcademicSession(sessionData) {
    if (!sessionData) return;
    const term = sessionData.current_term || 'Term 1';
    const session = sessionData.academic_session || '2024/2025';
    const label = sessionData.display_label || `${term} · ${session}`;

    // Student Hero Term Badge (above Welcome back, Student! ✨)
    const stuTermBadge = this.element('studentHeroTermBadge');
    if (stuTermBadge) {
      stuTermBadge.textContent = label;
    }

    // Staff Hero Term Badge
    const staffTermBadge = this.element('staffHeroTermBadge');
    if (staffTermBadge) {
      staffTermBadge.textContent = `${term} • Active`;
    }

    // Admin Hero Term Badge
    const adminTermBadge = this.element('adminHeroTermBadge');
    if (adminTermBadge) {
      adminTermBadge.textContent = label;
    }

    // Admin Dropdown Term Badge
    const adminDropdownBadge = this.element('adminDropdownTermBadge');
    if (adminDropdownBadge) {
      adminDropdownBadge.textContent = label;
    }
  },

  openEditAcademicSessionModal(term = 'Term 1', session = '2024/2025') {
    const modal = this.element('academicSessionModal');
    if (!modal) return;
    const termSelect = this.element('academicSessionTermSelect');
    const sessionInput = this.element('academicSessionYearInput');
    if (termSelect) termSelect.value = term;
    if (sessionInput) sessionInput.value = session;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeEditAcademicSessionModal() {
    const modal = this.element('academicSessionModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },
};

window.SchoolView = SchoolView;
window.schoolView = SchoolView;
window.openEditAcademicSessionModal = function() {
  if (window.schoolController && typeof window.schoolController.openEditAcademicSessionModal === 'function') {
    window.schoolController.openEditAcademicSessionModal();
  } else {
    SchoolView.openEditAcademicSessionModal();
  }
};
window.closeEditAcademicSessionModal = function() {
  if (window.schoolController && typeof window.schoolController.closeEditAcademicSessionModal === 'function') {
    window.schoolController.closeEditAcademicSessionModal();
  } else {
    SchoolView.closeEditAcademicSessionModal();
  }
};
