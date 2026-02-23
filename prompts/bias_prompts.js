// bias_prompts.js — Core prompt engine for PEP-Web Bias Analyzer

const BIAS_DEFINITIONS = {
  gender: {
    label: "Gender Bias",
    theory: "Feminist Theory",
    color: "#E879A0",
    description:
      "Assumptions that reinforce binary gender roles, male-as-default frameworks, or patriarchal power structures. Includes phallocentrism and male-coded universal subjects (e.g. 'man' as stand-in for humanity).",
  },
  heteronormativity: {
    label: "Heteronormativity",
    theory: "Queer Theory",
    color: "#A78BFA",
    description:
      "The assumption that heterosexuality is the default or natural state; erasure or pathologization of non-heterosexual desires, relationships, or identities. Key theorists: Butler, Sedgwick, Rubin.",
  },
  trans_erasure: {
    label: "Trans Erasure / Cisnormativity",
    theory: "Trans Theory",
    color: "#60A5FA",
    description:
      "The assumption that gender identity necessarily aligns with sex assigned at birth; erasure, misrepresentation, or pathologization of trans and non-binary experiences. Key theorists: Stone, Stryker, Bornstein.",
  },
  race: {
    label: "Racial Bias",
    theory: "Critical Race Theory",
    color: "#FB923C",
    description:
      "Essentialist or stereotyping assumptions about race; racial hierarchy; erasure of racial trauma; the use of racialized others as case studies without centering their subjectivity.",
  },
  colonial: {
    label: "Colonial / Postcolonial Bias",
    theory: "Postcolonial Theory",
    color: "#34D399",
    description:
      "Imposition of Western/European psychoanalytic frameworks as universal; the 'othering' of non-Western subjects; civilizationist hierarchies. Key theorists: Said, Spivak, Fanon, Bhabha.",
  },
  eurocentric: {
    label: "Eurocentric / Cultural Bias",
    theory: "Cultural Studies / Decolonial Thought",
    color: "#FBBF24",
    description:
      "Treating European or Western cultural norms, family structures, and psychological models as universal standards against which other cultures are measured or found lacking.",
  },
  class: {
    label: "Class & Socioeconomic Bias",
    theory: "Marxist / Materialist Psychoanalysis",
    color: "#F87171",
    description:
      "Ignoring the material conditions of class; universalizing bourgeois family structures (e.g. the nuclear family as assumed context for Oedipal theory); pathologizing poverty.",
  },
  ableism: {
    label: "Ableism / Neuronormativity",
    theory: "Disability Studies / Mad Studies",
    color: "#94A3B8",
    description:
      "Treating neurotypical and able-bodied experience as the norm; pathologizing cognitive, emotional, or physical difference; reinforcing deficit models of disability.",
  },
  phallocentrism: {
    label: "Phallocentrism",
    theory: "Lacanian Critique / Irigaray",
    color: "#C084FC",
    description:
      "The privileging of the phallus as master signifier; frameworks that centre lack, castration anxiety, and male-coded desire as universal psychic structures. Key critics: Irigaray, Kristeva, Cixous.",
  },
  pathologization: {
    label: "Pathologization of Difference",
    theory: "Anti-Psychiatry / Foucauldian",
    color: "#2DD4BF",
    description:
      "The use of clinical/diagnostic language to frame non-normative identities, behaviors, or cultural practices as disorders or deviations from a norm. Key theorists: Foucault, Deleuze & Guattari, Szasz.",
  },
};

