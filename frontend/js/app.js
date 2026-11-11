/* ==========================================================================
   APP INITIALIZER & GLOBAL EVENT HANDLERS
   ========================================================================== */

window.currentRole = 'admin';

// MASTER CURRICULUM SUBJECTS (Categorized & Verified)
window.ALL_CURRICULUM_SUBJECTS = [
  // Core Compulsory
  'Mathematics',
  'English Language',
  'Civic Education',

  // Science & Technology
  'Biology',
  'Chemistry',
  'Physics',
  'Agricultural Science',
  'Further Mathematics',
  'Physical Education',
  'Health Education',
  'Foods and Nutrition',
  'Geography',
  'Technical Drawing',

  // Arts & Humanities
  'Literature-in-English',
  'Government',
  'Nigerian History',
  'Christian Religious Studies (CRS)',
  'Islamic Studies (IRS)',
  'Nigerian Languages: Hausa, Igbo, or Yoruba',
  'French',
  'Arabic',
  'Visual Art',
  'Music',
  'Home Management',
  'Catering Craft Practice',

  // Commercial & Business
  'Economics',
  'Financial Accounting / Accounting',
  'Commerce',
  'Marketing',
  'Office Practice',

  // Vocational, Technical & Trade
  'Fashion Design and Garment Making',
  'Livestock Farming',
  'Beauty and Cosmetology',
  'Computer Hardware and GSM Repairs',
  'Solar Photovoltaic Installation and Maintenance',
  'Horticulture and Crop Production',
  'Data Processing',
  'Computer Studies',
  'Animal Husbandry'
];

// VOCATIONAL & TECHNICAL TRADE SUBJECTS (Mandatory 1+ for WAEC, Disallowed in JAMB)
window.VOCATIONAL_TRADE_SUBJECTS = [
  'Data Processing',
  'Computer Studies',
  'Technical Drawing',
  'Catering Craft Practice',
  'Fashion Design and Garment Making',
  'Livestock Farming',
  'Beauty and Cosmetology',
  'Computer Hardware and GSM Repairs',
  'Solar Photovoltaic Installation and Maintenance',
  'Horticulture and Crop Production',
  'Animal Husbandry'
];

// FULL CATALOG OF ACADEMIC SUBJECTS ACROSS SCIENCE, COMMERCIAL & ART
window.ACADEMIC_SUBJECTS_CATALOG = [
  // Science & Technology
  { name: 'Biology', dept: 'Science' },
  { name: 'Chemistry', dept: 'Science' },
  { name: 'Physics', dept: 'Science' },
  { name: 'Agricultural Science', dept: 'Science' },
  { name: 'Further Mathematics', dept: 'Science' },
  { name: 'Geography', dept: 'Science' },
  { name: 'Health Education', dept: 'Science' },
  { name: 'Physical Education', dept: 'Science' },
  { name: 'Foods and Nutrition', dept: 'Science' },

  // Commercial & Business
  { name: 'Economics', dept: 'Commercial' },
  { name: 'Financial Accounting / Accounting', dept: 'Commercial' },
  { name: 'Commerce', dept: 'Commercial' },
  { name: 'Marketing', dept: 'Commercial' },
  { name: 'Office Practice', dept: 'Commercial' },
  { name: 'Government', dept: 'Commercial' },

  // Arts & Humanities
  { name: 'Literature-in-English', dept: 'Art' },
  { name: 'Nigerian History', dept: 'Art' },
  { name: 'Christian Religious Studies (CRS)', dept: 'Art' },
  { name: 'Islamic Studies (IRS)', dept: 'Art' },
  { name: 'Nigerian Languages: Hausa, Igbo, or Yoruba', dept: 'Art' },
  { name: 'French', dept: 'Art' },
  { name: 'Arabic', dept: 'Art' },
  { name: 'Visual Art', dept: 'Art' },
  { name: 'Music', dept: 'Art' },
  { name: 'Home Management', dept: 'Art' }
];

window.currentSubjectCategoryFilter = 'all';

// 1. Role Selection
window.selectPortalRole = function(role) {
  window.currentRole = role;
  console.log('Selected portal role:', role);

  const roleChooser = document.getElementById('roleChooser');
  const authPanel = document.getElementById('authPanel');
  const loginHeading = document.getElementById('loginHeading');
  const loginSubtitle = document.getElementById('loginSubtitle');

  if (roleChooser) {
    roleChooser.classList.add('hidden');
    roleChooser.style.display = 'none';
  }

  if (authPanel) {
    authPanel.classList.remove('hidden');
    authPanel.style.display = 'block';
  }

  const studentAuthModes = document.getElementById('studentAuthModes');

  if (role === 'student') {
    if (loginHeading) loginHeading.textContent = 'Student Portal';
    if (loginSubtitle) loginSubtitle.textContent = 'Sign in or create a student account.';
    if (studentAuthModes) studentAuthModes.classList.remove('hidden');
  } else if (role === 'admin') {
    if (loginHeading) loginHeading.textContent = 'Administrator Portal';
    if (loginSubtitle) loginSubtitle.innerHTML = 'Sign in with your authorized administrator credentials.<br><small style="color:var(--muted); font-size:.78rem;">New administrators must be invited by an existing Super Administrator.</small>';
    if (studentAuthModes) studentAuthModes.classList.add('hidden');
  } else {
    // Staff
    if (loginHeading) loginHeading.textContent = 'Staff / Teacher Portal';
    if (loginSubtitle) loginSubtitle.textContent = 'Sign in with your email, password, and staff code.';
    if (studentAuthModes) studentAuthModes.classList.add('hidden');
  }

  // Default to Login mode whenever entering a portal
  setAuthMode('login');
};

// 2. Navigation & UI Helpers for index.html
window.backToRoleChooser = function() {
  const roleChooser = document.getElementById('roleChooser');
  const authPanel = document.getElementById('authPanel');

  if (roleChooser) {
    roleChooser.classList.remove('hidden');
    roleChooser.style.display = 'block';
  }
  if (authPanel) {
    authPanel.classList.add('hidden');
    authPanel.style.display = 'none';
  }
};

