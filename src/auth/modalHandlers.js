// src/auth/modalHandlers.js
import { initAuth0 }  from "./auth0.js";

export async function attachAuthHandlers(dialog) {
  const auth0 = await initAuth0();

  const loginForm = dialog.querySelector("#loginForm");
  const registerForm = dialog.querySelector("#registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await auth0.loginWithPopup({ authorizationParams: { screen_hint: "login" } });
      console.log("User:", await auth0.getUser());
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await auth0.loginWithPopup({ authorizationParams: { screen_hint: "signup" } });
      console.log("User:", await auth0.getUser());
    });
  }
}