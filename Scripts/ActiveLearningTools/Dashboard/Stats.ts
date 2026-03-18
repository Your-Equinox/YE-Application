// DOM Elements
export const statTaskDay = document.getElementById('stat-task-day');
export const statTaskWeek = document.getElementById('stat-task-week');
export const statTaskMonth = document.getElementById('stat-task-month');
export const statReview = document.getElementById('stat-review');
export const dashboardUserName = document.getElementById('dashboard-user-name'); // <-- Add this line

// Data Structures
type YeStats = {
    taskCompletedDay: number;
    taskCompletedWeek: number;
    tasksCompletedMonth: number;
    currentDay: number;
    currentWeek: number;
    currentMonth: number;
    currentYear: number;
    currentStreak: number;
    lastActiveRecall: string | null;
}

export function loadStats(): YeStats {
    const saved = localStorage.getItem('ye-stats');
    const now = new Date();
    const today = now.getDate();
    const thisWeek = getWeekNumber(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // 1. Create a bulletproof default object
    const defaultStats: YeStats = {
        taskCompletedDay: 0,
        taskCompletedWeek: 0,
        tasksCompletedMonth: 0,
        currentDay: today,
        currentWeek: thisWeek,
        currentMonth: thisMonth,
        currentYear: thisYear,
        currentStreak: 0,
        lastActiveRecall: null,
    };

    // 2. Merge defaults with saved data to prevent undefined errors
    let stats: YeStats = saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;

    let statsChanged = false;

    // Verify if the year rolled over
    if (stats.currentYear !== thisYear) {
        stats.tasksCompletedMonth = 0;
        stats.taskCompletedWeek = 0;
        stats.taskCompletedDay = 0;
        stats.currentYear = thisYear;
        stats.currentMonth = thisMonth;
        stats.currentWeek = thisWeek;
        stats.currentDay = today;
        statsChanged = true;
    } else {
        // Verify if the month rolled over
        if (stats.currentMonth !== thisMonth) {
            stats.tasksCompletedMonth = 0;
            stats.currentMonth = thisMonth;
            statsChanged = true;
        }
        // Verify if the week rolled over
        if (stats.currentWeek !== thisWeek) {
            stats.taskCompletedWeek = 0;
            stats.currentWeek = thisWeek;
            statsChanged = true;
        }
        // Verify if the day rolled over
        if (stats.currentDay !== today) {
            stats.taskCompletedDay = 0;
            stats.currentDay = today;
            statsChanged = true;
        }
    }

    // Save directly to localStorage to prevent the updateDashboardUI infinite loop
    if (statsChanged) {
        localStorage.setItem('ye-stats', JSON.stringify(stats));
    }

    return stats;
}

export function saveStats(stats: YeStats) {
    localStorage.setItem('ye-stats', JSON.stringify(stats));
    updateDashboardUI();
}

export function TasksCompletedIncrements(amount: number) {
    const stats = loadStats();
    stats.taskCompletedDay += amount;
    stats.taskCompletedWeek += amount;
    stats.tasksCompletedMonth += amount;
    saveStats(stats);
}

// Helper function to get the current week number of the year
function getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function updateDashboardUI() {
    const stats = loadStats();

    if (dashboardUserName) {
        const savedName = localStorage.getItem("DisplayName");
        dashboardUserName.textContent = savedName || "Name";
    }
    // 3. Add `|| 0` safety nets so UI never crashes if a property is missing
    if (statTaskDay) statTaskDay.textContent = (stats.taskCompletedDay || 0).toString();
    if (statTaskWeek) statTaskWeek.textContent = (stats.taskCompletedWeek || 0).toString();
    if (statTaskMonth) statTaskMonth.textContent = (stats.tasksCompletedMonth || 0).toString();

    // Calculate how many items are due today
    if (statReview) {
        const savedNotes = localStorage.getItem("ye-notes");
        let dueCount = 0;

        if (savedNotes) {
            const allNotes = JSON.parse(savedNotes);

            // Count notes where needsReview is TRUE and title/body isn't empty
            dueCount = allNotes.filter((n: any) =>
                n.needsReview === true &&
                (n.title.trim() !== "" || n.body.trim() !== "")
            ).length;
        }

        statReview.textContent = dueCount.toString();
    }
}

updateDashboardUI();