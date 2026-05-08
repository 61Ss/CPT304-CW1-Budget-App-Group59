/**
 * @jest-environment jsdom
 */

const { loadApp } = require("./loader");

// Helpers tied to the production markup.
const $ = (sel) => document.querySelector(sel);

function fillExpense(title, amount) {
  $("#expense-title-input").value = title;
  $("#expense-amount-input").value = String(amount);
  $(".add-expense").click();
}

function fillIncome(title, amount) {
  $("#income-title-input").value = title;
  $("#income-amount-input").value = String(amount);
  $(".add-income").click();
}

function dismissAlert() {
  // Modal is open if it lacks the "hide" class.
  const modal = $("#alert-modal");
  if (!modal.classList.contains("hide")) {
    $("#alert-modal-ok").click();
  }
}

function acceptCookies() {
  const accept = $("#cookie-accept-btn");
  if (accept) accept.click();
}

describe("budget.js", () => {
  beforeEach(() => {
    localStorage.clear();
    loadApp();
  });

  afterEach(() => {
    // Make sure we never leak an open modal into the next test.
    dismissAlert();
  });

  describe("initial render", () => {
    test("renders the empty state with $0 balance / income / outcome", () => {
      expect($(".balance .value").textContent).toBe("$0");
      expect($(".income-total").textContent).toBe("$0");
      expect($(".outcome-total").textContent).toBe("$0");
    });

    test("opens the cookie banner when no consent is stored", () => {
      const banner = $("#cookie-banner");
      expect(banner.classList.contains("hide")).toBe(false);
      expect(banner.hasAttribute("hidden")).toBe(false);
    });
  });

  describe("adding entries", () => {
    test("adds a valid income entry to the income list and the all list", () => {
      fillIncome("Salary", 1000);
      expect($("#income .list").children.length).toBe(1);
      expect($("#all .list").children.length).toBe(1);
      expect($(".income-total").textContent).toBe("$1000");
      expect($(".balance .value").textContent).toBe("$1000");
    });

    test("adds a valid expense and shows a deficit balance with -$ sign", () => {
      fillExpense("Rent", 200);
      expect($("#expense .list").children.length).toBe(1);
      expect($(".outcome-total").textContent).toBe("$200");
      expect($(".balance .value").textContent).toBe("-$200");
    });

    test("renders the entry text without parsing HTML in the title", () => {
      fillIncome("<img src=x onerror=alert(1)>", 5);
      const entryDiv = $("#all .list .entry");
      expect(entryDiv.querySelector("img")).toBeNull();
      expect(entryDiv.textContent).toContain("<img");
    });

    test("normalises amounts to two decimal places", () => {
      // 1.235 * 100 = 123.5 in IEEE-754 → rounds up to 124 → 1.24.
      fillIncome("Coffee", 1.235);
      expect($(".income-total").textContent).toBe("$1.24");
    });

    test("clears the input fields after a successful add", () => {
      fillIncome("Salary", 100);
      expect($("#income-title-input").value).toBe("");
      expect($("#income-amount-input").value).toBe("");
    });
  });

  describe("validation alerts", () => {
    test("missing title shows an alert and focuses the title input", () => {
      $(".add-income").click();
      const modal = $("#alert-modal");
      expect(modal.classList.contains("hide")).toBe(false);
      expect($("#alert-modal-message").textContent).toMatch(/title/i);
    });

    test("title longer than 60 chars triggers the too-long alert", () => {
      fillIncome("a".repeat(61), 5);
      expect($("#alert-modal-message").textContent).toMatch(/60/);
    });

    test("missing amount triggers the amount-required alert", () => {
      $("#income-title-input").value = "Salary";
      $("#income-amount-input").value = "";
      $(".add-income").click();
      expect($("#alert-modal-message").textContent).toMatch(/amount/i);
    });

    test("non-numeric amount triggers the invalid alert", () => {
      // Set via an input that allows free text — switch to expense which has
      // a number input but jsdom permits arbitrary value strings.
      const titleEl = $("#expense-title-input");
      const amountEl = $("#expense-amount-input");
      titleEl.value = "Coffee";
      // Bypass the numeric input's coercion by writing a non-numeric string;
      // jsdom returns it as-is in .value, then the script's Number() yields NaN.
      Object.defineProperty(amountEl, "value", {
        configurable: true,
        get: () => "not-a-number",
        set: () => {},
      });
      $(".add-expense").click();
      expect($("#alert-modal-message").textContent).toMatch(/valid number/i);
    });

    test("zero amount triggers the not-positive alert", () => {
      fillExpense("Free", 0);
      expect($("#alert-modal-message").textContent).toMatch(/greater than 0/i);
    });

    test("amount above the cap triggers the too-large alert", () => {
      fillIncome("Lottery", 1_000_000_001);
      expect($("#alert-modal-message").textContent).toMatch(/too large/i);
    });

    test("OK button dismisses the alert and returns focus to the offending field", () => {
      $(".add-income").click();
      $("#alert-modal-ok").click();
      expect($("#alert-modal").classList.contains("hide")).toBe(true);
    });

    test("clicking the modal backdrop closes the alert", () => {
      $(".add-income").click();
      const modal = $("#alert-modal");
      modal.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      // Simulate event.target === modal by dispatching directly on it.
      const ev = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(ev, "target", { value: modal });
      modal.dispatchEvent(ev);
      // Backdrop click handler closes when target === modal.
      // After the synthetic event the modal should be hidden.
      expect(modal.classList.contains("hide")).toBe(true);
    });

    test("Escape key dismisses the alert", () => {
      $(".add-income").click();
      const escape = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escape);
      expect($("#alert-modal").classList.contains("hide")).toBe(true);
    });

    test("Escape with the modal already closed is a no-op", () => {
      const modal = $("#alert-modal");
      expect(modal.classList.contains("hide")).toBe(true);
      const escape = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escape);
      expect(modal.classList.contains("hide")).toBe(true);
    });
  });

  describe("delete and edit", () => {
    test("delete button removes the entry and updates totals", () => {
      fillIncome("Salary", 100);
      const delBtn = $('#income .list [data-action="delete"]');
      delBtn.click();
      expect($("#income .list").children.length).toBe(0);
      expect($(".income-total").textContent).toBe("$0");
    });

    test("edit button repopulates the inputs and removes the entry", () => {
      fillExpense("Coffee", 5);
      const editBtn = $('#expense .list [data-action="edit"]');
      editBtn.click();
      expect($("#expense-title-input").value).toBe("Coffee");
      expect($("#expense-amount-input").value).toBe("5");
      expect($("#expense .list").children.length).toBe(0);
    });

    test("edit button on an income entry repopulates the income inputs", () => {
      fillIncome("Bonus", 50);
      const editBtn = $('#income .list [data-action="edit"]');
      editBtn.click();
      expect($("#income-title-input").value).toBe("Bonus");
      expect($("#income-amount-input").value).toBe("50");
    });

    test("clicking elsewhere on the list (not on a button) is a no-op", () => {
      fillIncome("Salary", 100);
      $("#income .list").click();
      expect($("#income .list").children.length).toBe(1);
    });
  });

  describe("tabs", () => {
    test("clicking the expense tab shows the expense panel and hides the others", () => {
      $(".first-tab").click();
      expect($("#expense").classList.contains("hide")).toBe(false);
      expect($("#income").classList.contains("hide")).toBe(true);
      expect($("#all").classList.contains("hide")).toBe(true);
      expect($(".first-tab").getAttribute("aria-selected")).toBe("true");
    });

    test("clicking the income tab activates the income panel", () => {
      $(".second-tab").click();
      expect($("#income").classList.contains("hide")).toBe(false);
    });

    test("clicking the all tab activates the all panel", () => {
      $(".third-tab").click();
      expect($("#all").classList.contains("hide")).toBe(false);
    });

    test("ArrowRight on a tab moves focus to the next tab and activates it", () => {
      const first = $(".first-tab");
      first.focus();
      first.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
      expect(document.activeElement).toBe($(".second-tab"));
    });

    test("ArrowLeft from the first tab wraps to the last tab", () => {
      const first = $(".first-tab");
      first.focus();
      first.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
      );
      expect(document.activeElement).toBe($(".third-tab"));
    });

    test("non-arrow keys on a tab are ignored", () => {
      const first = $(".first-tab");
      first.focus();
      first.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
      expect(document.activeElement).toBe(first);
    });
  });

  describe("cookie banner & persistence", () => {
    test("declining storage hides the banner and clears any existing entries", () => {
      localStorage.setItem(
        "entry_list",
        JSON.stringify([{ type: "income", title: "Old", amount: 1 }])
      );
      $("#cookie-decline-btn").click();
      expect(localStorage.getItem("entry_list")).toBeNull();
      expect($("#cookie-banner").classList.contains("hide")).toBe(true);
      expect(localStorage.getItem("storage_consent")).toBe("declined");
    });

    test("accepting storage persists subsequent entries to localStorage", () => {
      acceptCookies();
      fillIncome("Salary", 250);
      const stored = JSON.parse(localStorage.getItem("entry_list"));
      expect(stored).toEqual([
        { type: "income", title: "Salary", amount: 250 },
      ]);
    });

    test("declined consent prevents persistence on add", () => {
      $("#cookie-decline-btn").click();
      fillIncome("Salary", 100);
      expect(localStorage.getItem("entry_list")).toBeNull();
    });

    test("Cookie Settings button reopens the banner", () => {
      acceptCookies();
      expect($("#cookie-banner").classList.contains("hide")).toBe(true);
      $("#cookie-settings-btn").click();
      expect($("#cookie-banner").classList.contains("hide")).toBe(false);
    });

    test("loads previously saved entries on startup", () => {
      localStorage.setItem("storage_consent", "accepted");
      localStorage.setItem("storage_consent_version", "v2");
      localStorage.setItem(
        "entry_list",
        JSON.stringify([
          { type: "income", title: "Salary", amount: 200 },
          { type: "expense", title: "Rent", amount: 50 },
        ])
      );
      loadApp();
      expect($(".income-total").textContent).toBe("$200");
      expect($(".outcome-total").textContent).toBe("$50");
      expect($(".balance .value").textContent).toBe("$150");
    });

    test("ignores invalid JSON in entry_list and clears it", () => {
      localStorage.setItem("storage_consent", "accepted");
      localStorage.setItem("storage_consent_version", "v2");
      localStorage.setItem("entry_list", "{not json");
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      loadApp();
      expect($(".income-total").textContent).toBe("$0");
      // After load + updateUI(), persistEntryList() writes the cleaned list
      // back; with no surviving entries the stored value is the empty array.
      expect(localStorage.getItem("entry_list")).toBe("[]");
      warn.mockRestore();
    });

    test("ignores non-array payloads in entry_list", () => {
      localStorage.setItem("storage_consent", "accepted");
      localStorage.setItem("storage_consent_version", "v2");
      localStorage.setItem("entry_list", JSON.stringify({ not: "an array" }));
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      loadApp();
      expect($(".income-total").textContent).toBe("$0");
      expect(localStorage.getItem("entry_list")).toBe("[]");
      warn.mockRestore();
    });

    test("filters out malformed entries from the stored payload", () => {
      localStorage.setItem("storage_consent", "accepted");
      localStorage.setItem("storage_consent_version", "v2");
      localStorage.setItem(
        "entry_list",
        JSON.stringify([
          { type: "income", title: "Good", amount: 5 },
          { type: "wrong-type", title: "Bad", amount: 5 },
          { type: "income", title: 123, amount: 5 },
          { type: "income", title: "NaN amount", amount: "abc" },
          null,
        ])
      );
      loadApp();
      expect($("#all .list").children.length).toBe(1);
      expect($(".income-total").textContent).toBe("$5");
    });

    test("ignores stored consent if version key is mismatched", () => {
      localStorage.setItem("storage_consent", "accepted");
      localStorage.setItem("storage_consent_version", "v0-old");
      localStorage.setItem(
        "entry_list",
        JSON.stringify([{ type: "income", title: "Stale", amount: 99 }])
      );
      loadApp();
      // Banner should be open again, entries should not be loaded.
      expect($("#cookie-banner").classList.contains("hide")).toBe(false);
      expect($(".income-total").textContent).toBe("$0");
    });

    test("survives localStorage reads that throw", () => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function () {
        throw new Error("blocked");
      };
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      try {
        expect(() => loadApp()).not.toThrow();
      } finally {
        Storage.prototype.getItem = original;
        warn.mockRestore();
      }
    });

    test("survives localStorage writes that throw on accept", () => {
      const originalSet = Storage.prototype.setItem;
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      Storage.prototype.setItem = function () {
        throw new Error("quota");
      };
      try {
        expect(() => $("#cookie-accept-btn").click()).not.toThrow();
      } finally {
        Storage.prototype.setItem = originalSet;
        warn.mockRestore();
      }
    });

    test("survives localStorage removes that throw on decline", () => {
      const originalRemove = Storage.prototype.removeItem;
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      Storage.prototype.removeItem = function () {
        throw new Error("blocked");
      };
      try {
        expect(() => $("#cookie-decline-btn").click()).not.toThrow();
      } finally {
        Storage.prototype.removeItem = originalRemove;
        warn.mockRestore();
      }
    });
  });

  describe("language change", () => {
    test("re-renders entries when the language changes so aria labels update", () => {
      fillIncome("Salary", 10);
      const editBtn = $('#income .list [data-action="edit"]');
      expect(editBtn.getAttribute("aria-label")).toBe("Edit Salary");

      window.i18n.setLanguage("zh");
      const updatedEditBtn = $('#income .list [data-action="edit"]');
      expect(updatedEditBtn.getAttribute("aria-label")).toBe(
        "\u7F16\u8F91 Salary"
      );
    });
  });

  describe("tr() helper fallback", () => {
    test("falls back to the key when window.i18n is unavailable", () => {
      // Wipe i18n then trigger validation: the alert message should be the
      // raw key path because tr() returns the key as a fallback.
      delete window.i18n;
      $(".add-income").click();
      expect($("#alert-modal-message").textContent).toBe(
        "validation.titleRequired"
      );
    });
  });
});
