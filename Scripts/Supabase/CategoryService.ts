/*  Service Layer for Categories
*   This code was written to help with local storage to (Supabase) database migration
*/
import { supabase } from "./supabaseClient";

export type Category = { id: string; name: string };

export async function loadCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Failed to load categories:", error.message);
        return [];
    }

    return data.map((c: any) => ({ id: c.id, name: c.name }));
}

export async function saveCategory(category: Category): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("categories").upsert({
        id: category.id,
        user_id: session.user.id,
        name: category.name,
    });

    if (error) console.error("Failed to save category:", error.message);
}

export async function deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) console.error("Failed to delete category:", error.message);
}