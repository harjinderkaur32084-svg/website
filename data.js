(function () {
  "use strict";
  const KEY = "medicare_hms_v3";
  const today = new Date();
  const day = (offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const doctors = [
    ["D-1001", "Dr. Ethan Brooks", "Pediatrics", "Pediatrician", "ethan.brooks@medicare.demo", "+1 555 0101"],
    ["D-1002", "Dr. Sofia Patel", "Orthopedics", "Orthopedic Surgeon", "sofia.patel@medicare.demo", "+1 555 0102"],
    ["D-1003", "Dr. Marcus Chen", "Dental", "Dentist", "marcus.chen@medicare.demo", "+1 555 0103"],
    ["D-1004", "Dr. Aisha Rahman", "Ayurvedic", "Ayurvedic Practitioner", "aisha.rahman@medicare.demo", "+1 555 0104"]
  ].map((d, index) => ({ id: d[0], name: d[1], department: d[2], specialization: d[3], email: d[4], phone: d[5], timing: index % 2 ? "10:00 AM – 06:00 PM" : "09:00 AM – 05:00 PM", status: "Active", username: `doctor${index + 1}@medicare.demo` }));
  
  const patients = [];
  const departments = ["Pediatrics","Orthopedics","Dental","Ayurvedic"].map((name, i) => ({ id:`DEP-${String(i+1).padStart(3,"0")}`, name, head:doctors[i].name, rooms:8 + i, status:"Active" }));
  const appointments = [];
  const prescriptions = [];
  
  const seed = { doctors, patients, departments, appointments, prescriptions, users: [] };
  function read() {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) { localStorage.setItem(KEY, JSON.stringify(seed)); return structuredClone(seed); }
      const parsed = JSON.parse(saved);
      for (const key of Object.keys(seed)) if (!Array.isArray(parsed[key])) parsed[key] = seed[key];
      return parsed;
    } catch (error) {
      console.error("Unable to read MediCare demo data from localStorage.", error);
      return structuredClone(seed);
    }
  }
  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (error) { console.error("Unable to persist MediCare demo data.", error); throw new Error("Demo data could not be saved. Check browser storage availability."); }
    window.dispatchEvent(new CustomEvent("hms:data-change"));
  }
  function nextId(kind) {
    const data = read();
    const records = data[kind] || [];
    const prefix = { patients:"P", appointments:"APT", prescriptions:"RX", doctors:"D", departments:"DEP" }[kind];
    const max = records.reduce((highest, item) => {
      const match = String(item.id).match(/(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `${prefix}-${String(max + 1).padStart(kind === "patients" ? 5 : 4, "0")}`;
  }
  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
  }
  window.HMS = {
    key:KEY, read, write, nextId, escape,
    get currentUser() { try { return JSON.parse(localStorage.getItem("medicare_user") || "null"); } catch (error) { console.error("Unable to read demo session.", error); return null; } },
    today:() => today.toISOString().slice(0,10),
    patientName:(id, data=read()) => data.patients.find((p) => p.id === id)?.name || "Unknown patient",
    doctorName:(id, data=read()) => data.doctors.find((d) => d.id === id)?.name || "Unassigned",
    initials:(name) => String(name || "?").split(/\s+/).slice(0,2).map((word) => word[0]).join("").toUpperCase(),
    escape
  };

  // Firebase Realtime Sync Integration
  if (typeof window !== "undefined" && window.db) {
    console.log("Firebase is configured. Enabling real-time sync...");
    const docRef = window.db.collection("hms").doc("data");
    
    // Listen for changes from other devices/users
    docRef.onSnapshot((doc) => {
      if (doc.exists) {
        const fbData = doc.data();
        const localData = localStorage.getItem(KEY);
        // Only update if Firebase data is different to avoid infinite loops
        if (JSON.stringify(fbData) !== localData) {
          localStorage.setItem(KEY, JSON.stringify(fbData));
          window.dispatchEvent(new CustomEvent("hms:data-change"));
        }
      }
    });

    // Override the original write function to also save to Firebase
    const originalWrite = HMS.write;
    HMS.write = function(data) {
      originalWrite(data); // Save locally and trigger UI update instantly
      docRef.set(data).catch((error) => {
        console.error("Error syncing to Firebase:", error);
      });
    };
  }

})();
