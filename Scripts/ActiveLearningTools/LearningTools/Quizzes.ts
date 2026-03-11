import { v4 as uuidv4 } from "uuid";

// --- DOM Elements ---
const quizTitle = document.getElementById("quiz-title")!;
const quizContainer = document.getElementById("quiz-container")!;
const noQuizMsg = document.getElementById("no-quiz-msg")!;
const finishQuizBtn = document.getElementById("finish-quiz-btn")!;

// --- Initialization ---
function initQuiz() {
    // 1. Get the Note ID from the URL (e.g., ?noteId=12345)
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get("noteId");

    if (!noteId) {
        showError();
        return;
    }

    // 2. Load the notes and find the right one
    const savedNotes = localStorage.getItem("ye-notes");
    if (!savedNotes) {
        showError();
        return;
    }

    const notes = JSON.parse(savedNotes);
    const targetNote = notes.find((n: any) => n.id === noteId);

    // 3. Verify it has questions
    if (!targetNote || !targetNote.TestQuestions || targetNote.TestQuestions.length === 0) {
        showError();
        return;
    }

    // 4. Render the UI!
    quizTitle.textContent = `Quiz: ${targetNote.title || "Untitled Note"}`;
    renderQuestions(targetNote.TestQuestions);
}

function renderQuestions(questions: { q: string, a: string }[]) {
    quizContainer.innerHTML = ""; // Clear out loading state

    questions.forEach((item, index) => {
        // Create the Card
        const card = document.createElement("div");
        card.className = "bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col";

        // Create the Question text
        const qText = document.createElement("h3");
        qText.className = "text-lg font-bold text-slate-800 mb-4";
        qText.innerHTML = `<span class="text-purple-500 mr-2">Q${index + 1}:</span> ${item.q}`;

        // Create the Reveal Button
        const revealBtn = document.createElement("button");
        revealBtn.className = "self-start px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium rounded transition mb-4";
        revealBtn.textContent = "👁️ Reveal Answer";

        // Create the Answer text (Hidden by default)
        const aText = document.createElement("p");
        aText.className = "hidden text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-purple-400";
        aText.innerHTML = `<strong>Answer:</strong> ${item.a}`;

        // Button Logic
        revealBtn.addEventListener("click", () => {
            aText.classList.remove("hidden");
            revealBtn.classList.add("hidden"); // Hide the button once revealed
        });

        // Assemble
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
    // Send them back to the notes page when done
    window.location.href = "/public/ye-notes.html";
});

// Run on load
initQuiz();