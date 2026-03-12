import { v4 as uuidv4 } from "uuid";
import * as mammoth from "mammoth";
import * as pdfjslib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Importing docx and pdf files
const importDocumentBtn = document.querySelector<HTMLButtonElement>("#importDocument-btn");
const importFileInput = document.querySelector<HTMLInputElement>("#import-file");

pdfjslib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
            if (fileExtension === "json") {
                await handleJsonBackup(file);
            }
            else if (fileExtension === "docx") {
                await handleDocxImport(file);
            }
            else if (fileExtension === "pdf") {
                await handlePdfImport(file);
            }
            else if (fileExtension === "txt" || fileExtension === "md") {
                await handleTextImport(file);
            } else {
                alert("File type is not supported.");
            }
        } catch (error) {
            console.error("Error processing file:", error);
            alert("Failed to process file.");
        } finally {
            target.value = "";
        }
    });
}

// File handling

async function handleJsonBackup(file: File) {
    const text = await file.text();
    const importedData = JSON.parse(text);

    if (importedData.notes) localStorage.setItem("ye-notes", JSON.stringify(importedData.notes));
    if (importedData.tasks) localStorage.setItem("tasks", JSON.stringify(importedData.tasks));
    if (importedData.reminders) localStorage.setItem("reminders", JSON.stringify(importedData.reminders));
    if (importedData.stats) localStorage.setItem("ye-stats", JSON.stringify(importedData.stats));
    if (importedData.settings?.geminiApiKey) localStorage.setItem("gemini_api_key", importedData.settings.geminiApiKey);

    alert("Backup restored successfully! Returning to Dashboard.");
    window.location.href = "/index.html";
}

async function handleDocxImport(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    createNoteFromFile(file.name, result.value);
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

    createNoteFromFile(file.name, fullText);
}

async function handleTextImport(file: File) {
    const text = await file.text();
    createNoteFromFile(file.name, text);
}

function createNoteFromFile(filename: string, content: string) {
    const notes = JSON.parse(localStorage.getItem("ye-notes") || "[]");

    const title = filename.replace(/\.[^/.]+$/, "");

    const newNote = {
        id: uuidv4(),
        title: title,
        body: content.trim(),
        lastEdited: Date.now(),
        nextReviewDate: Date.now(),
        needsReview: false
    };

    notes.unshift(newNote);
    localStorage.setItem("ye-notes", JSON.stringify(notes));
    alert(`Successfully imported "${title}" into your notes!`);
}