window.setAuthMode = function(mode) {
  const role = window.currentRole || 'student';
  const loginModeBtn = document.getElementById('loginModeButton');
  const signupModeBtn = document.getElementById('signupModeButton');
  const loginNameGroup = document.getElementById('loginNameGroup');
  const loginEmailLabel = document.getElementById('loginEmailLabel') || document.querySelector('label[for="loginEmail"]');
  const loginEmailInput = document.getElementById('loginEmail');
  const programGroup = document.getElementById('loginProgramGroup');
  const departmentGroup = document.getElementById('loginDepartmentGroup');
  const subjectsGroup = document.getElementById('loginSubjectsGroup');
  const staffCodeGroup = document.getElementById('loginStaffCodeGroup');
  const authSubmitButton = document.getElementById('authSubmitButton');
  const authHelper = document.getElementById('authHelper');

  if (mode === 'login') {
    if (loginModeBtn) {
      loginModeBtn.classList.add('active');
      loginModeBtn.setAttribute('aria-pressed', 'true');
    }
    if (signupModeBtn) {
      signupModeBtn.classList.remove('active');
      signupModeBtn.setAttribute('aria-pressed', 'false');
    }

    if (loginNameGroup) loginNameGroup.classList.add('hidden');
    if (programGroup) programGroup.classList.add('hidden');
    if (departmentGroup) departmentGroup.classList.add('hidden');
    if (subjectsGroup) subjectsGroup.classList.add('hidden');

    if (role === 'staff') {
      if (loginEmailLabel) loginEmailLabel.textContent = 'Staff Email';
      if (loginEmailInput) loginEmailInput.placeholder = 'teacher@school.edu';
      if (staffCodeGroup) staffCodeGroup.classList.remove('hidden');
      if (authSubmitButton) authSubmitButton.textContent = 'Login as Staff';
      if (authHelper) authHelper.textContent = 'Enter your staff email, password, and issued staff code.';
    } else if (role === 'admin') {
      if (loginEmailLabel) loginEmailLabel.textContent = 'Administrator Email';
      if (loginEmailInput) loginEmailInput.placeholder = 'admin@school.edu';
      if (staffCodeGroup) staffCodeGroup.classList.add('hidden');
      if (authSubmitButton) authSubmitButton.textContent = 'Login as Administrator';
      if (authHelper) authHelper.textContent = 'Sign in to access school administration and manage learning resources.';
    } else {
      // Student: Login requires ONLY Student ID and password
      if (loginEmailLabel) loginEmailLabel.innerHTML = 'Official Student ID <small style="color:var(--primary); font-weight:600;">(Sent to your Gmail)</small>';
      if (loginEmailInput) loginEmailInput.placeholder = 'e.g. STU-0014';
      if (staffCodeGroup) staffCodeGroup.classList.add('hidden');
      if (authSubmitButton) authSubmitButton.textContent = 'Login with Student ID & Password';
      if (authHelper) authHelper.innerHTML = 'Sign in using your <strong>Student ID</strong> (sent to your Gmail after payment verification) and your password.';
    }
  } else {
    // Signup Mode ('signup' or 'studentSignup')
    if (signupModeBtn) {
      signupModeBtn.classList.add('active');
      signupModeBtn.setAttribute('aria-pressed', 'true');
    }
    if (loginModeBtn) {
      loginModeBtn.classList.remove('active');
      loginModeBtn.setAttribute('aria-pressed', 'false');
    }

    if (loginNameGroup) loginNameGroup.classList.remove('hidden');
    if (staffCodeGroup) staffCodeGroup.classList.add('hidden');

    if (role === 'admin') {
      if (loginEmailLabel) loginEmailLabel.textContent = 'Email address';
      if (loginEmailInput) loginEmailInput.placeholder = 'you@school.edu';
      if (programGroup) programGroup.classList.add('hidden');
      if (departmentGroup) departmentGroup.classList.add('hidden');
      if (subjectsGroup) subjectsGroup.classList.add('hidden');
      if (authSubmitButton) authSubmitButton.textContent = 'Create Administrator Account';
      if (authHelper) authHelper.textContent = 'Fill in your name, email and password to create an admin account.';
    } else {
      // Student Signup
      if (loginEmailLabel) loginEmailLabel.innerHTML = 'Registered Gmail Address <small style="color:var(--muted); font-weight:600;">(For Student ID dispatch)</small>';
      if (loginEmailInput) loginEmailInput.placeholder = 'e.g. yourname@gmail.com';
      if (programGroup) programGroup.classList.remove('hidden');
      if (departmentGroup) departmentGroup.classList.remove('hidden');
      if (subjectsGroup) subjectsGroup.classList.remove('hidden');
      if (authSubmitButton) authSubmitButton.textContent = 'Register & Proceed to Tuition Payment →';
      if (authHelper) authHelper.innerHTML = 'Submit your curriculum details. Upon tuition payment verification, your <strong>Official Student ID</strong> and activation link will be sent to your Gmail.';
      renderSignupSubjects();
    }
  }
};

