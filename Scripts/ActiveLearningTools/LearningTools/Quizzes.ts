import { loadNotes, saveNote } from "../../Supabase/NoteService";

// DOM Elements
const quizTitle = document.getElementById("quiz-title")!;
const quizContainer = document.getElementById("quiz-container")!;
const noQuizMsg = document.getElementById("no-quiz-msg")!;
const finishQuizBtn = document.getElementById("finish-quiz-btn")!;

async function initQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get("noteId");

    if (!noteId) {
        showError();
        return;
    }

    const notes = await loadNotes();
    const targetNote = notes.find((n: any) => n.id === noteId);

    if (!targetNote || !targetNote.TestQuestions || targetNote.TestQuestions.length === 0) {
        showError();
        return;
    }

    quizTitle.textContent = `Quiz: ${targetNote.title || "Untitled Note"}`;
    renderQuestions(targetNote.TestQuestions);
}

function renderQuestions(questions: { q: string; a: string }[]) {
    quizContainer.innerHTML = "";

    questions.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col";

        const qText = document.createElement("h3");
        qText.className = "text-lg font-bold text-slate-800 mb-4";
        qText.innerHTML = `<span class="text-purple-500 mr-2">Q${index + 1}:</span> ${item.q}`;

        const revealBtn = document.createElement("button");
        revealBtn.className = "self-start px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium rounded transition mb-4";
        revealBtn.textContent = "👁️ Reveal Answer";

        const aText = document.createElement("p");
        aText.className = "hidden text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-purple-400";
        aText.innerHTML = `<strong>Answer:</strong> ${item.a}`;

        revealBtn.addEventListener("click", () => {
            aText.classList.remove("hidden");
            revealBtn.classList.add("hidden");
        });

        card.appendChild(qText);
        card.appendChild(revealBtn);
        card.appendChild(aText);
        quizContainer.appendChild(card);
    });

    finishQuizBtn.classList.remove("hidden");
}

function showError() {
    quizTitle.textContent = "Error";
    noQuizMsg.classList.remove("hidden");
}

finishQuizBtn.addEventListener("click", () => {
    window.location.href = "/pages/ye-notes.html";
});

initQuiz();