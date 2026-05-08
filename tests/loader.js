// Shared helper that resets the jsdom DOM to a fresh copy of the production
// markup, clears storage, then re-loads the three application scripts so each
// test starts from a known baseline.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "index.html");

let cachedBody = null;

function getFreshBody() {
  if (cachedBody !== null) return cachedBody;
  const html = fs.readFileSync(HTML_PATH, "utf-8");
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error("Could not extract <body> from index.html");
  // Strip the <script> tags. Jest will require() the source files directly so
  // jsdom should not try to fetch them (which it cannot anyway in tests).
  cachedBody = match[1].replace(/<script[\s\S]*?<\/script>/gi, "");
  return cachedBody;
}

function loadApp() {
  document.head.innerHTML = "";
  document.body.innerHTML = getFreshBody();
  document.documentElement.setAttribute("lang", "en");
  document.documentElement.setAttribute("data-i18n-title", "page.title.app");

  jest.resetModules();
  delete window.i18n;
  delete window.updateChart;

  require("../i18n.js");
  require("../chart.js");
  require("../budget.js");
}

module.exports = { loadApp, getFreshBody };
