
// DOM Elements
export const statTask = document.getElementById('stat-tasks');
export const statStreak = document.getElementById('stat-streak');
export const statReview = document.getElementById('stat-review');

// Data Structures

type YeStats = {
    tasksCompletedMonth: number;
    currentMonth: number;
    currentYear: number;
    currentStreak: number;
    lastActiveRecall: string | null;

}

export function loadStats(): YeStats {
    const saved = localStorage.getItem('ye-stats');
    const now = new Date()

    let stats: YeStats = saved ? JSON.parse(saved) : {
        tasksCompletedMonth: 0,
        currentMonth: 0,
        currentYear: 0,
        currentStreak: 0,
        lastActiveRecall: null,
    };

    //Verify if the month has rolled over
    if (stats.currentMonth !== now.getMonth() || stats.currentYear !== now.getFullYear()) {
        stats.tasksCompletedMonth = 0;
        stats.currentMonth = now.getMonth();
        stats.currentYear = now.getFullYear();
        saveStats(stats)
    }

    return stats;

}

export function saveStats(stats: YeStats) {
    localStorage.setItem('ye-stats', JSON.stringify(stats));
    updateDashboardUI();
}

export function TasksCompletedIncrements(amount:number){
    const stats = loadStats();
    stats.tasksCompletedMonth += amount;
    saveStats(stats);
}

export function updateDashboardUI() {
    const stats = loadStats();

    if (statTask) statTask.textContent = stats.tasksCompletedMonth.toString();
    if (statStreak) statStreak.innerHTML = `${stats.currentStreak} <span class="text-lg font-medium opacity-80">days</span>`;

    // Calculate how many items are due today
    if (statReview) {
        // 1. MAKE SURE THIS MATCHES YOUR NOTES PAGE ("ye-notes")
        const savedNotes = localStorage.getItem("ye-notes");
        let dueCount = 0;

        if (savedNotes) {
            const allNotes = JSON.parse(savedNotes);
            const now = Date.now();

            // 2. Count notes where needsReview is TRUE and due date is past/present
            dueCount = allNotes.filter((n: any) =>
                n.needsReview === true &&
              //  (n.nextReviewDate || 0) <= now &&
                (n.title.trim() !== "" || n.body.trim() !== "")
            ).length;
        }

        statReview.textContent = dueCount.toString();
    }
}

updateDashboardUI();
