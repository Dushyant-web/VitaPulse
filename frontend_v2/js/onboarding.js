// ===============================
// 🚀 ONBOARDING
// ===============================

// 👉 Continue to dashboard
document.getElementById("continueBtn").addEventListener("click", async () => {
  try {
    const user = firebase.auth().currentUser;

    if (!user) {
      alert("Session expired. Please login again.");
      window.location.href = "login.html";
      return;
    }

    const token = await user.getIdToken(true);

    const res = await fetch("http://127.0.0.1:5000/auth/complete-onboarding", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to complete onboarding");
    }

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
});


// 👉 RESET PASSWORD (MANDATORY OPTION)
document.getElementById("resetPasswordBtn").addEventListener("click", async () => {
  try {
    const user = firebase.auth().currentUser;

    if (!user) {
      alert("Session expired. Please login again.");
      window.location.href = "login.html";
      return;
    }

    // 1️⃣ Send reset email
    await firebase.auth().sendPasswordResetEmail(user.email);

    // 2️⃣ MARK onboarding as completed
    const token = await user.getIdToken(true);

    await fetch("http://127.0.0.1:5000/auth/complete-onboarding", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert(
      "Password reset email sent.\n\n" +
      "Please reset your password and login again."
    );

    // 3️⃣ Logout to force clean login
    await firebase.auth().signOut();
    localStorage.clear();

    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert("Failed to send reset email. Try again.");
  }
});