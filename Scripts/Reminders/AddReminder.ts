import { v4 as uuidv4 } from "uuid"

export type Reminder = {
    id: string
    title: string
    completed: boolean
    createdAt: Date
    remindAt?: Date
    reminderSent?: boolean
    notifyOffset: number
}

// 1. DOM Elements (Dashboard)
export const reminderForm = document.querySelector<HTMLFormElement>("#reminder-form")!
export const reminderInput = document.querySelector<HTMLInputElement>("#reminder-title")!
export const reminderTimeInput = document.querySelector<HTMLInputElement>("#reminder-time")!
export const reminderList = document.querySelector<HTMLUListElement>("#reminder-list")!

// 2. DOM Elements (Notification Modal)
export const notificationModal = document.querySelector<HTMLDialogElement>("#notification-modal")!;
export const notificationMessage = document.querySelector<HTMLParagraphElement>("#notification-message")!;
export const closeNotificationBtn = document.querySelector<HTMLButtonElement>("#close-notification-btn")!;

if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

closeNotificationBtn.addEventListener("click", () => {
    notificationModal.close();
});

// 3. Load Data
export const reminders: Reminder[] = loadReminders()
reminders.forEach(displayReminder)

// 4. Background Checking Loop
setInterval(() => {
    const now = new Date();
    let requireSave = false;

    for (let i = reminders.length - 1; i >= 0; i--) {
        const reminder = reminders[i];

        if (!reminder.completed && reminder.remindAt) {

            // PHASE 1: THE EARLY WARNING POPUP
            if (!reminder.reminderSent) {
                const offsetMilliseconds = (reminder.notifyOffset || 0) * 60 * 1000;
                const triggerTime = new Date(reminder.remindAt.getTime() - offsetMilliseconds);

                if (now >= triggerTime) {
                    new Notification("Reminder Alert!", { body: reminder.title });

                    notificationMessage.innerText = `Don't forget: "${reminder.title}" is coming up!`;
                    notificationModal.showModal();

                    reminder.reminderSent = true;
                    requireSave = true;
                }
            }

            // PHASE 2: AUTOMATED DELETION (When actual time passes)
            if (now >= reminder.remindAt) {
                reminders.splice(i, 1);
                requireSave = true;
            }
        }
    }

    if (requireSave) {
        saveReminders();
        reminderList.innerHTML = "";
        reminders.forEach(displayReminder);
    }
}, 10000);

// 5. Form Submission
reminderForm.addEventListener("submit", (e) => {
    e.preventDefault()
    if (!reminderInput.value) return

    let finalReminderTime: Date | undefined = undefined;

    if (reminderTimeInput.value) {
        finalReminderTime = new Date(reminderTimeInput.value);
    }

    const newReminder: Reminder = {
        id: uuidv4(),
        title: reminderInput.value,
        completed: false,
        createdAt: new Date(),
        remindAt: finalReminderTime,
        reminderSent: false,
        notifyOffset: 0
    }

    reminders.push(newReminder)
    saveReminders()
    displayReminder(newReminder)

    reminderInput.value = "";
    reminderTimeInput.value = "";
})

// 6. Core Data & Display Functions
export function displayReminder(reminder: Reminder) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = reminder.completed;

    checkbox.addEventListener("change", () => {
        reminder.completed = checkbox.checked;
        saveReminders();
    });

    let displayText = reminder.title;

    if (reminder.remindAt) {
        const formattedTime = reminder.remindAt.toLocaleString();
        displayText += ` (${formattedTime})`;
    }

    label.append(checkbox, displayText);
    item.append(label);

    reminderList.append(item);
}

export function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders))
}

export function loadReminders(): Reminder[] {
    const remindersJSON = localStorage.getItem("reminders")
    if (!remindersJSON) return []

    return JSON.parse(remindersJSON).map((reminder: any) => ({
        ...reminder,
        createdAt: new Date(reminder.createdAt),
        remindAt: reminder.remindAt ? new Date(reminder.remindAt) : undefined,
        notifyOffset: reminder.notifyOffset || 0
    }))
}

export function isPastDue(reminder: Reminder): boolean {
    if (!reminder.remindAt) return false;
    const now = new Date();
    return reminder.remindAt < now;
}