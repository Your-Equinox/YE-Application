import { loadStats, saveStats } from "../../Supabase/StatsService";
import { supabase } from "../../Supabase/supabaseClient";

// DOM Elements
export const statTaskDay = document.getElementById('stat-task-day');
export const statTaskWeek = document.getElementById('stat-task-week');
export const statTaskMonth = document.getElementById('stat-task-month');
export const statReview = document.getElementById('stat-review');
export const dashboardUserName = document.getElementById('dashboard-user-name');

export async function updateDashboardUI() {
    const stats = await loadStats();

    // Load display name from Supabase profiles
    if (dashboardUserName) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("id", session.user.id)
                .single();
            dashboardUserName.textContent = data?.display_name || "User";
        }
    }

    if (statTaskDay) statTaskDay.textContent = (stats.taskCompletedDay || 0).toString();
    if (statTaskWeek) statTaskWeek.textContent = (stats.taskCompletedWeek || 0).toString();
    if (statTaskMonth) statTaskMonth.textContent = (stats.tasksCompletedMonth || 0).toString();

    // Count notes due for review from Supabase
    if (statReview) {
        const { data } = await supabase
            .from("notes")
            .select("id")
            .eq("needs_review", true);

        statReview.textContent = (data?.length || 0).toString();
    }
}

updateDashboardUI();