// js/index.js

// 🔐 Firebase auth state check
document.addEventListener("DOMContentLoaded", () => {
  if (!window.firebase || !firebase.auth) return;

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // ✅ Already logged in hospital → redirect to dashboard
      window.location.href = "dashboard.html";
    }
    // else → stay on landing page
  });
});

/* ===============================
   🧭 CTA SAFETY (OPTIONAL)
   Ensures buttons always route correctly
=============================== */

document.addEventListener("click", (e) => {
  const target = e.target.closest("a");
  if (!target) return;

  if (target.href.includes("login.html")) {
    e.preventDefault();
    window.location.href = "login.html";
  }

  if (target.href.includes("signup.html")) {
    e.preventDefault();
    window.location.href = "signup.html";
  }
});