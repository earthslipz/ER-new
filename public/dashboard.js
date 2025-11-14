// ==================================================
// 🧠 TRIAGE DASHBOARD FRONTEND (With Status Update & Color Change)
// ==================================================
const patientTable = document.getElementById("patientTable");
const totalPatients = document.getElementById("totalPatients");
const criticalCount = document.getElementById("criticalCount");
const urgentCount = document.getElementById("urgentCount");
const mildCount = document.getElementById("mildCount");
const minorCount = document.getElementById("minorCount");
const deceasedCount = document.getElementById("deceasedCount");

const API_BASE = "http://localhost:4000";

const triagePriority = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 3,
  GREEN: 4,
  BLUE: 5,
};

// ==================================================
// 🔄 ดึงข้อมูลจาก Backend
// ==================================================
async function loadPatients() {
  try {
    console.log("🔄 Fetching patients from backend...");
    const res = await fetch(`${API_BASE}/patients`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ HTTP Error:", res.status, errorText);
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();

    console.log("✅ Received patient data:", data);
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format (expected array)");
    }

    totalPatients.textContent = data.length;

    // ==================================================
    // 📊 เรียงตาม Priority → Score (RED → BLUE)
    // ==================================================
    data.sort((a, b) => {
      const rankA = triagePriority[a.triage_level] || 99;
      const rankB = triagePriority[b.triage_level] || 99;
      if (rankA === rankB) {
        const scoreA = parseFloat(a.triage_score) || 0;
        const scoreB = parseFloat(b.triage_score) || 0;
        return scoreB - scoreA;
      }
      return rankA - rankB;
    });

    // ล้างตารางเก่า
    patientTable.innerHTML = "";

    const counts = { RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0, BLUE: 0, DECEASED: 0 };

    // ==================================================
    // 🧾 เติมข้อมูลในตาราง
    // ==================================================
    data.forEach((p, index) => {
      const triage = (p.triage_level || "UNKNOWN").toUpperCase();
      const color = getColor(triage);
      counts[triage] = (counts[triage] || 0) + 1;

      // นับ Deceased
      if (p.status_name === "Deceased") {
        counts.DECEASED++;
      }

      const score = p.triage_score ? parseFloat(p.triage_score).toFixed(2) : "-";
      const priority = index + 1;

      // ใช้ status_name จาก database
      const currentStatus = p.status_name || "Waiting";

      const row = `
        <tr data-id="${p.patient_id}" style="text-align:center; vertical-align:middle;">
          <td>${priority}</td>
          <td>${p.patient_id}</td>
          <td>${p.full_name || "-"}</td>
          <td style="font-weight:700; color:${color};">${triage}</td>
          <td>${p.sex || "-"}</td>
          <td>${score}</td>
          <td>${p.symptoms || "-"}</td>
          <td>
            <select class="status-select">
              <option value="Waiting" ${currentStatus === "Waiting" ? "selected" : ""}>Waiting</option>
              <option value="Under Treatment" ${currentStatus === "Under Treatment" ? "selected" : ""}>Under Treatment</option>
              <option value="Transferred" ${currentStatus === "Transferred" ? "selected" : ""}>Transferred</option>
              <option value="Discharged" ${currentStatus === "Discharged" ? "selected" : ""}>Discharged</option>
              <option value="Deceased" ${currentStatus === "Deceased" ? "selected" : ""}>Deceased</option>
            </select>
            <button class="update-btn">🗘</button>
          </td>
        </tr>
      `;
      patientTable.insertAdjacentHTML("beforeend", row);
    });

    // ==================================================
    // 📦 อัปเดต summary box
    // ==================================================
    criticalCount.textContent = counts.RED;
    urgentCount.textContent = (counts.ORANGE || 0) + (counts.YELLOW || 0);
    mildCount.textContent = counts.GREEN;
    minorCount.textContent = counts.BLUE;
    deceasedCount.textContent = counts.DECEASED;

    console.log("✅ Dashboard updated successfully!");
    addUpdateListeners();
  } catch (err) {
    console.error("❌ Error loading patients:", err);
    patientTable.innerHTML = `
      <tr><td colspan="9" style="color:red; text-align:center;">
      ⚠️ Failed to load patient data: ${err.message}
      </td></tr>`;
  }
}

// ==================================================
// 🎨 สี triage
// ==================================================
function getColor(level) {
  switch (level) {
    case "RED":
      return "red";
    case "ORANGE":
      return "orange";
    case "YELLOW":
      return "#ffc107";
    case "GREEN":
      return "green";
    case "BLUE":
      return "blue";
    default:
      return "gray";
  }
}

