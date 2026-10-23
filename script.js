
const $ = (id) => document.getElementById(id);

let tasks = [];

try {
  tasks = JSON.parse(localStorage.getItem("daybuddy_tasks")) || [];
  if (!Array.isArray(tasks)) tasks = [];
} catch {
  tasks = [];
}

function saveTasks() {
  localStorage.setItem("daybuddy_tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const list = $("tasks");
  list.replaceChildren();

  const completed = tasks.filter(task => task.done).length;

  $("total").textContent = tasks.length;
  $("completed").textContent = completed;
  $("remaining").textContent = tasks.length - completed;

  
const percent = tasks.length === 0
  ? 0
  : Math.round((completed / tasks.length) * 100);

$("progressPercent").textContent = `${percent}%`;
$("progressFill").style.width = `${percent}%`;
$("progressTrack").setAttribute("aria-valuenow", percent);

$("progressMessage").textContent =
  tasks.length === 0
    ? "Your day starts with one small step. Let's go!"
    : percent === 100
      ? "Amazing! You've completed every task. 🎉"
      : `${completed} of ${tasks.length} tasks completed. Keep going!`;

  $("empty").hidden = tasks.length > 0;

  
const searchText = $("taskSearch").value.trim().toLowerCase();
const filterValue = $("taskFilter").value;
const sortValue = $("taskSort").value;

let visibleTasks = tasks.filter(task => {
  const matchesSearch = task.title.toLowerCase().includes(searchText);

  const matchesFilter =
    filterValue === "all" ||
    (filterValue === "pending" && !task.done) ||
    (filterValue === "completed" && task.done) ||
    task.priority.toLowerCase() === filterValue;

  return matchesSearch && matchesFilter;
});

if (sortValue === "priority") {
  const priorityRank = { high: 0, medium: 1, low: 2 };

  visibleTasks.sort((a, b) =>
    (priorityRank[a.priority.toLowerCase()] ?? 3) -
    (priorityRank[b.priority.toLowerCase()] ?? 3)
  );
} else if (sortValue === "duration") {
  visibleTasks.sort((a, b) => a.duration - b.duration);
}


  visibleTasks.forEach(task => {
    const row = document.createElement("div");
    row.className = "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Complete task");

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const content = document.createElement("div");
    content.className = "task-title" + (task.done ? " done" : "");
    content.textContent = task.title;

    const details = document.createElement("small");
    details.textContent =
      `${task.priority} priority · ${task.duration} minutes`;
    content.appendChild(details);

    const remove = document.createElement("button");
    remove.className = "delete";
    remove.textContent = "Delete";

    remove.addEventListener("click", () => {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      renderTasks();
    });

    row.append(checkbox, content, remove);
    list.appendChild(row);
  });
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("taskName").value.trim();
  if (!title) return;

  tasks.push({
    id: crypto.randomUUID(),
    title,
    priority: $("priority").value,
    duration: Number($("duration").value),
    done: false
  });

  saveTasks();
  renderTasks();

  $("taskForm").reset();
  $("priority").value = "Medium";
  $("duration").value = "30";
  $("taskName").focus();
});

$("clearDone").addEventListener("click", () => {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
});


 // REAL AI PLANNER
