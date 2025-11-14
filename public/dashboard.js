// ==================================================
// 🧠 TRIAGE DASHBOARD FRONTEND
// ==================================================
const patientTable = document.getElementById("patientTable");
const totalPatients = document.getElementById("totalPatients");
const criticalCount = document.getElementById("criticalCount");
const urgentCount = document.getElementById("urgentCount");
const mildCount = document.getElementById("mildCount");
const minorCount = document.getElementById("minorCount");
const deceasedCount = document.getElementById("deceasedCount");

const triagePriority = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 3,
  GREEN: 4,
  BLUE: 5,
};

// ==================================================
// 🕒 Format Timestamp
// ==================================================
function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ==================================================
// 🔄 ดึงข้อมูลจาก Backend
// ==================================================
async function loadPatients() {
  try {
    console.log("🔄 Fetching patients from backend...");
    const res = await fetch("/patients");
    
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
      const currentStatus = p.status_name || "Waiting";
      const lastUpdated = formatTimestamp(p.updated_at);

      const row = `
        <tr data-id="${p.patient_id}">
          <td>${priority}</td>
          <td>${p.patient_id}</td>
          <td>${p.full_name || "-"}</td>
          <td><span style="color: ${color}; font-weight: bold;">${triage}</span></td>
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
          <td>${lastUpdated}</td>
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
      <tr>
        <td colspan="9" style="text-align: center; color: red; font-weight: bold;">
          ⚠️ Failed to load patient data: ${err.message}
        </td>
      </tr>
    `;
  }
}

// ==================================================
// 🎨 สี triage
// ==================================================
function getColor(level) {
  switch (level) {
    case "RED": return "red";
    case "ORANGE": return "orange";
    case "YELLOW": return "#ffc107";
    case "GREEN": return "green";
    case "BLUE": return "blue";
    default: return "gray";
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
        const response = await fetch(`/patients/${id}/status`, {
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

        let message = `✅ Patient #${id} status updated to: ${newStatus}`;
        if (result.triage_level || result.triage_score !== undefined) {
          message += `\n🎨 Triage Level: ${result.triage_level}\n📊 Score: ${result.triage_score}`;
        }

        alert(message);
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
        idText.includes(filter) || nameText.includes(filter) || symptomText.includes(filter)
          ? ""
          : "none";
    }
  }
});

// ==================================================
// 🧹 Clear Database Button
// ==================================================
const clearButton = document.createElement("button");
clearButton.id = "clearDB";
clearButton.textContent = "🧹 Clear DB";
clearButton.className = "clear__button";
clearButton.style.marginLeft = "10px";
document.querySelector(".search form").appendChild(clearButton);

clearButton.addEventListener("click", async () => {
  const confirmClear = confirm("⚠️ Are you sure you want to delete ALL patient data?");
  if (!confirmClear) return;

  try {
    const res = await fetch("/clear-db", { method: "DELETE" });
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
// 📋 View Status Logs Button
// ==================================================
const statusLogsButton = document.createElement("button");
statusLogsButton.id = "viewStatusLogs";
statusLogsButton.textContent = "📋 Status Logs";
statusLogsButton.className = "search__button";
statusLogsButton.style.marginLeft = "10px";
document.querySelector(".search form").appendChild(statusLogsButton);

statusLogsButton.addEventListener("click", () => {
  window.open("/logs/status", '_blank');
});

// ==================================================
// 🎨 View Color Logs Button
// ==================================================
const colorLogsButton = document.createElement("button");
colorLogsButton.id = "viewColorLogs";
colorLogsButton.textContent = "🎨 Color Logs";
colorLogsButton.className = "search__button";
colorLogsButton.style.marginLeft = "10px";
document.querySelector(".search form").appendChild(colorLogsButton);

colorLogsButton.addEventListener("click", () => {
  window.open("/logs/color", '_blank');
});

// ==================================================
// 🚀 โหลดข้อมูลเมื่อหน้าเพจเปิด
// ==================================================
loadPatients();
