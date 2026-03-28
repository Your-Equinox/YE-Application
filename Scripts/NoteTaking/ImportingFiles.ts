import { v4 as uuidv4 } from "uuid";
import * as mammoth from "mammoth";
import * as pdfjslib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { supabase } from "../Supabase/supabaseClient";
import { saveNote } from "../Supabase/NoteService";
import { saveTask } from "../Supabase/TaskService";
import { saveReminder } from "../Supabase/ReminderService";
import { saveStats } from "../Supabase/StatsService";

const importDocumentBtn = document.querySelector<HTMLButtonElement>("#importDocument-btn");
const importFileInput = document.querySelector<HTMLInputElement>("#import-file");

pdfjslib.GlobalWorkerOptions.workerSrc = pdfWorker;

if (importDocumentBtn && importFileInput) {
    importDocumentBtn.addEventListener("click", () => {
        importFileInput.click();
    });

    importFileInput.addEventListener("change", async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        try {
            if (fileExtension === "json") {
                await handleJsonBackup(file);
            } else if (fileExtension === "docx") {
                await handleDocxImport(file);
            } else if (fileExtension === "pdf") {
                await handlePdfImport(file);
            } else if (fileExtension === "txt" || fileExtension === "md") {
                await handleTextImport(file);
            } else {
                alert("File type is not supported.");
            }
        } catch (error) {
            console.error("Error processing file:", error);
            alert("Failed to process file.");
        } finally {
            target.value = "";
        }
    });
}

// --- File Handlers ---

async function handleJsonBackup(file: File) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("You must be logged in to restore a backup.");
        return;
    }

    const text = await file.text();
    const importedData = JSON.parse(text);
    const uid = session.user.id;

    // Restore notes
    if (importedData.notes && Array.isArray(importedData.notes)) {
        for (const n of importedData.notes) {
            await saveNote({
                id: n.id || uuidv4(),
                title: n.title || "",
                body: n.body || "",
                lastEdited: n.last_edited || n.lastEdited || Date.now(),
                nextReviewDate: n.next_review_date || n.nextReviewDate || Date.now(),
                needsReview: n.needs_review ?? n.needsReview ?? false,
                categoryID: n.category_id || n.categoryID || null,
                TestQuestions: n.test_questions || n.TestQuestions || null,
            });
        }
    }

    // Restore tasks
    if (importedData.tasks && Array.isArray(importedData.tasks)) {
        for (const t of importedData.tasks) {
            await saveTask({
                id: t.id || uuidv4(),
                title: t.title || "",
                completed: t.completed ?? false,
                createdAt: new Date(t.created_at || t.createdAt || Date.now()),
            });
        }
    }

    // Restore reminders
    if (importedData.reminders && Array.isArray(importedData.reminders)) {
        for (const r of importedData.reminders) {
            await saveReminder({
                id: r.id || uuidv4(),
                title: r.title || "",
                completed: r.completed ?? false,
                createdAt: new Date(r.created_at || r.createdAt || Date.now()),
                remindAt: r.remind_at || r.remindAt ? new Date(r.remind_at || r.remindAt) : undefined,
                reminderSent: r.reminder_sent ?? r.reminderSent ?? false,
                notifyOffset: r.notify_offset ?? r.notifyOffset ?? 0,
                colorClass: r.colorClass || "custom-color",
                colorHex: r.color_hex || r.colorHex || "#3b82f6",
            });
        }
    }

    // Restore stats
    if (importedData.stats) {
        const s = importedData.stats;
        await saveStats({
            taskCompletedDay: s.task_completed_day ?? s.taskCompletedDay ?? 0,
            taskCompletedWeek: s.task_completed_week ?? s.taskCompletedWeek ?? 0,
            tasksCompletedMonth: s.tasks_completed_month ?? s.tasksCompletedMonth ?? 0,
            currentDay: s.current_day ?? s.currentDay ?? 0,
            currentWeek: s.current_week ?? s.currentWeek ?? 0,
            currentMonth: s.current_month ?? s.currentMonth ?? 0,
            currentYear: s.current_year ?? s.currentYear ?? 0,
            currentStreak: s.current_streak ?? s.currentStreak ?? 0,
            lastActiveRecall: s.last_active_recall ?? s.lastActiveRecall ?? null,
        });
    }

    // Restore Gemini API key (still localStorage — it's a client secret)
    if (importedData.settings?.geminiApiKey) {
        localStorage.setItem("gemini_api_key", importedData.settings.geminiApiKey);
    }

    alert("Backup restored successfully! Returning to Dashboard.");
    window.location.href = "/index.html";
}

async function handleDocxImport(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    await createNoteFromFile(file.name, result.value);
}

async function handlePdfImport(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjslib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
    }

    await createNoteFromFile(file.name, fullText);
}

async function handleTextImport(file: File) {
    const text = await file.text();
    await createNoteFromFile(file.name, text);
}

async function createNoteFromFile(filename: string, content: string) {
    const title = filename.replace(/\.[^/.]+$/, "");

    await saveNote({
        id: uuidv4(),
        title,
        body: content.trim(),
        lastEdited: Date.now(),
        nextReviewDate: Date.now(),
        needsReview: false,
        categoryID: null,
    });

    alert(`Successfully imported "${title}" into your notes!`);
}