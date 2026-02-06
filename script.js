document.addEventListener("DOMContentLoaded", () => {

/* ================= ELEMENTS ================= */

const monthEl = document.getElementById("month");
const subjectRows = document.getElementById("subjectRows");
const history = document.getElementById("history");
const emptyState = document.getElementById("emptyState");
const overallAttendance = document.getElementById("overallAttendance");
const totalSubjects = document.getElementById("totalSubjects");
const below75 = document.getElementById("below75");
const currentMonthAvg = document.getElementById("currentMonthAvg");
const finalSummary = document.getElementById("finalSummary");

const ciaRows = document.getElementById("ciaRows");
const ciaHistory = document.getElementById("ciaHistory");
const ciaSummary = document.getElementById("ciaSummary");

/* ================= MONTH DROPDOWN ================= */

const monthSelectUI = document.getElementById("monthSelect");
const monthSelectedUI = monthSelectUI.querySelector(".month-selected");
const monthOptionsUI = monthSelectUI.querySelectorAll(".month-options div");

monthSelectedUI.onclick = () => monthSelectUI.classList.toggle("open");

monthOptionsUI.forEach(opt => {
  opt.onclick = () => {
    monthSelectedUI.textContent = opt.textContent;
    monthEl.value = opt.textContent;
    monthSelectUI.classList.remove("open");
    updateMonthlyAverage();
  };
});

document.addEventListener("click", e => {
  if (!monthSelectUI.contains(e.target))
    monthSelectUI.classList.remove("open");
});

/* ================= ADD SUBJECT ROW ================= */

window.addRow = function () {
  subjectRows.insertAdjacentHTML("beforeend",
  `<tr>
<td><input maxlength="30"></td>
<td><input type="number" min="1" max="500"></td>
<td><input type="number" min="0" max="500"></td>
</tr>`);
};

/* ================= CALCULATE ATTENDANCE ================= */

window.calculateAll = function () {

  const month = monthEl.value;
  if (!month) return alert("Select month first");

  let data = JSON.parse(localStorage.getItem("attendance")) || [];

  document.querySelectorAll("#subjectRows tr").forEach(row => {

    const s = row.children[0].children[0].value.trim().toUpperCase();
    const t = +row.children[1].children[0].value;
    const a = +row.children[2].children[0].value;

    if (!s || t <= 0 || a > t) return;

    const p = +(a / t * 100).toFixed(2);

    data = data.filter(d => !(d.month === month && d.subject === s));
    data.push({ month, subject: s, percentage: p, total: t, attended: a });

  });

  localStorage.setItem("attendance", JSON.stringify(data));
  renderAttendance();
};

/* ================= RENDER ================= */

function renderAttendance() {

  const data = JSON.parse(localStorage.getItem("attendance")) || [];
  history.innerHTML = "";

  let totalPct = 0, safe = 0, risk = 0, critical = 0;

  data.forEach(d => {

    totalPct += d.percentage;

    let status, badgeClass;

    if (d.percentage >= 75) {
      status = "SAFE"; badgeClass = "safe"; safe++;
    } else if (d.percentage >= 60) {
      status = "AT RISK"; badgeClass = "atrisk"; risk++;
    } else {
      status = "CRITICAL"; badgeClass = "critical"; critical++;
    }

    history.innerHTML += `
<li class="subject-card">
<div class="row-top">
<div class="title">${d.month} — ${d.subject}</div>
<div class="badge ${badgeClass}">${status}</div>
</div>
<div>${d.percentage}%</div>
</li>`;
  });

  emptyState.style.display = data.length ? "none" : "block";
  totalSubjects.innerText = data.length;
  below75.innerText = risk + critical;
  overallAttendance.innerText =
    data.length ? (totalPct / data.length).toFixed(2) + "%" : "0%";

  finalSummary.innerText =
    data.length ? `Safe ${safe} | At Risk ${risk} | Critical ${critical}` : "No data";

  updateMonthlyAverage();
}

/* ================= MONTH AVG ================= */

window.updateMonthlyAverage = function () {
  const m = monthEl.value;
  const data = JSON.parse(localStorage.getItem("attendance")) || [];
  const f = data.filter(d => d.month === m);
  const avg = f.reduce((s,x)=>s+x.percentage,0);
  currentMonthAvg.innerText =
    f.length ? (avg/f.length).toFixed(2)+"%" : "0%";
};

/* ================= CLEAR ================= */

window.clearMonth = function () {
  const m = monthEl.value;
  let d = JSON.parse(localStorage.getItem("attendance")) || [];
  d = d.filter(x => x.month !== m);
  localStorage.setItem("attendance", JSON.stringify(d));
  renderAttendance();
};

window.clearAll = function () {
  localStorage.removeItem("attendance");
  renderAttendance();
};

/* ================= CSV ================= */

window.exportCSV = function () {

  const data = JSON.parse(localStorage.getItem("attendance")) || [];
  if (!data.length) return alert("No data");

  const rows = [
    ["Month","Subject","Total","Attended","Percentage"],
    ...data.map(d => [d.month,d.subject,d.total,d.attended,d.percentage])
  ];

  const csv = rows.map(r=>r.join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "attendance.csv";
  a.click();
};

/* ================= CIA ================= */

window.addCiaRow = function () {
  ciaRows.insertAdjacentHTML("beforeend",
`<tr>
<td><input maxlength="30"></td>
<td><input type="number" min="0" max="25"></td>
<td class="needCell">—</td>
<td class="avgCell">—</td>
</tr>`);
};

window.calculateCIA = function () {

  const PASS_AVG = 12;
  const MAX = 25;

  ciaHistory.innerHTML = "";

  let pass = 0, fail = 0;

  document.querySelectorAll("#ciaRows tr").forEach(r => {

    const sub = r.children[0].children[0].value.trim();
    const c1 = +r.children[1].children[0].value;

    if (!sub && !c1) return;

    let need = (PASS_AVG * 2) - c1;
    if (need < 0) need = 0;
    if (need > MAX) need = MAX;

    const avg = (c1 + need) / 2;

    r.querySelector(".needCell").innerText = need.toFixed(1);
    r.querySelector(".avgCell").innerText = avg.toFixed(1);

    avg >= PASS_AVG ? pass++ : fail++;

    ciaHistory.innerHTML +=
      `<li>${sub} → Need ${need.toFixed(1)}, Avg ${avg.toFixed(1)}</li>`;
  });

  ciaSummary.innerText =
    `Total ${pass+fail} | Pass ${pass} | Fail ${fail}`;
};

/* ================= INIT ================= */

renderAttendance();

});