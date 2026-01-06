(function () {
  const STORAGE_KEY = "lumina_wealth_multi_v3";
  const LEGACY_KEYS = ["lumina_wealth_multi_v2", "lumina_wealth_multi_v1", "lumina_wealth_v2", "lumina_wealth_v1"];

  const $ = (s) => document.querySelector(s);

  // Views
  const welcomeView = $("#welcomeView");
  const dashboardView = $("#dashboardView");

  // Welcome
  const welcomeForm = $("#welcomeForm");
  const userNameInput = $("#userNameInput");
  const monthlyBudgetInput = $("#monthlyBudgetInput");

  // Sidebar mobile
  const sidebarToggle = $("#sidebarToggle");
  const sidebarBackdrop = $("#sidebarBackdrop");

  // Account
  const accountSelect = $("#accountSelect");
  const manageAccountsBtn = $("#manageAccountsBtn");
  const editMonthBtn = $("#editMonthBtn");

  // Identity
  const helloName = $("#helloName");
  const avatarInitials = $("#avatarInitials");

  // Theme
  const themeColorInput = $("#themeColorInput");
  const resetThemeBtn = $("#resetThemeBtn");
  const presetSwatches = Array.from(document.querySelectorAll(".swatch"));

  // Scope
  const scopeToggle = $("#scopeToggle");
  const scopeButtons = scopeToggle ? Array.from(scopeToggle.querySelectorAll(".seg")) : [];

  // Income
  const incomeLabel = $("#incomeLabel");
  const incomeInput = $("#incomeInput");

  // Budget UI
  const budgetValue = $("#budgetValue");
  const spentValue = $("#spentValue");
  const remainingValue = $("#remainingValue");
  const budgetChip = $("#budgetChip");
  const progressBar = $("#progressBar");
  const progressPct = $("#progressPct");
  const activeMonthLabel = $("#activeMonthLabel");

  const trackedRow = $("#trackedRow");
  const trackedValue = $("#trackedValue");

  const cumRow = $("#cumRow");
  const cumLabel = $("#cumLabel");
  const cumValue = $("#cumValue");

  // Calendar
  const calendarTitle = $("#calendarTitle");
  const calNav = $("#calNav");
  const calendarWrap = $("#calendarWrap");
  const monthListWrap = $("#monthListWrap");
  const monthList = $("#monthList");

  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  const calToday = $("#calToday");
  const calMonthLabel = $("#calMonthLabel");
  const calGrid = $("#calGrid");
  const calSelectedLabel = $("#calSelectedLabel");
  const clearSelectionBtn = $("#clearSelectionBtn");

  // Suggestions
  const suggestionsList = $("#suggestionsList");
  const refreshSuggestionsBtn = $("#refreshSuggestionsBtn");

  // Quote
  const quoteText = $("#quoteText");
  const quoteAuthor = $("#quoteAuthor");
  const newQuoteBtn = $("#newQuoteBtn");

  // Expenses
  const expenseForm = $("#expenseForm");
  const categoryInput = $("#categoryInput");
  const categoryList = $("#categoryList");
  const amountInput = $("#amountInput");
  const dateInput = $("#dateInput");
  const expenseTbody = $("#expenseTbody");
  const monthTotal = $("#monthTotal");
  const expenseCountChip = $("#expenseCountChip");
  const viewChip = $("#viewChip");
  const totalLabel = $("#totalLabel");
  const totalHint = $("#totalHint");

  // Charts
  const trendCanvas = $("#trendChart");
  const categoryCanvas = $("#categoryChart");
  const chartMonthChip = $("#chartMonthChip");
  const trendTitle = $("#trendTitle");
  const categoryTitle = $("#categoryTitle");
  const chartModeToggle = $("#chartModeToggle");
  const chartModeButtons = chartModeToggle ? Array.from(chartModeToggle.querySelectorAll(".seg")) : [];
  const downloadPdfBtn = $("#downloadPdfBtn");
  let trendChart = null;
  let categoryChart = null;

  // Accounts modal
  const accountsModal = $("#accountsModal");
  const accountsList = $("#accountsList");
  const addAccountForm = $("#addAccountForm");
  const newAccountName = $("#newAccountName");
  const newAccountBudget = $("#newAccountBudget");

  // Month modal
  const monthModal = $("#monthModal");
  const monthForm = $("#monthForm");
  const editMonthLabel = $("#editMonthLabel");
  const monthAccountName = $("#monthAccountName");
  const monthBudgetInput = $("#monthBudgetInput");
  const monthIncomeInput = $("#monthIncomeInput");

  // Reset
  const resetBtn = $("#resetBtn");

  // Toast
  const toast = $("#toast");

  // ---------- constants ----------
  const currencyFmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
  const DEFAULT_THEME_HEX = "#7c5cff";
  let THEME = { a: { h: 255, s: 100, l: 68 }, b: { h: 165, s: 100, l: 65 }, hex: DEFAULT_THEME_HEX };

  const fallbackQuotes = [
    { content: "Small hinges swing big doors.", author: "Proverb" },
    { content: "Discipline is kindness to your future self.", author: "Anonymous" },
    { content: "Progress loves consistency more than intensity.", author: "Anonymous" },
    { content: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  ];

  // ---------- helpers ----------
  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  function getMonthKey(dateStr) { return (dateStr || todayISO()).slice(0, 7); }
  function monthKeyToDate(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  function formatMonthLabel(monthKey) {
    const d = monthKeyToDate(monthKey);
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
  }
  function formatDateLabel(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(dt);
  }
  function daysInMonthByKey(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }
  function dateForDayIndex(monthKey, dayIndex1Based) {
    return `${monthKey}-${String(dayIndex1Based).padStart(2, "0")}`;
  }
  function uid(prefix = "id") { return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`; }
  function initials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "LW";
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function sumExpenses(expenses) { return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0); }
  function monthExpenses(acc, monthKey) { return (acc.expenses || []).filter((e) => getMonthKey(e.date) === monthKey); }
  function dayExpenses(acc, dateStr) { return (acc.expenses || []).filter((e) => e.date === dateStr); }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function openSidebarMobile() { document.body.classList.add("sidebar-open"); }
  function closeSidebarMobile() { document.body.classList.remove("sidebar-open"); }

  // ---------- theme ----------
  function hexToRgb(hex) {
    const h = (hex || "").replace("#", "").trim();
    if (h.length !== 6) return null;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function hsla(c, a) { return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})`; }

  function applyThemeHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const a = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const b = {
      h: (a.h + 140) % 360,
      s: clamp(a.s, 55, 100),
      l: clamp(a.l + 6, 45, 75),
    };
    THEME = { a, b, hex };

    const root = document.documentElement;
    root.style.setProperty("--a-h", a.h);
    root.style.setProperty("--a-s", `${a.s}%`);
    root.style.setProperty("--a-l", `${a.l}%`);
    root.style.setProperty("--b-h", b.h);
    root.style.setProperty("--b-s", `${b.s}%`);
    root.style.setProperty("--b-l", `${b.l}%`);
  }

  // ---------- storage ----------
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }
  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function defaultAccount(name, startingBudget, forMonthKey) {
    const monthKey = forMonthKey || getMonthKey(todayISO());
    return {
      id: uid("acc"),
      profile: { name: name || "Account" },
      financials: { [monthKey]: { budget: Number(startingBudget) || 0, income: 0 } },
      expenses: [],
      ui: {
        scope: "month",               // "month" | "all"
        calendarMonth: monthKey,
        selectedDate: null,
        chartMode: "daily"            // "daily" | "cumulative"
      }
    };
  }

  function defaultStore(name, startingBudget) {
    const acc = defaultAccount(name || "My Account", startingBudget || 0, getMonthKey(todayISO()));
    return {
      version: 3,
      settings: { themeHex: DEFAULT_THEME_HEX },
      activeAccountId: acc.id,
      accounts: { [acc.id]: acc }
    };
  }

  function ensureStoreIntegrity(store) {
    if (!store || !store.accounts || !Object.keys(store.accounts).length) return defaultStore("My Account", 0);

    store.version = 3;
    store.settings = store.settings || { themeHex: DEFAULT_THEME_HEX };
    if (!store.settings.themeHex) store.settings.themeHex = DEFAULT_THEME_HEX;

    if (!store.activeAccountId || !store.accounts[store.activeAccountId]) {
      store.activeAccountId = Object.keys(store.accounts)[0];
    }

    for (const id of Object.keys(store.accounts)) {
      const a = store.accounts[id];
      a.id = a.id || id;
      a.profile = a.profile || { name: "Account" };
      a.expenses = Array.isArray(a.expenses) ? a.expenses : [];

      a.financials = a.financials || {};
      a.ui = a.ui || {};
      if (!a.ui.scope) a.ui.scope = "month";
      if (!a.ui.calendarMonth) a.ui.calendarMonth = getMonthKey(todayISO());
      if (!("selectedDate" in a.ui)) a.ui.selectedDate = null;
      if (!a.ui.chartMode) a.ui.chartMode = "daily";

      // Migration from old fields if present
      if ("monthlyBudget" in a.profile || "monthlyIncome" in a.profile) {
        const mk = a.ui.calendarMonth || getMonthKey(todayISO());
        a.financials[mk] = a.financials[mk] || { budget: 0, income: 0 };
        if (Number.isFinite(Number(a.profile.monthlyBudget))) a.financials[mk].budget = Number(a.profile.monthlyBudget) || 0;
        if (Number.isFinite(Number(a.profile.monthlyIncome))) a.financials[mk].income = Number(a.profile.monthlyIncome) || 0;
        delete a.profile.monthlyBudget;
        delete a.profile.monthlyIncome;
      }
    }
    return store;
  }

  function tryMigrateLegacy() {
    if (localStorage.getItem(STORAGE_KEY)) return null;
    for (const k of LEGACY_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const legacy = JSON.parse(raw);
        const migrated = ensureStoreIntegrity({ ...legacy, version: 3 });
        saveStore(migrated);
        return migrated;
      } catch { /* ignore */ }
    }
    return null;
  }

  function getActiveAccount(store) {
    return store?.accounts?.[store.activeAccountId] || null;
  }

  function getMonthFinance(acc, monthKey) {
    const f = acc.financials?.[monthKey];
    return {
      budget: Number(f?.budget) || 0,
      income: Number(f?.income) || 0
    };
  }

  function setMonthFinance(acc, monthKey, budget, income) {
    acc.financials = acc.financials || {};
    acc.financials[monthKey] = {
      budget: Number(budget) || 0,
      income: Number(income) || 0
    };
  }

  function getAllMonthKeys(acc) {
    const set = new Set();

    for (const e of (acc.expenses || [])) set.add(getMonthKey(e.date));
    for (const mk of Object.keys(acc.financials || {})) set.add(mk);

    const arr = Array.from(set);
    arr.sort((a,b) => a.localeCompare(b)); // ascending
    return arr;
  }

  function getMonthlySummary(acc) {
    const months = getAllMonthKeys(acc);
    return months.map((mk) => {
      const exp = monthExpenses(acc, mk);
      const spent = sumExpenses(exp);
      const fin = getMonthFinance(acc, mk);
      const budget = fin.budget;
      const remaining = budget > 0 ? (budget - spent) : 0;
      return { monthKey: mk, spent, budget, remaining };
    });
  }

  // ---------- quotes ----------
  async function fetchQuote() {
    const endpoint = "https://zenquotes.io/api/random";
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error("Quote fetch failed");
      const data = await res.json();
      const q = data?.[0]?.q;
      const a = data?.[0]?.a;
      if (!q) throw new Error("Invalid quote payload");
      return { content: q, author: a ? `— ${a}` : "" };
    } catch {
      const pick = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      return { content: pick.content, author: pick.author ? `— ${pick.author}` : "" };
    }
  }

  async function renderQuote() {
    quoteText.textContent = "Loading a quote…";
    quoteAuthor.textContent = "";
    const q = await fetchQuote();
    quoteText.textContent = q.content;
    quoteAuthor.textContent = q.author || "";

    if (window.gsap) {
      gsap.fromTo([quoteText, quoteAuthor],
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.06 }
      );
    }
  }

  // ---------- datalist ----------
  function renderCategoryDatalist(acc){
    if (!categoryList) return;

    const defaults = [
      "Groceries","Food","Transport","Fuel","Rent","Housing","Utilities",
      "Health","Education","Entertainment","Shopping","Bills","Other"
    ];

    const set = new Set(defaults);
    for (const e of (acc.expenses || [])) {
      const c = String(e.category || "").trim();
      if (c) set.add(c);
    }

    const items = Array.from(set).sort((a,b)=>a.localeCompare(b));
    categoryList.innerHTML = items.map(v => `<option value="${escapeHtml(v)}"></option>`).join("");
  }

  // ---------- budget chip ----------
  function setChipByRemaining(remaining, budget) {
    if (budget <= 0) {
      budgetChip.textContent = "Set budget";
      budgetChip.style.borderColor = "rgba(255,255,255,0.16)";
      return;
    }
    const pctLeft = (remaining / budget) * 100;
    if (pctLeft >= 55) {
      budgetChip.textContent = "Comfortable";
      budgetChip.style.borderColor = "rgba(92,255,179,0.35)";
    } else if (pctLeft >= 20) {
      budgetChip.textContent = "Watch it";
      budgetChip.style.borderColor = "rgba(255,210,102,0.35)";
    } else {
      budgetChip.textContent = "Critical";
      budgetChip.style.borderColor = "rgba(255,110,110,0.35)";
    }
  }

  // ---------- calendar ----------
  function addMonths(monthKey, delta) {
    const d = monthKeyToDate(monthKey);
    d.setMonth(d.getMonth() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function renderCalendarMonth(acc) {
    const monthKey = acc.ui.calendarMonth || getMonthKey(todayISO());
    const selectedDate = acc.ui.selectedDate || null;

    calMonthLabel.textContent = formatMonthLabel(monthKey);

    const monthExp = monthExpenses(acc, monthKey);
    const totalsByDate = new Map();
    for (const e of monthExp) {
      totalsByDate.set(e.date, (totalsByDate.get(e.date) || 0) + (Number(e.amount) || 0));
    }

    calGrid.innerHTML = "";
    const [y, m] = monthKey.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const firstDow = first.getDay(); // Sun=0
    const offset = (firstDow + 6) % 7; // Mon=0
    const dim = new Date(y, m, 0).getDate();

    const totalCells = 42;
    const today = todayISO();

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - offset + 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.setAttribute("role", "gridcell");

      if (dayNum < 1 || dayNum > dim) {
        btn.classList.add("disabled");
        btn.disabled = true;
        btn.innerHTML = `<span class="n"></span>`;
        calGrid.appendChild(btn);
        continue;
      }

      const dd = String(dayNum).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const dateStr = `${y}-${mm}-${dd}`;

      btn.dataset.date = dateStr;
      btn.innerHTML = `<span class="n">${dayNum}</span>`;

      if (dateStr === today) btn.classList.add("today");
      if (selectedDate === dateStr) btn.classList.add("selected");

      const total = totalsByDate.get(dateStr) || 0;
      if (total > 0) {
        btn.classList.add("has-expenses");
        btn.title = `${formatDateLabel(dateStr)} • Total: ${currencyFmt.format(total)}`;
      } else {
        btn.title = formatDateLabel(dateStr);
      }

      btn.addEventListener("click", () => {
        const store = ensureStoreIntegrity(loadStore());
        const active = getActiveAccount(store);
        if (!active) return;

        active.ui.calendarMonth = monthKey;
        active.ui.selectedDate = dateStr;
        active.ui.scope = "month"; // clicking a day implies Month view
        saveStore(store);

        dateInput.value = dateStr;
        rerenderAll(store);
        showToast(`Viewing ${formatDateLabel(dateStr)}.`);
        closeSidebarMobile();
      });

      calGrid.appendChild(btn);
    }

    if (selectedDate && getMonthKey(selectedDate) === monthKey) {
      calSelectedLabel.textContent = `Viewing: ${formatDateLabel(selectedDate)}`;
    } else {
      calSelectedLabel.textContent = `Viewing: ${formatMonthLabel(monthKey)}`;
    }
  }

  function renderMonthListAll(acc) {
    const summary = getMonthlySummary(acc);
    const desc = [...summary].sort((a,b) => b.monthKey.localeCompare(a.monthKey)); // newest first

    monthList.innerHTML = "";
    if (!desc.length) {
      monthList.innerHTML = `<div class="muted">No months yet.</div>`;
      return;
    }

    for (const row of desc) {
      const spent = row.spent;
      const budget = row.budget;
      const pct = budget > 0 ? clamp((spent / budget) * 100, 0, 999) : 0;
      const remaining = budget > 0 ? (budget - spent) : 0;

      const el = document.createElement("div");
      el.className = "month-row";
      el.innerHTML = `
        <div class="month-top">
          <div class="month-name">${escapeHtml(formatMonthLabel(row.monthKey))}</div>
          <div class="month-meta">
            Spent ${escapeHtml(currencyFmt.format(spent))} • Budget ${escapeHtml(currencyFmt.format(budget))}
          </div>
        </div>
        <div class="month-bar"><i style="width:${budget > 0 ? clamp(pct,0,100).toFixed(1) : 0}%"></i></div>
        <div class="month-meta">
          ${budget > 0
            ? `Remaining ${escapeHtml(currencyFmt.format(Math.max(0, remaining)))} • ${escapeHtml(clamp(pct,0,999).toFixed(1))}% used`
            : `No budget set for this month`}
        </div>
      `;

      el.addEventListener("click", () => {
        const store = ensureStoreIntegrity(loadStore());
        const active = getActiveAccount(store);
        if (!active) return;
        active.ui.scope = "month";
        active.ui.calendarMonth = row.monthKey;
        active.ui.selectedDate = null;
        saveStore(store);
        rerenderAll(store);
        showToast(`Opened ${formatMonthLabel(row.monthKey)}.`);
      });

      monthList.appendChild(el);
    }
  }

  // ---------- charts ----------
  function destroyCharts() {
    if (trendChart) { trendChart.destroy(); trendChart = null; }
    if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
  }

  function buildMonthDailyTotals(monthKey, monthExp) {
    const dim = daysInMonthByKey(monthKey);
    const daily = Array(dim).fill(0);

    for (const e of monthExp) {
      const day = Number(String(e.date).slice(8, 10));
      if (!Number.isFinite(day) || day < 1 || day > dim) continue;
      daily[day - 1] += (Number(e.amount) || 0);
    }

    const labels = Array.from({ length: dim }, (_, i) => String(i + 1));
    const dates = Array.from({ length: dim }, (_, i) => dateForDayIndex(monthKey, i + 1));
    return { labels, dates, daily };
  }

  function cumulative(arr) {
    const out = [];
    let run = 0;
    for (const v of arr) { run += (Number(v) || 0); out.push(run); }
    return out;
  }

  function buildCategorySeries(expenses) {
    const map = new Map();
    for (const e of expenses) {
      const c = String(e.category || "Other").trim() || "Other";
      map.set(c, (map.get(c) || 0) + (Number(e.amount) || 0));
    }
    const labels = Array.from(map.keys()).sort();
    const values = labels.map((l) => map.get(l));
    return { labels, values };
  }

  function paletteFor(labels) {
    const base = THEME.a.h;
    return labels.map((_, i) => `hsla(${(base + i * 48) % 360}, ${clamp(THEME.a.s, 55, 95)}%, ${clamp(THEME.a.l - 8, 38, 68)}%, 0.75)`);
  }

  function renderChartsForScope(acc) {
    destroyCharts();

    const scope = acc.ui.scope || "month";
    const monthKey = acc.ui.calendarMonth || getMonthKey(todayISO());
    const selectedDate = acc.ui.selectedDate || null;
    const chartMode = acc.ui.chartMode || "daily";

    // Update toggle text depending on scope
    const dailyBtn = chartModeButtons.find(b => b.dataset.mode === "daily");
    if (dailyBtn) dailyBtn.textContent = (scope === "all" ? "Monthly" : "Daily");

    chartModeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.mode === chartMode));

    const axis = {
      ticks: { color: "rgba(255,255,255,0.65)" },
      grid: { color: "rgba(255,255,255,0.08)" }
    };

    if (scope === "month") {
      const fin = getMonthFinance(acc, monthKey);
      const budget = fin.budget;

      const monthExp = monthExpenses(acc, monthKey);
      const series = buildMonthDailyTotals(monthKey, monthExp);

      const isDay = !!(selectedDate && getMonthKey(selectedDate) === monthKey);
      const focusExp = isDay ? dayExpenses(acc, selectedDate) : monthExp;

      chartMonthChip.textContent = `${formatMonthLabel(monthKey)} • ${chartMode === "cumulative" ? "Cumulative" : "Daily"}`;
      trendTitle.textContent = (chartMode === "cumulative")
        ? `Cumulative spend vs budget pace • ${formatMonthLabel(monthKey)}`
        : `Daily spend • ${formatMonthLabel(monthKey)}`;
      categoryTitle.textContent = isDay ? "By category (selected day)" : "By category (month)";

      const tooltipTitle = (items) => {
        const idx = items?.[0]?.dataIndex ?? 0;
        const dateStr = series.dates[idx] || "";
        return dateStr ? formatDateLabel(dateStr) : "";
      };

      // Trend chart
      if (chartMode === "cumulative") {
        const cumSpend = cumulative(series.daily);
        const dim = series.daily.length || 1;

        const datasets = [{
          label: "Cumulative expenses",
          data: cumSpend,
          tension: 0.28,
          pointRadius: 2.5,
          borderWidth: 2,
          borderColor: hsla(THEME.a, 0.95),
          backgroundColor: hsla(THEME.a, 0.16),
          pointBackgroundColor: hsla(THEME.b, 0.9),
          pointBorderColor: hsla(THEME.a, 0.9),
          fill: true
        }];

        if (budget > 0) {
          const cumBudget = series.daily.map((_, i) => budget * ((i + 1) / dim));
          datasets.push({
            label: "Cumulative budget pace",
            data: cumBudget,
            tension: 0.15,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [7, 6],
            borderColor: "rgba(255,255,255,0.55)",
            backgroundColor: "transparent",
            fill: false
          });
        }

        trendChart = new Chart(trendCanvas, {
          type: "line",
          data: { labels: series.labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, labels: { color: "rgba(255,255,255,0.75)" } },
              tooltip: {
                callbacks: {
                  title: tooltipTitle,
                  label: (ctx) => `${ctx.dataset.label}: ${currencyFmt.format(ctx.parsed.y ?? 0)}`
                }
              }
            },
            scales: {
              x: axis,
              y: {
                ...axis,
                ticks: {
                  ...axis.ticks,
                  callback: (v) => {
                    try { return currencyFmt.format(Number(v) || 0); } catch { return v; }
                  }
                }
              }
            }
          }
        });
      } else {
        trendChart = new Chart(trendCanvas, {
          type: "line",
          data: {
            labels: series.labels,
            datasets: [{
              label: "Daily spend",
              data: series.daily,
              tension: 0.35,
              pointRadius: 3,
              borderWidth: 2,
              borderColor: hsla(THEME.a, 0.95),
              backgroundColor: hsla(THEME.a, 0.18),
              pointBackgroundColor: hsla(THEME.b, 0.9),
              pointBorderColor: hsla(THEME.a, 0.9),
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { title: tooltipTitle, label: (ctx) => currencyFmt.format(ctx.parsed.y ?? 0) } }
            },
            scales: { x: axis, y: axis }
          }
        });
      }

      // Category chart
      const cat = buildCategorySeries(focusExp);
      categoryChart = new Chart(categoryCanvas, {
        type: "doughnut",
        data: {
          labels: cat.labels,
          datasets: [{ label: "By category", data: cat.values, borderWidth: 1, backgroundColor: paletteFor(cat.labels) }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.75)" } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${currencyFmt.format(ctx.parsed)}` } }
          }
        }
      });

      return;
    }

    // scope === "all" (monthly series)
    const summary = getMonthlySummary(acc);
    const monthsAsc = summary.map(s => s.monthKey);

    const labels = monthsAsc.map(mk => {
      const d = monthKeyToDate(mk);
      return new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }).format(d);
    });

    const spentSeries = summary.map(s => s.spent);
    const budgetSeries = summary.map(s => s.budget);

    chartMonthChip.textContent = `All months • ${chartMode === "cumulative" ? "Cumulative" : "Monthly"}`;
    trendTitle.textContent = (chartMode === "cumulative")
      ? `Cumulative spend vs cumulative budget • All months`
      : `Monthly spend vs monthly budget • All months`;
    categoryTitle.textContent = "By category (all months)";

    const tooltipTitle = (items) => {
      const idx = items?.[0]?.dataIndex ?? 0;
      const mk = monthsAsc[idx];
      return mk ? formatMonthLabel(mk) : "";
    };

    let trendDatasets = [];
    if (chartMode === "cumulative") {
      const cumSpent = cumulative(spentSeries);
      const cumBudget = cumulative(budgetSeries);

      trendDatasets = [
        {
          label: "Cumulative expenses",
          data: cumSpent,
          tension: 0.25,
          pointRadius: 2.5,
          borderWidth: 2,
          borderColor: hsla(THEME.a, 0.95),
          backgroundColor: hsla(THEME.a, 0.16),
          fill: true
        },
        {
          label: "Cumulative budget",
          data: cumBudget,
          tension: 0.15,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [7, 6],
          borderColor: "rgba(255,255,255,0.55)",
          backgroundColor: "transparent",
          fill: false
        }
      ];
    } else {
      trendDatasets = [
        {
          label: "Monthly expenses",
          data: spentSeries,
          tension: 0.25,
          pointRadius: 3,
          borderWidth: 2,
          borderColor: hsla(THEME.a, 0.95),
          backgroundColor: hsla(THEME.a, 0.14),
          fill: true
        },
        {
          label: "Monthly budget",
          data: budgetSeries,
          tension: 0.15,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [7, 6],
          borderColor: "rgba(255,255,255,0.55)",
          backgroundColor: "transparent",
          fill: false
        }
      ];
    }

    trendChart = new Chart(trendCanvas, {
      type: "line",
      data: { labels, datasets: trendDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: "rgba(255,255,255,0.75)" } },
          tooltip: {
            callbacks: {
              title: tooltipTitle,
              label: (ctx) => `${ctx.dataset.label}: ${currencyFmt.format(ctx.parsed.y ?? 0)}`
            }
          }
        },
        scales: {
          x: axis,
          y: {
            ...axis,
            ticks: {
              ...axis.ticks,
              callback: (v) => {
                try { return currencyFmt.format(Number(v) || 0); } catch { return v; }
              }
            }
          }
        }
      }
    });

    const allExp = acc.expenses || [];
    const cat = buildCategorySeries(allExp);
    categoryChart = new Chart(categoryCanvas, {
      type: "doughnut",
      data: { labels: cat.labels, datasets: [{ label: "By category", data: cat.values, borderWidth: 1, backgroundColor: paletteFor(cat.labels) }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.75)" } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${currencyFmt.format(ctx.parsed)}` } }
        }
      }
    });
  }

  // ---------- suggestions ----------
  function buildSuggestions(acc) {
    const scope = acc.ui.scope || "month";
    const monthKey = acc.ui.calendarMonth || getMonthKey(todayISO());
    const selectedDate = acc.ui.selectedDate || null;

    const out = [];

    if (scope === "month") {
      const fin = getMonthFinance(acc, monthKey);
      const budget = fin.budget;
      const monthExp = monthExpenses(acc, monthKey);
      const spentMonth = sumExpenses(monthExp);
      const remaining = budget > 0 ? budget - spentMonth : 0;

      const isDay = !!(selectedDate && getMonthKey(selectedDate) === monthKey);
      const focusExp = isDay ? dayExpenses(acc, selectedDate) : monthExp;
      const spentFocus = sumExpenses(focusExp);

      if (!monthExp.length) {
        out.push({
          title: "Start simple: log for 7 days",
          body: "Track anything for a week (even messy). Patterns show up fast.",
          meta: "Consistency > perfection."
        });
        return out;
      }

      if (budget <= 0) {
        out.push({
          title: "Set this month’s budget",
          body: "Budgets are monthly here. Tap “Set month budget” and enter a budget for the month you’re viewing.",
          meta: `Viewing ${formatMonthLabel(monthKey)}.`
        });
      } else {
        const pct = (spentMonth / budget) * 100;
        if (remaining < 0) {
          out.push({
            title: "Over budget — stabilize the month",
            body: `You’re over by ${currencyFmt.format(Math.abs(remaining))}. Pause non-essentials and keep the rest of month light.`,
            meta: `Used ${pct.toFixed(1)}% of budget.`
          });
        } else if (pct >= 85) {
          out.push({
            title: "Last 15% of budget",
            body: `Remaining: ${currencyFmt.format(Math.max(0, remaining))}. Try 1–2 no-spend days.`,
            meta: `Used ${pct.toFixed(1)}% of budget.`
          });
        } else {
          out.push({
            title: "Good pacing",
            body: `Used ${pct.toFixed(1)}% so far. Remaining: ${currencyFmt.format(Math.max(0, remaining))}.`,
            meta: "Keep the pace steady."
          });
        }
      }

      // Top category
      const map = new Map();
      for (const e of monthExp) {
        const c = String(e.category || "Other").trim() || "Other";
        map.set(c, (map.get(c) || 0) + (Number(e.amount) || 0));
      }
      const top = Array.from(map.entries()).sort((a,b)=>b[1]-a[1])[0];
      if (top) {
        const share = spentMonth > 0 ? (top[1] / spentMonth) * 100 : 0;
        out.push({
          title: `Biggest driver: ${top[0]}`,
          body: `${top[0]} is ${share.toFixed(1)}% this month (${currencyFmt.format(top[1])}). Cutting 10% here is real money.`,
          meta: "Cut big categories first."
        });
      }

      if (isDay) {
        out.push({
          title: "Day snapshot",
          body: `Total for ${formatDateLabel(selectedDate)}: ${currencyFmt.format(spentFocus)}. Balance it with a lighter day.`,
          meta: "One day doesn’t define the month."
        });
      }

      return out.slice(0, 6);
    }

    // scope === all
    const summary = getMonthlySummary(acc);
    const totalSpent = summary.reduce((a, s) => a + (Number(s.spent) || 0), 0);
    const totalBudget = summary.reduce((a, s) => a + (Number(s.budget) || 0), 0);
    const trackedMonths = summary.length;

    if (trackedMonths === 0) {
      out.push({
        title: "Add your first month budget",
        body: "Budgets are stored per month. Start with this month, then add others as needed.",
        meta: "Month budgets unlock better analytics."
      });
      return out;
    }

    if (totalBudget <= 0) {
      out.push({
        title: "No budgets across months yet",
        body: "You’re in All months view, but budgets are 0. Set budgets per month to see a meaningful cumulative budget line.",
        meta: `Tracked months: ${trackedMonths}.`
      });
    } else {
      const remaining = totalBudget - totalSpent;
      const pct = (totalSpent / totalBudget) * 100;

      if (remaining < 0) {
        out.push({
          title: "Cumulative over budget",
          body: `Across all tracked months you’re over by ${currencyFmt.format(Math.abs(remaining))}. Review the worst month first.`,
          meta: `Used ${pct.toFixed(1)}% cumulatively.`
        });
      } else {
        out.push({
          title: "Cumulative summary looks solid",
          body: `Spent ${currencyFmt.format(totalSpent)} out of ${currencyFmt.format(totalBudget)}.`,
          meta: `Remaining: ${currencyFmt.format(Math.max(0, remaining))}.`
        });
      }
    }

    // Most expensive month
    const worst = [...summary].sort((a,b)=>b.spent-a.spent)[0];
    if (worst) {
      out.push({
        title: `Heaviest month: ${formatMonthLabel(worst.monthKey)}`,
        body: `Spent ${currencyFmt.format(worst.spent)}. Budget was ${currencyFmt.format(worst.budget)}.`,
        meta: "Tap it in the month list to drill down."
      });
    }

    // Top category overall
    const cat = buildCategorySeries(acc.expenses || []);
    const pairs = cat.labels.map((l, i) => [l, cat.values[i]]);
    pairs.sort((a,b)=>b[1]-a[1]);
    const topCat = pairs[0];
    if (topCat) {
      out.push({
        title: `Top category overall: ${topCat[0]}`,
        body: `Total ${currencyFmt.format(topCat[1])} across all months. Consider a simple cap for this category.`,
        meta: "Caps beat vibes."
      });
    }

    return out.slice(0, 6);
  }

  function renderSuggestions(acc) {
    const items = buildSuggestions(acc);
    suggestionsList.innerHTML = "";
    for (const s of items) {
      const li = document.createElement("li");
      li.className = "sugg-item";
      li.innerHTML = `
        <span class="sugg-dot" aria-hidden="true"></span>
        <div>
          <p class="sugg-title">${escapeHtml(s.title)}</p>
          <p class="sugg-body">${escapeHtml(s.body)}</p>
          ${s.meta ? `<div class="sugg-meta">${escapeHtml(s.meta)}</div>` : ""}
        </div>
      `;
      suggestionsList.appendChild(li);
    }

    if (window.gsap) {
      gsap.fromTo("#cardSuggestions .sugg-item",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.05 }
      );
    }
  }

  // ---------- expense table ----------
  function renderExpensesTable(expenses, onDelete, cap = 200) {
    const sorted = [...expenses].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const shown = sorted.slice(0, cap);

    expenseTbody.innerHTML = "";
    for (const e of shown) {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.textContent = e.date;

      const tdCat = document.createElement("td");
      tdCat.textContent = e.category;

      const tdAmt = document.createElement("td");
      tdAmt.className = "right";
      tdAmt.textContent = currencyFmt.format(Number(e.amount) || 0);

      const tdAct = document.createElement("td");
      tdAct.className = "right";
      const btn = document.createElement("button");
      btn.className = "row-btn";
      btn.type = "button";
      btn.textContent = "Delete";
      btn.addEventListener("click", () => onDelete(e.id));
      tdAct.appendChild(btn);

      tr.append(tdDate, tdCat, tdAmt, tdAct);
      expenseTbody.appendChild(tr);
    }

    expenseCountChip.textContent = `${sorted.length} item${sorted.length === 1 ? "" : "s"}`;
  }

  // ---------- accounts UI ----------
  function renderAccountSelect(store) {
    const ids = Object.keys(store.accounts);
    accountSelect.innerHTML = "";
    for (const id of ids) {
      const acc = store.accounts[id];
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = acc.profile?.name || "Account";
      accountSelect.appendChild(opt);
    }
    accountSelect.value = store.activeAccountId;
  }

  function renderAccountsModal(store) {
    const ids = Object.keys(store.accounts);
    accountsList.innerHTML = "";

    for (const id of ids) {
      const acc = store.accounts[id];
      const isActive = id === store.activeAccountId;

      const summary = getMonthlySummary(acc);
      const tracked = summary.length;
      const totalSpent = summary.reduce((a,s)=>a+s.spent,0);

      const row = document.createElement("div");
      row.className = "acc-row";

      const meta = document.createElement("div");
      meta.className = "acc-meta";

      const name = document.createElement("div");
      name.className = "acc-name";
      name.textContent = acc.profile?.name || "Account";

      const sub = document.createElement("div");
      sub.className = "acc-sub";
      const n = acc.expenses?.length || 0;
      sub.textContent = `Tracked months: ${tracked} • Entries: ${n} • Total spent: ${currencyFmt.format(totalSpent)}`;

      meta.appendChild(name);
      meta.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "acc-actions";

      if (isActive) {
        const pill = document.createElement("span");
        pill.className = "acc-pill";
        pill.textContent = "Active";
        actions.appendChild(pill);
      } else {
        const switchBtn = document.createElement("button");
        switchBtn.type = "button";
        switchBtn.className = "btn ghost small";
        switchBtn.textContent = "Switch";
        switchBtn.addEventListener("click", () => {
          store.activeAccountId = id;
          saveStore(store);
          renderAccountSelect(store);
          rerenderAll(store);
          showToast(`Switched to ${acc.profile?.name || "Account"}.`);
          closeAccountsModal();
        });
        actions.appendChild(switchBtn);
      }

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn danger small";
      delBtn.textContent = "Delete";
      delBtn.disabled = ids.length <= 1;
      delBtn.title = delBtn.disabled ? "You must keep at least one account." : "Delete this account";
      delBtn.addEventListener("click", () => {
        if (ids.length <= 1) return;
        const ok = confirm(`Delete account "${acc.profile?.name || "Account"}"? This cannot be undone.`);
        if (!ok) return;

        delete store.accounts[id];
        const remainingIds = Object.keys(store.accounts);
        store.activeAccountId = remainingIds[0];
        saveStore(store);

        renderAccountSelect(store);
        renderAccountsModal(store);
        rerenderAll(store);
        showToast("Account deleted.");
      });
      actions.appendChild(delBtn);

      row.appendChild(meta);
      row.appendChild(actions);
      accountsList.appendChild(row);
    }
  }

  function openAccountsModal() {
    const store = ensureStoreIntegrity(loadStore());
    renderAccountsModal(store);
    accountsModal.classList.remove("hidden");
    if (window.gsap) {
      gsap.fromTo("#accountsModal .modal-panel",
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" }
      );
    }
  }
  function closeAccountsModal() { accountsModal.classList.add("hidden"); }

  // ---------- month modal ----------
  function openMonthModal() {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    const mk = acc.ui.calendarMonth || getMonthKey(todayISO());
    const fin = getMonthFinance(acc, mk);

    editMonthLabel.textContent = formatMonthLabel(mk);
    monthAccountName.value = acc.profile?.name || "";
    monthBudgetInput.value = String(fin.budget || "");
    monthIncomeInput.value = String(fin.income || "");

    monthModal.classList.remove("hidden");
    if (window.gsap) {
      gsap.fromTo("#monthModal .modal-panel",
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" }
      );
    }
  }

  // ---------- pdf ----------
  function downloadPdfReport(){
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return showToast("No active account.");
    if (!window.jspdf?.jsPDF) return showToast("PDF library not loaded.");

    const scope = acc.ui.scope || "month";
    const mk = acc.ui.calendarMonth || getMonthKey(todayISO());
    const sd = acc.ui.selectedDate || null;
    const isDay = scope === "month" && sd && getMonthKey(sd) === mk;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const fmt = (n) => {
      try { return currencyFmt.format(Number(n)||0); } catch { return String(n); }
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Lumina Wealth", 40, 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const title = scope === "all"
      ? "All-months Spending Report"
      : (isDay ? `Daily Spending Report — ${formatDateLabel(sd)}` : `Monthly Spending Report — ${formatMonthLabel(mk)}`);

    doc.text(title, 40, 70);
    doc.text(`Account: ${acc.profile?.name || "—"}`, 40, 90);

    let y = 118;

    if (scope === "month") {
      const fin = getMonthFinance(acc, mk);
      const budget = fin.budget;
      const income = fin.income;

      const monthExp = monthExpenses(acc, mk);
      const spentMonth = sumExpenses(monthExp);
      const remaining = budget > 0 ? Math.max(0, budget - spentMonth) : 0;

      const focusExp = isDay ? dayExpenses(acc, sd) : monthExp;
      const spentFocus = sumExpenses(focusExp);

      const summaryLines = [
        `Month: ${formatMonthLabel(mk)}`,
        `Income (month): ${fmt(income)}`,
        `Budget (month): ${fmt(budget)}`,
        `Spent (month): ${fmt(spentMonth)}`,
        `Remaining (month): ${fmt(remaining)}`,
        isDay ? `Spent (selected day): ${fmt(spentFocus)}` : ""
      ].filter(Boolean);

      for (const line of summaryLines) { doc.text(line, 40, y); y += 16; }

      const rows = [...focusExp]
        .sort((a,b)=>String(a.date).localeCompare(String(b.date)))
        .map(e => [e.date, String(e.category||""), fmt(e.amount)]);

      doc.autoTable({
        head: [["Date", "Category", "Amount"]],
        body: rows.length ? rows : [["—", "No expenses", "—"]],
        startY: y + 10,
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: [20, 20, 28] },
        theme: "grid"
      });
      y = doc.lastAutoTable.finalY + 18;

    } else {
      const summary = getMonthlySummary(acc);
      const totalSpent = summary.reduce((a,s)=>a+s.spent,0);
      const totalBudget = summary.reduce((a,s)=>a+s.budget,0);
      const remaining = totalBudget > 0 ? Math.max(0, totalBudget - totalSpent) : 0;

      const incomeTotal = summary.reduce((a,s)=>{
        const fin = getMonthFinance(acc, s.monthKey);
        return a + (fin.income || 0);
      }, 0);

      const summaryLines = [
        `Tracked months: ${summary.length}`,
        `Total income (tracked): ${fmt(incomeTotal)}`,
        `Total budget (tracked): ${fmt(totalBudget)}`,
        `Total spent: ${fmt(totalSpent)}`,
        `Total remaining: ${fmt(remaining)}`
      ];
      for (const line of summaryLines) { doc.text(line, 40, y); y += 16; }

      const monthlyRows = summary
        .slice()
        .sort((a,b)=>a.monthKey.localeCompare(b.monthKey))
        .map(s => [
          formatMonthLabel(s.monthKey),
          fmt(s.budget),
          fmt(s.spent),
          fmt(Math.max(0, (s.budget || 0) - (s.spent || 0)))
        ]);

      doc.autoTable({
        head: [["Month", "Budget", "Spent", "Remaining"]],
        body: monthlyRows.length ? monthlyRows : [["—", "—", "—", "—"]],
        startY: y + 10,
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: [20, 20, 28] },
        theme: "grid"
      });
      y = doc.lastAutoTable.finalY + 18;

      // Add last 50 expenses
      const all = [...(acc.expenses || [])].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0, 50);
      const expRows = all.map(e => [e.date, String(e.category||""), fmt(e.amount)]);
      doc.autoTable({
        head: [["Date", "Category", "Amount"]],
        body: expRows.length ? expRows : [["—", "No expenses", "—"]],
        startY: y + 6,
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: [20, 20, 28] },
        theme: "grid"
      });
      y = doc.lastAutoTable.finalY + 18;
    }

    // Add charts images
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const imgW = pageWidth - margin * 2;
    const imgH = 160;

    function ensureSpace(heightNeeded){
      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + heightNeeded > pageHeight - 40) {
        doc.addPage();
        y = 50;
      }
    }

    try{
      const trendImg = trendCanvas?.toDataURL("image/png", 1.0);
      if (trendImg) {
        ensureSpace(imgH + 26);
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text("Trend Chart", margin, y);
        y += 10;
        doc.addImage(trendImg, "PNG", margin, y, imgW, imgH);
        y += imgH + 18;
      }
    }catch{/* ignore */}

    try{
      const catImg = categoryCanvas?.toDataURL("image/png", 1.0);
      if (catImg) {
        ensureSpace(imgH + 26);
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text("Category Chart", margin, y);
        y += 10;
        doc.addImage(catImg, "PNG", margin, y, imgW, imgH);
        y += imgH + 10;
      }
    }catch{/* ignore */}

    const safeName = String(acc.profile?.name || "Account").replace(/[^\w\-]+/g, "_");
    const suffix = scope === "all" ? "ALL_MONTHS" : (acc.ui.calendarMonth || getMonthKey(todayISO()));
    doc.save(`Lumina_Wealth_${safeName}_${suffix}.pdf`);
  }

  // ---------- rerender ----------
  function rerenderAll(store) {
    store = ensureStoreIntegrity(store);

    applyThemeHex(store.settings.themeHex || DEFAULT_THEME_HEX);
    if (themeColorInput) themeColorInput.value = THEME.hex;

    const acc = getActiveAccount(store);
    if (!acc) return;

    renderAccountSelect(store);

    helloName.textContent = acc.profile?.name || "friend";
    avatarInitials.textContent = initials(acc.profile?.name || "");

    // Scope toggle UI
    const scope = acc.ui.scope || "month";
    scopeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.scope === scope));

    // Calendar vs month list
    if (scope === "month") {
      calendarTitle.textContent = "Calendar";
      calNav.classList.remove("hidden");
      calendarWrap.classList.remove("hidden");
      monthListWrap.classList.add("hidden");
    } else {
      calendarTitle.textContent = "Monthly History";
      calNav.classList.add("hidden");
      calendarWrap.classList.add("hidden");
      monthListWrap.classList.remove("hidden");
    }

    // Update income input depending on scope
    const mk = acc.ui.calendarMonth || getMonthKey(todayISO());
    const fin = getMonthFinance(acc, mk);

    if (scope === "month") {
      incomeLabel.textContent = "Monthly Income";
      incomeInput.disabled = false;
      incomeInput.value = String(fin.income || "");
    } else {
      incomeLabel.textContent = "Total Income";
      incomeInput.disabled = true;
      const summary = getMonthlySummary(acc);
      const totalIncome = summary.reduce((a,s)=>{
        const f = getMonthFinance(acc, s.monthKey);
        return a + (f.income || 0);
      }, 0);
      incomeInput.value = totalIncome ? String(totalIncome) : "";
    }

    // Budget calculations by scope
    if (scope === "month") {
      const monthExp = monthExpenses(acc, mk);
      const spentMonth = sumExpenses(monthExp);
      const budget = fin.budget;

      activeMonthLabel.textContent = formatMonthLabel(mk);

      const remaining = budget > 0 ? Math.max(0, budget - spentMonth) : 0;
      budgetValue.textContent = currencyFmt.format(budget);
      spentValue.textContent = currencyFmt.format(spentMonth);
      remainingValue.textContent = currencyFmt.format(remaining);

      setChipByRemaining(budget > 0 ? (budget - spentMonth) : 0, budget);

      const pctLeft = budget > 0 ? clamp((remaining / budget) * 100, 0, 100) : 0;
      progressBar.style.width = `${pctLeft.toFixed(1)}%`;
      progressPct.textContent = budget > 0 ? `${pctLeft.toFixed(1)}% left` : `—`;

      trackedRow.classList.add("hidden");

      // Day selection cumulative row
      const sd = acc.ui.selectedDate;
      const isDay = !!(sd && getMonthKey(sd) === mk);

      if (isDay) {
        const dayN = Number(String(sd).slice(8, 10));
        const dim = daysInMonthByKey(mk);

        const cumSpent = monthExp
          .filter(e => String(e.date) <= String(sd))
          .reduce((a,e)=>a+(Number(e.amount)||0),0);

        cumLabel.textContent = `Cumulative to day ${dayN}`;
        if (budget > 0) {
          const cumBudget = budget * (dayN / Math.max(1, dim));
          cumValue.textContent = `${currencyFmt.format(cumSpent)} • pace budget ${currencyFmt.format(cumBudget)}`;
        } else {
          cumValue.textContent = currencyFmt.format(cumSpent);
        }
        cumRow.classList.remove("hidden");
      } else {
        cumRow.classList.add("hidden");
      }

      // Expenses table focus
      let focusExp = monthExp;
      let focusLabel = formatMonthLabel(mk);

      if (isDay) {
        focusExp = dayExpenses(acc, sd);
        focusLabel = formatDateLabel(sd);
        totalLabel.textContent = "Day total";
        totalHint.textContent = "You’re viewing a single day. Clear day to see the whole month.";
        dateInput.value = sd;
      } else {
        totalLabel.textContent = "Month total";
        totalHint.textContent = "You’re viewing this month. Tap a day to drill down.";
        if (!dateInput.value) dateInput.value = todayISO();
      }

      viewChip.textContent = `Viewing: ${focusLabel}`;
      monthTotal.textContent = currencyFmt.format(sumExpenses(focusExp));

      renderExpensesTable(focusExp, (id) => {
        const s = ensureStoreIntegrity(loadStore());
        const a = getActiveAccount(s);
        if (!a) return;
        a.expenses = a.expenses.filter((e) => e.id !== id);
        saveStore(s);
        rerenderAll(s);
        showToast("Expense deleted.");
      });

      renderCalendarMonth(acc);

    } else {
      // ALL MONTHS
      const summary = getMonthlySummary(acc);
      const totalSpent = summary.reduce((a,s)=>a+s.spent,0);
      const totalBudget = summary.reduce((a,s)=>a+s.budget,0);
      const remaining = totalBudget > 0 ? Math.max(0, totalBudget - totalSpent) : 0;

      activeMonthLabel.textContent = "All months";
      budgetValue.textContent = currencyFmt.format(totalBudget);
      spentValue.textContent = currencyFmt.format(totalSpent);
      remainingValue.textContent = currencyFmt.format(remaining);

      setChipByRemaining(totalBudget > 0 ? (totalBudget - totalSpent) : 0, totalBudget);

      const pctLeft = totalBudget > 0 ? clamp((remaining / totalBudget) * 100, 0, 100) : 0;
      progressBar.style.width = `${pctLeft.toFixed(1)}%`;
      progressPct.textContent = totalBudget > 0 ? `${pctLeft.toFixed(1)}% left` : `—`;

      // Show tracked months row
      trackedValue.textContent = `${summary.length}`;
      trackedRow.classList.remove("hidden");

      // No day cumulative row in all-months
      cumRow.classList.add("hidden");
      acc.ui.selectedDate = null;

      // Expenses: show all (capped)
      const all = acc.expenses || [];
      viewChip.textContent = `Viewing: All months`;
      totalLabel.textContent = "All-time total";
      totalHint.textContent = "You’re viewing all months together. Month list lets you drill down.";
      monthTotal.textContent = currencyFmt.format(sumExpenses(all));

      renderExpensesTable(all, (id) => {
        const s = ensureStoreIntegrity(loadStore());
        const a = getActiveAccount(s);
        if (!a) return;
        a.expenses = a.expenses.filter((e) => e.id !== id);
        saveStore(s);
        rerenderAll(s);
        showToast("Expense deleted.");
      }, 200);

      renderMonthListAll(acc);
    }

    renderCategoryDatalist(acc);
    renderChartsForScope(acc);
    renderSuggestions(acc);
  }

  // ---------- modal close wiring ----------
  function wireModalClose(modalEl) {
    modalEl.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close === "true") modalEl.classList.add("hidden");
      if (t && t.classList && t.classList.contains("modal-backdrop")) modalEl.classList.add("hidden");
    });
  }
  wireModalClose(accountsModal);
  wireModalClose(monthModal);

  // ---------- events ----------
  welcomeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = userNameInput.value.trim();
    const budget = Number(monthlyBudgetInput.value);
    if (!name || !Number.isFinite(budget) || budget <= 0) {
      showToast("Please enter a valid name and starting month budget.");
      return;
    }
    const store = defaultStore(name, budget);
    saveStore(store);

    if (window.gsap) {
      gsap.to(".welcome-card", {
        opacity: 0, y: -10, duration: 0.35, ease: "power2.inOut",
        onComplete: () => {
          welcomeView.classList.add("hidden");
          dashboardView.classList.remove("hidden");
          rerenderAll(store);
          renderQuote();
          showToast("Welcome to Lumina Wealth.");
        }
      });
    } else {
      welcomeView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      rerenderAll(store);
      renderQuote();
      showToast("Welcome to Lumina Wealth.");
    }
  });

  sidebarToggle.addEventListener("click", () => openSidebarMobile());
  sidebarBackdrop.addEventListener("click", () => closeSidebarMobile());

  accountSelect.addEventListener("change", () => {
    const store = ensureStoreIntegrity(loadStore());
    const id = accountSelect.value;
    if (!store.accounts[id]) return;
    store.activeAccountId = id;
    saveStore(store);
    rerenderAll(store);
    showToast("Account switched.");
    closeSidebarMobile();
  });

  manageAccountsBtn.addEventListener("click", () => openAccountsModal());
  editMonthBtn.addEventListener("click", () => openMonthModal());

  addAccountForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = newAccountName.value.trim();
    const budget = Number(newAccountBudget.value);
    if (!name || !Number.isFinite(budget) || budget <= 0) {
      showToast("Enter a valid account name and starting month budget.");
      return;
    }

    const store = ensureStoreIntegrity(loadStore());
    const acc = defaultAccount(name, budget, getMonthKey(todayISO()));

    store.accounts[acc.id] = acc;
    store.activeAccountId = acc.id;

    saveStore(store);
    rerenderAll(store);

    newAccountName.value = "";
    newAccountBudget.value = "";
    showToast("Account created & activated.");
    closeAccountsModal();
  });

  monthForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    const mk = acc.ui.calendarMonth || getMonthKey(todayISO());

    const newName = monthAccountName.value.trim();
    const budget = Number(monthBudgetInput.value);
    const income = Number(monthIncomeInput.value || 0);

    if (!newName) return showToast("Enter a valid account name.");
    if (!Number.isFinite(budget) || budget < 0) return showToast("Enter a valid month budget (0 or more).");
    if (!Number.isFinite(income) || income < 0) return showToast("Enter a valid month income (0 or more).");

    acc.profile.name = newName;
    setMonthFinance(acc, mk, budget, income);

    saveStore(store);
    monthModal.classList.add("hidden");
    rerenderAll(store);
    showToast("Month settings saved.");
  });

  if (scopeToggle) {
    scopeToggle.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".seg");
      if (!btn) return;
      const scope = btn.dataset.scope;
      if (scope !== "month" && scope !== "all") return;

      const store = ensureStoreIntegrity(loadStore());
      const acc = getActiveAccount(store);
      if (!acc) return;

      acc.ui.scope = scope;
      if (scope === "all") acc.ui.selectedDate = null;
      saveStore(store);
      rerenderAll(store);
      showToast(scope === "all" ? "All months view enabled." : "Month view enabled.");
    });
  }

  if (chartModeToggle) {
    chartModeToggle.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".seg");
      if (!btn) return;
      const mode = btn.dataset.mode;
      if (mode !== "daily" && mode !== "cumulative") return;

      const store = ensureStoreIntegrity(loadStore());
      const acc = getActiveAccount(store);
      if (!acc) return;

      acc.ui.chartMode = mode;
      saveStore(store);
      rerenderAll(store);
      showToast(mode === "cumulative" ? "Cumulative view enabled." : "Standard view enabled.");
    });
  }

  // Income edit only in month scope
  incomeInput.addEventListener("input", () => {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;
    if ((acc.ui.scope || "month") !== "month") return;

    const mk = acc.ui.calendarMonth || getMonthKey(todayISO());
    const fin = getMonthFinance(acc, mk);

    const v = Number(incomeInput.value);
    const income = Number.isFinite(v) && v >= 0 ? v : 0;
    setMonthFinance(acc, mk, fin.budget, income);

    saveStore(store);
    rerenderAll(store);
  });

  // Expense add
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = String(categoryInput.value || "").trim();
    const amount = Number(amountInput.value);
    const date = dateInput.value;

    if (!category) return showToast("Enter a category/name.");
    if (!Number.isFinite(amount) || amount <= 0) return showToast("Enter a valid amount.");
    if (!date) return showToast("Select a date.");

    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    acc.expenses.push({ id: uid("exp"), category, amount, date });

    // Keep calendar month aligned with added expense month
    acc.ui.calendarMonth = getMonthKey(date);

    // If in month scope, optionally jump to that day selection
    if ((acc.ui.scope || "month") === "month") {
      acc.ui.selectedDate = date;
    } else {
      acc.ui.selectedDate = null;
    }

    saveStore(store);
    rerenderAll(store);

    amountInput.value = "";
    showToast("Expense added.");
    closeSidebarMobile();
  });

  // Calendar controls (month scope only)
  calPrev.addEventListener("click", () => {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    const cur = acc.ui.calendarMonth || getMonthKey(todayISO());
    const next = addMonths(cur, -1);
    acc.ui.calendarMonth = next;
    if (acc.ui.selectedDate && getMonthKey(acc.ui.selectedDate) !== next) acc.ui.selectedDate = null;

    saveStore(store);
    rerenderAll(store);
  });

  calNext.addEventListener("click", () => {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    const cur = acc.ui.calendarMonth || getMonthKey(todayISO());
    const next = addMonths(cur, +1);
    acc.ui.calendarMonth = next;
    if (acc.ui.selectedDate && getMonthKey(acc.ui.selectedDate) !== next) acc.ui.selectedDate = null;

    saveStore(store);
    rerenderAll(store);
  });

  calToday.addEventListener("click", () => {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    const t = todayISO();
    acc.ui.calendarMonth = getMonthKey(t);
    acc.ui.selectedDate = t;
    acc.ui.scope = "month";

    saveStore(store);
    dateInput.value = t;
    rerenderAll(store);
    showToast("Jumped to today.");
  });

  clearSelectionBtn.addEventListener("click", () => {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    acc.ui.selectedDate = null;
    saveStore(store);
    rerenderAll(store);
    showToast("Day filter cleared.");
  });

  // Theme
  themeColorInput.addEventListener("input", () => {
    const hex = themeColorInput.value || DEFAULT_THEME_HEX;
    const store = ensureStoreIntegrity(loadStore());
    store.settings.themeHex = hex;
    saveStore(store);
    rerenderAll(store);
  });

  presetSwatches.forEach(btn => {
    const c = btn.getAttribute("data-color");
    if (c) btn.style.background = c;
    btn.addEventListener("click", () => {
      const hex = btn.getAttribute("data-color") || DEFAULT_THEME_HEX;
      themeColorInput.value = hex;
      const store = ensureStoreIntegrity(loadStore());
      store.settings.themeHex = hex;
      saveStore(store);
      rerenderAll(store);
      showToast("Theme updated.");
    });
  });

  resetThemeBtn.addEventListener("click", () => {
    themeColorInput.value = DEFAULT_THEME_HEX;
    const store = ensureStoreIntegrity(loadStore());
    store.settings.themeHex = DEFAULT_THEME_HEX;
    saveStore(store);
    rerenderAll(store);
    showToast("Theme reset.");
  });

  // PDF
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      downloadPdfReport();
      showToast("PDF report downloaded.");
    });
  }

  // Suggestions refresh
  refreshSuggestionsBtn.addEventListener("click", () => {
    const store = ensureStoreIntegrity(loadStore());
    rerenderAll(store);
    showToast("Suggestions refreshed.");
  });

  // Quote refresh
  newQuoteBtn.addEventListener("click", () => renderQuote());

  // Reset everything
  resetBtn.addEventListener("click", () => {
    const ok = confirm("Reset ALL accounts and data? This cannot be undone.");
    if (!ok) return;

    localStorage.removeItem(STORAGE_KEY);
    destroyCharts();
    showToast("All data cleared.");

    dashboardView.classList.add("hidden");
    welcomeView.classList.remove("hidden");

    const card = document.querySelector(".welcome-card");
    if (card) { card.style.opacity = ""; card.style.transform = ""; }
  });

  // ESC closes modals + sidebar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      accountsModal.classList.add("hidden");
      monthModal.classList.add("hidden");
      closeSidebarMobile();
    }
  });

  // ---------- init ----------
  function init() {
    const migrated = tryMigrateLegacy();
    let store = migrated || loadStore();
    if (store) store = ensureStoreIntegrity(store);

    const themeHex = store?.settings?.themeHex || DEFAULT_THEME_HEX;
    applyThemeHex(themeHex);
    if (themeColorInput) themeColorInput.value = themeHex;

    const hasData = !!store && !!getActiveAccount(store);
    if (hasData) {
      welcomeView.classList.add("hidden");
      dashboardView.classList.remove("hidden");
      rerenderAll(store);
      renderQuote();
    } else {
      welcomeView.classList.remove("hidden");
      dashboardView.classList.add("hidden");
      if (window.gsap) {
        gsap.fromTo(".welcome-card", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
      }
    }

    // default date input
    if (dateInput && !dateInput.value) dateInput.value = todayISO();
  }

  init();
})();
