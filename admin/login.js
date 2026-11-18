"use strict";
const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");
const button = document.getElementById("loginButton");
(async function () {
  try { if (await WheelWiseAPI.checkAdmin()) location.replace("dashboard.html"); } catch (_) {}
})();
form.addEventListener("submit", async function (event) {
  event.preventDefault(); message.textContent = "Checking your account…"; message.className = "message"; button.disabled = true;
  try {
    await WheelWiseAPI.signIn(document.getElementById("email").value, document.getElementById("password").value);
    location.replace("dashboard.html");
  } catch (error) { message.textContent = error.message || "Login failed."; message.className = "message error"; }
  finally { button.disabled = false; }
});