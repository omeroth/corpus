# Dialogue summary redesign (end of dialogue)

Reference: `reference/index.html`. Open it in a browser. It shows the four scores (3/3, 2/3, 1/3, 0/3), English and Hebrew, at 360 × 640 inside mocked reader chrome, and has a Replay button for the motion. **Copy the layout, the copy text and the motion as they are.**

## The rule

Celebrate successes only.
- Each correct answer is a gold medallion.
- Missed questions are never drawn.
- There is no fraction, no stars, and no copy about what was missed.

## What stays and what goes

**Stays (shared, unchanged):**
- The reader chrome: top bar, chapter progress dots, font-size toolbar.
- The bottom bar with Back and Complete dialogue.
- The card shell.
- The shared SUMMARY eyebrow.

Nothing in this design breaks out of the card.

**Removed from this surface:**
- The score headline ("Perfect!", "Well done!", "Almost there").
- The three stars.
- The fraction and the "Correct answers" label.
- The encouragement pill.
- The 16-piece confetti and the glow behind the number.
- The old "Try again" pill; it is replaced by the new button below.

The existing summary styles are scoped to this surface, so replace them.

## Layout (top to bottom, inside the card)

1. **Eyebrow:** the shared SUMMARY / סיכום.
2. **Middle group, vertically centred** between the eyebrow and the chapter row (`margin: auto 0`):
   - **Hero, 122px tall:**
     - Gold rays turning slowly behind, with opacity growing with the score: 0/3 .00, 1/3 .09, 2/3 .15, 3/3 .22.
     - A soft purple glow.
     - A few gold sparkles: two at 0/3 and 1/3, three at 2/3, four at 3/3.
     - The medallions, centred.
   - **Medallions:**
     - One per correct answer, 64px, gold radial gradient, white check, white ring plus a gold halo, 14px gap.
     - At 0/3: a single purple medallion with an open-book icon.
   - **Headline:** 26px, weight 900, ink #2F2150. The accent word is purple #7B4FD4; at 3/3 the accent is a gold gradient.
   - **Line:** 14.5px, muted, at most 290px wide.
   - **Thinker chip:** a lilac pill with a 30px portrait in the subject ring, "{name} · {dialogue title}", ellipsis on overflow.
   - **Try again button, only below 3/3:** a white pill 40px tall with a 1.5px lilac border, purple text and a circular-arrow icon. The icon is mirrored in RTL.
3. **Chapter row, at the bottom:** "Chapter {n} · Dialogue {k} of {total}", with position dots: done in the subject colour, current in purple with a ring.

## Copy (no em-dashes; the Hebrew is gender-neutral)

**English**

| Score | Headline (*accent*) | Line |
|---|---|---|
| 3/3 | *Perfect* dialogue! | Every question about {thinker}, answered right. |
| 2/3 | *Two* correct answers! | Two sharp answers about {thinker}. |
| 1/3 | *One* correct answer! | A sharp answer about {thinker}. |
| 0/3 | Dialogue *complete!* | Another thinker met, another idea to keep. |

Button: Try again

**עברית**

| Score | Headline (*accent*) | Line |
|---|---|---|
| 3/3 | דיאלוג *מושלם!* | כל השאלות על {thinker} נענו נכון. |
| 2/3 | *שתי* תשובות נכונות! | שתי תשובות חדות על {thinker}. |
| 1/3 | תשובה נכונה *אחת!* | תשובה חדה על {thinker}. |
| 0/3 | הדיאלוג *הושלם!* | עוד הוגה, עוד רעיון לקחת איתך. |

Button: לנסות שוב

## Motion (keyframes in the reference)

- The medallions land one after another at 0.25s, 0.55s and 0.85s: scale 0.2→1 with a slight rotation and overshoot, 0.55s each.
- Each correct medallion gets:
  - a burst ring, 0.7s;
  - 9 confetti pieces flying outward, 1.1s. This makes the celebration scale with the number of correct answers.
- The rays turn continuously (36s per turn) and the sparkles twinkle.
- Reduced motion: the end state only, with no confetti and no bursts.

## Behaviour

- **Try again:** runs the same retry the old "Try again" pill did (back to the questions, answers reset). Only shown below 3/3.
- **XP, streak and the frame point are NOT shown here.** They stay on the following screens: the stats, then the card reveal with the Fly.
- **Data:** the correct-answer count, the thinker's name and portrait (`_thinkerImage`), the subject colour, the dialogue title, and the chapter and position.

## Constraints

- Fits 360 × 640 without scrolling, at every score, in both languages. The card's `scrollHeight` must equal its `clientHeight`. Today the screen overflows by up to 50px; this design must not.
- Nunito for English, Assistant for Hebrew. Purple #7B4FD4, ink #2F2150, gold #F59E0B.
- RTL through `dir`; logical properties only.

## Verification

1. **Screenshots:** in Playwright at 360 × 640, all four scores, English and Hebrew, next to `reference/index.html`.
2. **No overflow:** card `scrollHeight === clientHeight` for all 8 cases.
3. **Medallion count:** it equals the correct-answer count; at 0/3 it's the purple complete medallion.
4. **Try again:** it appears only below 3/3 and returns to the questions with the answers reset.
5. **Nothing else changed:** the other reader sections, and the eyebrow, card shell and bars on them, are pixel-identical before and after.
6. **Reduced motion:** the end state only.
