import { updateDashboardUI} from "../Dashboard/Stats";

// Daily logic
const intentionInputMode = document.getElementById("intention-input-mode")!;
const intentionDisplayMode = document.getElementById("intention-display-mode")!;
const intentionInput = document.querySelector<HTMLInputElement>("#daily-intention-input")!;
const intentionText = document.getElementById("intention-text")!;
const saveIntentionBtn = document.getElementById("save-intention-btn")!;
const editIntentionBtn = document.getElementById("edit-intention-btn")!;

function loadDailyIntention() {
    const saved = localStorage.getItem("daily_intention");
    const today = new Date().toDateString();

    if (saved) {
        const parsed = JSON.parse(saved);
        // If the saved intention is from today, display it. Otherwise, clear it.
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

    const data = {
        date: new Date().toDateString(),
        text: text
    };

    localStorage.setItem("daily_intention", JSON.stringify(data));
    showIntentionDisplay(text);
}

function showIntentionDisplay(text: string) {
    if(intentionText) intentionText.textContent = text;
    if(intentionInputMode) intentionInputMode.classList.add("hidden");
    if(intentionDisplayMode) intentionDisplayMode.classList.remove("hidden");
}

function showIntentionInput() {
    if(intentionDisplayMode) intentionDisplayMode.classList.add("hidden");
    if(intentionInputMode) intentionInputMode.classList.remove("hidden");
    if(intentionInput) intentionInput.focus();
}

if(saveIntentionBtn) saveIntentionBtn.addEventListener("click", saveDailyIntention);
if(editIntentionBtn) editIntentionBtn.addEventListener("click", showIntentionInput);
if(intentionInput) {
    intentionInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveDailyIntention();
    });
}

// FLASHCARD LOGIC

//Constants
const recallContainer = document.getElementById("recallContainer")!;
const noNoteMessage = document.getElementById("noNoteMessage")!;
const recallTitle = document.getElementById("recallTitle")!;
const revealNoteBtn = document.getElementById("revealNoteBtn")!;
const recallBody = document.getElementById("recallBody")!;
const confidenceBtns = document.querySelectorAll<HTMLButtonElement>(".confidence-btn")!;

let dueNotes: any [] = [];
let currentNote: any = null;

export function initialMemoryCheck() {
    const savedNotes = localStorage.getItem("ye-notes");

    if (savedNotes) {
        const allNotes = JSON.parse(savedNotes);

        dueNotes = allNotes.filter((n: any) =>
            n.needsReview === true &&
            (n.title.trim() !== "" || n.body.trim() !== "")
        );
    }

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

    recallBody.textContent = plainText.trim() || "(No body text written)";}

function revealNote(){
    revealNoteBtn.classList.add("hidden");
    recallContainer.classList.remove("hidden");
    recallContainer.classList.add("flex");
}

function handleConfidenceRating(e:Event) {
    if (!currentNote) return;

    const btn = e.currentTarget as HTMLButtonElement;
    const rating = btn.dataset.rating;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    let daystoAdd = 1;

    if (rating === "medium") daystoAdd = 3;
    if (rating === "high") daystoAdd = 7;

    // 1. Calculate the new future date
    const newDate = Date.now() + (daystoAdd * ONE_DAY);

    // 2. Fetch all notes, find this specific one, and update it
    const allNotes = JSON.parse(localStorage.getItem("ye-notes") || "[]");
    const noteIndex = allNotes.findIndex((n: any) => n.id === currentNote.id);

    if (noteIndex > -1) {
        allNotes[noteIndex].nextReviewDate = newDate;

        allNotes[noteIndex].needsReview = false;

        localStorage.setItem("ye-notes", JSON.stringify(allNotes));
    }

    dueNotes = dueNotes.filter((n: any) => n.id !== currentNote.id);

    updateDashboardUI();

    // 4. Move to the next card or finish the session
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