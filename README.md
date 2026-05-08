# Budget Web App — CPT304 CW1 (Group 59)

[![CI](https://github.com/61Ss/CPT304-CW1-Budget-App-Group59/actions/workflows/test.yml/badge.svg)](https://github.com/61Ss/CPT304-CW1-Budget-App-Group59/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/61Ss/CPT304-CW1-Budget-App-Group59/branch/master/graph/badge.svg)](https://codecov.io/gh/61Ss/CPT304-CW1-Budget-App-Group59)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A lightweight, framework-free personal budget tracker built with **vanilla HTML / CSS / JavaScript**.
The app lets users record income and expenses, see a live balance and donut chart, and persist
their data locally — with first-class internationalisation, accessibility and privacy controls.

This repository is the coursework submission for **CPT304 — Software Engineering II** at XJTLU
(Group 59).

### Live links

- **App (GitHub Pages):** <https://61ss.github.io/CPT304-CW1-Budget-App-Group59/>
- **Privacy policy:** <https://61ss.github.io/CPT304-CW1-Budget-App-Group59/privacy.html>
- **Coverage dashboard (Codecov):** <https://codecov.io/gh/61Ss/CPT304-CW1-Budget-App-Group59>
- **CI runs (GitHub Actions):** <https://github.com/61Ss/CPT304-CW1-Budget-App-Group59/actions/workflows/test.yml>

---

## Table of contents

1. [Features](#features)
2. [Screenshots / demo](#screenshots--demo)
3. [Project structure](#project-structure)
4. [Getting started](#getting-started)
5. [Usage](#usage)
6. [Internationalisation (i18n)](#internationalisation-i18n)
7. [Accessibility](#accessibility)
8. [Privacy & local storage](#privacy--local-storage)
9. [Testing & coverage](#testing--coverage)
10. [Continuous integration](#continuous-integration)
11. [Tech stack](#tech-stack)
12. [Browser support](#browser-support)
13. [License](#license)

---

## Features

- **Income & expense tracking** — add, edit and delete entries; each entry is categorised so totals and lists stay in sync.
- **Live budget calculation** — balance, total income and total outcome are recomputed on every change, with a sign-aware balance display.
- **Donut chart visualisation** — a Canvas-based mini chart shows the income / outcome ratio at a glance (`chart.js`).
- **Tabbed dashboard** — switch between *Expenses*, *Income* and *All* views with mouse, touch or keyboard.
- **Robust input validation** — non-empty titles (≤ 60 chars), positive numeric amounts (≤ 1,000,000,000), with localised error messages shown in an accessible modal.
- **XSS-safe rendering** — all user-supplied text is inserted with `textContent` / DOM APIs; no `innerHTML` interpolation of user input.
- **Internationalisation** — English and Simplified Chinese (中文), runtime language switch, persisted in `localStorage`.
- **Privacy by default** — explicit cookie / storage-consent banner; no data leaves the device.
- **Versioned consent** — bumping the consent version (`v2`, …) automatically re-prompts users when the policy changes.
- **Responsive UI** — works on desktop and mobile breakpoints out of the box.
- **Zero runtime dependencies** — ships as static files; no build step required to run the app.

## Screenshots / demo

The app is deployed via **GitHub Pages** straight from the `master` branch
(Settings → Pages → *Deploy from branch*):

| Page              | URL                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Budget app        | <https://61ss.github.io/CPT304-CW1-Budget-App-Group59/>                                        |
| Privacy policy    | <https://61ss.github.io/CPT304-CW1-Budget-App-Group59/privacy.html>                            |

## Project structure

```
.
├── index.html              # Main app shell (tabs, inputs, lists, footer, modal)
├── privacy.html            # Privacy policy page (shares header + i18n)
├── style.css               # All visual styling (responsive, theming, modals)
├── budget.js               # App logic: state, validation, persistence, UI updates
├── chart.js                # Canvas donut chart for the income/outcome ratio
├── i18n.js                 # Lightweight i18n runtime (data-attribute driven)
├── icon/                   # Inline-referenced UI icons (plus, edit, delete, …)
├── font/                   # Bundled font assets
├── tests/
│   ├── budget.test.js      # Unit tests for budget.js (validation, CRUD, storage, a11y)
│   ├── chart.test.js       # Unit tests for chart.js (canvas drawing logic)
│   ├── i18n.test.js        # Unit tests for the i18n runtime
│   ├── jest.setup.js       # jsdom + globals bootstrap
│   └── loader.js           # Loads source modules into the jsdom window
├── .github/workflows/
│   └── test.yml            # CI: install → coverage → upload to Codecov
├── codecov.yml             # Codecov gates (project + patch ≥ 80 %)
├── package.json            # Jest config, scripts, dev dependencies
└── README.md
```

## Getting started

### Prerequisites

- **Node.js 20+** and **npm** (only required for running the test suite — the app itself has no build step).
- A modern evergreen browser (Chrome / Edge / Firefox / Safari).

### Install

```bash
git clone https://github.com/61Ss/CPT304-CW1-Budget-App-Group59.git
cd CPT304-CW1-Budget-App-Group59
npm install        # installs Jest + jsdom for the tests
```

### Run the app locally

The app is fully static. Pick whichever option you prefer:

```bash
# Option A — open the file directly
open index.html            # macOS
xdg-open index.html        # Linux
start index.html           # Windows

# Option B — serve over HTTP (recommended; avoids file:// quirks for localStorage)
npx http-server . -p 5500
# then visit http://localhost:5500/
```

> Tip: the HTML files reference `?v=…` query strings to bust the browser cache during
> development. Bump the suffix in `index.html` / `privacy.html` whenever you ship a CSS / JS change.

## Usage

1. On first visit you'll see the **cookie / storage-consent banner**. Choose *Accept* to enable persistence between visits, or *Decline* to use the app for the current session only.
2. Use the **+** button on the *Expenses* or *Income* tab to add an entry — provide a title and a positive amount.
3. The header shows the running **balance**, total **income** and total **outcome**, plus a donut chart of the income / outcome ratio.
4. From the *All* tab, **edit** an entry (✎) to load it back into the input row, or **delete** it (✕) to remove it.
5. Toggle the language at any time using the **EN / 中文** switcher in the top-right.
6. Re-open the consent dialog at any time via the **Cookie Settings** link in the footer.

## Internationalisation (i18n)

The app ships with a custom 350-line runtime in `i18n.js`. There is **no framework dependency**.

- Translation strings live in a single `translations` object keyed by locale (`en`, `zh`).
- Markup binds to keys via three data attributes:
  - `data-i18n="key"` — sets `textContent`.
  - `data-i18n-attr="placeholder:key,aria-label:another.key"` — sets one or more attributes.
  - `data-i18n-title="key"` — sets `document.title` (placed on `<html>`).
- The chosen locale is persisted in `localStorage`; first-time visitors fall back to `navigator.language`.
- A `languagechange` `CustomEvent` is dispatched on `document` so dynamic UI (e.g. budget rows) can re-render localised ARIA labels.

### Adding or editing translations

1. Open `i18n.js`.
2. Add or update the key/value pair in **every** dictionary (`en`, `zh`) so they stay in sync.
3. In markup, reference the key with one of the three data attributes above.
4. To add a third language, register a new dictionary and add a `<button class="lang-option" data-lang="…">` to the language switcher in `index.html` and `privacy.html` — the runtime picks it up automatically.

## Accessibility

Accessibility is a first-class feature, not an afterthought:

- Tablist semantics on the dashboard (`role="tablist" / "tab" / "tabpanel"`, `aria-selected`, `aria-controls`, roving `tabindex`).
- **Arrow-key navigation** between tabs (← / →) with focus wrap-around.
- The validation alert is a true modal dialog (`role="dialog"`, `aria-modal="true"`, focus trap, `Esc` to close, focus return to the offending input).
- Localised `aria-label`s on add / edit / delete buttons (e.g. `Delete {title}`).
- Cookie banner uses `aria-labelledby` / `aria-describedby`, returns focus to the trigger on close.
- Visible focus styles, sufficient colour contrast, and `prefers-reduced-motion` friendly transitions.

## Privacy & local storage

- The only persisted data are **budget entries**, **storage consent** and **language preference**, all in `localStorage` on the user's own device.
- Persistence is gated behind explicit consent (`storage_consent = accepted | declined`).
- Consent is **versioned** (`STORAGE_CONSENT_VERSION = "v2"`); bumping the version invalidates old consent and re-prompts the user.
- Declining consent clears any previously stored entries and disables further writes for the session.
- Loaded entries are **defensively validated** — malformed JSON or unexpected shapes are dropped, never rendered.

See `privacy.html` (also fully localised) for the user-facing policy.

## Testing & coverage

The project ships with a **Jest + jsdom** test suite covering all three JavaScript modules.

| Module      | Focus                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| `budget.js` | Validation rules, add/edit/delete flows, totals, storage consent, modal a11y, XSS-safe rendering |
| `chart.js`  | Canvas drawing primitives and ratio handling                                   |
| `i18n.js`   | Locale resolution, attribute binding, `languagechange` event, persistence      |

### Run the tests locally

```bash
npm install
npm test                 # full Jest suite
npm run test:coverage    # generates ./coverage (text, html, lcov)
```

Open `coverage/lcov-report/index.html` in your browser for a local line-by-line report.

### Online coverage dashboard

The latest coverage from `master` (and every PR) is published to Codecov:

- **Project dashboard:** <https://codecov.io/gh/61Ss/CPT304-CW1-Budget-App-Group59>
- **Sunburst graph (per-file coverage at a glance):** <https://codecov.io/gh/61Ss/CPT304-CW1-Budget-App-Group59/branch/master/graphs/sunburst.svg>
- **File tree view:** <https://app.codecov.io/gh/61Ss/CPT304-CW1-Budget-App-Group59/tree/master>

### Coverage gates

`package.json` enforces a hard **80 %** `coverageThreshold` for **statements, branches, functions and lines**.
Falling below the threshold fails both the local test run and the CI build.

`codecov.yml` mirrors the same 80 % gate at both the **project** and **patch** level — new or changed code must also be tested.

## Continuous integration

GitHub Actions (`.github/workflows/test.yml`) runs on every push and pull request:

1. Checkout & set up Node 20 (with npm cache).
2. `npm ci`.
3. `npm run test:coverage`.
4. Upload `coverage/lcov.info` to **Codecov** (no token required for public repos).
5. Upload the HTML coverage report as a downloadable workflow artifact (`coverage-html`, 14-day retention).

## Tech stack

| Layer            | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Markup           | HTML5 (semantic, ARIA-rich)                                              |
| Styling          | CSS3 (custom properties, flex / grid, responsive, no preprocessor)       |
| Logic            | Vanilla JavaScript (ES2017+, no framework, no bundler)                   |
| Charts           | HTML5 `<canvas>` 2D context                                              |
| Persistence      | Browser `localStorage` (consent-gated, schema-validated)                 |
| i18n             | Custom 350-line runtime (`i18n.js`), data-attribute driven              |
| Testing          | Jest 29 + `jest-environment-jsdom`                                       |
| Coverage gating  | Jest `coverageThreshold` + Codecov status checks (≥ 80 % project + patch) |
| CI               | GitHub Actions (Node 20)                                                  |

## Browser support

Tested against the latest two stable releases of:

- Google Chrome / Microsoft Edge (Chromium)
- Mozilla Firefox
- Apple Safari (desktop & iOS)

## License

Released under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify and distribute this project for personal and commercial purposes, subject to the terms of the licence.

---

Happy budgeting!
