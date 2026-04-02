import { saveReminder } from "../Supabase/ReminderService";
import { reminders } from "./AddReminder";

export function loadReminderSettings() {
    const settingList = document.querySelector<HTMLUListElement>("#reminderSettings");
    if (!settingList) return;

    settingList.innerHTML = "";

    const active = reminders.filter(r => !r.completed && r.remindAt);

    if (active.length === 0) {
        settingList.innerHTML = "<li class='text-gray-500 text-sm py-2'>No active reminders to configure.</li>";
        return;
    }

    active.forEach((reminder, index) => {
        const item = document.createElement("li");
        item.className = "flex justify-between items-center py-3 border-b border-gray-100 last:border-0";

        const label = document.createElement("label");
        label.className = "text-sm font-medium text-gray-700";
        label.innerText = `${reminder.title || "Untitled"} - Alert me `;

        const select = document.createElement("select");
        select.className = "ml-2 border border-gray-300 rounded p-1 text-sm focus:ring-blue-500 outline-none";

        const options = [
            { label: "At time of event", value: "0" },
            { label: "5 Minutes", value: "5" },
            { label: "15 Minutes", value: "15" },
            { label: "1 Hour", value: "60" },
            { label: "1 Day", value: "1440" },
            { label: "1 Week", value: "10080" },
            { label: "1 Month", value: "43800" },
        ];

        options.forEach(opt => {
            const el = document.createElement("option");
            el.value = opt.value;
            el.innerText = opt.label;
            select.append(el);
        });

        select.value = (reminder.notifyOffset || 0).toString();

        select.addEventListener("change", async () => {
            reminder.notifyOffset = parseInt(select.value, 10);
            reminder.reminderSent = false;
            await saveReminder(reminder);
        });

        item.append(label, select);
        settingList.append(item);
    });
}