window.renderSignupSubjects = function() {
  const container = document.getElementById('signupSubjectChoices');
  if (!container) return;

  const headingEl = document.getElementById('signupSubjectsHeading');
  const subtitleEl = document.getElementById('signupSubjectsSubtitle');
  const program = document.getElementById('loginProgram')?.value || 'WAEC';
  const dept = document.getElementById('loginDepartment')?.value || 'Science';

  window.currentSubjectCategoryFilter = 'all';

  if (program === 'JAMB') {
    // JAMB RULES:
    // English Language is compulsory (1 subject)
    // Choose exactly 3 academic subjects across Science, Commercial & Art (Total 4 subjects)
    // Strictly NO vocational/trade subjects in JAMB!
    if (headingEl) headingEl.textContent = 'Subjects you want to offer (JAMB 4-Subject Combination)';
    if (subtitleEl) subtitleEl.textContent = 'English Language is compulsory. Choose 3 academic subjects across Science, Commercial & Art using the searchable dropdown.';

    const jambCompulsory = ['English Language'];
    const defaultJambByDept = {
      Science: ['Mathematics', 'Physics', 'Chemistry'],
      Commercial: ['Mathematics', 'Economics', 'Commerce'],
      Art: ['Literature-in-English', 'Government', 'Christian Religious Studies (CRS)']
    };
    const defaultPicks = defaultJambByDept[dept] || defaultJambByDept.Science;

    // Compulsory Core Box (English)
    const compulsoryHtml = `
      <div class="compulsory-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.45rem;">
          <strong style="font-size:.82rem; color:var(--text); text-transform:uppercase; letter-spacing:.05em;">Compulsory Core Subject</strong>
          <span class="badge badge-gold" style="font-size:.7rem;">Fixed & Locked</span>
        </div>
        <div style="display:grid; gap:.35rem;">
          ${jambCompulsory.map(sub => `
            <label class="subject-choice locked">
              <input type="checkbox" name="compulsorySubjects" value="${sub}" checked disabled>
              <span><strong>${sub}</strong> <small style="color:var(--muted); font-size:.75rem;">(Universal JAMB Core)</small></span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Searchable Electives Dropdown (Choose 3 across Science, Commercial & Art)
    const electivesHtml = `
      <div id="searchableSubjectsContainer" style="margin-top:.85rem; padding:.85rem; border:1.5px solid var(--border); border-radius:14px; background:var(--card); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.55rem; flex-wrap:wrap; gap:.4rem;">
          <div>
            <strong style="font-size:.82rem; color:var(--text); text-transform:uppercase; letter-spacing:.05em;">Choose 3 Academic Subjects</strong>
            <div style="font-size:.73rem; color:var(--muted); margin-top:.15rem;">Select from wide range across Science, Commercial & Art</div>
          </div>
          <span class="badge badge-blue" id="electiveCountBadge" style="font-size:.7rem;">0 of 3 Selected</span>
        </div>

        <!-- Selected Subject Chips Display -->
        <div id="selectedSubjectChips" style="display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.75rem; min-height:30px; align-items:center;"></div>

        <!-- Dropdown Trigger Button -->
        <div style="position:relative;">
          <button type="button" id="subjectDropdownToggleBtn" onclick="toggleSubjectChoicesDropdown(event)" style="width:100%; padding:.75rem 1rem; border:1.5px solid var(--border); border-radius:10px; background:var(--bg); color:var(--text); font-size:.84rem; font-weight:600; display:flex; justify-content:space-between; align-items:center; cursor:pointer; text-align:left; transition:all .2s ease;">
            <span id="subjectDropdownBtnLabel">🔍 Search & Select Subjects (3 of 3 Selected)...</span>
            <span id="subjectDropdownBtnArrow" style="font-size:.75rem; transition:transform .2s ease;">▼</span>
          </button>

          <!-- Dropdown Menu / Search Panel -->
          <div id="subjectChoicesDropdownMenu" class="hidden" style="position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:1050; background:var(--card); border:1.5px solid var(--border); border-radius:14px; box-shadow:0 18px 40px rgba(0,0,0,0.18); padding:.85rem; display:none;">
            <!-- Search Bar -->
            <div style="position:relative; margin-bottom:.65rem;">
              <input type="text" id="subjectSearchInput" placeholder="Search subjects (e.g. Physics, Economics, French)..." oninput="filterSubjectChoicesList(this.value)" style="width:100%; padding:.65rem .85rem .65rem 2rem; border:1.5px solid var(--border); border-radius:9px; background:var(--bg); color:var(--text); font-size:.84rem;">
              <span style="position:absolute; left:.65rem; top:50%; transform:translateY(-50%); font-size:.9rem; color:var(--muted); pointer-events:none;">🔍</span>
            </div>

            <!-- Category Filter Pills -->
            <div style="display:flex; gap:.35rem; margin-bottom:.75rem; flex-wrap:wrap;">
              <button type="button" class="category-filter-pill active" onclick="setSubjectCategoryFilter('all', this)">All Subjects</button>
              <button type="button" class="category-filter-pill" onclick="setSubjectCategoryFilter('Science', this)">Science</button>
              <button type="button" class="category-filter-pill" onclick="setSubjectCategoryFilter('Commercial', this)">Commercial</button>
              <button type="button" class="category-filter-pill" onclick="setSubjectCategoryFilter('Art', this)">Art & Humanities</button>
            </div>

            <!-- Subject Choices Scroll List -->
            <div id="subjectChoicesList" style="max-height:220px; overflow-y:auto; display:grid; gap:.35rem; padding-right:.25rem;"></div>

            <div id="noSubjectMatchesMsg" style="display:none; padding:1.2rem; text-align:center; color:var(--muted); font-size:.82rem;">No subjects match your search.</div>

            <!-- Footer -->
            <div style="margin-top:.75rem; padding-top:.5rem; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
              <span id="dropdownListCountHint" style="font-size:.73rem; color:var(--muted);">All subjects</span>
              <button type="button" onclick="closeSubjectChoicesDropdown()" class="btn-sm btn-sm-primary" style="font-size:.74rem; padding:.3rem .8rem;">Done Selecting</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = compulsoryHtml + electivesHtml;

    // Render list items with default 3 checked
    renderSubjectChoiceItems(defaultPicks, true); // true = include Mathematics for JAMB
    renderSelectedSubjectChips();
    updateSelectedSubjectCount();

  } else {
    // WAEC RULES:
    // 3 Compulsory core: Mathematics, English Language, Civic Education
    // 1 Compulsory trade subject: chosen from 11 trade subjects
    // 7 Electives chosen from wide list across Science, Commercial & Art (11 subjects total)
    if (headingEl) headingEl.textContent = 'Subjects you want to offer (WAEC: 11 Subjects Total)';
    if (subtitleEl) subtitleEl.textContent = 'Mathematics, English & Civic are compulsory. Select 1 trade subject, then choose only 7 electives across Science, Commercial & Art.';

    const waecCompulsory = ['Mathematics', 'English Language', 'Civic Education'];
    const tradeSubjects = window.VOCATIONAL_TRADE_SUBJECTS || [
      'Data Processing', 'Computer Studies', 'Technical Drawing',
      'Catering Craft Practice', 'Fashion Design and Garment Making',
      'Livestock Farming', 'Beauty and Cosmetology',
      'Computer Hardware and GSM Repairs', 'Solar Photovoltaic Installation and Maintenance',
      'Horticulture and Crop Production', 'Animal Husbandry'
    ];

    // Default 7 electives by department
    const defaultWaecByDept = {
      Science: ['Biology', 'Chemistry', 'Physics', 'Agricultural Science', 'Further Mathematics', 'Geography', 'Health Education'],
      Commercial: ['Economics', 'Financial Accounting / Accounting', 'Commerce', 'Marketing', 'Office Practice', 'Government', 'Geography'],
      Art: ['Literature-in-English', 'Government', 'Nigerian History', 'Christian Religious Studies (CRS)', 'French', 'Visual Art', 'Music']
    };
    const defaultPicks = defaultWaecByDept[dept] || defaultWaecByDept.Science;

    // 1. 3 Compulsory Core Subjects
    const compulsoryHtml = `
      <div class="compulsory-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.45rem;">
          <strong style="font-size:.82rem; color:var(--text); text-transform:uppercase; letter-spacing:.05em;">3 Compulsory Core Subjects</strong>
          <span class="badge badge-gold" style="font-size:.7rem;">Fixed & Locked</span>
        </div>
        <div style="display:grid; gap:.35rem;">
          ${waecCompulsory.map(sub => `
            <label class="subject-choice locked">
              <input type="checkbox" name="compulsorySubjects" value="${sub}" checked disabled>
              <span><strong>${sub}</strong> <small style="color:var(--muted); font-size:.75rem;">(Compulsory Core)</small></span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // 2. 1 Compulsory Trade Subject Dropdown
    const tradeHtml = `
      <div style="margin-bottom:.85rem; padding:.85rem; border:1.5px solid var(--border); border-radius:14px; background:var(--card);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.4rem;">
          <strong style="font-size:.82rem; color:var(--primary); text-transform:uppercase; letter-spacing:.05em;">1 Compulsory Trade Subject</strong>
          <span class="badge badge-gold" style="font-size:.7rem;">Select 1 of 11</span>
        </div>
        <label for="loginTradeSubject" style="font-size:.74rem; color:var(--muted); display:block; margin-bottom:.35rem;">
          Select your required Vocational & Technical trade subject:
        </label>
        <select id="loginTradeSubject" onchange="updateSelectedSubjectCount()" style="width:100%; padding:.65rem; border:1.5px solid var(--border); border-radius:9px; background:var(--bg); color:var(--text); font-weight:700; font-size:.85rem;">
          ${tradeSubjects.map((sub, idx) => `
            <option value="${sub}" ${idx === 0 ? 'selected' : ''}>${sub} (Trade Subject)</option>
          `).join('')}
        </select>
      </div>
    `;

    // 3. Searchable Dropdown (Choose only 7 across Science, Commercial & Art)
    const electivesHtml = `
      <div id="searchableSubjectsContainer" style="margin-bottom:.5rem; padding:.85rem; border:1.5px solid var(--border); border-radius:14px; background:var(--card); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.55rem; flex-wrap:wrap; gap:.4rem;">
          <div>
            <strong style="font-size:.82rem; color:var(--text); text-transform:uppercase; letter-spacing:.05em;">Choose Only 7 Electives</strong>
            <div style="font-size:.73rem; color:var(--muted); margin-top:.15rem;">Full list across Science, Commercial & Art</div>
          </div>
          <span class="badge badge-blue" id="electiveCountBadge" style="font-size:.7rem;">0 of 7 Selected</span>
        </div>

        <!-- Selected Subject Chips Display -->
        <div id="selectedSubjectChips" style="display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.75rem; min-height:30px; align-items:center;"></div>

        <!-- Dropdown Trigger Button -->
        <div style="position:relative;">
          <button type="button" id="subjectDropdownToggleBtn" onclick="toggleSubjectChoicesDropdown(event)" style="width:100%; padding:.75rem 1rem; border:1.5px solid var(--border); border-radius:10px; background:var(--bg); color:var(--text); font-size:.84rem; font-weight:600; display:flex; justify-content:space-between; align-items:center; cursor:pointer; text-align:left; transition:all .2s ease;">
            <span id="subjectDropdownBtnLabel">🔍 Search & Select Subjects (7 of 7 Selected)...</span>
            <span id="subjectDropdownBtnArrow" style="font-size:.75rem; transition:transform .2s ease;">▼</span>
          </button>

          <!-- Dropdown Menu / Search Panel -->
          <div id="subjectChoicesDropdownMenu" class="hidden" style="position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:1050; background:var(--card); border:1.5px solid var(--border); border-radius:14px; box-shadow:0 18px 40px rgba(0,0,0,0.18); padding:.85rem; display:none;">
            <!-- Search Bar -->
            <div style="position:relative; margin-bottom:.65rem;">
              <input type="text" id="subjectSearchInput" placeholder="Search subjects (e.g. Physics, Economics, French)..." oninput="filterSubjectChoicesList(this.value)" style="width:100%; padding:.65rem .85rem .65rem 2rem; border:1.5px solid var(--border); border-radius:9px; background:var(--bg); color:var(--text); font-size:.84rem;">
              <span style="position:absolute; left:.65rem; top:50%; transform:translateY(-50%); font-size:.9rem; color:var(--muted); pointer-events:none;">🔍</span>
            </div>

            <!-- Category Filter Pills -->
            <div style="display:flex; gap:.35rem; margin-bottom:.75rem; flex-wrap:wrap;">
              <button type="button" class="category-filter-pill active" onclick="setSubjectCategoryFilter('all', this)">All Subjects</button>
              <button type="button" class="category-filter-pill" onclick="setSubjectCategoryFilter('Science', this)">Science</button>
              <button type="button" class="category-filter-pill" onclick="setSubjectCategoryFilter('Commercial', this)">Commercial</button>
              <button type="button" class="category-filter-pill" onclick="setSubjectCategoryFilter('Art', this)">Art & Humanities</button>
            </div>

            <!-- Subject Choices Scroll List -->
            <div id="subjectChoicesList" style="max-height:220px; overflow-y:auto; display:grid; gap:.35rem; padding-right:.25rem;"></div>

            <div id="noSubjectMatchesMsg" style="display:none; padding:1.2rem; text-align:center; color:var(--muted); font-size:.82rem;">No subjects match your search.</div>

            <!-- Footer -->
            <div style="margin-top:.75rem; padding-top:.5rem; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
              <span id="dropdownListCountHint" style="font-size:.73rem; color:var(--muted);">All subjects</span>
              <button type="button" onclick="closeSubjectChoicesDropdown()" class="btn-sm btn-sm-primary" style="font-size:.74rem; padding:.3rem .8rem;">Done Selecting</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = compulsoryHtml + tradeHtml + electivesHtml;

    // Render list items with default 7 checked
    renderSubjectChoiceItems(defaultPicks, false);
    renderSelectedSubjectChips();
    updateSelectedSubjectCount();
  }
};

window.renderSubjectChoiceItems = function(defaultPicks = [], includeMaths = false) {
  const listEl = document.getElementById('subjectChoicesList');
  if (!listEl) return;

  let pool = [...(window.ACADEMIC_SUBJECTS_CATALOG || [])];
  if (includeMaths) {
    if (!pool.some(s => s.name === 'Mathematics')) {
      pool = [{ name: 'Mathematics', dept: 'Science' }, ...pool];
    }
  }

  const deptBadgeClasses = {
    Science: 'badge-blue',
    Commercial: 'badge-gold',
    Art: 'badge-green'
  };

  const defaultSet = new Set(defaultPicks);

  listEl.innerHTML = pool.map(item => {
    const isChecked = defaultSet.has(item.name);
    const badgeClass = deptBadgeClasses[item.dept] || 'badge-blue';
    return `
      <label class="subject-choice-item ${isChecked ? 'selected' : ''}" data-subject-name="${item.name.toLowerCase()}" data-subject-dept="${item.dept}" style="cursor:pointer;" onclick="event.stopPropagation()">
        <div style="display:flex; align-items:center; gap:.55rem; flex:1; min-width:0;">
          <input type="checkbox" name="electiveSubjects" value="${item.name}" ${isChecked ? 'checked' : ''} onchange="handleSubjectChoiceToggle(this)">
          <span style="font-weight:${isChecked ? '700' : '500'}; word-break:break-word;">${item.name}</span>
        </div>
        <span class="badge ${badgeClass}" style="font-size:.68rem; flex-shrink:0;">${item.dept}</span>
      </label>
    `;
  }).join('');

  const countHint = document.getElementById('dropdownListCountHint');
  if (countHint) {
    countHint.textContent = `Showing ${pool.length} subjects`;
  }
};

window.toggleSubjectChoicesDropdown = function(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('subjectChoicesDropdownMenu');
  const btn = document.getElementById('subjectDropdownToggleBtn');
  const arrow = document.getElementById('subjectDropdownBtnArrow');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden') || menu.style.display === 'none';
  if (isHidden) {
    menu.classList.remove('hidden');
    menu.style.display = 'block';
    if (arrow) arrow.style.transform = 'rotate(180deg)';
    if (btn) btn.style.borderColor = 'var(--primary)';
    const searchInput = document.getElementById('subjectSearchInput');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
    }
  } else {
    menu.classList.add('hidden');
    menu.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    if (btn) btn.style.borderColor = 'var(--border)';
  }
};

window.closeSubjectChoicesDropdown = function() {
  const menu = document.getElementById('subjectChoicesDropdownMenu');
  const btn = document.getElementById('subjectDropdownToggleBtn');
  const arrow = document.getElementById('subjectDropdownBtnArrow');
  if (!menu) return;
  menu.classList.add('hidden');
  menu.style.display = 'none';
  if (arrow) arrow.style.transform = 'rotate(0deg)';
  if (btn) btn.style.borderColor = 'var(--border)';
};

window.setSubjectCategoryFilter = function(category, btnEl) {
  window.currentSubjectCategoryFilter = category;
  document.querySelectorAll('.category-filter-pill').forEach(p => p.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  const query = document.getElementById('subjectSearchInput')?.value || '';
  filterSubjectChoicesList(query);
};

window.filterSubjectChoicesList = function(query = '') {
  const items = document.querySelectorAll('#subjectChoicesList .subject-choice-item');
  const cleanQuery = (query || '').trim().toLowerCase();
  const cat = window.currentSubjectCategoryFilter || 'all';
  let visibleCount = 0;

  items.forEach(item => {
    const name = item.getAttribute('data-subject-name') || '';
    const dept = item.getAttribute('data-subject-dept') || '';
    const matchesCat = (cat === 'all' || dept === cat);
    const matchesQuery = (!cleanQuery || name.includes(cleanQuery) || dept.toLowerCase().includes(cleanQuery));

    if (matchesCat && matchesQuery) {
      item.style.display = 'flex';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });

  const emptyMsg = document.getElementById('noSubjectMatchesMsg');
  if (emptyMsg) {
    emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  const countHint = document.getElementById('dropdownListCountHint');
  if (countHint) {
    countHint.textContent = `Showing ${visibleCount} subject${visibleCount === 1 ? '' : 's'}`;
  }
};

window.handleSubjectChoiceToggle = function(checkbox) {
  const program = document.getElementById('loginProgram')?.value || 'WAEC';
  const maxElectives = program === 'JAMB' ? 3 : 7;
  const checkedBoxes = Array.from(document.querySelectorAll('#subjectChoicesList input[name="electiveSubjects"]:checked'));
  const count = checkedBoxes.length;

  if (count > maxElectives) {
    if (checkbox) {
      checkbox.checked = false;
    }
    if (program === 'JAMB') {
      alert('JAMB Combination: You can only select 3 subjects to combine with English Language (4 subjects total). Please uncheck a subject before choosing another.');
    } else {
      alert(`WAEC Requirement: You can choose only 7 elective subjects from this list (making 11 subjects total with 3 compulsory subjects and 1 trade subject). Please uncheck a subject first before selecting "${checkbox ? checkbox.value : 'another'}".`);
    }
  }

  // Update selected highlight class on all parent labels
  document.querySelectorAll('#subjectChoicesList .subject-choice-item').forEach(label => {
    const cb = label.querySelector('input[name="electiveSubjects"]');
    if (cb && cb.checked) {
      label.classList.add('selected');
      const span = label.querySelector('span');
      if (span) span.style.fontWeight = '700';
    } else {
      label.classList.remove('selected');
      const span = label.querySelector('span');
      if (span) span.style.fontWeight = '500';
    }
  });

  renderSelectedSubjectChips();
  updateSelectedSubjectCount();
};

window.removeSubjectChoice = function(subjectName) {
  const cb = document.querySelector(`#subjectChoicesList input[name="electiveSubjects"][value="${subjectName}"]`);
  if (cb) {
    cb.checked = false;
    const parent = cb.closest('.subject-choice-item');
    if (parent) {
      parent.classList.remove('selected');
      const span = parent.querySelector('span');
      if (span) span.style.fontWeight = '500';
    }
  }
  renderSelectedSubjectChips();
  updateSelectedSubjectCount();
};

window.renderSelectedSubjectChips = function() {
  const container = document.getElementById('selectedSubjectChips');
  if (!container) return;

  const checkedBoxes = Array.from(document.querySelectorAll('#subjectChoicesList input[name="electiveSubjects"]:checked'));
  const program = document.getElementById('loginProgram')?.value || 'WAEC';
  const maxElectives = program === 'JAMB' ? 3 : 7;

  if (checkedBoxes.length === 0) {
    container.innerHTML = `<span style="color:var(--muted); font-size:.76rem; font-style:italic;">No subjects selected yet. Click the dropdown below to search and pick ${maxElectives} subjects.</span>`;
    return;
  }

  container.innerHTML = checkedBoxes.map(cb => {
    const name = cb.value;
    const safeName = name.replace(/'/g, "\\'");
    return `
      <span class="subject-chip">
        <span>${name}</span>
        <button type="button" onclick="removeSubjectChoice('${safeName}')" aria-label="Remove ${name}" title="Remove ${name}">&times;</button>
      </span>
    `;
  }).join('');
};

window.updateSelectedSubjectCount = function() {
  const countEl = document.getElementById('signupSubjectCount');
  const program = document.getElementById('loginProgram')?.value || 'WAEC';
  const checkedElectives = Array.from(document.querySelectorAll('#subjectChoicesList input[name="electiveSubjects"]:checked'));
  const count = checkedElectives.length;
  const badgeEl = document.getElementById('electiveCountBadge');
  const btnLabelEl = document.getElementById('subjectDropdownBtnLabel');

  if (program === 'JAMB') {
    const target = 3;
    if (badgeEl) {
      badgeEl.textContent = `${count} of ${target} Selected`;
      badgeEl.className = count === target ? 'badge badge-green' : 'badge badge-blue';
    }
    if (btnLabelEl) {
      if (count === target) {
        btnLabelEl.innerHTML = `<span style="color:#10b981; font-weight:700;">✓ 3 of 3 Subjects Chosen (Click to edit)</span>`;
      } else {
        btnLabelEl.textContent = `🔍 Search & Select Subjects (${count} of ${target} Selected)...`;
      }
    }
    if (countEl) {
      if (count === target) {
        countEl.innerHTML = `<span style="color:#10b981; font-weight:700;">✓ English Language + 3 Subjects = 4 Subjects Selected (JAMB Combination Complete)</span>`;
      } else {
        const remaining = target - count;
        countEl.innerHTML = `<span style="color:#eab308; font-weight:700;">English Language + ${count} Subjects (${remaining} more subject${remaining === 1 ? '' : 's'} needed to make 4)</span>`;
      }
    }
  } else {
    // WAEC
    const target = 7;
    const tradeSubject = document.getElementById('loginTradeSubject')?.value || 'Data Processing';

    if (badgeEl) {
      badgeEl.textContent = `${count} of ${target} Selected`;
      badgeEl.className = count === target ? 'badge badge-green' : 'badge badge-blue';
    }
    if (btnLabelEl) {
      if (count === target) {
        btnLabelEl.innerHTML = `<span style="color:#10b981; font-weight:700;">✓ 7 of 7 Electives Chosen (Click to edit)</span>`;
      } else {
        btnLabelEl.textContent = `🔍 Search & Select Subjects (${count} of ${target} Selected)...`;
      }
    }
    if (countEl) {
      if (count === target) {
        countEl.innerHTML = `<span style="color:#10b981; font-weight:700;">✓ 3 Compulsory + 1 Trade (${tradeSubject}) + 7 Electives = 11 Subjects Selected (Complete)</span>`;
      } else {
        const remaining = target - count;
        countEl.innerHTML = `<span style="color:#eab308; font-weight:700;">3 Compulsory + 1 Trade (${tradeSubject}) + ${count} Electives (${remaining} more elective${remaining === 1 ? '' : 's'} needed to make 11)</span>`;
      }
    }
  }
};

// Global click-outside listener to close the searchable subjects dropdown menu
if (!window._subjectChoicesListenerAdded) {
  window._subjectChoicesListenerAdded = true;
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('subjectChoicesDropdownMenu');
    const container = document.getElementById('searchableSubjectsContainer');
    if (menu && !menu.classList.contains('hidden') && menu.style.display !== 'none') {
      if (container && !container.contains(e.target)) {
        closeSubjectChoicesDropdown();
      }
    }
  });
}

// 3. Workspace Navigation (Student Portal)
window.openWorkspace = async function(pageId, triggerEl) {
  SchoolView.switchWorkspacePage(pageId, triggerEl);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'school') {
    await schoolController.loadAlocSchool('student');
  } else if (pageId === 'pastquestions') {
    await schoolController.loadStudentPastQuestions();
  } else if (pageId === 'textbooks') {
    await schoolController.loadStudentTextbooks();
  } else if (pageId === 'assignments') {
    await schoolController.loadStudentAssignments();
  } else if (pageId === 'examinations') {
    const subs = schoolModel.studentEnrolledSubjects || [];
    const prog = (schoolModel.user && schoolModel.user.program) || 'WAEC';
    SchoolView.renderStudentExaminations(subs, prog);
  } else if (pageId === 'leaderboard') {
    await schoolController.loadStudentLeaderboard();
  } else if (pageId === 'analytics') {
    await schoolController.loadStudentAnalytics();
  } else if (pageId === 'notices') {
    await schoolController.loadStudentNotices();
  } else if (pageId === 'timetable') {
    await schoolController.loadStudentTimetable();
  } else if (pageId === 'chat') {
    await schoolController.openCampusChat('studentChatMount');
  } else if (pageId === 'attendance') {
    await schoolController.loadStudentAttendance();
  }
};

// Toggle timetable view between Day View and Full Week Grid
window.toggleTimetableView = function(mode) {
  const dayContainer = document.getElementById('timetableDay');
  const weekContainer = document.getElementById('timetableWeek');
  const dayBtn = document.getElementById('ttViewDayBtn');
  const weekBtn = document.getElementById('ttViewWeekBtn');

  if (mode === 'week') {
    if (dayContainer) {
      dayContainer.classList.add('hidden');
      dayContainer.style.display = 'none';
    }
    if (weekContainer) {
      weekContainer.classList.remove('hidden');
      weekContainer.style.display = 'grid';
    }
    if (dayBtn) dayBtn.classList.remove('active');
    if (weekBtn) weekBtn.classList.add('active');
  } else {
    if (weekContainer) {
      weekContainer.classList.add('hidden');
      weekContainer.style.display = 'none';
    }
    if (dayContainer) {
      dayContainer.classList.remove('hidden');
      dayContainer.style.display = 'grid';
    }
    if (weekBtn) weekBtn.classList.remove('active');
    if (dayBtn) dayBtn.classList.add('active');
  }
};

// Generate randomized Google Meet room URL helper
window.generateRandomMeetLink = function(targetInputId) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rPart = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const link = `https://meet.google.com/${rPart(3)}-${rPart(4)}-${rPart(3)}`;

  const input = document.getElementById(targetInputId);
  if (input) {
    input.value = link;
    input.focus();
  }
};

// Toggle collapsible sections on Admin & Staff Dashboards
window.toggleDashboardSection = function(contentId, buttonId, title, icon) {
  const content = document.getElementById(contentId);
  const button = document.getElementById(buttonId);
  const indicator = button ? button.querySelector('.toggle-indicator') : null;
  if (!content) return;

  const isHidden = content.style.display === 'none' || content.classList.contains('hidden');

  if (isHidden) {
    content.style.display = 'block';
    content.classList.remove('hidden');
    if (button) button.classList.add('expanded');
    if (indicator) {
      indicator.innerHTML = '▼ Hide ' + title;
    }
  } else {
    content.style.display = 'none';
    content.classList.add('hidden');
    if (button) button.classList.remove('expanded');
    if (indicator) {
      indicator.innerHTML = '▶ View ' + title;
    }
  }
};

// 4. Resource Management Modals & Handlers (Staff & Admin)
window.openAddResourceModal = function() {
  schoolController.openAddResourceModal();
};

window.openEditResourceModal = async function(id) {
  await schoolController.openEditResourceModal(id);
};

window.openResourceViewer = async function(id) {
  await schoolController.openResourceViewer(id);
};

window.closeResourceViewerModal = function() {
  SchoolView.closeResourceViewerModal();
};

window.printResourceViewer = function() {
  SchoolView.printResourceViewer();
};

window.closeResourceModal = function() {
  SchoolView.closeResourceModal();
};

window.handleSaveResource = async function(event) {
  if (event) event.preventDefault();
  await schoolController.saveResource(event);
};

window.handleDeleteResource = async function(id) {
  await schoolController.deleteResource(id);
};

window.handleResourceTypeChange = function() {
  const type = document.getElementById('resourceType')?.value || 'past_question';
  const pqFields = document.getElementById('pastQuestionFieldsGroup');
  const tbFields = document.getElementById('textbookFieldsGroup');

  if (type === 'past_question') {
    if (pqFields) pqFields.style.display = 'grid';
    if (tbFields) tbFields.style.display = 'none';
  } else {
    if (pqFields) pqFields.style.display = 'none';
    if (tbFields) tbFields.style.display = 'block';
  }
};

window.filterStaffAdminResources = function(type, triggerBtn) {
  schoolController.filterResources(type, triggerBtn);
};

let searchDebounceTimer = null;
window.handleResourceSearch = function(query) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    schoolController.searchResources(query);
  }, 250);
};

