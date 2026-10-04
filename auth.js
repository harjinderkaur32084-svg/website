(function () {
  "use strict";
  function accounts() {
    return [
      { username:"admin@medicare.demo", password:"admin123", role:"admin", name:"Jordan Ellis", title:"Hospital Administrator" },
      { username:"reception@medicare.demo", password:"recep123", role:"receptionist", name:"Taylor Morgan", title:"Receptionist" },
      ...HMS.read().doctors.map((doctor, index) => ({
        username:doctor.username||doctor.email||`doctor${index+1}@medicare.demo`,
        password:doctor.password||"doctor123", role:"doctor", doctorId:doctor.id, name:doctor.name, title:doctor.specialization
      })),
      ...(HMS.read().patients || []).map((p, index) => ({
        username:p.email||`patient${index+1}@medicare.demo`,
        password:p.password||"patient123", role:"patient", patientId:p.id, name:p.name, title:"Patient"
      })),
      ...(HMS.read().users || [])
    ];
  }
  const destinations = { admin:"admin.html", doctor:"doctor.html", receptionist:"receptionist.html", patient:"patient.html" };
  const access = {
    admin:["dashboard","doctor-dashboard","reception","patients","doctors","departments","appointments","prescriptions"],
    doctor:["doctor-dashboard","patients","appointments","prescriptions"],
    receptionist:["reception","patients","appointments"],
    patient:["patient-dashboard","appointments","prescriptions"]
  };
  function landing(user) { return user.role === "doctor" ? "doctor.html" : user.role === "receptionist" ? "receptionist.html" : user.role === "patient" ? "patient.html" : "admin.html"; }
  function login(identity, password) {
    const account = accounts().find((item) => item.username.toLowerCase() === identity.trim().toLowerCase() && item.password === password);
    if (!account) return false;
    const { password:unused, ...user } = account;
    localStorage.setItem("medicare_user", JSON.stringify(user));
    return true;
  }
  function logout() { localStorage.removeItem("medicare_user"); window.location.href = "index.html"; }
  function canAccess(page, user=HMS.currentUser) { return Boolean(user && access[user.role]?.includes(page)); }
  function requireUser() {
    const user = HMS.currentUser;
    if (!user) { window.location.replace("index.html"); return null; }
    const page = document.body.dataset.page;
    if (!canAccess(page, user)) { window.location.replace(landing(user)); return null; }
    return user;
  }
  function register(name, email, password, role) {
    const data = HMS.read();
    if (!data.users) data.users = [];
    if (data.users.find(u => u.username === email) || accounts().find(u => u.username === email)) {
      return { success: false, error: "Email is already registered." };
    }
    const newUser = {
      username: email, password: password, role: role, name: name,
      title: role === 'admin' ? 'Hospital Administrator' : role === 'receptionist' ? 'Receptionist' : role === 'patient' ? 'Patient' : 'Doctor'
    };
    if (role === 'doctor') {
      const doctorId = HMS.nextId("doctors");
      data.doctors.push({
        id: doctorId, name: name, department: "Pediatrics", specialization: "General Physician",
        email: email, phone: "", timing: "09:00 AM - 05:00 PM", status: "Active", username: email, password: password
      });
      newUser.doctorId = doctorId;
    } else if (role === 'patient') {
      const patientId = HMS.nextId("patients");
      data.patients.push({
        id: patientId, name: name, email: email, phone: "", age: 30, gender: "Other", address: "", bloodGroup: "O+",
        doctorId: data.doctors[0]?.id, department: data.doctors[0]?.department, registrationDate: HMS.today(), history: "None", allergies: "None", password: password
      });
      newUser.patientId = patientId;
    } else {
      data.users.push(newUser);
    }
    HMS.write(data);
    return { success: true };
  }
  window.HMSAuth = { login, logout, canAccess, requireUser, landing, register };
  if (document.body.classList.contains("login-page")) {
    const form = document.getElementById("login-form");
    if (HMS.currentUser) window.location.replace(landing(HMS.currentUser));
    const demoList = document.getElementById("demo-account-list");
    if (demoList) {
      const demoAccounts = accounts();
      const demoButton = (account, label, detail) => `<button type="button" class="demo-account-button" data-demo-account="${HMS.escape(account.username)}"><span class="demo-account-icon">${account.role === "doctor" ? "✚" : account.role === "admin" ? "▦" : "⌂"}</span><span><strong>${HMS.escape(label)}</strong><small>${HMS.escape(detail)}</small></span><span class="demo-arrow">→</span></button>`;
      const adminAccount = demoAccounts.find((account) => account.role === "admin");
      const receptionAccount = demoAccounts.find((account) => account.role === "receptionist");
      const doctorAccounts = demoAccounts.filter((account) => account.role === "doctor");
      demoList.innerHTML = `<div class="demo-role-grid">${demoButton(adminAccount,"Admin dashboard","Hospital overview")}${demoButton(receptionAccount,"Reception dashboard","Front desk & bookings")}</div><div class="demo-doctor-heading">DOCTOR WORKSPACES <span>${doctorAccounts.length} accounts</span></div><div class="demo-doctor-list">${doctorAccounts.map((account) => demoButton(account,account.name,account.title)).join("")}</div>`;
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const identity = document.getElementById("login-identity").value;
      const password = document.getElementById("login-password").value;
      const error = document.getElementById("login-error");
      if (!login(identity, password)) { error.textContent = "We couldn't match those credentials. Please try again."; return; }
      error.textContent = "";
      const user = HMS.currentUser;
      const remembered = document.getElementById("remember-me")?.checked;
      if (remembered) localStorage.setItem("medicare_remembered", user.username);
      else localStorage.removeItem("medicare_remembered");
      window.location.href = landing(user);
    });

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.getElementById("reg-name").value;
        const email = document.getElementById("reg-email").value;
        const password = document.getElementById("reg-password").value;
        const role = document.getElementById("reg-role").value;
        const error = document.getElementById("reg-error");
        
        const res = register(name, email, password, role);
        if (!res.success) {
          error.textContent = res.error;
        } else {
          login(email, password);
          window.location.href = landing(HMS.currentUser);
        }
      });
    }

    const remembered = localStorage.getItem("medicare_remembered");
    if (remembered) { document.getElementById("login-identity").value = remembered; document.getElementById("remember-me").checked = true; }
    document.getElementById("toggle-password").addEventListener("click", (event) => {
      const field = document.getElementById("login-password");
      field.type = field.type === "password" ? "text" : "password";
      event.currentTarget.textContent = field.type === "password" ? "Show" : "Hide";
    });
    document.getElementById("forgot-password").addEventListener("click", () => alert("This frontend demo has no password recovery service. Contact your system administrator in a production deployment."));
    if (demoList) {
      demoList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-demo-account]");
        if (!button) return;
        const account = accounts().find((item) => item.username === button.dataset.demoAccount);
        if (!account || !login(account.username, account.password)) {
          document.getElementById("login-error").textContent = "This demo account is no longer available. Refresh and try again.";
          return;
        }
        window.location.href = landing(HMS.currentUser);
      });
    }
  }
})();
