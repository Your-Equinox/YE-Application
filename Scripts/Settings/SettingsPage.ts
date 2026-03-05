import { loadReminderSettings } from '../Reminders/ReminderSettings';

// Sidebar Tab Navigation Logic
const navButtons = document.querySelectorAll('aside nav button');
const sections = document.querySelectorAll('main section');

navButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        // Reset buttons to look inactive
        navButtons.forEach(b => {
            b.classList.remove('bg-gray-100', 'text-gray-900');
            b.classList.add('text-gray-600');
        });

        // Highlight clicked button
        btn.classList.add('bg-gray-100', 'text-gray-900');
        btn.classList.remove('text-gray-600');

        // Hide all sections, then show the corresponding one
        sections.forEach(sec => sec.classList.add('hidden'));
        if (sections[index]) {
            sections[index].classList.remove('hidden');
        }
    });
});

// Trigger Reminder List
loadReminderSettings();

// AI API Key Management
const apiKeyInput = document.querySelector<HTMLInputElement>("#gemini-api-key");
const saveApiKeyBtn = document.querySelector<HTMLButtonElement>("#save-api-key-btn");
const apiKeyStatus = document.querySelector<HTMLParagraphElement>("#api-key-status");

// Load existing key on page load
if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem("gemini_api_key") || "";
}

// Save key when button is clicked
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
