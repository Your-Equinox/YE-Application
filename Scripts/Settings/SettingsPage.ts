import { loadReminderSettings } from '../Reminders/ReminderSettings';
import { supabase } from '../Supabase/supabaseClient';

// Sidebar Tab Navigation
const navButtons = document.querySelectorAll('aside nav button');
const sections = document.querySelectorAll('main section');

navButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => {
            b.classList.remove('bg-gray-100', 'text-gray-900');
            b.classList.add('text-gray-600');
        });
        btn.classList.add('bg-blue-50', 'text-blue-600', 'rounded-lg');
        btn.classList.remove('text-gray-600');
        sections.forEach(sec => sec.classList.add('hidden'));
        if (sections[index]) sections[index].classList.remove('hidden');
    });
});

try {
    loadReminderSettings();
} catch (error) {
    console.warn("Could not load reminders.", error);
}

// Display Name
const displayNameInput = document.getElementById("display-name") as HTMLInputElement;
const saveNameBtn = document.getElementById("save-name-btn") as HTMLButtonElement;
const nameStatus = document.getElementById("name-status") as HTMLParagraphElement;

// Load saved name from Supabase on page load
async function loadDisplayName() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !displayNameInput) return;

    const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();

    if (data?.display_name) displayNameInput.value = data.display_name;
}

loadDisplayName();

if (saveNameBtn && displayNameInput && nameStatus) {
    saveNameBtn.addEventListener("click", async () => {
        const newName = displayNameInput.value.trim();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from("profiles").upsert({
            id: session.user.id,
            display_name: newName || null,
        });

        nameStatus.classList.remove("hidden");
        setTimeout(() => nameStatus.classList.add("hidden"), 3000);
    });
}

// Gemini API Key — still uses localStorage since it's a client-side key
const apiKeyInput = document.querySelector<HTMLInputElement>("#gemini-api-key");
const saveApiKeyBtn = document.querySelector<HTMLButtonElement>("#save-api-key-btn");
const apiKeyStatus = document.querySelector<HTMLParagraphElement>("#api-key-status");

if (apiKeyInput) apiKeyInput.value = localStorage.getItem("gemini_api_key") || "";

if (saveApiKeyBtn && apiKeyInput && apiKeyStatus) {
    saveApiKeyBtn.addEventListener("click", () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem("gemini_api_key", key);
        } else {
            localStorage.removeItem("gemini_api_key");
        }
        apiKeyStatus.classList.remove("hidden");
        setTimeout(() => apiKeyStatus.classList.add("hidden"), 3000);
    });
}

// Logout button — add this to your Settings HTML too
const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "/auth.html";
    });
}

// Purge
const customConfirmModal = document.querySelector<HTMLDialogElement>("#custom-confirm-modal");
const confirmPurgeBtn = document.querySelector<HTMLButtonElement>("#confirm-purge-btn");
const cancelPurgeBtn = document.querySelector<HTMLButtonElement>("#cancel-purge-btn");
const purgeBtn = document.querySelector<HTMLButtonElement>("#purge-btn");

if (purgeBtn && customConfirmModal && confirmPurgeBtn && cancelPurgeBtn) {
    purgeBtn.addEventListener("click", () => customConfirmModal.showModal());
    cancelPurgeBtn.addEventListener("click", () => customConfirmModal.close());

    confirmPurgeBtn.addEventListener("click", async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const uid = session.user.id;

        // Delete all user data from every table
        await Promise.all([
            supabase.from("notes").delete().eq("user_id", uid),
            supabase.from("tasks").delete().eq("user_id", uid),
            supabase.from("reminders").delete().eq("user_id", uid),
            supabase.from("stats").delete().eq("user_id", uid),
            supabase.from("categories").delete().eq("user_id", uid),
        ]);

        localStorage.clear();
        customConfirmModal.close();
        alert("All data has been successfully deleted.");
        window.location.href = "/index.html";
    });
}

// Export
const exportBtn = document.querySelector<HTMLButtonElement>("#export-btn");
if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const uid = session.user.id;

        const [notes, tasks, reminders, stats] = await Promise.all([
            supabase.from("notes").select("*").eq("user_id", uid),
            supabase.from("tasks").select("*").eq("user_id", uid),
            supabase.from("reminders").select("*").eq("user_id", uid),
            supabase.from("stats").select("*").eq("user_id", uid),
        ]);

        const exportData = {
            notes: notes.data || [],
            tasks: tasks.data || [],
            reminders: reminders.data || [],
            stats: stats.data || [],
            settings: { geminiApiKey: localStorage.getItem("gemini_api_key") || "" },
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `equinox-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Darkmode accessibilty
const themeToggle = document.getElementById('theme-toggle-btn');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

function applyTheme(isDark: boolean) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
        localStorage.setItem('theme', 'dark');
        console.log('Theme saved: dark');
    } else {
        document.body.classList.remove('dark-mode');
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
        console.log('Theme saved: light');
    }
}

const savedTheme = localStorage.getItem('theme');
console.log('Loaded saved theme:', savedTheme);

if (savedTheme === 'dark') {
    applyTheme(true);
} else {
    applyTheme(false);
}

if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.contains('dark-mode');
        applyTheme(!isDark);
    });
}
