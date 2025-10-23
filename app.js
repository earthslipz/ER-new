// ==================================================
// 🧠 ER TRIAGE SYSTEM (Render Deploy Ready + Rule-based + No ORANGE + Debug Log)
// ==================================================
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// ==================================================
// 🗄️ Database Connection
// ==================================================
const connection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  port: process.env.DB_PORT || 3306,
  password: process.env.DB_PASS || "admin@1234",
  database: process.env.DB_NAME || "triager_system2",
});

connection.getConnection((err, conn) => {
  if (err) console.error("❌ Database connection failed:", err.message);
  else {
    console.log("✅ Connected to MySQL Database successfully!");
    conn.release();
  }
});

// ==================================================
// ⚖️ TRIAGE SCORING + RULE-BASED + GCS Override (NO ORANGE)
// ==================================================
function calculateTriage(vital, symptoms = "", age = 30, sex = "", indicator = "") {
  const v = {
    heart_rate_bpm: parseFloat(vital.heart_rate_bpm) || 0,
    systolic_bp: parseFloat(vital.systolic_bp) || 0,
    temp_c: parseFloat(vital.temp_c) || 0,
    spo2_percent: parseFloat(vital.spo2_percent) || 0,
    resp_rate_min: parseFloat(vital.resp_rate_min) || 0,
    pain_score: parseFloat(vital.pain_score) || 0,
    gcs_total: parseFloat(vital.gcs_total),
  };

  let score = 0;
  const reasons = [];

  // ==================================================
  // 🧮 1. คำนวณคะแนนพื้นฐาน
  // ==================================================
  if (v.heart_rate_bpm > 150 || v.heart_rate_bpm <= 20) score += 4 * 1.5;
  else if (v.heart_rate_bpm > 130 || v.heart_rate_bpm <= 30) score += 3 * 1.5;
  else if (v.heart_rate_bpm > 110 || v.heart_rate_bpm <= 40) score += 2 * 1.5;
  else if (v.heart_rate_bpm > 90 || v.heart_rate_bpm <= 50) score += 1 * 1.5;

  if (v.systolic_bp < 70) score += 4 * 1.8;
  else if (v.systolic_bp < 80 || v.systolic_bp >= 180) score += 3 * 1.8;
  else if (v.systolic_bp < 90 || v.systolic_bp >= 160) score += 2 * 1.8;
  else if (v.systolic_bp < 100 || v.systolic_bp >= 140) score += 1 * 1.8;

  if (v.temp_c > 40.0 || v.temp_c < 34.0) score += 4;
  else if (v.temp_c > 39.0 || v.temp_c < 35.0) score += 3;
  else if (v.temp_c > 38.0 || v.temp_c < 36.0) score += 2;
  else if (v.temp_c > 37.5) score += 1;

  if (v.spo2_percent < 85) score += 5 * 2.0;
  else if (v.spo2_percent < 90) score += 4 * 2.0;
  else if (v.spo2_percent < 92) score += 3 * 2.0;
  else if (v.spo2_percent < 94) score += 2 * 2.0;
  else if (v.spo2_percent < 96) score += 1 * 2.0;

  if (v.resp_rate_min >= 35 || v.resp_rate_min <= 6) score += 4 * 1.5;
  else if (v.resp_rate_min >= 30 || v.resp_rate_min <= 7) score += 3 * 1.5;
  else if (v.resp_rate_min >= 25 || v.resp_rate_min <= 9) score += 2 * 1.5;
  else if (v.resp_rate_min >= 21 || v.resp_rate_min <= 11) score += 1 * 1.5;

  if (v.pain_score >= 10) score += 5 * 0.8;
  else if (v.pain_score >= 9) score += 4 * 0.8;
  else if (v.pain_score >= 7) score += 3 * 0.8;
  else if (v.pain_score >= 5) score += 2 * 0.8;
  else if (v.pain_score >= 3) score += 1 * 0.8;

  // ==================================================
  // 🧠 2. GCS Override
  // ==================================================
  if (!isNaN(v.gcs_total)) {
    if (v.gcs_total <= 8) {
      console.log(`🧠 GCS override → RED (GCS=${v.gcs_total})`);
      return { triage: "RED", score, reasoning: ["Severely altered consciousness (GCS ≤ 8)"] };
    } else if (v.gcs_total >= 9 && v.gcs_total <= 12) {
      console.log(`🧠 GCS override → YELLOW (GCS=${v.gcs_total})`);
      return { triage: "YELLOW", score, reasoning: ["Moderately altered consciousness (GCS 9–12)"] };
    }
  }

  // ==================================================
  // 🎨 3. Rule-based สี
  // ==================================================
  const sym = (symptoms || "").toLowerCase();
  let triage = "BLUE";

  if (
    v.spo2_percent < 90 ||
    v.systolic_bp < 90 ||
    v.resp_rate_min < 10 || v.resp_rate_min > 30 ||
    v.heart_rate_bpm < 40 || v.heart_rate_bpm > 140 ||
    sym.includes("severe chest pain")
  ) {
    triage = "RED";
    reasons.push("Critical vital instability");
  } 
  else if (
    (v.systolic_bp >= 90 && v.systolic_bp <= 100) ||
    (v.spo2_percent >= 90 && v.spo2_percent <= 93) ||
    (v.temp_c > 39.5) ||
    (v.resp_rate_min >= 25 && v.resp_rate_min <= 29) ||
    (v.heart_rate_bpm >= 110 && v.heart_rate_bpm <= 139) ||
    (v.pain_score >= 7) ||
    sym.includes("chest pain") ||
    sym.includes("trauma")
  ) {
    triage = "YELLOW";
    reasons.push("Urgent condition (moderate to severe deviation)");
  } 
  else if (
    (v.temp_c >= 38.5 && v.temp_c <= 39.4) ||
    (v.pain_score >= 5 && v.pain_score <= 6) ||
    (v.spo2_percent >= 94 && v.spo2_percent <= 95)
  ) {
    triage = "GREEN";
    reasons.push("Stable but symptomatic");
  } 
  else {
    triage = "BLUE";
    reasons.push("Normal condition");
  }

  console.log(`🩺 TRIAGE → ${triage} | Score=${score.toFixed(2)} | SpO2=${v.spo2_percent}, RR=${v.resp_rate_min}, HR=${v.heart_rate_bpm}, Pain=${v.pain_score}, GCS=${v.gcs_total}`);

  return { triage, score: Number(score.toFixed(2)), reasoning: reasons };
}

