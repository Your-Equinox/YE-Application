import { TasksCompletedIncrements } from '../ActiveLearningTools/Dashboard/Stats.js';

// DOM Elements
const deleteTaskBtn = document.getElementById('delete-task') as HTMLButtonElement | null;
const taskList = document.getElementById('task-list') as HTMLUListElement | null;

export function initDeleteTasks() {
    if (!deleteTaskBtn || !taskList) return;

    deleteTaskBtn.addEventListener('click', () => {
        // Find all checkboxes inside the task list that are checked
        const checkboxes = taskList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
        const completedCount = checkboxes.length;

        if (completedCount === 0) {
            alert("Please select at least one task to mark as complete.");
            return;
        }

        // 2. Update the dashboard stats!
        TasksCompletedIncrements(completedCount);

        // 3. Remove the completed tasks from the screen
        checkboxes.forEach(checkbox => {
            // Assuming the checkbox is inside an <li> element
            const listItem = checkbox.closest('li');
            if (listItem) {
                listItem.remove();
            }
        });

        // 4. Update your local storage to remove these tasks permanently
        updateLocalStorageAfterDeletion();
    });
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

// Initialize the event listener
initDeleteTasks();