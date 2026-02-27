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