import { reminderList, reminders, displayReminder, isPastDue } from "./AddReminder";
import { deleteReminder, deleteExpiredAndCompletedReminders } from "../Supabase/ReminderService";

const deleteReminders = document.querySelector<HTMLButtonElement>("#delete-reminders")!;

deleteReminders.addEventListener("click", async () => {
    // Delete from Supabase first
    await deleteExpiredAndCompletedReminders();

    // Filter local array to only keep active, not past due reminders
    const remaining = reminders.filter(r => !r.completed && !isPastDue(r));
    reminders.length = 0;
    remaining.forEach(r => reminders.push(r));

    reminderList.innerHTML = "";
    reminders.forEach(displayReminder);
});