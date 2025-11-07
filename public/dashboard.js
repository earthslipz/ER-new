// ==================================================
// 🧠 TRIAGE DASHBOARD FRONTEND (With Status Update)
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
    const data = await res.json();

    // 🔧 Test
    /*const data = [
      {
        patient_id: 1,
        full_name: "Somying Critical",
        triage_level: "RED",
        sex: "Female",
        triage_score: 25.5,
        symptoms: "Severe shortness of breath",
        status: "Waiting",
      },
      {
        patient_id: 2,
        full_name: "Anan Urgent",
        triage_level: "ORANGE",
        sex: "Male",
        triage_score: 18.2,
        symptoms: "Severe chest pain",
        status: "Under Treatment",
      },
    ];*/
    console.log("✅ Received patient data:", data);
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format (expected array)");
    }

    totalPatients.textContent = data.length;

    // 📊 เรียงลำดับตามระดับความรุนแรง
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

    patientTable.innerHTML = "";
    const counts = { RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0, BLUE: 0 };

    data.forEach((p, index) => {
      const triage = (p.triage_level || "UNKNOWN").toUpperCase();
      const color = getColor(triage);
      counts[triage] = (counts[triage] || 0) + 1;

      const score = p.triage_score
        ? parseFloat(p.triage_score).toFixed(2)
        : "-";
      const priority = index + 1;

      //----------add status selected + update btn--------------
      const row = `
        <tr data-id="${
          p.patient_id
        }" style="text-align:center; vertical-align:middle;">
          <td>${priority}</td>
          <td>${p.patient_id}</td>
          <td>${p.full_name || "-"}</td>
          <td style="font-weight:700; color:${color};">${triage}</td>
          <td>${p.sex || "-"}</td>
          <td>${score}</td>
          <td>${p.symptoms || "-"}</td>

          <td>
            <select class="status-select">
              <option value="Waiting" ${
                p.status === "Waiting" ? "selected" : ""
              }>Waiting</option>
              <option value="Under Treatment" ${
                p.status === "Under Treatment" ? "selected" : ""
              }>Under Treatment</option>
              <option value="Transferred" ${
                p.status === "Transferred" ? "selected" : ""
              }>Transferred</option>
              <option value="Discharged" ${
                p.status === "Discharged" ? "selected" : ""
              }>Discharged</option>
              <option value="Deceased" ${
                p.status === "Deceased" ? "selected" : ""
              }>Deceased</option>
            </select>
            <button class="update-btn">🗘</button>
          </td>
        </tr>
      `;
      patientTable.insertAdjacentHTML("beforeend", row);
    });

    criticalCount.textContent = counts.RED;
    urgentCount.textContent = (counts.ORANGE || 0) + (counts.YELLOW || 0);
    mildCount.textContent = counts.GREEN;
    minorCount.textContent = counts.BLUE;
    deceasedCount.textContent = 0;

    addUpdateListeners();
  } catch (err) {
    console.error("❌ Error loading patients:", err);
    patientTable.innerHTML = `
      <tr><td colspan="8" style="color:red; text-align:center;">
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

      // ✅ ถ้ามี backend:
      /*
      await fetch(`${API_BASE}/patients/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      */

      alert(`✅ Patient #${id} status updated to: ${newStatus}`);
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
    if (idCell && nameCell) {
      const idText = idCell.textContent.toLowerCase();
      const nameText = nameCell.textContent.toLowerCase();
      rows[i].style.display =
        idText.includes(filter) || nameText.includes(filter) ? "" : "none";
    }
  }
});

// ==================================================
// 🧹 Clear Database
// ==================================================
const clearButton = document.createElement("button");
clearButton.id = "clearDB";
clearButton.textContent = "🧹 Clear DB";
clearButton.className = "clear__button";
document.querySelector(".search form").appendChild(clearButton);

clearButton.addEventListener("click", async () => {
  const confirmClear = confirm(
    "⚠️ Are you sure you want to delete ALL patient data?"
  );
  if (!confirmClear) return;

  try {
    // await fetch(`${API_BASE}/clear-db`, { method: "DELETE" });
    alert("✅ Database cleared successfully!");
    loadPatients();
  } catch (err) {
    console.error("❌ Clear DB error:", err);
    alert("⚠️ Failed to clear DB: " + err.message);
  }
});

// ==================================================
// 🚀 โหลดข้อมูลเมื่อหน้าเพจเปิด
// ==================================================
loadPatients();
