const popup = document.getElementById("popup-overlay");
const popupText = document.getElementById("popup-text");
const popupGif = document.getElementById("popup-gif");

function showPopup(text, color = "#333") {
  popupText.textContent = text;
  popupText.style.color = color;
  popupGif.src = "https://cdn.dribbble.com/userupload/20018706/file/original-590645bf3158e9241117ce5e877ebfeb.gif";
  popup.classList.remove("hidden");
}
function hidePopup(delay = 2000) { 
  setTimeout(() => popup.classList.add("hidden"), delay); 
}

const form = document.getElementById("erForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");
  const nationalID = document.getElementById("nationalID").value.trim();
  const gender = document.getElementById("gender").value;
  const birthday = document.getElementById("birthday").value;

  const symptoms = document.getElementById("symptomsCustom").value.trim() || 
                   document.getElementById("symptoms").value;
  const painScore = parseInt(document.getElementById("pain").value) || 0;
  const gcsScore = parseInt(document.getElementById("gcs").value) || 15; // ✅ อ่านค่าจาก input จริง
  const selectedIndicators = Array.from(document.querySelectorAll(".indicators button.active")).map(b => b.textContent);

  // ✅ ตรวจสอบค่าก่อนส่ง
  if (gcsScore < 3 || gcsScore > 15) {
    showPopup("⚠️ Please enter GCS between 3–15", "red");
    hidePopup(3000);
    return;
  }

  const data = {
    national_id: nationalID,
    first_name: firstName,
    last_name: lastName,
    sex: gender,
    date_of_birth: birthday,
    indicator: selectedIndicators[0] || "Trauma",
    symptoms,
    vital: {
      heart_rate_bpm: document.getElementById("heartRate").value,
      resp_rate_min: document.getElementById("respRate").value,
      systolic_bp: document.getElementById("bpMax").value,
      diastolic_bp: document.getElementById("bpMin").value,
      temp_c: document.getElementById("temp").value,
      spo2_percent: document.getElementById("o2").value,
      gcs_total: gcsScore, // ✅ ใช้ค่าจาก input
      pain_score: painScore,
    },
  };

  showPopup("Saving data...");

  try {
    const res = await fetch("/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      popupGif.src = "https://cdn-icons-png.flaticon.com/512/845/845646.png";
      popupText.innerHTML = `✅ Saved!<br>${result.triage} (${result.score})`;
      popupText.style.color =
        result.triage === "RED" ? "red" :
        result.triage === "ORANGE" ? "orange" :
        result.triage === "YELLOW" ? "#e0b000" :
        result.triage === "GREEN" ? "green" : "#555";
      form.reset();
    } else {
      showPopup("❌ Error: " + result.error, "red");
    }
  } catch (err) {
    showPopup("⚠️ Server error: " + err.message, "red");
  } finally {
    hidePopup(2500);
  }
});

// Indicator toggle
document.querySelectorAll(".indicators button").forEach(btn =>
  btn.addEventListener("click", () => btn.classList.toggle("active"))
);
