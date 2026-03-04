import { Reminder, reminders, saveReminders } from "./AddReminder";

// Grab DOM elements
const modal = document.querySelector<HTMLDialogElement>("#settingsModal")!;
const openBtn = document.querySelector<HTMLButtonElement>("#openSettingsBtn")!;
const closeBtn = document.querySelector<HTMLButtonElement>("#closeSettingsBtn")!;
const settingList = document.querySelector<HTMLUListElement>("#reminderSettings")!;

// Open and Close the Dialog
openBtn.addEventListener("click", () => {
    populateSettingsList();
    modal.showModal();
});

closeBtn.addEventListener("click", () => {
    modal.close();
});

// Populate the List
function populateSettingsList() {
    settingList.innerHTML = "";

    reminders.forEach(reminder => {
        if (!reminder.completed && reminder.remindAt) {
            createSettingsRow(reminder);
        }
    });
}

// Build Individual Rows
function createSettingsRow(reminder: Reminder) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const select = document.createElement("select");

    const options = [
        { label: "At time of event", value: "0" },
        { label: "5 Minutes", value: "5"},
        { label: "15 Minutes", value: "15" },
        { label: "1 Hour", value: "60" },
        { label: "1 Day", value: "1440" },
        { label: "1 Week", value: "10080" },
        { label: "1 Month", value: "43800" }
    ];

    options.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.innerText = option.label;
        select.append(optionElement);
    });

    select.value = (reminder.notifyOffset || 0).toString();

    // Listen for changes on the dropdown
    select.addEventListener("change", ()  => {
        reminder.notifyOffset = parseInt(select.value, 10);
        reminder.reminderSent = false; // Reset so the alert can trigger again if needed

        saveReminders(); // Updates localStorage using the function imported from AddReminder
        console.log(`Updated ${reminder.title} to trigger ${reminder.notifyOffset} minutes early.`);
    });

    label.innerText = `${reminder.title} - Alert me `;
    item.append(label, select);
    settingList.append(item);
}

export function loadReminderSettings() {
    const reminderSettingsList = document.getElementById("reminderSettings");

    // Safeguard: If the list element isn't on the page, stop running.
    if (!reminderSettingsList) return;

    // Clear the list before redrawing it
    reminderSettingsList.innerHTML = "";

    // Assuming your reminders are saved in localStorage under 'reminders'
    const storedReminders = JSON.parse(localStorage.getItem('reminders') || '[]');

    if (storedReminders.length === 0) {
        reminderSettingsList.innerHTML = "<li class='text-gray-500 text-sm'>No active reminders to configure.</li>";
        return;
    }

    // Draw the list items
    storedReminders.forEach((reminder: any, index: number) => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center py-2 border-b border-gray-100 last:border-0";

        li.innerHTML = `
            <span class="text-sm text-gray-700">${reminder.title || 'Task'}</span>
            <button data-index="${index}" class="delete-reminder-btn text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
        `;

        reminderSettingsList.appendChild(li);
    });

    // Add logic to the new "Remove" buttons
    const deleteButtons = reminderSettingsList.querySelectorAll(".delete-reminder-btn");
    deleteButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const target = e.target as HTMLButtonElement;
            const idx = parseInt(target.getAttribute("data-index") || "0");

            // Remove the item from the array
            storedReminders.splice(idx, 1);

            // Save back to local storage
            localStorage.setItem("reminders", JSON.stringify(storedReminders));

            // Redraw the list instantly
            loadReminderSettings();
        });
    });
}