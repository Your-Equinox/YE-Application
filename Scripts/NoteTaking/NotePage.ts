import { v4 as uuidv4 } from "uuid";

// --- Types ---
export type Note = {
    id: string;
    title: string;
    body: string;
    lastEdited: number;
    nextReviewDate: number;
    needsReview: boolean; // Enables/disables flashcard queue
};

// --- DOM Elements ---
const sidebarList = document.querySelector<HTMLUListElement>("#sidebar-note-list")!;
const newNoteBtn = document.querySelector<HTMLButtonElement>("#new-note-btn")!;
const deleteNoteBtn = document.querySelector<HTMLButtonElement>("#delete-note-btn")!;
const toggleFlashcardBtn = document.getElementById("toggle-flashcard-btn")!;

const emptyState = document.querySelector<HTMLDivElement>("#empty-state")!;
const editorContainer = document.querySelector<HTMLDivElement>("#editor-container")!;
const titleInput = document.querySelector<HTMLInputElement>("#note-title")!;
const bodyInput = document.querySelector<HTMLTextAreaElement>("#note-body")!;

// --- State ---
let notes: Note[] = loadNotes();
let activeNoteId: string | null = null;

// --- Initialize ---
renderSidebar();

// --- Event Listeners ---
newNoteBtn.addEventListener("click", createNewNote);
deleteNoteBtn.addEventListener("click", deleteActiveNote);

// Auto-save listeners (fires on every keystroke)
titleInput.addEventListener("input", saveActiveNote);
bodyInput.addEventListener("input", saveActiveNote);

// Flashcard Toggle Listener
toggleFlashcardBtn.addEventListener("click", () => {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
        note.needsReview = !note.needsReview; // Flip the state
        saveToLocalStorage();
        updateFlashcardButtonUI(note.needsReview);
    }
});

// --- Core Functions ---

function createNewNote() {
    const newNote: Note = {
        id: uuidv4(),
        title: "",
        body: "",
        lastEdited: Date.now(),
        nextReviewDate: Date.now(),
        needsReview: false, // Turned off by default!
    };

    notes.unshift(newNote); // Put new note at the top of the list
    saveToLocalStorage();
    setActiveNote(newNote.id);
}

function setActiveNote(id: string) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) {
        // If no note found, show empty state
        editorContainer.classList.add("hidden");
        emptyState.classList.remove("hidden");
        return;
    }

    // Populate Editor
    titleInput.value = note.title;
    bodyInput.value = note.body;

    // Show Editor, Hide Empty State
    emptyState.classList.add("hidden");
    editorContainer.classList.remove("hidden");
    editorContainer.classList.add("flex");

    // Update the flashcard button visually
    updateFlashcardButtonUI(note.needsReview);

    // Re-render sidebar to highlight the active note
    renderSidebar();

    titleInput.focus();
}

function saveActiveNote() {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
        note.title = titleInput.value;
        note.body = bodyInput.value;
        note.lastEdited = Date.now();

        saveToLocalStorage();

        // Update just the text in the sidebar without fully re-rendering it
        const sidebarLink = document.querySelector(`[data-note-id="${activeNoteId}"] span`);
        if (sidebarLink) {
            sidebarLink.textContent = note.title.trim() || "Untitled";
        }
    }
}

export function deleteActiveNote() {
    if (!activeNoteId) return;

    // Confirm deletion just in case
    if (!confirm("Are you sure you want to delete this note?")) return;

    // Filter out the deleted note
    notes = notes.filter(n => n.id !== activeNoteId);
    saveToLocalStorage();

    // Reset state back to empty
    activeNoteId = null;
    editorContainer.classList.add("hidden");
    editorContainer.classList.remove("flex");
    emptyState.classList.remove("hidden");

    renderSidebar();
}

function updateFlashcardButtonUI(isActive: boolean) {
    if (isActive) {
        toggleFlashcardBtn.className = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-purple-100 text-purple-700 hover:bg-purple-200";
        toggleFlashcardBtn.innerHTML = `<span>🧠</span> Flashcard Active`;
    } else {
        toggleFlashcardBtn.className = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-gray-100 text-gray-500 hover:bg-gray-200";
        toggleFlashcardBtn.innerHTML = `<span>🧠</span> Enable Flashcard`;
    }
}

function renderSidebar() {
    sidebarList.innerHTML = "";

    // Sort notes by most recently edited
    notes.sort((a, b) => b.lastEdited - a.lastEdited);

    notes.forEach(note => {
        const li = document.createElement("li");

        const btn = document.createElement("button");
        btn.dataset.noteId = note.id;

        // Styling for active vs inactive notes
        const isActive = note.id === activeNoteId;
        btn.className = `w-full text-left px-3 py-2 rounded-md transition text-sm truncate ${
            isActive ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-200"
        }`;

        const titleSpan = document.createElement("span");
        titleSpan.textContent = note.title.trim() || "Untitled";

        btn.appendChild(titleSpan);
        btn.addEventListener("click", () => setActiveNote(note.id));

        li.appendChild(btn);
        sidebarList.appendChild(li);
    });
}

// --- Storage Utilities ---
function saveToLocalStorage() {
    localStorage.setItem("ye-notes", JSON.stringify(notes));
}

function loadNotes(): Note[] {
    const saved = localStorage.getItem("ye-notes");
    if (!saved) return [];

    return JSON.parse(saved).map((n: any) => ({
        ...n,
        nextReviewDate: n.nextReviewDate || Date.now(),
        needsReview: n.needsReview || false
    }));
}