// 5. Staff Assignment Creation & Student Assignment Handlers
window.createAssignment = async function(event) {
  if (event) event.preventDefault();
  const form = event.target;
  const title = document.getElementById('newAssignmentTitle')?.value.trim();
  const category = document.getElementById('newAssignmentCategory')?.value || 'assignment';
  const subject = document.getElementById('newAssignmentSubject')?.value;
  const due_date = document.getElementById('newAssignmentDue')?.value;
  const due_time = document.getElementById('newAssignmentTime')?.value || '23:59';
  const description = document.getElementById('newAssignmentInstructions')?.value.trim();
  const fileInput = document.getElementById('newAssignmentFile');
  const file = fileInput && fileInput.files && fileInput.files[0];

  if (!title || !subject || !due_date) {
    alert('Please fill in assignment title, subject, and deadline date.');
    return;
  }

  // Teacher can provide descriptive instructions, upload a file, or both
  if (!description && !file) {
    alert('Please provide descriptive instructions, upload an assignment file, or do both.');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('subject', subject);
  formData.append('due_date', due_date);
  formData.append('due_time', due_time);
  if (description) formData.append('description', description);
  if (file) formData.append('file', file);

  const btn = document.getElementById('publishAssignmentBtn');
  const origText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Publishing...';
  }

  try {
    const res = await schoolModel.createAssignment(formData);
    alert(res.message || 'Assignment published successfully!');
    if (form && typeof form.reset === 'function') {
      form.reset();
      const timeInp = document.getElementById('newAssignmentTime');
      if (timeInp) timeInp.value = '23:59';
    }

    const countEl = document.getElementById('staffAssignmentCount');
    if (countEl) {
      const cur = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = cur + 1;
    }
  } catch (err) {
    console.error('Create assignment error:', err);
    alert(err.message || 'Failed to publish assignment.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText || 'Publish assignment';
    }
  }
};

