// ==================================================
// 🧠 TRIAGE DASHBOARD FRONTEND (FULL + FIXED)
// ==================================================
const patientTable = document.getElementById("patientTable");
const totalPatients = document.getElementById("totalPatients");
const criticalCount = document.getElementById("criticalCount");
const urgentCount = document.getElementById("urgentCount");
const mildCount = document.getElementById("mildCount");
const minorCount = document.getElementById("minorCount");
const deceasedCount = document.getElementById("deceasedCount");

// 🔹 Priority Rank Map (ใช้สำหรับเรียงสี)
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

    const counts = { RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0, BLUE: 0 };

    // ==================================================
    // 🧾 เติมข้อมูลในตาราง
    // ==================================================
    data.forEach((p, index) => {
      const triage = (p.triage_level || "UNKNOWN").toUpperCase();
      const color = getColor(triage);
      counts[triage] = (counts[triage] || 0) + 1;

      const score = p.triage_score ? parseFloat(p.triage_score).toFixed(2) : "-";
      const priority = index + 1;

      const row = `
        <tr style="text-align:center; vertical-align:middle;">
          <td>${priority}</td>
          <td>${p.patient_id}</td>
          <td>${p.full_name || "-"}</td>
          <td style="font-weight:700; color:${color};">${triage}</td>
          <td>${p.sex || "-"}</td>
          <td>${score}</td>
          <td>${p.symptoms || "-"}</td>
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
    deceasedCount.textContent = 0;

    console.log("✅ Dashboard updated successfully!");
  } catch (err) {
    console.error("❌ Error loading patients:", err);
    patientTable.innerHTML = `
      <tr><td colspan="7" style="color:red; text-align:center;">
      ⚠️ Failed to load patient data: ${err.message}
      </td></tr>`;
  }
}

// ==================================================
// 🎨 ฟังก์ชันกำหนดสี triage
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
// 🧹 ปุ่ม Clear Database
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

// ✅ แทรกปุ่มไว้ข้างปุ่ม Search
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
// 🚀 โหลดข้อมูลเมื่อหน้าเพจเปิด
// ==================================================
loadPatients();
