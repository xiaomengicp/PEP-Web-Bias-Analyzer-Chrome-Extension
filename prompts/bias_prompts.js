// bias_prompts.js — Core prompt engine for PEP-Web Bias Analyzer

const BIAS_DEFINITIONS = {
  gender: {
    label: "Gender Bias",
    theory: "Feminist Theory",
    color: "#E879A0",
    description: "Assumptions that reinforce binary gender roles, male-as-default frameworks, or patriarchal power structures. Includes phallocentrism and male-coded universal subjects (e.g. 'man' as stand-in for humanity).",
  },
  heteronormativity: {
    label: "Heteronormativity",
    theory: "Queer Theory",
    color: "#A78BFA",
    description: "The assumption that heterosexuality is the default or natural state; erasure or pathologization of non-heterosexual desires, relationships, or identities. Key theorists: Butler, Sedgwick, Rubin.",
  },
  trans_erasure: {
    label: "Trans Erasure / Cisnormativity",
    theory: "Trans Theory",
    color: "#60A5FA",
    description: "The assumption that gender identity necessarily aligns with sex assigned at birth; erasure, misrepresentation, or pathologization of trans and non-binary experiences. Key theorists: Stone, Stryker, Bornstein.",
  },
  race: {
    label: "Racial Bias",
    theory: "Critical Race Theory",
    color: "#FB923C",
    description: "Essentialist or stereotyping assumptions about race; racial hierarchy; erasure of racial trauma; the use of racialized others as case studies without centering their subjectivity.",
  },
  colonial: {
    label: "Colonial / Postcolonial Bias",
    theory: "Postcolonial Theory",
    color: "#34D399",
    description: "Imposition of Western/European psychoanalytic frameworks as universal; the 'othering' of non-Western subjects; civilizationist hierarchies. Key theorists: Said, Spivak, Fanon, Bhabha.",
  },
  eurocentric: {
    label: "Eurocentric / Cultural Bias",
    theory: "Cultural Studies / Decolonial Thought",
    color: "#FBBF24",
    description: "Treating European or Western cultural norms, family structures, and psychological models as universal standards against which other cultures are measured or found lacking.",
  },
  class: {
    label: "Class & Socioeconomic Bias",
    theory: "Marxist / Materialist Psychoanalysis",
    color: "#F87171",
    description: "Ignoring the material conditions of class; universalizing bourgeois family structures (e.g. the nuclear family as assumed context for Oedipal theory); pathologizing poverty.",
  },
  ableism: {
    label: "Ableism / Neuronormativity",
    theory: "Disability Studies / Mad Studies",
    color: "#94A3B8",
    description: "Treating neurotypical and able-bodied experience as the norm; pathologizing cognitive, emotional, or physical difference; reinforcing deficit models of disability.",
  },
  phallocentrism: {
    label: "Phallocentrism",
    theory: "Lacanian Critique / Irigaray",
    color: "#C084FC",
    description: "The privileging of the phallus as master signifier; frameworks that centre lack, castration anxiety, and male-coded desire as universal psychic structures. Key critics: Irigaray, Kristeva, Cixous.",
  },
  pathologization: {
    label: "Pathologization of Difference",
    theory: "Anti-Psychiatry / Foucauldian",
    color: "#2DD4BF",
    description: "The use of clinical/diagnostic language to frame non-normative identities, behaviors, or cultural practices as disorders or deviations from a norm. Key theorists: Foucault, Deleuze & Guattari, Szasz.",
  },
};

const SYSTEM_PROMPT = `You are a critical theory scholar with expertise in psychoanalysis and its social critiques. You analyze psychoanalytic texts for ideological biases and blind spots through the lenses of Critical Theory, Feminist Theory, Queer Theory, Trans Theory, Critical Race Theory, Postcolonial Theory, Disability Studies, and related frameworks.

Your task is to carefully analyze the provided psychoanalytic text excerpt and identify instances of the specified bias categories. 

CRITICAL RULES:
- Only report biases you can substantiate with specific textual evidence.
- Do NOT manufacture biases where none exist. If the text is relatively unbiased in a category, omit that category from your response.
- Quote the specific problematic passage when possible.
- Be analytically precise — connect the textual evidence to the theoretical framework.
- Your severity ratings: "low" (implicit assumption), "medium" (clear pattern), "high" (explicit or egregious instance).
- Respond ONLY with valid JSON. No preamble, no explanation outside the JSON.

Response format:
[
  {
    "category": "<category_key>",
    "severity": "low" | "medium" | "high",
    "quote": "<exact problematic quote from text, or null if no specific quote>",
    "explanation": "<2-4 sentence analysis connecting the textual evidence to the theoretical critique>",
    "confidence": "low" | "medium" | "high"
  }
]

If no biases are found in any category, respond with: []`;

function buildPrompt(selectedText, enabledBiases) {
  const biasDescriptions = enabledBiases
    .map((key) => {
      const b = BIAS_DEFINITIONS[key];
      return `- **${b.label}** (${b.theory}): ${b.description}`;
    })
    .join("\n");

  const categoryKeys = enabledBiases.join(", ");

  return `Analyze the following psychoanalytic text excerpt for these bias categories (use these exact keys in your JSON: ${categoryKeys}):

${biasDescriptions}

TEXT TO ANALYZE:
"""
${selectedText}
"""

Return only JSON as specified. Omit categories where no bias is found.`;
}

// Export for use in background.js
if (typeof module !== "undefined") {
  module.exports = { BIAS_DEFINITIONS, SYSTEM_PROMPT, buildPrompt };
}
