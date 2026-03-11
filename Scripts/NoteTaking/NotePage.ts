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

// --- DOM Elements  ---
const sidebarList = document.getElementById("sidebar-note-list");
const newNoteBtn = document.getElementById("new-note-btn");
const deleteNoteBtn = document.getElementById("delete-note-btn");
const toggleFlashcardBtn = document.getElementById("toggle-flashcard-btn");
const generateQuizBtn = document.getElementById("generate-quiz-btn") as HTMLButtonElement | null;

// AI Elements
const aiAssistBtn = document.getElementById("ai-assist-btn") as HTMLButtonElement | null;
const aiSidebar = document.getElementById("ai-sidebar");
const closeAiBtn = document.getElementById("close-ai-btn");
const aiForm = document.getElementById("ai-form") as HTMLFormElement | null;
const aiInput = document.getElementById("ai-input") as HTMLInputElement | null;
const aiChatHistory = document.getElementById("ai-chat-history");
const aiSubmitBtn = document.getElementById("ai-submit-btn") as HTMLButtonElement | null;

const emptyState = document.getElementById("empty-state");
const editorContainer = document.getElementById("editor-container");
const titleInput = document.getElementById("note-title") as HTMLInputElement | null;
const bodyInput = document.getElementById("note-body") as HTMLTextAreaElement | null;

// --- State ---
let notes: Note[] = loadNotes();
let activeNoteId: string | null = null;

// --- Initialize ---
renderSidebar();

// --- Event Listeners (Safely Attached) ---
if (newNoteBtn) newNoteBtn.addEventListener("click", createNewNote);
if (deleteNoteBtn) deleteNoteBtn.addEventListener("click", deleteActiveNote);
if (titleInput) titleInput.addEventListener("input", saveActiveNote);
if (bodyInput) bodyInput.addEventListener("input", saveActiveNote);

if (toggleFlashcardBtn) {
    toggleFlashcardBtn.addEventListener("click", () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
            note.needsReview = !note.needsReview;
            saveToLocalStorage();
            updateFlashcardButtonUI(note.needsReview);
        }
    });
}

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
        if (editorContainer) editorContainer.classList.add("hidden");
        if (aiAssistBtn) aiAssistBtn.classList.remove("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (titleInput) titleInput.value = note.title;
    if (bodyInput) bodyInput.value = note.body;

    if (emptyState) emptyState.classList.add("hidden");
    if (editorContainer) {
        editorContainer.classList.remove("hidden");
        editorContainer.classList.add("flex");
    }

    if (aiAssistBtn) aiAssistBtn.classList.remove("hidden");

    updateFlashcardButtonUI(note.needsReview);
    renderSidebar();
    if (titleInput) titleInput.focus();
}

function saveActiveNote() {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (note && titleInput && bodyInput) {
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

    notes = notes.filter(n => n.id !== activeNoteId);

    saveToLocalStorage();

    activeNoteId = null;
    if (titleInput) titleInput.value = "";
    if (bodyInput) bodyInput.value = "";

    if (aiAssistBtn) aiAssistBtn.classList.add("hidden");
    if (aiSidebar) aiSidebar.classList.add("translate-x-full");

    if (editorContainer) {
        editorContainer.classList.add("hidden");
        editorContainer.classList.remove("flex");
    }
    if (emptyState) emptyState.classList.remove("hidden");

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
    if (!sidebarList) return;
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

// --- AI Logic Implementation ---

if (generateQuizBtn) {
    generateQuizBtn.addEventListener("click", async () => {
        console.log("Quiz generation started!"); // Debugging log
        if (!activeNoteId) return;

        const note = notes.find(n => n.id === activeNoteId);
        if (!note || (note.body && note.body.trim().length < 20)) {
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
            console.log("Fetching from Gemini API..."); // Debugging log
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
            console.log("Quiz generated successfully:", questionsArray); // Debugging log

            // Save to the current note and redirect!
            note.TestQuestions = questionsArray;
            saveToLocalStorage();

            alert("Quiz generated successfully! Redirecting...");
            window.location.href = `/public/ye-quiz.html?noteId=${note.id}`;

        } catch (error) {
            console.error("AI Error:", error);
            alert("Failed to generate quiz. Check the console for errors.");
        } finally {
            generateQuizBtn.innerHTML = originalText;
            generateQuizBtn.disabled = false;
        }
    });
}

// Sidebar Event Listeners
if (aiAssistBtn) {
    aiAssistBtn.addEventListener("click", () => {
        if (aiSidebar) aiSidebar.classList.remove("translate-x-full");
        if (aiInput) aiInput.focus();
    });
}

if (closeAiBtn) {
    closeAiBtn.addEventListener("click", () => {
        if (aiSidebar) aiSidebar.classList.add("translate-x-full");
    });
}

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

if (aiForm) {
    aiForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeNoteId || !aiInput || !bodyInput || !aiSubmitBtn) return;

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