import { supabase } from "./supabaseClient";

export type YeStats = {
    taskCompletedDay: number;
    taskCompletedWeek: number;
    tasksCompletedMonth: number;
    currentDay: number;
    currentWeek: number;
    currentMonth: number;
    currentYear: number;
    currentStreak: number;
    lastActiveRecall: string | null;
};

export async function loadStats(): Promise<YeStats> {
    const { data: { session } } = await supabase.auth.getSession();

    const now = new Date();
    const today = now.getDate();
    const thisWeek = getWeekNumber(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

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

    if (!session) return defaultStats;

    const { data, error } = await supabase
        .from("stats")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

    if (error || !data) return defaultStats;

    let stats: YeStats = {
        taskCompletedDay: data.task_completed_day,
        taskCompletedWeek: data.task_completed_week,
        tasksCompletedMonth: data.tasks_completed_month,
        currentDay: data.current_day,
        currentWeek: data.current_week,
        currentMonth: data.current_month,
        currentYear: data.current_year,
        currentStreak: data.current_streak,
        lastActiveRecall: data.last_active_recall,
    };

    // Reset counters if time periods have rolled over
    let changed = false;

    if (stats.currentYear !== thisYear) {
        stats = { ...stats, taskCompletedDay: 0, taskCompletedWeek: 0, tasksCompletedMonth: 0, currentDay: today, currentWeek: thisWeek, currentMonth: thisMonth, currentYear: thisYear };
        changed = true;
    } else {
        if (stats.currentMonth !== thisMonth) { stats.tasksCompletedMonth = 0; stats.currentMonth = thisMonth; changed = true; }
        if (stats.currentWeek !== thisWeek) { stats.taskCompletedWeek = 0; stats.currentWeek = thisWeek; changed = true; }
        if (stats.currentDay !== today) { stats.taskCompletedDay = 0; stats.currentDay = today; changed = true; }
    }

    if (changed) await saveStats(stats);

    return stats;
}

export async function saveStats(stats: YeStats): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("stats").upsert({
        user_id: session.user.id,
        task_completed_day: stats.taskCompletedDay,
        task_completed_week: stats.taskCompletedWeek,
        tasks_completed_month: stats.tasksCompletedMonth,
        current_day: stats.currentDay,
        current_week: stats.currentWeek,
        current_month: stats.currentMonth,
        current_year: stats.currentYear,
        current_streak: stats.currentStreak,
        last_active_recall: stats.lastActiveRecall,
    }, { onConflict: 'user_id' });

    if (error) console.error("Failed to save stats:", error.message);
}

export async function incrementTasksCompleted(amount: number): Promise<void> {
    const stats = await loadStats();
    stats.taskCompletedDay += amount;
    stats.taskCompletedWeek += amount;
    stats.tasksCompletedMonth += amount;
    await saveStats(stats);
}

function getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}