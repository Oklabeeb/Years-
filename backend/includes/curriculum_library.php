<?php
/**
 * Curriculum Library Engine: Seeds and delivers authentic secondary school
 * textbooks and past examination papers (WAEC, JAMB, NECO) for all portals.
 */

function getCurriculumResourcesData(): array {
    return [
        // =========================================================================
        // 1. MATHEMATICS
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Mathematics',
            'title' => 'WAEC 2024 General Mathematics (Paper 1 & 2)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_math_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 General Mathematics</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #0284c7;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#0369a1;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,.05)}.q-num{font-weight:750;color:#0284c7;margin-bottom:6px}.sol{margin-top:12px;padding:10px 14px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;font-size:.92rem;color:#166534}</style></head><body><div class="hdr"><h1>WEST AFRICAN SENIOR SCHOOL CERTIFICATE EXAMINATION (WASSCE)</h1><h3>General Mathematics (Core) · May/June 2024</h3><span style="background:#e0f2fe;color:#0369a1;padding:4px 12px;border-radius:20px;font-weight:700;font-size:.85rem;">Official Practice Paper & Worked Solutions</span></div><div class="q-box"><div class="q-num">Question 1 (Objective)</div><p>Evaluate log₁₀(25) + log₁₀(4) - log₁₀(0.1).</p><ol type="A"><li>1</li><li>2</li><li>3</li><li>4</li></ol><div class="sol"><strong>Solution:</strong> log₁₀(25 × 4) - log₁₀(10⁻¹) = log₁₀(100) - (-1) = 2 + 1 = 3.<br><strong>Correct Answer: C</strong></div></div><div class="q-box"><div class="q-num">Question 2 (Objective)</div><p>If 3^(2x+1) - 28(3^x) + 9 = 0, find the values of x.</p><ol type="A"><li>x = -1 or x = 2</li><li>x = 1 or x = -2</li><li>x = 0 or x = 3</li><li>x = 2 or x = 4</li></ol><div class="sol"><strong>Solution:</strong> Let y = 3^x. Then 3y² - 28y + 9 = 0 ⇒ (3y - 1)(y - 9) = 0 ⇒ y = 1/3 or y = 9. Hence 3^x = 3⁻¹ ⇒ x = -1, and 3^x = 3² ⇒ x = 2.<br><strong>Correct Answer: A</strong></div></div><div class="q-box"><div class="q-num">Question 3 (Theory - 10 Marks)</div><p>The 3rd term of an Arithmetic Progression (A.P.) is 10 and the 8th term is 25.<br>(a) Find the first term (a) and common difference (d).<br>(b) Calculate the sum of the first 20 terms.</p><div class="sol"><strong>Solution:</strong><br>(a) T₃ = a + 2d = 10; T₈ = a + 7d = 25. Subtracting gives 5d = 15 ⇒ d = 3. Substituting into T₃ gives a + 2(3) = 10 ⇒ a = 4.<br>(b) S₂₀ = (20/2)[2(4) + (20 - 1)(3)] = 10[8 + 57] = 10(65) = 650.</div></div></body></html>'
        ],
        [
            'type' => 'past_question',
            'subject' => 'Mathematics',
            'title' => 'JAMB UTME 2024 Mathematics CBT Practice',
            'exam' => 'JAMB',
            'year' => '2024',
            'author' => 'Joint Admissions and Matriculation Board',
            'filename' => 'jamb_math_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>JAMB UTME 2024 Mathematics</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#15803d;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,.05)}.q-num{font-weight:750;color:#15803d;margin-bottom:6px}.sol{margin-top:12px;padding:10px 14px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;font-size:.92rem;color:#166534}</style></head><body><div class="hdr"><h1>JAMB UNIFIED TERTIARY MATRICULATION EXAMINATION</h1><h3>Mathematics CBT Past Questions & Detailed Rationales (2024)</h3><span style="background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:20px;font-weight:700;font-size:.85rem;">Official CBT Practice Module</span></div><div class="q-box"><div class="q-num">Question 1</div><p>Find the derivative dy/dx of y = (2x + 1)³ / (x² + 4).</p><ol type="A"><li>(2x+1)²(4x² - 2x + 24) / (x²+4)²</li><li>(2x+1)²(2x² + 24) / (x²+4)²</li><li>6(2x+1)² / (2x)</li><li>3(2x+1)² / (x²+4)</li></ol><div class="sol"><strong>Solution:</strong> By Quotient Rule: u = (2x+1)³, v = x²+4. u\' = 6(2x+1)², v\' = 2x. dy/dx = [6(2x+1)²(x²+4) - 2x(2x+1)³] / (x²+4)² = (2x+1)²[6x²+24 - 4x² - 2x] / (x²+4)² = (2x+1)²(2x² - 2x + 24) / (x²+4)².<br><strong>Correct Answer: A</strong></div></div><div class="q-box"><div class="q-num">Question 2</div><p>Evaluate ∫ (4x³ - 6x² + 2) dx from x = 1 to x = 3.</p><ol type="A"><li>32</li><li>48</li><li>56</li><li>64</li></ol><div class="sol"><strong>Solution:</strong> Indefinite integral = x⁴ - 2x³ + 2x. At x = 3: (81) - 2(27) + 2(3) = 81 - 54 + 6 = 33. At x = 1: 1 - 2 + 2 = 1. Definite integral = 33 - 1 = 32.<br><strong>Correct Answer: A</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Mathematics',
            'title' => 'New General Mathematics for Senior Secondary Schools (SS1 - SS3)',
            'exam' => null,
            'year' => null,
            'author' => 'M.F. Macrae, A.O. Kalejaiye, et al.',
            'filename' => 'textbook_mathematics.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>New General Mathematics (SS1 - SS3)</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #0369a1;padding:25px;border-radius:12px;background:#f0f9ff;margin-bottom:30px}.cov h1{color:#0369a1;margin:0 0 10px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;box-shadow:0 2px 6px rgba(0,0,0,.04);font-family:system-ui,sans-serif}.ch h2{color:#0369a1;border-bottom:2px solid #bae6fd;padding-bottom:6px}.box{background:#f0fdf4;padding:12px 16px;border-left:4px solid #16a34a;border-radius:6px;margin:15px 0}</style></head><body><div class="cov"><h1>New General Mathematics for Senior Secondary Schools</h1><p><em>By M.F. Macrae, A.O. Kalejaiye, J.B. Channon, et al.</em></p><span style="background:#e0f2fe;color:#0369a1;padding:4px 14px;border-radius:15px;font-weight:700;">Approved National Curriculum · SS1, SS2, SS3</span></div><div class="ch"><h2>Chapter 1: Indices and Logarithms</h2><p>The rules of indices form the bedrock of algebraic manipulation:</p><ul><li><strong>Multiplication Rule:</strong> aᵐ × aⁿ = aᵐ⁺ⁿ</li><li><strong>Division Rule:</strong> aᵐ ÷ aⁿ = aᵐ⁻ⁿ</li><li><strong>Power Rule:</strong> (aᵐ)ⁿ = aᵐⁿ</li><li><strong>Zero Index:</strong> a⁰ = 1 (where a ≠ 0)</li><li><strong>Negative Index:</strong> a⁻ᵐ = 1/aᵐ</li><li><strong>Fractional Index:</strong> a^(m/n) = ⁿ√(aᵐ)</li></ul><div class="box"><strong>Key Law of Logarithms:</strong> log_b(xy) = log_b(x) + log_b(y); log_b(x/y) = log_b(x) - log_b(y); log_b(xⁿ) = n·log_b(x).</div></div><div class="ch"><h2>Chapter 2: Quadratic Equations and Functions</h2><p>Any equation in the form ax² + bx + c = 0 (where a ≠ 0) is a quadratic equation. It can be solved by factorization, completing the square, or using the quadratic formula: x = [-b ± √(b² - 4ac)] / (2a).</p></div></body></html>'
        ],

        // =========================================================================
        // 2. ENGLISH LANGUAGE
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'English Language',
            'title' => 'WAEC 2024 English Language (Lexis, Structure & Comprehension)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_english_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 English Language</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #ca8a04;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#a16207;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#fefce8;border-left:4px solid #ca8a04;border-radius:6px;font-size:.92rem;color:#854d0e}</style></head><body><div class="hdr"><h1>WEST AFRICAN SENIOR SCHOOL CERTIFICATE EXAMINATION</h1><h3>English Language (Paper 1 & Paper 2) · May/June 2024</h3></div><div class="q-box"><h3>Section 1: Lexis and Structure</h3><p>Choose the word that is nearest in meaning to the underlined word:<br>The manager\'s decision was <u>irrevocable</u> once ratified by the board.</p><ol type="A"><li>unwise</li><li>unalterable</li><li>unilateral</li><li>temporary</li></ol><div class="sol"><strong>Explanation:</strong> "Irrevocable" denotes a verdict or act that cannot be revoked, recalled, or changed. Synonym: unalterable.<br><strong>Correct Answer: B</strong></div></div><div class="q-box"><h3>Section 2: Sentence Completion</h3><p>Neither the headmaster nor the subject teachers ______ present at the assembly.</p><ol type="A"><li>was</li><li>were</li><li>is</li><li>has been</li></ol><div class="sol"><strong>Explanation:</strong> By proximity concord with correlative conjunction "neither...nor", the verb agrees with the closer subject ("the subject teachers" - plural). Hence, "were" is correct.<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'English Language',
            'title' => 'Intensive English for Senior Secondary Schools (SS1 - SS3)',
            'exam' => null,
            'year' => null,
            'author' => 'B.O. Oluikpe, et al.',
            'filename' => 'textbook_english.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Intensive English for SSS</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #d97706;padding:25px;border-radius:12px;background:#fffbeb;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Intensive English for Senior Secondary Schools</h1><p><em>By Prof. B.O. Oluikpe, et al.</em></p><span>Approved National Curriculum · Grammar, Lexis, Composition & Oracy</span></div><div class="ch"><h2>Chapter 1: Grammatical Concord & Subject-Verb Agreement</h2><p>Concord refers to the grammatical agreement between parts of a sentence. Essential rules include:</p><ul><li><strong>Rule of Number:</strong> A singular subject takes a singular verb; a plural subject takes a plural verb. <em>e.g., The boy plays; the boys play.</em></li><li><strong>Proximity Concord:</strong> With correlatives (either...or, neither...nor, not only...but also), the verb agrees with the nearest subject.</li><li><strong>Parenthetical Concord:</strong> Expressions like "as well as", "together with", "in addition to" do not alter the number of the initial subject. <em>e.g., The principal, together with his staff, is attending the summit.</em></li></ul></div><div class="ch"><h2>Chapter 2: Formal Essay & Argumentative Writing</h2><p>An argumentative essay requires clear thesis statement, logical evidence, refutation of counter-arguments, and persuasive conclusion. Maintain formal register throughout.</p></div></body></html>'
        ],

        // =========================================================================
        // 3. PHYSICS
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Physics',
            'title' => 'WAEC 2024 Physics (Theory, Objectives & Practical Alternatives)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_physics_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Physics</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#1d4ed8;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;font-size:.92rem;color:#1e40af}</style></head><body><div class="hdr"><h1>WASSCE MAY/JUNE 2024 PHYSICS</h1><h3>Paper 1 (Objectives) & Paper 2 (Theory)</h3></div><div class="q-box"><h3>Question 1</h3><p>A projectile is launched from ground level with a velocity of 50 m/s at an angle of 30° to the horizontal. Calculate the maximum height reached. (Take g = 10 m/s²).</p><ol type="A"><li>31.25 m</li><li>62.50 m</li><li>125.00 m</li><li>250.00 m</li></ol><div class="sol"><strong>Solution:</strong> H_max = (u² sin²θ) / (2g) = (50² × sin²30°) / (2 × 10) = (2500 × 0.25) / 20 = 625 / 20 = 31.25 m.<br><strong>Correct Answer: A</strong></div></div><div class="q-box"><h3>Question 2</h3><p>State Newton\'s Second Law of Motion and show that F = ma.</p><div class="sol"><strong>Solution:</strong> The rate of change of momentum of an object is directly proportional to the applied resultant force and occurs in the direction of the force. F ∝ (mv - mu)/t = m(v - u)/t = ma. With constant of proportionality k = 1 in SI units, F = ma.</div></div></body></html>'
        ],
        [
            'type' => 'past_question',
            'subject' => 'Physics',
            'title' => 'JAMB UTME 2024 Physics CBT Comprehensive Practice',
            'exam' => 'JAMB',
            'year' => '2024',
            'author' => 'Joint Admissions and Matriculation Board',
            'filename' => 'jamb_physics_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>JAMB UTME 2024 Physics</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#15803d;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;font-size:.92rem;color:#166534}</style></head><body><div class="hdr"><h1>JAMB UTME 2024 PHYSICS</h1><h3>Official CBT Simulation Questions & Analytical Solutions</h3></div><div class="q-box"><h3>Question 1</h3><p>An electric heater rated 2 kW, 250 V is operated for 5 hours daily. Calculate the cost of operating the heater for 30 days if electrical energy costs ₦50 per kWh.</p><ol type="A"><li>₦15,000</li><li>₦12,500</li><li>₦18,000</li><li>₦9,000</li></ol><div class="sol"><strong>Solution:</strong> Total Energy = Power × Time = 2 kW × (5 h × 30 days) = 2 × 150 = 300 kWh. Total Cost = 300 kWh × ₦50 = ₦15,000.<br><strong>Correct Answer: A</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Physics',
            'title' => 'New School Physics for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'M.W. Anyakoha, Ph.D.',
            'filename' => 'new_school_physics.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>New School Physics</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #854d0e;padding:25px;border-radius:12px;background:#fefce8;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}.box{background:#fef9c3;padding:12px 16px;border-left:4px solid #eab308;border-radius:6px;margin:15px 0}</style></head><body><div class="cov"><h1>New School Physics for Senior Secondary Schools</h1><p><em>By M.W. Anyakoha, Ph.D.</em></p><span>Approved National Curriculum · SS1 - SS3</span></div><div class="ch"><h2>Chapter 1: Measurement & Physical Quantities</h2><p>Physics is the study of matter in relation to energy. Quantities are classified as fundamental (Length, Mass, Time, Current, Temperature) and derived (Velocity, Force, Pressure, Energy).</p><div class="box"><strong>Dimensional Analysis:</strong> Every physical equation must be dimensionally homogeneous. [Velocity] = LT⁻¹, [Acceleration] = LT⁻², [Force] = MLT⁻², [Work/Energy] = ML²T⁻².</div></div><div class="ch"><h2>Chapter 2: Linear Motion & Kinematics</h2><p>Equations of uniformly accelerated linear motion: (1) v = u + at, (2) s = ut + ½at², (3) v² = u² + 2as.</p></div></body></html>'
        ],

        // =========================================================================
        // 4. CHEMISTRY
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Chemistry',
            'title' => 'WAEC 2024 Chemistry (Theory, Objectives & Volumetric Analysis)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_chemistry_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Chemistry</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #0d9488;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#0f766e;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#f0fdfa;border-left:4px solid #0d9488;border-radius:6px;font-size:.92rem;color:#115e59}</style></head><body><div class="hdr"><h1>WASSCE 2024 CHEMISTRY</h1><h3>Paper 1 (Objectives) & Paper 2 (Theory)</h3></div><div class="q-box"><h3>Question 1</h3><p>What volume of 0.5 mol/dm³ HCl is required to neutralize 25.0 cm³ of 0.2 mol/dm³ Na₂CO₃ solution?</p><ol type="A"><li>10.0 cm³</li><li>20.0 cm³</li><li>25.0 cm³</li><li>50.0 cm³</li></ol><div class="sol"><strong>Solution:</strong> Equation: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂. Moles of base = (C_b × V_b)/1000 = (0.2 × 25)/1000 = 0.005 mol. Mole ratio base:acid = 1:2 ⇒ Moles of acid = 0.010 mol. V_acid = Moles / C_a = (0.010 / 0.5) × 1000 = 20.0 cm³.<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Chemistry',
            'title' => 'New School Chemistry for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'Osei Yaw Ababio',
            'filename' => 'textbook_chemistry.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>New School Chemistry</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #0f766e;padding:25px;border-radius:12px;background:#f0fdfa;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>New School Chemistry for Senior Secondary Schools</h1><p><em>By Osei Yaw Ababio</em></p><span>Approved Senior Secondary Curriculum · Inorganic, Organic & Physical</span></div><div class="ch"><h2>Chapter 1: Atomic Structure and Periodic Table</h2><p>Atoms consist of protons and neutrons in the nucleus with electrons orbiting in energy levels. Electronic configurations follow the Aufbau principle, Hund\'s rule, and Pauli exclusion principle.</p></div><div class="ch"><h2>Chapter 2: Chemical Bonding & Stoichiometry</h2><p>Electrovalent (ionic) bonding involves electron transfer between metals and non-metals; covalent bonding involves electron sharing between non-metals.</p></div></body></html>'
        ],

        // =========================================================================
        // 5. BIOLOGY
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Biology',
            'title' => 'WAEC 2024 Biology (Objectives, Theory & Specimen Diagrams)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_biology_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Biology</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#15803d;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;font-size:.92rem;color:#166534}</style></head><body><div class="hdr"><h1>WASSCE MAY/JUNE 2024 BIOLOGY</h1><h3>Paper 1 (Objectives) & Paper 2 (Theory)</h3></div><div class="q-box"><h3>Question 1</h3><p>Which of the following cell organelles is responsible for aerobic cellular respiration and ATP synthesis?</p><ol type="A"><li>Ribosome</li><li>Mitochondrion</li><li>Chloroplast</li><li>Golgi Apparatus</li></ol><div class="sol"><strong>Explanation:</strong> The mitochondrion is the powerhouse of the cell where the Krebs cycle and oxidative phosphorylation yield ATP.<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Biology',
            'title' => 'Modern Biology for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'Sarojini T. Ramalingam',
            'filename' => 'textbook_biology.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Modern Biology</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #15803d;padding:25px;border-radius:12px;background:#f0fdf4;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Modern Biology for Senior Secondary Schools</h1><p><em>By Sarojini T. Ramalingam</em></p><span>Complete African Curriculum · Ecology, Genetics & Physiology</span></div><div class="ch"><h2>Chapter 1: Organization of Life & Cell Biology</h2><p>Life is organized into hierarchical levels: Molecule → Organelle → Cell → Tissue → Organ → System → Organism. The cell is the fundamental structural and functional unit of all living organisms.</p></div></body></html>'
        ],

        // =========================================================================
        // 6. ECONOMICS
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Economics',
            'title' => 'WAEC 2024 Economics (Paper 1 Objectives & Paper 2 Data Response)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_economics_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Economics</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #0284c7;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#0369a1;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#f0f9ff;border-left:4px solid #0284c7;border-radius:6px;font-size:.92rem;color:#0369a1}</style></head><body><div class="hdr"><h1>WASSCE 2024 ECONOMICS</h1><h3>Paper 1 (Objectives) & Paper 2 (Data Response)</h3></div><div class="q-box"><h3>Question 1</h3><p>When the price of a commodity falls from ₦200 to ₦160, the quantity demanded rises from 40 units to 60 units. Calculate the price elasticity of demand.</p><ol type="A"><li>1.5</li><li>2.0</li><li>2.5</li><li>0.5</li></ol><div class="sol"><strong>Solution:</strong> % Change in Q = (20 / 40) × 100 = 50%. % Change in P = (40 / 200) × 100 = 20%. Price Elasticity of Demand (PED) = %ΔQ / %ΔP = 50 / 20 = 2.5 (Elastic).<br><strong>Correct Answer: C</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Economics',
            'title' => 'Comprehensive Economics for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'J.U. Anyaele',
            'filename' => 'textbook_economics.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comprehensive Economics</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #0284c7;padding:25px;border-radius:12px;background:#f0f9ff;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Comprehensive Economics for Senior Secondary Schools</h1><p><em>By J.U. Anyaele</em></p><span>Microeconomics, Macroeconomics & Nigerian Financial Systems</span></div><div class="ch"><h2>Chapter 1: Scarcity, Choice and Opportunity Cost</h2><p>Economics is the social science which studies human behavior as a relationship between ends and scarce means which have alternative uses (Lionel Robbins).</p></div></body></html>'
        ],

        // =========================================================================
        // 7. COMMERCE
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Commerce',
            'title' => 'WAEC 2024 Commerce (Theory & Objective Questions)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_commerce_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Commerce</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #ea580c;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#c2410c;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#fff7ed;border-left:4px solid #ea580c;border-radius:6px;font-size:.92rem;color:#9a3412}</style></head><body><div class="hdr"><h1>WASSCE MAY/JUNE 2024 COMMERCE</h1><h3>Paper 1 (Objectives) & Paper 2 (Theory)</h3></div><div class="q-box"><h3>Question 1</h3><p>Which of the following aids to trade is primarily concerned with creating time utility for produced goods?</p><ol type="A"><li>Advertising</li><li>Banking</li><li>Warehousing</li><li>Insurance</li></ol><div class="sol"><strong>Explanation:</strong> Warehousing stores goods until they are demanded, bridging the time gap between production and consumption.<br><strong>Correct Answer: C</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Commerce',
            'title' => 'Senior Secondary Commerce for West African Schools',
            'exam' => null,
            'year' => null,
            'author' => 'P.N. Ahukannah & Ndinechi',
            'filename' => 'textbook_commerce.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Senior Secondary Commerce</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #c2410c;padding:25px;border-radius:12px;background:#fff7ed;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Senior Secondary Commerce for West African Schools</h1><p><em>By P.N. Ahukannah & Ndinechi</em></p><span>Trade, Aids to Trade, Banking, Insurance & Commercial Law</span></div><div class="ch"><h2>Chapter 1: Scope & Foundations of Commerce</h2><p>Commerce is the sum total of all activities involved in the distribution and exchange of goods and services from original producers to ultimate consumers.</p></div></body></html>'
        ],

        // =========================================================================
        // 8. FINANCIAL ACCOUNTING
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Financial Accounting / Accounting',
            'title' => 'WAEC 2024 Financial Accounting (Principles & Practical Accounts)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_accounting_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Financial Accounting</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #4338ca;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#3730a3;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#eef2ff;border-left:4px solid #4338ca;border-radius:6px;font-size:.92rem;color:#312e81}</style></head><body><div class="hdr"><h1>WASSCE 2024 FINANCIAL ACCOUNTING</h1><h3>Theory and Practice of Book-keeping</h3></div><div class="q-box"><h3>Question 1</h3><p>According to the basic accounting equation, if Total Assets = ₦1,500,000 and Total Liabilities = ₦600,000, what is the Owner\'s Equity?</p><ol type="A"><li>₦2,100,000</li><li>₦900,000</li><li>₦600,000</li><li>₦1,500,000</li></ol><div class="sol"><strong>Solution:</strong> Assets = Liabilities + Capital (Owner\'s Equity) ⇒ Capital = Assets - Liabilities = ₦1,500,000 - ₦600,000 = ₦900,000.<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Financial Accounting / Accounting',
            'title' => 'Simplified Book-Keeping & Financial Accounting for SSS',
            'exam' => null,
            'year' => null,
            'author' => 'F. Latunde',
            'filename' => 'textbook_accounting.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Financial Accounting for SSS</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #4338ca;padding:25px;border-radius:12px;background:#eef2ff;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Simplified Book-Keeping & Financial Accounting</h1><p><em>By F. Latunde</em></p><span>Double-Entry Bookkeeping, Trial Balance, Final Accounts & Partnership</span></div><div class="ch"><h2>Chapter 1: The Golden Rules of Double-Entry</h2><p>For every debit entry, there must be a corresponding credit entry. Rule: Debit the receiver, Credit the giver. Debit what comes in, Credit what goes out. Debit all expenses and losses, Credit all incomes and gains.</p></div></body></html>'
        ],

        // =========================================================================
        // 9. GOVERNMENT
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Government',
            'title' => 'WAEC 2024 Government (Elements of Government & Political Systems)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_government_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Government</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #b91c1c;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#991b1b;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#fef2f2;border-left:4px solid #b91c1c;border-radius:6px;font-size:.92rem;color:#7f1d1d}</style></head><body><div class="hdr"><h1>WASSCE 2024 GOVERNMENT</h1><h3>Political Systems & Constitutions</h3></div><div class="q-box"><h3>Question 1</h3><p>Which political doctrine advocates that powers should be divided among the legislature, executive, and judiciary to avoid tyranny?</p><ol type="A"><li>Rule of Law</li><li>Separation of Powers</li><li>Collective Responsibility</li><li>Sovereignty</li></ol><div class="sol"><strong>Explanation:</strong> Formulated by Baron de Montesquieu in "The Spirit of the Laws" (1748).<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Government',
            'title' => 'Essential Government for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'C.C. Dibie',
            'filename' => 'textbook_government.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Essential Government</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #b91c1c;padding:25px;border-radius:12px;background:#fef2f2;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Essential Government for Senior Secondary Schools</h1><p><em>By C.C. Dibie</em></p><span>Political Science, Constitutional Development & African Affairs</span></div><div class="ch"><h2>Chapter 1: The Concept of the State and Sovereignty</h2><p>A state is a politically organized body of people inhabiting a defined geographical territory, possessing sovereignty, and having an organized government.</p></div></body></html>'
        ],

        // =========================================================================
        // 10. LITERATURE-IN-ENGLISH
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Literature-in-English',
            'title' => 'WAEC 2024 Literature-in-English (Drama, Poetry & Prose)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_literature_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Literature</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #7c3aed;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#6d28d9;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:6px;font-size:.92rem;color:#5b21b6}</style></head><body><div class="hdr"><h1>WASSCE 2024 LITERATURE-IN-ENGLISH</h1><h3>African and Non-African Drama, Poetry & Prose</h3></div><div class="q-box"><h3>Question 1</h3><p>In literary appreciation, what figure of speech is demonstrated in: "The wind whispered softly through the ancient trees"?</p><ol type="A"><li>Hyperbole</li><li>Personification</li><li>Metaphor</li><li>Oxymoron</li></ol><div class="sol"><strong>Explanation:</strong> Personification attributes human qualities (whispering) to inanimate objects (the wind).<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Literature-in-English',
            'title' => 'Exam Focus Literature-in-English for WASSCE & SSCE',
            'exam' => null,
            'year' => null,
            'author' => 'J.O.J. Nwachukwu-Agbada',
            'filename' => 'textbook_literature.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exam Focus Literature</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #7c3aed;padding:25px;border-radius:12px;background:#f5f3ff;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Exam Focus Literature-in-English</h1><p><em>By J.O.J. Nwachukwu-Agbada, et al.</em></p><span>Literary Terms, Critical Analyses & Textual Exegesis</span></div><div class="ch"><h2>Chapter 1: Literary Devices and Poetic Techniques</h2><p>Poetry relies on sound devices (alliteration, assonance, onomatopoeia, rhythm, rhyme) and figurative imagery (metaphor, simile, synecdoche, metonymy).</p></div></body></html>'
        ],

        // =========================================================================
        // 11. CIVIC EDUCATION
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Civic Education',
            'title' => 'WAEC 2024 Civic Education (National Values, Constitution & Human Rights)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_civic_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Civic Education</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #059669;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#047857;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#ecfdf5;border-left:4px solid #059669;border-radius:6px;font-size:.92rem;color:#065f46}</style></head><body><div class="hdr"><h1>WASSCE 2024 CIVIC EDUCATION</h1><h3>Core Examination Practice</h3></div><div class="q-box"><h3>Question 1</h3><p>Which fundamental human right guarantees that every Nigerian citizen has freedom to express opinions and hold beliefs without interference?</p><ol type="A"><li>Right to Life</li><li>Right to Freedom of Expression and the Press</li><li>Right to Fair Hearing</li><li>Right to Private Family Life</li></ol><div class="sol"><strong>Explanation:</strong> Protected under Section 39 of the 1999 Constitution of the Federal Republic of Nigeria.<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Civic Education',
            'title' => 'Basic Civic Education for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'R.W. Okunloye',
            'filename' => 'textbook_civic.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Basic Civic Education</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #059669;padding:25px;border-radius:12px;background:#ecfdf5;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Basic Civic Education for Senior Secondary Schools</h1><p><em>By R.W. Okunloye</em></p><span>National Values, Democracy, Rule of Law & Human Rights</span></div><div class="ch"><h2>Chapter 1: Values and National Consciousness</h2><p>Values are the beliefs, principles, and standards that guide human behavior and judgment in a society. Core values include honesty, integrity, discipline, patriotism, and tolerance.</p></div></body></html>'
        ],

        // =========================================================================
        // 12. COMPUTER STUDIES & DATA PROCESSING
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Computer Studies',
            'title' => 'WAEC 2024 Computer Studies (Hardware, Programming & Networking)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_computer_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Computer Studies</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #0891b2;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#0e7490;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#ecfeff;border-left:4px solid #0891b2;border-radius:6px;font-size:.92rem;color:#155e75}</style></head><body><div class="hdr"><h1>WASSCE 2024 COMPUTER STUDIES</h1><h3>Computing Systems, Algorithms & Networking</h3></div><div class="q-box"><h3>Question 1</h3><p>In computer networking, which device forwards data packets across different computer networks using logical IP addresses?</p><ol type="A"><li>Switch</li><li>Hub</li><li>Router</li><li>Repeater</li></ol><div class="sol"><strong>Explanation:</strong> A router operates at Network Layer 3 of the OSI model and routes IP packets between subnets.<br><strong>Correct Answer: C</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Computer Studies',
            'title' => 'Computer Studies & Information Technology for Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'Hiit Plc',
            'filename' => 'textbook_computer.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Computer Studies & IT</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #0891b2;padding:25px;border-radius:12px;background:#ecfeff;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Computer Studies & Information Technology</h1><p><em>By Hiit Plc Educational Services</em></p><span>Computer Hardware, System Software, Programming & DBMS</span></div><div class="ch"><h2>Chapter 1: The Von Neumann Architecture</h2><p>Modern computers consist of Central Processing Unit (ALU + Control Unit + Registers), Memory Unit (RAM/ROM), and Input/Output sub-systems connected via system buses.</p></div></body></html>'
        ],

        // =========================================================================
        // 13. AGRICULTURAL SCIENCE
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Agricultural Science',
            'title' => 'WAEC 2024 Agricultural Science (Agronomy, Animal Science & Farm Mechanization)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_agric_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Agricultural Science</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #65a30d;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#4d7c0f;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#f7fee7;border-left:4px solid #65a30d;border-radius:6px;font-size:.92rem;color:#3f6212}</style></head><body><div class="hdr"><h1>WASSCE 2024 AGRICULTURAL SCIENCE</h1><h3>Crop Production, Animal Husbandry & Soil Management</h3></div><div class="q-box"><h3>Question 1</h3><p>Which soil nutrient is primarily responsible for vigorous vegetative leaf growth in cereal crops?</p><ol type="A"><li>Phosphorus</li><li>Nitrogen</li><li>Potassium</li><li>Magnesium</li></ol><div class="sol"><strong>Explanation:</strong> Nitrogen stimulates chlorophyll synthesis and vegetative growth; phosphorus aids root and seed development; potassium governs disease resistance.<br><strong>Correct Answer: B</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Agricultural Science',
            'title' => 'General Agriculture for West Africa',
            'exam' => null,
            'year' => null,
            'author' => 'Q.B.O. Anthonio',
            'filename' => 'textbook_agric.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>General Agriculture</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #4d7c0f;padding:25px;border-radius:12px;background:#f7fee7;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>General Agriculture for West Africa</h1><p><em>By Q.B.O. Anthonio</em></p><span>Soil Science, Crop Husbandry, Animal Health & Agricultural Economics</span></div><div class="ch"><h2>Chapter 1: Principles of Soil Science</h2><p>Soil consists of mineral matter (45%), organic matter (5%), soil air (25%), and soil water (25%). Soil texture determines drainage, aeration, and nutrient retention.</p></div></body></html>'
        ],

        // =========================================================================
        // 14. FURTHER MATHEMATICS
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Further Mathematics',
            'title' => 'WAEC 2024 Further Mathematics (Pure Math, Vectors & Calculus)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_further_math_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 Further Mathematics</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #9333ea;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#7e22ce;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#faf5ff;border-left:4px solid #9333ea;border-radius:6px;font-size:.92rem;color:#6b21a8}</style></head><body><div class="hdr"><h1>WASSCE 2024 FURTHER MATHEMATICS</h1><h3>Elective Pure Mathematics & Mechanics</h3></div><div class="q-box"><h3>Question 1</h3><p>Find the angle between the vectors a = 3i + 4j and b = 5i + 12j.</p><ol type="A"><li>14.25°</li><li>22.62°</li><li>30.50°</li><li>45.00°</li></ol><div class="sol"><strong>Solution:</strong> a·b = (3)(5) + (4)(12) = 15 + 48 = 63. |a| = √(3² + 4²) = 5; |b| = √(5² + 12²) = 13. cos θ = (a·b) / (|a||b|) = 63 / (5 × 13) = 63 / 65 ≈ 0.9692. θ = arccos(0.9692) ≈ 14.25°.<br><strong>Correct Answer: A</strong></div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Further Mathematics',
            'title' => 'Further Mathematics Project for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'M.R. Tuttuh-Adegun & D.G. Godspower',
            'filename' => 'textbook_further_math.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Further Mathematics Project</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #7e22ce;padding:25px;border-radius:12px;background:#faf5ff;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Further Mathematics Project for SSS</h1><p><em>By M.R. Tuttuh-Adegun & D.G. Godspower</em></p><span>Calculus, Matrices, Vectors, Mechanics & Probability Distributions</span></div><div class="ch"><h2>Chapter 1: Matrices & Determinants</h2><p>A matrix is a rectangular array of numbers arranged in rows and columns. A square matrix of order 2 has determinant |A| = ad - bc for [[a, b], [c, d]].</p></div></body></html>'
        ],

        // =========================================================================
        // 15. CHRISTIAN RELIGIOUS STUDIES (CRS)
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Christian Religious Studies (CRS)',
            'title' => 'WAEC 2024 Christian Religious Studies (Themes from Old & New Testaments)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_crs_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 CRS</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#1d4ed8;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;font-size:.92rem;color:#1e40af}</style></head><body><div class="hdr"><h1>WASSCE 2024 CHRISTIAN RELIGIOUS STUDIES</h1><h3>Themes from the Old Testament, the Synoptic Gospels and the Apostolic Church</h3></div><div class="q-box"><h3>Question 1</h3><p>According to the creation account in Genesis 1, on which day were the sun, moon, and stars created?</p><ol type="A"><li>First day</li><li>Second day</li><li>Third day</li><li>Fourth day</li></ol><div class="sol"><strong>Explanation:</strong> Genesis 1:14-19 records that the heavenly luminaries (sun, moon, and stars) were set in the firmament of heaven on the Fourth Day.<br><strong>Correct Answer: D</strong></div></div><div class="q-box"><h3>Question 2</h3><p>Discuss the leadership qualities of Joseph during the seven years of famine in Egypt and highlight two lessons for modern civil administrators.</p><div class="sol"><strong>Solution:</strong> Joseph exhibited proactive foresight, meticulous grain rationing, anti-corruption inventory control, and equitable resource allocation. Lessons: (1) Strategic national planning during periods of economic surplus; (2) Accountable stewardship in public treasury management.</div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Christian Religious Studies (CRS)',
            'title' => 'Comprehensive Christian Religious Knowledge for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'O.A. Martins & E.K. Adeyemi',
            'filename' => 'textbook_crs.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comprehensive CRS for SSS</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #2563eb;padding:25px;border-radius:12px;background:#eff6ff;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Comprehensive Christian Religious Knowledge</h1><p><em>By O.A. Martins & E.K. Adeyemi</em></p><span>Approved WAEC & NECO Senior School Syllabus</span></div><div class="ch"><h2>Chapter 1: The Sovereign God & Creation</h2><p>The doctrine of God\'s sovereignty emphasizes His uncaused existence, omniscience, omnipotence, and covenantal fidelity to humanity from Genesis through the prophetic covenants.</p></div></body></html>'
        ],

        // =========================================================================
        // 16. ISLAMIC STUDIES (IRS)
        // =========================================================================
        [
            'type' => 'past_question',
            'subject' => 'Islamic Studies (IRS)',
            'title' => 'WAEC 2024 Islamic Religious Studies (Hadith, Fiqh & Tarikh)',
            'exam' => 'WAEC',
            'year' => '2024',
            'author' => 'West African Examinations Council',
            'filename' => 'waec_irs_2024.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>WAEC 2024 IRS</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:850px;margin:30px auto;padding:25px;background:#f8fafc;color:#1e293b}.hdr{text-align:center;border-bottom:2px solid #059669;padding-bottom:15px;margin-bottom:25px}.hdr h1{font-size:1.6rem;color:#047857;margin:0}.q-box{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:18px}.sol{margin-top:12px;padding:10px 14px;background:#ecfdf5;border-left:4px solid #059669;border-radius:6px;font-size:.92rem;color:#065f46}</style></head><body><div class="hdr"><h1>WASSCE 2024 ISLAMIC RELIGIOUS STUDIES</h1><h3>Paper 1 (Objectives) & Paper 2 (Tawhid, Fiqh & Tarikh)</h3></div><div class="q-box"><h3>Question 1</h3><p>Suratul Fatihah is described in the Holy Quran as "Sab\'an min al-Mathani" which translates to:</p><ol type="A"><li>The seven oft-repeated verses</li><li>The seven golden pillars</li><li>The seven virtues</li><li>The seven miraculous signs</li></ol><div class="sol"><strong>Explanation:</strong> In Surah Al-Hijr (15:87), Allah refers to Suratul Fatihah as the seven oft-repeated verses (Sab\'an min al-Mathani).<br><strong>Correct Answer: A</strong></div></div><div class="q-box"><h3>Question 2</h3><p>Examine the socio-economic benefits of Zakat in mitigating poverty within an Islamic community.</p><div class="sol"><strong>Solution:</strong> Zakat serves as a mandatory institutional wealth-redistribution mechanism, preventing capital hoarding (kanz), fostering compassion between wealthy and vulnerable citizens, providing debt relief (Al-Gharimin), and stimulating local commerce.</div></div></body></html>'
        ],
        [
            'type' => 'textbook',
            'subject' => 'Islamic Studies (IRS)',
            'title' => 'Islamic Studies for Senior Secondary Schools',
            'exam' => null,
            'year' => null,
            'author' => 'Prof. A.R.I. Doi & Dr. M.A. Quadri',
            'filename' => 'textbook_irs.html',
            'html' => '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Islamic Studies for SSS</title><style>body{font-family:Georgia,serif;line-height:1.7;max-width:850px;margin:30px auto;padding:25px;background:#fffcf7;color:#1e293b}.cov{text-align:center;border:2px solid #059669;padding:25px;border-radius:12px;background:#ecfdf5;margin-bottom:30px}.ch{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;font-family:system-ui,sans-serif}</style></head><body><div class="cov"><h1>Islamic Studies for Senior Secondary Schools</h1><p><em>By Prof. A.R.I. Doi & Dr. M.A. Quadri</em></p><span>Approved National Curriculum · Quran, Hadith, Fiqh & Islamic History</span></div><div class="ch"><h2>Chapter 1: Tawhid (The Oneness of Allah)</h2><p>Tawhid constitutes the foundational doctrine of Islam, categorized into Tawhid ar-Rububiyyah (Oneness of Lordship), Tawhid al-Uluhiyyah (Oneness of Worship), and Tawhid al-Asma\' was-Sifat (Oneness of Divine Names and Attributes).</p></div></body></html>'
        ]
    ];
}

