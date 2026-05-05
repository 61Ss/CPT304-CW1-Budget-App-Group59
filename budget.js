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
const tabs = [expenseBtn, incomeBtn, allBtn];

// MODAL ALERT — single dialog reused for every validation message.
const alertModal = document.getElementById("alert-modal");
const alertMessageEl = document.getElementById("alert-modal-message");
const alertOkBtn = document.getElementById("alert-modal-ok");
let alertReturnFocus = null;

// Validation bounds. Picked to rule out clearly bogus input
// (e.g. negative spend, blank-padded titles, accidental 1e308) without
// constraining real budget use.
const TITLE_MAX_LENGTH = 60;
const AMOUNT_MAX = 1_000_000_000;

//VARIABLES
let ENTRY_LIST;
let balance = 0,
  income = 0,
  outcome = 0;
const DELETE = "delete",
  EDIT = "edit";
const ENTRY_STORAGE_KEY = "entry_list";

// LOOK IF THERE IS DATA IN LOCAL STORAGE
ENTRY_LIST = loadEntryList();
updateUI();

// Defensive load: coerce types and drop malformed records so a tampered
// localStorage payload cannot reintroduce script-bearing strings or break
// the UI on refresh.
function loadEntryList() {
  const storedEntries = localStorage.getItem(ENTRY_STORAGE_KEY);
  let raw;

  if (storedEntries === null) return [];

  try {
    raw = JSON.parse(storedEntries);
  } catch (e) {
    console.warn("Ignoring invalid entry data from localStorage.", e);
    localStorage.removeItem(ENTRY_STORAGE_KEY);
    return [];
  }

  if (!Array.isArray(raw)) {
    console.warn("Ignoring unexpected entry_list payload from localStorage.");
    localStorage.removeItem(ENTRY_STORAGE_KEY);
    return [];
  }

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

function persistEntryList() {
  try {
    localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(ENTRY_LIST));
  } catch (e) {
    console.warn("Unable to persist entry data to localStorage.", e);
  }
}

//EVENT LISTENERS
expenseBtn.addEventListener("click", function () {
  activateTab(expenseBtn, expenseEl, [incomeEl, allEl], [incomeBtn, allBtn]);
});
incomeBtn.addEventListener("click", function () {
  activateTab(incomeBtn, incomeEl, [expenseEl, allEl], [expenseBtn, allBtn]);
});
allBtn.addEventListener("click", function () {
  activateTab(allBtn, allEl, [incomeEl, expenseEl], [incomeBtn, expenseBtn]);
});

tabs.forEach((tab, index) => {
  tab.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });
});

addExpense.addEventListener("click", function () {
  submitEntry({
    type: "expense",
    titleEl: expenseTitle,
    amountEl: expenseAmount,
  });
});

addIncome.addEventListener("click", function () {
  submitEntry({
    type: "income",
    titleEl: incomeTitle,
    amountEl: incomeAmount,
  });
});

// Modal dismissal: OK button, ESC key, or click on the backdrop.
alertOkBtn.addEventListener("click", closeAlert);
alertModal.addEventListener("click", function (event) {
  if (event.target === alertModal) closeAlert();
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !alertModal.classList.contains("hide")) {
    closeAlert();
  }
});

incomeList.addEventListener("click", deleteOrEdit);
expenseList.addEventListener("click", deleteOrEdit);
allList.addEventListener("click", deleteOrEdit);

// HELEPER FUNCS

// Centralised add-entry pipeline: validate, surface a clear message on
// failure, otherwise commit and reset the form state.
function submitEntry({ type, titleEl, amountEl }) {
  const result = validateEntry(titleEl, amountEl);

  if (!result.ok) {
    // result.field is the input that caused the failure; we hand it to
    // showAlert so focus jumps back there once the user dismisses the
    // popup, making it obvious where to fix the problem.
    showAlert(result.message, result.field);
    return;
  }

  ENTRY_LIST.push({ type, title: result.title, amount: result.amount });
  updateUI();
  clearInput([titleEl, amountEl]);
}

// Returns either { ok: true, title, amount } with the cleaned values, or
// { ok: false, field, message } so the caller knows what to highlight.
function validateEntry(titleEl, amountEl) {
  const title = titleEl.value.trim();
  const amountRaw = amountEl.value.trim();

  if (title.length === 0) {
    return {
      ok: false,
      field: titleEl,
      message: "Please enter a title.",
    };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      field: titleEl,
      message: `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (amountRaw.length === 0) {
    return {
      ok: false,
      field: amountEl,
      message: "Please enter an amount.",
    };
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) {
    return {
      ok: false,
      field: amountEl,
      message: "Amount must be a valid number.",
    };
  }
  if (amount <= 0) {
    return {
      ok: false,
      field: amountEl,
      message: "Amount must be greater than 0.",
    };
  }
  if (amount > AMOUNT_MAX) {
    return {
      ok: false,
      field: amountEl,
      message: "Amount is too large.",
    };
  }

  // Snap to cents so floating point noise doesn't reach the totals.
  const normalisedAmount = Math.round(amount * 100) / 100;
  return { ok: true, title, amount: normalisedAmount };
}

// Open the modal with a message. `focusOnClose` is the element that should
// receive focus after the dialog is dismissed — typically the offending
// input — which lets keyboard users keep flowing without re-grabbing the
// mouse.
function showAlert(message, focusOnClose) {
  alertMessageEl.textContent = message;
  alertModal.classList.remove("hide");
  alertReturnFocus = focusOnClose || document.activeElement;
  alertOkBtn.focus();
}

function closeAlert() {
  alertModal.classList.add("hide");
  if (alertReturnFocus && typeof alertReturnFocus.focus === "function") {
    alertReturnFocus.focus();
  }
  alertReturnFocus = null;
}

function deleteOrEdit(event) {
  const targetBtn = event.target.closest("button[data-action]");
  if (!targetBtn) return;

  const entry = targetBtn.parentNode;

  if (targetBtn.dataset.action == EDIT) {
    editEntry(entry);
  } else if (targetBtn.dataset.action == DELETE) {
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
  persistEntryList();
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

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "action-btn edit";
  editButton.dataset.action = EDIT;
  editButton.setAttribute("aria-label", `Edit ${title}`);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "action-btn delete";
  deleteButton.dataset.action = DELETE;
  deleteButton.setAttribute("aria-label", `Delete ${title}`);

  li.appendChild(entryDiv);
  li.appendChild(editButton);
  li.appendChild(deleteButton);

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
  element.removeAttribute("hidden");
}

function hide(elements) {
  elements.forEach((element) => {
    element.classList.add("hide");
    element.setAttribute("hidden", "");
  });
}

function active(element) {
  element.classList.add("focus");
  element.setAttribute("aria-selected", "true");
  element.tabIndex = 0;
}
function inactive(elements) {
  elements.forEach((element) => {
    element.classList.remove("focus");
    element.setAttribute("aria-selected", "false");
    element.tabIndex = -1;
  });
}

function activateTab(activeButton, panelToShow, panelsToHide, buttonsToDeactivate) {
  show(panelToShow);
  hide(panelsToHide);
  active(activeButton);
  inactive(buttonsToDeactivate);
}
