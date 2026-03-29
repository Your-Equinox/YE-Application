import { supabase } from "./supabaseClient";

// --- DOM Elements ---
const loginTab = document.getElementById("login-tab")!;
const signupTab = document.getElementById("signup-tab")!;
const loginForm = document.getElementById("login-form") as HTMLFormElement;
const signupForm = document.getElementById("signup-form") as HTMLFormElement;
const errorBox = document.getElementById("auth-error")!;
const successBox = document.getElementById("auth-success")!;

// --- Tab Switching ---
loginTab.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    loginForm.classList.add("flex");
    signupForm.classList.add("hidden");
    signupForm.classList.remove("flex");
    loginTab.classList.add("bg-white", "text-blue-600", "shadow");
    signupTab.classList.remove("bg-white", "text-blue-600", "shadow");
    signupTab.classList.add("text-gray-500");
    clearMessages();
});

signupTab.addEventListener("click", () => {
    signupForm.classList.remove("hidden");
    signupForm.classList.add("flex");
    loginForm.classList.add("hidden");
    loginForm.classList.remove("flex");
    signupTab.classList.add("bg-white", "text-blue-600", "shadow");
    loginTab.classList.remove("bg-white", "text-blue-600", "shadow");
    loginTab.classList.add("text-gray-500");
    clearMessages();
});

// --- Login ---
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const email = (document.getElementById("login-email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("login-password") as HTMLInputElement).value;
    const btn = document.getElementById("login-btn") as HTMLButtonElement;

    btn.textContent = "Signing in...";
    btn.disabled = true;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showError(error.message);
        btn.textContent = "Sign In";
        btn.disabled = false;
    } else {
        window.location.href = "/index.html";
    }
});

// --- Signup ---
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const name = (document.getElementById("signup-name") as HTMLInputElement).value.trim();
    const email = (document.getElementById("signup-email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("signup-password") as HTMLInputElement).value;
    const btn = document.getElementById("signup-btn") as HTMLButtonElement;

    btn.textContent = "Creating account...";
    btn.disabled = true;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        showError(error.message);
        btn.textContent = "Create Account";
        btn.disabled = false;
        return;
    }

// Wait for the session to be fully established
    const { data: { session } } = await supabase.auth.getSession();

    if (session && name) {
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: session.user.id,
            display_name: name,
        });

        if (profileError) {
            console.error("Profile save failed:", profileError.message);
        }
    }

    showSuccess("Account created! Signing you in...");
    setTimeout(() => window.location.href = "/index.html", 1500);
});

// --- Helpers ---
function showError(message: string) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function showSuccess(message: string) {
    successBox.textContent = message;
    successBox.classList.remove("hidden");
}

function clearMessages() {
    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");
}