const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");

loginBtn.onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  errorEl.innerText = "";

  try {
    // 1️⃣ Firebase login
    const userCred = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);

    // 2️⃣ Get ID token (VERY IMPORTANT)
    const token = await userCred.user.getIdToken(true);

    // 3️⃣ Store admin token
    localStorage.setItem("adminToken", token);

    // 4️⃣ Redirect
    window.location.href = "admin-requests.html";

  } catch (err) {
    console.error(err);
    errorEl.innerText = err.message;
  }
};