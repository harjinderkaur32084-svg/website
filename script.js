(function () {
  "use strict";
  const e=HMS.escape;
  const config={
    dashboard:{title:"Overview",icon:"▦"},
    "doctor-dashboard":{title:"My workspace",icon:"▦"},
    "patient-dashboard":{title:"Patient Portal",icon:"▦"},
    reception:{title:"Reception",icon:"⌂"},
    patients:{title:"Patients",icon:"♙"},
    doctors:{title:"Doctors",icon:"✚"},
    departments:{title:"Departments",icon:"⌂"},
    appointments:{title:"Appointments",icon:"▣"},
    prescriptions:{title:"Prescriptions",icon:"▤"}
  };
  const navGroups={
    admin:[["WORKSPACE",["dashboard"]],["CARE MANAGEMENT",["patients","doctors","departments","appointments","prescriptions"]]],
    doctor:[["MY WORKSPACE",["doctor-dashboard","patients","appointments","prescriptions"]]],
    receptionist:[["FRONT DESK",["reception","patients","appointments"]]],
    patient:[["MY PORTAL",["patient-dashboard","appointments","prescriptions"]]]
  };
  function renderShell(user,page) {
    const links=navGroups[user.role].map(([group,items])=>`<div class="nav-label">${group}</div><nav class="nav-links">${items.map((key)=>`<a class="nav-link ${key===page?"active":""}" href="${key==="dashboard"?"admin":key==="doctor-dashboard"?"doctor":key==="patient-dashboard"?"patient":key==="reception"?"receptionist":key}.html"><span class="nav-icon">${config[key].icon}</span><span>${config[key].title}</span></a>`).join("")}</nav>`).join("");
    const initials=HMS.initials(user.name);
    return `<div class="app"><aside class="sidebar" id="sidebar"><a class="brand" href="${user.role==="admin"?"admin":user.role==="doctor"?"doctor":user.role==="patient"?"patient":"receptionist"}.html"><span class="brand-mark">✚</span><span>MediCare<small>HOSPITAL MANAGEMENT</small></span></a>${links}<div class="sidebar-bottom"><div class="secure-card"><strong>Demo environment</strong>Browser-stored sample records only. Not for real patient data.</div></div></aside><div class="workspace"><header class="topbar"><div class="topbar-left"><button class="icon-button mobile-only" data-shell-action="sidebar" aria-label="Open navigation">☰</button><div><div class="page-context">MediCare Hospital</div><div class="topbar-title">${e(config[page]?.title||"Workspace")}</div></div></div><div class="topbar-right"><button class="icon-button" id="theme-toggle-btn" data-shell-action="theme" title="Toggle theme" aria-label="Toggle light or dark mode">${localStorage.getItem("medicare_theme")==="dark"?"☀️":"🌙"}</button><button class="icon-button" data-shell-action="notifications" title="Notifications" aria-label="Notifications">♧</button><div class="profile-wrap"><span class="avatar">${e(initials)}</span><div class="profile-label"><div class="profile-name">${e(user.name)}</div><div class="profile-meta">${e(user.title||user.role)}</div></div><button class="icon-button" data-shell-action="profile" aria-label="Open profile menu">⌄</button><div class="profile-menu" id="profile-menu" hidden><button data-shell-action="profile-details">Signed in as ${e(user.role)}</button><button data-shell-action="logout">Sign out</button></div></div></div></header><main class="main-content" id="page-content"></main></div><div id="modal-root"></div><div class="toast-container" id="toast-container" aria-live="polite"></div></div>`;
  }
  function installUI() {
    window.HMSUI={
      openModal(title,body) {
        const root=document.getElementById("modal-root");
        root.innerHTML=`<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-label="${e(title)}"><header class="modal-header"><h2>${e(title)}</h2><button class="modal-close" data-close-modal aria-label="Close">×</button></header><div class="modal-body">${body}</div></section></div>`;
        root.querySelector(".modal-backdrop").addEventListener("click",(event)=>{if(event.target.classList.contains("modal-backdrop"))window.HMSUI.closeModal();});
        root.querySelector(".modal-close").focus();
      },
      closeModal(){const root=document.getElementById("modal-root");if(root)root.innerHTML="";},
      toast(message,error=false) {
        const container=document.getElementById("toast-container");if(!container)return;
        const toast=document.createElement("div");toast.className=`toast${error?" error":""}`;toast.textContent=message;container.appendChild(toast);setTimeout(()=>toast.remove(),3500);
      }
    };
  }
  function renderPage() {
    const root=document.getElementById("page-content"),page=document.body.dataset.page,user=HMS.currentUser;
    if(!root)return;
    if(page==="dashboard"||page==="doctor-dashboard"||page==="patient-dashboard"||page==="reception")root.innerHTML=window.HMSRenderDashboard({page,user});
    else if(["patients","doctors","departments"].includes(page))root.innerHTML=window.HMSRenderDirectory(page);
    else if(page==="appointments")root.innerHTML=window.HMSRenderAppointments();
    else if(page==="prescriptions")root.innerHTML=window.HMSRenderPrescriptions();
    if(page==="dashboard")window.HMSDrawChart();
  }
  const user=HMSAuth.requireUser();
  if(user){
    const page=document.body.dataset.page;
    document.title=`${config[page]?.title||"Workspace"} · MediCare HMS`;
    document.getElementById("app-root").innerHTML=renderShell(user,page);
    installUI();
    if(localStorage.getItem("medicare_theme")==="dark")document.documentElement.classList.add("theme-dark");
    renderPage();
    const pendingToast = sessionStorage.getItem("medicare_toast");
    if(pendingToast){
      setTimeout(() => window.HMSUI.toast(pendingToast), 300);
      sessionStorage.removeItem("medicare_toast");
    }
    document.addEventListener("click",(event)=>{
      if(event.target.closest("[data-close-modal]")){window.HMSUI.closeModal();return;}
      const button=event.target.closest("[data-shell-action]");
      if(!button){if(!event.target.closest("#profile-menu")){const menu=document.getElementById("profile-menu");if(menu)menu.hidden=true;}return;}
      const action=button.dataset.shellAction;
      if(action==="sidebar")document.getElementById("sidebar").classList.toggle("open");
      if(action==="theme"){
        const isDark = document.documentElement.classList.toggle("theme-dark");
        localStorage.setItem("medicare_theme", isDark ? "dark" : "light");
        const btn = document.getElementById("theme-toggle-btn");
        if(btn) btn.textContent = isDark ? "☀️" : "🌙";
      }
      if(action==="notifications")HMSUI.toast("You're all caught up. No new notifications.");
      if(action==="profile")document.getElementById("profile-menu").hidden=!document.getElementById("profile-menu").hidden;
      if(action==="profile-details")HMSUI.toast(`${user.name} · ${user.role}`);
      if(action==="logout")HMSAuth.logout();
    });
    window.addEventListener("resize",()=>{if(document.body.dataset.page==="dashboard"&&window.HMSDrawChart)window.HMSDrawChart();});
  }
})();
