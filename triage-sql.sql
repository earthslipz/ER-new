DROP DATABASE IF EXISTS triager_system;
CREATE DATABASE triager_system;

USE triager_system;

-- ==================================================
-- สร้างตาราง
-- ==================================================

CREATE TABLE IF NOT EXISTS EmergencyIndicator (
  indicator_id 	INT AUTO_INCREMENT,
  indicator  	VARCHAR(50) UNIQUE NOT NULL,
  CONSTRAINT PK_EmergencyIndicator PRIMARY KEY (indicator_id)
);

CREATE TABLE IF NOT EXISTS PatientStatus (
  status_id  	INT AUTO_INCREMENT,
  status_name	VARCHAR(50) UNIQUE NOT NULL,
  CONSTRAINT PK_PatientStatus PRIMARY KEY (status_id)
);

CREATE TABLE IF NOT EXISTS TriageLevel (
  triage_level_id	INT PRIMARY KEY AUTO_INCREMENT,
  c_code            VARCHAR(10) UNIQUE NOT NULL,
  display_name		VARCHAR(50) NOT NULL,
  priority_rank		INT NOT NULL
);

CREATE TABLE IF NOT EXISTS Patient (
  patient_id    	INT AUTO_INCREMENT,
  national_id		NVARCHAR(15),
  first_name    	NVARCHAR(100) NOT NULL,
  last_name     	NVARCHAR(100) NOT NULL,
  sex           	VARCHAR(10),
  date_of_birth 	DATE,
  indicator			VARCHAR(50),
  symptoms      	TEXT,
  triage_level		VARCHAR(10),
  triage_score		DECIMAL(5,2),
  triage_reason		TEXT,
  status_name		VARCHAR(50) DEFAULT 'Waiting',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT PK_Patient PRIMARY KEY (patient_id),
  CONSTRAINT FK_Patient_Indicator FOREIGN KEY (indicator) REFERENCES EmergencyIndicator (indicator) ON DELETE SET NULL,
  CONSTRAINT FK_Patient_Status FOREIGN KEY (status_name) REFERENCES PatientStatus (status_name),
  CONSTRAINT FK_Patient_Triage FOREIGN KEY (triage_level) REFERENCES TriageLevel (c_code)
);

CREATE TABLE IF NOT EXISTS VitalSigns (
  patient_id		INT UNIQUE NOT NULL,
  heart_rate_bpm	INT,
  resp_rate_min		INT,
  systolic_bp		INT,
  diastolic_bp		INT,
  temp_c			DECIMAL(4,1),
  spo2_percent		INT,
  gcs_total			INT,
  pain_score		INT,
  CONSTRAINT FK_VitalSigns FOREIGN KEY (patient_id) REFERENCES Patient (patient_id)
);

CREATE TABLE IF NOT EXISTS StatusLog (
  statuslog_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  status_name VARCHAR(50) NOT NULL,
  statuslog_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_StatusLog_Patient FOREIGN KEY (patient_id) REFERENCES Patient (patient_id),
  CONSTRAINT FK_StatusLog_Status FOREIGN KEY (status_name) REFERENCES PatientStatus (status_name)
);

CREATE TABLE IF NOT EXISTS ColorLog (
  colorlog_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  triage_level VARCHAR(10) NOT NULL,
  colorlog_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_ColorLog_Patient FOREIGN KEY (patient_id) REFERENCES Patient (patient_id),
  CONSTRAINT FK_ColorLog_Level FOREIGN KEY (triage_level) REFERENCES TriageLevel (c_code)
);

-- ==================================================
-- เพิ่มข้อมูล Master Data
-- ==================================================

INSERT INTO EmergencyIndicator (indicator_id, indicator) VALUES
(1, 'Unconscious'),
(2, 'Bleeding'),
(3, 'Breathing Difficulty'),
(4, 'Chest Pain'),
(5, 'Seizure'),
(6, 'Trauma'),
(7, 'None');

INSERT INTO PatientStatus (status_id, status_name) VALUES
(1, 'Waiting'),
(2, 'Under Treatment'),
(3, 'Transferred'),
(4, 'Discharged'),
(5, 'Deceased');