// ==================================================
// 🔹 ROUTES
// ==================================================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "Dashboard.html")));
app.get("/form", (req, res) => res.sendFile(path.join(__dirname, "public", "form.html")));

// 🧠 Get all patients
app.get("/patients", (req, res) => {
  connection.query(`
    SELECT 
      p.patient_id, 
      CONCAT(p.first_name, ' ', p.last_name) AS full_name,
      p.sex, p.indicator, p.symptoms,
      p.triage_level, p.triage_score, p.triage_reason,
      vs.heart_rate_bpm, vs.resp_rate_min,
      CONCAT(vs.systolic_bp, '/', vs.diastolic_bp) AS bp,
      vs.temp_c, vs.spo2_percent, vs.gcs_total, vs.pain_score
    FROM Patient p
    JOIN VitalSigns vs ON p.patient_id = vs.patient_id
    ORDER BY p.triage_score DESC;
  `, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🏥 Add new patient
app.post("/patients", (req, res) => {
  const { national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, vital } = req.body;
  if (!first_name || !last_name)
    return res.status(400).json({ error: "Missing patient name" });

  const age = date_of_birth ? new Date().getFullYear() - new Date(date_of_birth).getFullYear() : 30;
  const { triage, score, reasoning } = calculateTriage(vital, symptoms, age, sex, indicator);

  connection.query(
    "INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage, score, reasoning.join('; ')],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const patientId = result.insertId;
      const { heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score } = vital || {};

      connection.query(
        "INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [patientId, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score],
        (vitalErr) => {
          if (vitalErr) return res.status(500).json({ error: vitalErr.message });

          res.status(201).json({
            message: "✅ Patient added successfully",
            patient_id: patientId,
            triage,
            score,
            reasoning,
          });
        }
      );
    }
  );
});

// 🧹 Clear all patient data
app.delete("/clear-db", (req, res) => {
  connection.query("DELETE FROM VitalSigns", (err1) => {
    if (err1) return res.status(500).json({ error: err1.message });
    connection.query("DELETE FROM Patient", (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      connection.query("ALTER TABLE VitalSigns AUTO_INCREMENT = 1");
      connection.query("ALTER TABLE Patient AUTO_INCREMENT = 1");
      res.json({ message: "Database cleared successfully. IDs reset to 1." });
    });
  });
});

// ==================================================
// 🚀 Start server
// ==================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
