import { v4 as uuidv4 } from "uuid";
import type { Note } from "./NotePage";

export type Category = { id: string; name: string };

let categories: Category[] = JSON.parse(localStorage.getItem("ye-categories") || "[]");

let getNotes: () => Note[];
let getActiveId: () => string | null;
let onSelectNote: (id: string) => void;
let onSave: () => void;

export function initSidebar(
    fetchNotes: () => Note[],
    fetchActiveId: () => string | null,
    selectFn: (id: string) => void,
    saveFn: () => void
) {
    getNotes = fetchNotes;
    getActiveId = fetchActiveId;
    onSelectNote = selectFn;
    onSave = saveFn;

    const newCatBtn = document.getElementById("new-category-btn");
    if (newCatBtn) {
        newCatBtn.onclick = () => {
            const name = prompt("Category Name:");
            if (name?.trim()) {
                categories.push({ id: uuidv4(), name: name.trim() });
                localStorage.setItem("ye-categories", JSON.stringify(categories));
                renderCategorySideBar();
            }
        };
    }
}

export function renderCategorySideBar() {
    const list = document.getElementById("sidebar-note-list");
    if (!list) return;
    list.innerHTML = "";

    const notes = getNotes();
    const activeId = getActiveId();

    // 1. Always Render Categories First
    categories.forEach(cat => {
        const group = document.createElement("div");
        group.className = "mb-4";

        const header = document.createElement("div");
        header.className = "px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex justify-between items-center";
        header.innerHTML = `<span>📁 ${cat.name}</span>`;

        // Drag & Drop Target
        header.ondragover = (e) => e.preventDefault();
        header.ondrop = (e) => handleDrop(e, cat.id);

        const ul = document.createElement("ul");
        ul.className = "space-y-1 min-h-[10px]";
        ul.ondragover = (e) => e.preventDefault();
        ul.ondrop = (e) => handleDrop(e, cat.id);

        notes.filter(n => n.categoryID === cat.id).forEach(n => {
            ul.appendChild(createNoteItem(n, activeId));
        });

        group.appendChild(header);
        group.appendChild(ul);
        list.appendChild(group);
    });

    // 2. Render Uncategorized
    const uncatLabel = document.createElement("div");
    uncatLabel.className = "px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-1";
    uncatLabel.textContent = "Not Sorted Yet!!";
    list.appendChild(uncatLabel);

    const uncatUl = document.createElement("ul");
    uncatUl.className = "space-y-1 min-h-[20px]";
    uncatUl.ondragover = (e) => e.preventDefault();
    uncatUl.ondrop = (e) => handleDrop(e, null);

    notes.filter(n => !n.categoryID).forEach(n => {
        uncatUl.appendChild(createNoteItem(n, activeId));
    });
    list.appendChild(uncatUl);
}

function createNoteItem(note: Note, activeId: string | null) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = `w-full text-left px-3 py-2 rounded-md transition text-sm truncate ${
        note.id === activeId ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-200"
    }`;
    btn.textContent = note.title || "Untitled";
    btn.onclick = () => onSelectNote(note.id);

    // Drag logic
    btn.draggable = true;
    btn.ondragstart = (e) => e.dataTransfer?.setData("text/plain", note.id);

    li.appendChild(btn);
    return li;
}

function handleDrop(e: DragEvent, catId: string | null) {
    e.preventDefault();
    const noteId = e.dataTransfer?.getData("text/plain");
    const note = getNotes().find(n => n.id === noteId);
    if (note) {
        note.categoryID = catId;
        onSave();
        renderCategorySideBar();
    }
}