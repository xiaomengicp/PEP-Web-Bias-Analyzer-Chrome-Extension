// popup.js — Settings popup logic

const BIAS_DEFINITIONS = {
    gender: {
        label: "Gender Bias",
        theory: "Feminist Theory",
        color: "#E879A0",
    },
    heteronormativity: {
        label: "Heteronormativity",
        theory: "Queer Theory",
        color: "#A78BFA",
    },
    trans_erasure: {
        label: "Trans Erasure / Cisnormativity",
        theory: "Trans Theory",
        color: "#60A5FA",
    },
    race: {
        label: "Racial Bias",
        theory: "Critical Race Theory",
        color: "#FB923C",
    },
    colonial: {
        label: "Colonial / Postcolonial Bias",
        theory: "Postcolonial Theory",
        color: "#34D399",
    },
    eurocentric: {
        label: "Eurocentric / Cultural Bias",
        theory: "Decolonial Thought",
        color: "#FBBF24",
    },
    class: {
        label: "Class & Socioeconomic Bias",
        theory: "Marxist Psychoanalysis",
        color: "#F87171",
    },
    ableism: {
        label: "Ableism / Neuronormativity",
        theory: "Disability Studies",
        color: "#94A3B8",
    },
    phallocentrism: {
        label: "Phallocentrism",
        theory: "Lacanian Critique",
        color: "#C084FC",
    },
    pathologization: {
        label: "Pathologization of Difference",
        theory: "Foucauldian",
        color: "#2DD4BF",
    },
};

const DEFAULT_SETTINGS = {
    apiKey: "",
    model: "claude-sonnet-4-5",
    customModel: "",
    enabledBiases: Object.keys(BIAS_DEFINITIONS),
};

// ─── Init ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    const settings = await getSettings();
    populateForm(settings);
    renderBiasGrid(settings.enabledBiases);
    bindEvents();
});

async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
    });
}

function populateForm(settings) {
    document.getElementById("api-key").value = settings.apiKey || "";
    document.getElementById("model-custom").value = settings.customModel || "";

    const modelSelect = document.getElementById("model-select");
    const knownValues = Array.from(modelSelect.options).map((o) => o.value);
    if (knownValues.includes(settings.model)) {
        modelSelect.value = settings.model;
    } else {
        modelSelect.value = "claude-sonnet-4-5";
    }
}

// ─── Bias Grid ────────────────────────────────────────────────────────────

function renderBiasGrid(enabledBiases) {
    const grid = document.getElementById("bias-grid");
    grid.innerHTML = Object.entries(BIAS_DEFINITIONS)
        .map(([key, def]) => {
            const checked = enabledBiases.includes(key);
            return `
      <label class="bias-item ${checked ? "bias-item-active" : ""}" data-key="${key}" style="--item-color: ${def.color}">
        <input type="checkbox" class="bias-checkbox" data-key="${key}" ${checked ? "checked" : ""} />
        <div class="bias-item-body">
          <span class="bias-item-label">${def.label}</span>
          <span class="bias-item-theory">${def.theory}</span>
        </div>
        <div class="bias-color-dot" style="background: ${def.color}"></div>
      </label>
    `;
        })
        .join("");

    // Toggle active class on click
    grid.querySelectorAll(".bias-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
            const label = cb.closest(".bias-item");
            label.classList.toggle("bias-item-active", cb.checked);
        });
    });
}

function getEnabledBiases() {
    return Array.from(document.querySelectorAll(".bias-checkbox:checked")).map(
        (cb) => cb.dataset.key
    );
}

// ─── Events ───────────────────────────────────────────────────────────────

function bindEvents() {
    // Show/hide API key
    const toggleBtn = document.getElementById("toggle-key-btn");
    toggleBtn.addEventListener("click", () => {
        const input = document.getElementById("api-key");
        const eyeShow = document.getElementById("eye-show");
        const eyeHide = document.getElementById("eye-hide");
        if (input.type === "password") {
            input.type = "text";
            eyeShow.style.display = "none";
            eyeHide.style.display = "";
        } else {
            input.type = "password";
            eyeShow.style.display = "";
            eyeHide.style.display = "none";
        }
    });

    // Select/deselect all biases
    document.getElementById("select-all-btn").addEventListener("click", () => {
        document.querySelectorAll(".bias-checkbox").forEach((cb) => {
            cb.checked = true;
            cb.closest(".bias-item").classList.add("bias-item-active");
        });
    });

    document.getElementById("deselect-all-btn").addEventListener("click", () => {
        document.querySelectorAll(".bias-checkbox").forEach((cb) => {
            cb.checked = false;
            cb.closest(".bias-item").classList.remove("bias-item-active");
        });
    });

    // Test connection
    document.getElementById("test-btn").addEventListener("click", async () => {
        const apiKey = document.getElementById("api-key").value.trim();
        const model = getModel();
        setStatus("loading", "Testing…");
        const result = await chrome.runtime.sendMessage({
            action: "testConnection",
            apiKey,
            model,
        });
        if (result.success) {
            setStatus("success", result.message || "Connected!");
        } else {
            setStatus("error", result.message || "Connection failed.");
        }
    });

    // Save settings
    document.getElementById("save-btn").addEventListener("click", saveSettings);
}

function getModel() {
    const custom = document.getElementById("model-custom").value.trim();
    if (custom) return custom;
    return document.getElementById("model-select").value;
}

async function saveSettings() {
    const apiKey = document.getElementById("api-key").value.trim();
    const model = getModel();
    const customModel = document.getElementById("model-custom").value.trim();
    const enabledBiases = getEnabledBiases();

    await chrome.storage.sync.set({ apiKey, model, customModel, enabledBiases });
    showToast("Settings saved ✓");
}

// ─── Status Indicator ─────────────────────────────────────────────────────

function setStatus(state, message) {
    const indicator = document.getElementById("status-indicator");
    const dot = document.getElementById("status-dot");
    const text = document.getElementById("status-text");

    indicator.className = "status-indicator";
    dot.className = "";

    if (state === "loading") {
        dot.className = "dot-loading";
        indicator.classList.add("status-visible");
    } else if (state === "success") {
        dot.className = "dot-success";
        indicator.classList.add("status-visible");
    } else if (state === "error") {
        dot.className = "dot-error";
        indicator.classList.add("status-visible");
    } else {
        indicator.classList.remove("status-visible");
    }

    text.textContent = message || "";
}

// ─── Toast ────────────────────────────────────────────────────────────────

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("toast-visible");
    setTimeout(() => toast.classList.remove("toast-visible"), 2500);
}