window.renderAssignments = function() {
  const filter = document.getElementById('assignmentFilter')?.value || 'all';
  const enrolledSubs = schoolModel.studentEnrolledSubjects || [];
  const all = (schoolModel.studentAssignments || []).filter(a => SchoolView.isSubjectEnrolled(a.subject, enrolledSubs));
  const subs = schoolModel.studentSubmissions || [];
  const subMap = {};
  subs.forEach(s => { subMap[s.assignment_id] = true; });

  let filtered = all;
  if (filter === 'pending') {
    filtered = all.filter(a => !subMap[a.id]);
  } else if (filter === 'submitted') {
    filtered = all.filter(a => subMap[a.id]);
  }

  SchoolView.renderStudentAssignments(filtered, subs, enrolledSubs);
};

window.handleStudentSubmitAssignment = async function(event, assignmentId) {
  if (event) event.preventDefault();
  const form = event.target;
  const textarea = document.getElementById(`assignSubmitText_${assignmentId}`) || document.getElementById(`assignSubmit_${assignmentId}`);
  const fileInput = document.getElementById(`assignSubmitFile_${assignmentId}`);
  const btn = document.getElementById(`submitAssignBtn_${assignmentId}`);

  const content = textarea ? textarea.value.trim() : '';
  const file = fileInput && fileInput.files && fileInput.files[0];

  if (!content && !file) {
    alert('Please enter your coursework answer, attach an assignment file, or do both before submitting.');
    return;
  }

  const formData = new FormData();
  formData.append('assignment_id', assignmentId);
  if (content) formData.append('content', content);
  if (file) formData.append('file', file);

  const origText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  try {
    const res = await schoolModel.submitAssignment(formData);
    alert(res.message || 'Coursework submitted successfully!');
    if (form && typeof form.reset === 'function') form.reset();
    await schoolController.loadStudentAssignments();
    await schoolController.loadStudentLeaderboard();
  } catch (err) {
    console.error('Submit assignment error:', err);
    alert(err.message || 'Failed to submit assignment.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText || 'Submit Coursework';
    }
  }
};

