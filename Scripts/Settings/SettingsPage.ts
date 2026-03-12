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

        btn.classList.add('bg-gray-100', 'text-gray-900');
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
if (purgeBtn) {
    purgeBtn.addEventListener("click", () => {
        const confirmed = window.confirm("⚠️ Are you sure you want to permanently delete all your data? This cannot be undone.");
        if (confirmed) {
            localStorage.clear();
            alert("All data has been successfully deleted.");
            window.location.href = "../index.html";
        }
    });
}

// EXPORT LOGIC
if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        const exportData = {
            notes: JSON.parse(localStorage.getItem("ye-notes") || "[]"),
            tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
            reminders: JSON.parse(localStorage.getItem("reminders") || "[]"),
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

// IMPORT LOGIC - WITH FIXED REDIRECT PATH
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
                window.location.href = "../index.html";

            } catch (error) {
                console.error("Error importing file:", error);
                alert("Failed to read the backup file.");
            }
            target.value = "";
        };
        reader.readAsText(file);
    });
}