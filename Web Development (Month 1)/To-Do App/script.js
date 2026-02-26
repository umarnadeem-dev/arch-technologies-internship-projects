document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("task-input");
  const addBtn = document.getElementById("add-btn");
  const taskList = document.getElementById("task-list");
  const itemsLeft = document.getElementById("items-left");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const dateDisplay = document.getElementById("date-display");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  const today = new Date();
  const options = { weekday: "long", month: "short", day: "numeric" };
  dateDisplay.textContent = today.toLocaleDateString("en-US", options);

  renderTasks();

  addBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
  });

  clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveAndRender();
  });

  // Functions
  function addTask() {
    const text = taskInput.value.trim();
    if (text === "") return;

    const newTask = {
      id: Date.now(),
      text: text,
      completed: false,
    };

    tasks.push(newTask);
    saveAndRender();
    taskInput.value = "";
  }

  function toggleTask(id) {
    tasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveAndRender();
  }

  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveAndRender();
  }

  function editTask(id, li) {
    const task = tasks.find((t) => t.id === id);
    const textSpan = li.querySelector(".task-text");

    // Replace span with input
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.className = "edit-input";

    li.replaceChild(input, textSpan);
    input.focus();

    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText) {
        task.text = newText;
      } else {
        if (newText === "") {
          deleteTask(id);
          return;
        }
      }
      saveAndRender();
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveEdit();
    });
  }

  function saveAndRender() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }

  function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => toggleTask(task.id));

      const span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;

      // Edit on double click
      span.addEventListener("dblclick", () => editTask(task.id, li));

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn-icon";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", () => editTask(task.id, li));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-icon btn-delete";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(actions);

      taskList.appendChild(li);
    });

    // Update count
    const activeCount = tasks.filter((t) => !t.completed).length;
    itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? "s" : ""} left`;
  }
});
