// background.js — Service Worker for PEP-Web Bias Analyzer
// Handles Claude API calls securely, away from content script

importScripts("prompts/bias_prompts.js");

// Default settings
const DEFAULT_SETTINGS = {
    apiKey: "",
    model: "claude-sonnet-4-5",
    enabledBiases: [
        "gender",
        "heteronormativity",
        "trans_erasure",
        "race",
        "colonial",
        "eurocentric",
        "class",
        "ableism",
        "phallocentrism",
        "pathologization",
    ],
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "analyze") {
        handleAnalysis(message.text)
            .then((result) => sendResponse(result))
            .catch((err) =>
                sendResponse({ success: false, error: err.message })
            );
        return true; // Keep message channel open for async response
    }

    if (message.action === "testConnection") {
        testConnection(message.apiKey, message.model)
            .then((result) => sendResponse(result))
            .catch((err) =>
                sendResponse({ success: false, error: err.message })
            );
        return true;
    }

    if (message.action === "getSettings") {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
            sendResponse({ success: true, settings });
        });
        return true;
    }
});

async function handleAnalysis(selectedText) {
    // Fetch current settings
    const settings = await new Promise((resolve) =>
        chrome.storage.sync.get(DEFAULT_SETTINGS, resolve)
    );

    if (!settings.apiKey || settings.apiKey.trim() === "") {
        return {
            success: false,
            error: "NO_API_KEY",
            message:
                "Please configure your Claude API key in the extension settings.",
        };
    }

    if (!selectedText || selectedText.trim().length < 50) {
        return {
            success: false,
            error: "TEXT_TOO_SHORT",
            message:
                "Please select a longer passage (at least a sentence or two) for meaningful analysis.",
        };
    }

    const prompt = buildPrompt(selectedText, settings.enabledBiases);

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": settings.apiKey.trim(),
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: settings.model,
                max_tokens: 2000,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg =
                errorData?.error?.message || `API Error: ${response.status}`;
            return { success: false, error: "API_ERROR", message: errorMsg };
        }

        const data = await response.json();
        const rawText = data.content?.[0]?.text || "[]";

        // Parse JSON response from Claude
        let results;
        try {
            // Strip markdown code fences if Claude inadvertently adds them
            const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
            results = JSON.parse(cleaned);
        } catch (e) {
            return {
                success: false,
                error: "PARSE_ERROR",
                message: "The AI returned an unexpected format. Please try again.",
            };
        }

        // Enrich results with display info from BIAS_DEFINITIONS
        const enriched = results.map((item) => ({
            ...item,
            ...(BIAS_DEFINITIONS[item.category] || {
                label: item.category,
                theory: "Unknown",
                color: "#6B7280",
            }),
        }));

        return { success: true, results: enriched, model: settings.model };
    } catch (err) {
        return {
            success: false,
            error: "NETWORK_ERROR",
            message: `Network error: ${err.message}. Check your connection.`,
        };
    }
}

async function testConnection(apiKey, model) {
    if (!apiKey || apiKey.trim() === "") {
        return { success: false, message: "API key is empty." };
    }

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey.trim(),
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: model || DEFAULT_SETTINGS.model,
                max_tokens: 10,
                messages: [{ role: "user", content: "Hi" }],
            }),
        });

        if (response.ok) {
            return { success: true, message: "Connection successful!" };
        } else {
            const err = await response.json().catch(() => ({}));
            return {
                success: false,
                message: err?.error?.message || `Error ${response.status}`,
            };
        }
    } catch (err) {
        return { success: false, message: `Network error: ${err.message}` };
    }
}
