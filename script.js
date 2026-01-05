(function () {
  const STORAGE_KEY = "lumina_wealth_multi_v2";
  const LEGACY_KEYS = ["lumina_wealth_multi_v1", "lumina_wealth_v2", "lumina_wealth_v1"];

  const $ = (sel) => document.querySelector(sel);

  // Views
  const welcomeView = $("#welcomeView");
  const dashboardView = $("#dashboardView");

  // Welcome
  const welcomeForm = $("#welcomeForm");
  const userNameInput = $("#userNameInput");
  const monthlyBudgetInput = $("#monthlyBudgetInput");

  // Sidebar + mobile
  const sidebarToggle = $("#sidebarToggle");
  const sidebarBackdrop = $("#sidebarBackdrop");

  // Account switcher
  const accountSelect = $("#accountSelect");
  const manageAccountsBtn = $("#manageAccountsBtn");

  // Dashboard identity
  const helloName = $("#helloName");
  const avatarInitials = $("#avatarInitials");

  // Theme
  const themeColorInput = $("#themeColorInput");
  const resetThemeBtn = $("#resetThemeBtn");
  const presetSwatches = Array.from(document.querySelectorAll(".swatch"));

  // Inputs
  const incomeInput = $("#incomeInput");

  // Budget UI
  const budgetValue = $("#budgetValue");
  const spentValue = $("#spentValue");
  const remainingValue = $("#remainingValue");
  const budgetChip = $("#budgetChip");
  const progressBar = $("#progressBar");
  const progressPct = $("#progressPct");
  const activeMonthLabel = $("#activeMonthLabel");

  // NEW: cumulative row
  const cumRow = $("#cumRow");
  const cumLabel = $("#cumLabel");
  const cumValue = $("#cumValue");

  // Expenses UI
  const expenseForm = $("#expenseForm");
  const categoryInput = $("#categoryInput");
  const amountInput = $("#amountInput");
  const dateInput = $("#dateInput");
  const expenseTbody = $("#expenseTbody");
  const monthTotal = $("#monthTotal");
  const expenseCountChip = $("#expenseCountChip");
  const viewChip = $("#viewChip");
  const totalLabel = $("#totalLabel");
  const totalHint = $("#totalHint");

  // Suggestions UI
  const suggestionsList = $("#suggestionsList");
  const refreshSuggestionsBtn = $("#refreshSuggestionsBtn");

  // Quote
  const quoteText = $("#quoteText");
  const quoteAuthor = $("#quoteAuthor");
  const newQuoteBtn = $("#newQuoteBtn");

  // Profile modal (current account)
  const profileModal = $("#profileModal");
  const editProfileBtn = $("#editProfileBtn");
  const profileForm = $("#profileForm");
  const profileName = $("#profileName");
  const profileBudget = $("#profileBudget");

  // Accounts modal
  const accountsModal = $("#accountsModal");
  const accountsList = $("#accountsList");
  const addAccountForm = $("#addAccountForm");
  const newAccountName = $("#newAccountName");
  const newAccountBudget = $("#newAccountBudget");

  // Reset
  const resetBtn = $("#resetBtn");

  // Toast
  const toast = $("#toast");

  // Calendar
  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  const calToday = $("#calToday");
  const calMonthLabel = $("#calMonthLabel");
  const calGrid = $("#calGrid");
  const calSelectedLabel = $("#calSelectedLabel");
  const clearSelectionBtn = $("#clearSelectionBtn");

  // Charts
  const trendCanvas = $("#trendChart");
  const categoryCanvas = $("#categoryChart");
  const chartMonthChip = $("#chartMonthChip");
  const trendTitle = $("#trendTitle");
  const categoryTitle = $("#categoryTitle");
  let trendChart = null;
  let categoryChart = null;

  // NEW: chart mode toggle
  const chartModeToggle = $("#chartModeToggle");
  const chartModeButtons = chartModeToggle ? Array.from(chartModeToggle.querySelectorAll(".seg")) : [];

  // Theme (in JS for charts)
  const DEFAULT_THEME_HEX = "#7c5cff";
  let THEME = { a: { h: 255, s: 100, l: 68 }, b: { h: 165, s: 100, l: 65 }, hex: DEFAULT_THEME_HEX };

  const fallbackQuotes = [
    { content: "Small hinges swing big doors.", author: "Proverb" },
    { content: "Discipline is kindness to your future self.", author: "Anonymous" },
    { content: "Progress loves consistency more than intensity.", author: "Anonymous" },
    { content: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  ];

  const currencyFmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

  // ---------- Helpers ----------
  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getMonthKey(dateStr) {
    return (dateStr || todayISO()).slice(0, 7); // YYYY-MM
  }

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

  function uid(prefix = "acc") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function initials(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "LW";
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function sumExpenses(expenses) {
    return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }

  function monthExpenses(acc, monthKey) {
    return acc.expenses.filter((e) => getMonthKey(e.date) === monthKey);
  }

  function dayExpenses(acc, dateStr) {
    return acc.expenses.filter((e) => e.date === dateStr);
  }

  function daysInMonthByKey(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }

  function dateForDayIndex(monthKey, dayIndex1Based) {
    return `${monthKey}-${String(dayIndex1Based).padStart(2, "0")}`;
  }

  // ---------- Theme ----------
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

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

  function hsla(c, a) {
    return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})`;
  }

  function applyThemeHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const a = rgbToHsl(rgb.r, rgb.g, rgb.b);
    // Secondary color: hue-shift for contrast
    const b = {
      h: (a.h + 140) % 360,
      s: clamp(a.s, 55, 100),
      l: clamp(a.l + 6, 45, 75),
    };

    THEME = { a, b, hex };

    // Push to CSS variables for UI
    const root = document.documentElement;
    root.style.setProperty("--a-h", a.h);
    root.style.setProperty("--a-s", `${a.s}%`);
    root.style.setProperty("--a-l", `${a.l}%`);
    root.style.setProperty("--b-h", b.h);
    root.style.setProperty("--b-s", `${b.s}%`);
    root.style.setProperty("--b-l", `${b.l}%`);
  }

  // ---------- Storage model ----------
  function defaultAccount(name, budget) {
    return {
      id: uid("acc"),
      profile: { name: name || "Account", monthlyBudget: Number(budget) || 0, monthlyIncome: 0 },
      expenses: [],
      ui: {
        calendarMonth: getMonthKey(todayISO()),
        selectedDate: null,
        chartMode: "daily" // NEW
      }
    };
  }

  function defaultStore() {
    const acc = defaultAccount("My Account", 0);
    return {
      version: 2,
      settings: { themeHex: DEFAULT_THEME_HEX },
      activeAccountId: acc.id,
      accounts: { [acc.id]: acc }
    };
  }

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

  function getActiveAccount(store) {
    if (!store || !store.accounts) return null;
    return store.accounts[store.activeAccountId] || null;
  }

  function ensureStoreIntegrity(store) {
    if (!store || !store.accounts || !Object.keys(store.accounts).length) return defaultStore();
    store.settings = store.settings || { themeHex: DEFAULT_THEME_HEX };
    if (!store.settings.themeHex) store.settings.themeHex = DEFAULT_THEME_HEX;

    if (!store.activeAccountId || !store.accounts[store.activeAccountId]) {
      store.activeAccountId = Object.keys(store.accounts)[0];
    }
    for (const id of Object.keys(store.accounts)) {
      const a = store.accounts[id];
      a.id = a.id || id;
      a.profile = a.profile || { name: "Account", monthlyBudget: 0, monthlyIncome: 0 };
      a.expenses = Array.isArray(a.expenses) ? a.expenses : [];
      a.ui = a.ui || { calendarMonth: getMonthKey(todayISO()), selectedDate: null, chartMode: "daily" };
      if (!a.ui.calendarMonth) a.ui.calendarMonth = getMonthKey(todayISO());
      if (!a.ui.chartMode) a.ui.chartMode = "daily"; // NEW
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

        if (legacy?.accounts && legacy?.activeAccountId) {
          legacy.settings = legacy.settings || { themeHex: DEFAULT_THEME_HEX };
          const migrated = ensureStoreIntegrity({ ...legacy, version: 2 });
          saveStore(migrated);
          return migrated;
        }

        const name = legacy?.profile?.name || "Migrated Account";
        const budget = legacy?.profile?.monthlyBudget || 0;

        const acc = defaultAccount(name, budget);
        acc.profile.monthlyIncome = legacy?.profile?.monthlyIncome || 0;
        acc.expenses = Array.isArray(legacy?.expenses) ? legacy.expenses : [];
        if (legacy?.ui) {
          acc.ui.calendarMonth = legacy.ui.calendarMonth || acc.ui.calendarMonth;
          acc.ui.selectedDate = legacy.ui.selectedDate || null;
        }

        const store = { version: 2, settings: { themeHex: DEFAULT_THEME_HEX }, activeAccountId: acc.id, accounts: { [acc.id]: acc } };
        saveStore(store);
        return store;
      } catch { /* ignore */ }
    }
    return null;
  }

  // ---------- Quotes ----------
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

  // ---------- Charts ----------
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

  function cumulativeFromDaily(daily) {
    const out = [];
    let run = 0;
    for (const v of daily) {
      run += (Number(v) || 0);
      out.push(run);
    }
    return out;
  }

  function buildCategorySeries(expenses) {
    const map = new Map();
    for (const e of expenses) {
      const c = e.category || "Other";
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

  function renderCharts(monthExp, focusExp, monthKey, selectedDate, budget, chartMode) {
    destroyCharts();

    const monthLabel = formatMonthLabel(monthKey);
    const series = buildMonthDailyTotals(monthKey, monthExp);

    // Header chips
    const modeLabel = chartMode === "cumulative" ? "Cumulative" : "Daily";
    chartMonthChip.textContent = `${monthLabel} • ${modeLabel}`;

    // Category title changes based on day selection
    if (selectedDate) {
      categoryTitle.textContent = "By category (selected day)";
    } else {
      categoryTitle.textContent = "By category (month)";
    }

    // Trend title changes based on mode
    trendTitle.textContent = chartMode === "cumulative"
      ? `Cumulative spend vs budget pace • ${monthLabel}`
      : `Daily spend • ${monthLabel}`;

    const axis = {
      ticks: { color: "rgba(255,255,255,0.65)" },
      grid: { color: "rgba(255,255,255,0.08)" }
    };

    const tooltipTitle = (items) => {
      const idx = items?.[0]?.dataIndex ?? 0;
      const dateStr = series.dates[idx] || "";
      return dateStr ? formatDateLabel(dateStr) : "";
    };

    if (chartMode === "cumulative") {
      const cumSpend = cumulativeFromDaily(series.daily);
      const dim = series.daily.length || 1;
      const cumBudget = (Number(budget) > 0)
        ? series.daily.map((_, i) => (Number(budget) || 0) * ((i + 1) / dim))
        : null;

      const datasets = [
        {
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
        }
      ];

      if (cumBudget) {
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
                  try { return currencyFmt.format(Number(v) || 0); }
                  catch { return v; }
                }
              }
            }
          }
        }
      });
    } else {
      // DAILY mode
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
            tooltip: {
              callbacks: {
                title: tooltipTitle,
                label: (ctx) => currencyFmt.format(ctx.parsed.y ?? 0)
              }
            }
          },
          scales: { x: axis, y: axis }
        }
      });
    }

    // Category chart always uses the "focus" set (day if selected, else month)
    const cat = buildCategorySeries(focusExp);
    categoryChart = new Chart(categoryCanvas, {
      type: "doughnut",
      data: {
        labels: cat.labels,
        datasets: [{
          label: "By category",
          data: cat.values,
          borderWidth: 1,
          backgroundColor: paletteFor(cat.labels)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.75)" } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.label}: ${currencyFmt.format(ctx.parsed)}` }
          }
        }
      }
    });
  }

  // ---------- Suggestions ----------
  function buildSuggestions(acc, monthKey, selectedDate) {
    const out = [];
    const budget = Number(acc.profile?.monthlyBudget) || 0;
    const income = Number(acc.profile?.monthlyIncome) || 0;

    const monthExp = monthExpenses(acc, monthKey);
    const spentMonth = sumExpenses(monthExp);

    const focusIsDay = !!(selectedDate && getMonthKey(selectedDate) === monthKey);
    const focusExp = focusIsDay ? dayExpenses(acc, selectedDate) : monthExp;
    const spentFocus = sumExpenses(focusExp);

    if (!monthExp.length) {
      out.push({
        title: "Start simple: log 3 categories for a week",
        body: "Tracking (even imperfectly) reveals patterns fast. Try logging just Food, Transport, and Other for 7 days — then refine.",
        meta: "Behavior > perfection."
      });
      return out;
    }

    if (budget > 0) {
      const remaining = budget - spentMonth;
      const pct = (spentMonth / budget) * 100;

      if (remaining < 0) {
        out.push({
          title: "Budget exceeded — switch to “damage control” mode",
          body: `You’re over by ${currencyFmt.format(Math.abs(remaining))}. For the rest of the month, pause non-essentials and aim for the smallest daily spend you can.`,
          meta: `Used ${pct.toFixed(1)}% of budget.`
        });
      } else if (pct >= 85) {
        out.push({
          title: "You’re in the last 15% of your budget",
          body: `Remaining: ${currencyFmt.format(remaining)}. Consider a “no-spend” day or two to keep the month clean.`,
          meta: `Used ${pct.toFixed(1)}% of budget.`
        });
      } else {
        out.push({
          title: "Keep your pace steady",
          body: `You’ve used ${pct.toFixed(1)}% of your budget. Remaining: ${currencyFmt.format(remaining)}.`,
          meta: "Steady pacing beats heroic last-minute fixes."
        });
      }
    } else {
      out.push({
        title: "Set a budget to unlock better guidance",
        body: "Budget = the dashboard’s north star. Add one (even approximate) to get stronger suggestions and progress tracking.",
        meta: "You can edit budget from the sidebar."
      });
    }

    const catMap = new Map();
    for (const e of monthExp) {
      const c = e.category || "Other";
      catMap.set(c, (catMap.get(c) || 0) + (Number(e.amount) || 0));
    }
    const total = spentMonth || 1;
    const top = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];

    if (top) {
      const share = (top[1] / total) * 100;
      if (share >= 40) {
        out.push({
          title: `Biggest driver: ${top[0]}`,
          body: `${top[0]} is ${share.toFixed(1)}% of spending this month (${currencyFmt.format(top[1])}). If you cut it by 10–15%, you’ll feel it immediately.`,
          meta: "Tiny % cuts on the biggest category = real savings."
        });
      } else {
        out.push({
          title: "Your spending is nicely diversified",
          body: `Top category is ${top[0]} at ${share.toFixed(1)}%. That’s usually easier to control than “all eggs in one basket.”`,
          meta: "Keep categories visible; visibility is leverage."
        });
      }
    }

    const small = monthExp.filter(e => (Number(e.amount) || 0) > 0 && (Number(e.amount) || 0) <= 5);
    if (small.length >= 8) {
      out.push({
        title: "Watch the “small leaks”",
        body: `You have ${small.length} expenses ≤ ${currencyFmt.format(5)} this month. Consider batching them (or setting a weekly cap) to reduce friction spending.`,
        meta: "Small + frequent = sneaky."
      });
    }

    if (income > 0) {
      const potential = income - spentMonth;
      if (potential > 0) {
        out.push({
          title: "Potential savings (income − spend)",
          body: `Based on income, you could save about ${currencyFmt.format(potential)} this month. Consider moving a portion to savings early (pay yourself first).`,
          meta: "Automation beats willpower."
        });
      } else {
        out.push({
          title: "Income is being fully consumed",
          body: "This month’s spend is at/above income. If that repeats, it’s worth identifying one category to trim or a fixed weekly cap.",
          meta: "Awareness is step one."
        });
      }
    }

    if (focusIsDay) {
      out.push({
        title: "Day snapshot",
        body: `Total for ${formatDateLabel(selectedDate)}: ${currencyFmt.format(spentFocus)}. If this was a “heavy day”, balance it with a lighter day tomorrow.`,
        meta: "One day doesn’t define a month."
      });
    }

    return out.slice(0, 6);
  }

  function renderSuggestions(acc, monthKey, selectedDate) {
    const items = buildSuggestions(acc, monthKey, selectedDate);

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

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- UI bits ----------
  function setChipByRemaining(remaining, budget) {
    if (budget <= 0) {
      budgetChip.textContent = "Set a budget";
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

  function renderExpensesTable(expenses, onDelete) {
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    expenseTbody.innerHTML = "";

    for (const e of sorted) {
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

  function animateCardPulse(sel) {
    if (!window.gsap) return;
    gsap.fromTo(sel, { scale: 0.99 }, { scale: 1, duration: 0.35, ease: "power2.out" });
  }

  function closeSidebarMobile() { document.body.classList.remove("sidebar-open"); }
  function openSidebarMobile() { document.body.classList.add("sidebar-open"); }

  // ---------- Calendar ----------
  function addMonths(monthKey, delta) {
    const d = monthKeyToDate(monthKey);
    d.setMonth(d.getMonth() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function renderCalendar(acc) {
    const monthKey = acc.ui?.calendarMonth || getMonthKey(todayISO());
    const selectedDate = acc.ui?.selectedDate || null;

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

  // ---------- Accounts UI ----------
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

      const row = document.createElement("div");
      row.className = "acc-row";

      const meta = document.createElement("div");
      meta.className = "acc-meta";

      const name = document.createElement("div");
      name.className = "acc-name";
      name.textContent = acc.profile?.name || "Account";

      const sub = document.createElement("div");
      sub.className = "acc-sub";
      const b = Number(acc.profile?.monthlyBudget) || 0;
      const n = acc.expenses?.length || 0;
      sub.textContent = `Budget: ${currencyFmt.format(b)} • Entries: ${n}`;

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

  // ---------- Views ----------
  function goToDashboard() {
    welcomeView.classList.add("hidden");
    dashboardView.classList.remove("hidden");

    if (window.gsap) {
      gsap.set(["#sidebar", ".topbar", ".card"], { opacity: 0, y: 14 });
      gsap.to("#sidebar", { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" });
      gsap.to(".topbar", { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", delay: 0.05 });
      gsap.to(".card", { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.06, delay: 0.08 });
    }
  }

  function goToWelcome() {
    dashboardView.classList.add("hidden");
    welcomeView.classList.remove("hidden");
  }

  function wireModalClose(modalEl) {
    modalEl.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close === "true") modalEl.classList.add("hidden");
      if (t && t.classList && t.classList.contains("modal-backdrop")) modalEl.classList.add("hidden");
    });
  }

  function openProfileModal() {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    profileName.value = acc.profile?.name || "";
    profileBudget.value = acc.profile?.monthlyBudget ? String(acc.profile.monthlyBudget) : "";
    profileModal.classList.remove("hidden");

    if (window.gsap) {
      gsap.fromTo("#profileModal .modal-panel",
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" }
      );
    }
  }

  // ---------- Main render ----------
  function rerenderAll(store) {
    store = ensureStoreIntegrity(store);

    // Apply theme & sync picker
    applyThemeHex(store.settings.themeHex || DEFAULT_THEME_HEX);
    if (themeColorInput) themeColorInput.value = THEME.hex;

    const acc = getActiveAccount(store);
    if (!acc) return;

    // Identity
    const name = acc.profile?.name || "friend";
    helloName.textContent = name;
    avatarInitials.textContent = initials(name);

    // Income
    incomeInput.value = acc.profile?.monthlyIncome ? String(acc.profile.monthlyIncome) : "";

    // Month selection
    const monthKey = acc.ui?.calendarMonth || getMonthKey(todayISO());
    const selectedDate = acc.ui?.selectedDate || null;

    const monthExp = monthExpenses(acc, monthKey);
    const spentMonth = sumExpenses(monthExp);

    const budget = Number(acc.profile?.monthlyBudget) || 0;
    const remaining = Math.max(0, budget - spentMonth);

    // Budget card
    activeMonthLabel.textContent = formatMonthLabel(monthKey);
    budgetValue.textContent = currencyFmt.format(budget);
    spentValue.textContent = currencyFmt.format(spentMonth);
    remainingValue.textContent = currencyFmt.format(remaining);
    setChipByRemaining(remaining, budget);

    let pct = 0;
    if (budget > 0) pct = Math.max(0, Math.min(100, (remaining / budget) * 100));
    progressBar.style.width = `${pct.toFixed(1)}%`;
    progressPct.textContent = `${pct.toFixed(1)}% left`;

    // NEW: cumulative row when a day is selected (within the viewed month)
    const isDayInMonth = !!(selectedDate && getMonthKey(selectedDate) === monthKey);
    if (isDayInMonth) {
      const dim = daysInMonthByKey(monthKey);
      const dayN = Number(String(selectedDate).slice(8, 10));
      const cumSpent = monthExp
        .filter(e => String(e.date) <= String(selectedDate))
        .reduce((a, e) => a + (Number(e.amount) || 0), 0);

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

    // Focus list (day vs month)
    let focusExp = monthExp;
    let focusLabel = formatMonthLabel(monthKey);
    let focusSelected = null;

    if (isDayInMonth) {
      focusExp = dayExpenses(acc, selectedDate);
      focusLabel = formatDateLabel(selectedDate);
      focusSelected = selectedDate;
      totalLabel.textContent = "Day total";
      totalHint.textContent = "You’re viewing a single day. Clear day to see the whole month.";
      viewChip.textContent = `Viewing: ${focusLabel}`;
      dateInput.value = selectedDate;
    } else {
      totalLabel.textContent = "Month total";
      totalHint.textContent = "You’re viewing the selected month. Tap a day to zoom in.";
      viewChip.textContent = `Viewing: ${focusLabel}`;
      if (!dateInput.value) dateInput.value = todayISO();
    }

    monthTotal.textContent = currencyFmt.format(sumExpenses(focusExp));

    renderExpensesTable(focusExp, (id) => {
      const s = ensureStoreIntegrity(loadStore());
      const a = getActiveAccount(s);
      if (!a) return;
      a.expenses = a.expenses.filter((e) => e.id !== id);
      saveStore(s);
      rerenderAll(s);
      showToast("Expense deleted.");
      animateCardPulse("#cardExpenses");
    });

    // NEW: chart mode (stored per account)
    const chartMode = acc.ui?.chartMode || "daily";
    chartModeButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === chartMode);
    });

    renderCharts(monthExp, focusExp, monthKey, focusSelected, budget, chartMode);
    renderCalendar(acc);
    renderSuggestions(acc, monthKey, selectedDate);

    renderAccountSelect(store);
  }

  // ---------- Events ----------
  welcomeForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const budget = Number(monthlyBudgetInput.value);

    if (!name || !Number.isFinite(budget) || budget <= 0) {
      showToast("Please enter a valid name and budget.");
      return;
    }

    const acc = defaultAccount(name, budget);
    const store = { version: 2, settings: { themeHex: DEFAULT_THEME_HEX }, activeAccountId: acc.id, accounts: { [acc.id]: acc } };
    saveStore(store);

    if (window.gsap) {
      gsap.to(".welcome-card", {
        opacity: 0, y: -10, duration: 0.35, ease: "power2.inOut",
        onComplete: () => {
          goToDashboard();
          rerenderAll(store);
          renderQuote();
          showToast("Welcome to Lumina Wealth.");
        }
      });
    } else {
      goToDashboard();
      rerenderAll(store);
      renderQuote();
      showToast("Welcome to Lumina Wealth.");
    }
  });

  // Sidebar mobile
  sidebarToggle.addEventListener("click", () => openSidebarMobile());
  sidebarBackdrop.addEventListener("click", () => closeSidebarMobile());

  // NEW: Chart mode toggle events
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
      showToast(mode === "cumulative" ? "Cumulative view enabled." : "Daily view enabled.");
    });
  }

  // Account switching
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
  editProfileBtn.addEventListener("click", () => openProfileModal());

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = profileName.value.trim();
    const newBudget = Number(profileBudget.value);

    if (!newName || !Number.isFinite(newBudget) || newBudget <= 0) {
      showToast("Please enter a valid name and budget.");
      return;
    }

    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    acc.profile.name = newName;
    acc.profile.monthlyBudget = newBudget;

    saveStore(store);
    rerenderAll(store);

    profileModal.classList.add("hidden");
    showToast("Account updated.");
  });

  // Add account
  addAccountForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = newAccountName.value.trim();
    const budget = Number(newAccountBudget.value);

    if (!name || !Number.isFinite(budget) || budget <= 0) {
      showToast("Enter a valid account name and budget.");
      return;
    }

    const store = ensureStoreIntegrity(loadStore());
    const acc = defaultAccount(name, budget);

    store.accounts[acc.id] = acc;
    store.activeAccountId = acc.id;

    saveStore(store);
    renderAccountSelect(store);
    renderAccountsModal(store);
    rerenderAll(store);

    newAccountName.value = "";
    newAccountBudget.value = "";
    showToast("Account created & activated.");
    closeAccountsModal();
  });

  // Income
  incomeInput.addEventListener("input", () => {
    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    const v = Number(incomeInput.value);
    acc.profile.monthlyIncome = Number.isFinite(v) && v >= 0 ? v : 0;

    saveStore(store);
    rerenderAll(store);
    animateCardPulse("#cardBudget");
  });

  // Expense add
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = categoryInput.value;
    const amount = Number(amountInput.value);
    const date = dateInput.value;

    if (!category || !Number.isFinite(amount) || amount <= 0 || !date) {
      showToast("Please enter category, valid amount, and date.");
      return;
    }

    const store = ensureStoreIntegrity(loadStore());
    const acc = getActiveAccount(store);
    if (!acc) return;

    acc.expenses.push({ id: uid("exp"), category, amount, date });

    // Jump calendar to that month; keep selection aligned if a day is selected
    acc.ui.calendarMonth = getMonthKey(date);
    if (acc.ui.selectedDate) acc.ui.selectedDate = date;

    saveStore(store);
    rerenderAll(store);

    amountInput.value = "";
    showToast("Expense added.");
    closeSidebarMobile();

    if (window.gsap) {
      gsap.fromTo("#cardExpenses", { y: 0 }, { y: -3, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out" });
    }
  });

  // Quote refresh
  newQuoteBtn.addEventListener("click", () => renderQuote());

  // Suggestions refresh
  refreshSuggestionsBtn.addEventListener("click", () => {
    const store = ensureStoreIntegrity(loadStore());
    rerenderAll(store);
    showToast("Suggestions refreshed.");
  });

  // Theme change
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

  // Reset everything
  resetBtn.addEventListener("click", () => {
    const ok = confirm("Reset ALL accounts and data? This cannot be undone.");
    if (!ok) return;

    localStorage.removeItem(STORAGE_KEY);
    destroyCharts();
    showToast("All data cleared.");
    closeSidebarMobile();
    goToWelcome();

    const card = document.querySelector(".welcome-card");
    if (card) { card.style.opacity = ""; card.style.transform = ""; }
  });

  // Calendar controls
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

  // Close modals on backdrop
  wireModalClose(profileModal);
  wireModalClose(accountsModal);

  // ESC closes modals + mobile sidebar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      profileModal.classList.add("hidden");
      accountsModal.classList.add("hidden");
      closeSidebarMobile();
    }
  });

  // ---------- Init ----------
  function init() {
    const migrated = tryMigrateLegacy();
    let store = migrated || loadStore();
    if (store) store = ensureStoreIntegrity(store);

    // Apply saved theme early
    const themeHex = store?.settings?.themeHex || DEFAULT_THEME_HEX;
    applyThemeHex(themeHex);
    if (themeColorInput) themeColorInput.value = themeHex;

    if (store && getActiveAccount(store)?.profile?.monthlyBudget > 0) {
      goToDashboard();
      renderAccountSelect(store);
      rerenderAll(store);
      renderQuote();
    } else {
      goToWelcome();
      if (window.gsap) {
        gsap.fromTo(".welcome-card", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
      }
    }
  }

  init();
})();
