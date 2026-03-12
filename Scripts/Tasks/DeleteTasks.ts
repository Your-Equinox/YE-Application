import { TasksCompletedIncrements } from '../ActiveLearningTools/Dashboard/Stats.js';

// DOM Elements
const completeTaskBtn = document.getElementById('task-complete') as HTMLButtonElement | null;
const removeTaskBtn = document.getElementById('remove-task-btn') as HTMLButtonElement | null; // Added new button
const taskList = document.getElementById('task-list') as HTMLUListElement | null;

export function initDeleteTasks() {
    if (!taskList) return;

    // --- 1. TASK COMPLETE BUTTON (Adds to Stats) ---
    if (completeTaskBtn) {
        completeTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleTaskRemoval(true);
        });
    }

    // --- 2. REMOVE TASK BUTTON (Does NOT Add to Stats) ---
    if (removeTaskBtn) {
        removeTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleTaskRemoval(false);
        });
    }
}

function handleTaskRemoval(isCompleted: boolean) {
    if (!taskList) return;

    const checkboxes = taskList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    const selectedCount = checkboxes.length;

    if (selectedCount === 0) {
        alert("Please select at least one task.");
        return;
    }

    // ONLY update the dashboard stats if the user clicked "Task Complete"
    if (isCompleted) {
        TasksCompletedIncrements(selectedCount);
    }

    // Remove the selected tasks from the screen
    checkboxes.forEach(checkbox => {
        const listItem = checkbox.closest('li');
        if (listItem) {
            listItem.remove();
        }
    });

    // Update  local storage to remove these tasks permanently
    updateLocalStorageAfterDeletion();
}

// Helper function to sync  remaining tasks back to local storage
function updateLocalStorageAfterDeletion() {
    if (!taskList) return;

    // Grab all the remaining text labels/spans next to the unchecked checkboxes
    const remainingTasks: string[] = [];
    const remainingItems = taskList.querySelectorAll('li');

    remainingItems.forEach(item => {
        // Adjust this selector based on how you render task text (e.g., a <span> or <label>)
        const textElement = item.querySelector('span') || item.querySelector('label') || item;
        if (textElement && textElement.textContent) {
            remainingTasks.push(textElement.textContent.trim());
        }
    });

    // Save the remaining tasks back to whatever key you use (e.g., 'ye-tasks')
    const currentTasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    const updatedTasks = currentTasks.filter((task: any)=> {
        const taskString = typeof task === 'string' ? task: (task.title || task.text || "");
        return remainingTasks.includes(taskString.trim());
    })

    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
}

// Initialize the event listeners
initDeleteTasks();