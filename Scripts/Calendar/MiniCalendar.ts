// Scripts/Calendar/MiniCalendar.ts
import { loadReminders, Reminder } from "../Reminders/AddReminder";

// Use dayjs from the global window object (loaded via CDN in index.html)
declare const dayjs: any;

const monthYearDisplay = document.getElementById("mc-month-year")!;
const grid = document.getElementById("mc-grid")!;
const prevBtn = document.getElementById("mc-prev")!;
const nextBtn = document.getElementById("mc-next")!;

let currentDate = dayjs();

function renderMiniCalendar() {
    grid.innerHTML = "";

    // 1. Set Header
    monthYearDisplay.innerText = currentDate.format("MMMM YYYY");

    // 2. Add Day Names
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    daysOfWeek.forEach(day => {
        const el = document.createElement("div");
        el.className = "mc-day-name";
        el.innerText = day;
        grid.appendChild(el);
    });

    // 3. Calculate Grid start and end
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = currentDate.daysInMonth();

    // 4. Load Reminders to find active dates
    const reminders: Reminder[] = loadReminders();
    const reminderDates = reminders
        .filter(r => !r.completed && r.remindAt)
        .map(r => dayjs(r.remindAt).format("YYYY-MM-DD"));

    // 5. Fill empty slots before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
        const empty = document.createElement("div");
        grid.appendChild(empty);
    }

    // 6. Fill days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement("div");
        dayCell.className = "mc-day";
        dayCell.innerText = i.toString();

        const cellDate = currentDate.date(i).format("YYYY-MM-DD");

        // Highlight today
        if (cellDate === dayjs().format("YYYY-MM-DD")) {
            dayCell.classList.add("today");
        }

        // Highlight days with reminders
        if (reminderDates.includes(cellDate)) {
            dayCell.classList.add("has-reminder");
            dayCell.title = "You have a reminder on this date!";
        }

        grid.appendChild(dayCell);
    }
}

// Listeners for month navigation
prevBtn.addEventListener("click", () => {
    currentDate = currentDate.subtract(1, "month");
    renderMiniCalendar();
});

nextBtn.addEventListener("click", () => {
    currentDate = currentDate.add(1, "month");
    renderMiniCalendar();
});

// Initial Render
renderMiniCalendar();