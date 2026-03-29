import { incrementTasksCompleted } from '../Supabase/StatsService';
import { deleteTask } from '../Supabase/TaskService';
import { updateDashboardUI } from '../ActiveLearningTools/Dashboard/Stats';
import { tasks } from './AddTasks';

const completeTaskBtn = document.getElementById('task-complete') as HTMLButtonElement | null;
const removeTaskBtn = document.getElementById('remove-task-btn') as HTMLButtonElement | null;
const taskList = document.getElementById('task-list') as HTMLUListElement | null;

export function initDeleteTasks() {
    if (!taskList) return;

    if (completeTaskBtn) {
        completeTaskBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleTaskRemoval(true);
        });
    }

    if (removeTaskBtn) {
        removeTaskBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleTaskRemoval(false);
        });
    }
}

async function handleTaskRemoval(isCompleted: boolean) {
    if (!taskList) return;

    const checkboxes = taskList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    const selectedCount = checkboxes.length;

    if (selectedCount === 0) {
        alert("Please select at least one task.");
        return;
    }

    // Collect IDs of selected tasks before removing from DOM
    const selectedTitles: string[] = [];
    checkboxes.forEach(checkbox => {
        const label = checkbox.closest('label') || checkbox.parentElement;
        if (label) selectedTitles.push(label.textContent?.trim() || "");
        checkbox.closest('li')?.remove();
    });

    // Find matching tasks and delete from Supabase
    const toDelete = tasks.filter(t => selectedTitles.includes(t.title.trim()));
    for (const task of toDelete) {
        await deleteTask(task.id);
    }

    // Remove from local array
    toDelete.forEach(t => {
        const idx = tasks.indexOf(t);
        if (idx > -1) tasks.splice(idx, 1);
    });

    if (isCompleted) {
        await incrementTasksCompleted(selectedCount);
        await updateDashboardUI();
    }
}

initDeleteTasks();