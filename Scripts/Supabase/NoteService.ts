/*  Service Layer for NotePage
*   This code was written to help with local storage to (Supabase) database migration
*/
import { supabase } from "./supabaseClient";

export type QuizQuestion = {
    type?: "reveal" | "tf" | "mc";
    q: string;
    a: string;
    options?: string[];
};

export type Note = {
    id: string;
    title: string;
    body: string;
    lastEdited: number;
    nextReviewDate: number | null;
    needsReview: boolean;
    categoryID: string | null;
    TestQuestions?: QuizQuestion[];
};

export async function loadNotes(): Promise<Note[]> {
    const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("last_edited", { ascending: false });

    if (error) {
        console.error("Failed to load notes:", error.message);
        return [];
    }

    // Map Supabase snake_case columns back to your app's camelCase
    return data.map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        lastEdited: n.last_edited,
        nextReviewDate: n.next_review_date,
        needsReview: n.needs_review,
        categoryID: n.category_id,
        TestQuestions: n.test_questions,
    }));
}

export async function saveNote(note: Note): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("notes").upsert({
        id: note.id,
        user_id: session.user.id,
        title: note.title,
        body: note.body,
        last_edited: note.lastEdited,
        next_review_date: note.nextReviewDate ?? null,
        needs_review: note.needsReview,
        category_id: note.categoryID,
        test_questions: note.TestQuestions ?? null,
    });

    if (error) console.error("Failed to save note:", error.message);
}

export async function deleteNote(id: string): Promise<void> {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) console.error("Failed to delete note:", error.message);
}