// ==================================================
// 🔁 เพิ่ม event listener สำหรับปุ่ม Update
// ==================================================
function addUpdateListeners() {
  document.querySelectorAll(".update-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const row = e.target.closest("tr");
      const id = row.dataset.id;
      const newStatus = row.querySelector(".status-select").value;

      console.log(`🩺 Updating status for patient ID ${id} → ${newStatus}`);

      try {
        const response = await fetch(`${API_BASE}/patients/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Status update response:", result);

        // แสดงผลการเปลี่ยนแปลงสี/คะแนน
        let message = `✅ Patient #${id} status updated to: ${newStatus}`;
        if (result.triage_level || result.triage_score !== undefined) {
          message += `\n🎨 Triage Level: ${result.triage_level}\n📊 Score: ${result.triage_score}`;
        }
        alert(message);

        // รีเฟรชข้อมูลใหม่
        loadPatients();
      } catch (error) {
        console.error("❌ Error updating status:", error);
        alert(`⚠️ Failed to update status: ${error.message}`);
      }
    });
  });
}

// ==================================================
// 🔍 ระบบค้นหา
// ==================================================
const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const filter = input.value.trim().toLowerCase();
  const rows = patientTable.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const idCell = rows[i].cells[1];
    const nameCell = rows[i].cells[2];
    const symptomsCell = rows[i].cells[6];

    if (idCell && nameCell && symptomsCell) {
      const idText = idCell.textContent.toLowerCase();
      const nameText = nameCell.textContent.toLowerCase();
      const symptomText = symptomsCell.textContent.toLowerCase();

      rows[i].style.display =
        idText.includes(filter) ||
        nameText.includes(filter) ||
        symptomText.includes(filter)
          ? ""
          : "none";
    }
  }
});

// ==================================================
// 🧹 Clear Database
// ==================================================
const clearButton = document.createElement("button");
clearButton.id = "clearDB";
clearButton.textContent = "🧹 Clear DB";
clearButton.style.marginLeft = "10px";
clearButton.style.padding = "5px 10px";
clearButton.style.background = "#dc3545";
clearButton.style.color = "white";
clearButton.style.border = "none";
clearButton.style.borderRadius = "5px";
clearButton.style.cursor = "pointer";

document.querySelector(".search form").appendChild(clearButton);

clearButton.addEventListener("click", async () => {
  const confirmClear = confirm("⚠️ Are you sure you want to delete ALL patient data?");

  if (!confirmClear) return;

  try {
    const res = await fetch(`${API_BASE}/clear-db`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const result = await res.json();
    alert("✅ Database cleared successfully!");
    loadPatients();
  } catch (err) {
    console.error("❌ Clear DB error:", err);
    alert("⚠️ Failed to clear DB: " + err.message);
  }
});

// ==================================================
// 📋 View Status Logs (JSON)
// ==================================================
const statusLogsButton = document.createElement("button");
statusLogsButton.id = "viewStatusLogs";
statusLogsButton.textContent = "📋 Status Logs";
statusLogsButton.style.marginLeft = "10px";
statusLogsButton.style.padding = "5px 10px";
statusLogsButton.style.background = "#17a2b8";
statusLogsButton.style.color = "white";
statusLogsButton.style.border = "none";
statusLogsButton.style.borderRadius = "5px";
statusLogsButton.style.cursor = "pointer";

document.querySelector(".search form").appendChild(statusLogsButton);

statusLogsButton.addEventListener("click", () => {
  window.open(`${API_BASE}/logs/status`, '_blank');
});

// ==================================================
// 🎨 View Color Logs (JSON)
// ==================================================
const colorLogsButton = document.createElement("button");
colorLogsButton.id = "viewColorLogs";
colorLogsButton.textContent = "🎨 Color Logs";
colorLogsButton.style.marginLeft = "10px";
colorLogsButton.style.padding = "5px 10px";
colorLogsButton.style.background = "#28a745";
colorLogsButton.style.color = "white";
colorLogsButton.style.border = "none";
colorLogsButton.style.borderRadius = "5px";
colorLogsButton.style.cursor = "pointer";

document.querySelector(".search form").appendChild(colorLogsButton);

colorLogsButton.addEventListener("click", () => {
  window.open(`${API_BASE}/logs/color`, '_blank');
});

// ==================================================
// 🚀 โหลดข้อมูลเมื่อหน้าเพจเปิด
// ==================================================
loadPatients();