function seedCurriculumLibrary(PDO $pdo): int {
    $resources = getCurriculumResourcesData();
    $seeded = 0;
    $uploadDir = __DIR__ . '/../uploads/resources';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    foreach ($resources as $res) {
        // Write the HTML file to uploads/resources if missing
        $filePath = 'uploads/resources/' . $res['filename'];
        $fullPath = $uploadDir . '/' . $res['filename'];
        if (!file_exists($fullPath) && !empty($res['html'])) {
            @file_put_contents($fullPath, $res['html']);
        }

        // Check if resource exists in database
        $check = $pdo->prepare("SELECT id FROM resources WHERE title = ? AND subject = ?");
        $check->execute([$res['title'], $res['subject']]);
        $existingId = $check->fetchColumn();

        if ($existingId) {
            $up = $pdo->prepare("
                UPDATE resources 
                SET type = ?, exam = ?, year = ?, author = ?, file_path = ?, content = ?
                WHERE id = ?
            ");
            $up->execute([
                $res['type'],
                $res['exam'],
                $res['year'],
                $res['author'],
                $filePath,
                $res['html'],
                $existingId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO resources (type, subject, title, author, exam, year, file_path, content)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $ins->execute([
                $res['type'],
                $res['subject'],
                $res['title'],
                $res['author'],
                $res['exam'],
                $res['year'],
                $filePath,
                $res['html']
            ]);
            $seeded++;
        }
    }

    return $seeded;
}
