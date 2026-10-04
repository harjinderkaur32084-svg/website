(function () {
  "use strict";
  const KEY = "medicare_hms_v2";
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
  const patients = [
    ["P-24001","Olivia Bennett",8,"Female","555 0201","olivia@email.demo","14 Cedar Lane","A+","D-1001","Pediatrics","Fever","None"],
    ["P-24002","Noah Williams",51,"Male","555 0202","noah@email.demo","88 Lake Road","O+","D-1002","Orthopedics","Knee pain","None"],
    ["P-24003","Amelia Garcia",27,"Female","555 0203","amelia@email.demo","21 Park Street","B+","D-1003","Dental","Toothache","Latex"],
    ["P-24004","Liam Johnson",42,"Male","555 0204","liam@email.demo","5 Oak Avenue","O-","D-1004","Ayurvedic","Joint stiffness","Pollen"],
    ["P-24005","Isabella Davis",5,"Female","555 0205","isabella@email.demo","64 Hillcrest Dr","AB+","D-1001","Pediatrics","Cough","None"],
    ["P-24006","James Wilson",63,"Male","555 0206","james@email.demo","9 River View","A-","D-1002","Orthopedics","Back pain","Sulfa"],
    ["P-24007","Mia Anderson",19,"Female","555 0207","mia@email.demo","33 Elm Street","B-","D-1003","Dental","Cavity check","None"],
    ["P-24008","Benjamin Thomas",46,"Male","555 0208","ben@email.demo","72 Meadow Way","O+","D-1004","Ayurvedic","Digestion issues","None"]
  ].map((p, i) => ({ id:p[0], name:p[1], age:p[2], gender:p[3], phone:p[4], email:p[5], address:p[6], bloodGroup:p[7], doctorId:p[8], department:p[9], registrationDate:day(-((i * 2) % 29)), history:p[10], allergies:p[11] }));
  const departments = ["Pediatrics","Orthopedics","Dental","Ayurvedic"].map((name, i) => ({ id:`DEP-${String(i+1).padStart(3,"0")}`, name, head:doctors[i].name, rooms:8 + i, status:"Active" }));
  const appointments = Array.from({length:8}, (_, i) => ({
    id:`APT-${String(501+i).padStart(4,"0")}`, patientId:patients[i].id, doctorId:doctors[i % 4].id,
    department:patients[i].department, date:day(i < 4 ? 0 : i - 3), time:["09:00 AM","10:30 AM","11:00 AM","01:30 PM","02:00 PM"][i % 5],
    status:["Confirmed","Pending","Completed","Confirmed","Pending","Completed","Confirmed","Cancelled"][i]
  }));
  const prescriptions = [
    { id:"RX-0301", patientId:"P-24001", doctorId:"D-1001", department:"Pediatrics", date:day(-2), symptoms:"Fever", diagnosis:"Viral Fever", medicine:"Paracetamol Syrup", dosage:"5 ml", frequency:"Twice daily", duration:"3 days", instructions:"Give after meals", tests:"None", followUpDate:day(2), notes:"Keep hydrated." },
    { id:"RX-0302", patientId:"P-24002", doctorId:"D-1002", department:"Orthopedics", date:day(-5), symptoms:"Knee pain", diagnosis:"Arthritis", medicine:"Ibuprofen 400mg", dosage:"1 Tablet", frequency:"Twice daily", duration:"5 days", instructions:"Take with food.", tests:"X-Ray", followUpDate:day(10), notes:"Avoid climbing stairs." }
  ];
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