// 6. Global Auth Event Handlers
window.handleLogin = async function(event) {
  if (event) event.preventDefault();
  const signupModeBtn = document.getElementById('signupModeButton');
  const isSignup = signupModeBtn && signupModeBtn.classList.contains('active');

  if (isSignup) {
    await schoolController.registerUser(event);
  } else {
    await schoolController.login(event);
  }
};

window.handleCreateStaff = async function(event) {
  if (event) event.preventDefault();
  await schoolController.createStaffAccount(event);
};

window.handleIssueCode = async function(event) {
  if (event) event.preventDefault();
  await schoolController.issueStaffAccessCode(event);
};

window.handleLogout = async function(event) {
  if (event) event.preventDefault();
  await schoolController.logout();
};

window.toggleTheme = function() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
};

// Populate subjects in Staff "Publish Assignment" form
function populateStaffAssignmentSubjects() {
  const select = document.getElementById('newAssignmentSubject');
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose Subject --</option>' + 
    window.ALL_CURRICULUM_SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('');
}

// 6. Registered Students Filter & Search Handlers (Admin)
window.handleAdminStudentFilter = async function() {
  await schoolController.loadAdminStudents();
};

let adminSearchDebounceTimer = null;
window.handleAdminStudentSearch = function(query) {
  clearTimeout(adminSearchDebounceTimer);
  adminSearchDebounceTimer = setTimeout(async () => {
    await schoolController.loadAdminStudents();
  }, 250);
};

