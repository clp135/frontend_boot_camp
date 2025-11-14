(function () {
  "use strict";

  const STORAGE_KEY = "weeklyPlannerTasks";


  const state = {
    currentWeekStart: null,
    selectedDate: null,
    tasksByDate: {},
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    loadTasks();

    const today = new Date();
    state.currentWeekStart = getStartOfWeek(today);
    state.selectedDate = toISODate(today);

    attachEvents();
    updateSelectedDateLabel();
    renderWeek();
    renderTodoList();
  }

  function cacheDom() {
    dom.weekDaysContainer = document.getElementById("weekDays");
    dom.currentWeekLabel = document.getElementById("currentWeekLabel");
    dom.selectedDateLabel = document.getElementById("selectedDateLabel");
    dom.todoForm = document.getElementById("todoForm");
    dom.todoTextInput = document.getElementById("todoText");
    dom.categorySelect = document.getElementById("categorySelect");
    dom.addCategoryBtn = document.getElementById("addCategoryBtn");
    dom.dueDateInput = document.getElementById("dueDateInput");
    dom.todoList = document.getElementById("todoList");
    dom.prevWeekBtn = document.getElementById("prevWeek");
    dom.nextWeekBtn = document.getElementById("nextWeek");
  }

  function attachEvents() {
    dom.prevWeekBtn.addEventListener("click", () => changeWeek(-1));
    dom.nextWeekBtn.addEventListener("click", () => changeWeek(1));
    dom.todoForm.addEventListener("submit", handleSubmit);
    dom.addCategoryBtn.addEventListener("click", handleAddCategory);
    dom.todoList.addEventListener("click", handleTodoListClick);
  }

  // 유틸 함수
  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0(일)~6(토)
    const diff = day === 0 ? -6 : 1 - day; // 월요일 기준
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatKoreanDate(date) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = days[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  }

  function formatWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const sY = startDate.getFullYear();
    const sM = startDate.getMonth() + 1;
    const sD = startDate.getDate();
    const eM = endDate.getMonth() + 1;
    const eD = endDate.getDate();
    return `${sY}. ${sM}. ${sD} - ${eM}. ${eD}`;
  }

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 저장/불러오기

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          state.tasksByDate = parsed;
        }
      }
    }
    catch (e) {
      console.error("Failed to load tasks", e);
    }
  }

  function saveTasks(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasksByDate));
  }

  // 상태 변경 함수

  function setSelectedDate(isoDate) {
    state.selectedDate = isoDate;
    updateSelectedDateLabel();
    renderWeek();
    renderTodoList();
  }

  function addTask(text, category, dueDate) {
    const key = state.selectedDate;
    const tasks = state.tasksByDate[key] || [];
    const newTask = {
      id: generateId(),
      text,
      category,
      dueDate,
      completed: false,
    };
    state.tasksByDate[key] = [...tasks, newTask];
    persistAndRender();
  }

  function toggleTask(id) {
    const key = state.selectedDate;
    const tasks = state.tasksByDate[key] || [];
    state.tasksByDate[key] = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    persistAndRender();
  }

  function deleteTask(id) {
    const key = state.selectedDate;
    const tasks = state.tasksByDate[key] || [];
    state.tasksByDate[key] = tasks.filter((task) => task.id !== id);
    persistAndRender();
  }

  function persistAndRender() {
    saveTasks();
    renderTodoList();
  }

  function changeWeek(deltaWeeks) {
    const next = new Date(state.currentWeekStart);
    next.setDate(next.getDate() + deltaWeeks * 7);
    state.currentWeekStart = next;
    renderWeek();
  }

  // 렌더링

  function renderWeek() {
    dom.weekDaysContainer.innerHTML = "";
    dom.currentWeekLabel.textContent = formatWeekRange(state.currentWeekStart);

    const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
    const todayIso = toISODate(new Date());

    for (let i = 0; i < 7; i++) {
      const date = new Date(state.currentWeekStart);
      date.setDate(state.currentWeekStart.getDate() + i);
      const iso = toISODate(date);

      const card = document.createElement("button");
      card.className = "day-card";
      card.dataset.date = iso;
      card.type = "button";

      const nameSpan = document.createElement("span");
      nameSpan.className = "day-name";
      nameSpan.textContent = dayNames[i];
      const dateSpan = document.createElement("span");
      dateSpan.className = "day-date";
      dateSpan.textContent = date.getDate();

      card.appendChild(nameSpan);
      card.appendChild(dateSpan);

      if (iso === todayIso) {
        card.classList.add("today");
      }
      if (iso === state.selectedDate) {
        card.classList.add("selected");
      }

      card.addEventListener("click", () => {
        setSelectedDate(iso);
      });

      dom.weekDaysContainer.appendChild(card);
    }
  }

  function updateSelectedDateLabel() {
    const [y, m, d] = state.selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    dom.selectedDateLabel.textContent = formatKoreanDate(date);
  }

  function renderTodoList() {
    const tasks = state.tasksByDate[state.selectedDate] || [];

    if (tasks.length === 0) {
      dom.todoList.innerHTML =
        '<li class="todo-list-empty">아직 등록된 할 일이 없습니다.</li>';
      return;
    }

    const html = tasks
      .map((task) => {
        const dueText = task.dueDate
          ? `마감: ${task.dueDate}`
          : "마감 날짜 없음";
        const completedClass = task.completed ? " completed" : "";
        const checkedAttr = task.completed ? ' checked="checked"' : "";

        return `
<li class="todo-item${completedClass}" data-id="${task.id}">
  <div class="todo-left">
    <input type="checkbox" class="todo-checkbox" data-role="toggle"${checkedAttr} />
    <div class="todo-text-group">
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <span class="todo-category">${escapeHtml(task.category)}</span>
    </div>
  </div>
  <div class="todo-right">
    <span class="todo-due">${dueText}</span>
    <button type="button" class="delete-btn btn" data-role="delete">삭제</button>
  </div>
</li>`;
      })
      .join("");

    dom.todoList.innerHTML = html;
  }

  // 이벤트

  function handleSubmit(e) {
    e.preventDefault();
    const text = dom.todoTextInput.value.trim();
    if (!text) return;

    const category = dom.categorySelect.value;
    const dueDate = dom.dueDateInput.value || "";

    addTask(text, category, dueDate);
    dom.todoTextInput.value = "";
  }

  function handleAddCategory() {
    const name = prompt("추가할 카테고리 이름을 입력하세요:");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    // 이미 있는지 확인
    for (let i = 0; i < dom.categorySelect.options.length; i++) {
      if (dom.categorySelect.options[i].value === trimmed) {
        dom.categorySelect.selectedIndex = i;
        return;
      }
    }

    const option = document.createElement("option");
    option.value = trimmed;
    option.textContent = trimmed;
    dom.categorySelect.appendChild(option);
    dom.categorySelect.value = trimmed;
  }

  function handleTodoListClick(e) {
    const li = e.target.closest(".todo-item");
    if (!li) return;

    const id = li.dataset.id;
    if (!id) return;

    if (e.target.matches("[data-role='delete']")) {
      deleteTask(id);
    } else if (e.target.matches("[data-role='toggle']")) {
      toggleTask(id);
    }
  }
})();