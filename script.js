/* ============================================================
   BorderShield AI — Prototype Logic
   All data below is synthetic and generated client-side for demo
   purposes only. No real documents, biometrics or APIs involved.
   ============================================================ */

(function(){
  "use strict";

  /* ---------- Sample data pools ---------- */
  const NAMES = [
    ["Arjun","Mehta","IN"], ["Elena","Petrova","RU"], ["Wei","Zhang","CN"],
    ["Fatima","Al-Sayed","AE"], ["James","Whitfield","GB"], ["Sofia","Rossi","IT"],
    ["Kwame","Asante","GH"], ["Mai","Tanaka","JP"], ["Lucas","Silva","BR"],
    ["Amara","Okafor","NG"], ["Nikolai","Volkov","RU"], ["Priya","Nair","IN"]
  ];
  const NATIONALITIES = {
    IN:"Indian", RU:"Russian Federation", CN:"Chinese", AE:"United Arab Emirates",
    GB:"British", IT:"Italian", GH:"Ghanaian", JP:"Japanese", BR:"Brazilian",
    NG:"Nigerian"
  };
  const VISA_TYPES = ["Tourist (T‑1)","Business (B‑2)","Student (S‑1)","Employment (E‑3)","Transit (X‑1)"];
  const RISK_REASONS_HIGH = [
    "Forged visa stamp detected — ink density inconsistent with issuing authority template",
    "Facial similarity below acceptance threshold",
    "MRZ checksum mismatch on passport bio-data page",
    "Font kerning irregularities found in visa validity dates",
    "Passport number does not match issuing country's known series range"
  ];
  const RISK_REASONS_MED = [
    "Minor image compression artefacts near photo laminate",
    "Visa issue date close to travel date — routine secondary review advised"
  ];

  let uploaded = {passport:false, visa:false, face:false};
  let currentPassenger = null;
  let historyLog = [];

  /* ---------- Utility ---------- */
  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return document.querySelectorAll(sel); }
  function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function pick(arr){ return arr[rand(0,arr.length-1)]; }
  function pad(n){ return n.toString().padStart(2,"0"); }

  function randomDate(startYear,endYear){
    const y = rand(startYear,endYear);
    const m = rand(1,12);
    const d = rand(1,28);
    return `${pad(d)}/${pad(m)}/${y}`;
  }

  function passportNumber(cc){
    return cc + rand(1000000,9999999);
  }

  function showToast(msg, isError){
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : "");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(()=> t.classList.remove("show"), 2800);
  }

  /* ============================================================
     SCREEN NAVIGATION
     ============================================================ */
  function showLogin(){
    $("#screen-login").classList.add("active");
    $("#app").classList.remove("active");
  }

  function enterApp(){
    $("#screen-login").classList.remove("active");
    $("#app").classList.add("active");
    goToScreen("screen-upload");
    animateStatCounters();
  }

  function goToScreen(id){
    $all(".content .screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    $all(".nav-item[data-goto]").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.goto === id);
    });

    const titles = {
      "screen-upload": ["Document Upload","Capture and submit traveller documents for AI screening"],
      "screen-processing": ["AI Screening","Running OCR, validation, tampering and face-match modules"],
      "screen-results": ["Screening Results","Review extracted identity data and computed risk score"],
      "screen-history": ["Verification History","Recent screenings processed at this checkpoint"]
    };
    if(titles[id]){
      $("#topbarTitle").textContent = titles[id][0];
      $("#topbarSub").textContent = titles[id][1];
    }
  }

  $all(".nav-item[data-goto]").forEach(btn=>{
    btn.addEventListener("click", ()=> goToScreen(btn.dataset.goto));
  });

  $("#logoutBtn").addEventListener("click", ()=>{
    showLogin();
    resetUploadState();
  });

  /* ============================================================
     LOGIN SCREEN — stat counters + form
     ============================================================ */
  function animateStatCounters(){
    animateCount("#statPassengers", 0, 1284, 900);
    animateCount("#statAlerts", 0, 17, 700);
    animateCount("#statVerified", 0, 1229, 1100);
  }
  function animateCount(sel,from,to,duration){
    const el = $(sel);
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now-start)/duration);
      const eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(from + (to-from)*eased).toLocaleString();
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  // static preview counters on login load
  animateCount("#statPassengers", 0, 1284, 1200);
  animateCount("#statAlerts", 0, 17, 900);
  animateCount("#statVerified", 0, 1229, 1400);

  $("#loginForm").addEventListener("submit", e=>{
    e.preventDefault();
    showToast("Authenticated — welcome back, Officer Sharma");
    setTimeout(enterApp, 450);
  });
  $("#startVerificationBtn").addEventListener("click", ()=>{
    showToast("Authenticated — welcome back, Officer Sharma");
    setTimeout(enterApp, 350);
  });

  /* ============================================================
     UPLOAD SCREEN
     ============================================================ */
  const uploadTypes = ["passport","visa","face"];

  uploadTypes.forEach(type=>{
    const input = document.getElementById(type+"Input");
    input.addEventListener("change", e=>{
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ev => setUploadPreview(type, ev.target.result);
      reader.readAsDataURL(file);
    });
  });

  function setUploadPreview(type, src){
    const card = document.querySelector(`.upload-card[data-type="${type}"]`);
    const img = document.getElementById(type+"Preview");
    img.src = src;
    card.classList.add("filled");
    uploaded[type] = true;
    document.getElementById(type+"Status").textContent = "Document captured";
    refreshUploadCount();
  }

  // Inline SVG placeholder "photos" used for the sample set (no external assets)
  function svgDataUri(bg, fg, label){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'>
      <rect width='400' height='260' fill='${bg}'/>
      <circle cx='90' cy='130' r='46' fill='${fg}' opacity='0.85'/>
      <rect x='150' y='70' width='210' height='14' rx='4' fill='${fg}' opacity='0.55'/>
      <rect x='150' y='96' width='170' height='10' rx='3' fill='${fg}' opacity='0.4'/>
      <rect x='150' y='114' width='190' height='10' rx='3' fill='${fg}' opacity='0.4'/>
      <rect x='150' y='132' width='140' height='10' rx='3' fill='${fg}' opacity='0.4'/>
      <text x='20' y='240' font-family='monospace' font-size='16' fill='${fg}' opacity='0.7'>${label}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  $("#sampleBtn").addEventListener("click", ()=>{
    setUploadPreview("passport", svgDataUri("#0F1E38","#93C5FD","SPECIMEN · PASSPORT"));
    setUploadPreview("visa", svgDataUri("#141E1A","#6EE7B7","SPECIMEN · VISA"));
    setUploadPreview("face", svgDataUri("#241419","#FCA5A5","SPECIMEN · LIVE CAPTURE"));
    showToast("Sample document set loaded");
  });

  function refreshUploadCount(){
    const count = Object.values(uploaded).filter(Boolean).length;
    $("#uploadCount").textContent = `${count} / 3`;
    $("#runScreeningBtn").disabled = count < 3;
  }

  function resetUploadState(){
    uploaded = {passport:false, visa:false, face:false};
    uploadTypes.forEach(type=>{
      document.querySelector(`.upload-card[data-type="${type}"]`).classList.remove("filled");
      document.getElementById(type+"Status").textContent = "Awaiting upload";
      document.getElementById(type+"Preview").src = "";
    });
    refreshUploadCount();
  }

  $("#runScreeningBtn").addEventListener("click", ()=>{
    generatePassenger();
    goToScreen("screen-processing");
    runScreeningPipeline();
  });

  /* ============================================================
     PASSENGER DATA GENERATION
     ============================================================ */
  function generatePassenger(){
    const [first,last,cc] = pick(NAMES);
    const highRisk = Math.random() < 0.4; // ~40% of demo runs surface a high-risk case

    const faceMatch = highRisk ? rand(38,64) : rand(90,99);
    let riskScore;
    if(highRisk){
      riskScore = rand(72,96);
    } else if(Math.random() < 0.15){
      riskScore = rand(31,55); // occasional "needs review" middle case
    } else {
      riskScore = rand(3,28);
    }

    currentPassenger = {
      name: `${first} ${last}`,
      cc, nationality: NATIONALITIES[cc],
      passportNo: passportNumber(cc),
      dob: randomDate(1968,2005),
      expiry: randomDate(2026,2032),
      visaType: pick(VISA_TYPES),
      visaStatus: riskScore >= 70 ? "Flagged" : "Valid",
      faceMatch,
      riskScore,
      time: new Date()
    };
  }

  /* ============================================================
     PROCESSING SCREEN — animated pipeline
     ============================================================ */
  const modules = [
    {id:"mod-ocr", label:"Reading MRZ and printed fields…", duration:[700,1000]},
    {id:"mod-doc", label:"Validating document structure and issuing authority…", duration:[750,1050]},
    {id:"mod-tamper", label:"Scanning for tampering and pixel-level anomalies…", duration:[900,1200]},
    {id:"mod-face", label:"Matching live capture against passport photograph…", duration:[700,950]}
  ];

  function resetPipelineUI(){
    modules.forEach(m=>{
      const row = document.getElementById(m.id);
      row.classList.remove("active","done");
      row.querySelector(".module-status").textContent = "Pending";
    });
    $("#overallProgress").style.width = "0%";
    $("#progressPct").textContent = "0";
    $("#heatBox").classList.remove("show");
    $("#scanCaption").textContent = "Initializing secure analysis pipeline…";
  }

  function runScreeningPipeline(){
    resetPipelineUI();
    let stepIndex = 0;
    const totalSteps = modules.length;

    function runStep(){
      if(stepIndex >= totalSteps){
        $("#scanCaption").textContent = "Analysis complete. Compiling report…";
        setTimeout(()=>{
          renderResults();
          goToScreen("screen-results");
        }, 550);
        return;
      }

      const mod = modules[stepIndex];
      const row = document.getElementById(mod.id);
      row.classList.add("active");
      row.querySelector(".module-status").textContent = "Scanning…";
      $("#scanCaption").textContent = mod.label;

      // simulate tampering heat box only if this run is high-risk, during tamper module
      if(mod.id === "mod-tamper" && currentPassenger.riskScore >= 70){
        const heat = $("#heatBox");
        heat.style.left = rand(20,60)+"%";
        heat.style.top = rand(15,55)+"%";
        heat.style.width = rand(60,100)+"px";
        heat.style.height = rand(30,50)+"px";
        setTimeout(()=> heat.classList.add("show"), 250);
      }

      const dur = rand(mod.duration[0], mod.duration[1]);
      setTimeout(()=>{
        row.classList.remove("active");
        row.classList.add("done");
        row.querySelector(".module-status").textContent = "Complete";
        stepIndex++;
        const pct = Math.round((stepIndex/totalSteps)*100);
        $("#overallProgress").style.width = pct+"%";
        $("#progressPct").textContent = pct;
        runStep();
      }, dur);
    }

    runStep();
  }

  /* ============================================================
     RESULTS SCREEN
     ============================================================ */
  const RISK_CIRCUMFERENCE = 377; // 2 * PI * 60, matches CSS

  function renderResults(){
    const p = currentPassenger;

    $("#resPassengerName").textContent = p.name;
    $("#resNationality").textContent = p.nationality + " · " + p.cc;
    $("#resPassportNo").textContent = p.passportNo;
    $("#resDob").textContent = p.dob;
    $("#resExpiry").textContent = p.expiry;
    $("#resVisaStatus").textContent = p.visaStatus;
    $("#resVisaType").textContent = p.visaType;
    $("#resFaceMatch").textContent = p.faceMatch + "%";
    $("#resultPhoto").textContent = p.riskScore >= 70 ? "⚠️" : "🧑";

    // status chip
    const chip = $("#resStatusChip");
    chip.className = "status-chip";
    if(p.riskScore >= 70){ chip.textContent = "High Risk"; chip.classList.add("risk"); }
    else if(p.riskScore >= 30){ chip.textContent = "Needs Review"; chip.classList.add("review"); }
    else { chip.textContent = "Verified"; chip.classList.add("verified"); }

    // risk meter
    const circle = $("#riskCircle");
    const offset = RISK_CIRCUMFERENCE - (RISK_CIRCUMFERENCE * p.riskScore/100);
    circle.style.strokeDashoffset = RISK_CIRCUMFERENCE; // reset
    let color = "var(--emerald)";
    if(p.riskScore >= 70) color = "var(--red)";
    else if(p.riskScore >= 30) color = "var(--amber)";
    circle.style.stroke = color;
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{ circle.style.strokeDashoffset = offset; });
    });
    animateCount("#riskScoreNum", 0, p.riskScore, 900);

    const verdict = $("#riskVerdict");
    verdict.className = "risk-verdict";
    const explain = $("#riskExplain");
    explain.innerHTML = "";

    if(p.riskScore >= 70){
      verdict.textContent = "HIGH RISK — Manual Inspection Required";
      verdict.classList.add("bad");
      const reasons = shuffle(RISK_REASONS_HIGH).slice(0,3);
      reasons.forEach(r=> explain.appendChild(explainItem(r, true)));
      explain.appendChild(explainItem("Manual inspection recommended before clearance", true));
    } else if(p.riskScore >= 30){
      verdict.textContent = "SECONDARY REVIEW ADVISED";
      verdict.classList.add("warn");
      RISK_REASONS_MED.forEach(r=> explain.appendChild(explainItem(r, false)));
    } else {
      verdict.textContent = "VERIFIED — CLEAR TO PROCEED";
      verdict.classList.add("ok");
      ["All document checksums and security features passed","Face match confidence within accepted threshold","No tampering indicators detected"]
        .forEach(r=> explain.appendChild(explainItem(r, false, true)));
    }

    addToHistory(p);
  }

  function explainItem(text, isBad, isOk){
    const div = document.createElement("div");
    div.className = "risk-explain-item" + (isBad ? " bad" : isOk ? " ok" : "");
    const icon = isBad
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 4.2V7.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="7" cy="9.8" r="0.9" fill="currentColor"/><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.3L6 9.8L10.5 4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    div.innerHTML = icon + `<span>${text}</span>`;
    return div;
  }

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  $("#newVerificationBtn").addEventListener("click", ()=>{
    resetUploadState();
    goToScreen("screen-upload");
  });

  /* ============================================================
     HISTORY
     ============================================================ */
  function addToHistory(p){
    historyLog.unshift(p);
    if(historyLog.length > 25) historyLog.pop();
    renderHistory();
  }

  function renderHistory(){
    const body = $("#historyBody");
    body.innerHTML = "";
    if(historyLog.length === 0){
      body.innerHTML = `<tr><td colspan="7" class="muted" style="padding:20px 12px;">No verifications yet this session.</td></tr>`;
      return;
    }
    historyLog.forEach(p=>{
      const tr = document.createElement("tr");
      const pillClass = p.riskScore >= 70 ? "bad" : p.riskScore >= 30 ? "warn" : "ok";
      const pillLabel = p.riskScore >= 70 ? "High Risk" : p.riskScore >= 30 ? "Review" : "Verified";
      const timeStr = p.time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      tr.innerHTML = `
        <td>${p.name}</td>
        <td class="mono">${p.passportNo}</td>
        <td>${p.nationality}</td>
        <td>${p.faceMatch}%</td>
        <td>${p.riskScore}</td>
        <td><span class="pill ${pillClass}">${pillLabel}</span></td>
        <td>${timeStr}</td>`;
      body.appendChild(tr);
    });
  }

  // seed a little history so the screen isn't empty on first visit
  function seedHistory(){
    for(let i=0;i<5;i++){
      generatePassenger();
      currentPassenger.time = new Date(Date.now() - rand(5,400)*60000);
      historyLog.push(currentPassenger);
    }
    historyLog.sort((a,b)=> b.time - a.time);
    currentPassenger = null;
    renderHistory();
  }

  /* ============================================================
     NOTIFICATIONS
     ============================================================ */
  $("#bellBtn").addEventListener("click", e=>{
    e.stopPropagation();
    $("#notifPanel").classList.toggle("open");
  });
  document.addEventListener("click", e=>{
    if(!e.target.closest(".topbar-actions")) $("#notifPanel").classList.remove("open");
  });

  /* ============================================================
     DOWNLOAD REPORT (frontend mock)
     ============================================================ */
  $("#downloadReportBtn").addEventListener("click", ()=>{
    if(!currentPassenger){ showToast("No report available yet", true); return; }
    const p = currentPassenger;
    const lines = [
      "BORDERSHIELD AI — SCREENING REPORT",
      "=====================================",
      `Generated: ${new Date().toLocaleString()}`,
      `Checkpoint: IGI Airport T3 — Lane 6`,
      `Officer: A. Sharma (IBC-4471-DL)`,
      "-------------------------------------",
      `Passenger Name: ${p.name}`,
      `Nationality: ${p.nationality}`,
      `Passport Number: ${p.passportNo}`,
      `Date of Birth: ${p.dob}`,
      `Passport Expiry: ${p.expiry}`,
      `Visa Type: ${p.visaType}`,
      `Visa Status: ${p.visaStatus}`,
      `Face Match Confidence: ${p.faceMatch}%`,
      `Computed Risk Score: ${p.riskScore} / 100`,
      `Outcome: ${p.riskScore>=70 ? "HIGH RISK — Manual inspection required" : p.riskScore>=30 ? "Secondary review advised" : "Verified — clear to proceed"}`,
      "-------------------------------------",
      "This is a synthetically generated demo report produced by",
      "a Smart India Hackathon prototype. No real government or",
      "biometric systems were accessed to produce this document."
    ].join("\n");

    const blob = new Blob([lines], {type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BorderShield_Report_${p.passportNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Report downloaded");
  });

  /* ============================================================
     INIT
     ============================================================ */
  showLogin();
  seedHistory();
  refreshUploadCount();

})();
