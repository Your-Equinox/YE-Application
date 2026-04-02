import { supabase } from "./supabaseClient";
import type { Task } from "../Tasks/AddTasks";

export async function loadTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to load tasks:", error.message);
        return [];
    }

    return data.map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: new Date(t.created_at),
    }));
}

export async function saveTask(task: Task): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("tasks").upsert({
        id: task.id,
        user_id: session.user.id,
        title: task.title,
        completed: task.completed,
        created_at: task.createdAt,
    });

    if (error) console.error("Failed to save task:", error.message);
}

export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error("Failed to delete task:", error.message);
}

export async function deleteAllCompletedTasks(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("user_id", session.user.id)
        .eq("completed", true);

    if (error) console.error("Failed to delete completed tasks:", error.message);
}