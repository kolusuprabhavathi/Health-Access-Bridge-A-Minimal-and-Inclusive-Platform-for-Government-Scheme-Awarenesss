// ------------------------------
// Multilingual Texts
// ------------------------------
const translations = {
  en: {
    login: "Login",
    register: "Register",
    username: "Username",
    password: "Password",
    user: "User",
    admin: "Admin",
    addScheme: "Add Scheme",
    logout: "Logout",
    search: "Search schemes..."
  },
  hi: {
    login: "लॉगिन",
    register: "रजिस्टर",
    username: "उपयोगकर्ता नाम",
    password: "पासवर्ड",
    user: "उपयोगकर्ता",
    admin: "व्यवस्थापक",
    addScheme: "योजना जोड़ें",
    logout: "लॉगआउट",
    search: "योजनाएं खोजें..."
  },
  te: {
    login: "లాగిన్",
    register: "రజిస్టర్",
    username: "వినియోగదారు పేరు",
    password: "పాస్వర్డ్",
    user: "వినియోగదారు",
    admin: "ప్రశాసకుడు",
    addScheme: "యోజనను జోడించండి",
    logout: "లాగ్ అవుట్",
    search: "యోజనలను శోధించండి..."
  }
};

// ------------------------------
// Language Change
// ------------------------------
document.querySelectorAll("#language").forEach(langSelect => {
  langSelect.addEventListener("change", (e) => {
    const lang = e.target.value;
    document.querySelectorAll("[data-text]").forEach(el => {
      const key = el.getAttribute("data-text");
      if(translations[lang][key]) el.textContent = translations[lang][key];
      if(el.placeholder && translations[lang][key]) el.placeholder = translations[lang][key];
    });
  });
});

// ------------------------------
// Logout
// ------------------------------
// Logout function
function logout() {
  sessionStorage.clear(); // Clear login info
  window.location.href = "login.html"; // Redirect to login
  document.body.className = "login-page"; // Reset body class
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);


// ------------------------------
// Login
// ------------------------------
const loginBtn = document.getElementById("loginBtn");
loginBtn?.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const endpoint = role === "admin" ? "/admin/login" : "/user/login";

  try {
    const res = await fetch(`http://localhost:5002${endpoint}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if(data.success){
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", role);
      // Redirect to respective dashboard
      if(role === "admin") window.location.href = "admin.html";
      else window.location.href = "user.html";
    } else {
      alert(data.message);
    }
  } catch(err) {
    console.error(err);
    alert("Login failed. Please try again.");
  }
});

// ------------------------------
// Register
// ------------------------------
const registerBtn = document.getElementById("registerBtn");
registerBtn?.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const endpoint = role === "admin" ? "/admin/register" : "/user/register";

  try {
    const res = await fetch(`http://localhost:5002${endpoint}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if(data.success){
      alert(data.message);
      window.location.href = "index.html";
    } else {
      alert(data.message);
    }
  } catch(err) {
    console.error(err);
    alert("Registration failed. Please try again.");
  }
});

// ------------------------------
// Check if logged in (for protected pages)
// ------------------------------
window.addEventListener("load", () => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const path = window.location.pathname;

  if(path.includes("admin.html") && role !== "admin") {
    alert("Please login as admin.");
    window.location.href = "index.html";
  }

  if(path.includes("user.html") && role !== "user") {
    alert("Please login as user.");
    window.location.href = "index.html";
  }

  // Set correct body class after reload
  if(path.includes("index.html")) document.body.className = "login-page";
  if(path.includes("register.html")) document.body.className = "register-page";
  if(path.includes("admin.html")) document.body.className = "admin-page";
  if(path.includes("user.html")) document.body.className = "user-page";
});
