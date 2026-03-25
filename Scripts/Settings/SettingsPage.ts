import { loadReminderSettings } from '../Reminders/ReminderSettings';

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
        if (sections[index]) {
            sections[index].classList.remove('hidden');
        }
    });
});

// Loading Reminder Settings - PROTECTED FROM CRASHES
try {
    loadReminderSettings();
} catch (error) {
    console.warn("Could not load reminders. Safe to purge.", error);
}

// --- Display Name Logic ---
const displayNameInput = document.getElementById("display-name") as HTMLInputElement;
const saveNameBtn = document.getElementById("save-name-btn") as HTMLButtonElement;
const nameStatus = document.getElementById("name-status") as HTMLParagraphElement;

// 1. Load the saved name when the page loads
if (displayNameInput) {
    // Using || '' ensures it doesn't print "null" in the input box if no name is saved yet
    displayNameInput.value = localStorage.getItem("DisplayName") || "";
}

// 2. Handle saving when the button is clicked
if (saveNameBtn && displayNameInput && nameStatus) {
    saveNameBtn.addEventListener("click", () => {
        const newName = displayNameInput.value.trim();

        if (newName) {
            localStorage.setItem("DisplayName", newName);

            // Briefly show the success message
            nameStatus.classList.remove("hidden");
            setTimeout(() => nameStatus.classList.add("hidden"), 3000);
        } else {
            // If they clear the input and hit save, remove it from storage
            localStorage.removeItem("DisplayName");
        }
    });
}

// --- Dashboard Greeting Logic ---
const dashboardUserName = document.getElementById("dashboard-user-name");
const savedName = localStorage.getItem("DisplayName");

if (dashboardUserName) {
    dashboardUserName.textContent = savedName ? savedName : "User";
}
// AI API Key
const apiKeyInput = document.querySelector<HTMLInputElement>("#gemini-api-key");
const saveApiKeyBtn = document.querySelector<HTMLButtonElement>("#save-api-key-btn");
const apiKeyStatus = document.querySelector<HTMLParagraphElement>("#api-key-status");

if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem("gemini_api_key") || "";
}

if (saveApiKeyBtn && apiKeyInput && apiKeyStatus) {
    saveApiKeyBtn.addEventListener("click", () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem("gemini_api_key", key);
            apiKeyStatus.classList.remove("hidden");
            setTimeout(() => apiKeyStatus.classList.add("hidden"), 3000);
        } else {
            localStorage.removeItem("gemini_api_key");
        }
    });
}

//Privacy: Purge, Export, Import Constants
const purgeBtn = document.querySelector<HTMLButtonElement>("#purge-btn");
const exportBtn = document.querySelector<HTMLButtonElement>("#export-btn");
const importBtn = document.querySelector<HTMLButtonElement>("#import-btn");
const importFileInput = document.querySelector<HTMLInputElement>("#import-file");

// PURGE LOGIC
const customConfirmModal = document.querySelector<HTMLDialogElement>("#custom-confirm-modal");
const confirmPurgeBtn = document.querySelector<HTMLButtonElement>("#confirm-purge-btn");
const cancelPurgeBtn = document.querySelector<HTMLButtonElement>("#cancel-purge-btn");

if (purgeBtn && customConfirmModal && confirmPurgeBtn && cancelPurgeBtn) {
    purgeBtn.addEventListener("click", () => {
        customConfirmModal.showModal();
    });

    cancelPurgeBtn.addEventListener("click", () => {
        customConfirmModal.close();
    });

    confirmPurgeBtn.addEventListener("click", () => {
        localStorage.clear();
        customConfirmModal.close();
        alert("All data has been successfully deleted.");
        window.location.href = "../index.html";
    });
}

// EXPORT LOGIC
if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        const exportData = {
            notes: JSON.parse(localStorage.getItem("ye-notes") || "[]"),
            tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
            reminders: JSON.parse(localStorage.getItem("reminders") || "[]"),
            stats: JSON.parse(localStorage.getItem("ye-stats") || "[]"),
            settings: {
                geminiApiKey: localStorage.getItem("gemini_api_key") || ""
            }
        };

        const dataString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        const today = new Date().toISOString().slice(0,10);
        a.download = `your-equinox-backup-${today}.json`;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// IMPORT LOGIC
if (importBtn && importFileInput) {
    importBtn.addEventListener("click", () => {
        importFileInput.click();
    });

    importFileInput.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedData = JSON.parse(content);

                if (importedData.notes) localStorage.setItem("ye-notes", JSON.stringify(importedData.notes));
                if (importedData.tasks) localStorage.setItem("tasks", JSON.stringify(importedData.tasks));
                if (importedData.reminders) localStorage.setItem("reminders", JSON.stringify(importedData.reminders));
                if (importedData.settings && importedData.settings.geminiApiKey) {
                    localStorage.setItem("gemini_api_key", importedData.settings.geminiApiKey);
                }

                alert("Backup restored successfully! Returning to Dashboard.");
                window.location.href = "./index.html";

            } catch (error) {
                console.error("Error importing file:", error);
                alert("Failed to read the backup file.");
            }
            target.value = "";
        };
        reader.readAsText(file);
    });
}
