(function () {
  "use strict";
  const h = (value) => HMS.escape(value);
  const person = (name) => `<span class="person-cell"><span class="mini-avatar">${h(HMS.initials(name))}</span>${h(name)}</span>`;
  const badge = (status) => `<span class="status status-${h(String(status).toLowerCase())}">${h(status)}</span>`;
  function renderDashboard({ page, user }) {
    const data = HMS.read();
    const admin = user.role === "admin";
    const doctor = user.role === "doctor";
    const patientRole = user.role === "patient";
    const assignedDoctor = doctor ? data.doctors.find((item) => item.id === user.doctorId) : null;
    const assignedPatient = patientRole ? data.patients.find(item => item.id === user.patientId) : null;
    const patients = doctor ? data.patients.filter((p) => p.department === assignedDoctor?.department) : patientRole ? [assignedPatient].filter(Boolean) : data.patients;
    const appointments = doctor ? data.appointments.filter((a) => a.department === assignedDoctor?.department) : patientRole ? data.appointments.filter(a => a.patientId === user.patientId) : data.appointments;
    const prescriptions = doctor ? data.prescriptions.filter((p) => p.department === assignedDoctor?.department) : patientRole ? data.prescriptions.filter(p => p.patientId === user.patientId) : data.prescriptions;
    const todayAppointments = appointments.filter((a) => a.date === HMS.today());
    const upcoming = appointments.filter((a) => a.date >= HMS.today() && !["Completed","Cancelled"].includes(a.status));
    const completed = appointments.filter((a) => a.status === "Completed");
    const title = patientRole ? "Your Patient Portal" : doctor ? "Your clinical overview" : page === "reception" ? "Reception overview" : "Hospital overview";
    const subtitle = patientRole ? "Welcome to your MediCare health dashboard." : doctor ? `${assignedDoctor?.department || ""} · ${assignedDoctor?.specialization || ""}` : page === "reception" ? "Patient registrations and today's front desk schedule." : "Here is what's happening across your hospital today.";
    const stats = patientRole ? [
      ["My Appointments",appointments.length,"Total bookings","▦"],
      ["Upcoming",upcoming.length,"Next visits","◷"],
      ["Prescriptions",prescriptions.length,"Your records","▤"]
    ] : doctor ? [
      ["My Patients",patients.length,"Currently under your care","♙"],
      ["Today's Appointments",todayAppointments.length,"Your schedule today","▦"],
      ["Upcoming",upcoming.length,"Active future bookings","◷"],
      ["Completed",completed.length,"Consultations completed","✓"],
      ["My Prescriptions",prescriptions.length,"Prescriptions on record","▤"],
      ["Department",assignedDoctor?.department || "—",assignedDoctor?.specialization || "Clinical team","✚"]
    ] : page === "reception" ? [
      ["Total Patients",data.patients.length,"Registered in demo records","♙"],
      ["Today's Appointments",todayAppointments.length,"Scheduled for today","▦"],
      ["Pending Appointments",appointments.filter((a) => a.status === "Pending").length,"Awaiting confirmation","◷"],
      ["Doctors on roster",data.doctors.length,"Active care team","✚"],
      ["Departments",data.departments.length,"Clinical services","⌂"],
      ["New this month",data.patients.filter((p) => p.registrationDate.slice(0,7) === HMS.today().slice(0,7)).length,"Patient registrations","↗"]
    ] : [
      ["Total Patients",data.patients.length,"Across all departments","♙"],
      ["Total Doctors",data.doctors.length,"Care team members","✚"],
      ["Departments",data.departments.length,"Clinical services","⌂"],
      ["Today's Appointments",todayAppointments.length,"Scheduled for today","▦"],
      ["Prescriptions",data.prescriptions.length,"Saved in the system","▤"],
      ["Pending Appointments",data.appointments.filter((a) => a.status === "Pending").length,"Need confirmation","◷"]
    ];
    const appointmentRows = appointments.filter((a) => doctor || patientRole || a.date >= HMS.today()).slice(0,5);
    const recentPatients = patients.slice().sort((a,b) => b.registrationDate.localeCompare(a.registrationDate)).slice(0,5);
    const departments = data.departments;
    const appointmentCalendar = (doctor || patientRole) ? calendarMarkup(appointments) : "";
    return `
      <header class="page-heading"><div><span class="eyebrow">${patientRole ? "PATIENT WORKSPACE" : admin ? "ADMINISTRATION" : doctor ? "DOCTOR WORKSPACE" : "FRONT DESK"}</span><h1>${h(title)}</h1><p>${h(subtitle)}</p></div>
      <div class="heading-actions">${doctor ? `<span class="button button-secondary">${h(assignedDoctor?.name || user.name)}</span>` : ""}${patientRole ? `<span class="button button-secondary">${h(assignedPatient?.name || user.name)}</span>` : ""}<a class="button button-primary" href="${doctor ? "prescriptions.html" : "appointments.html"}">${doctor ? "＋ New prescription" : "＋ Book appointment"}</a></div></header>
      <section class="grid stat-grid">${stats.map(([label,value,foot,icon]) => `<article class="stat-card"><div class="stat-top"><span>${h(label)}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${h(value)}</div><div class="stat-foot">${h(foot)}</div></article>`).join("")}</section>
      ${admin ? `<section class="grid content-grid"><article class="panel"><div class="panel-heading"><div><h3>Patient growth</h3><p>New patient registrations · last 6 months</p></div><div class="legend"><span>Patients</span></div></div><div class="chart-wrap"><canvas id="growth-chart" aria-label="Patient registrations trend"></canvas></div></article><article class="panel"><div class="panel-heading"><div><h3>Department activity</h3><p>Patients by department</p></div></div><div class="dept-list">${departments.map((dep) => {const count=data.patients.filter((p)=>p.department===dep.name).length;const pct=Math.max(5,Math.round(count/Math.max(data.patients.length,1)*100));return `<div class="dept-row"><span>${h(dep.name)}</span><span class="dept-bar"><span style="width:${pct}%"></span></span><span class="dept-count">${count}</span></div>`}).join("")}</div></article></section>` : `<section class="grid content-grid"><article class="panel"><div class="panel-heading"><div><h3>${doctor ? "Today's schedule" : "Quick actions"}</h3><p>${doctor ? h(assignedDoctor?.department || "Appointments") : "Common front desk tasks"}</p></div></div>${doctor ? `<div class="list-cards">${todayAppointments.slice(0,5).map((a)=>`<div class="activity-row"><div class="activity-main"><span class="stat-icon">◷</span><span><strong>${h(HMS.patientName(a.patientId,data))}</strong><small>${h(a.time)} · ${h(a.department)}</small></span></div>${badge(a.status)}</div>`).join("") || `<p class="empty-state">No appointments scheduled for today.</p>`}</div>` : `<div class="quick-actions"><a class="button button-primary" href="patients.html">＋ Register patient</a><a class="button button-secondary" href="appointments.html">▦ Book appointment</a><a class="button button-secondary" href="patients.html">⌕ Find patient</a></div>`}</article><article class="panel"><div class="panel-heading"><div><h3>${doctor ? "Doctor profile" : "Front desk note"}</h3><p>${doctor ? "Your account and department" : "A quick reminder"}</p></div></div>${doctor ? `<div class="list-cards"><div class="activity-row"><span class="muted">Doctor ID</span><strong>${h(assignedDoctor?.id)}</strong></div><div class="activity-row"><span class="muted">Department</span><strong>${h(assignedDoctor?.department)}</strong></div><div class="activity-row"><span class="muted">Specialization</span><strong>${h(assignedDoctor?.specialization)}</strong></div><div class="activity-row"><span class="muted">Consultation hours</span><strong>${h(assignedDoctor?.timing)}</strong></div></div>` : `<p class="muted" style="line-height:1.8">Keep patient records accurate and confirm appointment details with patients. Demo records are stored in this browser only.</p>`}</article></section>`}
      <section class="grid content-grid"><article class="panel table-panel" style="${patientRole ? 'display:none;' : ''}"><div class="panel-heading"><div><h3>${admin ? "Recently registered patients" : doctor ? "My patients" : "Patient directory"}</h3><p>${doctor ? "Only patients assigned to your doctor account" : "Latest activity across the hospital"}</p></div><a class="text-button" href="patients.html">View all →</a></div><div class="table-wrap"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Department</th><th>Registered</th></tr></thead><tbody>${recentPatients.map((p)=>`<tr><td>${person(p.name)}</td><td>${h(p.id)}</td><td>${h(p.department)}</td><td>${h(p.registrationDate)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty-state">No patient records yet.</td></tr>`}</tbody></table></div></article><article class="panel table-panel"><div class="panel-heading"><div><h3>${patientRole ? "My upcoming appointments" : doctor ? "My appointments" : "Recent appointments"}</h3><p>${patientRole ? "Your visits" : doctor ? "Your upcoming and recent visits" : "Upcoming appointment schedule"}</p></div><a class="text-button" href="appointments.html">View all →</a></div><div class="table-wrap"><table><thead><tr><th>${patientRole ? "Doctor" : "Patient"}</th><th>Date / time</th><th>Status</th></tr></thead><tbody>${appointmentRows.map((a)=>`<tr><td>${person(patientRole ? HMS.doctorName(a.doctorId,data) : HMS.patientName(a.patientId,data))}</td><td>${h(a.date)} · ${h(a.time)}</td><td>${badge(a.status)}</td></tr>`).join("") || `<tr><td colspan="3" class="empty-state">No appointments to display.</td></tr>`}</tbody></table></div></article></section>
      ${(doctor || patientRole) ? `<section class="grid content-grid"><article class="panel table-panel"><div class="panel-heading"><div><h3>My prescriptions</h3><p>${patientRole ? "Your prescription records" : "Your recent patient prescriptions"}</p></div><a class="text-button" href="prescriptions.html">View all →</a></div><div class="table-wrap"><table><thead><tr><th>Prescription ID</th><th>${patientRole ? "Doctor" : "Patient"}</th><th>Date</th><th>Diagnosis</th></tr></thead><tbody>${prescriptions.slice(0,4).map((p)=>`<tr><td>${h(p.id)}</td><td>${h(patientRole ? HMS.doctorName(p.doctorId,data) : HMS.patientName(p.patientId,data))}</td><td>${h(p.date)}</td><td>${h(p.diagnosis)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty-state">No prescriptions available yet.</td></tr>`}</tbody></table></div></article><article class="panel" style="${patientRole ? 'display:none;' : ''}"><div class="panel-heading"><div><h3>Patient history</h3><p>Recent notes from your assigned patients</p></div></div><div class="list-cards">${patients.slice(0,4).map((p)=>`<div class="activity-row"><div class="activity-main">${person(p.name)}<small>${h(p.history || "No history recorded")}</small></div><small>${h(p.id)}</small></div>`).join("") || `<p class="empty-state">No patient history found.</p>`}</div></article></section><section class="panel"><div class="panel-heading"><div><h3>Appointment calendar</h3><p>Your monthly appointment overview</p></div><a class="text-button" href="appointments.html">Open appointments →</a></div>${appointmentCalendar}</section>` : ""}
      ${admin ? `<section class="grid content-grid"><article class="panel"><div class="panel-heading"><div><h3>Doctor activity</h3><p>Current care team and departments</p></div><a class="text-button" href="doctors.html">Manage doctors →</a></div><div class="list-cards">${data.doctors.slice(0,5).map((d)=>`<div class="activity-row"><div class="activity-main"><span class="mini-avatar">${h(HMS.initials(d.name))}</span><span><strong>${h(d.name)}</strong><small>${h(d.specialization)} · ${h(d.department)}</small></span></div>${badge(d.status || "Active")}</div>`).join("")}</div></article><article class="panel"><div class="panel-heading"><div><h3>Quick actions</h3><p>Frequently used administration tasks</p></div></div><div class="quick-actions"><a class="button button-primary" href="patients.html">＋ Add patient</a><a class="button button-secondary" href="doctors.html">＋ Add doctor</a><a class="button button-secondary" href="appointments.html">▦ Book appointment</a><a class="button button-secondary" href="departments.html">⌂ Departments</a></div></article></section>` : ""}`;
  }
  function calendarMarkup(appointments) {
    const now=new Date(),year=now.getFullYear(),month=now.getMonth(),first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
    const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const booked=new Set(appointments.filter((a)=>a.date.slice(0,7)===`${year}-${String(month+1).padStart(2,"0")}`&&a.status!=="Cancelled").map((a)=>Number(a.date.slice(-2))));
    const cells=Array(first).fill(`<span class="calendar-empty"></span>`);
    for(let day=1;day<=days;day++){
      const isToday=day===now.getDate(),hasAppointment=booked.has(day);
      cells.push(`<span class="calendar-day ${isToday?"today":""} ${hasAppointment?"has-appointment":""}" title="${hasAppointment?"Appointment scheduled":""}">${day}${hasAppointment?`<i></i>`:""}</span>`);
    }
    return `<div class="calendar-grid">${names.map((name)=>`<span class="calendar-weekday">${name}</span>`).join("")}${cells.join("")}</div>`;
  }
  function drawChart() {
    const canvas = document.getElementById("growth-chart");
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, box.width * ratio);
    canvas.height = Math.max(1, box.height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    const w = box.width, h = box.height, data = HMS.read();
    const values = Array.from({length:6}, (_, i) => {
      const date = new Date(); date.setMonth(date.getMonth() - (5-i));
      const key = date.toISOString().slice(0,7);
      return data.patients.filter((p)=>p.registrationDate.slice(0,7)===key).length;
    });
    const max = Math.max(...values, 4), padding = {left:26,right:12,top:20,bottom:25}, chartH = h-padding.top-padding.bottom, chartW = w-padding.left-padding.right;
    ctx.font = "10px DM Sans"; ctx.textAlign = "right"; ctx.fillStyle = "#9aa6b6"; ctx.strokeStyle = "#edf1f5";
    for(let i=0;i<4;i++){const y=padding.top+chartH*i/3;ctx.beginPath();ctx.moveTo(padding.left,y);ctx.lineTo(w-padding.right,y);ctx.stroke();ctx.fillText(String(Math.round(max*(3-i)/3)),padding.left-7,y+3);}
    const points = values.map((v,i)=>({x:padding.left+chartW*i/5,y:padding.top+chartH-(v/max)*chartH}));
    const gradient=ctx.createLinearGradient(0,padding.top,0,h-padding.bottom);gradient.addColorStop(0,"rgba(36,107,206,.2)");gradient.addColorStop(1,"rgba(36,107,206,0)");
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(points[points.length-1].x,h-padding.bottom);ctx.lineTo(points[0].x,h-padding.bottom);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle="#246bce";ctx.lineWidth=2.5;ctx.stroke();
    points.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#246bce";ctx.lineWidth=2;ctx.stroke();const date=new Date();date.setMonth(date.getMonth()-(5-i));ctx.fillStyle="#8996a7";ctx.textAlign="center";ctx.fillText(date.toLocaleString(undefined,{month:"short"}),p.x,h-6);});
  }
  window.HMSRenderDashboard = renderDashboard;
  window.HMSDrawChart = drawChart;
})();