// 7. Dynamic Subject Options for Staff Creation
window.updateNewStaffSubjectOptions = function() {
  const deptSelect = document.getElementById('newStaffDepartment');
  const subjSelect = document.getElementById('newStaffSubject');
  if (!subjSelect) return;

  const dept = deptSelect ? deptSelect.value : 'Science';
  const subjectsByDept = {
    Science: [
      'Biology', 'Chemistry', 'Physics', 'Agricultural Science',
      'Further Mathematics', 'Physical Education', 'Health Education',
      'Foods and Nutrition', 'Geography', 'Technical Drawing',
      'Data Processing', 'Computer Studies',
      'Mathematics', 'English Language', 'Civic Education'
    ],
    Commercial: [
      'Economics', 'Financial Accounting / Accounting', 'Commerce',
      'Marketing', 'Office Practice', 'Government',
      'Data Processing', 'Computer Studies',
      'Mathematics', 'English Language', 'Civic Education'
    ],
    Art: [
      'Literature-in-English', 'Government', 'Nigerian History',
      'Christian Religious Studies (CRS)', 'Islamic Studies (IRS)',
      'Nigerian Languages: Hausa, Igbo, or Yoruba', 'French', 'Arabic',
      'Visual Art', 'Music', 'Home Management', 'Catering Craft Practice',
      'Fashion Design and Garment Making', 'Beauty and Cosmetology',
      'English Language', 'Mathematics', 'Civic Education'
    ]
  };

  const primaryList = subjectsByDept[dept] || subjectsByDept.Science;
  const otherSubjects = window.ALL_CURRICULUM_SUBJECTS.filter(s => !primaryList.includes(s));

  subjSelect.innerHTML = 
    `<optgroup label="${dept} Specialization Subjects">` + 
    primaryList.map(sub => `<option value="${sub}">${sub}</option>`).join('') + 
    `</optgroup>` +
    `<optgroup label="Other Curriculum Subjects">` + 
    otherSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join('') + 
    `</optgroup>`;
};

// Populate subjects in Admin Timetable Modal
window.populateTimetableModalSubjects = function() {
  const select = document.getElementById('scheduleSubject');
  if (!select || !window.ALL_CURRICULUM_SUBJECTS) return;

  select.innerHTML = '<option value="">-- Select Subject --</option>' + 
    window.ALL_CURRICULUM_SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('');
};

// 8. Auto Session Restoration on Page Load
document.addEventListener('DOMContentLoaded', async () => {
  populateStaffAssignmentSubjects();
  updateNewStaffSubjectOptions();
  populateTimetableModalSubjects();
  schoolController.loadAcademicSession();

  const user = await schoolModel.checkSession();

  if (user) {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }

    if (user.role === 'admin') {
      await SchoolView.initializeAdmin();
    } else if (user.role === 'staff') {
      await SchoolView.initializeStaff();
    } else if (user.role === 'student') {
      await SchoolView.initializeStudent();
    }
    schoolController.startBackgroundUnreadPolling();
    schoolController.startPortalLiveSync();
  } else {
    // Check if URL contains password reset token
    if (typeof schoolController !== 'undefined' && typeof schoolController.checkUrlForPasswordReset === 'function') {
      schoolController.checkUrlForPasswordReset();
    }
    // Handle redirect after student account activation (?student_id=STU-XXXX)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const studentIdParam = urlParams.get('student_id');
      if (studentIdParam) {
        if (typeof selectPortalRole === 'function') {
          selectPortalRole('student');
        }
        if (typeof setAuthMode === 'function') {
          setAuthMode('login');
        }
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
          emailInput.value = studentIdParam;
        }
        const passInput = document.getElementById('loginPassword');
        if (passInput) {
          passInput.focus();
        }
        const authHelper = document.getElementById('authHelper');
        if (authHelper) {
          authHelper.innerHTML = `<span style="color:#16a34a; font-weight:800;">🎉 Account Activated!</span> Official Student ID: <strong>${studentIdParam}</strong>. Enter your password to enter your student portal.`;
        }
      }
    } catch (paramErr) {
      console.warn('URL param parse error:', paramErr);
    }
  }
});

