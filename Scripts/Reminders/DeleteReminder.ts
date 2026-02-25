import {reminderList, saveReminders, reminders, displayReminder, isPastDue} from "./AddReminder";

export const deleteReminders = document.querySelector<HTMLButtonElement>("#delete-reminders")!;

// Deleting Reminders Button
deleteReminders.addEventListener("click", () => {

    const remainingReminders = reminders.filter(reminder => {
        return !reminder.completed && !isPastDue(reminder);
    });

    reminders.length = 0;
    remainingReminders.forEach((reminder) => reminders.push(reminder));
    saveReminders();

    reminderList.innerHTML = "";
    reminders.forEach(displayReminder);

});