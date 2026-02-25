import { v4 as uuidv4 } from "uuid"

export type Reminder = {
    id: string
    title: string
    completed: boolean
    createdAt: Date
    remindAt?: Date
    reminderSent?: boolean
}


export const reminderForm = document.querySelector<HTMLFormElement>("#reminder-form")!
export const reminderInput = document.querySelector<HTMLInputElement>("#reminder-title")!
export const reminderTimeInput = document.querySelector<HTMLInputElement>("#reminder-time")!
export const reminderList = document.querySelector<HTMLUListElement>("#reminder-list")!

// Checking for permissions here particular from the operating system
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

// Loading the list before the interval tries to check it
export const reminders: Reminder[] = loadReminders()
reminders.forEach(displayReminder)

// Background checking loop (running every 10 seconds)
setInterval(() => {
    const now = new Date();
    let requireSave = false;

    for (let i = reminders.length - 1; i >= 0; i--) {
        const reminder = reminders[i];

        if (!reminder.completed && reminder.remindAt && !reminder.reminderSent) {
            if (now >= reminder.remindAt) {

                new Notification("Don't forget about: ", {
                    body: reminder.title
                });

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

// Submit button to add a task
reminderForm.addEventListener("submit", (e) => {
    e.preventDefault()
    if (!reminderInput.value) return

    let finalReminderTime: Date | undefined = undefined;

    if (reminderInput.value) {
        finalReminderTime = new Date(reminderInput.value);
    } else {
        finalReminderTime = new Date(Date.now() + 1000);
    }

    // Default reminder 10 seconds (specifically for testing)
    const futureReminderTime = new Date(Date.now() + 10000);

    const newReminder: Reminder = {
        id: uuidv4(),
        title: reminderInput.value,
        completed: false,
        createdAt: new Date(),
        remindAt: futureReminderTime,
        reminderSent: false
    }

    reminders.push(newReminder)
    saveReminders()
    addListItem(newReminder)

    reminderInput.value = "";
    reminderTimeInput.value = "";

})

// Allows the reminders to be added into a list along with their checkbox
export function addListItem(reminder: Reminder) {
    const item = document.createElement("li")
    const label = document.createElement("label")
    const checkbox = document.createElement("input")

    checkbox.type = "checkbox"
    checkbox.checked = reminder.completed

    checkbox.addEventListener("change", () => {
        reminder.completed = checkbox.checked
        saveReminders()
    })

    label.append(checkbox, reminder.title)
    item.append(label)
    reminderList.append(item)
}

// Saves reminders in local storage so that the users can easily access
export function saveReminders() {
    // Saving under a new key to match the new system
    localStorage.setItem("reminders", JSON.stringify(reminders))
}

// Displays the previously stored reminders
export function displayReminder(reminders: Reminder) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = reminders.completed;

    checkbox.addEventListener("change", () => {
        reminders.completed = checkbox.checked;
        saveReminders();
    });

    let displayText = reminders.title;

    if (reminders.remindAt) {
        const formattedTime = reminders.remindAt.toLocaleString();
        displayText += ` (${formattedTime})`;
    }

    label.append(checkbox, displayText);
    item.append(label);

    reminderList.append(item);
}
// If the reminders are past due then they will be deleted
export function isPastDue(reminder: Reminder): boolean {
    if (!reminder.remindAt) return false;
    const now = new Date();
    return reminder.remindAt < now;
}

//Loads the array from local storage
export function loadReminders(): Reminder[] {
    const remindersJSON = localStorage.getItem("reminders")
    if (!remindersJSON) return []

    return JSON.parse(remindersJSON).map((reminder: any) => ({
        ...reminder,
        createdAt: new Date(reminder.createdAt),
        // Ensures the remindAt date is parsed correctly so the interval loop doesn't break
        remindAt: reminder.remindAt ? new Date(reminder.remindAt) : undefined
    }))
}
