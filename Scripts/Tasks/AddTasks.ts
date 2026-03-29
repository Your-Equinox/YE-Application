import { v4 as uuidv4 } from "uuid";
import { loadTasks, saveTask } from "../Supabase/TaskService";

export type Task = {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
};

const taskForm = document.querySelector<HTMLFormElement>("#task-form");
const taskInput = document.querySelector<HTMLInputElement>("#task-title");
export const taskList = document.querySelector<HTMLUListElement>("#task-list");

export let tasks: Task[] = [];

async function init() {
    tasks = await loadTasks();
    if (taskList) tasks.forEach(addListItem);
}

init();

if (taskForm && taskInput) {
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!taskInput.value) return;

        const newTask: Task = {
            id: uuidv4(),
            title: taskInput.value,
            completed: false,
            createdAt: new Date(),
        };

        tasks.push(newTask);
        await saveTask(newTask);
        addListItem(newTask);
        taskInput.value = "";
    });
}

export function addListItem(task: Task) {
    if (!taskList) return;
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", async () => {
        task.completed = checkbox.checked;
        await saveTask(task);
    });

    label.append(checkbox, task.title);
    item.append(label);
    taskList.append(item);
}