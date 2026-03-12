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

// Shared logic for both buttons so we don't write the same code twice
function handleTaskRemoval(isCompleted: boolean) {
    if (!taskList) return;

    // Find all checkboxes inside the task list that are checked
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

    // Update your local storage to remove these tasks permanently
    updateLocalStorageAfterDeletion();
}

// Helper function to sync your remaining tasks back to local storage
function updateLocalStorageAfterDeletion() {
    if (!taskList) return;

    // Grab all the remaining text labels/spans next to the unchecked checkboxes
    const remainingTasks: string[] = [];
    const remainingItems = taskList.querySelectorAll('li');

    remainingItems.forEach(item => {
        // Adjust this selector based on how you render your task text (e.g., a <span> or <label>)
        const textElement = item.querySelector('span');
        if (textElement && textElement.textContent) {
            remainingTasks.push(textElement.textContent);
        }
    });

    // Save the remaining tasks back to whatever key you use (e.g., 'ye-tasks')
    localStorage.setItem('ye-tasks', JSON.stringify(remainingTasks));
}

// Initialize the event listeners
initDeleteTasks();