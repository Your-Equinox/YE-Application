import { v4 as uuidv4 } from "uuid";
import * as mammoth from "mammoth";
import * as pdfjslib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { supabase } from "../Supabase/supabaseClient";
import { saveNote } from "../Supabase/NoteService";

// ===== UI SELECTORS =====
const importDocumentBtn = document.querySelector<HTMLButtonElement>("#importDocument-btn");
const importFileInput = document.querySelector<HTMLInputElement>("#import-file");

const exportMenuBtn = document.getElementById("export-menu-btn");
const exportDropdown = document.getElementById("export-dropdown");
const exportTxtBtn = document.getElementById("export-txt-btn");
const exportDocBtn = document.getElementById("export-doc-btn");

// Initialize PDF Worker for imports only
pdfjslib.GlobalWorkerOptions.workerSrc = pdfWorker;

// =========================================
// 1. IMPORT LOGIC (.docx, .pdf, .txt, .md)
// =========================================
if (importDocumentBtn && importFileInput) {
    importDocumentBtn.addEventListener("click", () => {
        importFileInput.click();
    });

    importFileInput.addEventListener("change", async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        try {
            if (fileExtension === "docx") {
                await handleDocxImport(file);
            } else if (fileExtension === "pdf") {
                await handlePdfImport(file);
            } else if (fileExtension === "txt" || fileExtension === "md") {
                await handleTextImport(file);
            } else {
                alert("File type not supported. Please use .docx, .pdf, .txt, or .md");
            }
        } catch (error) {
            console.error("Import Error:", error);
            alert("Failed to process the imported file.");
        } finally {
            target.value = "";
        }
    });
}

// =========================================
// 2. EXPORT DROPDOWN (ACCORDION) LOGIC
// =========================================
if (exportMenuBtn && exportDropdown) {
    exportMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isHidden = exportDropdown.classList.contains("hidden");

        if (isHidden) {
            exportDropdown.classList.remove("hidden");
            exportDropdown.classList.add("flex");
        } else {
            exportDropdown.classList.add("hidden");
            exportDropdown.classList.remove("flex");
        }
    });

    document.addEventListener("click", (e) => {
        if (exportDropdown && !exportDropdown.contains(e.target as Node)) {
            exportDropdown.classList.add("hidden");
            exportDropdown.classList.remove("flex");
        }
    });
}

// Attach format listeners
exportTxtBtn?.addEventListener("click", () => exportCurrentNote("txt"));
exportDocBtn?.addEventListener("click", () => exportCurrentNote("doc"));

// =========================================
// 3. EXPORT HANDLERS
// =========================================
async function exportCurrentNote(format: "txt" | "doc") {
    exportDropdown?.classList.add("hidden");
    exportDropdown?.classList.remove("flex");

    const titleInput = document.getElementById("note-title") as HTMLInputElement;
    const title = titleInput?.value?.trim() || "Untitled_Note";
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // @ts-ignore
    if (typeof editor === 'undefined' || !editor) {
        alert("Editor content not found.");
        return;
    }

    // @ts-ignore
    const textContent = editor.getText();
    // @ts-ignore
    const htmlContent = editor.getHTML();

    if (format === "txt") {
        const blob = new Blob([`${title}\n\n${textContent}`], { type: "text/plain" });
        downloadBlob(blob, `${safeTitle}.txt`);

    } else if (format === "doc") {
        const wordHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #1e293b;">${title}</h1>
                <div style="line-height: 1.6; color: #334155;">${htmlContent}</div>
            </body>
            </html>
        `;
        const blob = new Blob([wordHtml], { type: "application/msword" });
        downloadBlob(blob, `${safeTitle}.doc`);
    }
}

// =========================================
// 4. HELPERS
// =========================================
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =========================================
// 5. FILE IMPORT HANDLERS
// =========================================
async function handleDocxImport(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    await createNoteFromFile(file.name, result.value);
}

async function handlePdfImport(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjslib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
    }

    await createNoteFromFile(file.name, fullText);
}

async function handleTextImport(file: File) {
    const text = await file.text();
    await createNoteFromFile(file.name, text);
}

async function createNoteFromFile(filename: string, content: string) {
    const title = filename.replace(/\.[^/.]+$/, "");
    await saveNote({
        id: uuidv4(),
        title,
        body: content.trim(),
        lastEdited: Date.now(),
        nextReviewDate: Date.now(),
        needsReview: false,
        categoryID: null,
    });
    alert(`Successfully imported "${title}"`);
}