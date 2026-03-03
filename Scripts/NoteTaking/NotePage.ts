import { v4 as uuidv4 } from "uuid";

// --- Types ---
export type Note = {
    id: string;
    title: string;
    body: string;
    lastEdited: number;
};

// --- DOM Elements ---
const sidebarList = document.querySelector<HTMLUListElement>("#sidebar-note-list")!;
const newNoteBtn = document.querySelector<HTMLButtonElement>("#new-note-btn")!;
const deleteNoteBtn = document.querySelector<HTMLButtonElement>("#delete-note-btn")!;

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

// --- Core Functions ---

function createNewNote() {
    const newNote: Note = {
        id: uuidv4(),
        title: "",
        body: "",
        lastEdited: Date.now(),
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

    // Re-render sidebar to highlight the active note
    renderSidebar();

    // Focus the title input automatically
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
        // (to avoid losing input focus while typing)
        const sidebarLink = document.querySelector(`[data-note-id="${activeNoteId}"] span`);
        if (sidebarLink) {
            sidebarLink.textContent = note.title.trim() || "Untitled";
        }
    }
}

function deleteActiveNote() {
    if (!activeNoteId) return;

    // Confirm deletion just in case
    if (!confirm("Are you sure you want to delete this note?")) return;

    // Filter out the deleted note
    notes = notes.filter(n => n.id !== activeNoteId);
    saveToLocalStorage();

    // Reset state
    activeNoteId = null;
    editorContainer.classList.add("hidden");
    editorContainer.classList.remove("flex");
    emptyState.classList.remove("hidden");

    renderSidebar();
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

        // Use a span so we can target it easily during auto-save
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
    localStorage.setItem("ye_notes", JSON.stringify(notes));
}

function loadNotes(): Note[] {
    const saved = localStorage.getItem("ye_notes");
    return saved ? JSON.parse(saved) : [];
}