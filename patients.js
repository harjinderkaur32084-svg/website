(function () {
  "use strict";
  const e = HMS.escape;
  const tablePerson = (name) => `<span class="person-cell"><span class="mini-avatar">${e(HMS.initials(name))}</span>${e(name)}</span>`;
  const status = (value) => `<span class="status status-${e(String(value).toLowerCase())}">${e(value)}</span>`;
  function renderPatients() {
    const user=HMS.currentUser, data=HMS.read(), role=user.role;
    const assignedDoctor = role === "doctor" ? data.doctors.find(d => d.id === user.doctorId) : null;
    const records=role==="doctor"?data.patients.filter((p)=>p.department===assignedDoctor.department):data.patients;
    return `<header class="page-heading"><div><span class="eyebrow">CARE RECORDS</span><h1>Patients</h1><p>${role==="doctor"?"Patients assigned to your care":"Search, register, and manage hospital patient records"}</p></div><div class="heading-actions">${role!=="doctor"?`<button class="button button-primary" data-action="new-patient">＋ Register patient</button>`:""}</div></header>
    <section class="panel"><div class="toolbar"><div class="search-box"><input id="patient-search" placeholder="Search name, ID, phone or email" aria-label="Search patients"></div><select class="control" id="patient-doctor-filter"><option value="">All doctors</option>${data.doctors.map((d)=>`<option value="${e(d.id)}">${e(d.name)}</option>`).join("")}</select><select class="control" id="patient-department-filter"><option value="">All departments</option>${data.departments.map((d)=>`<option value="${e(d.name)}">${e(d.name)}</option>`).join("")}</select></div>
    <div class="table-wrap"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Age / gender</th><th>Assigned doctor</th><th>Department</th><th>Registered</th><th>Actions</th></tr></thead><tbody id="patient-rows">${patientRows(records,data,role)}</tbody></table></div></section>`;
  }
  function patientRows(rows,data,role) {
    return rows.map((p)=>`<tr data-record-row data-search="${e([p.name,p.id,p.phone,p.email].join(" ").toLowerCase())}" data-doctor="${e(p.doctorId)}" data-department="${e(p.department)}"><td>${tablePerson(p.name)}</td><td>${e(p.id)}</td><td>${e(p.age)} · ${e(p.gender)}</td><td>${e(HMS.doctorName(p.doctorId,data))}</td><td>${e(p.department)}</td><td>${e(p.registrationDate)}</td><td><div class="action-row"><button data-action="view-patient" data-id="${e(p.id)}" title="View details" aria-label="View patient details">◉</button>${role!=="doctor"?`<button data-action="edit-patient" data-id="${e(p.id)}" title="Edit patient" aria-label="Edit patient">✎</button>`:""}${role==="admin"?`<button data-action="delete-patient" data-id="${e(p.id)}" title="Delete patient" aria-label="Delete patient">×</button>`:""}</div></td></tr>`).join("") || `<tr><td colspan="7" class="empty-state">No matching patients found.</td></tr>`;
  }
  function patientForm(p={}) {
    const data=HMS.read();
    const f=(label,name,value="",type="text",required=false)=>`<div class="form-field"><label for="f-${name}">${label}${required?" *":""}</label><input id="f-${name}" name="${name}" type="${type}" value="${e(value)}" ${required?"required":""}></div>`;
    const select=(label,name,opts,value,required=false)=>`<div class="form-field"><label for="f-${name}">${label}${required?" *":""}</label><select id="f-${name}" name="${name}" ${required?"required":""}>${opts(value)}</select></div>`;
    return `<form id="record-form" data-kind="patient"><div class="form-grid">
      <div class="form-field"><label for="f-id">Patient ID *</label><input id="f-id" name="id" value="${e(p.id||HMS.nextId("patients"))}" readonly required></div>
      ${f("Full name","name",p.name||"","text",true)}
      ${f("Age","age",p.age??"","number",true)}
      ${select("Gender","gender",(v)=>`<option value="">Select…</option>${["Female","Male","Other"].map((x)=>`<option ${x===v?"selected":""}>${x}</option>`).join("")}`,p.gender,true)}
      ${f("Phone number","phone",p.phone||"","tel",true)}
      ${f("Email","email",p.email||"","email")}
      ${f("Blood group","bloodGroup",p.bloodGroup||"")}
      ${f("Registration date","registrationDate",p.registrationDate||HMS.today(),"date",true)}
      ${select("Assigned doctor","doctorId",(v)=>doctorOptions(v),p.doctorId,true)}
      ${select("Department","department",(v)=>`<option value="">Select…</option>${data.departments.map((d)=>`<option value="${e(d.name)}" ${d.name===v?"selected":""}>${e(d.name)}</option>`).join("")}`,p.department,true)}
      <div class="form-field full"><label for="f-address">Address</label><input id="f-address" name="address" value="${e(p.address||"")}"></div>
      <div class="form-field"><label for="f-history">Medical history</label><textarea id="f-history" name="history">${e(p.history||"")}</textarea></div>
      <div class="form-field"><label for="f-allergies">Allergies</label><textarea id="f-allergies" name="allergies">${e(p.allergies||"")}</textarea></div>
    </div><div class="modal-footer"><button type="button" class="button button-secondary" data-close-modal>Cancel</button><button class="button button-primary" type="submit">Save patient</button></div></form>`;
  }
  function doctorOptions(selected) {
    return `<option value="">Select doctor</option>${HMS.read().doctors.map((d)=>`<option value="${e(d.id)}" ${d.id===selected?"selected":""}>${e(d.name)}</option>`).join("")}`;
  }
  function departmentOptions(selected) {
    return `<option value="">Select department</option>${HMS.read().departments.map((d)=>`<option value="${e(d.name)}" ${d.name===selected?"selected":""}>${e(d.name)}</option>`).join("")}`;
  }
  function openPatient(id) {
    const p=HMS.read().patients.find((x)=>x.id===id); if(!p)return;
    const data=HMS.read();
    HMSUI.openModal(`Patient profile · ${p.id}`,`<div class="form-grid"><div class="form-field"><label>Full name</label><p>${e(p.name)}</p></div><div class="form-field"><label>Patient ID</label><p>${e(p.id)}</p></div><div class="form-field"><label>Age / gender</label><p>${e(p.age)} · ${e(p.gender)}</p></div><div class="form-field"><label>Blood group</label><p>${e(p.bloodGroup||"Not recorded")}</p></div><div class="form-field"><label>Phone</label><p>${e(p.phone)}</p></div><div class="form-field"><label>Email</label><p>${e(p.email||"Not recorded")}</p></div><div class="form-field"><label>Assigned doctor</label><p>${e(HMS.doctorName(p.doctorId,data))}</p></div><div class="form-field"><label>Department</label><p>${e(p.department)}</p></div><div class="form-field full"><label>Address</label><p>${e(p.address||"Not recorded")}</p></div><div class="form-field"><label>Medical history</label><p>${e(p.history||"None recorded")}</p></div><div class="form-field"><label>Allergies</label><p>${e(p.allergies||"None recorded")}</p></div></div>`);
  }
  function renderDoctors() {
    const data=HMS.read();
    return `<header class="page-heading"><div><span class="eyebrow">CARE TEAM</span><h1>Doctors</h1><p>Manage clinician profiles, departments, and demo account credentials</p></div><div class="heading-actions"><button class="button button-primary" data-action="new-doctor">＋ Add doctor</button></div></header><section class="panel"><div class="toolbar"><div class="search-box"><input id="doctor-search" placeholder="Search doctors, specialty or ID" aria-label="Search doctors"></div><select class="control" id="doctor-department-filter"><option value="">All departments</option>${data.departments.map((d)=>`<option>${e(d.name)}</option>`).join("")}</select></div><div class="table-wrap"><table><thead><tr><th>Doctor</th><th>Doctor ID</th><th>Specialization</th><th>Department</th><th>Consultation hours</th><th>Email / phone</th><th>Status</th><th>Actions</th></tr></thead><tbody id="doctor-rows">${doctorRows(data.doctors)}</tbody></table></div></section>`;
  }
  function doctorRows(rows) {
    return rows.map((d)=>`<tr data-record-row data-search="${e([d.name,d.id,d.specialization,d.email].join(" ").toLowerCase())}" data-department="${e(d.department)}"><td>${tablePerson(d.name)}</td><td>${e(d.id)}</td><td>${e(d.specialization)}</td><td>${e(d.department)}</td><td>${e(d.timing)}</td><td>${e(d.email)}<br>${e(d.phone)}</td><td>${status(d.status||"Active")}</td><td><div class="action-row"><button data-action="edit-doctor" data-id="${e(d.id)}" aria-label="Edit doctor">✎</button><button data-action="delete-doctor" data-id="${e(d.id)}" aria-label="Delete doctor">×</button></div></td></tr>`).join("")||`<tr><td colspan="8" class="empty-state">No doctors found.</td></tr>`;
  }
  function doctorForm(d={}) {
    const data=HMS.read();
    return `<form id="record-form" data-kind="doctor"><div class="form-grid">
      <div class="form-field"><label>Doctor ID *</label><input name="id" value="${e(d.id||HMS.nextId("doctors"))}" ${d.id?"readonly":""} required></div>
      <div class="form-field"><label>Full name *</label><input name="name" value="${e(d.name||"")}" required></div>
      <div class="form-field"><label>Email *</label><input type="email" name="email" value="${e(d.email||"")}" required></div>
      <div class="form-field"><label>Phone number *</label><input type="tel" name="phone" value="${e(d.phone||"")}" required></div>
      <div class="form-field"><label>Specialization *</label><input name="specialization" value="${e(d.specialization||"")}" required></div>
      <div class="form-field"><label>Department *</label><select name="department" required>${departmentOptions(d.department)}</select></div>
      <div class="form-field"><label>Consultation timing *</label><input name="timing" placeholder="09:00 AM – 05:00 PM" value="${e(d.timing||"")}" required></div>
      <div class="form-field"><label>Status</label><select name="status"><option ${!d.status||d.status==="Active"?"selected":""}>Active</option><option ${d.status==="Inactive"?"selected":""}>Inactive</option></select></div>
      <div class="form-field full"><div class="secure-card"><strong>Demo login credentials</strong>Username is the email address above. Password is <b>doctor123</b>. This is a demo-only shared default; production authentication must be handled securely by your backend.</div></div>
    </div><div class="modal-footer"><button type="button" class="button button-secondary" data-close-modal>Cancel</button><button class="button button-primary">Save doctor</button></div></form>`;
  }
  function renderDepartments() {
    const data=HMS.read();
    return `<header class="page-heading"><div><span class="eyebrow">HOSPITAL STRUCTURE</span><h1>Departments</h1><p>Organize your clinical services and department leads</p></div><div class="heading-actions"><button class="button button-primary" data-action="new-department">＋ Add department</button></div></header><section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">${data.departments.map((d)=>`<article class="panel"><div class="panel-heading"><span class="stat-icon">✚</span><div class="action-row"><button data-action="edit-department" data-id="${e(d.id)}" aria-label="Edit department">✎</button><button data-action="delete-department" data-id="${e(d.id)}" aria-label="Delete department">×</button></div></div><h3>${e(d.name)}</h3><p class="muted" style="font-size:11px">Department lead · ${e(d.head||"To be assigned")}</p><div class="activity-row"><span class="muted">Patients</span><strong>${data.patients.filter((p)=>p.department===d.name).length}</strong></div><div class="activity-row"><span class="muted">Doctors</span><strong>${data.doctors.filter((x)=>x.department===d.name).length}</strong></div></article>`).join("")}</section>`;
  }
  function departmentForm(d={}) {
    const options=HMS.read().doctors;
    return `<form id="record-form" data-kind="department"><div class="form-grid"><div class="form-field"><label>Department ID *</label><input name="id" value="${e(d.id||HMS.nextId("departments"))}" ${d.id?"readonly":""} required></div><div class="form-field"><label>Department name *</label><input name="name" value="${e(d.name||"")}" required></div><div class="form-field"><label>Department head</label><select name="head"><option value="">Select head</option>${options.map((doc)=>`<option value="${e(doc.name)}" ${doc.name===d.head?"selected":""}>${e(doc.name)}</option>`).join("")}</select></div><div class="form-field"><label>Rooms</label><input name="rooms" type="number" min="0" value="${e(d.rooms??1)}"></div></div><div class="modal-footer"><button type="button" class="button button-secondary" data-close-modal>Cancel</button><button class="button button-primary">Save department</button></div></form>`;
  }
  function renderDirectory(page) {
    if(page==="patients")return renderPatients();
    if(page==="doctors")return renderDoctors();
    if(page==="departments")return renderDepartments();
    return "";
  }
  function refresh() {
    const root=document.getElementById("page-content");
    if(root) root.innerHTML=renderDirectory(document.body.dataset.page);
  }
  function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  function onClick(event) {
    const button=event.target.closest("[data-action]"); if(!button)return;
    const data=HMS.read(), id=button.dataset.id, action=button.dataset.action;
    const patient=data.patients.find((p)=>p.id===id), doctor=data.doctors.find((d)=>d.id===id), dep=data.departments.find((d)=>d.id===id);
    if(action==="new-patient"||action==="edit-patient") HMSUI.openModal(action==="new-patient"?"Register patient":"Edit patient",patientForm(action==="edit-patient"?patient||{}:{}));
    if(action==="view-patient") openPatient(id);
    if(action==="delete-patient"&&confirm(`Delete patient ${patient?.name||id}? This also removes their linked appointments and prescriptions.`)) {
      HMS.write({...data,patients:data.patients.filter((p)=>p.id!==id),appointments:data.appointments.filter((a)=>a.patientId!==id),prescriptions:data.prescriptions.filter((p)=>p.patientId!==id)}); refresh(); HMSUI.toast("Patient and linked demo records deleted.");
    }
    if(action==="new-doctor"||action==="edit-doctor") HMSUI.openModal(action==="new-doctor"?"Add doctor":"Edit doctor",doctorForm(action==="edit-doctor"?doctor||{}:{}));
    if(action==="delete-doctor"&&confirm(`Delete ${doctor?.name||id}? Existing patients will be marked unassigned.`)) {
      HMS.write({...data,doctors:data.doctors.filter((d)=>d.id!==id),patients:data.patients.map((p)=>p.doctorId===id?{...p,doctorId:""}:p),appointments:data.appointments.map((a)=>a.doctorId===id?{...a,doctorId:""}:a)});refresh();HMSUI.toast("Doctor deleted. Existing patient and appointment history was retained.");
    }
    if(action==="new-department"||action==="edit-department") HMSUI.openModal(action==="new-department"?"Add department":"Edit department",departmentForm(action==="edit-department"?dep||{}:{}));
    if(action==="delete-department") {
      if(data.patients.some((p)=>p.department===dep?.name)||data.doctors.some((d)=>d.department===dep?.name)) { HMSUI.toast("Reassign this department's patients and doctors before deleting it.",true); return; }
      if(confirm(`Delete department ${dep?.name||id}?`)){HMS.write({...data,departments:data.departments.filter((d)=>d.id!==id)});refresh();HMSUI.toast("Department deleted.");}
    }
  }
  function onSubmit(event) {
    const form=event.target.closest("#record-form"); if(!form)return;
    event.preventDefault();
    const values=formObject(form), data=HMS.read(), kind=form.dataset.kind, editing=Boolean(data[kind+"s"]?.some((item)=>item.id===values.id));
    const collection={patient:"patients",doctor:"doctors",department:"departments"}[kind];
    if(!collection)return;
    if(data[collection].some((item)=>item.id===values.id && !editing)){HMSUI.toast(`${kind} ID is already in use.`,true);return;}
    if(kind==="doctor"&&data.doctors.some((item)=>item.email.toLowerCase()===values.email.toLowerCase()&&item.id!==values.id)){HMSUI.toast("That email address is already assigned to a doctor.",true);return;}
    if(kind==="department"&&data.departments.some((item)=>item.name.toLowerCase()===values.name.trim().toLowerCase()&&item.id!==values.id)){HMSUI.toast("A department with that name already exists.",true);return;}
    let next={...data};
    if(kind==="patient"){
      const age=Number(values.age);
      if(!Number.isInteger(age)||age<0||age>130){HMSUI.toast("Enter a valid patient age between 0 and 130.",true);return;}
      const selectedDoctor=data.doctors.find((d)=>d.id===values.doctorId);
      const record={...values,age,department:selectedDoctor?.department||values.department};
      next.patients=editing?data.patients.map((p)=>p.id===record.id?record:p):[record,...data.patients];
    } else if(kind==="doctor"){
      const previous=data.doctors.find((d)=>d.id===values.id);
      const record={...values,status:values.status||"Active",username:values.email};
      next.doctors=editing?data.doctors.map((d)=>d.id===record.id?record:d):[record,...data.doctors];
      next.patients=data.patients.map((p)=>p.doctorId===record.id?{...p,department:record.department}:p);
      next.appointments=data.appointments.map((a)=>a.doctorId===record.id?{...a,department:record.department}:a);
      if(previous&&previous.name!==record.name)next.departments=data.departments.map((dep)=>dep.head===previous.name?{...dep,head:record.name}:dep);
    } else {
      const old=editing?data.departments.find((d)=>d.id===values.id):null;
      const record={...values,rooms:Number(values.rooms)||0,head:values.head||""};
      next.departments=editing?data.departments.map((d)=>d.id===record.id?record:d):[record,...data.departments];
      if(old&&old.name!==record.name){
        next.doctors=data.doctors.map((d)=>d.department===old.name?{...d,department:record.name}:d);
        next.patients=data.patients.map((p)=>p.department===old.name?{...p,department:record.name}:p);
        next.appointments=data.appointments.map((a)=>a.department===old.name?{...a,department:record.name}:a);
        next.prescriptions=data.prescriptions.map((p)=>p.department===old.name?{...p,department:record.name}:p);
      }
    }
    try{HMS.write(next);HMSUI.closeModal();refresh();HMSUI.toast(`${kind[0].toUpperCase()+kind.slice(1)} ${editing?"updated":"added"} successfully.`);}
    catch(error){HMSUI.toast(error.message,true);}
  }
  document.addEventListener("click",onClick);
  document.addEventListener("submit",onSubmit);
  document.addEventListener("input",(event)=>{
    if(event.target.matches("#patient-search,#patient-doctor-filter,#patient-department-filter,#doctor-search,#doctor-department-filter")){
      const patientSearch=document.getElementById("patient-search");
      const docSearch=document.getElementById("doctor-search");
      const search=(patientSearch||docSearch)?.value.toLowerCase()||"";
      const doctorFilter=document.getElementById("patient-doctor-filter")?.value||"";
      const deptFilter=document.getElementById("patient-department-filter")?.value||document.getElementById("doctor-department-filter")?.value||"";
      document.querySelectorAll("[data-record-row]").forEach((row)=>{row.hidden=!(row.dataset.search.includes(search)&&(!doctorFilter||row.dataset.doctor===doctorFilter)&&(!deptFilter||row.dataset.department===deptFilter));});
    }
  });
  document.addEventListener("change",(event)=>{
    if(event.target.matches("#patient-doctor-filter,#patient-department-filter,#doctor-department-filter"))event.target.dispatchEvent(new Event("input",{bubbles:true}));
    if(event.target.matches('#record-form[data-kind="patient"] [name="doctorId"]')){
      const doctor=HMS.read().doctors.find((item)=>item.id===event.target.value);
      if(doctor)document.querySelector('#record-form[data-kind="patient"] [name="department"]').value=doctor.department;
    }
    if(event.target.matches('#record-form[data-kind="patient"] [name="department"]')){
      const form=event.target.closest("form"),doctor=HMS.read().doctors.find((item)=>item.id===form.elements.doctorId.value);
      if(doctor&&doctor.department!==event.target.value)form.elements.doctorId.value="";
    }
  });
  window.HMSRenderDirectory=renderDirectory;
  window.addEventListener("hms:data-change",()=>{if(["patients","doctors","departments"].includes(document.body.dataset.page)){const root=document.getElementById("page-content");if(root)root.innerHTML=renderDirectory(document.body.dataset.page);}});
})();
