(function () {
  "use strict";
  const e=HMS.escape;
  const getData=()=>HMS.read();
  const badge=(s)=>`<span class="status status-${e(String(s).toLowerCase())}">${e(s)}</span>`;
  function renderAppointments() {
    const user=HMS.currentUser,data=getData();
    const assignedDoctor = user.role === "doctor" ? data.doctors.find(d => d.id === user.doctorId) : null;
    const records=user.role==="doctor"?data.appointments.filter((a)=>a.department===assignedDoctor.department):data.appointments;
    return `<header class="page-heading"><div><span class="eyebrow">SCHEDULING</span><h1>Appointments</h1><p>${user.role==="doctor"?"Your appointment calendar and consultation queue":"Coordinate patient visits across the hospital"}</p></div><div class="heading-actions"><button class="button button-primary" data-action="new-appointment">＋ Book appointment</button></div></header>
    <section class="panel"><div class="toolbar"><div class="search-box"><input id="appointment-search" placeholder="Search patient, doctor or appointment ID" aria-label="Search appointments"></div><select class="control" id="appointment-status-filter"><option value="">All statuses</option>${["Pending","Confirmed","Completed","Cancelled"].map((x)=>`<option>${x}</option>`).join("")}</select><select class="control" id="appointment-doctor-filter"><option value="">All doctors</option>${data.doctors.map((d)=>`<option value="${e(d.id)}">${e(d.name)}</option>`).join("")}</select><input class="control" type="date" id="appointment-date-filter" aria-label="Filter by date"></div><div class="table-wrap"><table><thead><tr><th>Appointment</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Date / time</th><th>Status</th><th>Actions</th></tr></thead><tbody>${appointmentRows(records,data)}</tbody></table></div></section>`;
  }
  function appointmentRows(rows,data) {
    return rows.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).map((a)=>`<tr data-appointment-row data-search="${e([a.id,HMS.patientName(a.patientId,data),HMS.doctorName(a.doctorId,data)].join(" ").toLowerCase())}" data-status="${e(a.status)}" data-doctor="${e(a.doctorId)}" data-date="${e(a.date)}"><td><strong>${e(a.id)}</strong></td><td>${e(HMS.patientName(a.patientId,data))}</td><td>${e(HMS.doctorName(a.doctorId,data))}</td><td>${e(a.department)}</td><td>${e(a.date)}<br><span class="muted">${e(a.time)}</span></td><td>${badge(a.status)}</td><td><div class="action-row"><button data-action="edit-appointment" data-id="${e(a.id)}" aria-label="Edit appointment">✎</button>${HMS.currentUser.role!=="doctor"?`<button data-action="delete-appointment" data-id="${e(a.id)}" aria-label="Delete appointment">×</button>`:""}</div></td></tr>`).join("")||`<tr><td colspan="7" class="empty-state">No appointments found.</td></tr>`;
  }
  function form(record={}) {
    const data=getData(),user=HMS.currentUser;
    const assignedDoctor = user.role === "doctor" ? data.doctors.find(d => d.id === user.doctorId) : null;
    const patientRecords=user.role==="doctor"?data.patients.filter((p)=>p.department===assignedDoctor.department):data.patients;
    const doctorRecords=user.role==="doctor"?data.doctors.filter((d)=>d.department===assignedDoctor.department):data.doctors;
    const pick=(list,key,label,selected,placeholder)=>`<option value="">${placeholder}</option>${list.map((item)=>`<option value="${e(item[key])}" ${selected===item[key]?"selected":""}>${e(item[label])}</option>`).join("")}`;
    const statusOptions=["Pending","Confirmed","Completed","Cancelled"].map((s)=>`<option ${s===(record.status||"Pending")?"selected":""}>${s}</option>`).join("");
    return `<form id="appointment-form"><input type="hidden" name="id" value="${e(record.id||HMS.nextId("appointments"))}"><div class="form-grid">
      <div class="form-field"><label>Patient *</label><select name="patientId" id="appointment-patient" required>${pick(patientRecords,"id","name",record.patientId,"Select patient")}</select></div>
      <div class="form-field"><label>Doctor *</label><select name="doctorId" id="appointment-doctor" required>${pick(doctorRecords,"id","name",record.doctorId||user.doctorId,"Select doctor")}</select></div>
      <div class="form-field"><label>Department *</label><select name="department" id="appointment-department" required>${pick(data.departments,"name","name",record.department||"","Select department")}</select></div>
      <div class="form-field"><label>Date *</label><input name="date" type="date" ${record.id?"":`min="${HMS.today()}"`} value="${e(record.date||HMS.today())}" required></div>
      <div class="form-field"><label>Time *</label><input name="time" type="time" value="${toTime(record.time)||"09:00"}" required></div>
      <div class="form-field"><label>Status</label><select name="status">${statusOptions}</select></div>
    </div><div class="modal-footer"><button type="button" class="button button-secondary" data-close-modal>Cancel</button><button class="button button-primary">Save appointment</button></div></form>`;
  }
  function toTime(value) {
    if(!value)return "";
    const match=value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if(!match)return value;
    let hour=Number(match[1])%12;if(match[3].toUpperCase()==="PM")hour+=12;
    return `${String(hour).padStart(2,"0")}:${match[2]}`;
  }
  function displayTime(value) {
    const [h,m]=value.split(":").map(Number);
    return `${String(h%12||12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
  }
  document.addEventListener("click",(event)=>{
    const button=event.target.closest("[data-action]");if(!button)return;
    const data=getData(),id=button.dataset.id, user=HMS.currentUser,record=data.appointments.find((a)=>a.id===id);
    if(button.dataset.action==="new-appointment")HMSUI.openModal("Book appointment",form());
    if(button.dataset.action==="edit-appointment"&&record&&(user.role!=="doctor"||record.doctorId===user.doctorId))HMSUI.openModal("Edit appointment",form(record));
    if(button.dataset.action==="delete-appointment"&&record&&user.role!=="doctor"&&confirm(`Delete appointment ${id}?`)){HMS.write({...data,appointments:data.appointments.filter((a)=>a.id!==id)});HMSUI.toast("Appointment deleted.");}
  });
  document.addEventListener("change",(event)=>{
    if(event.target.id==="appointment-patient"){
      const p=getData().patients.find((item)=>item.id===event.target.value);
      if(p){const dep=document.getElementById("appointment-department");if(dep)dep.value=p.department;}
    }
    if(event.target.id==="appointment-doctor"){
      const d=getData().doctors.find((item)=>item.id===event.target.value);
      if(d){const dep=document.getElementById("appointment-department");if(dep)dep.value=d.department;}
    }
    if(event.target.matches("#appointment-status-filter,#appointment-doctor-filter,#appointment-date-filter"))filterRows();
  });
  document.addEventListener("input",(event)=>{if(event.target.id==="appointment-search")filterRows();});
  function filterRows(){
    const search=document.getElementById("appointment-search")?.value.toLowerCase()||"";
    const status=document.getElementById("appointment-status-filter")?.value||"";
    const doctor=document.getElementById("appointment-doctor-filter")?.value||"";
    const date=document.getElementById("appointment-date-filter")?.value||"";
    document.querySelectorAll("[data-appointment-row]").forEach((row)=>row.hidden=!(row.dataset.search.includes(search)&&(!status||row.dataset.status===status)&&(!doctor||row.dataset.doctor===doctor)&&(!date||row.dataset.date===date)));
  }
  document.addEventListener("submit",(event)=>{
    const formNode=event.target.closest("#appointment-form");if(!formNode)return;
    event.preventDefault();
    const value=Object.fromEntries(new FormData(formNode).entries()), data=getData(), user=HMS.currentUser;
    const existing=data.appointments.find((a)=>a.id===value.id);
    if(existing&&user.role==="doctor"&&existing.doctorId!==user.doctorId){HMSUI.toast("You can only update your own appointments.",true);return;}
    const patient=data.patients.find((p)=>p.id===value.patientId),doctor=data.doctors.find((d)=>d.id===value.doctorId);
    if(!patient||!doctor){HMSUI.toast("Select a valid patient and doctor.",true);return;}
    if(user.role==="doctor"&&(doctor.id!==user.doctorId||patient.doctorId!==user.doctorId)){HMSUI.toast("You can only schedule visits for your assigned patients.",true);return;}
    const duplicate=data.appointments.find((a)=>a.id!==value.id&&a.doctorId===doctor.id&&a.date===value.date&&a.time===displayTime(value.time)&&a.status!=="Cancelled");
    if(duplicate){HMSUI.toast("This doctor already has an appointment at that time.",true);return;}
    const record={...value,time:displayTime(value.time),department:doctor.department};
    const appointments=existing?data.appointments.map((a)=>a.id===record.id?record:a):[record,...data.appointments];
    try{HMS.write({...data,appointments});HMSUI.closeModal();HMSUI.toast(`Appointment ${existing?"updated":"booked"} successfully.`);}
    catch(error){HMSUI.toast(error.message,true);}
  });
  window.HMSRenderAppointments=renderAppointments;
  window.addEventListener("hms:data-change",()=>{if(document.body.dataset.page==="appointments"){const root=document.getElementById("page-content");if(root)root.innerHTML=renderAppointments();}});
})();
