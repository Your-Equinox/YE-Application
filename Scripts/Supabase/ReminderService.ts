import { supabase } from "./supabaseClient";
import type { Reminder } from "../Reminders/AddReminder";

export async function saveRemidner(reminder:Reminder): Promise<void> {
    if (reminder.id.startsWith("review-")) return;
}

export async function loadReminders(): Promise<Reminder[]> {
    const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to load reminders:", error.message);
        return [];
    }

    return data.map((r: any) => ({
        id: r.id,
        title: r.title,
        completed: r.completed,
        createdAt: new Date(r.created_at),
        remindAt: r.remind_at ? new Date(r.remind_at) : undefined,
        reminderSent: r.reminder_sent,
        notifyOffset: r.notify_offset,
        colorClass: "custom-color",
        colorHex: r.color_hex,
    }));
}

export async function saveReminder(reminder: Reminder): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("reminders").upsert({
        id: reminder.id,
        user_id: session.user.id,
        title: reminder.title,
        completed: reminder.completed,
        created_at: reminder.createdAt,
        remind_at: reminder.remindAt ?? null,
        reminder_sent: reminder.reminderSent,
        notify_offset: reminder.notifyOffset,
        color_hex: reminder.colorHex,
    });

    if (error) console.error("Failed to save reminder:", error.message);
}

export async function deleteReminder(id: string): Promise<void> {

    if (id.startsWith("review-")) return;

    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) console.error("Failed to delete reminder:", error.message);
}

export async function deleteExpiredAndCompletedReminders(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date().toISOString();

    const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("user_id", session.user.id)
        .or(`completed.eq.true,remind_at.lt.${now}`);

    if (error) console.error("Failed to delete expired reminders:", error.message);
}