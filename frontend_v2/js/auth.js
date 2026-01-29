// ===============================
// 🔐 LOGIN
// ===============================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorEl = document.getElementById("loginError");

    errorEl.innerText = "";

    try {
      // 1️⃣ Firebase login
      const cred = await firebase
        .auth()
        .signInWithEmailAndPassword(email, password);

      // 2️⃣ Get fresh ID token
      const token = await cred.user.getIdToken(true);
      localStorage.setItem("idToken", token);

      // 3️⃣ Ask backend who this hospital is
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login failed");
      }

      const hospital = await res.json();

      // 4️⃣ FIRST LOGIN CHECK
      if (hospital.is_first_login === true) {
        // First login → onboarding
        window.location.href = "onboarding.html";
      } else {
        // Normal login
        window.location.href = "dashboard.html";
      }

    } catch (err) {
      console.error(err);
      errorEl.innerText = err.message;
    }
  });
}