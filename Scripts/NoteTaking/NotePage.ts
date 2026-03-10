import { v4 as uuidv4 } from "uuid";

// --- Types ---
export type Note = {
    id: string;
    title: string;
    body: string;
    lastEdited: number;
    nextReviewDate: number;
    needsReview: boolean;
    TestQuestions?: { q: string; a: string }[];
};

// --- DOM Elements ---
const sidebarList = document.querySelector<HTMLUListElement>("#sidebar-note-list")!;
const newNoteBtn = document.querySelector<HTMLButtonElement>("#new-note-btn")!;
const deleteNoteBtn = document.querySelector<HTMLButtonElement>("#delete-note-btn")!;
const toggleFlashcardBtn = document.getElementById("toggle-flashcard-btn")!;
const generateQuizBtn = document.getElementById("generate-quiz-btn") as HTMLButtonElement;

// AI Elements
const aiAssistBtn = document.getElementById("ai-assist-btn") as HTMLButtonElement;
const aiSidebar = document.getElementById("ai-sidebar") as HTMLElement;
const closeAiBtn = document.getElementById("close-ai-btn") as HTMLButtonElement;
const aiForm = document.getElementById("ai-form") as HTMLFormElement;
const aiInput = document.getElementById("ai-input") as HTMLInputElement;
const aiChatHistory = document.getElementById("ai-chat-history") as HTMLElement;
const aiSubmitBtn = document.getElementById("ai-submit-btn") as HTMLButtonElement;

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

titleInput.addEventListener("input", saveActiveNote);
bodyInput.addEventListener("input", saveActiveNote);

toggleFlashcardBtn.addEventListener("click", () => {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
        note.needsReview = !note.needsReview;
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
        needsReview: false,
    };

    notes.unshift(newNote);
    saveToLocalStorage();
    setActiveNote(newNote.id);
}

function setActiveNote(id: string) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) {
        editorContainer.classList.add("hidden");
        aiAssistBtn?.classList.remove("hidden");
        emptyState.classList.remove("hidden");
        return;
    }

    titleInput.value = note.title;
    bodyInput.value = note.body;

    emptyState.classList.add("hidden");
    editorContainer.classList.remove("hidden");
    editorContainer.classList.add("flex");

    aiAssistBtn?.classList.remove("hidden");

    updateFlashcardButtonUI(note.needsReview);
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

        const sidebarLink = document.querySelector(`[data-note-id="${activeNoteId}"] span`);
        if (sidebarLink) {
            sidebarLink.textContent = note.title.trim() || "Untitled";
        }
    }
}

export function deleteActiveNote() {
    if (!activeNoteId) return;
    if (!confirm("Are you sure you want to delete this note?")) return;

    // FIX 4: Added '?.' so the delete function doesn't crash on missing AI HTML
    aiAssistBtn?.classList.add("hidden");
    aiSidebar?.classList.add("translate-x-full");

    notes = notes.filter(n => n.id !== activeNoteId);
    saveToLocalStorage();

    activeNoteId = null;
    editorContainer.classList.add("hidden");
    editorContainer.classList.remove("flex");
    emptyState.classList.remove("hidden");

    renderSidebar();
}

function updateFlashcardButtonUI(isActive: boolean) {
    if (!toggleFlashcardBtn) return;
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
    notes.sort((a, b) => b.lastEdited - a.lastEdited);

    notes.forEach(note => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.dataset.noteId = note.id;

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

// AI Logic Implementation


// Generating Quizzes
generateQuizBtn?.addEventListener("click", async () => {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (!note || note.body.trim().length < 20) {
        alert("Please write some more notes first before generating a quiz!");
        return;
    }

    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
        alert("Please set your Gemini API key in the Settings page first!");
        return;
    }

    const originalText = generateQuizBtn.innerHTML;
    generateQuizBtn.innerHTML = `<span>⏳</span> Generating...`;
    generateQuizBtn.disabled = true;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `You are a strict tutor. Read the user's notes and generate exactly 3 self-test questions based on the content. You MUST return ONLY a valid JSON array of objects. Do NOT wrap the response in markdown blocks (like \`\`\`json). Each object must have a 'q' property for the question and an 'a' property for the answer. Example: [{"q": "What is biology?", "a": "The study of life."}]\n\nNotes:\n${note.body}` }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let aiResponse = data.candidates[0].content.parts[0].text;
        aiResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        const questionsArray = JSON.parse(aiResponse);

        // --- NEW: Save to the current note and redirect! ---
        note.TestQuestions = questionsArray;
        saveToLocalStorage();

        window.location.href = `/public/ye-quiz.html?noteId=${note.id}`;

    } catch (error) {
        console.error("AI Error:", error);
        alert("Failed to generate quiz. Check the console for errors.");
    } finally {
        generateQuizBtn.innerHTML = originalText;
        generateQuizBtn.disabled = false;
    }
});

// Sidebar Event Listeners (Cleaned up duplicates)
aiAssistBtn?.addEventListener("click", () => {
    aiSidebar?.classList.remove("translate-x-full");
    aiInput?.focus();
});

closeAiBtn?.addEventListener("click", () => {
    aiSidebar?.classList.add("translate-x-full");
});

function appendMessage(text: string, isUser: boolean) {
    if (!aiChatHistory) return;
    const msgDiv = document.createElement("div");

    msgDiv.className = `p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
            ? 'bg-blue-600 text-white ml-8 rounded-br-none self-end'
            : 'bg-white border border-gray-200 text-gray-800 mr-8 rounded-bl-none shadow-sm self-start'
    }`;

    msgDiv.textContent = text;
    aiChatHistory.appendChild(msgDiv);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
}

// Sidebar Chat Submission
aiForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeNoteId) return;

    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
        alert("Please set your Gemini API key in the Settings page first!");
        return;
    }

    const promptText = aiInput.value.trim();
    if (!promptText) return;

    aiInput.value = "";
    appendMessage(promptText, true);

    const noteContent = bodyInput.value;
    const originalBtnText = aiSubmitBtn.innerText;
    aiSubmitBtn.innerText = "...";
    aiSubmitBtn.disabled = true;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Instructions: ${promptText}\n\nDocument Text:\n${noteContent}` }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const aiResponse = data.candidates[0].content.parts[0].text;
        appendMessage(aiResponse, false);

    } catch (error) {
        console.error("AI Error:", error);
        appendMessage("⚠️ There was an error communicating with the AI. Please double-check your API key in settings or try again.", false);
    } finally {
        aiSubmitBtn.innerText = originalBtnText;
        aiSubmitBtn.disabled = false;
        aiInput.focus();
    }
});

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