INSERT INTO TriageLevel (c_code, display_name, priority_rank) VALUES
('RED', 'Immediate', 1),
('ORANGE', 'Very Urgent', 2),
('YELLOW', 'Urgent', 3),
('GREEN', 'Standard', 4),
('BLUE', 'Non-Urgent', 5);

-- ==================================================
-- เพิ่มข้อมูลผู้ป่วยตัวอย่าง
-- ==================================================

-- Patient 1: RED (Critical) - Waiting
INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason, status_name)
VALUES ('100000000001', 'Somying', 'Critical', 'Female', '1990-05-14', 'Breathing Difficulty', 'Severe shortness of breath', 'RED', 25.5, 'SpO₂ < 85% and respiratory distress', 'Waiting');

INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score)
VALUES (LAST_INSERT_ID(), 145, 35, 85, 60, 40.0, 84, 12, 8);

INSERT INTO StatusLog (patient_id, status_name) VALUES (1, 'Waiting');
INSERT INTO ColorLog (patient_id, triage_level) VALUES (1, 'RED');

-- Patient 2: ORANGE (Very Urgent) - Under Treatment
INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason, status_name)
VALUES ('100000000002', 'Anan', 'Urgent', 'Male', '1988-03-22', 'Chest Pain', 'Severe chest pain', 'ORANGE', 18.2, 'Severe pain + HR > 130', 'Under Treatment');

INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score)
VALUES (LAST_INSERT_ID(), 132, 28, 100, 75, 39.0, 92, 14, 9);

INSERT INTO StatusLog (patient_id, status_name) VALUES (2, 'Waiting');
INSERT INTO StatusLog (patient_id, status_name) VALUES (2, 'Under Treatment');
INSERT INTO ColorLog (patient_id, triage_level) VALUES (2, 'ORANGE');

-- Patient 3: YELLOW (Urgent) - Waiting
INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason, status_name)
VALUES ('100000000003', 'Nattaya', 'Prom', 'Female', '2001-06-08', 'Trauma', 'Headache with mild fever', 'YELLOW', 12.8, 'Mild abnormal vital + fever', 'Waiting');

INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score)
VALUES (LAST_INSERT_ID(), 110, 24, 95, 70, 39.3, 93, 15, 5);

INSERT INTO StatusLog (patient_id, status_name) VALUES (3, 'Waiting');
INSERT INTO ColorLog (patient_id, triage_level) VALUES (3, 'YELLOW');

-- Patient 4: GREEN (Stable) - Discharged
INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason, status_name)
VALUES ('100000000004', 'Somchai', 'Za', 'Male', '1978-11-02', 'None', 'Mild headache', 'GREEN', 7.5, 'Stable but symptomatic', 'Discharged');

INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score)
VALUES (LAST_INSERT_ID(), 78, 16, 120, 80, 36.8, 98, 15, 3);

INSERT INTO StatusLog (patient_id, status_name) VALUES (4, 'Waiting');
INSERT INTO StatusLog (patient_id, status_name) VALUES (4, 'Discharged');
INSERT INTO ColorLog (patient_id, triage_level) VALUES (4, 'GREEN');
INSERT INTO ColorLog (patient_id, triage_level) VALUES (4, 'BLUE');

-- Patient 5: BLUE (Non-Urgent) - Waiting
INSERT INTO Patient (national_id, first_name, last_name, sex, date_of_birth, indicator, symptoms, triage_level, triage_score, triage_reason, status_name)
VALUES ('100000000005', 'Green', 'Test', 'Male', '2001-02-08', 'Trauma', 'Routine check-up', 'BLUE', 0.0, 'Normal condition', 'Waiting');

INSERT INTO VitalSigns (patient_id, heart_rate_bpm, resp_rate_min, systolic_bp, diastolic_bp, temp_c, spo2_percent, gcs_total, pain_score)
VALUES (LAST_INSERT_ID(), 78, 17, 120, 80, 36.5, 98, 15, 2);

INSERT INTO StatusLog (patient_id, status_name) VALUES (5, 'Waiting');
INSERT INTO ColorLog (patient_id, triage_level) VALUES (5, 'BLUE');

-- ==================================================
-- ตรวจสอบข้อมูล
-- ==================================================

SELECT 'Patient Table with Timestamps:' AS '';
SELECT patient_id, first_name, last_name, triage_level, status_name, created_at, updated_at FROM Patient;
