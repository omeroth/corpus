# Corpus — Authoring Guidelines

For anyone writing a new chapter or revising an existing one. These rules close three recurring problems in content we've shipped: quote paraphrasing dressed as source quotes, correct answers almost always at option B, and correct answers almost always being the longest option by a clear margin. The second and third let a reader score high without engaging with the material.

A content validator (`node scripts/check-thinker-links.mjs`) enforces most of these rules at merge time. Run it before handoff.

---

## 1. Source quotes must be real quotes

A `type: 'source'` section attaches a sentence to a thinker and a work. That sentence must appear verbatim in the cited work.

- If you have the verbatim passage: use it, cite the work and year, and if the original is not English, name the translator.
- If you have only a summary of the thinker's position: do **not** put it inside quotation marks with a date. Either (a) find a real sentence from the same thinker that makes the same point and cite that, or (b) rewrite the section as analysis in a non-source block (`'explanation'` or `'depth'`). A paraphrase without quote marks in the wrong block is still a paraphrase — the fix is to replace, not to re-wrap.
- Riskiest cases: 20th-century figures with heavy interview output (Foucault, Sartre), neuroscientists whose findings circulate as slogans (Libet, Kahneman), economists whose propositions circulate as textbook paraphrases (Thaler, Shiller). Anything that reads as a crisp one-sentence summation of a thinker's view deserves verification.

Audit result on handoff: name every quote you verified, name every one you couldn't, propose a swap for each unverifiable quote.

---

## 2. Correct-answer position

Across a chapter (~21 three-option quizzes), the position of the correct answer must be roughly even across A / B / C, and must not streak.

- Target: within 25–40% per letter.
- Hard constraint: no run of four or more identical correct answers in a row.
- The validator fails merge on any letter above 50% or any run of four or more.

The default authoring mistake is "put the real answer in slot B every time." Don't. Rotate.

---

## 3. Distractors must be real positions, not strawmen

This is the one that gets overlooked. A reader scoring the quiz should have to engage with the content — not just pick the longest or most hedged-sounding option.

### The rule

Every wrong option must be a **position a thoughtful reader could actually hold**, stated with the **same specificity** as the correct one.

### What that means in practice

Not "make them the same length." Padding wrongs to match a long correct answer produces obvious filler, which is just a different tell. Match specificity instead:

- If the correct answer names a mechanism, each wrong answer should name a different mechanism, not a vague gesture.
- If the correct answer cites a concrete example or quantity, each wrong answer should too.
- If the correct answer gives a conditional ("…when the market is efficient"), each wrong answer should also commit to a condition, not trail off.
- If the correct answer is a two-clause thought, two-clause wrongs read as plausible. One-clause wrongs read as warm-up.

### What NOT to write for wrong options

- **Dismissive one-liners.** "People are stupid." "It's random." "There's no answer." These signal the author doesn't want you to pick them. A reader learns to avoid them without reading the stem.
- **Trivially-wrong technical claims.** "Because 2+2=5." "Because the market was never invented." Anything that could be rejected without having read the dialogue.
- **Obvious parodies of a real view.** "Marx believed in capitalism." The reader will reject the obvious parody; the correct answer and one plausible wrong is now a 50/50 guess.
- **"All of the above" / "None of the above."** These change the shape of the quiz and don't give the reader a position to engage with. Avoid.

### What a good wrong option looks like

For a question about Simon on satisficing with correct answer *"Because the model describes a creature with complete information and infinite time, which does not exist"* (99 chars):

- Bad wrong: *"Because people are not smart enough"* (36 chars — short, dismissive, obvious strawman)
- Good wrong: *"Because the model only predicts long-run equilibrium behavior, not individual decisions"* (87 chars — a real position in the Friedman tradition, specific enough that a reader has to decide between it and Simon's actual argument)

### The length check

The validator fails if more than 60% of a chapter's three-option quizzes have the correct option as strictly the longest. Chance is 33%. If you're above 60%, your wrongs are too short — specificity needs raising, not padding.

Length-ratio target per chapter: correct option averages no more than ~1.3× the length of the two wrong options averaged together. Measured in both Hebrew and English.

---

## 4. Checklist before handoff

Run:

```
node scripts/check-thinker-links.mjs
```

A clean run is required for merge. The validator covers:

- Every `thinkerId` resolves to a real thinker in both languages.
- Every chapter in content/*.js surfaces through `getW()` (no silent chapter-5-style drops).
- Correct-answer position: no letter > 50%, no run ≥ 4.
- Distractor length: correct-is-longest ≤ 60% per chapter.
- Source-section quotes contain no stray markup or unbalanced tags.
- Share-card assets exist for every dialogue and every new thinker.

Separate from the validator, verify by hand:

- Every source quote traced to a verifiable passage (name the ones you couldn't).
- Chapter title and dialogue titles don't bake the thinker's name into the title — the home-screen card already shows the thinker. "Why a loss hurts more than an equal gain pleases" is the title; the author is "Kahneman and Tversky", shown on its own line.
- Hebrew and English option arrays mirror each other at every index — option A in Hebrew is the translation of option A in English, same for B and C. The rebalance pass depends on this, and the share cards assume it.
