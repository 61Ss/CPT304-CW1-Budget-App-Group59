// Lightweight i18n runtime for the Budget App.
//
// Goals:
// * Single source of translation strings for both index.html and privacy.html.
// * Drive markup via data-* attributes so HTML stays declarative:
//     - data-i18n="key"             → element.textContent
//     - data-i18n-attr="attr:key,…" → element.setAttribute(attr, …)
//     - data-i18n-title="key"       → document.title (set on <html>)
// * Persist the user's choice in localStorage and fall back to navigator
//   language so first-time visitors get a sensible default.
// * Emit a `languagechange` CustomEvent on document so components that build
//   DOM dynamically (e.g. budget entries) can re-render.

(function () {
  const STORAGE_KEY = "language";
  const DEFAULT_LANGUAGE = "en";

  const translations = {
    en: {
      // Document titles
      "page.title.app": "Budget Web App | JavaScript",
      "page.title.privacy": "Privacy Policy | Budget App",

      // App header
      "header.balance": "Balance",
      "header.income": "Income",
      "header.outcome": "Outcome",

      // Dashboard
      "dashboard.title": "Dashboard",
      "tabs.expenses": "Expenses",
      "tabs.income": "Income",
      "tabs.all": "All",

      // Actions
      "actions.clearAll": "Clear all",

      // Inputs
      "input.title.placeholder": "title",
      "input.amount.placeholder": "$0",

      // ARIA labels
      "aria.entryViews": "Entry views",
      "aria.appFooter": "Application footer",
      "aria.legalLinks": "Legal links",
      "aria.addExpense": "Add expense",
      "aria.addIncome": "Add income",
      "aria.clearAll": "Clear all entries",
      "aria.editEntry": "Edit {title}",
      "aria.deleteEntry": "Delete {title}",
      "aria.languageSwitcher": "Language switcher",

      // Footer
      "footer.copyright": "\u00A9 2026 Group 59 | CPT304",
      "footer.privacy": "Privacy Policy",
      "footer.cookieSettings": "Cookie Settings",

      // Cookie banner
      "cookie.title": "Your privacy choices",
      "cookie.description":
        "We use local storage to save your budget entries on this device. Accepting enables persistence between visits. Declining keeps the app usable, but your entries will not be saved after you close or refresh the page.",
      "cookie.decline": "Decline",
      "cookie.accept": "Accept",

      // Alert modal
      "alert.title": "Notice",
      "alert.ok": "OK",

      // Validation messages
      "validation.titleRequired": "Please enter a title.",
      "validation.titleTooLong": "Title must be {max} characters or fewer.",
      "validation.amountRequired": "Please enter an amount.",
      "validation.amountInvalid": "Amount must be a valid number.",
      "validation.amountNotPositive": "Amount must be greater than 0.",
      "validation.amountTooLarge": "Amount is too large.",

      // Language switcher labels
      "lang.en": "EN",
      "lang.zh": "\u4E2D\u6587",

      // Privacy page
      "privacy.back": "\u2190 Back to Budget App",
      "privacy.title": "Privacy Policy",
      "privacy.lastUpdated": "Last updated: May 6, 2026",
      "privacy.lead":
        "Budget App is a client-side budgeting tool. We do not operate a user account system or send your budget entries to a backend database. This policy explains what information is stored in your browser, how it is used, and what choices you have.",
      "privacy.s1.title": "1. Information we process",
      "privacy.s1.intro":
        "When you use the app, the following categories of information may be processed:",
      "privacy.s1.li1":
        "Budget entry data you type into the app, such as titles, income values, and expense values.",
      "privacy.s1.li2":
        "Your cookie and local storage preference, which records whether you accepted or declined storage persistence.",
      "privacy.s1.li3":
        "Basic technical data collected by your hosting provider, such as request logs needed to keep the site online and secure.",
      "privacy.s2.title": "2. How we use local storage",
      "privacy.s2.p1":
        "Budget App uses browser local storage to remember your entries on the same device. This allows the application to restore your data after you refresh the page or revisit the site later.",
      "privacy.s2.p2":
        "If you decline storage in the cookie banner, the app will continue to function for the current session, but entries will not be saved for future visits and any previously saved local data will be removed from your browser.",
      "privacy.s3.title": "3. Legal basis and purpose",
      "privacy.s3.p1":
        "We use browser storage to provide the budgeting features you request, remember your consent choice, and improve continuity between sessions. No advertising or third-party tracking cookies are set by the application itself.",
      "privacy.s4.title": "4. Data retention",
      "privacy.s4.p1":
        "Your budget entries remain in your browser until you delete them in the app, clear your browser storage, or decline storage persistence through the cookie settings. Consent preferences remain stored until you change them or clear browser storage.",
      "privacy.s5.title": "5. Sharing of information",
      "privacy.s5.p1":
        "We do not intentionally sell, rent, or share your budgeting data with third parties. Hosting providers may process limited technical logs to deliver the site and maintain operational security.",
      "privacy.s6.title": "6. Your choices",
      "privacy.s6.intro": "You can manage your privacy choices in the following ways:",
      "privacy.s6.li1":
        "Use the Cookie Settings button in the app footer to reopen the consent banner.",
      "privacy.s6.li2":
        "Decline storage if you do not want entries persisted between sessions.",
      "privacy.s6.li3":
        "Clear your browser cache or local storage to remove previously saved data.",
      "privacy.s7.title": "7. Contact",
      "privacy.s7.p1":
        "If you have questions about this policy or how the app handles data, please contact the project team responsible for Group 59 coursework delivery.",
    },
    zh: {
      "page.title.app": "\u9884\u7B97\u5E94\u7528 | JavaScript",
      "page.title.privacy": "\u9690\u79C1\u653F\u7B56 | \u9884\u7B97\u5E94\u7528",

      "header.balance": "\u7ED3\u4F59",
      "header.income": "\u6536\u5165",
      "header.outcome": "\u652F\u51FA",

      "dashboard.title": "\u63A7\u5236\u9762\u677F",
      "tabs.expenses": "\u652F\u51FA",
      "tabs.income": "\u6536\u5165",
      "tabs.all": "\u5168\u90E8",

      "actions.clearAll": "\u4E00\u952E\u5220\u9664",

      "input.title.placeholder": "\u6807\u9898",
      "input.amount.placeholder": "$0",

      "aria.entryViews": "\u6761\u76EE\u89C6\u56FE",
      "aria.appFooter": "\u5E94\u7528\u5E95\u680F",
      "aria.legalLinks": "\u6CD5\u5F8B\u94FE\u63A5",
      "aria.addExpense": "\u6DFB\u52A0\u652F\u51FA",
      "aria.addIncome": "\u6DFB\u52A0\u6536\u5165",
      "aria.clearAll": "\u4E00\u952E\u5220\u9664\u6240\u6709\u6761\u76EE",
      "aria.editEntry": "\u7F16\u8F91 {title}",
      "aria.deleteEntry": "\u5220\u9664 {title}",
      "aria.languageSwitcher": "\u8BED\u8A00\u5207\u6362",

      "footer.copyright": "\u00A9 2026 \u7B2C 59 \u7EC4 | CPT304",
      "footer.privacy": "\u9690\u79C1\u653F\u7B56",
      "footer.cookieSettings": "Cookie \u8BBE\u7F6E",

      "cookie.title": "\u60A8\u7684\u9690\u79C1\u9009\u62E9",
      "cookie.description":
        "\u6211\u4EEC\u4F7F\u7528\u6D4F\u89C8\u5668\u672C\u5730\u5B58\u50A8\u5728\u672C\u8BBE\u5907\u4E0A\u4FDD\u5B58\u60A8\u7684\u9884\u7B97\u6761\u76EE\u3002\u63A5\u53D7\u540E\u53EF\u5728\u591A\u6B21\u8BBF\u95EE\u4E4B\u95F4\u4FDD\u7559\u6570\u636E\u3002\u62D2\u7EDD\u540E\u5E94\u7528\u4ECD\u53EF\u4F7F\u7528\uFF0C\u4F46\u5728\u5173\u95ED\u6216\u5237\u65B0\u9875\u9762\u540E\u6761\u76EE\u4E0D\u4F1A\u88AB\u4FDD\u7559\u3002",
      "cookie.decline": "\u62D2\u7EDD",
      "cookie.accept": "\u63A5\u53D7",

      "alert.title": "\u63D0\u793A",
      "alert.ok": "\u786E\u5B9A",

      "validation.titleRequired": "\u8BF7\u8F93\u5165\u6807\u9898\u3002",
      "validation.titleTooLong": "\u6807\u9898\u4E0D\u5F97\u8D85\u8FC7 {max} \u4E2A\u5B57\u7B26\u3002",
      "validation.amountRequired": "\u8BF7\u8F93\u5165\u91D1\u989D\u3002",
      "validation.amountInvalid": "\u91D1\u989D\u5FC5\u987B\u662F\u6709\u6548\u6570\u5B57\u3002",
      "validation.amountNotPositive": "\u91D1\u989D\u5FC5\u987B\u5927\u4E8E 0\u3002",
      "validation.amountTooLarge": "\u91D1\u989D\u8FC7\u5927\u3002",

      "lang.en": "EN",
      "lang.zh": "\u4E2D\u6587",

      "privacy.back": "\u2190 \u8FD4\u56DE\u9884\u7B97\u5E94\u7528",
      "privacy.title": "\u9690\u79C1\u653F\u7B56",
      "privacy.lastUpdated": "\u6700\u540E\u66F4\u65B0\uFF1A2026 \u5E74 5 \u6708 6 \u65E5",
      "privacy.lead":
        "Budget App \u662F\u4E00\u4E2A\u5B8C\u5168\u8FD0\u884C\u5728\u6D4F\u89C8\u5668\u4E2D\u7684\u9884\u7B97\u5DE5\u5177\u3002\u6211\u4EEC\u4E0D\u63D0\u4F9B\u7528\u6237\u8D26\u6237\u7CFB\u7EDF\uFF0C\u4E5F\u4E0D\u4F1A\u5C06\u60A8\u7684\u9884\u7B97\u6761\u76EE\u53D1\u9001\u5230\u4EFB\u4F55\u540E\u7AEF\u6570\u636E\u5E93\u3002\u672C\u653F\u7B56\u8BF4\u660E\u54EA\u4E9B\u4FE1\u606F\u4F1A\u5B58\u50A8\u5728\u60A8\u7684\u6D4F\u89C8\u5668\u4E2D\u3001\u5982\u4F55\u88AB\u4F7F\u7528\uFF0C\u4EE5\u53CA\u60A8\u6709\u54EA\u4E9B\u9009\u62E9\u3002",
      "privacy.s1.title": "1. \u6211\u4EEC\u5904\u7406\u7684\u4FE1\u606F",
      "privacy.s1.intro": "\u5728\u60A8\u4F7F\u7528\u672C\u5E94\u7528\u65F6\uFF0C\u53EF\u80FD\u4F1A\u5904\u7406\u4EE5\u4E0B\u7C7B\u578B\u7684\u4FE1\u606F\uFF1A",
      "privacy.s1.li1":
        "\u60A8\u5728\u5E94\u7528\u4E2D\u8F93\u5165\u7684\u9884\u7B97\u6761\u76EE\u6570\u636E\uFF0C\u4F8B\u5982\u6807\u9898\u3001\u6536\u5165\u91D1\u989D\u548C\u652F\u51FA\u91D1\u989D\u3002",
      "privacy.s1.li2":
        "\u60A8\u7684 Cookie \u4E0E\u672C\u5730\u5B58\u50A8\u504F\u597D\uFF0C\u7528\u4E8E\u8BB0\u5F55\u60A8\u662F\u63A5\u53D7\u8FD8\u662F\u62D2\u7EDD\u6301\u4E45\u5316\u5B58\u50A8\u3002",
      "privacy.s1.li3":
        "\u7531\u6258\u7BA1\u670D\u52A1\u63D0\u4F9B\u5546\u6536\u96C6\u7684\u57FA\u672C\u6280\u672F\u6570\u636E\uFF0C\u4F8B\u5982\u4FDD\u6301\u7AD9\u70B9\u5728\u7EBF\u548C\u5B89\u5168\u6240\u9700\u7684\u8BF7\u6C42\u65E5\u5FD7\u3002",
      "privacy.s2.title": "2. \u6211\u4EEC\u5982\u4F55\u4F7F\u7528\u672C\u5730\u5B58\u50A8",
      "privacy.s2.p1":
        "Budget App \u4F7F\u7528\u6D4F\u89C8\u5668\u672C\u5730\u5B58\u50A8\u5728\u540C\u4E00\u8BBE\u5907\u4E0A\u8BB0\u4F4F\u60A8\u7684\u6761\u76EE\u3002\u8FD9\u6837\u5728\u60A8\u5237\u65B0\u9875\u9762\u6216\u7A0D\u540E\u518D\u6B21\u8BBF\u95EE\u65F6\uFF0C\u5E94\u7528\u53EF\u4EE5\u6062\u590D\u60A8\u7684\u6570\u636E\u3002",
      "privacy.s2.p2":
        "\u5982\u679C\u60A8\u5728 Cookie \u6A2A\u5E45\u4E2D\u62D2\u7EDD\u5B58\u50A8\uFF0C\u5E94\u7528\u5728\u672C\u6B21\u4F1A\u8BDD\u5185\u4ECD\u53EF\u6B63\u5E38\u4F7F\u7528\uFF0C\u4F46\u6761\u76EE\u4E0D\u4F1A\u4E3A\u4E4B\u540E\u7684\u8BBF\u95EE\u4FDD\u5B58\uFF0C\u5E76\u4E14\u6B64\u524D\u5DF2\u4FDD\u5B58\u7684\u672C\u5730\u6570\u636E\u5C06\u4ECE\u60A8\u7684\u6D4F\u89C8\u5668\u4E2D\u79FB\u9664\u3002",
      "privacy.s3.title": "3. \u6CD5\u5F8B\u4F9D\u636E\u4E0E\u76EE\u7684",
      "privacy.s3.p1":
        "\u6211\u4EEC\u4F7F\u7528\u6D4F\u89C8\u5668\u5B58\u50A8\u6765\u63D0\u4F9B\u60A8\u8BF7\u6C42\u7684\u9884\u7B97\u529F\u80FD\u3001\u8BB0\u4F4F\u60A8\u7684\u540C\u610F\u9009\u62E9\u5E76\u6539\u5584\u4F1A\u8BDD\u95F4\u7684\u8FDE\u7EED\u6027\u3002\u5E94\u7528\u672C\u8EAB\u4E0D\u4F1A\u8BBE\u7F6E\u4EFB\u4F55\u5E7F\u544A\u6216\u7B2C\u4E09\u65B9\u8FFD\u8E2A Cookie\u3002",
      "privacy.s4.title": "4. \u6570\u636E\u4FDD\u7559",
      "privacy.s4.p1":
        "\u60A8\u7684\u9884\u7B97\u6761\u76EE\u4F1A\u4FDD\u7559\u5728\u60A8\u7684\u6D4F\u89C8\u5668\u4E2D\uFF0C\u76F4\u5230\u60A8\u5728\u5E94\u7528\u4E2D\u5220\u9664\u3001\u6E05\u7A7A\u6D4F\u89C8\u5668\u5B58\u50A8\u6216\u5728 Cookie \u8BBE\u7F6E\u4E2D\u62D2\u7EDD\u6301\u4E45\u5316\u5B58\u50A8\u4E3A\u6B62\u3002\u540C\u610F\u504F\u597D\u5C06\u4E00\u76F4\u4FDD\u7559\uFF0C\u76F4\u5230\u60A8\u66F4\u6539\u6216\u6E05\u7A7A\u6D4F\u89C8\u5668\u5B58\u50A8\u3002",
      "privacy.s5.title": "5. \u4FE1\u606F\u7684\u5171\u4EAB",
      "privacy.s5.p1":
        "\u6211\u4EEC\u4E0D\u4F1A\u6709\u610F\u51FA\u552E\u3001\u51FA\u79DF\u6216\u4E0E\u7B2C\u4E09\u65B9\u5206\u4EAB\u60A8\u7684\u9884\u7B97\u6570\u636E\u3002\u6258\u7BA1\u670D\u52A1\u63D0\u4F9B\u5546\u53EF\u80FD\u4F1A\u5904\u7406\u6709\u9650\u7684\u6280\u672F\u65E5\u5FD7\uFF0C\u4EE5\u63D0\u4F9B\u7AD9\u70B9\u670D\u52A1\u5E76\u7EF4\u62A4\u8FD0\u884C\u5B89\u5168\u3002",
      "privacy.s6.title": "6. \u60A8\u7684\u9009\u62E9",
      "privacy.s6.intro": "\u60A8\u53EF\u4EE5\u901A\u8FC7\u4EE5\u4E0B\u65B9\u5F0F\u7BA1\u7406\u60A8\u7684\u9690\u79C1\u9009\u62E9\uFF1A",
      "privacy.s6.li1":
        "\u4F7F\u7528\u5E94\u7528\u5E95\u680F\u4E2D\u7684\u201CCookie \u8BBE\u7F6E\u201D\u6309\u94AE\u91CD\u65B0\u6253\u5F00\u540C\u610F\u6A2A\u5E45\u3002",
      "privacy.s6.li2":
        "\u5982\u679C\u60A8\u4E0D\u5E0C\u671B\u5728\u4E0D\u540C\u4F1A\u8BDD\u95F4\u4FDD\u7559\u6761\u76EE\uFF0C\u8BF7\u62D2\u7EDD\u5B58\u50A8\u3002",
      "privacy.s6.li3":
        "\u6E05\u7A7A\u6D4F\u89C8\u5668\u7F13\u5B58\u6216\u672C\u5730\u5B58\u50A8\u4EE5\u79FB\u9664\u5148\u524D\u4FDD\u5B58\u7684\u6570\u636E\u3002",
      "privacy.s7.title": "7. \u8054\u7CFB\u65B9\u5F0F",
      "privacy.s7.p1":
        "\u5982\u679C\u60A8\u5BF9\u672C\u653F\u7B56\u6216\u5E94\u7528\u7684\u6570\u636E\u5904\u7406\u65B9\u5F0F\u6709\u4EFB\u4F55\u7591\u95EE\uFF0C\u8BF7\u8054\u7CFB\u8D1F\u8D23 Group 59 \u8BFE\u7A0B\u4F5C\u4E1A\u4EA4\u4ED8\u7684\u9879\u76EE\u56E2\u961F\u3002",
    },
  };

  function readStoredLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && translations[stored]) return stored;
    } catch (e) {
      // localStorage may be blocked (private mode, no consent yet) — fall through.
    }
    return null;
  }

  // First-time visitors always see English; switching to another language is
  // an explicit user choice that gets persisted via setLanguage(). We
  // intentionally ignore navigator.language so the default UX is consistent
  // across browsers regardless of the OS / browser locale.
  let currentLanguage = readStoredLanguage() || DEFAULT_LANGUAGE;

  function format(template, params) {
    if (!params || typeof template !== "string") return template;
    return template.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(params, name)
        ? String(params[name])
        : match;
    });
  }

  // Returns the translated string for `key` in the active language, falling
  // back to the default dictionary, then to the key itself, so a missing
  // entry never blanks out the UI.
  function t(key, params) {
    const dict = translations[currentLanguage] || translations[DEFAULT_LANGUAGE];
    let value = dict[key];
    if (value === undefined && translations[DEFAULT_LANGUAGE]) {
      value = translations[DEFAULT_LANGUAGE][key];
    }
    if (value === undefined) value = key;
    return format(value, params);
  }

  function applyTextNodes(scope) {
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
  }

  // Attribute spec format: "attr1:key1, attr2:key2".
  // Trimming each side defends against stray whitespace from prettier-formatted
  // markup.
  function applyAttributes(scope) {
    scope.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      const spec = el.getAttribute("data-i18n-attr");
      if (!spec) return;
      spec.split(",").forEach(function (pair) {
        const idx = pair.indexOf(":");
        if (idx === -1) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  function applyDocumentTitle() {
    const titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey);
  }

  function applyTranslations(root) {
    const scope = root || document;
    applyTextNodes(scope);
    applyAttributes(scope);
    applyDocumentTitle();
    document.documentElement.setAttribute("lang", currentLanguage === "zh" ? "zh-CN" : "en");
  }

  function refreshSwitcherUI() {
    document.querySelectorAll(".lang-switcher").forEach(function (group) {
      group.setAttribute("aria-label", t("aria.languageSwitcher"));
      group.querySelectorAll(".lang-option").forEach(function (btn) {
        const lang = btn.getAttribute("data-lang");
        const isActive = lang === currentLanguage;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
        btn.tabIndex = 0;
      });
    });
  }

  function bindSwitcher() {
    document.querySelectorAll(".lang-option").forEach(function (btn) {
      if (btn.dataset.i18nBound === "1") return;
      btn.dataset.i18nBound = "1";
      btn.addEventListener("click", function () {
        const lang = btn.getAttribute("data-lang");
        if (lang) setLanguage(lang);
      });
    });
  }

  function setLanguage(lang) {
    if (!translations[lang] || lang === currentLanguage) {
      // Even when unchanged, keep the switcher UI in sync (e.g. on first paint).
      refreshSwitcherUI();
      return;
    }
    currentLanguage = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Persisting is best-effort; the language still applies for this session.
    }
    applyTranslations();
    refreshSwitcherUI();
    document.dispatchEvent(
      new CustomEvent("languagechange", { detail: { language: lang } })
    );
  }

  function getCurrentLanguage() {
    return currentLanguage;
  }

  function init() {
    applyTranslations();
    bindSwitcher();
    refreshSwitcherUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.i18n = {
    t: t,
    setLanguage: setLanguage,
    getCurrentLanguage: getCurrentLanguage,
    applyTranslations: applyTranslations,
  };
})();
