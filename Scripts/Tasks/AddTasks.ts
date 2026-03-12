import { v4 as uuidv4 } from "uuid"

export type Task = {
    id: string
    title: string
    completed: boolean
    createdAt: Date
}

// FIX: Removed the '!' so they can safely be null if the page doesn't have them
const taskForm = document.querySelector<HTMLFormElement>("#task-form")
const taskInput = document.querySelector<HTMLInputElement>("#task-title")
export const taskList = document.querySelector<HTMLUListElement>("#task-list")

export const tasks: Task[] = loadTasks()

if (taskList) {
    tasks.forEach(addListItem)
}

if (taskForm && taskInput) {
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault()
        if (!taskInput.value) return

        const newTask: Task = {
            id: uuidv4(),
            title: taskInput.value,
            completed: false,
            createdAt: new Date(),
        }

        tasks.push(newTask)
        saveTasks()
        addListItem(newTask)

        taskInput.value = ""
    })
}

export function addListItem(task: Task) {
    if (!taskList) return;
    const item = document.createElement("li")
    const label = document.createElement("label")
    const checkbox = document.createElement("input")

    checkbox.type = "checkbox"
    checkbox.checked = task.completed

    checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked
        saveTasks()
    })

    label.append(checkbox, task.title)
    item.append(label)
    taskList.append(item)
}

// Saves tasks into local storage
export function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks))
}

// Helper function for loading savetasks
function loadTasks(): Task[] {
    const taskJSON = localStorage.getItem("tasks")
    if (!taskJSON) return []

    return JSON.parse(taskJSON).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
    }))
}