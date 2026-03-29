import { v4 as uuidv4 } from "uuid";
import { loadReminders, saveReminder, deleteReminder } from "../Supabase/ReminderService";

export type Reminder = {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
    remindAt?: Date;
    reminderSent?: boolean;
    notifyOffset: number;
    colorClass: string;
    colorHex: string;
};

// DOM Elements — no ! assertions, safe on all pages
export const reminderForm = document.querySelector<HTMLFormElement>("#reminder-form");
export const reminderInput = document.querySelector<HTMLInputElement>("#reminder-title");
export const reminderTimeInput = document.querySelector<HTMLInputElement>("#reminder-time");
export const reminderList = document.querySelector<HTMLUListElement>("#reminder-list");
export const notificationModal = document.querySelector<HTMLDialogElement>("#notification-modal");
export const notificationMessage = document.querySelector<HTMLParagraphElement>("#notification-message");
export const closeNotificationBtn = document.querySelector<HTMLButtonElement>("#close-notification-btn");
export const reminderColorInput = document.querySelector<HTMLInputElement>("#reminder-color");

export let reminders: Reminder[] = [];

if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

if (closeNotificationBtn) {
    closeNotificationBtn.addEventListener("click", () => {
        notificationModal?.close();
    });
}

async function init() {
    reminders = await loadReminders();
    if (reminderList) reminders.forEach(displayReminder);
}

init();

// Background checking loop — only runs meaningfully on dashboard
setInterval(async () => {
    if (!reminderList) return;
    const now = new Date();
    let requireSave = false;

    for (let i = reminders.length - 1; i >= 0; i--) {
        const reminder = reminders[i];

        if (!reminder.completed && reminder.remindAt) {
            if (!reminder.reminderSent) {
                const offsetMs = (reminder.notifyOffset || 0) * 60 * 1000;
                const triggerTime = new Date(reminder.remindAt.getTime() - offsetMs);

                if (now >= triggerTime) {
                    new Notification("Reminder Alert!", { body: reminder.title });
                    if (notificationMessage) notificationMessage.innerText = `Don't forget: "${reminder.title}" is coming up!`;
                    notificationModal?.showModal();
                    reminder.reminderSent = true;
                    await saveReminder(reminder);
                }
            }

            if (now >= reminder.remindAt) {
                await deleteReminder(reminder.id);
                reminders.splice(i, 1);
                requireSave = true;
            }
        }
    }

    if (requireSave) {
        reminderList.innerHTML = "";
        reminders.forEach(displayReminder);
    }
}, 10000);

// Form submission — only runs on dashboard
if (reminderForm && reminderInput && reminderTimeInput && reminderColorInput) {
    reminderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!reminderInput.value) return;

        const newReminder: Reminder = {
            id: uuidv4(),
            title: reminderInput.value,
            completed: false,
            createdAt: new Date(),
            remindAt: reminderTimeInput.value ? new Date(reminderTimeInput.value) : undefined,
            reminderSent: false,
            notifyOffset: 0,
            colorClass: "custom-color",
            colorHex: reminderColorInput.value,
        };

        reminders.push(newReminder);
        await saveReminder(newReminder);
        if (reminderList) displayReminder(newReminder);

        // Notify the calendar that reminders have changed
        window.dispatchEvent(new CustomEvent("reminders-updated"));

        reminderInput.value = "";
        reminderTimeInput.value = "";
    });
}

export function displayReminder(reminder: Reminder) {
    if (!reminderList) return;
    const item = document.createElement("li");
    item.className = "flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition";

    const left = document.createElement("div");
    left.className = "flex items-center gap-3";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = reminder.completed;
    checkbox.className = "w-4 h-4 accent-blue-500 cursor-pointer";

    checkbox.addEventListener("change", async () => {
        reminder.completed = checkbox.checked;
        await saveReminder(reminder);
    });

    const text = document.createElement("span");
    text.className = `text-sm ${reminder.completed ? "line-through text-gray-400" : "text-gray-700"}`;
    text.textContent = reminder.remindAt
        ? `${reminder.title} • ${reminder.remindAt.toLocaleString()}`
        : reminder.title;

    left.append(checkbox, text);

    const colorDot = document.createElement("div");
    colorDot.className = "w-3 h-3 rounded-full";
    colorDot.style.backgroundColor = reminder.colorHex;

    item.append(left, colorDot);
    reminderList.append(item);
}

export function isPastDue(reminder: Reminder): boolean {
    if (!reminder.remindAt) return false;
    return reminder.remindAt < new Date();
}
