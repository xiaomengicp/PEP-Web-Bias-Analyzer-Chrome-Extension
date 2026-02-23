# PEP-Web Bias Analyzer

**A Chrome extension for critical theory analysis of psychoanalytic texts on PEP-Web.**

Select any passage on [PEP-Web](https://www.pep-web.org/), click "Analyze Bias," and Claude AI will identify ideological blind spots through the lenses of Feminist, Queer, Trans, Postcolonial, Critical Race, and other critical theories.

> **Open source · Bring your own API key · No data sent anywhere except Anthropic's API**

---

## Features

- 🔍 **Text selection** — highlight any passage on PEP-Web, get a floating "Analyze Bias" button
- 📋 **Side panel results** — slides in from the right with color-coded analysis cards
- 🧠 **10 bias categories** — individually togglable
- ⚙️ **Settings popup** — configure your Claude API key, model, and active categories
- 🔑 **Privacy-first** — your API key is stored locally in `chrome.storage.sync` only

---

## Bias Categories

| Category | Theoretical Framework |
|---|---|
| Gender Bias | Feminist Theory |
| Heteronormativity | Queer Theory (Butler, Sedgwick) |
| Trans Erasure / Cisnormativity | Trans Theory (Stone, Stryker) |
| Racial Bias | Critical Race Theory |
| Colonial / Postcolonial Bias | Postcolonial Theory (Said, Spivak, Fanon) |
| Eurocentric / Cultural Bias | Cultural Studies / Decolonial Thought |
| Class & Socioeconomic Bias | Marxist / Materialist Psychoanalysis |
| Ableism / Neuronormativity | Disability Studies / Mad Studies |
| Phallocentrism | Lacanian Critique / Irigaray |
| Pathologization of Difference | Foucauldian / Anti-Psychiatry |

---

## Installation

### Prerequisites
- Google Chrome (or any Chromium-based browser)
- A [Claude API key](https://console.anthropic.com/account/keys) from Anthropic

### Load the Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `pepweb brower plugin` folder
6. The extension icon will appear in your toolbar

### Configure

1. Click the extension icon in the toolbar
2. Enter your Claude API key
3. Select your preferred model (Sonnet recommended)
4. Toggle which bias categories to analyze
5. Click **Save Settings**
6. Click **Test Connection** to verify your key works

---

## Usage

1. Navigate to any article on [PEP-Web](https://www.pep-web.org/)
2. Select 1–5 sentences of text
3. A **"Analyze Bias"** bubble appears near your selection
4. Click it — the analysis panel slides in from the right
5. Results show as cards per identified bias, with:
   - Severity (low / medium / high)
   - Quoted evidence from the text
   - Theoretical explanation

---

## Models

Default: `claude-sonnet-4-5`

You can also use:
- `claude-haiku-4-5` — faster and cheaper
- `claude-opus-4-5` — most capable, slower
- Any other Claude model by entering a custom model ID in settings

---

## Technical Architecture

```
manifest.json          — Chrome Extension Manifest V3
background.js          — Service Worker: Claude API calls, message routing
content_script.js      — Injected into PEP-Web: text selection, panel UI
content_style.css      — Panel and bubble styles
prompts/
  bias_prompts.js      — AI prompt templates and bias definitions
popup/
  popup.html           — Settings UI
  popup.js             — Settings logic, chrome.storage.sync
  popup.css            — Settings styles
```

---

## Contributing

Contributions are welcome! Areas where help is especially valuable:

- **Prompt refinement** — improving the theoretical precision of bias detection
- **New bias categories** — e.g., ageism, religious bias, settler colonialism
- **Multilingual support** — Chinese, French, German UI and analysis output
- **UI improvements** — accessibility, keyboard navigation
- **Testing** — documented examples of good/bad analysis on specific PEP-Web texts

Please open an issue before submitting large changes.

---

## Theoretical Acknowledgements

This tool draws on scholarship from:
- Judith Butler, Eve Kosofsky Sedgwick, Gayle Rubin (Queer Theory)
- Sandy Stone, Susan Stryker, Kate Bornstein (Trans Theory)
- Edward Said, Gayatri Spivak, Homi Bhabha, Frantz Fanon (Postcolonial Theory)
- Luce Irigaray, Julia Kristeva, Hélène Cixous (Feminist psychoanalytic critique)
- Michel Foucault, Gilles Deleuze & Félix Guattari (Anti-psychiatry / biopolitics)
- Kimberlé Crenshaw, bell hooks (Critical Race Theory / intersectionality)

---

## License

MIT License — free to use, modify, and distribute.

---

*Built for researchers, clinicians, and scholars who want to engage psychoanalytic literature critically.*
