import { loadNotes } from "../../Supabase/NoteService";

// DOM Elements
const quizTitle = document.getElementById("quiz-title")!;
const quizContainer = document.getElementById("quiz-container")!;
const noQuizMsg = document.getElementById("no-quiz-msg")!;
const finishQuizBtn = document.getElementById("finish-quiz-btn")!;

// Quiz State
let score = 0;
let answeredCount = 0;
let totalQuestions = 0;

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

// Updated to accept 'any[]' so it can read 'type' and 'options' properties
function renderQuestions(questions: any[]) {
    quizContainer.innerHTML = "";
    totalQuestions = questions.length;
    score = 0;
    answeredCount = 0;

    questions.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col mb-6";

        // Question Text
        const qText = document.createElement("h3");
        qText.className = "text-lg font-bold text-slate-800 mb-4";
        qText.innerHTML = `<span class="text-purple-500 mr-2">Q${index + 1}:</span> ${item.q}`;
        card.appendChild(qText);

        // Determine question type (default to reveal for older notes)
        const qType = item.type || "reveal";

        // Container for interactive elements
        const interactiveContainer = document.createElement("div");
        interactiveContainer.className = "w-full flex flex-col gap-3";
        card.appendChild(interactiveContainer);

        // Shared grading function to lock in answers
        const handleGrade = (isCorrect: boolean) => {
            if (isCorrect) score++;
            answeredCount++;

            interactiveContainer.innerHTML = isCorrect
                ? `<div class="text-green-600 font-bold bg-green-50 px-4 py-3 rounded border border-green-200">✅ Correct</div>`
                : `<div class="text-red-600 font-bold bg-red-50 px-4 py-3 rounded border border-red-200">
                     ❌ Incorrect <br>
                     <span class="text-gray-700 font-normal text-sm mt-1 block">The correct answer was: <strong>${item.a}</strong></span>
                   </div>`;

            checkQuizCompletion();
        };

        // --- TYPE: MULTIPLE CHOICE ---
        if (qType === "mc" && item.options) {
            item.options.forEach((opt: string) => {
                const btn = document.createElement("button");
                btn.className = "text-left p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-gray-700 bg-white shadow-sm";
                btn.textContent = opt;
                btn.addEventListener("click", () => {
                    handleGrade(opt === item.a);
                });
                interactiveContainer.appendChild(btn);
            });
        }

        // --- TYPE: TRUE / FALSE ---
        else if (qType === "tf") {
            const btnWrapper = document.createElement("div");
            btnWrapper.className = "flex gap-3";

            ["True", "False"].forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "px-6 py-2 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition shadow-sm font-medium bg-white text-gray-700";
                btn.textContent = opt;
                btn.addEventListener("click", () => {
                    // Compare lowercase string values to avoid case-sensitivity issues
                    handleGrade(opt.toLowerCase() === item.a.toLowerCase());
                });
                btnWrapper.appendChild(btn);
            });
            interactiveContainer.appendChild(btnWrapper);
        }

        // --- TYPE: REVEAL (Standard Flashcard) ---
        else {
            interactiveContainer.innerHTML = `
                <button class="reveal-btn self-start px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium rounded transition mb-2 shadow-sm">👁️ Reveal Answer</button>
                <p class="answer-text hidden text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-purple-400 mb-2"><strong>Answer:</strong> ${item.a}</p>
                <div class="grade-btns hidden flex gap-3">
                    <button class="correct-btn bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition shadow-sm font-medium">Got it right 👍</button>
                    <button class="wrong-btn bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition shadow-sm font-medium">Got it wrong 👎</button>
                </div>
            `;

            const revealBtn = interactiveContainer.querySelector('.reveal-btn')!;
            const aText = interactiveContainer.querySelector('.answer-text')!;
            const gradeBtns = interactiveContainer.querySelector('.grade-btns')!;
            const correctBtn = interactiveContainer.querySelector('.correct-btn') as HTMLButtonElement;
            const wrongBtn = interactiveContainer.querySelector('.wrong-btn') as HTMLButtonElement;

            revealBtn.addEventListener("click", () => {
                aText.classList.remove("hidden");
                gradeBtns.classList.remove("hidden");
                revealBtn.classList.add("hidden");
            });

            correctBtn.addEventListener("click", () => handleGrade(true));
            wrongBtn.addEventListener("click", () => handleGrade(false));
        }

        quizContainer.appendChild(card);
    });
}

function checkQuizCompletion() {
    // Only show the finish button if they have graded every single question
    if (answeredCount === totalQuestions) {
        finishQuizBtn.classList.remove("hidden");
        finishQuizBtn.textContent = "Finish & See Score";
    }
}

function showError() {
    quizTitle.textContent = "Error";
    noQuizMsg.classList.remove("hidden");
}

// Intercept the finish button to show the score screen
finishQuizBtn.addEventListener("click", () => {
    quizTitle.textContent = "Quiz Results";
    finishQuizBtn.classList.add("hidden");

    const percentage = Math.round((score / totalQuestions) * 100);
    let message = "Good effort! Keep practicing.";
    if (percentage >= 80) message = "Excellent work! 🌟";
    if (percentage === 100) message = "Perfect score! 🎉";

    quizContainer.innerHTML = `
        <div class="bg-white p-8 rounded-xl shadow-md text-center max-w-lg mx-auto border border-gray-100">
            <h2 class="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
            <p class="text-gray-500 mb-6">${message}</p>
            
            <div class="text-5xl font-black text-purple-600 mb-6">
                ${score} <span class="text-2xl text-gray-400">/ ${totalQuestions}</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-4 mb-8 overflow-hidden">
                <div class="bg-purple-500 h-4 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
            </div>
            
            <button id="return-notes-btn" class="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-bold shadow transition transform hover:-translate-y-1">
                Return to Notes
            </button>
        </div>
    `;

    document.getElementById("return-notes-btn")?.addEventListener("click", () => {
        window.location.href = "/pages/ye-notes.html";
    });
});

initQuiz();