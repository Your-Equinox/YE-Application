import { updateDashboardUI } from "../Dashboard/Stats";
import { loadNotes, saveNote } from "../../Supabase/NoteService";

// Daily intention logic
const intentionInputMode = document.getElementById("intention-input-mode")!;
const intentionDisplayMode = document.getElementById("intention-display-mode")!;
const intentionInput = document.querySelector<HTMLInputElement>("#daily-intention-input")!;
const intentionText     = document.getElementById("intention-text")!;
const saveIntentionBtn = document.getElementById("save-intention-btn")!;
const editIntentionBtn = document.getElementById("edit-intention-btn")!;

function loadDailyIntention() {
    const saved = localStorage.getItem("daily_intention");
    const today = new Date().toDateString();

    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today && parsed.text) {
            showIntentionDisplay(parsed.text);
            return;
        }
    }
    showIntentionInput();
}

function saveDailyIntention() {
    const text = intentionInput.value.trim();
    if (!text) return;
    localStorage.setItem("daily_intention", JSON.stringify({
        date: new Date().toDateString(),
        text,
    }));
    showIntentionDisplay(text);
}

function showIntentionDisplay(text: string) {
    if (intentionText) intentionText.textContent = text;
    if (intentionInputMode) intentionInputMode.classList.add("hidden");
    if (intentionDisplayMode) intentionDisplayMode.classList.remove("hidden");
}

function showIntentionInput() {
    if (intentionDisplayMode) intentionDisplayMode.classList.add("hidden");
    if (intentionInputMode) intentionInputMode.classList.remove("hidden");
    if (intentionInput) intentionInput.focus();
}

if (saveIntentionBtn) saveIntentionBtn.addEventListener("click", saveDailyIntention);
if (editIntentionBtn) editIntentionBtn.addEventListener("click", showIntentionInput);
if (intentionInput) {
    intentionInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveDailyIntention();
    });
}

// Flashcard logic
const recallContainer = document.getElementById("recallContainer")!;
const noNoteMessage = document.getElementById("noNoteMessage")!;
const recallTitle = document.getElementById("recallTitle")!;
const revealNoteBtn = document.getElementById("revealNoteBtn")!;
const recallBody = document.getElementById("recallBody")!;
const confidenceBtns = document.querySelectorAll<HTMLButtonElement>(".confidence-btn")!;

let dueNotes: any[] = [];
let currentNote: any = null;

export async function initialMemoryCheck() {
    const allNotes = await loadNotes();
    const now = Date.now();
    let requiresSave = true;

    for (const n of allNotes){
        if (!n.needsReview && n.nextReviewDate && now >= n.nextReviewDate) {
            n.needsReview = true;
            await saveNote(n);
            requiresSave = true;
        }
    }

    if (requiresSave){
        await updateDashboardUI();
    }

    dueNotes = allNotes.filter((n: any) =>
        n.needsReview === true &&
        (n.title.trim() !== "" || n.body.trim() !== "")
    );

    if (dueNotes.length === 0) {
        recallContainer.classList.add("hidden");
        noNoteMessage.classList.remove("hidden");
        noNoteMessage.innerHTML = `<p class="mb-2 text-green-600 font-bold">🎉 All caught up!</p><p>You have no more notes to review today.</p>`;
    } else {
        noNoteMessage.classList.add("hidden");
        recallContainer.classList.remove("hidden");
        pickRandomNote();
    }
}

function pickRandomNote() {
    revealNoteBtn.classList.remove("hidden");
    recallContainer.classList.add("hidden");
    recallContainer.classList.remove("flex");

    const randomIndex = Math.floor(Math.random() * dueNotes.length);
    currentNote = dueNotes[randomIndex];

    recallTitle.textContent = currentNote.title.trim() || "Untitled Note";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = currentNote.body || "";
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    recallBody.textContent = plainText.trim() || "(No body text written)";
}

function revealNote() {
    revealNoteBtn.classList.add("hidden");
    recallContainer.classList.remove("hidden");
    recallContainer.classList.add("flex");
}

async function handleConfidenceRating(e: Event) {
    if (!currentNote) return;

    const btn = e.currentTarget as HTMLButtonElement;
    const rating = btn.dataset.rating;

    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Check if the user wants to dismiss this card permanently
    if (rating === "not-required") {
        currentNote.nextReviewDate = null; // Removes the date so calendar/reminders ignore it
        currentNote.needsReview = false;
    } else {
        // Otherwise, calculate the future date
        let daysToAdd = 1;
        if (rating === "medium") daysToAdd = 3;
        if (rating === "high") daysToAdd = 7;

        currentNote.nextReviewDate = Date.now() + (daysToAdd * ONE_DAY);
        currentNote.needsReview = false;
    }

    await saveNote(currentNote);
    await updateDashboardUI();

    // Remove the note from the current queue
    dueNotes = dueNotes.filter((n: any) => n.id !== currentNote.id);

    // Check if the session is done
    if (dueNotes.length === 0) {
        recallContainer.classList.add("hidden");
        noNoteMessage.classList.remove("hidden");
        noNoteMessage.innerHTML = `<p class="mb-2 text-green-600 font-bold">🎉 Session Complete!</p><p>You've cleared all active flashcards.</p>`;
    } else {
        pickRandomNote();
    }
}

revealNoteBtn.addEventListener("click", revealNote);
confidenceBtns.forEach(btn => btn.addEventListener("click", handleConfidenceRating));

loadDailyIntention();
initialMemoryCheck();