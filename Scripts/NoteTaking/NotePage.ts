import { v4 as uuidv4 } from "uuid";
import "./ImportingFiles";
import { marked } from "marked";
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import { initSidebar, renderCategorySideBar } from "./Categories";
import { loadNotes, saveNote, deleteNote, Note } from "../Supabase/NoteService";
import {Image} from "@tiptap/extension-image";
import { supabase } from '../Supabase/supabaseClient';

// --- Global Types & State ---
declare global {
    interface Window { editor: Editor; }
}


let notes: Note[] = [];
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
const formatImageBtn = document.getElementById("format-image");
const imageUploadInput = document.getElementById("image-upload-input") as HTMLInputElement | null;

// --- Editor Setup ---
const editorElement = document.querySelector('#tiptap-editor');
let editorInstance: Editor;
let saveTimeout: ReturnType<typeof setTimeout>;

if (editorElement) {
    editorInstance = new Editor({
        element: editorElement,
        extensions: [
            StarterKit,
            Image,
            (Table as any).configure({ resizable: true, lastColumnResizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            BubbleMenu.configure({
                element: document.querySelector('#table-bubble-menu') as HTMLElement,
                shouldShow: ({ editor }) => editor.isActive('table') && editor.isFocused,
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            // Debounce saves so we don't hit Supabase on every keystroke
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveActiveNote(editor.getHTML());
            }, 800);
        },
    });
    window.editor = editorInstance;
}

// --- Sidebar Initialization ---
initSidebar(
    () => notes,
    () => activeNoteId,
    setActiveNote,
    saveNoteToDatabase
);

// --- Init: Load data then render ---
async function init() {
    notes = await loadNotes();
    renderCategorySideBar();
    if (notes.length > 0) setActiveNote(notes[0].id);
}

init();

// --- Event Listeners ---
if (newNoteBtn) newNoteBtn.addEventListener("click", createNewNote);
if (deleteNoteBtn) deleteNoteBtn.addEventListener("click", deleteActiveNote);
if (titleInput) titleInput.addEventListener("input", () => saveActiveNote());

if (toggleFlashcardBtn) {
    toggleFlashcardBtn.addEventListener("click", async () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
            note.needsReview = !note.needsReview;
            await saveNote(note);
            updateFlashcardButtonUI(note.needsReview);
        }
    });
}

// --- Core Functions ---

async function createNewNote() {
    const newNote: Note = {
        id: uuidv4(),
        title: "",
        body: "",
        lastEdited: Date.now(),
        nextReviewDate: Date.now(),
        needsReview: false,
        categoryID: null,
    };
    notes.unshift(newNote);
    await saveNote(newNote);
    setActiveNote(newNote.id);
    renderCategorySideBar();
}

function setActiveNote(id: string) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) {
        editorContainer?.classList.add("hidden");
        emptyState?.classList.remove("hidden");
        return;
    }

    if (titleInput) titleInput.value = note.title;

    // Migration logic: convert old Markdown to HTML if needed
    const content = note.body.trim().startsWith('<')
        ? note.body
        : marked.parse(note.body || "");

    editorInstance.commands.setContent(content);

    emptyState?.classList.add("hidden");
    editorContainer?.classList.replace("hidden", "flex");
    aiAssistBtn?.classList.remove("hidden");

    updateFlashcardButtonUI(note.needsReview);
    renderCategorySideBar();
    titleInput?.focus();
}

async function saveActiveNote(htmlContent?: string) {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (note && titleInput) {
        const oldTitle = note.title;
        note.title = titleInput.value;
        if (htmlContent !== undefined) note.body = htmlContent;
        note.lastEdited = Date.now();
        await saveNote(note);
        if (oldTitle !== note.title) renderCategorySideBar();
    }
}

// Used by Categories.ts as the onSave callback
export async function saveNoteToDatabase() {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) await saveNote(note);
}

export async function deleteActiveNote() {
    if (!activeNoteId || !confirm("Are you sure?")) return;

    await deleteNote(activeNoteId);
    notes = notes.filter(n => n.id !== activeNoteId);
    activeNoteId = null;

    editorContainer?.classList.remove("flex");
    editorContainer?.classList.add("hidden");
    emptyState?.classList.remove("hidden");

    renderCategorySideBar();
}

