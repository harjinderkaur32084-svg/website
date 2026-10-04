(function () {
  "use strict";
  const e=HMS.escape;
  function visibleRecords(data,user) {
    if (user.role !== "doctor") return data.prescriptions;
    const assignedDoctor = data.doctors.find(d => d.id === user.doctorId);
    return data.prescriptions.filter((p)=>p.department===assignedDoctor.department);
  }
  function renderPrescriptions() {
    const data=HMS.read(),user=HMS.currentUser,records=visibleRecords(data,user);
    const assignedDoctor = user.role === "doctor" ? data.doctors.find(d => d.id === user.doctorId) : null;
    const doctors=user.role==="doctor"?data.doctors.filter((d)=>d.department===assignedDoctor.department):data.doctors;
    const patients=user.role==="doctor"?data.patients.filter((p)=>p.department===assignedDoctor.department):data.patients;
    return `<header class="page-heading"><div><span class="eyebrow">CLINICAL DOCUMENTS</span><h1>Prescriptions</h1><p>${user.role==="doctor"?"Create care plans and review your previous prescriptions":"View prescription records from across the hospital"}</p></div>${user.role==="doctor"?`<div class="heading-actions"><a class="button button-secondary" href="patients.html">View my patients</a></div>`:""}</header>
    ${user.role==="doctor"?`<section class="panel" style="margin-bottom:18px"><div class="panel-heading"><div><h3>Create a prescription</h3><p>Complete the clinical details, then save or download a branded PDF.</p></div><span class="stat-icon">▤</span></div>${prescriptionForm(doctors,patients,data)}</section>`:""}
    <section class="panel table-panel"><div class="panel-heading"><div><h3>Previous prescriptions</h3><p>${records.length} record${records.length===1?"":"s"} available to this account</p></div><div class="search-box" style="max-width:240px"><input id="prescription-search" placeholder="Search patient or ID" aria-label="Search prescriptions"></div></div><div class="table-wrap"><table><thead><tr><th>Prescription ID</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Diagnosis</th><th>Date</th><th>Actions</th></tr></thead><tbody>${prescriptionRows(records,data)}</tbody></table></div></section>`;
  }
  function prescriptionForm(doctors,patients,data) {
    const user=HMS.currentUser;
    const options=(items,id,label,selected,placeholder)=>`<option value="">${placeholder}</option>${items.map((x)=>`<option value="${e(x[id])}" ${x[id]===selected?"selected":""}>${e(x[label])}</option>`).join("")}`;
    const doctor=doctors.find((d)=>d.id===user.doctorId)||doctors[0];
    const dept = doctor?.department || "General";
    
    let diagnoses = ["Viral Fever", "Common Cold"];
    let medicines = ["Paracetamol 500mg"];
    if (dept === "Pediatrics") {
      diagnoses = ["Fever", "Cough & Cold", "Chickenpox", "Measles", "Ear Infection"];
      medicines = ["Paracetamol Syrup", "Amoxicillin Drops", "Ibuprofen Syrup", "Cough Syrup"];
    } else if (dept === "Orthopedics") {
      diagnoses = ["Arthritis", "Bone Fracture", "Muscle Sprain", "Back Pain"];
      medicines = ["Ibuprofen 400mg", "Diclofenac Gel", "Calcium Supplements", "Painkillers"];
    } else if (dept === "Dental") {
      diagnoses = ["Cavity", "Gingivitis", "Tooth Extraction", "Root Canal"];
      medicines = ["Amoxicillin 500mg", "Painkiller (Dental)", "Mouthwash", "Clove Oil"];
    } else if (dept === "Ayurvedic") {
      diagnoses = ["Digestive Disorder", "Joint Pain", "Skin Allergy", "Stress"];
      medicines = ["Ashwagandha", "Triphala Churna", "Neem Tablets", "Chyawanprash", "Tulsi Drops"];
    }

    return `<form id="prescription-form"><input type="hidden" name="id" value="${e(HMS.nextId("prescriptions"))}"><div class="form-grid">
      <div class="form-field"><label>Prescription ID</label><input value="${e(HMS.nextId("prescriptions"))}" disabled aria-label="Generated prescription ID"></div>
      <div class="form-field"><label>Hospital name</label><input name="hospitalName" value="MediCare Hospital" required></div>
      <div class="form-field"><label>Doctor</label><select name="doctorId" required>${options(doctors,"id","name",doctor?.id,"Select doctor")}</select></div>
      <div class="form-field"><label>Department</label><select name="department" required>${options(data.departments,"name","name",doctor?.department,"Select department")}</select></div>
      <div class="form-field"><label>Patient</label><select name="patientId" id="prescription-patient" required>${options(patients,"id","name","","Select patient")}</select></div>
      <div class="form-field"><label>Patient ID</label><input id="prescription-patient-id" value="" disabled></div>
      <div class="form-field"><label>Prescription date</label><input type="date" name="date" value="${HMS.today()}" required></div>
      <div class="form-field"><label>Age</label><input name="age" id="prescription-age" type="number" min="0" max="130" required></div>
      <div class="form-field"><label>Gender</label><input name="gender" id="prescription-gender" required></div>
      <div class="form-field full"><label>Symptoms</label><textarea name="symptoms" required></textarea></div>
      <div class="form-field full"><label>Diagnosis</label><input name="diagnosis" list="diagnosis-list" required>
        <datalist id="diagnosis-list">
          ${diagnoses.map(d => `<option value="${d}">`).join("")}
        </datalist>
      </div>
      <div class="form-field"><label>Medicine name</label><input name="medicine" list="medicine-list" required>
        <datalist id="medicine-list">
          ${medicines.map(m => `<option value="${m}">`).join("")}
        </datalist>
      </div>
      <div class="form-field"><label>Dosage</label><input name="dosage" list="dosage-list" placeholder="e.g. 10 mg" required>
        <datalist id="dosage-list"><option value="1 Tablet"><option value="2 Tablets"><option value="10 ml"><option value="5 ml"></datalist>
      </div>
      <div class="form-field"><label>Frequency</label><input name="frequency" list="freq-list" placeholder="e.g. Once daily" required>
        <datalist id="freq-list"><option value="Once daily"><option value="Twice daily (Morning & Night)"><option value="Thrice daily"><option value="As needed"></datalist>
      </div>
      <div class="form-field"><label>Duration</label><input name="duration" list="dur-list" placeholder="e.g. 7 days" required>
        <datalist id="dur-list"><option value="3 days"><option value="5 days"><option value="1 week"><option value="1 month"><option value="Ongoing"></datalist>
      </div>
      <div class="form-field full"><label>Instructions</label><textarea name="instructions"></textarea></div>
      <div class="form-field"><label>Tests recommended</label><input name="tests" list="test-list">
        <datalist id="test-list"><option value="Complete Blood Count (CBC)"><option value="X-Ray"><option value="Dental X-Ray"><option value="None"></datalist>
      </div>
      <div class="form-field"><label>Follow-up date</label><input type="date" name="followUpDate"></div>
      <div class="form-field full"><label>Doctor notes</label><textarea name="notes"></textarea></div>
    </div><div class="modal-footer"><button class="button button-primary" type="submit">Save prescription</button></div></form>`;
  }
  function prescriptionRows(records,data) {
    return records.slice().sort((a,b)=>b.date.localeCompare(a.date)).map((p)=>`<tr data-prescription-row data-search="${e([p.id,HMS.patientName(p.patientId,data),p.diagnosis].join(" ").toLowerCase())}"><td><strong>${e(p.id)}</strong></td><td>${e(HMS.patientName(p.patientId,data))}<br><span class="muted">${e(p.patientId)}</span></td><td>${e(HMS.doctorName(p.doctorId,data))}</td><td>${e(p.department)}</td><td>${e(p.diagnosis)}</td><td>${e(p.date)}</td><td><div class="action-row"><button data-action="view-prescription" data-id="${e(p.id)}" aria-label="View prescription">◉</button><button data-action="print-prescription" data-id="${e(p.id)}" aria-label="Print prescription">⎙</button><button data-action="pdf-prescription" data-id="${e(p.id)}" aria-label="Download PDF">↓</button></div></td></tr>`).join("")||`<tr><td colspan="7" class="empty-state">No prescriptions found.</td></tr>`;
  }
  function getPrescription(id) {
    const data=HMS.read(),user=HMS.currentUser;
    return visibleRecords(data,user).find((p)=>p.id===id);
  }
  function printableMarkup(p) {
    const data=HMS.read(),patient=data.patients.find((x)=>x.id===p.patientId);
    const doctor=data.doctors.find((x)=>x.id===p.doctorId);
    return `<article class="prescription-paper"><header class="prescription-brand"><div><span class="brand-mark">✚</span><span><strong>${e(p.hospitalName||"MediCare Hospital")}</strong><small>CARE WITH COMPASSION · CLINICAL SERVICES</small></span></div><span>${e(p.department)}</span></header><h2>MEDICAL PRESCRIPTION</h2><p class="prescription-ref">Prescription ${e(p.id)} <span>Issued ${e(p.date)}</span></p><div class="prescription-patient"><div><small>PATIENT</small><strong>${e(patient?.name||"Unknown patient")}</strong><span>${e(patient?.id||p.patientId)} · ${e(p.age||patient?.age||"")} years · ${e(p.gender||patient?.gender||"")}</span></div><div><small>ATTENDING DOCTOR</small><strong>${e(doctor?.name||"Doctor")}</strong><span>${e(doctor?.specialization||"")} · ${e(p.department)}</span></div></div><section><h3>Symptoms & diagnosis</h3><p><b>Symptoms:</b> ${e(p.symptoms||"—")}</p><p><b>Diagnosis:</b> ${e(p.diagnosis||"—")}</p></section><section><h3>Medication</h3><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody><tr><td>${e(p.medicine)}</td><td>${e(p.dosage)}</td><td>${e(p.frequency)}</td><td>${e(p.duration)}</td></tr></tbody></table><p><b>Instructions:</b> ${e(p.instructions||"—")}</p></section><section><h3>Care plan</h3><p><b>Tests recommended:</b> ${e(p.tests||"None")}</p><p><b>Follow-up:</b> ${e(p.followUpDate||"Not scheduled")}</p><p><b>Doctor notes:</b> ${e(p.notes||"—")}</p></section><footer><div><span class="signature-line"></span><b>${e(doctor?.name||"Attending doctor")}</b><small>${e(doctor?.specialization||"")}</small></div><p>This document was generated by MediCare Hospital's demonstration system.<br>Store and share clinical records only through approved secure channels.</p></footer></article>`;
  }
  function viewPrescription(id) {
    const p=getPrescription(id);if(!p)return;
    HMSUI.openModal(`Prescription · ${p.id}`,`${printableMarkup(p)}<div class="modal-footer"><button class="button button-secondary" data-action="print-prescription" data-id="${e(p.id)}">Print</button><button class="button button-primary" data-action="pdf-prescription" data-id="${e(p.id)}">Download PDF</button></div>`);
  }
  function printPrescription(p) {
    const printWindow=window.open("","_blank");
    if(!printWindow){HMSUI.toast("Allow pop-ups to print this prescription.",true);return;}
    printWindow.opener=null;
    printWindow.document.write(`<!doctype html><html><head><title>${e(p.id)} · MediCare</title><style>${printStyles}</style></head><body>${printableMarkup(p)}<script>window.onload=function(){window.print()}<\/script></body></html>`);
    printWindow.document.close();
  }
  function downloadPdf(p) {
    const JsPDF=window.jspdf?.jsPDF;
    if(!JsPDF){downloadOfflinePdf(p);return;}
    const data=HMS.read(),patient=data.patients.find((x)=>x.id===p.patientId),doctor=data.doctors.find((x)=>x.id===p.doctorId);
    const doc=new JsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const margin=18, pageWidth=210, blue=[36,107,206], teal=[25,168,154];
    doc.setFillColor(...blue);doc.rect(0,0,pageWidth,38,"F");
    doc.setFillColor(...teal);doc.circle(margin+5,18,6,"F");
    doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(19);doc.text(p.hospitalName||"MediCare Hospital",margin+16,17);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("CARE WITH COMPASSION  |  CLINICAL SERVICES",margin+16,24);
    doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text("MEDICAL PRESCRIPTION",pageWidth-margin,17,{align:"right"});
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(`${p.id}  ·  ${p.date}`,pageWidth-margin,24,{align:"right"});
    let y=50;
    const line=(label,value,x,ypos,maxWidth=80)=>{doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(104,119,139);doc.text(label.toUpperCase(),x,ypos);doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(24,38,61);doc.text(doc.splitTextToSize(String(value||"—"),maxWidth),x,ypos+6);};
    doc.setFillColor(245,248,252);doc.roundedRect(margin,y,pageWidth-2*margin,31,2,2,"F");
    line("Patient",patient?.name,margin+5,y+8,72);line("Patient ID",p.patientId,margin+5,y+20,72);
    line("Age / gender",`${p.age||patient?.age||"—"} years · ${p.gender||patient?.gender||"—"}`,margin+80,y+8,48);
    line("Doctor",doctor?.name,margin+80,y+20,48);line("Department",p.department,margin+135,y+8,35);
    y+=42;
    const section=(title,text)=>{doc.setTextColor(...blue);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text(title,margin,y);y+=6;doc.setTextColor(60,73,92);doc.setFont("helvetica","normal");doc.setFontSize(9);const wrapped=doc.splitTextToSize(String(text||"—"),pageWidth-2*margin);if(y+wrapped.length*4.5>245){doc.addPage();y=22;}doc.text(wrapped,margin,y);y+=wrapped.length*4.5+7;};
    section("Symptoms",p.symptoms);section("Diagnosis",p.diagnosis);
    doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(...blue);doc.text("MEDICATION",margin,y);y+=7;
    doc.setFillColor(...blue);doc.rect(margin,y,pageWidth-2*margin,9,"F");
    doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("MEDICINE",margin+3,y+6);doc.text("DOSAGE",margin+64,y+6);doc.text("FREQUENCY",margin+94,y+6);doc.text("DURATION",margin+145,y+6);y+=9;
    doc.setFillColor(246,249,252);doc.rect(margin,y,pageWidth-2*margin,13,"F");doc.setTextColor(36,49,69);doc.setFont("helvetica","normal");doc.setFontSize(8);
    doc.text(doc.splitTextToSize(p.medicine||"—",57),margin+3,y+6);doc.text(doc.splitTextToSize(p.dosage||"—",28),margin+64,y+6);doc.text(doc.splitTextToSize(p.frequency||"—",46),margin+94,y+6);doc.text(doc.splitTextToSize(p.duration||"—",24),margin+145,y+6);y+=21;
    section("Instructions",p.instructions);section("Tests recommended",p.tests);section("Doctor notes",p.notes);
    if(y>238){doc.addPage();y=22;}
    line("Follow-up date",p.followUpDate||"Not scheduled",margin,y+2,80);
    doc.setDrawColor(160,174,192);doc.line(pageWidth-margin-55,255,pageWidth-margin,255);
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(36,49,69);doc.text(doctor?.name||"Attending doctor",pageWidth-margin-55,261);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(doctor?.specialization||"",pageWidth-margin-55,266);
    doc.setFontSize(7);doc.setTextColor(125,139,157);doc.text("Generated by MediCare Hospital demonstration system · Protect patient privacy",margin,285);
    doc.save(`${p.id}-MediCare-prescription.pdf`);
  }
  function downloadOfflinePdf(p) {
    const data=HMS.read(),patient=data.patients.find((x)=>x.id===p.patientId),doctor=data.doctors.find((x)=>x.id===p.doctorId);
    const commands=[];
    const safe=(value)=>String(value??"—").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g,"?");
    const literal=(value)=>safe(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
    const text=(value,x,top,size=10,bold=false,color=[.12,.18,.27])=>{
      commands.push(`BT /${bold?"F2":"F1"} ${size} Tf ${color.join(" ")} rg 1 0 0 1 ${x} ${842-top} Tm (${literal(value)}) Tj ET`);
    };
    const rect=(x,top,w,h,color)=>{
      commands.push(`q ${color.join(" ")} rg ${x} ${842-top-h} ${w} ${h} re f Q`);
    };
    const rule=(x1,top,x2,color=[.88,.91,.95])=>commands.push(`q ${color.join(" ")} RG 0.7 w ${x1} ${842-top} m ${x2} ${842-top} l S Q`);
    const wrap=(value,max=84)=>{const words=safe(value).split(/\s+/),lines=[];let line="";for(const word of words){if((line+" "+word).trim().length>max&&line){lines.push(line);line=word;}else line=(line+" "+word).trim();}if(line)lines.push(line);return lines.length?lines:["—"];};
    const paragraph=(label,value,top)=>{
      text(label,54,top,9,true,[.14,.42,.76]);let y=top+17;
      for(const line of wrap(value,92)){text(line,54,y,9,false,[.22,.28,.36]);y+=13;}
      return y+9;
    };
    rect(0,0,595,145,[.09,.28,.52]);rect(44,37,31,31,[.1,.66,.6]);
    text("+",54,60,20,true,[1,1,1]);text(p.hospitalName||"MediCare Hospital",87,52,22,true,[1,1,1]);
    text("CARE WITH COMPASSION  |  CLINICAL SERVICES",87,73,8,false,[.82,.9,.96]);
    text("MEDICAL PRESCRIPTION",410,49,11,true,[1,1,1]);text(`${p.id}  |  ${p.date}`,410,70,9,false,[.85,.91,.97]);
    text("PATIENT",54,177,8,true,[.44,.51,.6]);text(patient?.name||"Unknown patient",54,198,14,true);
    text(`${p.patientId}  |  ${p.age||patient?.age||"—"} years  |  ${p.gender||patient?.gender||"—"}`,54,216,9);
    text("ATTENDING DOCTOR",330,177,8,true,[.44,.51,.6]);text(doctor?.name||"Attending doctor",330,198,12,true);
    text(`${doctor?.specialization||""}  |  ${p.department}`,330,216,9);
    rule(44,237,551);
    let y=paragraph("SYMPTOMS",p.symptoms,261);y=paragraph("DIAGNOSIS",p.diagnosis,y);
    text("MEDICATION",54,y,10,true,[.14,.42,.76]);y+=13;
    rect(44,y,507,25,[.14,.42,.76]);
    text("MEDICINE",53,y+16,8,true,[1,1,1]);text("DOSAGE",200,y+16,8,true,[1,1,1]);text("FREQUENCY",292,y+16,8,true,[1,1,1]);text("DURATION",439,y+16,8,true,[1,1,1]);y+=25;
    rect(44,y,507,34,[.95,.97,.99]);text(wrap(p.medicine,23)[0],53,y+20,8,true);text(wrap(p.dosage,14)[0],200,y+20,8);text(wrap(p.frequency,24)[0],292,y+20,8);text(wrap(p.duration,17)[0],439,y+20,8);y+=48;
    y=paragraph("INSTRUCTIONS",p.instructions,y);y=paragraph("TESTS RECOMMENDED",p.tests||"None",y);
    y=paragraph("DOCTOR NOTES",p.notes,y);
    text(`FOLLOW-UP: ${p.followUpDate||"Not scheduled"}`,54,Math.min(y,715),9,true);
    rule(365,766,551,[.55,.61,.69]);text(doctor?.name||"Attending doctor",365,783,10,true);text(doctor?.specialization||"",365,798,8);
    rule(44,816,551);text("MediCare Hospital demonstration system  |  Protect patient privacy and share only through approved channels.",44,830,7,false,[.48,.54,.62]);
    const stream=commands.join("\n");
    const objects=[
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    ];
    let pdf="%PDF-1.4\n",offsets=[0];
    objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
    const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset)=>pdf+=`${String(offset).padStart(10,"0")} 00000 n \n`);
    pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const blob=new Blob([pdf],{type:"application/pdf"}),url=URL.createObjectURL(blob),anchor=document.createElement("a");
    anchor.href=url;anchor.download=`${p.id}-MediCare-prescription.pdf`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    HMSUI.toast("A4 prescription PDF downloaded.");
  }
  document.addEventListener("change",(event)=>{
    if(event.target.id==="prescription-patient"){
      const p=HMS.read().patients.find((x)=>x.id===event.target.value);
      if(p){document.getElementById("prescription-age").value=p.age;document.getElementById("prescription-gender").value=p.gender;document.getElementById("prescription-patient-id").value=p.id;}
      else document.getElementById("prescription-patient-id").value="";
    }
  });
  document.addEventListener("submit",(event)=>{
    const form=event.target.closest("#prescription-form");if(!form)return;
    event.preventDefault();
    const values=Object.fromEntries(new FormData(form).entries()),data=HMS.read(),user=HMS.currentUser;
    const patient=data.patients.find((p)=>p.id===values.patientId),doctor=data.doctors.find((d)=>d.id===values.doctorId);
    if(!patient||!doctor){HMSUI.toast("Select a valid patient and doctor.",true);return;}
    if(user.role==="doctor"&&(doctor.id!==user.doctorId||patient.doctorId!==user.doctorId)){HMSUI.toast("You can only prescribe for patients assigned to you.",true);return;}
    const age=Number(values.age);
    if(!Number.isInteger(age)||age<0||age>130){HMSUI.toast("Enter a valid patient age.",true);return;}
    const record={...values,age,id:values.id,gender:values.gender||patient.gender,department:doctor.department};
    try{HMS.write({...data,prescriptions:[record,...data.prescriptions]});HMSUI.toast(`Prescription ${record.id} saved.`);}
    catch(error){HMSUI.toast(error.message,true);}
  });
  document.addEventListener("input",(event)=>{
    if(event.target.id==="prescription-search"){
      const term=event.target.value.toLowerCase();
      document.querySelectorAll("[data-prescription-row]").forEach((row)=>row.hidden=!row.dataset.search.includes(term));
    }
  });
  document.addEventListener("click",(event)=>{
    const button=event.target.closest("[data-action]");if(!button)return;
    if(!["view-prescription","print-prescription","pdf-prescription"].includes(button.dataset.action))return;
    const p=getPrescription(button.dataset.id);if(!p){HMSUI.toast("Prescription is not available to this account.",true);return;}
    if(button.dataset.action==="view-prescription")viewPrescription(p.id);
    if(button.dataset.action==="print-prescription")printPrescription(p);
    if(button.dataset.action==="pdf-prescription")downloadPdf(p);
  });
  const printStyles=`@page{size:A4;margin:16mm}body{font:12px Arial,sans-serif;color:#18263d}.prescription-paper{max-width:800px;margin:auto}.prescription-brand{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #246bce;padding-bottom:16px}.prescription-brand>div{display:flex;gap:12px;align-items:center}.brand-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:#246bce;color:white;font-size:23px}.prescription-brand strong,.prescription-brand small{display:block}.prescription-brand strong{font-size:18px}.prescription-brand small,.prescription-patient small{font-size:8px;letter-spacing:1px;color:#748198}.prescription-paper>h2{text-align:center;margin:28px 0 5px;font-size:19px}.prescription-ref{text-align:center;color:#708098;font-size:10px}.prescription-ref span{margin-left:18px}.prescription-patient{display:grid;grid-template-columns:1fr 1fr;background:#f4f7fb;padding:16px;margin:20px 0}.prescription-patient>*{display:grid;gap:6px}.prescription-paper section{margin:20px 0}.prescription-paper h3{color:#246bce;border-bottom:1px solid #e4eaf1;padding-bottom:8px}.prescription-paper p{line-height:1.5}.prescription-paper table{width:100%;border-collapse:collapse}.prescription-paper th,.prescription-paper td{border:1px solid #e1e7ee;padding:9px;text-align:left}.prescription-paper th{background:#f4f7fb}.prescription-paper footer{display:flex;justify-content:space-between;align-items:end;margin-top:50px}.prescription-paper footer>div{display:grid;gap:5px}.signature-line{width:190px;border-top:1px solid #79869a}.prescription-paper footer small,.prescription-paper footer p{font-size:8px;color:#75839a}`;
  window.HMSRenderPrescriptions=renderPrescriptions;
  window.addEventListener("hms:data-change",()=>{if(document.body.dataset.page==="prescriptions"){const root=document.getElementById("page-content");if(root)root.innerHTML=renderPrescriptions();}});
})();
