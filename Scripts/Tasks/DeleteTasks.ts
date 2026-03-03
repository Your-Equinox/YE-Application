import { tasks, saveTasks, taskList, addListItem } from "./AddTasks";
import {TasksCompletedIncrements} from "../ActiveLearningTools/Dashboard/Stats";

export const deleteTask = document.querySelector<HTMLButtonElement>("#delete-task")!;

deleteTask.addEventListener("click", () => {

    // 1. Count how many are checked off
    const completedTasksCount = tasks.filter(task => task.completed).length;

    // 2. Send that number to our new Stats tracker!
    if (completedTasksCount > 0) {
        TasksCompletedIncrements(completedTasksCount);
    }

    // 3. Keep only the unfinished tasks (Your original logic)
    const remainingTasks = tasks.filter(task => !task.completed);

    tasks.length = 0;
    remainingTasks.forEach((task) => tasks.push(task));

    saveTasks();
    taskList.innerHTML = "";
    tasks.forEach(addListItem);
});