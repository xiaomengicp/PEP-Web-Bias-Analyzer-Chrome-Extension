// content_script.js — Injected into PEP-Web pages
// Handles text selection, floating bubble, and results panel

(function () {
  "use strict";

  // Prevent double-injection
  if (window.__pepBiasAnalyzerLoaded) {
    console.log("[PEP Bias Analyzer] Already loaded on this frame, skipping.");
    return;
  }
  window.__pepBiasAnalyzerLoaded = true;
  console.log("[PEP Bias Analyzer] Content script injected on:", window.location.href);

  let bubble = null;
  let panel = null;
  let currentSelection = "";

  // ─── Floating Action Bubble ───────────────────────────────────────────────

  function createBubble() {
    const el = document.createElement("div");
    el.id = "pba-bubble";
    el.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <span>Analyze Bias</span>
    `;
    el.addEventListener("click", onAnalyzeClick);
    document.body.appendChild(el);
    return el;
  }

  function showBubble(x, y) {
    if (!bubble) bubble = createBubble();
    // Position right below selection, clamped to viewport
    const bw = 140;
    const left = Math.min(x, window.innerWidth - bw - 16);
    bubble.style.left = `${left + window.scrollX}px`;
    bubble.style.top = `${y + window.scrollY + 10}px`;
    bubble.classList.add("pba-visible");
  }

  function hideBubble() {
    if (bubble) bubble.classList.remove("pba-visible");
  }

  // ─── Text Selection Listener ──────────────────────────────────────────────

  let lastMouseX = 100;
  let lastMouseY = 100;

  document.addEventListener("mousemove", (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    // Small delay to let selection finalize
    setTimeout(() => {
      try {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          console.log("[PEP Bias Analyzer] mouseup: no selection / rangeCount=0");
          hideBubble();
          return;
        }
        const text = sel.toString().trim();
        console.log("[PEP Bias Analyzer] mouseup: selected text length =", text.length, "| text:", text.substring(0, 60));
        if (text.length > 20) {
          currentSelection = text;
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          console.log("[PEP Bias Analyzer] rect:", rect.left, rect.bottom, rect.width, rect.height);
          // If rect is zero (e.g. selection inside an iframe), fall back to mouse position
          if (rect.width === 0 && rect.height === 0) {
            console.log("[PEP Bias Analyzer] rect is zero, using mouse position:", lastMouseX, lastMouseY);
            showBubble(lastMouseX, lastMouseY);
          } else {
            showBubble(rect.left, rect.bottom);
          }
        } else {
          currentSelection = "";
          hideBubble();
        }
      } catch (err) {
        console.log("[PEP Bias Analyzer] selection error:", err);
        hideBubble();
      }
    }, 80);
  });

  // Hide bubble when clicking elsewhere (panel may not exist yet)
  document.addEventListener("mousedown", (e) => {
    const clickedBubble = bubble && bubble.contains(e.target);
    const clickedPanel = panel && panel.contains(e.target);
    if (!clickedBubble && !clickedPanel) {
      hideBubble();
    }
  });

  // ─── Analyze Click Handler ────────────────────────────────────────────────

  function onAnalyzeClick() {
    hideBubble();
    // Clear selection so the subsequent mouseup doesn't re-show the bubble
    window.getSelection()?.removeAllRanges();
    showPanel();
    setLoading(true);

    chrome.runtime.sendMessage(
      { action: "analyze", text: currentSelection },
      (response) => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          showError("Extension error. Please reload the page.");
          return;
        }
        if (!response) {
          showError("No response from extension. Please try again.");
          return;
        }
        if (!response.success) {
          handleError(response);
          return;
        }
        renderResults(response.results, response.model);
      }
    );
  }

  // ─── Side Panel ───────────────────────────────────────────────────────────

  function createPanel() {
    const el = document.createElement("div");
    el.id = "pba-panel";
    el.innerHTML = `
      <div id="pba-panel-header">
        <div id="pba-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          PEP-Web Bias Analyzer
        </div>
        <button id="pba-close-btn" aria-label="Close panel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div id="pba-panel-body">
        <div id="pba-loading" class="pba-hidden">
          <div class="pba-spinner"></div>
          <p>Analyzing with Claude AI…</p>
        </div>
        <div id="pba-results"></div>
      </div>
      <div id="pba-panel-footer">
        <a href="#" id="pba-settings-link">⚙ Settings</a>
        <span id="pba-model-badge"></span>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelector("#pba-close-btn").addEventListener("click", closePanel);
    el.querySelector("#pba-settings-link").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: "openSettings" });
    });

    return el;
  }

  function showPanel() {
    if (!panel) panel = createPanel();
    panel.classList.add("pba-panel-open");
    document.body.classList.add("pba-body-shifted");
  }

  function closePanel() {
    if (panel) panel.classList.remove("pba-panel-open");
    document.body.classList.remove("pba-body-shifted");
  }

  // ─── Loading State ────────────────────────────────────────────────────────

  function setLoading(state) {
    if (!panel) return;
    const loading = panel.querySelector("#pba-loading");
    const results = panel.querySelector("#pba-results");
    if (state) {
      loading.classList.remove("pba-hidden");
      results.innerHTML = "";
    } else {
      loading.classList.add("pba-hidden");
    }
  }

  // ─── Render Results ───────────────────────────────────────────────────────

  function renderResults(results, model) {
    if (!panel) return;
    const resultsEl = panel.querySelector("#pba-results");
    const modelBadge = panel.querySelector("#pba-model-badge");

    if (model) modelBadge.textContent = model;

    if (!results || results.length === 0) {
      resultsEl.innerHTML = `
        <div class="pba-empty">
          <div class="pba-empty-icon">✓</div>
          <p>No significant biases identified in the selected text.</p>
          <p class="pba-empty-sub">The passage appears relatively neutral across the analyzed categories.</p>
        </div>
      `;
      return;
    }

    const severityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...results].sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
    );

    resultsEl.innerHTML = `
      <div class="pba-summary-bar">
        <span class="pba-count">${results.length} bias ${results.length === 1 ? "pattern" : "patterns"} identified</span>
        <div class="pba-severity-pills">
          ${renderSeverityCounts(results)}
        </div>
      </div>
      ${sorted.map(renderBiasCard).join("")}
    `;
  }

  function renderSeverityCounts(results) {
    const counts = { high: 0, medium: 0, low: 0 };
    results.forEach((r) => {
      if (counts[r.severity] !== undefined) counts[r.severity]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(
        ([k, v]) =>
          `<span class="pba-pill pba-pill-${k}">${v} ${k}</span>`
      )
      .join("");
  }

  function renderBiasCard(item) {
    const color = item.color || "#6B7280";
    const confidenceBadge =
      item.confidence === "low"
        ? `<span class="pba-conf-low" title="Low confidence — treat with caution">low confidence</span>`
        : "";

    return `
      <div class="pba-card" style="--card-color: ${color}">
        <div class="pba-card-header">
          <div class="pba-card-titles">
            <span class="pba-card-label">${escapeHtml(item.label || item.category)}</span>
            ${confidenceBadge}
          </div>
          <span class="pba-theory-badge">${escapeHtml(item.theory || "")}</span>
        </div>
        <div class="pba-severity-row">
          <div class="pba-severity-dots">
            <span class="pba-dot ${item.severity === "high" || item.severity === "medium" || item.severity === "low" ? "pba-dot-active" : ""}"></span>
            <span class="pba-dot ${item.severity === "high" || item.severity === "medium" ? "pba-dot-active" : ""}"></span>
            <span class="pba-dot ${item.severity === "high" ? "pba-dot-active" : ""}"></span>
          </div>
          <span class="pba-severity-label pba-severity-${item.severity}">${item.severity} severity</span>
        </div>
        ${item.quote ? `<blockquote class="pba-quote">"${escapeHtml(item.quote)}"</blockquote>` : ""}
        <p class="pba-explanation">${escapeHtml(item.explanation || "")}</p>
      </div>
    `;
  }

  // ─── Error States ─────────────────────────────────────────────────────────

  function handleError(response) {
    if (response.error === "NO_API_KEY") {
      showActionError(
        "API Key Required",
        "Configure your Claude API key to start analyzing.",
        "Open Settings",
        () => chrome.runtime.sendMessage({ action: "openSettings" })
      );
    } else if (response.error === "TEXT_TOO_SHORT") {
      showError(response.message);
    } else {
      showError(response.message || "An unexpected error occurred.");
    }
  }

  function showError(message) {
    if (!panel) return;
    const resultsEl = panel.querySelector("#pba-results");
    resultsEl.innerHTML = `
      <div class="pba-error">
        <div class="pba-error-icon">⚠</div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function showActionError(title, message, actionLabel, actionFn) {
    if (!panel) return;
    const resultsEl = panel.querySelector("#pba-results");
    resultsEl.innerHTML = `
      <div class="pba-error pba-error-action">
        <div class="pba-error-icon">🔑</div>
        <p class="pba-error-title">${escapeHtml(title)}</p>
        <p>${escapeHtml(message)}</p>
        <button class="pba-action-btn" id="pba-action-btn-inner">${escapeHtml(actionLabel)}</button>
      </div>
    `;
    panel
      .querySelector("#pba-action-btn-inner")
      .addEventListener("click", actionFn);
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