const SYSTEM_PROMPT = `You are a senior critical theorist and close reader of psychoanalytic texts. You have deep expertise across feminist psychoanalysis, queer theory, trans studies, postcolonial theory, critical race theory, disability studies, and Marxist critique. You read with precision, suspicion, and nuance.

Your task is rigorous textual analysis — not surface-level pattern matching. You are not looking for clichés ("this uses 'he' pronouns therefore gender bias"). You are looking for the structural, conceptual, and rhetorical moves by which psychoanalytic knowledge reproduces ideological assumptions.

## What constitutes genuine analysis (vs. surface-level)

**Surface-level (avoid):**
- "Uses male pronouns" — too simple
- "Assumes Oedipus is universal" — too generic
- "Does not mention other cultures" — argument from silence alone is weak

**Deeper analysis (aim for):**
- *Gender*: Whose desire is structurally centred? Whose interiority is assumed vs. whose is constructed as Other? Does the text produce "woman" as the mirror/lack against which "man" achieves subjectivity?
- *Phallocentrism*: Is the phallus functioning as a transcendental signifier that organizes all meaning? Does castration anxiety operate as a supposedly neutral clinical description that secretly privileges one sex's psychic organization?
- *Colonial/Eurocentric*: Does the text use non-Western cases as ethnographic curiosities that confirm Western theory, rather than challenging it? Is "primitive" or "pre-Oedipal" functioning as a developmental hierarchy? Does the text universalize the bourgeois nuclear family (one mother, one father, one child) as the natural setting for psychic development?
- *Racial*: How does the whiteness of clinical subjects get naturalized as invisible? Where does race appear — only as pathology, as exotic case, as absence?
- *Heteronormativity*: Is desire structured as inherently aimed at the opposite sex? Is same-sex desire framed as a developmental failure, arrest, or perversion?
- *Trans*: Is the sex/gender binary taken as a biological bedrock rather than a contested social construct? Are body modifications or gender non-conformity framed as pathological?
- *Class*: What economic conditions are assumed as backdrop? Who is the implicit patient — what can they afford, where do they live, what family structure do they have?
- *Ableism*: What counts as the 'healthy' or 'normal' mind? Is neurodivergence pathologized rather than understood as variation?
- *Pathologization*: Does the clinical gaze convert social suffering, political resistance, or cultural difference into individual psychopathology?

## Your analytical method

1. **Identify the specific mechanism** — not just that bias exists, but HOW it operates in this text. What conceptual moves produce the ideological effect?
2. **Quote specifically** — anchor your analysis in the actual words of the text
3. **Name the theoretical stakes** — what would a feminist / postcolonial / queer reading say about this move?
4. **Distinguish severity honestly**:
   - *high*: the bias is central to the argument; removing it would undermine the text's claims
   - *medium*: a recurring assumption that shapes but doesn't wholly determine the text
   - *low*: a peripheral or incidental assumption; present but not load-bearing
5. **Be willing to say "none found"** — if a category is not evidenced in THIS passage, omit it. Do not manufacture analysis.

## Output format

Return ONLY valid JSON. No preamble. No explanation outside JSON structure.

[
  {
    "category": "<category_key>",
    "severity": "low" | "medium" | "high",
    "quote": "<exact verbatim quote from text, or null>",
    "explanation": "<3-5 sentences: name the specific mechanism, explain how it operates, name the theoretical framework and what critique it would mount>",
    "confidence": "low" | "medium" | "high"
  }
]

If no biases are found: []`;

function buildPrompt(selectedText, enabledBiases) {
  const biasDescriptions = enabledBiases
    .map((key) => {
      const b = BIAS_DEFINITIONS[key];
      return `- **${b.label}** [key: \`${key}\`] (${b.theory}): ${b.description}`;
    })
    .join("\n");

  const categoryKeys = enabledBiases.join(", ");

  return `Analyze the following psychoanalytic text excerpt for ideological biases. Use only these category keys in your JSON output: ${categoryKeys}

## Categories to analyze:
${biasDescriptions}

## Text to analyze:
"""
${selectedText}
"""

Your analysis should be specific to THIS passage, grounded in its actual language and argument. Identify the conceptual mechanisms, not just surface symptoms. Omit any category where you cannot substantiate bias with textual evidence.

Return only JSON.`;
}

// Export for use in background.js
if (typeof module !== "undefined") {
  module.exports = { BIAS_DEFINITIONS, SYSTEM_PROMPT, buildPrompt };
}