$("buildPlan").addEventListener("click", async () => {
  const planContainer = $("plan");
  const button = $("buildPlan");

  const pending = tasks
    .filter(task => !task.done)
    .map(task => ({
      title: task.title,
      priority: task.priority,
      duration: task.duration
    }));

  planContainer.replaceChildren();

  if (pending.length === 0) {
    const message = document.createElement("p");
    message.textContent = "All caught up! Add a task to plan your day.";
    planContainer.appendChild(message);
    return;
  }

  const loading = document.createElement("p");
  loading.textContent = "✨ DayBuddy AI is building your timeline...";
  planContainer.appendChild(loading);
  button.disabled = true;

  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: pending,
        startTime: $("startTime").value,
        endTime: $("endTime").value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed.");
    }

    const aiPlan = data.plan;

    if (!aiPlan || !Array.isArray(aiPlan.schedule)) {
      throw new Error("The AI returned an unexpected schedule format.");
    }

    planContainer.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "✨ Your Daily Timeline";
    planContainer.appendChild(heading);

    if (aiPlan.greeting) {
      const greeting = document.createElement("p");
      greeting.textContent = aiPlan.greeting;
      planContainer.appendChild(greeting);
    }

    if (aiPlan.summary) {
      const summary = document.createElement("p");
      summary.className = "muted";
      summary.textContent = aiPlan.summary;
      planContainer.appendChild(summary);
    }

    const timeline = document.createElement("div");
    timeline.className = "day-timeline";

    aiPlan.schedule.forEach(item => {
      const card = document.createElement("article");
      const type = ["task", "break", "flexible"].includes(item.type)
        ? item.type
        : "task";

      card.className = `timeline-item timeline-${type}`;

      const time = document.createElement("div");
      time.className = "timeline-time";
      time.textContent = `${item.start || "--:--"} – ${item.end || "--:--"}`;

      const content = document.createElement("div");
      content.className = "timeline-content";

      const title = document.createElement("h4");
      title.textContent =
        `${type === "break" ? "☕ " : type === "flexible" ? "🌿 " : "📌 "}${item.title || "Scheduled item"}`;

      const description = document.createElement("p");
      description.textContent = item.description || "";

      content.append(title, description);

      if (type === "task" && item.priority) {
        const badge = document.createElement("span");
        const priority = ["high", "medium", "low"].includes(
          String(item.priority).toLowerCase()
        ) ? String(item.priority).toLowerCase() : "medium";

        badge.className = `priority-badge priority-${priority}`;
        badge.textContent = `${item.priority} priority`;
        content.appendChild(badge);
      }

      card.append(time, content);
      timeline.appendChild(card);
    });

    planContainer.appendChild(timeline);

    if (Array.isArray(aiPlan.unfittedTasks) &&
        aiPlan.unfittedTasks.length > 0) {
      const warning = document.createElement("p");
      warning.className = "unfitted-warning";
      warning.textContent =
        "⚠️ Tasks that couldn't fit: " +
        aiPlan.unfittedTasks.map(task =>
          typeof task === "string" ? task : task.title || "Untitled task"
        ).join(", ");
      planContainer.appendChild(warning);
    }

  } catch (error) {
    planContainer.replaceChildren();

    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Could not generate your plan: " + error.message;
    planContainer.appendChild(message);

    console.error("DayBuddy AI error:", error);
  } finally {
    button.disabled = false;
  }
});

renderTasks();


["taskSearch", "taskFilter", "taskSort"].forEach(id => {
  $(id).addEventListener("input", renderTasks);
  $(id).addEventListener("change", renderTasks);
});


/* FOCUS MODE — Pomodoro timer */

const FOCUS_LENGTH = 25 * 60;

let focusRemaining = FOCUS_LENGTH;
let focusInterval = null;
let focusRunning = false;
let focusSessions = 0;

function updateFocusClock() {
  const minutes = Math.floor(focusRemaining / 60);
  const seconds = focusRemaining % 60;

  $("focusClock").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  $("focusStart").disabled = focusRunning;
  $("focusPause").disabled = !focusRunning;
}

function refreshFocusTasks() {
  const select = $("focusTask");
  const previousValue = select.value;

  select.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a pending task";
  select.appendChild(placeholder);

  tasks.filter(task => !task.done).forEach(task => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = task.title;
    select.appendChild(option);
  });

  if (tasks.some(task => !task.done && task.id === previousValue)) {
    select.value = previousValue;
  }
}

function stopFocusTimer() {
  if (focusInterval !== null) {
    clearInterval(focusInterval);
    focusInterval = null;
  }

  focusRunning = false;
  updateFocusClock();
}

$("focusStart").addEventListener("click", () => {
  if (!$("focusTask").value) {
    $("focusMessage").textContent = "Choose a pending task first.";
    return;
  }

  if (focusRemaining <= 0) {
    $("focusMessage").textContent = "Press Reset to start another session.";
    return;
  }

  if (focusRunning) return;

  focusRunning = true;
  $("focusMessage").textContent = "Focus on one thing. Ignore distractions.";
  updateFocusClock();

  focusInterval = setInterval(() => {
    focusRemaining--;
    updateFocusClock();

    if (focusRemaining <= 0) {
      stopFocusTimer();
      focusSessions++;
      $("focusSessions").textContent = focusSessions;
      $("focusMessage").textContent =
        "🎉 Focus session complete! Take a short break.";

      const task = tasks.find(item => item.id === $("focusTask").value);

      if (task && !task.done) {
        task.done = true;
        saveTasks();
        renderTasks();
        refreshFocusTasks();
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("DayBuddy AI", {
          body: "Focus session complete! Great work."
        });
      }
    }
  }, 1000);
});

$("focusPause").addEventListener("click", () => {
  stopFocusTimer();
  $("focusMessage").textContent = "Timer paused. Resume when you're ready.";
});

$("focusReset").addEventListener("click", () => {
  stopFocusTimer();
  focusRemaining = FOCUS_LENGTH;
  $("focusMessage").textContent = "Timer reset. Ready for a fresh session.";
  updateFocusClock();
});

$("focusTask").addEventListener("change", () => {
  if (focusRunning) {
    stopFocusTimer();
    $("focusMessage").textContent =
      "Task changed. Start again when you're ready.";
  }
});

const originalRenderTasks = renderTasks;

renderTasks = function () {
  originalRenderTasks();
  refreshFocusTasks();
};

updateFocusClock();
refreshFocusTasks();

