import { v4 as uuidv4 } from "uuid";
import type { Note } from "./NotePage";

export type Category = { id: string; name: string };

// State
let categories: Category[] = JSON.parse(localStorage.getItem("ye-categories") || "[]");
let collapsedCategories: Set<string> = new Set(); // Tracks which IDs are closed

// Internal References (Linked via initSidebar)
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
            const name = prompt("Enter Category Name:");
            if (name?.trim()) {
                const newCat = { id: uuidv4(), name: name.trim() };
                categories.push(newCat);
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

    // 1. Render Folders
    categories.forEach(cat => {
        const isCollapsed = collapsedCategories.has(cat.id);

        const group = document.createElement("div");
        group.className = "mb-3 select-none";
        // Header (Toggle + Drag Target)
        const header = document.createElement("div");
        header.className = "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 rounded-lg flex items-center justify-between group transition-all";


        header.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="inline-block transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}">▶</span>
                 <span class="flex items-center gap-2 text-gray-700">
    <span class="text-sm">📁</span>
    <span class="truncate">${cat.name}</span>
</span>
            </div>
            <button class=opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded px-1 transition-alltransition-opacity px-1" title="Delete Category">×</button>
        `;

        // Toggle Expand/Collapse on click
        header.onclick = (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON') {
                deleteCategory(cat.id);
                return;
            }
            if (isCollapsed) collapsedCategories.delete(cat.id);
            else collapsedCategories.add(cat.id);
            renderCategorySideBar();
        };

        // Drag & Drop Setup for the Category
        header.ondragover = (e) => { e.preventDefault(); header.classList.add("bg-blue-50", "ring-1", "ring-blue-200"); }
        header.ondragleave = () => { header.classList.remove("bg-blue-50"); };
        header.ondrop = (e) => {
            header.classList.remove("bg-blue-50");
            handleDrop(e, cat.id);
        };

        // Note List
        const ul = document.createElement("ul");
        ul.className = `space-y-1 mt-1 transition-all ${isCollapsed ? 'hidden' : 'block'}`;

        const catNotes = notes.filter(n => n.categoryID === cat.id);
        catNotes.forEach(note => {
            ul.appendChild(createNoteItem(note, activeId));
        });

        group.appendChild(header);
        group.appendChild(ul);
        list.appendChild(group);
    });

    const uncatLabel = document.createElement("div");
    uncatLabel.className = "px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-1 border-t border-gray-100 pt-4";
    uncatLabel.textContent = "Uncategorized";
    uncatLabel.className = "px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide mt-6 mb-2 border-t border-gray-100 pt-4";

    uncatLabel.ondragover = (e) => e.preventDefault();
    uncatLabel.ondrop = (e) => handleDrop(e, null);

    const uncatUl = document.createElement("ul");
    uncatUl.className = "space-y-1 min-h-[40px]";
    uncatUl.ondragover = (e) => e.preventDefault();
    uncatUl.ondrop = (e) => handleDrop(e, null);

    notes.filter(n => !n.categoryID).forEach(note => {
        uncatUl.appendChild(createNoteItem(note, activeId));
    });

    list.appendChild(uncatLabel);
    list.appendChild(uncatUl);
}


function createNoteItem(note: Note, activeId: string | null) {
    const li = document.createElement("li");
    const btn = document.createElement("button");

    const isActive = note.id === activeId;
    btn.className = `w-full text-left px-3 py-2 rounded-lg transition-all text-sm truncate ${
    isActive
        ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
}`;
            
    btn.textContent = note.title.trim() || "Untitled Note";
    btn.onclick = () => onSelectNote(note.id);

    btn.draggable = true;
    btn.ondragstart = (e) => {
        e.dataTransfer?.setData("text/plain", note.id);
        btn.classList.add("opacity-40");
    };
    btn.ondragend = () => btn.classList.remove("opacity-40");
    li.appendChild(btn);
    return li;
}


function handleDrop(e: DragEvent, catId: string | null) {
    e.preventDefault();
    const noteId = e.dataTransfer?.getData("text/plain");
    const notes = getNotes();
    const note = notes.find(n => n.id === noteId);

    if (note) {
        note.categoryID = catId;
        onSave();
        renderCategorySideBar();
    }
}


function deleteCategory(id: string) {
    if (!confirm("Delete category? Notes will be moved to Uncategorized.")) return;

    // Clean up notes
    const notes = getNotes();
    notes.forEach(n => { if (n.categoryID === id) n.categoryID = null; });
    onSave();

    // Remove category
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem("ye-categories", JSON.stringify(categories));

    renderCategorySideBar();
}
