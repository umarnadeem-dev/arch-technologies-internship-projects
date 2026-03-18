# 📝 To-Do List Web App

A clean, responsive To-Do List application built with **HTML, CSS, and Vanilla JavaScript**. No frameworks, no backend — just open `index.html` in your browser.

---

## 🚀 How to Run

1. **Download / clone** this folder.
2. **Open `index.html`** in any modern browser (Chrome, Firefox, Edge, Safari).
3. That's it — no server, no build step, no dependencies.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Add Task** | Type a task and click **+ Add** or press **Enter** |
| **Edit Task** | Click ✏️ Edit → modify text → click 💾 Save (or press Enter) |
| **Delete Task** | Click 🗑️ Del → confirm in a custom modal |
| **Complete Task** | Check the checkbox to strike-through a task |
| **Filter** | Switch between **All**, **Active**, and **Completed** views |
| **Clear Completed** | One-click removal of all finished tasks |
| **Persistence** | Tasks survive page refresh via **LocalStorage** |
| **Validation** | Empty task input shows an inline error (no alerts) |
| **Responsive** | Mobile-friendly layout (≤ 480 px breakpoint) |

---

## 💾 Where LocalStorage Is Used

All task data is stored under the key **`todo-app-tasks`** in LocalStorage.

- **`loadTasks()`** — reads and parses `localStorage.getItem("todo-app-tasks")` on page load.
- **`saveTasks(tasks)`** — writes `JSON.stringify(tasks)` to localStorage after every change (add, edit, delete, complete, clear).

Each task is stored as:

```json
{
  "id": "m1abc2xyz",
  "text": "Buy groceries",
  "createdAt": 1700000000000,
  "completed": false
}
```

---

## 📁 File Structure

```
To-Do App/
├── index.html   ← page markup & structure
├── style.css    ← all styles (responsive + animations)
├── script.js    ← app logic (CRUD, LocalStorage, filters)
└── README.md    ← this file
```

---

## 🛠 Tech Stack

- HTML5
- CSS3 (custom properties, flexbox, media queries)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)

---

*Built as a Month-1 internship task.*
