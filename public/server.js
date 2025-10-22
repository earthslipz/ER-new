// =========================
// 🔹 TRIAGE LOGIC ENGINE 🔹
// =========================
function calculateTriage(patient) {
    const { heart_rate_bpm, systolic_bp, temp_c, spo2_percent, resp_rate_min, pain_score } = patient.vital;
    const { symptoms, date_of_birth, sex } = patient;
  
    let HR_score = 0, BP_score = 0, Temp_score = 0, O2_score = 0, RR_score = 0, Pain_score = 0;
  
    // ---- HEART RATE (bpm)
    if (heart_rate_bpm <= 0) HR_score = 5;
    else if (heart_rate_bpm <= 20 || heart_rate_bpm > 150) HR_score = 4;
    else if ((heart_rate_bpm > 130 && heart_rate_bpm <= 150) || (heart_rate_bpm >= 21 && heart_rate_bpm <= 30)) HR_score = 3;
    else if (heart_rate_bpm >= 111 && heart_rate_bpm <= 130) HR_score = 2;
    else if (heart_rate_bpm >= 91 && heart_rate_bpm <= 110) HR_score = 1;
    else HR_score = 0;
  
    // ---- BLOOD PRESSURE (systolic)
    if (systolic_bp <= 0) BP_score = 5;
    else if (systolic_bp < 70) BP_score = 4;
    else if (systolic_bp < 80 || systolic_bp >= 180) BP_score = 3;
    else if (systolic_bp < 90 || systolic_bp >= 160) BP_score = 2;
    else if (systolic_bp < 100 || systolic_bp >= 140) BP_score = 1;
    else BP_score = 0;
  
    // ---- TEMPERATURE (°C)
    if (temp_c >= 41.0 || temp_c < 33.0) Temp_score = 5;
    else if (temp_c > 40.0 || temp_c < 34.0) Temp_score = 4;
    else if (temp_c > 39.0 || temp_c < 35.0) Temp_score = 3;
    else if (temp_c > 38.0 || temp_c < 36.0) Temp_score = 2;
    else if (temp_c > 37.4 || temp_c < 36.1) Temp_score = 1;
    else Temp_score = 0;
  
    // ---- OXYGEN SATURATION (%)
    if (spo2_percent < 85) O2_score = 5;
    else if (spo2_percent < 90) O2_score = 4;
    else if (spo2_percent < 92) O2_score = 3;
    else if (spo2_percent < 94) O2_score = 2;
    else if (spo2_percent < 96) O2_score = 1;
    else O2_score = 0;
  
    // ---- RESPIRATORY RATE (/min)
    if (resp_rate_min <= 0) RR_score = 5;
    else if (resp_rate_min >= 35 || resp_rate_min <= 6) RR_score = 4;
    else if (resp_rate_min >= 30 || resp_rate_min <= 7) RR_score = 3;
    else if (resp_rate_min >= 25 || resp_rate_min <= 9) RR_score = 2;
    else if (resp_rate_min >= 21 || resp_rate_min <= 11) RR_score = 1;
    else RR_score = 0;
  
    // ---- PAIN SCORE (1–10)
    if (pain_score >= 10) Pain_score = 5;
    else if (pain_score >= 9) Pain_score = 4;
    else if (pain_score >= 7) Pain_score = 3;
    else if (pain_score >= 5) Pain_score = 2;
    else if (pain_score >= 3) Pain_score = 1;
    else Pain_score = 0;
  
    // ---- WEIGHTED SCORE ----
    const weighted_total = (
      HR_score * 1.5 +
      BP_score * 1.8 +
      Temp_score * 1.0 +
      O2_score * 2.0 +
      RR_score * 1.5 +
      Pain_score * 0.8
    );
  
    // ---- Determine Base Urgency ----
    let triage = "BLUE";
    let priority = 5;
    let reasoning = [];
  
    if (weighted_total > 20) { triage = "RED"; priority = 1; reasoning.push("Critical weighted score > 20"); }
    else if (weighted_total >= 16) { triage = "ORANGE"; priority = 2; reasoning.push("Severe physiological derangement"); }
    else if (weighted_total >= 11) { triage = "YELLOW"; priority = 3; reasoning.push("Moderate vital deviation"); }
    else if (weighted_total >= 6) { triage = "GREEN"; priority = 4; reasoning.push("Mild abnormalities"); }
    else { triage = "BLUE"; priority = 5; reasoning.push("Stable vital signs"); }
  
    // ---- STEP 2: Special Populations ----
    const age = date_of_birth ? Math.floor((Date.now() - new Date(date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    const symptomLower = symptoms.toLowerCase();
  
    if (age !== null && age < 0) reasoning.push("Invalid DOB");
  
    if (age < 0.25 && temp_c >= 38) { triage = "YELLOW"; priority = Math.min(priority, 3); reasoning.push("Infant <3 months with fever"); }
    if (sex === "Female" && symptomLower.includes("pregnan")) {
      if (symptomLower.includes("bleed")) { triage = "RED"; priority = 1; reasoning.push("Pregnancy with bleeding"); }
      else if (symptomLower.includes("abdominal")) { triage = "YELLOW"; priority = Math.min(priority, 3); reasoning.push("Pregnancy with abdominal pain"); }
      else if (symptomLower.includes("fetal") && symptomLower.includes("movement")) { triage = "YELLOW"; reasoning.push("Decreased fetal movement"); }
    }
    if (age >= 65 && symptomLower.includes("confusion")) { triage = "YELLOW"; reasoning.push("Elderly with confusion"); }
    if (symptomLower.includes("immuno") && symptomLower.includes("fever")) { triage = "YELLOW"; reasoning.push("Immunocompromised with fever"); }
  
    // ---- Return Final Output ----
    return { triage, priority, weighted_total, reasoning: reasoning.join("; ") };
  }
  