// --- Quiz Generation ---
if (generateQuizBtn) {
    generateQuizBtn.addEventListener("click", async () => {
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

        // Ask the user how many questions they want
        const countInput = prompt("How many questions would you like to generate? (e.g., 5, 10, 15)", "5");

        // If they click 'Cancel', stop the process
        if (countInput === null) return;

        // Convert their input to a number and ensure it is valid
        const numQuestions = parseInt(countInput, 10);
        if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 30) {
            alert("Please enter a valid number between 1 and 30.");
            return;
        }

        const originalText = generateQuizBtn.innerHTML;
        generateQuizBtn.innerHTML = `<span>⏳</span> Generating ${numQuestions}...`;
        generateQuizBtn.disabled = true;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            // Inject the user's requested number directly into the AI prompt
                            text: `You are a strict tutor. Read the user's notes and generate exactly ${numQuestions} self-test questions based on the content. You MUST return ONLY a valid JSON array of objects. Do NOT wrap the response in markdown blocks. 
                            Mix the question types using these three formats:
                            1. Multiple Choice: {"type": "mc", "q": "Question?", "a": "Correct Answer", "options": ["Wrong 1", "Correct Answer", "Wrong 2", "Wrong 3"]}
                            2. True/False: {"type": "tf", "q": "Statement.", "a": "True or False"}
                            3. Reveal/Flashcard: {"type": "reveal", "q": "Concept?", "a": "Detailed explanation."}
                            Notes:\n${note.body}`
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            let aiResponse = data.candidates[0].content.parts[0].text;
            aiResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();

            note.TestQuestions = JSON.parse(aiResponse);
            await saveNote(note);

            alert("Quiz generated successfully! Redirecting...");
            window.location.href = `/pages/ye-quiz.html?noteId=${note.id}`;

        } catch (error) {
            console.error("AI Error:", error);
            alert("Failed to generate quiz. Check the console for errors.");
        } finally {
            generateQuizBtn.innerHTML = originalText;
            generateQuizBtn.disabled = false;
        }
    });
}

// --- AI Sidebar ---
if (aiAssistBtn) {
    aiAssistBtn.addEventListener("click", () => {
        aiSidebar?.classList.toggle("translate-x-full");

        if (!aiSidebar?.classList.contains("translate-x-full")) {
            aiInput?.focus();
        }
    });
}

if (closeAiBtn) {
    closeAiBtn.addEventListener("click", () => {
        aiSidebar?.classList.add("translate-x-full");
    });
}

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
        } catch {
            appendMessage("⚠️ Error communicating with AI.", false);
        } finally {
            aiSubmitBtn.innerText = originalBtnText;
            aiSubmitBtn.disabled = false;
        }
    });
}

// --- Helpers ---
function updateFlashcardButtonUI(isActive: boolean) {
    if (!toggleFlashcardBtn) return;
    toggleFlashcardBtn.className = isActive
        ? "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
        : "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-gray-100 text-gray-500 hover:bg-gray-200";
    toggleFlashcardBtn.innerHTML = `<span>🧠</span> ${isActive ? "Flashcard Active" : "Enable Flashcard"}`;
}

function appendMessage(text: string, isUser: boolean) {
    if (!aiChatHistory) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = `p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap max-w-[80%] ${
        isUser
            ? 'bg-blue-500 text-white ml-auto rounded-br-md shadow'
            : 'bg-gray-50 border border-gray-200 text-gray-800 mr-auto rounded-bl-md shadow-sm'
    }`;
    msgDiv.textContent = text;
    aiChatHistory.appendChild(msgDiv);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
}

if (aiChatHistory && aiChatHistory.children.length === 0) {
    appendMessage("Hello I am your personal study buddy!! How can I help you with your notes today?", false);
}

// Importing images
if (formatImageBtn && imageUploadInput) {
    // Trigger the hidden file input when the button is clicked
    formatImageBtn.addEventListener("click", () => {
        imageUploadInput.click();
    });

    // Handle the actual file selection and upload
    imageUploadInput.addEventListener("change", async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        // Keep the 5MB safety check
        if (file.size > 5 * 1024 * 1024) {
            alert("This image is too large! Please select an image under 5MB.");
            target.value = "";
            return;
        }

        try {
            // Optional: Provide UI feedback that it's uploading
            const originalText = formatImageBtn.innerText;
            formatImageBtn.innerText = "⏳ Uploading...";

            // 1. Create a unique file path to prevent overwriting
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `note-images/${uniqueFileName}`;

            // 2. Upload directly to the Supabase 'images' bucket
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Retrieve the public URL for the newly uploaded image
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 4. Inject the image into the Tiptap editor using the URL
            if (editorInstance) {
                editorInstance.chain().focus().setImage({ src: publicUrl }).run();
            }

            // Restore the button text
            formatImageBtn.innerText = originalText;

        } catch (error) {
            console.error("Error uploading image to Supabase:", error);
            alert("Failed to upload the image. Please check your connection and try again.");
            formatImageBtn.innerText = "🖼️ Image";
        } finally {
            // Clear the input so the same file can be selected again if needed
            target.value = "";
        }
    });
}

if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark-mode');