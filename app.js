// ==================================================
// 🧠 ER TRIAGE SYSTEM (Render Deploy Ready)
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
app.use(express.static(path.join(__dirname, "public"))); // serve static files

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
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("➡️ Check if MySQL is running and DB credentials are correct.");
  } else {
    console.log("✅ Connected to MySQL Database successfully!");
    conn.release();
  }
});

// ==================================================
// ⚖️ TRIAGE SCORING LOGIC
// ==================================================
function calculateTriage(vital, symptoms = "", age = 30, sex = "", indicator = "") {
  const v = {
    heart_rate_bpm: parseFloat(vital.heart_rate_bpm) || 0,
    systolic_bp: parseFloat(vital.systolic_bp) || 0,
    temp_c: parseFloat(vital.temp_c) || 0,
    spo2_percent: parseFloat(vital.spo2_percent) || 0,
    resp_rate_min: parseFloat(vital.resp_rate_min) || 0,
    pain_score: parseFloat(vital.pain_score) || 0,
  };

  let score = 0;
  const reasons = [];

  // HR
  if (v.heart_rate_bpm > 150 || v.heart_rate_bpm <= 20) score += 4 * 1.5;
  else if (v.heart_rate_bpm > 130 || v.heart_rate_bpm <= 30) score += 3 * 1.5;
  else if (v.heart_rate_bpm > 110 || v.heart_rate_bpm <= 40) score += 2 * 1.5;
  else if (v.heart_rate_bpm > 90 || v.heart_rate_bpm <= 50) score += 1 * 1.5;

  // BP
  if (v.systolic_bp < 70) score += 4 * 1.8;
  else if (v.systolic_bp < 80 || v.systolic_bp >= 180) score += 3 * 1.8;
  else if (v.systolic_bp < 90 || v.systolic_bp >= 160) score += 2 * 1.8;
  else if (v.systolic_bp < 100 || v.systolic_bp >= 140) score += 1 * 1.8;

  // Temp
  if (v.temp_c > 40.0 || v.temp_c < 34.0) score += 4;
  else if (v.temp_c > 39.0 || v.temp_c < 35.0) score += 3;
  else if (v.temp_c > 38.0 || v.temp_c < 36.0) score += 2;
  else if (v.temp_c > 37.5) score += 1;

  // SpO2
  if (v.spo2_percent < 85) score += 5 * 2.0;
  else if (v.spo2_percent < 90) score += 4 * 2.0;
  else if (v.spo2_percent < 92) score += 3 * 2.0;
  else if (v.spo2_percent < 94) score += 2 * 2.0;
  else if (v.spo2_percent < 96) score += 1 * 2.0;

  // RR
  if (v.resp_rate_min >= 35 || v.resp_rate_min <= 6) score += 4 * 1.5;
  else if (v.resp_rate_min >= 30 || v.resp_rate_min <= 7) score += 3 * 1.5;
  else if (v.resp_rate_min >= 25 || v.resp_rate_min <= 9) score += 2 * 1.5;
  else if (v.resp_rate_min >= 21 || v.resp_rate_min <= 11) score += 1 * 1.5;

  // Pain
  if (v.pain_score >= 10) score += 5 * 0.8;
  else if (v.pain_score >= 9) score += 4 * 0.8;
  else if (v.pain_score >= 7) score += 3 * 0.8;
  else if (v.pain_score >= 5) score += 2 * 0.8;
  else if (v.pain_score >= 3) score += 1 * 0.8;

  // Classification
  let triage = "BLUE";
  if (score > 20) triage = "RED";
  else if (score > 15) triage = "ORANGE";
  else if (score > 10) triage = "YELLOW";
  else if (score > 3) triage = "GREEN";

  reasons.push(
    triage === "RED"
      ? "Critical vital instability"
      : triage === "ORANGE"
      ? "Severe abnormal vitals"
      : triage === "YELLOW"
      ? "Moderate deviation"
      : triage === "GREEN"
      ? "Stable but symptomatic"
      : "Normal condition"
  );

  return { triage, score: Number(score.toFixed(2)), reasoning: reasons };
}

// ==================================================
// 🔹 ROUTES
// ==================================================
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "Dashboard.html"))
);
app.get("/form", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "form.html"))
);

// 🧠 Get all patients
app.get("/patients", (req, res) => {
  console.log("📥 [GET] /patients called");

  const sql = `
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
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL Error in /patients:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ [OK] Returned ${results.length} patients`);
    res.json(results);
  });
});

// 🏥 Add new patient
app.post("/patients", (req, res) => {
  console.log("📩 [POST] /patients body:", req.body);

  const { national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, vital } =
    req.body;
  if (!first_name || !last_name) {
    console.warn("⚠️ Missing patient name");
    return res.status(400).json({ error: "Missing patient name" });
  }

  const age = date_of_birth
    ? new Date().getFullYear() - new Date(date_of_birth).getFullYear()
    : 30;
  const { triage, score, reasoning } = calculateTriage(
    vital,
    symptoms,
    age,
    sex,
    indicator
  );

  console.log(`🩺 TRIAGE CALC → Level=${triage}, Score=${score}`);

  connection.query(
    "INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      national_id,
      first_name,
      last_name,
      sex,
      date_of_birth,
      indicator,
      symptoms,
      triage,
      score,
      reasoning.join("; "),
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Insert Patient Error:", err);
        return res.status(500).json({ error: err.message });
      }

      const patientId = result.insertId;
      const {
        heart_rate_bpm,
        resp_rate_min,
        systolic_bp,
        diastolic_bp,
        temp_c,
        spo2_percent,
        gcs_total,
        pain_score,
      } = vital || {};

      connection.query(
        "INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          patientId,
          heart_rate_bpm,
          resp_rate_min,
          systolic_bp,
          diastolic_bp,
          temp_c,
          spo2_percent,
          gcs_total,
          pain_score,
        ],
        (vitalErr) => {
          if (vitalErr) {
            console.error("❌ Insert VitalSigns Error:", vitalErr);
            return res.status(500).json({ error: vitalErr.message });
          }

          console.log(`✅ [INSERT OK] Patient ${patientId} (${triage}, Score ${score})`);
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
  console.log("🧹 [DELETE] /clear-db called");

  connection.query("DELETE FROM VitalSigns", (err1) => {
    if (err1) {
      console.error("❌ Failed to clear VitalSigns:", err1.message);
      return res.status(500).json({ error: err1.message });
    }

    connection.query("DELETE FROM Patient", (err2) => {
      if (err2) {
        console.error("❌ Failed to clear Patient:", err2.message);
        return res.status(500).json({ error: err2.message });
      }

      connection.query("ALTER TABLE VitalSigns AUTO_INCREMENT = 1", (err3) => {
        if (err3) console.warn("⚠️ Failed to reset VitalSigns ID:", err3.message);

        connection.query("ALTER TABLE Patient AUTO_INCREMENT = 1", (err4) => {
          if (err4) console.warn("⚠️ Failed to reset Patient ID:", err4.message);

          console.log("✅ Database cleared and IDs reset successfully.");
          res.json({ message: "Database cleared successfully. IDs reset to 1." });
        });
      });
    });
  });
});

// 🧩 Debug endpoint
app.get("/debug/db", (req, res) => {
  connection.query("SHOW COLUMNS FROM Patient", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log("🔍 [DEBUG] Patient Columns:", results.map((r) => r.Field));
    res.json(results);
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