// 9. Sticky Workspace Dropdown Handlers (Student Portal)
window.toggleWorkspaceDropdown = function(event) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById('workspaceDropdownMenu');
  const btn = document.getElementById('workspaceDropdownBtn');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  } else {
    menu.classList.add('hidden');
    if (btn) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }
};

window.closeWorkspaceDropdown = function() {
  const menu = document.getElementById('workspaceDropdownMenu');
  const btn = document.getElementById('workspaceDropdownBtn');
  if (menu) {
    menu.classList.add('hidden');
  }
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
};

window.selectWorkspaceDropdownItem = async function(pageId) {
  closeWorkspaceDropdown();
  await window.openWorkspace(pageId);
};

// ==========================================================================
// STAFF WORKSPACE DROPDOWN & PAGE NAVIGATION
// ==========================================================================
window.toggleStaffWorkspaceDropdown = function(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const menu = document.getElementById('staffWorkspaceDropdownMenu');
  const btn = document.getElementById('staffWorkspaceDropdownBtn');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  } else {
    menu.classList.add('hidden');
    if (btn) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }
};

window.closeStaffWorkspaceDropdown = function() {
  const menu = document.getElementById('staffWorkspaceDropdownMenu');
  const btn = document.getElementById('staffWorkspaceDropdownBtn');
  if (menu) menu.classList.add('hidden');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
};

window.selectStaffWorkspaceDropdownItem = async function(pageId) {
  closeStaffWorkspaceDropdown();
  if (typeof SchoolView !== 'undefined' && typeof SchoolView.switchStaffPage === 'function') {
    SchoolView.switchStaffPage(pageId);
  }

  try {
    if (pageId === 'school') {
      await schoolController.loadAlocSchool('staff');
    } else if (pageId === 'chat') {
      await schoolController.openCampusChat('staffChatMount');
    } else if (pageId === 'roster') {
      await schoolController.loadStaffRoster();
    } else if (pageId === 'assignments') {
      await schoolController.loadStaffAssignments();
    } else if (pageId === 'timetable') {
      await schoolController.loadStaffTimetable();
    } else if (pageId === 'scoresheet') {
      await schoolController.loadStaffScoresheet();
    } else if (pageId === 'resources') {
      await schoolController.loadStaffResources();
    } else if (pageId === 'payroll') {
      await schoolController.loadStaffPayrollInfo();
    } else if (pageId === 'leaderboard') {
      await schoolController.loadStaffLeaderboard();
    } else if (pageId === 'notices') {
      await schoolController.loadStaffNotices();
    } else if (pageId === 'overview') {
      await schoolController.loadStaffLeaderboard();
      await schoolController.loadStaffAssignments();
    }
  } catch (err) {
    console.warn('Error loading staff section data for ' + pageId, err);
  }
};

// ==========================================================================
// ADMIN WORKSPACE DROPDOWN & PAGE NAVIGATION
// ==========================================================================
window.toggleAdminWorkspaceDropdown = function(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const menu = document.getElementById('adminWorkspaceDropdownMenu');
  const btn = document.getElementById('adminWorkspaceDropdownBtn');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  } else {
    menu.classList.add('hidden');
    if (btn) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }
};

window.closeAdminWorkspaceDropdown = function() {
  const menu = document.getElementById('adminWorkspaceDropdownMenu');
  const btn = document.getElementById('adminWorkspaceDropdownBtn');
  if (menu) menu.classList.add('hidden');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
};

window.selectAdminWorkspaceDropdownItem = async function(pageId) {
  closeAdminWorkspaceDropdown();
  if (typeof SchoolView !== 'undefined' && typeof SchoolView.switchAdminPage === 'function') {
    SchoolView.switchAdminPage(pageId);
  }

  try {
    if (pageId === 'school') {
      await schoolController.loadAlocSchool('admin');
    } else if (pageId === 'chat') {
      await schoolController.openCampusChat('adminChatMount');
    } else if (pageId === 'paystack') {
      await schoolController.loadAdminPaystackSettings();
    } else if (pageId === 'students' || pageId === 'verifications') {
      await schoolController.loadAdminStudents();
      await schoolController.loadAdminStudentVerifications();
    } else if (pageId === 'staff') {
      await schoolController.loadAdminStaff();
    } else if (pageId === 'timetable') {
      await schoolController.loadAdminTimetable();
    } else if (pageId === 'scoresheet') {
      await schoolController.loadAdminScoresheet();
    } else if (pageId === 'leaderboard') {
      await schoolController.loadAdminLeaderboard();
    } else if (pageId === 'notices') {
      await schoolController.loadAdminNotices();
    } else if (pageId === 'resources') {
      await schoolController.loadAdminResources();
    } else if (pageId === 'fees') {
      await schoolController.loadAdminFees();
    } else if (pageId === 'payroll') {
      await schoolController.loadAdminPayroll();
    } else if (pageId === 'ledger') {
      await schoolController.loadFinancialLedger();
    } else if (pageId === 'admins') {
      await schoolController.loadAdminManagement();
      await schoolController.loadAuditLogs();
    } else if (pageId === 'overview') {
      await schoolController.loadAdminAnalytics();
    }
  } catch (err) {
    console.warn('Error loading admin section data for ' + pageId, err);
  }
};

// Global click outside listener to auto-close workspace dropdowns
document.addEventListener('click', (event) => {
  const studentContainer = document.getElementById('workspaceDropdownContainer');
  if (studentContainer && !studentContainer.contains(event.target)) {
    closeWorkspaceDropdown();
  }

  const staffContainer = document.getElementById('staffWorkspaceDropdownContainer');
  if (staffContainer && !staffContainer.contains(event.target)) {
    closeStaffWorkspaceDropdown();
  }

  const adminContainer = document.getElementById('adminWorkspaceDropdownContainer');
  if (adminContainer && !adminContainer.contains(event.target)) {
    closeAdminWorkspaceDropdown();
  }
});

// Close workspace dropdowns on Escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeWorkspaceDropdown();
    closeStaffWorkspaceDropdown();
    closeAdminWorkspaceDropdown();
  }
});

// Delegated Password Visibility Eye Toggle Listener across all portals & modals
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.password-toggle-btn');
  if (!btn) return;
  e.preventDefault();
  const wrapper = btn.closest('.password-input-wrapper');
  if (!wrapper) return;
  const input = wrapper.querySelector('input');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.title = 'Hide password';
    btn.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.title = 'Show password';
    btn.setAttribute('aria-label', 'Show password');
  }
});
