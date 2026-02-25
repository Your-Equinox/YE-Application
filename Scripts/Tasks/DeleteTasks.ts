import { tasks, saveTasks, taskList, addListItem } from "./AddTasks";

export const deleteTask = document.querySelector<HTMLButtonElement>("#delete-task")!;

deleteTask.addEventListener("click", (e) => {

    const remainingTasks = tasks.filter(task => !task.completed);

    tasks.length = 0;
    remainingTasks.forEach((task) => tasks.push(task));

    saveTasks();

    taskList.innerHTML = "";

    tasks.forEach(addListItem);
});