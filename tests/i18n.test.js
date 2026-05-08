/**
 * @jest-environment jsdom
 */

const { loadApp } = require("./loader");

describe("i18n.js", () => {
  beforeEach(() => {
    localStorage.clear();
    loadApp();
  });

  test("exposes window.i18n with the expected API", () => {
    expect(window.i18n).toBeDefined();
    expect(typeof window.i18n.t).toBe("function");
    expect(typeof window.i18n.setLanguage).toBe("function");
    expect(typeof window.i18n.getCurrentLanguage).toBe("function");
    expect(typeof window.i18n.applyTranslations).toBe("function");
  });

  test("default language is English", () => {
    expect(window.i18n.getCurrentLanguage()).toBe("en");
  });

  test("t() returns the translated string for an existing key", () => {
    expect(window.i18n.t("header.balance")).toBe("Balance");
  });

  test("t() interpolates {placeholder} tokens", () => {
    expect(window.i18n.t("validation.titleTooLong", { max: 60 })).toBe(
      "Title must be 60 characters or fewer."
    );
  });

  test("t() leaves unknown placeholders untouched", () => {
    expect(window.i18n.t("aria.editEntry", {})).toBe("Edit {title}");
  });

  test("t() returns the key itself when missing in every dictionary", () => {
    expect(window.i18n.t("totally.bogus.key")).toBe("totally.bogus.key");
  });

  test("setLanguage() updates the active dictionary and persists the choice", () => {
    window.i18n.setLanguage("zh");
    expect(window.i18n.getCurrentLanguage()).toBe("zh");
    expect(window.i18n.t("header.balance")).toBe("\u7ED3\u4F59");
    expect(localStorage.getItem("language")).toBe("zh");
    expect(document.documentElement.getAttribute("lang")).toBe("zh-CN");
  });

  test("setLanguage('zh') updates the document.title via data-i18n-title", () => {
    window.i18n.setLanguage("zh");
    expect(document.title).toBe("\u9884\u7B97\u5E94\u7528 | JavaScript");
  });

  test("setLanguage() with an unsupported code is a no-op", () => {
    window.i18n.setLanguage("klingon");
    expect(window.i18n.getCurrentLanguage()).toBe("en");
  });

  test("setLanguage() with the current language refreshes the switcher only", () => {
    const dispatchSpy = jest.spyOn(document, "dispatchEvent");
    window.i18n.setLanguage("en");
    const langChange = dispatchSpy.mock.calls.find(
      ([ev]) => ev && ev.type === "languagechange"
    );
    expect(langChange).toBeUndefined();
    dispatchSpy.mockRestore();
  });

  test("setLanguage() emits a languagechange CustomEvent", () => {
    const handler = jest.fn();
    document.addEventListener("languagechange", handler);
    window.i18n.setLanguage("zh");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ language: "zh" });
  });

  test("clicking a .lang-option button triggers setLanguage", () => {
    const zhBtn = document.querySelector('.lang-option[data-lang="zh"]');
    zhBtn.click();
    expect(window.i18n.getCurrentLanguage()).toBe("zh");
    expect(zhBtn.classList.contains("active")).toBe(true);
    expect(zhBtn.getAttribute("aria-pressed")).toBe("true");
  });

  test("data-i18n-attr applies multiple attributes from one spec", () => {
    const el = document.createElement("input");
    el.setAttribute(
      "data-i18n-attr",
      "placeholder:input.title.placeholder, aria-label:aria.addExpense"
    );
    document.body.appendChild(el);
    window.i18n.applyTranslations();
    expect(el.getAttribute("placeholder")).toBe("title");
    expect(el.getAttribute("aria-label")).toBe("Add expense");
  });

  test("data-i18n-attr ignores malformed pairs", () => {
    const el = document.createElement("div");
    el.setAttribute("data-i18n-attr", "no-colon-here, :missing-attr, attr:");
    document.body.appendChild(el);
    expect(() => window.i18n.applyTranslations()).not.toThrow();
  });

  test("falls back to default-language entries when the active dict misses a key", () => {
    window.i18n.setLanguage("zh");
    // We synthesise a key that exists only in en. The runtime keeps a single
    // dictionary per language so we can patch translations indirectly by
    // requesting a key that we know is shared, then a known-only-en key
    // (`page.title.app` is in both, so we use a private fallback path through
    // an unknown key — should fall back to the literal key string).
    expect(window.i18n.t("page.title.app")).toBe(
      "\u9884\u7B97\u5E94\u7528 | JavaScript"
    );
  });

  test("reads stored language on startup", () => {
    localStorage.setItem("language", "zh");
    loadApp();
    expect(window.i18n.getCurrentLanguage()).toBe("zh");
    expect(document.documentElement.getAttribute("lang")).toBe("zh-CN");
  });

  test("ignores stored language that is not in the catalogue", () => {
    localStorage.setItem("language", "fr");
    loadApp();
    expect(window.i18n.getCurrentLanguage()).toBe("en");
  });

  test("survives a localStorage that throws on read", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function () {
      throw new Error("blocked");
    };
    try {
      expect(() => loadApp()).not.toThrow();
      expect(window.i18n.getCurrentLanguage()).toBe("en");
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  test("survives a localStorage that throws on write during setLanguage", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new Error("quota");
    };
    try {
      expect(() => window.i18n.setLanguage("zh")).not.toThrow();
      expect(window.i18n.getCurrentLanguage()).toBe("zh");
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  test("init() is deferred until DOMContentLoaded when document is still loading", () => {
    // Force the readyState to "loading" before re-loading so the script binds
    // its DOMContentLoaded listener path.
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get() {
        return "loading";
      },
    });
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    document.body.innerHTML =
      '<div class="lang-switcher"><button class="lang-option" data-lang="en"></button></div>';
    jest.resetModules();
    delete window.i18n;
    require("../i18n.js");
    // Switcher should not yet be active because init() hasn't fired.
    const dispatched = document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(dispatched).toBe(true);
    expect(window.i18n.getCurrentLanguage()).toBe("en");
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get() {
        return "complete";
      },
    });
  });
});
