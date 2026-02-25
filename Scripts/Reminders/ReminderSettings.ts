
/*
This section serves as a way for users to configure a specific set of settings for their reminders and adjust their
their reminders to how they wish although right now the sections are limited.
 */
export type Reminder = {
        id: string
        title: string
        completed: boolean
        createdAt: Date
        remindAt?: Date
        reminderSent?: boolean
        notifyOffset: number
    }

    export const settingList = document.querySelector<HTMLUListElement>("#reminderSettings")!;
    let reminders: Reminder[] = loadReminders();

    reminders.forEach(reminder => {
        if (!reminder.completed && reminder.remindAt) {
            createSettingsRow(reminder);
        }
    });

    export function createSettingsRow(reminder: Reminder) {

        const item = document.createElement("li");
        const label = document.createElement("label");

        const select = document.createElement("select");

        const options = [
            { label: "At time of event", value: "0" },
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
        })

        select.value = (reminder.notifyOffset || 0).toString();

        select.addEventListener("change", ()  => {
            reminder.notifyOffset = parseInt(select.value,10);
            reminder.reminderSent = false;
            saveReminders()

            console.log(`Updated ${reminder.title} to trigger ${reminder.notifyOffset} minutes early.`);

        });

        label.innerText = `${reminder.title} - Alert me`;
        item.append(label,select);
        settingList.append(item);
    }

    function saveReminders() {
        localStorage.setItem("reminders", JSON.stringify(reminders));
    }

    function loadReminders(): Reminder[] {
        const remindersJSON = localStorage.getItem("reminders");
        if (!remindersJSON) return [];

        return JSON.parse(remindersJSON).map((reminder: any) => ({
            ...reminder,
            createdAt: new Date(reminder.createdAt),
            remindAt: reminder.remindAt ? new Date(reminder.remindAt) : undefined,
            notifyOffset: reminder.notifyOffset || 0 // Default to 0 if they haven't set it yet
        }));
    }