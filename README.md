# 🏥 TriagER - Emergency Patient Management System

A comprehensive web-based emergency triage system for managing patient priorities in hospital emergency departments. The system automatically calculates triage levels based on vital signs and provides real-time patient status tracking.

**Created by LockShade Team**

## ✨ Features

- **Automatic Triage Calculation**: AI-powered triage scoring based on vital signs (Heart Rate, Blood Pressure, SpO2, Temperature, Respiratory Rate, Pain Score, GCS)
- **Color-Coded Priority System**: RED (Critical), ORANGE (Very Urgent), YELLOW (Urgent), GREEN (Standard), BLUE (Non-Urgent)
- **Real-Time Patient Tracking**: Monitor patient status changes with timestamps
- **Status Management**: Track patient journey from Waiting → Under Treatment → Transferred/Discharged/Deceased
- **Comprehensive Logging**: Complete audit trail of status and triage level changes
- **Search Functionality**: Quick patient lookup by ID, Name, or Symptoms
- **Responsive Dashboard**: Real-time updates and modern UI

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/triage-system.git
   cd triage-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   a. Start MySQL and login:
   ```bash
   mysql -u root -p
   ```
   
   b. Run the database setup script:
   ```sql
   source path/to/database.sql
   ```
   
   Or if you're in the project directory:
   ```bash
   mysql -u root -p < database.sql
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PORT=3306
   DB_PASS=your_password_here
   DB_NAME=triager_system
   PORT=4000
   ```

5. **Start the server**
   ```bash
   node app.js
   ```
   
   You should see:
   ```
   ✅ Connected to MySQL Database successfully!
   Server running on port 4000
   ```

6. **Open the application**
   
   Navigate to: [http://localhost:4000](http://localhost:4000)

## 📁 Project Structure

```
triage-system/
├── app.js                 # Backend server (Express + MySQL)
├── database.sql           # Database schema and sample data
├── package.json           # Node.js dependencies
├── .env                   # Environment configuration
└── public/
    ├── Dashboard.html     # Main dashboard interface
    ├── dashboard.js       # Dashboard frontend logic
    ├── form.html          # Patient registration form
    ├── login.html         # Login page
    └── styles.css         # Styling
```

## 🎯 Usage

### 1. Register a New Patient
- Click on "Register Patient" button
- Fill in patient information:
  - Personal details (National ID, Name, DOB, Gender)
  - Emergency indicator
  - Symptoms
  - Vital signs (HR, BP, Temp, SpO2, RR, Pain Score, GCS)
- Submit to automatically calculate triage level

### 2. Monitor Dashboard
- View all patients sorted by priority (RED → BLUE)
- See patient counts by triage level
- Real-time updates of patient status
- Last updated timestamp for each patient

### 3. Update Patient Status
- Select new status from dropdown:
  - **Waiting**: Initial state
  - **Under Treatment**: Patient being treated (Score → 0)
  - **Transferred**: Moved to another facility (Color → BLUE)
  - **Discharged**: Released from hospital (Color → BLUE)
  - **Deceased**: Patient deceased
- Click update button (🗘) to save

### 4. View Logs
- **Status Logs**: Complete history of status changes
- **Color Logs**: History of triage level changes

### 5. Search Patients
- Search by Patient ID, Name, or Symptoms
- Results filter in real-time

## 🧮 Triage Calculation Logic

The system uses a weighted scoring system based on:

### Vital Signs Weights
- **SpO2** (Oxygen Saturation): Weight 2.0 (Highest priority)
- **Blood Pressure**: Weight 1.8
- **Heart Rate**: Weight 1.5
- **Respiratory Rate**: Weight 1.5
- **Temperature**: Weight 1.0
- **Pain Score**: Weight 0.8

### Special Rules
- **GCS ≤ 8**: Automatic RED (Severely altered consciousness)
- **GCS 9-12**: Automatic YELLOW (Moderately altered consciousness)

### Triage Levels
| Level | Color | Description | Criteria |
|-------|-------|-------------|----------|
| RED | 🔴 | Immediate | SpO2 < 90%, BP < 90, RR ≤ 10 or ≥ 30, HR ≤ 40 or ≥ 140 |
| YELLOW | 🟡 | Urgent | BP 90-100, SpO2 90-93, Temp > 39.5°C, RR 25-29, Pain ≥ 7 |
| GREEN | 🟢 | Standard | Temp 38.5-39.5°C, Pain 5-6, SpO2 94-95% |
| BLUE | 🔵 | Non-Urgent | Normal vital signs |

## 🔧 API Endpoints

### Patient Management
- `GET /patients` - Get all patients with vital signs
- `POST /patients` - Register new patient
- `PUT /patients/:id/status` - Update patient status

### Logs
- `GET /logs/status` - Get status change history
- `GET /logs/color` - Get triage level change history

### Admin
- `DELETE /clear-db` - Clear all patient data (⚠️ Use with caution)

## 🗄️ Database Schema

### Main Tables
- **Patient**: Patient demographics and triage information
- **VitalSigns**: Patient vital signs measurements
- **StatusLog**: History of status changes
- **ColorLog**: History of triage level changes

### Master Data Tables
- **EmergencyIndicator**: Predefined emergency indicators
- **PatientStatus**: Available patient statuses
- **TriageLevel**: Triage color codes and priorities

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Dependencies**: 
  - `express`: Web server framework
  - `mysql2`: MySQL database driver
  - `cors`: Cross-origin resource sharing
  - `dotenv`: Environment variable management

## 📝 Development

### Running in Development Mode
```bash
npm run dev
```

### Testing Database Connection
```bash
node -e "require('./app.js')"
```

### Resetting Database
To reset the database and start fresh:
```bash
mysql -u root -p < database.sql
```

## 🐛 Troubleshooting

### Common Issues

**1. "Database connection failed"**
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;`

**2. "Server error: 500" on dashboard**
- Check database name matches between SQL file and `.env`
- Verify all tables were created: `SHOW TABLES;`
- Check table structure: `DESCRIBE Patient;`

**3. "Cannot find module" errors**
```bash
npm install
```

**4. Port 4000 already in use**
- Change port in `.env`: `PORT=5000`
- Or kill the process: 
  ```bash
  # Find process
  lsof -i :4000
  # Kill process
  kill -9 <PID>
  ```

## 📊 Sample Data

The system includes 5 sample patients demonstrating different triage levels:
1. **Somying Critical** - RED (Critical respiratory distress)
2. **Anan Urgent** - ORANGE (Severe chest pain)
3. **Nattaya Prom** - YELLOW (Trauma with fever)
4. **Somchai Za** - GREEN (Mild headache, discharged)
5. **Green Test** - BLUE (Routine check-up)

## 🔒 Security Notes

- Change default database password in production
- Use environment variables for sensitive data
- Implement proper authentication for production use
- Add input validation and sanitization
- Use HTTPS in production

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Based on emergency department triage protocols
- Inspired by real-world hospital emergency systems
- Built for educational purposes

---

**Note**: This system is for educational/demonstration purposes. For production use in actual medical facilities, please ensure compliance with healthcare regulations (HIPAA, GDPR, etc.) and conduct thorough testing and validation.

## 👥 Contributors

- Your Name - Initial work

## 🙏 Acknowledgments

- Based on emergency department triage protocols
- Inspired by real-world hospital emergency systems
- Built for educational and demonstration purposes

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Email: your.email@example.com

---

**Note**: This system is for educational/demonstration purposes. For production use in actual medical facilities, please ensure compliance with healthcare regulations (HIPAA, GDPR, etc.) and conduct thorough testing and validation.
