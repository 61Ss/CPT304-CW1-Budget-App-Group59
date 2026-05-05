//SELECT ELEMENTS
const balanceEl = document.querySelector(".balance .value");
const incomeTotalEl = document.querySelector(".income-total");
const outcomeTotalEl = document.querySelector(".outcome-total");
const incomeEl = document.querySelector("#income");
const expenseEl = document.querySelector("#expense");
const allEl = document.querySelector("#all");
const incomeList = document.querySelector("#income .list");
const expenseList = document.querySelector("#expense .list");
const allList = document.querySelector("#all .list");

//SELECT BUTTONS
const expenseBtn = document.querySelector(".first-tab");
const incomeBtn = document.querySelector(".second-tab");
const allBtn = document.querySelector(".third-tab");

//INPUT BTS
const addExpense = document.querySelector(".add-expense");
const expenseTitle = document.getElementById("expense-title-input");
const expenseAmount = document.getElementById("expense-amount-input");

const addIncome = document.querySelector(".add-income");
const incomeTitle = document.getElementById("income-title-input");
const incomeAmount = document.getElementById("income-amount-input");

//VARIABLES
let ENTRY_LIST;
let balance = 0,
  income = 0,
  outcome = 0;
const DELETE = "delete",
  EDIT = "edit";

// LOOK IF THERE IS DATA IN LOCAL STORAGE
ENTRY_LIST = loadEntryList();
updateUI();

// Defensive load: coerce types and drop malformed records so a tampered
// localStorage payload cannot reintroduce script-bearing strings or break
// the UI on refresh.
function loadEntryList() {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem("entry_list"));
  } catch (e) {
    raw = null;
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e) =>
        e &&
        (e.type === "income" || e.type === "expense") &&
        typeof e.title === "string" &&
        Number.isFinite(+e.amount)
    )
    .map((e) => ({ type: e.type, title: e.title, amount: +e.amount }));
}

//EVENT LISTENERS
expenseBtn.addEventListener("click", function () {
  show(expenseEl);
  hide([incomeEl, allEl]);
  active(expenseBtn);
  inactive([incomeBtn, allBtn]);
});
incomeBtn.addEventListener("click", function () {
  show(incomeEl);
  hide([expenseEl, allEl]);
  active(incomeBtn);
  inactive([expenseBtn, allBtn]);
});
allBtn.addEventListener("click", function () {
  show(allEl);
  hide([incomeEl, expenseEl]);
  active(allBtn);
  inactive([incomeBtn, expenseBtn]);
});

addExpense.addEventListener("click", function () {
  // CHECK IF ONE OF THE INPUT IS EMPTY => EXIT
  if (!expenseTitle.value || !expenseAmount.value) return;

  // ADD INPUTs TO ENTRY_LIST
  let expense = {
    type: "expense",
    title: expenseTitle.value,
    amount: +expenseAmount.value,
  };
  ENTRY_LIST.push(expense);

  updateUI();
  clearInput([expenseTitle, expenseAmount]);
});

addIncome.addEventListener("click", function () {
  // CHECK IF ONE OF THE INPUT IS EMPTY => EXIT
  if (!incomeTitle.value || !incomeAmount.value) return;

  // ADD INPUTs TO ENTRY_LIST
  let income = {
    type: "income",
    title: incomeTitle.value,
    amount: +incomeAmount.value,
  };
  ENTRY_LIST.push(income);

  updateUI();
  clearInput([incomeTitle, incomeAmount]);
});

incomeList.addEventListener("click", deleteOrEdit);
expenseList.addEventListener("click", deleteOrEdit);
allList.addEventListener("click", deleteOrEdit);

// HELEPER FUNCS
function deleteOrEdit(event) {
  const targetBtn = event.target;
  const entry = targetBtn.parentNode;

  if (targetBtn.id == EDIT) {
    editEntry(entry);
  } else if (targetBtn.id == DELETE) {
    deleteEntry(entry);
  }
}

function deleteEntry(entry) {
  ENTRY_LIST.splice(entry.id, 1);
  updateUI();
}

function editEntry(entry) {
  const ENTRY = ENTRY_LIST[entry.id];

  if (ENTRY.type == "income") {
    incomeTitle.value = ENTRY.title;
    incomeAmount.value = ENTRY.amount;
  } else if (ENTRY.type == "expense") {
    expenseTitle.value = ENTRY.title;
    expenseAmount.value = ENTRY.amount;
  }
  deleteEntry(entry);
}

function updateUI() {
  income = calculateTotal("income", ENTRY_LIST);
  outcome = calculateTotal("expense", ENTRY_LIST);
  balance = Math.abs(calculateBalance(income, outcome));

  let sign = income >= outcome ? "$" : "-$";

  //UPDATE UI
  balanceEl.innerHTML = `<small>${sign}</small>${balance}`;
  outcomeTotalEl.innerHTML = `<small>$</small>${outcome}`;
  incomeTotalEl.innerHTML = `<small>$</small>${income}`;

  clearElement([expenseList, incomeList, allList]);

  ENTRY_LIST.forEach((entry, index) => {
    if (entry.type == "expense") {
      showEntry(expenseList, entry.type, entry.title, entry.amount, index);
    } else if (entry.type == "income") {
      showEntry(incomeList, entry.type, entry.title, entry.amount, index);
    }
    showEntry(allList, entry.type, entry.title, entry.amount, index);
  });
  updateChart(income, outcome);
  localStorage.setItem("entry_list", JSON.stringify(ENTRY_LIST));
}

function showEntry(list, type, title, amount, id) {
  // Build the row with DOM APIs and textContent instead of an HTML string.
  // textContent never parses markup, so a title like
  // `<img src=x onerror=...>` is rendered as plain text and the persistent
  // XSS sink (insertAdjacentHTML on user data) is removed.
  const li = document.createElement("li");
  li.id = String(id);
  li.className = type;

  const entryDiv = document.createElement("div");
  entryDiv.className = "entry";
  entryDiv.textContent = `${title} : $${amount}`;

  const editDiv = document.createElement("div");
  editDiv.id = "edit";

  const deleteDiv = document.createElement("div");
  deleteDiv.id = "delete";

  li.appendChild(entryDiv);
  li.appendChild(editDiv);
  li.appendChild(deleteDiv);

  // Equivalent of insertAdjacentHTML(..., "afterbegin").
  list.prepend(li);
}

function clearElement(elements) {
  elements.forEach((element) => {
    element.innerHTML = "";
  });
}

function calculateTotal(type, list) {
  let sum = 0;
  list.forEach((entry) => {
    if (entry.type == type) {
      sum += entry.amount;
    }
  });
  return sum;
}

function calculateBalance(income, outcome) {
  return income - outcome;
}
function clearInput(inputs) {
  inputs.forEach((input) => {
    input.value = "";
  });
}

function show(element) {
  element.classList.remove("hide");
}

function hide(elements) {
  elements.forEach((element) => {
    element.classList.add("hide");
  });
}

function active(element) {
  element.classList.add("focus");
}
function inactive(elements) {
  elements.forEach((element) => {
    element.classList.remove("focus");
  });
}
