import { v4 as uuidv4 } from "uuid";
import "./ImportingFiles";
import { marked } from "marked";
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {BubbleMenu} from '@tiptap/extension-bubble-menu';
import { initSidebar, renderCategorySideBar } from "./Categories";

// --- Global Types & State ---
declare global {
    interface Window {
        editor: Editor;
    }
}

export type Note = {
    id: string; title: string; body: string; lastEdited: number;
    nextReviewDate: number; needsReview: boolean; categoryID: string | null;
    TestQuestions?: { q: string; a: string }[];
};

let notes: Note[] = loadNotes();
let activeNoteId: string | null = null;

// --- DOM Elements ---
const newNoteBtn = document.getElementById("new-note-btn");
const deleteNoteBtn = document.getElementById("delete-note-btn");
const toggleFlashcardBtn = document.getElementById("toggle-flashcard-btn");
const generateQuizBtn = document.getElementById("generate-quiz-btn") as HTMLButtonElement | null;
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

const editorInstance = new Editor({
    element: document.querySelector('#tiptap-editor')!,
    extensions: [
        StarterKit,
        (Table as any).configure({
            resizable: true,
            lastColumnResizable: false
        }),
        TableRow,
        TableHeader,
        TableCell,
        BubbleMenu.configure({
            element: document.querySelector('#table-bubble-menu') as HTMLElement,
            // We use 'editor' to check state; other params are optional
            shouldShow: ({ editor }) => {
                // Return true only if the cursor is in a table AND the user is actually clicking/typing
                return editor.isActive('table') && editor.isFocused;
            },
        }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
        // Automatically save HTML to our storage function
        saveActiveNote(editor.getHTML());
    },
});
window.editor = editorInstance;

// Sidebar Initialization
initSidebar(
    () => notes,
    () => activeNoteId,
    setActiveNote,
    saveToLocalStorage
);
renderCategorySideBar();

// --- Event Listeners ---
if (newNoteBtn) newNoteBtn.addEventListener("click", createNewNote);
if (deleteNoteBtn) deleteNoteBtn.addEventListener("click", deleteActiveNote);
if (titleInput) titleInput.addEventListener("input", () => saveActiveNote());

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
        body: "", // Will store HTML
        lastEdited: Date.now(),
        nextReviewDate: Date.now(),
        needsReview: false,
        categoryID: null,
    };
    notes.unshift(newNote);
    saveToLocalStorage();
    setActiveNote(newNote.id);
}

function setActiveNote(id: string) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) {
        editorContainer?.classList.add("hidden");
        emptyState?.classList.remove("hidden");
        return;
    }

    // Migration logic: Convert old Markdown to HTML if necessary
    const content = note.body.trim().startsWith('<')
        ? note.body
        : marked.parse(note.body || "");

    editorInstance.commands.setContent(content);

    if (titleInput) titleInput.value = note.title;
    emptyState?.classList.add("hidden");
    editorContainer?.classList.replace("hidden", "flex");
    aiAssistBtn?.classList.remove("hidden");

    updateFlashcardButtonUI(note.needsReview);
    renderCategorySideBar();
    titleInput?.focus();
}

function saveActiveNote(htmlContent?: string) {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (note && titleInput) {
        const oldTitle = note.title;
        note.title = titleInput.value;
        if (htmlContent !== undefined) note.body = htmlContent;
        note.lastEdited = Date.now();
        saveToLocalStorage();
        if (oldTitle !== note.title) renderCategorySideBar();
    }
}

export function deleteActiveNote() {
    if (!activeNoteId || !confirm("Are you sure?")) return;
    notes = notes.filter(n => n.id !== activeNoteId);
    saveToLocalStorage();
    activeNoteId = null;
    editorContainer?.classList.replace("flex", "hidden");
    emptyState?.classList.remove("hidden");
    renderCategorySideBar();
}

// AI Assistant
if (aiForm) {
    aiForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeNoteId || !aiInput || !aiSubmitBtn) return;
        const apiKey = localStorage.getItem("gemini_api_key");
        if (!apiKey) return alert("Set API key first!");

        const promptText = aiInput.value.trim();
        if (!promptText) return;

        aiInput.value = "";
        appendMessage(promptText, true);

        const noteContent = editorInstance.getHTML();
        const originalBtnText = aiSubmitBtn.innerText;
        aiSubmitBtn.innerText = "...";
        aiSubmitBtn.disabled = true;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Instructions: ${promptText}\n\nDocument Text:\n${noteContent}` }] }]
                })
            });
            const data = await response.json();
            appendMessage(data.candidates[0].content.parts[0].text, false);
        } catch (error) {
            appendMessage("⚠️ Error communicating with AI.", false);
        } finally {
            aiSubmitBtn.innerText = originalBtnText;
            aiSubmitBtn.disabled = false;
        }
    });
}

// Helpers
function saveToLocalStorage() { localStorage.setItem("ye-notes", JSON.stringify(notes)); }
function loadNotes(): Note[] {
    const saved = localStorage.getItem("ye-notes");
    return saved ? JSON.parse(saved).map((n: any) => ({ ...n, categoryID: n.categoryID || null })) : [];
}
function updateFlashcardButtonUI(isActive: boolean) {
    if (!toggleFlashcardBtn) return;
    toggleFlashcardBtn.className = isActive
        ? "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-purple-100 text-purple-700 hover:bg-purple-200"
        : "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-gray-100 text-gray-500 hover:bg-gray-200";
    toggleFlashcardBtn.innerHTML = `<span>🧠</span> ${isActive ? "Flashcard Active" : "Enable Flashcard"}`;
}
function appendMessage(text: string, isUser: boolean) {
    if (!aiChatHistory) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = `p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-blue-600 text-white ml-8 rounded-br-none self-end' : 'bg-white border border-gray-200 text-gray-800 mr-8 rounded-bl-none shadow-sm self-start'}`;
    msgDiv.textContent = text;
    aiChatHistory.appendChild(msgDiv);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
}