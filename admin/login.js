"use strict";
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

(async function redirectIfAlreadyLoggedIn() {
    try {
        if (await WheelWiseAPI.checkAdmin()) location.replace("dashboard.html");
    } catch (_) { /* Not signed in yet. */ }
})();

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    loginButton.disabled = true;
    loginButton.textContent = "Signing in…";
    loginMessage.textContent = "";
    loginMessage.className = "form-message";
    try {
        await WheelWiseAPI.signIn(
            document.getElementById("email").value,
            document.getElementById("password").value
        );
        location.replace("dashboard.html");
    } catch (error) {
        loginMessage.textContent = error.message;
        loginMessage.classList.add("error");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign in";
    }
});
