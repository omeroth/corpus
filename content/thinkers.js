// ─── Card-quote audit: known-suspect list ───────────────────────────
// A 2026-09-29 audit found that many of the `quote` fields below were
// slogan-summaries or textbook paraphrases attributed to the thinker
// rather than sentences they actually wrote. Foucault (psychology
// chapter 5), Socrates and Sen have been fixed. The following IDs are
// still suspect on the ENGLISH side; the HE side has not been audited
// yet and may contain either the same paraphrase in translation, or
// a translation of a translation. Do NOT add new content (dialogues,
// share pages, marketing copy) that quotes these entries verbatim
// until the individual card has been verified against the primary
// source and its provenance comment updated.
//
// Also: many dialogue `source` blocks reuse or paraphrase the same
// lines. When cleaning a card, check the corresponding dialogues too.
//
// Red-flag suspects (22 remaining after Socrates + Sen fixes):
//   plato, russell, aristotle, gettier, popper, thomson, bostrom,
//   mill-econ, samuelson, walras, sandel, jevons, kahneman, ricardo,
//   piketty, aquinas, pareto, rawls, nozick, hayek
// Yellow (compressed / word-changed / needs check):
//   aurelius, mill, nietzsche, berkeley, friedman, adler
//
// Cleanup track: see the 2026-09-29 chat log for full audit tables and
// path decisions. When you fix one, remove it from the lists above and
// add a provenance comment above its entry describing what changed.
const THINKERS = [
  {
    id: 'socrates',
    name: 'סוקרטס',
    era: '470–399 לפנה"ס',
    emoji: '🦉',
    image: './images/socrates.webp',
    // Bio and quote replaced 2026-09-29 in the card-quote audit. The
    // prior quote, "הייתי חכם אם ידעתי שאינני יודע דבר.", is a paraphrase
    // of "I know that I know nothing", itself a tradition-quote that
    // does not appear verbatim in Plato — see Apology 21d where
    // Socrates actually says "I neither know nor think that I know."
    // Replaced with the trial line from Apology 38a, which is (a)
    // verified verbatim, (b) already used by the onboarding taste at
    // index.html:15818, so the card and the taste now agree in HE.
    // The philosophy chapter 1 dialogue at ~19367 still uses a
    // different HE translation of the same English sentence; that
    // inconsistency belongs to the dialogue-source audit track.
    bio: 'הפילוסוף האתונאי הגדול שלא כתב דבר, אך שינה את פני המחשבה המערבית. ידוע בשיטת הדיאלוג הסוקרטית ובמה שאמר במשפטו בהגנה על החיים הפילוסופיים, המתועד בכתב ההגנה של אפלטון (סעיף 38a).',
    quote: '"חיים שלא נבחנים אינם ראויים שיחיו אותם."',
  },
  {
    id: 'plato',
    name: 'אפלטון',
    image: './images/plato.webp',
    era: '428–348 לפנה"ס',
    emoji: '🏛',
    bio: 'תלמידו של סוקרטס ומאסטר האלגוריה. פיתח את תורת האידיאות - העולם שאנו רואים הוא רק צל של המציאות האמיתית.',
    quote: '"העיון הפילוסופי הוא שחרור הנשמה מכבלי הגוף."',
  },
  {
    id: 'russell',
    name: 'ברטרנד ראסל',
    image: './images/russell.webp',
    era: '1872–1970',
    emoji: '📐',
    bio: 'פילוסוף בריטי, מתמטיקאי וחתן פרס נובל. ראה בפילוסופיה כלי לבחינה ביקורתית של חיינו ועולמנו, ולחיים בחוסר וודאות.',
    quote: '"הפילוסוף הוא מי שיכול לשאת את חוסר הוודאות."',
  },
  {
    id: 'wittgenstein',
    name: 'ויטגנשטיין',
    image: './images/wittgenstein.webp',
    era: '1889–1951',
    emoji: '🔤',
    bio: 'אחד הפילוסופים המשפיעים של המאה ה-20. טען שגבולות שפתנו הם גבולות עולמנו, ושמרבית הבעיות הפילוסופיות נובעות מבלבול לשוני.',
    quote: '"גבולות שפתי הם גבולות עולמי."',
  },
  {
    id: 'aurelius',
    name: 'מרקוס אורליוס',
    image: './images/aurelius.webp',
    era: '121–180 לספירה',
    emoji: '👑',
    bio: 'קיסר רומי ופילוסוף סטואי. כתב "מחשבות לעצמי" - יומן אישי שהפך לאחד הספרים הנקראים ביותר בעולם - כהדרכה עצמית בחיים טובים.',
    quote: '"האושר בחייך תלוי באיכות מחשבותיך."',
  },
  {
    id: 'aristotle',
    name: 'אריסטו',
    image: './images/aristotle.webp',
    era: '384–322 לפנה"ס',
    emoji: '🌿',
    bio: 'תלמידו של אפלטון שמרד במורהו. יצר את הלוגיקה הפורמלית, חקר את הטבע, המדינה והאתיקה - אחד הרוחות הגדולות בהיסטוריה.',
    quote: '"הפלא הוא ראשיתה של הפילוסופיה."',
  },
  {
    id: 'descartes',
    name: 'דקארט',
    era: '1596–1650',
    image: './images/descartes.webp',
    emoji: '🔭',
    bio: 'אבי הפילוסופיה המודרנית. חיפש בסיס ודאי לכל הידע - ומצא אותו במחשבה עצמה: "אני חושב, משמע אני קיים."',
    quote: '"אני חושב, משמע אני קיים."',
  },
  {
    id: 'kant',
    name: 'עמנואל קאנט',
    era: '1724–1804',
    image: './images/kant.webp',
    emoji: '⚖️',
    bio: 'פילוסוף גרמני שנחשב לאחד הגדולים בכל הזמנים. יצר את הציווי הקטגורי - עיקרון מוסרי אוניברסלי שאינו תלוי בתוצאות אלא בחובה. חי חיים שגרתיים להפליא - הסתובב בקניגסברג יום יום באותה שעה עד שכינו אותו "שעון העיר".',
    quote: '"פעל רק לפי אותו כלל שתוכל לרצות שיהפוך לחוק אוניברסלי."',
  },
  {
    id: 'mill',
    name: 'ג\'ון סטיוארט מיל',
    era: '1806–1873',
    image: './images/mill.webp',
    emoji: '🌻',
    bio: 'פילוסוף בריטי ומייסד האוטיליטריזם המודרני. ילד פלא שקרא יוונית בגיל שלוש - וסבל מדיכאון קשה בגיל 20. פיתח את עקרון האושר המרבי: מוסרי הוא מה שמקדם את הרווחה הכוללת.',
    quote: '"עדיף להיות סוקרטס לא מרוצה מאשר שוטה מרוצה."',
  },
  {
    id: 'nietzsche',
    name: 'פרידריך ניטשה',
    era: '1844–1900',
    image: './images/nietzsche.webp',
    emoji: '⚡',
    bio: 'פילוסוף גרמני, מבקר המוסר הנוקב ביותר בתולדות הפילוסופיה. לא שאל "מה מוסרי?" אלא "מאיפה בא המוסר?" - וגילה שמאחורי ערכים "נעלים" לעיתים מסתתרים כוח, טינה, ורצון לשלוט. מת לאחר שנות מחלה קשות, אחרי שאחותו ניכסה כתביו לצרכים לאומניים שהיה שונא.',
    quote: '"אין עובדות מוסריות. יש רק פרשנות מוסרית של עובדות."',
  },
  {
    id: 'hume',
    name: 'דייוויד יום',
    era: '–1776',
    image: './images/hume.webp',
    emoji: '🌊',
    bio: 'פילוסוף סקוטי ואחד האמפיריציסטים הרדיקליים ביותר. טען שכל הידע מקורו בתפיסה החושית - ושהשכל לבדו אינו מסוגל להיות מקור לידיעה על העולם. הביקורת שלו על הסיבתיות ועל האינדוקציה לא זכתה למענה מלא עד היום.',
    quote: '"הרגל הוא המנחה הגדול של החיים האנושיים."',
  },
  {
    id: 'gettier',
    name: 'אדמונד גטייה',
    era: '1927–2021',
    image: './images/gettier.webp',
    emoji: '⚙️',
    bio: 'פילוסוף אמריקאי שכתב שלושה עמודים בשנת 1963 - ושינה 2500 שנות פילוסופיה. המאמר "האם אמונה אמיתית מוצדקת היא ידע?" שבר את הנוסחה של אפלטון. גטייה עצמו כמעט לא פרסם דבר לאחר מכן.',
    quote: '"אמונה אמיתית מוצדקת - ועדיין לא ידע."',
  },
  {
    id: 'popper',
    name: 'קרל פופר',
    era: '1902–1994',
    image: './images/popper.webp',
    emoji: '🔬',
    bio: 'פילוסוף אוסטרי-בריטי שהציע את הקריטריון המדעי של הפרכה. לפי פופר, לא מה שמאמת תיאוריה הופך אותה למדעית - אלא מה שיכול להפריך אותה. ביקורתו על פסיכואנליזה ומרקסיזם כ"לא מדעיים" עוררה ויכוח חריף.',
    quote: '"המדע לא מתקדם על ידי אימות - אלא על ידי הפרכה."',
  },
  {
    id: 'spinoza',
    name: 'ברוך שפינוזה',
    era: '1632–1677',
    image: './images/spinoza.webp',
    emoji: '✡️',
    bio: 'פילוסוף הולנדי-יהודי שהוחרם מקהילתו בגיל 23 בשל רעיונותיו המהפכניים. פיתח את המונאיזם - הרעיון שאלוהים והטבע הם ישות אחת (Deus sive Natura). "האתיקה" שלו, שנכתבה כמערכת גיאומטרית, היא אחד הטקסטים הפילוסופיים המרשימים ביותר שנכתבו.',
    quote: '"האדם החופשי לא חושב על דבר פחות מאשר על המוות, וחכמתו היא עיון לא על המוות אלא על החיים."',
  },
  {
    id: 'berkeley',
    name: 'ג\'ורג\' ברקלי',
    era: '1685–1753',
    image: './images/berkeley.webp',
    emoji: '👁️',
    bio: 'פילוסוף אירי וביסקופ אנגליקני שטען כי לחומר אין קיום עצמאי. פיתח את האידיאליזם הסובייקטיבי - esse est percipi ("להיות זה להיתפס"). על אף שנראה קיצוני, תורתו נועדה להגן על הדת מפני המטריאליזם.',
    quote: '"קיומו של דבר שנתפס על ידי החושים אינו דבר שונה מהיתפסותו."',
  },
  {
    id: 'bostrom',
    name: 'ניק בוסטרום',
    era: '1973–',
    image: './images/bostrom.webp',
    emoji: '🖥️',
    bio: 'פילוסוף שוודי, מייסד מכון עתיד האנושות באוקספורד. ידוע בטיעון הסימולציה (2003) - ייתכן שאנו חיים בתוך סימולציה ממוחשבת - ובעבודתו על סיכוני הקיום של האנושות.',
    quote: '"אם ציביליזציות פוסט-אנושיות מריצות מספר רב של סימולציות, אזי מרבית המוחות בעלי חוויות כשלנו חיים בתוך סימולציה."'
  },
  {
    id: 'thomson',
    name: 'ג\'ודית ג\'רביס תומסון',
    era: '1929–2020',
    image: './images/thomson.webp',
    emoji: '🦉',
    bio: 'פילוסופית אמריקאית מהמובילות בתחום האתיקה. ידועה בניסוי המחשבתי "בעיית הקרונית" שפרסמה ב-1967 - אחד הכלים הפדגוגיים הנפוצים ביותר בפילוסופיה המוסרית.',
    quote: '"העובדה שאתה עלול לגרום נזק לאחד אינה הופכת אותך למי שאסור לו לסייע לחמישה."'
  },
  // Chapter 5: Freedom of Choice. Spinoza, Hume, Kant already defined above.
  {
    id: 'laplace',
    name: 'פייר-סימון לפלס',
    era: '1749–1827',
    image: './images/laplace.webp',
    emoji: '🌌',
    bio: 'מתמטיקאי ואסטרונום צרפתי שניסח את הגרסה החדה ביותר של הדטרמיניזם. ב-1814 תיאר תבונה שיודעת ברגע אחד את כל המיקומים והכוחות ויכולה לחשב מכאן את כל העתיד — ניסוי מחשבתי שאילץ דורות של הוגים לשאול אם לבחירה האנושית יש בכלל מקום בחשבון הזה.',
    quote: '"עלינו להתייחס אל המצב הנוכחי של היקום כאל התוצאה של מצבו הקודם וכאל הסיבה למצב שיבוא אחריו."'
  },
  {
    id: 'sartre',
    name: 'ז\'אן-פול סארטר',
    era: '1905–1980',
    image: './images/sartre.webp',
    emoji: '🚬',
    bio: 'פילוסוף אקזיסטנציאליסט צרפתי שטען שבני אדם אינם נולדים עם מהות קבועה אלא יוצרים את עצמם דרך בחירותיהם. סיסמתו "הקיום קודם למהות" והטענה שאנחנו "נידונים לחופש" עיצבו דור של חשיבה על אחריות ועל אמונה כוזבת. סירב לקבל את פרס נובל לספרות ב-1964.',
    quote: '"האדם נידון להיות חופשי."'
  },
  // Libet quote on this card is from his 1999 essay "Do We Have Free
  // Will?" (Journal of Consciousness Studies 6:47-57) — verifiably his
  // own phrasing of the conscious-veto thesis. The dialogue's source
  // block quotes a longer verified passage from the 1985 BBS paper.
  // Same provenance pattern as Foucault / economics entries — see
  // CLAUDE.md § Source attributions for the paraphrase-swap policy.
  {
    id: 'libet',
    name: 'בנג\'מין ליבט',
    era: '1916–2007',
    image: './images/libet.webp',
    emoji: '🧠',
    bio: 'חוקר מוח אמריקאי שהביא את הדיון בחופש הבחירה למעבדה. ניסויו מ-1983 מדד את פעילות המוח לפני החלטות מודעות, ומצא שההכנה מתחילה כשליש שנייה לפני שהאדם יודע. ליבט עצמו דחה את הקריאה הדטרמיניסטית החזקה, והציע שהתודעה שומרת על יכולת וטו בחלון שבין המודעות לביצוע.',
    quote: '"תפקידו של הרצון החופשי המודע הוא, אם כן, לא ליזום פעולה רצונית, אלא לקבוע אם הפעולה אכן תתבצע."'
  },
  // Psychology thinkers
  {
    id: 'wundt',
    name: 'וילהלם וונדט',
    era: '1832–1920',
    emoji: '🧪',
    image: './images/wundt.webp',
    subject: 'psychology',
    bio: 'הפסיכולוג הגרמני שהקים ב-1879 את המעבדה הפסיכולוגית הראשונה בעולם, בלייפציג. הכריז שהנפש היא מושא לחקירה מדעית - ולא לספקולציה פילוסופית. השיטה שלו נזנחה; הרעיון שלו כובש עד היום.',
    quote: '"הספר שאני מגיש כאן לציבור הוא ניסיון להתוות תחום חדש של מדע."',
  },
  {
    id: 'james',
    name: 'ויליאם ג\'יימס',
    era: '1842–1910',
    emoji: '🌊',
    image: './images/james.webp',
    subject: 'psychology',
    bio: 'פילוסוף-פסיכולוג אמריקאי מהרווארד. טען כנגד וונדט שהתודעה איננה שרשרת של רגעים בדידים - היא נהר. הגה את המושג "זרם התודעה" וייסד את הפסיכולוגיה הפונקציונלית: לא ממה עשויה התודעה, אלא מה היא עושה.',
    quote: '"התודעה אינה מצטיירת לעצמה כקטועה לחתיכות. אין בה דבר שאפשר לחבר - היא זורמת."',
  },
  {
    id: 'freud',
    name: 'זיגמונד פרויד',
    era: '1856–1939',
    emoji: '🛋',
    image: './images/freud.webp',
    subject: 'psychology',
    bio: 'רופא אוסטרי מווינה שהמציא את הפסיכואנליזה בסוף המאה ה-19. גילה שרוב הפעילות הנפשית מתרחשת מתחת לפני השטח, בלא-מודע, ומשפיעה על כל התנהגות מודעת. הפך את התפיסה המערבית של עצמנו על פיה.',
    quote: '"החלוקה של הנפשי לחלק מודע ולחלק לא-מודע היא הנחת היסוד של הפסיכואנליזה."',
  },
  {
    id: 'jung',
    name: 'קרל גוסטב יונג',
    era: '1875–1961',
    emoji: '🌀',
    image: './images/jung.webp',
    subject: 'psychology',
    bio: 'פסיכולוג שוויצרי, תלמידו הבכיר של פרויד ולימים יריבו. טען שמתחת ללא-מודע האישי קיים לא-מודע קולקטיבי - שכבה משותפת לכל בני האדם, המכילה ארכיטיפים שחוזרים במיתוסים, חלומות וסיפורים בכל התרבויות.',
    quote: '"בנוסף לתודעה הישירה שלנו, קיימת מערכת נפשית שנייה בעלת אופי קולקטיבי, אוניברסלי ובלתי-אישי, שהיא זהה בכל היחידים."',
  },
  {
    id: 'skinner',
    name: 'ב.פ. סקינר',
    era: '1904–1990',
    emoji: '🐦',
    image: './images/skinner.webp',
    subject: 'psychology',
    bio: 'פסיכולוג אמריקאי מהרווארד שהוביל את מהפכת הביהביוריזם הרדיקלי. טען שכל הדיבור על "נפש" פנימית הוא ספקולציה חסרת-תוחלת - הפסיכולוגיה יכולה להיות מדע רק אם תמדוד התנהגות נצפית ואת תוצאותיה: חיזוקים ועונשים.',
    quote: '"אדם אינו פועל על העולם, העולם פועל עליו."',
  },
  {
    id: 'rogers',
    name: 'קרל רוג\'רס',
    era: '1902–1987',
    emoji: '🌱',
    image: './images/rogers.webp',
    subject: 'psychology',
    bio: 'פסיכולוג אמריקאי, מייסד הפסיכולוגיה ההומניסטית. דחה גם את פרויד (שראה באדם קורבן של דחפים מודחקים) וגם את סקינר (שראה בו מכונה ביולוגית) - וטען שהאדם הוא סובייקט של חייו, שיש בו נטייה פנימית לצמוח כשמספקים לו את התנאים המתאימים.',
    quote: '"מוטב לתפוס זאת כנטייה לקראת הגשמה, לקראת מימוש עצמי, הכוללת לא רק את שימורו של האורגניזם אלא גם את פיתוחו."',
  },
  // Psychology chapter 6 — "Can a person really change?" Rogers, Winnicott,
  // Beck and Frankl already defined elsewhere in this array. Breuer and
  // Miller are new.
  //
  // Breuer quote is from the Preliminary Communication (1893), the paper
  // Breuer co-wrote with Freud that first described the talking cure.
  // Verified direct line — Hysterics-suffer-mainly-from-reminiscences is
  // the most-cited sentence in the history of psychoanalysis and is
  // present verbatim in that paper. See CLAUDE.md § Source attributions.
  {
    id: 'breuer',
    name: 'יוזף ברויר',
    era: '1842–1925',
    emoji: '💬',
    image: './images/breuer.webp',
    subject: 'psychology',
    bio: 'רופא אוסטרי שהטיפול שלו בחולה שהוא כינה אנה או., בין 1880 ל-1882, הניב את מה שהיא עצמה כינתה "הטיפול בדיבור" — הצורה הקדומה ביותר של פסיכואנליזה. פרויד, שלמד את השיטה מברויר, פיתח אותה אחר כך לתיאוריה שלו. ברויר נסוג מהפסיכואנליזה כשהיא עברה להעמיד את המיניות במרכז; התובנה שלו שהתסמינים נסוגים כשמקורם מדוּבּר נותרה בעינה.',
    quote: '"ההיסטריות סובלות בעיקר מזיכרונות."',
  },
  // Miller quote is from Miller/Hubble/Duncan, "Supershrinks: What Is the
  // Secret of Their Success?", Psychotherapy Networker, 2007 — verified
  // direct line, matches the attribution. The dialogue source block uses
  // the same paper (replacing the docx's uncited "working principle"
  // paraphrase). See CLAUDE.md § Source attributions.
  {
    id: 'miller',
    name: 'סקוט ד. מילר',
    era: '1960–',
    emoji: '📊',
    image: './images/miller.webp',
    subject: 'psychology',
    bio: 'פסיכותרפיסט וחוקר אמריקאי שהוציא את השאלה "מה עובד בטיפול?" מהתיאוריה והכניס אותה למדידה. ממייסדי המרכז הבינלאומי למצוינות קלינית; עבודתו על טיפול מונחה-משוב, על מדידת תוצאות, ועל ממצא ה"סופר-מטפלים" — לפיו המטפלים הטובים ביותר הם אלה שבאופן עקבי מבקשים משוב מהמטופל ופועלים לפיו — שינתה את הדרך שבה חושבים על איכות טיפולית מחוץ לאסכולה כזו או אחרת.',
    quote: '"המטפלים הטובים ביותר מקדישים יותר זמן לבקש משוב מהמטופל — וחשוב מכך, לפעול לפיו — מהמטפלים הפחות יעילים."',
  },
  // Psychology chapter 2 — "What drives us?"
  {
    id: 'adler',
    name: 'אלפרד אדלר',
    era: '1870–1937',
    emoji: '⬆️',
    image: './images/adler.webp',
    subject: 'psychology',
    bio: 'פסיכולוג אוסטרי, מקורב לפרויד ולימים יריבו. עמד בראש האגודה הפסיכואנליטית של וינה עד פרישתו הסוערת ב-1911. טען שהמנוע הנסתר של האדם אינו מיני אלא הרצון להפסיק להרגיש קטן - הוא כינה זאת "שאיפה לעליונות".',
    quote: '"להיות אדם פירושו לחוש נחיתות שדוחפת ללא הרף אל ההתגברות עליה."',
  },
  {
    id: 'maslow',
    name: 'אברהם מאסלו',
    era: '1908–1970',
    emoji: '🔺',
    image: './images/maslow.webp',
    subject: 'psychology',
    bio: 'פסיכולוג אמריקאי שביקש להסביר מדוע אותו אדם רוצה דברים שונים בשלבים שונים בחייו. סידר את הצרכים האנושיים לפירמידה עולה, ממה שנחוץ לחיים ועד למימוש עצמי, וטען שצורך שמסופק מפסיק להניע.',
    quote: '"מה שאדם יכול להיות, עליו להיות."',
  },
  {
    id: 'frankl',
    name: 'ויקטור פרנקל',
    era: '1905–1997',
    emoji: '✡️',
    image: './images/frankl.webp',
    subject: 'psychology',
    bio: 'פסיכיאטר וינאי שניצל ממחנות ההשמדה של הנאצים. פיתח את הלוגותרפיה, "האסכולה הווינאית השלישית", וטען שהמניע העמוק ביותר של האדם אינו סיפוק דחפים או שאיפה לכוח - אלא חיפוש אחר משמעות.',
    quote: '"הכל אפשר ליטול מאדם חוץ מדבר אחד: החירות האחרונה, לבחור את עמדתו בכל נסיבות שהן."',
  },
  {
    id: 'fromm',
    name: 'אריך פרום',
    era: '1900–1980',
    emoji: '🕊️',
    image: './images/fromm.webp',
    subject: 'psychology',
    bio: 'פסיכואנליטיקאי גרמני-יהודי שברח מגרמניה הנאצית לארה"ב. הפך את השאלה על ראשה: אם החירות היקרה כל כך, למה אנשים מוסרים אותה מרצון? הראה שהחופש עשוי להיות מכביד, ושהאדם המודרני קונה הקלה במחיר של אוטונומיה.',
    quote: '"החירות, אף שהביאה לו עצמאות ותבונה, הפכה אותו למבודד, ובשל כך לחרד וחסר אונים."',
  },
  {
    id: 'deci',
    name: 'אדוארד דצ\'י',
    era: '1942–',
    emoji: '🎯',
    image: './images/deci.webp',
    subject: 'psychology',
    bio: 'פסיכולוג אמריקאי שחקר מוטיבציה במעבדה. גילה עם ראיאן שתגמול חיצוני על משימה שאוהבים דווקא מזיז את הסיבה לפעולה מבפנים החוצה, ובהמשך זיהה שלושה צרכים בסיסיים: אוטונומיה, מסוגלות ושייכות.',
    quote: '"במקום לשאול איך אני יכול להניע אנשים, עלינו לשאול כיצד ליצור את התנאים שבהם אנשים יניעו את עצמם."',
  },
  // Psychology chapter 3 — "Where does who I am come from?"
  {
    id: 'bowlby',
    name: 'ג\'ון בולבי',
    era: '1907–1990',
    emoji: '🔗',
    image: './images/bowlby.webp',
    subject: 'psychology',
    bio: 'פסיכיאטר ופסיכואנליטיקאי בריטי, מייסד תיאוריית ההתקשרות. עבד עם ילדים שגדלו במוסדות אחרי מלחמת העולם השנייה, וגילה שקשר יציב עם דמות מטפלת בשנתיים הראשונות מעצב את דפוס היחסים לאורך כל החיים. הפך את "הצורך באמא" מפינוק לביולוגיה.',
    quote: '"קשרים אינטימיים לבני אדם אחרים הם הציר שסביבו סובבים חייו של אדם, לא רק בינקות ובילדות, אלא לאורך שנות הבגרות ועד זקנה."',
  },
  {
    id: 'winnicott',
    name: 'דונלד ויניקוט',
    era: '1896–1971',
    emoji: '🧸',
    image: './images/winnicott.webp',
    subject: 'psychology',
    bio: 'רופא ילדים ופסיכואנליטיקאי בריטי. הציע את המושג "אם טובה דיה", שנחוצה לילד לא מתוך שלמות אלא מתוך כישלון מדוד בזמן הנכון. הכישלון הקטן הוא מה שמאפשר לילד לפתח את היכולת להתמודד לבד.',
    quote: '"האם הטובה דיה מתחילה בהתאמה כמעט מלאה לצורכי תינוקה, וככל שהזמן עובר היא מתאימה עצמה פחות ופחות, בהדרגה, בהתאם ליכולתו הגדלה של התינוק להתמודד עם כישלונה."',
  },
  {
    id: 'erikson',
    name: 'אריק אריקסון',
    era: '1902–1994',
    emoji: '🪜',
    image: './images/erikson.webp',
    subject: 'psychology',
    bio: 'פסיכולוג התפתחותי גרמני-אמריקאי. הרחיב את פרויד בכיוון אחד מכריע: העיצוב הנפשי אינו נגמר בילדות. הציע שמונה שלבי חיים, מלידה עד זקנה, שבכל אחד יש משבר לפתור. מי שלא פותר משבר, נושא אותו הלאה.',
    quote: '"ילדים בריאים לא יפחדו מהחיים, אם למבוגרים שסביבם יש די שלמות כדי לא לפחד מהמוות."',
  },
  {
    id: 'kohut',
    name: 'היינץ קוהוט',
    era: '1913–1981',
    emoji: '👁️',
    image: './images/kohut.webp',
    subject: 'psychology',
    bio: 'פסיכואנליטיקאי אמריקאי יליד וינה, מייסד פסיכולוגיית העצמי. טען שהעצמי אינו נבנה מתוך אימות פנימי, אלא מתוך היראות בעיני אדם אחר. "הניצוץ בעין ההורה" הוא התנאי הבסיסי להתפתחות תחושת ערך.',
    quote: '"הניצוץ בעיניה של האם, המשקף את תצוגתו של הילד."',
  },
  {
    id: 'bandura',
    name: 'אלברט בנדורה',
    era: '1925–2021',
    emoji: '🎭',
    image: './images/bandura.webp',
    subject: 'psychology',
    bio: 'פסיכולוג קנדי-אמריקאי מסטנפורד. הראה שאדם לומד לא רק מהתנאה, אלא בעיקר מהתבוננות באחרים. ניסוי הבובה "בובו" ב-1961 הוכיח שילדים מחקים אלימות שראו אצל מבוגר. הציע את הדגם השלישי אחרי פרויד וסקינר: לא דחפים, לא חיזוקים, אלא למידה חברתית.',
    quote: '"הלמידה הייתה מפרכת, שלא לומר מסוכנת, לו היו בני אדם נאלצים להסתמך רק על תוצאות מעשיהם שלהם. למרבה המזל, רוב ההתנהגות האנושית נלמדת בהתבוננות, דרך מודלים."',
  },
  // Psychology chapter 4 — "Why are we locked into patterns?"
  {
    id: 'klein',
    name: 'מלאני קליין',
    era: '1882–1960',
    emoji: '🪆',
    image: './images/klein.webp',
    subject: 'psychology',
    bio: 'פסיכואנליטיקאית ילידת וינה שפעלה בלונדון. חלוצת הפסיכואנליזה של ילדים דרך משחק. פיתחה את תיאוריית יחסי אובייקט: אנחנו סופגים לתוכנו דמויות של האנשים החשובים בחיינו, והן ממשיכות לפעול בפנים גם עשרות שנים אחרי.',
    quote: '"תודה קשורה קשר הדוק לאמון בדמויות טובות. דרך תהליכי ההשלכה וההפנמה, דרך עושר פנימי שניתן החוצה ומופנם בחזרה, מתרחשים העשרה והעמקה של האני."',
  },
  {
    id: 'anna-freud',
    name: 'אנה פרויד',
    era: '1895–1982',
    emoji: '🛡️',
    image: './images/anna-freud.webp',
    subject: 'psychology',
    bio: 'פסיכואנליטיקאית ילידת וינה, בתו הצעירה של זיגמונד פרויד ופסיכואנליטיקאית בזכות עצמה. הפנתה את הזרקור מהדחפים אל האני, ומיפתה מערכת שלמה של מנגנוני הגנה, אסטרטגיות אוטומטיות שהנפש מפעילה כדי להרחיק חרדה.',
    quote: '"ספר זה עוסק בבעיה אחת: הדרכים והאמצעים שבהם האני מרחיק מעליו אי-נעימות וחרדה, ומפעיל שליטה על התנהגות אימפולסיבית, על רגשות ועל דחפים."',
  },
  {
    id: 'beck',
    name: 'אהרון בק',
    era: '1921–2021',
    emoji: '💭',
    image: './images/beck.webp',
    subject: 'psychology',
    bio: 'פסיכיאטר אמריקאי שהוכשר כפסיכואנליטיקאי וגילה בקליניקה תופעה חדשה: בין האירוע לרגש עוברת מחשבה מהירה, כמעט בלתי מורגשת. פיתח את הטיפול הקוגניטיבי (CBT), שהפך לטיפול הנחקר ביותר בעולם על דיכאון וחרדה, והציב את הפסיכותרפיה על בסיס אמפירי.',
    quote: '"הטיפול הקוגניטיבי מבקש להקל על מצוקות נפשיות באמצעות תיקון תפיסות שגויות ואותות פנימיים. תיקון אמונות שגויות מפחית תגובות מוגזמות."',
  },
  {
    id: 'van-der-kolk',
    name: 'בסל ון דר קולק',
    era: '1943–',
    emoji: '🫀',
    image: './images/van-der-kolk.webp',
    subject: 'psychology',
    bio: 'פסיכיאטר וחוקר טראומה הולנדי-אמריקאי. הראה שטראומה אינה רק זיכרון של אירוע, אלא חותם שהיא מותירה על הגוף ועל מערכת האזעקה שלו. ספרו "נרשם בגוף" הפך לרב-מכר עצום, ובד בבד גם שנוי במחלוקת בקהילה המדעית.',
    quote: '"טראומה אינה רק אירוע שהתרחש בעבר. היא גם החותם שהותירה החוויה על הנפש, על המוח ועל הגוף. לחותם הזה יש השלכות מתמשכות על האופן שבו האורגניזם מצליח לשרוד בהווה."',
  },
  // The Hebrew quote below is a translation of the English source line
  // (Richard Howard, "Madness and Civilization", 1965, Preface to the
  // 1961 edition) — not drawn from Aharon Amir's 1972 Hebrew translation,
  // which we did not consult. The attribution names the source book,
  // not a specific Hebrew edition, so the app does not falsely claim
  // Amir's phrasing.
  //
  // Provenance note: the chapter-5 source documents originally cited the
  // paraphrase "השיגעון אינו עובדה טבעית, אלא עובדה תרבותית" / "Madness
  // is not a natural fact, but a cultural fact." That line reads like
  // Foucault but does not appear in Howard's 1965 abridged translation
  // or Khalfa/Murphy's 2006 full translation — it circulates as a
  // scholarly gloss. Verified during the 2026-09-29 chapter-5 build and
  // replaced (here and in the dialogue's source block) with the
  // verifiable Preface line. If those documents resurface, do not
  // reintroduce the paraphrase.
  {
    id: 'foucault',
    name: 'מישל פוקו',
    era: '1926–1984',
    emoji: '🗂️',
    image: './images/foucault.webp',
    subject: 'psychology',
    bio: 'פילוסוף והיסטוריון צרפתי. חקר איך חברות מחליטות מה נחשב שיגעון, פשע או מחלה, ואיך ההחלטות האלה משתנות עם הזמן. בספרו "תולדות השיגעון" (1961) הראה שהגבול בין נורמלי לפתולוגי אינו נתון טבעי, אלא נקבע בידי בני אדם ומשתנה עם התרבות.',
    quote: '"שפת הפסיכיאטריה, שהיא מונולוג של התבונה על השיגעון, יכלה להיווצר רק בתוך שתיקה כזו."',
  },
  // Economics thinkers
  {
    id: 'mill-econ',
    name: 'ג\'ון סטיוארט מיל',
    era: '1806–1873',
    emoji: '🌻',
    image: './images/mill1.webp',
    subject: 'economics',
    bio: 'פילוסוף וכלכלן בריטי. הבחין בין חוקי הייצור (טבעיים) לחוקי החלוקה (חברתיים) - הבחנה ששינתה את ההיסטוריה של החשיבה הכלכלית.',
    quote: '"השאלה לעתיד היא לא איך לייצר יותר - אלא איך לחלק טוב יותר."',
  },
  {
    id: 'smith',
    name: 'אדם סמית',
    era: '1723–1790',
    emoji: '🏭',
    image: './images/smith.webp',
    subject: 'economics',
    bio: 'הכלכלן הסקוטי שהניח את היסודות לכלכלה המודרנית. ידוע במטאפורת "היד הנעלמה" - שוק חופשי המתואם את עצמו ללא תכנון מרכזי.',
    quote: '"אין זה מנדיבותו של הקצב, של מבשל השכר, או של האופה, שאנו מצפים לארוחת הערב שלנו, אלא מהתחשבותם באינטרסים שלהם."',
  },
  {
    id: 'locke',
    name: 'ג\'ון לוק',
    era: '1632–1704',
    emoji: '📜',
    image: './images/locke.webp',
    subject: 'economics',
    bio: 'הפילוסוף האנגלי שניסח את הבסיס הפילוסופי לזכות הקניין הפרטי - לא כהסכם חברתי אלא כזכות טבעית הנובעת מבעלות האדם על עצמו.',
    quote: '"לכל אדם יש קניין באישיותו עצמה... עמל גופו ועבודת ידיו הם, כפי שניתן לומר, שלו במלואם."',
  },
  {
    id: 'samuelson',
    name: 'פול סמואלסון',
    era: '1915–2009',
    emoji: '📊',
    image: './images/samuelson.webp',
    subject: 'economics',
    bio: 'הכלכלן האמריקאי הראשון לזכות בפרס נובל לכלכלה (1970). ספרו "כלכלה" (1948) הגדיר את הדיסציפלינה למשך עשורים.',
    quote: '"כלכלה היא חקר האופן שבו אנשים ואומות בוחרים להעסיק משאבים יצרניים נדירים..."',
  },
  {
    id: 'marx',
    name: 'קרל מרקס',
    era: '1818–1883',
    emoji: '⚙️',
    image: './images/marx.webp',
    subject: 'economics',
    bio: 'הפילוסוף והכלכלן הגרמני שביקר את הקפיטליזם מהיסוד. ב"הקפיטל" פיתח את תורת ערך העבודה וניתח את מנגנוני הניצול המובנים בייצור הקפיטליסטי.',
    quote: '"ההיסטוריה של כל החברה שהתקיימה עד כה היא היסטוריה של מאבקי מעמדות."',
  },
  {
    id: 'walras',
    name: 'לאון וולראס',
    era: '1834–1910',
    emoji: '🔢',
    image: './images/walras.webp',
    subject: 'economics',
    bio: 'הכלכלן השוויצרי שייסד את הכלכלה הנאו-קלאסית. פיתח את תורת שיווי המשקל הכללי - הרעיון שניתן לתאר מתמטית כיצד כל השווקים בכלכלה מגיעים לאיזון בו-זמנית.',
    quote: '"המחירים הם פתרון של מערכת משוואות סימולטנית."',
  },
  {
    id: 'sandel',
    name: 'מייקל סנדל',
    era: '1953–',
    emoji: '🏛️',
    image: './images/sandel.webp',
    subject: 'economics',
    bio: 'פילוסוף פוליטי אמריקאי מהרווארד. ידוע בביקורתו על הקפיטליזם וטיעונו שיש ספירות של חיים - חינוך, בריאות, דמוקרטיה - שבהן כסף לא אמור לקבוע.',
    quote: '"השוק אינו כלי ניטרלי - הוא מחדיר ערכים מסוימים לתחומים שבהם ערכים אחרים חשובים יותר."',
  },
  {
    id: 'keynes',
    name: 'ג\'ון מיינרד קיינס',
    era: '1883–1946',
    emoji: '💰',
    image: './images/keynes.webp',
    subject: 'economics',
    bio: 'הכלכלן הבריטי שטען שהשוק לא תמיד מתקן את עצמו ושמדינות חייבות להוציא כסף במשברים.',
    quote: '"בטווח הארוך, כולנו מתים."',
  },
  {
    id: 'friedman',
    name: 'מילטון פרידמן',
    era: '1912–2006',
    emoji: '🗽',
    image: './images/friedman.webp',
    subject: 'economics',
    bio: 'הכלכלן האמריקאי מאוניברסיטת שיקגו שטען שהשוק החופשי הוא יסוד החירות האנושית.',
    quote: '"אין ארוחת חינם."',
  },
  {
    id: 'sen',
    name: 'אמרטיה סן',
    era: '1933–',
    emoji: '🌍',
    image: './images/sen.webp',
    subject: 'economics',
    // Quote replaced 2026-09-29 in the card-quote audit. The prior
    // quote, "פיתוח הוא חירות." ("Development is freedom."), is a
    // slogan-reformatting of Sen's 1999 book title "Development as
    // Freedom" — not a sentence Sen wrote. Replaced with a verified
    // Sen line from the same book, cited widely and verbatim.
    bio: 'הכלכלן ההודי, חתן פרס נובל, שטען שפיתוח אמיתי אינו גידול ב-GDP אלא הרחבת היכולות של אנשים.',
    quote: '"רעב המוני מעולם לא התרחש בהיסטוריה בדמוקרטיה מתפקדת."',
  },
  {
    id: 'jevons',
    name: 'ויליאם סטנלי ג\'בונס',
    era: '1835–1882',
    emoji: '💎',
    image: './images/jevons.webp',
    subject: 'economics',
    bio: 'הכלכלן האנגלי שגילה את "התועלת השולית" - שערך מגיע לא מעבודה, אלא מהרצון של היחידה הבאה.',
    quote: '"ערך הוא יחס סובייקטיבי שאדם מקנה לדבר."',
  },
  {
    id: 'marshall',
    name: 'אלפרד מרשל',
    era: '1842–1924',
    emoji: '✂️',
    image: './images/marshall.webp',
    subject: 'economics',
    bio: 'הכלכלן הבריטי שאיחד את ההיצע והביקוש לדיאגרמה אחת - והניח את היסוד לכלכלה המודרנית.',
    quote: '"אנחנו יכולים להתווכח אם זה הסכין העליון או התחתון של המספריים שחותך פיסת נייר. אבל ברור שיש צורך בשני הסכינים."',
  },
  {
    id: 'kahneman',
    name: 'דניאל קהנמן',
    era: '1934–2024',
    emoji: '🧠',
    // Per-subject portraits: `image` is the fallback (used when the
    // rendering context's subject has no entry in `images[]`). Every
    // Kahneman-facing surface knows its subject and resolves via
    // _thinkerImage(t, subject) — see index.html and
    // generate-share-cards.mjs. Files deliberately suffixed so no
    // filename carries implicit-subject meaning.
    image: './images/kahneman-econ.webp',
    images: {
      economics:  './images/kahneman-econ.webp',
      psychology: './images/kahneman-psy.webp',
    },
    subject: 'economics',
    // Kahneman was a psychologist by training whose Nobel was in economics.
    // Primary bucket is economics (his Nobel context, frame color); the
    // subjects[] array lets dialogues in either bucket reference him without
    // tripping the validator's single-subject mismatch check.
    subjects: ['economics', 'psychology'],
    bio: 'הפסיכולוג הישראלי-אמריקאי שזכה בפרס נובל לכלכלה ב-2002 על הצגת ההטיות הקוגניטיביות שמשפיעות על החלטות כלכליות.',
    quote: '"הפסד של 100 דולר מורגש בערך פי שניים יותר מרווח של 100 דולר."',
  },
  {
    id: 'ricardo',
    name: 'דייוויד ריקרדו',
    era: '1772–1823',
    emoji: '🌾',
    image: './images/ricardo.webp',
    subject: 'economics',
    bio: 'הכלכלן הבריטי שניסח את חוק התפוקה השולית הפוחתת ואת תאוריית חלוקת ההכנסות בין מעמדות.',
    quote: '"כשמוסיפים יותר ויותר עבודה לאותה כמות של אדמה - היחידה הנוספת של עבודה תוסיף פחות תפוקה מהקודמת."',
  },
  {
    id: 'piketty',
    name: 'תומאס פיקטי',
    era: '1971–',
    emoji: '📊',
    image: './images/piketty.webp',
    subject: 'economics',
    bio: 'הכלכלן הצרפתי שמדד את ההון על פני 300 שנה, וגילה את הנוסחה r > g - תשואת ההון גדולה תמיד מקצב הצמיחה.',
    quote: '״כאשר תשואת ההון חורגת באופן מתמשך משיעור הצמיחה של הכלכלה - עושר תורשתי גדל מהר יותר מהכלכלה כולה.״',
  },
  {
    id: 'aquinas',
    name: 'תומאס אקווינס',
    era: '1225–1274',
    emoji: '✝️',
    image: './images/aquinas.webp',
    subject: 'economics',
    bio: 'נזיר דומיניקני ופילוסוף מימי הביניים שניסח את הרעיון של "המחיר הצודק", וקבע שלא כל מה שחוקי בשוק הוא צודק.',
    quote: '״למכור דבר ביותר מערכו האמיתי הוא חטא, אפילו אם אין חוק שאוסר זאת.״',
  },
  {
    id: 'pareto',
    name: 'וילפרדו פארטו',
    era: '1848–1923',
    emoji: '⚖️',
    image: './images/pareto.webp',
    subject: 'economics',
    bio: 'הכלכלן האיטלקי שניסה להפריד את הכלכלה משאלות מוסר, וניסח את מושג "יעילות פארטו" שהפך לבסיס הכלכלה המודרנית.',
    quote: '״מצב כלכלי הוא אופטימלי כאשר אי אפשר לשפר את רווחתו של אדם אחד בלי להפחית את רווחתו של אדם אחר.״',
  },
  {
    id: 'rawls',
    name: 'ג\'ון רולס',
    era: '1921–2002',
    emoji: '⚖️',
    image: './images/rawls.webp',
    subject: 'economics',
    bio: 'הפילוסוף האמריקאי שניסח את "מסך הבערות", ניסוי מחשבתי שמנסה להגדיר חברה צודקת מבלי לדעת מה יהיה מיקומך בה.',
    quote: '״רק מאחורי מסך של בערות, נוכל לבחור עקרונות צדק אמיתיים.״',
  },
  {
    id: 'nozick',
    name: 'רוברט נוזיק',
    era: '1938–2002',
    emoji: '🗽',
    image: './images/nozick.webp',
    subject: 'economics',
    bio: 'הפילוסוף האמריקאי הליברטריאני שניסח את "צדק כזכאות" כתגובה לרולס: צדק נמדד בתהליך, לא בתוצאה.',
    quote: '״מצב צודק הוא כל מצב שהושג בדרכים צודקות.״',
  },
  {
    id: 'hayek',
    name: 'פרידריך הייק',
    era: '1899–1992',
    emoji: '🌬️',
    image: './images/hayek.webp',
    subject: 'economics',
    bio: 'הכלכלן האוסטרי-בריטי שטען שהמושג "צדק חברתי" חסר משמעות: לא ניתן לכנות תוצאה של תהליך ספונטני "צודקת" או "לא צודקת".',
    quote: '״צדק יכול להיות תכונה של התנהגות אנושית, אך לא של מצב שאיש לא יצר במכוון.״',
  },
  // ─── Economics chapter 5 — "Growth and Development" ───
  {
    id: 'solow',
    name: 'רוברט סולו',
    era: '1924–2023',
    emoji: '📈',
    image: './images/solow.webp',
    subject: 'economics',
    bio: 'כלכלן אמריקאי חתן פרס נובל. הראה על בסיס נתוני ארה"ב מ־1909 עד 1949 שאת רוב הצמיחה הכלכלית אי אפשר להסביר בהצטברות הון, ושהשארית הלא־מוסברת, שכונתה מאוחר יותר "שארית סולו", מגלמת את הטכנולוגיה ואת הפרודוקטיביות. זכה בפרס נובל ב־1987.',
    quote: '"אני משתמש בביטוי \'שינוי טכנולוגי\' כקיצור לכל סוג של תזוזה בפונקציית הייצור."',
  },
  {
    id: 'romer',
    name: 'פול רומר',
    era: '1955–',
    emoji: '💡',
    image: './images/romer.webp',
    subject: 'economics',
    bio: 'כלכלן אמריקאי חתן פרס נובל. ענה על השאלה שסולו השאיר פתוחה, מאיפה מגיעה הטכנולוגיה, על ידי הכנסת הרעיונות אל תוך המודל הכלכלי. רעיונות נוצרים על ידי אנשים המגיבים לתמריצים, ובניגוד להון פיזי הם אינם יריבים: נוסחה אחת יכולה לשרת מיליון מפעלים בעת ובעונה אחת. זכה בפרס נובל ב־2018.',
    quote: '"צמיחה כלכלית מתרחשת בכל פעם שאנשים לוקחים משאבים ומסדרים אותם מחדש בדרכים בעלות ערך רב יותר."',
  },
  // North source-line note: the docx source for chapter 5 dialogue 3
  // smoothed the Nobel-lecture line — dropped "then" (×2), singularized
  // "activities" → "activity" (×4), and removed the "organizations —
  // firms —" parenthetical. The card and the dialogue's source block
  // both use the real Nobel-lecture wording (1993). Em-dashes are
  // preserved because they are North\'s punctuation, not editorial
  // prose — the "no em-dashes" project rule does not apply inside a
  // quoted source. If the docx surfaces again, do not reintroduce the
  // smoothed version.
  {
    id: 'north',
    name: 'דאגלס נורת',
    era: '1920–2015',
    emoji: '🎲',
    image: './images/north.webp',
    subject: 'economics',
    bio: 'היסטוריון כלכלי אמריקאי חתן פרס נובל. הגדיר את המוסדות כ"כללי המשחק", ובכללם חוקים פורמליים, נורמות בלתי־כתובות והאכיפה שלהם, וטען שהכללים האלה מסבירים מדוע ארצות מסוימות צומחות בעוד אחרות לא, גם כשאותה טכנולוגיה זמינה לכולן. זכה בפרס נובל ב־1993.',
    quote: '"אם המסגרת המוסדית מתגמלת פיראטיות, יקומו ארגונים פיראטיים; ואם המסגרת המוסדית מתגמלת פעילויות יצרניות, יקומו ארגונים — חברות — שיעסקו בפעילויות יצרניות."',
  },
  // Acemoglu entry covers the joint Acemoglu-and-Robinson dialogue
  // (chapter 5 dialogue 4) the same way the deci entry covers
  // Deci-and-Ryan in psychology chapter 2. The dialogue\'s thinker
  // display reads "אצ\'מוגלו ורובינסון" / "Acemoglu and Robinson",
  // thinkerId is \'acemoglu\', and Robinson has no separate card.
  {
    id: 'acemoglu',
    name: 'דארון אצ\'מוגלו',
    era: '1967–',
    emoji: '🗺️',
    image: './images/acemoglu.webp',
    subject: 'economics',
    bio: 'כלכלן טורקי־אמריקאי חתן פרס נובל. יחד עם מדען המדינה ג\'יימס רובינסון, חידד את הטענה של נורת על המוסדות בספרם "מדוע מדינות נכשלות" (2012), בהבחנה בין מוסדות מכילים, שמפזרים כוח כלכלי ופוליטי באופן רחב, לבין מוסדות מנצלים, המשרתים קבוצת עלית קטנה. טען שגם כאשר מוסדות מכילים יפיקו יותר עושר, העלית מתנגדת להם כי היא עלולה לאבד את מעמדה. זכה בפרס נובל ב־2024, יחד עם סיימון ג\'ונסון.',
    quote: '"הם חיים בעולם אחר, שעוצב על ידי מוסדות שונים."',
  },
  // Easterly source-line note: the docx wrote "efforts by those who
  // do care", but the real Easterly line (The White Man\'s Burden,
  // 2006) uses "efforts of those who do care". Card + dialogue source
  // both use the real wording. Do not reintroduce the "by" version.
  {
    id: 'easterly',
    name: 'ויליאם איסטרלי',
    era: '1957–',
    emoji: '🔍',
    image: './images/easterly.webp',
    subject: 'economics',
    bio: 'כלכלן אמריקאי. עבד במשך שנים בבנק העולמי והפך לאחד המבקרים החדים ביותר של סיוע לפיתוח. טען שהמערב הוציא טריליונים על תוכניות שנקבעו מלמעלה ולא הגיעו ליעדיהן, בעוד התערבויות זולות שבוצעו על ידי "מחפשים" מקומיים הגיעו לאנשים שהתוכניות לא הגיעו אליהם. הפיץ את ההבחנה בין מתכננים למחפשים בספרו "משא האדם הלבן" (2006).',
    quote: '"אנשים עניים מתים לא רק בגלל אדישות העולם לעוני שלהם, אלא גם בגלל מאמצים לא יעילים של אלה שכן איכפת להם."',
  },
  // Economics chapter 6 — "Behavioral Economics". Kahneman already defined
  // above (dual-subject entry, appears in psychology ch1 and economics ch6
  // dialogue 2 under the "Kahneman and Tversky" display). Simon, Thaler,
  // Shiller and Gigerenzer are new. No Tversky card (Kahneman-and-Tversky
  // uses the Deci-and-Ryan pattern). No Sunstein card (Thaler-and-Sunstein
  // dialogue reuses the thaler id, same pattern).
  //
  // Simon card quote: canonical bounded-rationality statement from
  // Models of Man (1957), p. 198. The docx's dialogue source cited
  // Simon's 1978 Nobel lecture with a smoothed satisficing summary;
  // card + dialogue source both now use the Models of Man line.
  //
  // Thaler card quote: opening sentence of "Mental Accounting Matters"
  // (JBDM, 1999). Replaces the docx's smoothed two-sentence paraphrase
  // of Thaler's mental-accounting examples from Misbehaving (2015).
  //
  // Shiller card quote: the headline finding from the 1981 AER paper
  // "Do Stock Prices Move Too Much", restored to the published abstract
  // wording (docx had dropped "far" and "real").
  //
  // Gigerenzer card quote: verbatim definition of a heuristic from
  // Gigerenzer and Gaissmaier, "Heuristic Decision Making" (Annual
  // Review of Psychology, 2011). Replaces the docx's version, which
  // was explicitly labelled "based on" Rationality for Mortals and
  // was therefore a paraphrase.
  {
    id: 'simon',
    name: 'הרברט סיימון',
    era: '1916–2001',
    emoji: '🧩',
    image: './images/simon.webp',
    subject: 'economics',
    bio: 'כלכלן, פסיכולוג וחלוץ הבינה המלאכותית האמריקאי שחתר תחת ההנחה שבני אדם ממקסמים. טבע את המונחים "רציונליות חסומה" ו"הסתפקות": מחפשים עד שמוצאים משהו מספיק טוב, ואז עוצרים, לא כפשרה מתוך חולשה אלא כנוהל יעיל. פרס נובל בכלכלה, 1978.',
    quote: '"יכולת המוח האנושי לנסח ולפתור בעיות מורכבות קטנה מאוד ביחס לגודל הבעיות שפתרונן נדרש כדי לנהוג באופן רציונלי אובייקטיבי בעולם האמיתי."',
  },
  {
    id: 'thaler',
    name: 'ריצ\'רד תיילר',
    era: '1945–',
    emoji: '🪙',
    image: './images/thaler.webp',
    subject: 'economics',
    bio: 'הכלכלן האמריקאי שהכניס את הפסיכולוגיה אל תוך הכלכלה. חקר את "אפקט הבעלות", שלפיו אנשים דורשים יותר כסף כדי לוותר על חפץ ממה שהם מוכנים לשלם כדי לקנותו, ואת "החשבונאות המנטלית", שבה כסף מחולק בראש לקופות עם כללים שונים. יחד עם כאס סנסטיין פיתח את רעיון ה"דחיפה": עיצוב הסביבה כך שבחירות שמשרתות אותנו יהיו הקלות ביותר. פרס נובל בכלכלה, 2017.',
    quote: '"חשבונאות מנטלית היא מכלול הפעולות הקוגניטיביות שבהן אנשים ומשקי בית משתמשים כדי לארגן, להעריך ולעקוב אחר פעילויות פיננסיות."',
  },
  {
    id: 'shiller',
    name: 'רוברט שילר',
    era: '1946–',
    emoji: '🎢',
    image: './images/shiller.webp',
    subject: 'economics',
    bio: 'הכלכלן האמריקאי שהראה שמחירי מניות נעים הרבה יותר ממה שהעובדות מצדיקות, פי חמישה עד שלושה עשר. חיבר את הפסיכולוגיה לכלכלת שווקים, ופרסם את "Irrational Exuberance" ב-2000, רגע לפני התפוצצות בועת הדוט-קום, ובמהדורת 2005 התריע על שוק הדיור. פרס נובל בכלכלה, 2013.',
    quote: '"מדדי התנודתיות של מחירי המניות במאה האחרונה נראים גבוהים מדי בהרבה, פי חמישה עד שלושה עשר ממה שאפשר לייחס למידע חדש על דיבידנדים ריאליים עתידיים."',
  },
  {
    id: 'gigerenzer',
    name: 'גרד גיגרנצר',
    era: '1947–',
    emoji: '🧭',
    image: './images/gigerenzer.webp',
    subject: 'economics',
    bio: 'הפסיכולוג הגרמני שחלק על הגישה של כהנמן וטברסקי. טען שקיצורי דרך קוגניטיביים אינם פגם אלא כלי: היוריסטיקה שמתעלמת מרוב המידע עשויה להיות מדויקת ויעילה יותר משיטות מורכבות, אם היא מותאמת לסביבה שבה היא פועלת. מנהל ותיק במכון מקס פלנק בברלין, מחבר "רציונליות לבני תמותה" (2008).',
    quote: '"היוריסטיקה היא אסטרטגיה שמתעלמת מחלק מהמידע, במטרה לקבל החלטות מהר יותר, בחיסכון רב יותר ו/או במדויק יותר משיטות מורכבות יותר."',
  },
];

const THINKERS_EN = [
  // Socrates bio/quote replaced 2026-09-29 in the card-quote audit.
  // Prior quote "I know that I know nothing" is a widely-repeated
  // tradition line that does not appear verbatim in Plato — closest
  // real passage is Apology 21d ("I neither know nor think that I
  // know"), verified there. Replaced with the trial line from Apology
  // 38a, which is (a) verified verbatim, (b) already used by the
  // onboarding taste at index.html:15817, so the card and the taste
  // now match. See the matching HE entry above for the full note.
  { id:'socrates', name:'Socrates', era:'470–399 BCE', emoji:'🦉', image:'./images/socrates.webp', bio:'The great Athenian philosopher who wrote nothing yet transformed Western thought. Famous for the Socratic method of dialogue and for what he said in defense of the philosophical life at his trial, recorded in Plato\'s "Apology" (38a).', quote:'"The unexamined life is not worth living."' },
  { id:'plato', name:'Plato', image:'./images/plato.webp', era:'428–348 BCE', emoji:'🏛', bio:'Student of Socrates and master of allegory. Developed the Theory of Forms - the world we perceive is only a shadow of true reality. Founded the Academy, the first institution of higher learning in the Western world.', quote:'"Philosophical inquiry is the liberation of the soul."' },
  { id:'russell', name:'Bertrand Russell', image:'./images/russell.webp', era:'1872–1970', emoji:'📐', bio:'British philosopher, mathematician, and Nobel laureate. Saw philosophy as a critical tool for examining life and the world - and for learning to live with uncertainty rather than false certainty.', quote:'"The philosopher is one who can live with uncertainty."' },
  { id:'wittgenstein', name:'Wittgenstein', image:'./images/wittgenstein.webp', era:'1889–1951', emoji:'🔤', bio:'One of the most influential philosophers of the 20th century. Claimed the limits of our language are the limits of our world - and that most philosophical problems dissolve once we clarify what we are actually saying.', quote:'"The limits of my language mean the limits of my world."' },
  { id:'aurelius', name:'Marcus Aurelius', image:'./images/aurelius.webp', era:'121–180 CE', emoji:'👑', bio:'Roman emperor and Stoic philosopher. Wrote the Meditations - a private journal of daily reminders - as self-discipline for living well. One of history\'s most powerful men who genuinely tried to live by his philosophy.', quote:'"The happiness of your life depends upon the quality of your thoughts."' },
  { id:'aristotle', name:'Aristotle', image:'./images/aristotle.webp', era:'384–322 BCE', emoji:'🌿', bio:'Student of Plato who ultimately broke with his teacher. Created formal logic, empirical biology, and political philosophy. Defined happiness as eudaimonia - flourishing through reason and virtue.', quote:'"Wonder is the beginning of philosophy."' },
  { id:'descartes', name:'Descartes', era:'1596–1650', image:'./images/descartes.webp', emoji:'🕯️', bio:'Father of modern philosophy. Sought a foundation for knowledge that could withstand radical doubt - and found it in the thinking self: "I think, therefore I am."', quote:'"I think, therefore I am."' },
  { id:'kant', name:'Immanuel Kant', era:'1724–1804', image:'./images/kant.webp', emoji:'⚖️', bio:'German philosopher considered one of the greatest of all time. Created the categorical imperative - a universal moral principle grounded in reason, not consequences. Famously lived by an unvarying daily schedule in Königsberg.', quote:'"Act only according to that maxim whereby you can will it to become a universal law."' },
  { id:'mill', name:'John Stuart Mill', era:'1806–1873', image:'./images/mill.webp', emoji:'🌻', bio:'British philosopher and founder of modern utilitarianism. A child prodigy who read Greek at three, and suffered a severe breakdown at 20. Developed the greatest happiness principle and championed individual liberty.', quote:'"It is better to be Socrates dissatisfied than a fool satisfied."' },
  { id:'nietzsche', name:'Friedrich Nietzsche', era:'1844–1900', image:'./images/nietzsche.webp', emoji:'⚡', bio:'German philosopher and the most incisive critic of morality in philosophical history. Did not ask "what is moral?" but "where does morality come from?" - and found resentment lurking behind many noble-sounding values.', quote:'"There are no moral facts. There is only moral interpretation of facts."' },
  { id:'hume', name:'David Hume', era:'1711–1776', image:'./images/hume.webp', emoji:'🌊', bio:'Scottish philosopher and one of the most radical empiricists. Argued that all knowledge flows from experience and that reason alone can prove nothing about the world. His problem of induction remains philosophically unsolved.', quote:'"Custom is the great guide of human life."' },
  { id:'gettier', name:'Edmund Gettier', era:'1927–2021', image:'./images/gettier.webp', emoji:'⚙️', bio:'American philosopher who upended 2500 years of epistemology with a three-page paper in 1963. His counterexamples to the justified-true-belief analysis of knowledge sparked a debate that has never fully closed.', quote:'"Justified true belief - and still not knowledge."' },
  { id:'popper', name:'Karl Popper', era:'1902–1994', image:'./images/popper.webp', emoji:'🔬', bio:'Austrian-British philosopher who proposed the falsifiability criterion for science. A theory is scientific not because it is confirmed but because it can be refuted. His critique of Freud and Marx as unscientific remains provocative.', quote:'"Science does not progress through verification - but through falsification."' },
  { id:'spinoza', name:'Baruch Spinoza', era:'1632–1677', image:'./images/spinoza.webp', emoji:'✡️', bio:'Dutch-Jewish philosopher excommunicated from his community at age 23 for his revolutionary ideas. Developed monism - the idea that God and Nature are one substance (Deus sive Natura). His Ethics, written as a geometric system, is one of the most architecturally impressive texts in all of philosophy.', quote:'"The free man thinks of nothing less than of death, and his wisdom is a meditation not on death but on life."' },
  { id:'berkeley', name:'George Berkeley', era:'1685–1753', image:'./images/berkeley.webp', emoji:'👁️', bio:'Irish philosopher and Anglican bishop who argued that matter has no independent existence. Developed subjective idealism - esse est percipi ("to be is to be perceived"). Though it seems extreme, his theory was designed to defend religion against materialism, and received unexpected support from quantum physics.', quote:'"The existence of a thing perceived by the senses is nothing different from its being perceived."' },
  { id:'thomson', name:'Judith Jarvis Thomson', era:'1929–2020', image:'./images/thomson.webp', emoji:'🦉', bio:'American moral philosopher best known for the Trolley Problem thought experiment (1967), one of the most widely used tools in ethics. Her work on rights and personal identity reshaped analytic philosophy.', quote:'"The fact that you may cause harm to one does not make it impermissible for you to save five."' },
  { id:'bostrom', name:'Nick Bostrom', era:'1973–', image:'./images/bostrom.webp', emoji:'🖥️', bio:'Swedish philosopher and founding director of the Future of Humanity Institute at Oxford. Best known for the simulation argument (2003) and his work on existential risks to humanity.', quote:'"If posthuman civilizations run a large number of simulations of their forebears, then the vast majority of all minds having experiences like ours live inside a simulation."' },
  // Chapter 5: Freedom of Choice. Spinoza, Hume, Kant already defined above.
  { id:'laplace', name:'Pierre-Simon Laplace', era:'1749–1827', image:'./images/laplace.webp', emoji:'🌌', bio:'A French mathematician and astronomer who formulated the strictest version of determinism. In 1814 he described an intellect that, knowing all positions and forces at a single moment, could compute the entire future — a thought experiment that forced generations to ask whether human choice is anything more than a line in that calculation.', quote:'"We ought to regard the present state of the universe as the effect of its anterior state and as the cause of the one which is to follow."' },
  { id:'sartre', name:'Jean-Paul Sartre', era:'1905–1980', image:'./images/sartre.webp', emoji:'🚬', bio:'French existentialist philosopher who argued that human beings are not born with a fixed essence but create themselves through their choices. His slogan "existence precedes essence" and his claim that we are "condemned to be free" shaped a generation of thinking about responsibility and bad faith. Refused the Nobel Prize for Literature in 1964.', quote:'"Man is condemned to be free."' },
  // Libet quote is a verified direct passage from the 1985 BBS paper
  // ("Unconscious Cerebral Initiative…"). Same provenance pattern as the
  // economics / Foucault entries — the dialogue's source block quotes a
  // longer line from the same paper. See CLAUDE.md § Source attributions.
  { id:'libet', name:'Benjamin Libet', era:'1916–2007', image:'./images/libet.webp', emoji:'🧠', bio:'American neuroscientist whose 1983 experiment brought the free-will debate into the laboratory. He measured brain activity before conscious decisions and found that preparation begins about a third of a second before a person is aware of deciding. Libet himself rejected the strong deterministic reading, proposing that conscious will retains a veto in the window between awareness and action.', quote:'"The role of conscious free will would be, then, not to initiate a voluntary act, but rather to control whether the act takes place."' },
  // Economics thinkers
  { id:'mill-econ', name:'John Stuart Mill', era:'1806–1873', image:'./images/mill1.webp', emoji:'🌻', subject:'economics', bio:'British philosopher and economist. Distinguished between the laws of production (natural) and the laws of distribution (social) - a distinction that changed the history of economic thought.', quote:'"The question for the future is not how to produce more - but how to distribute better."' },
  { id:'smith', name:'Adam Smith', era:'1723–1790', emoji:'🏭', image:'./images/smith.webp', subject:'economics', bio:'The Scottish economist who laid the foundations of modern economics. Famous for the "invisible hand" metaphor - a self-coordinating free market without central planning.', quote:'"It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest."' },
  { id:'locke', name:'John Locke', era:'1632–1704', emoji:'📜', image:'./images/locke.webp', subject:'economics', bio:'The English philosopher who formulated the philosophical basis for private property - not as a social agreement but as a natural right derived from a person\'s ownership of themselves.', quote:'"Every man has a property in his own person… the labour of his body, and the work of his hands, we may say, are properly his."' },
  { id:'samuelson', name:'Paul Samuelson', era:'1915–2009', emoji:'📊', image:'./images/samuelson.webp', subject:'economics', bio:'The first American economist to win the Nobel Prize in Economics (1970). His textbook "Economics" (1948) defined the discipline for decades.', quote:'"Economics is the study of how people and nations choose to employ scarce productive resources - labor, capital, land - to produce commodities and distribute them for consumption."' },
  { id:'marx', name:'Karl Marx', era:'1818–1883', emoji:'⚙️', image:'./images/marx.webp', subject:'economics', bio:'The German philosopher and economist who critiqued capitalism from its foundations. In Capital he developed the labor theory of value and analyzed the mechanisms of exploitation built into capitalist production.', quote:'"The history of all hitherto existing society is the history of class struggles."' },
  { id:'walras', name:'Léon Walras', era:'1834–1910', emoji:'🔢', image:'./images/walras.webp', subject:'economics', bio:'The Swiss economist who founded neo-classical economics. Developed the theory of general equilibrium - the idea that it is possible to describe mathematically how all markets in the economy reach balance simultaneously.', quote:'"Prices are the solution to a system of simultaneous equations."' },
  { id:'sandel', name:'Michael Sandel', era:'1953–', emoji:'🏛️', image:'./images/sandel.webp', subject:'economics', bio:'American political philosopher at Harvard. Known for his critique of capitalism and his argument that there are spheres of life - education, health, democracy - where money should not decide.', quote:'"The market is not a neutral tool - it injects certain values into domains where other values matter more."' },
  { id:'keynes', name:'John Maynard Keynes', era:'1883–1946', emoji:'💰', image:'./images/keynes.webp', subject:'economics', bio:'The British economist who argued that the market does not always correct itself and that governments must spend money during crises.', quote:'"In the long run, we are all dead."' },
  { id:'friedman', name:'Milton Friedman', era:'1912–2006', emoji:'🗽', image:'./images/friedman.webp', subject:'economics', bio:'The American economist from the University of Chicago who argued that the free market is the foundation of human freedom.', quote:'"There\'s no such thing as a free lunch."' },
  // Sen quote replaced 2026-09-29 in the card-quote audit. Prior quote
  // "Development is freedom." is a slogan-reformat of Sen's 1999 book
  // title "Development as Freedom" — not a sentence he wrote. Replaced
  // with a verified line from the same book. See matching HE entry
  // above for provenance detail.
  { id:'sen', name:'Amartya Sen', era:'1933–', emoji:'🌍', image:'./images/sen.webp', subject:'economics', bio:'The Indian economist and Nobel laureate who argued that real development is not GDP growth but the expansion of people\'s capabilities.', quote:'"No famine has ever taken place in the history of the world in a functioning democracy."' },
  { id:'jevons', name:'William Stanley Jevons', era:'1835–1882', emoji:'💎', image:'./images/jevons.webp', subject:'economics', bio:'The English economist who discovered "marginal utility" - that value comes not from labor, but from the desire for the next unit.', quote:'"Value is a subjective relation that a person attributes to a thing."' },
  { id:'marshall', name:'Alfred Marshall', era:'1842–1924', emoji:'✂️', image:'./images/marshall.webp', subject:'economics', bio:'The British economist who united supply and demand into one diagram - and laid the foundation for modern economics.', quote:'"We might as well dispute whether it is the upper or the under blade of a pair of scissors that cuts a piece of paper. But it is clear that both blades are needed."' },
  { id:'kahneman', name:'Daniel Kahneman', era:'1934–2024', emoji:'🧠', image:'./images/kahneman-econ.webp', images:{ economics:'./images/kahneman-econ.webp', psychology:'./images/kahneman-psy.webp' }, subject:'economics', subjects:['economics','psychology'], bio:'The Israeli-American psychologist who won the Nobel Prize in Economics in 2002 for revealing the cognitive biases that influence economic decisions.', quote:'"A loss of $100 is felt about twice as strongly as a gain of $100."' },
  { id:'ricardo', name:'David Ricardo', era:'1772–1823', emoji:'🌾', image:'./images/ricardo.webp', subject:'economics', bio:'The British economist who formulated the law of diminishing marginal returns and the theory of income distribution between classes.', quote:'"As more and more labor is added to the same quantity of land - the additional unit of labor will add less production than the previous one."' },
  { id:'piketty', name:'Thomas Piketty', era:'1971–', emoji:'📊', image:'./images/piketty.webp', subject:'economics', bio:'The French economist who measured capital over 300 years, and discovered the formula r > g - the rate of return on capital is always greater than the rate of growth.', quote:'"When the rate of return on capital significantly exceeds the growth rate of the economy - inherited wealth grows faster than the entire economy."' },
  { id:'aquinas', name:'Thomas Aquinas', era:'1225–1274', emoji:'✝️', image:'./images/aquinas.webp', subject:'economics', bio:'A Dominican friar and medieval philosopher who formulated the idea of "the just price," and declared that not everything legal in the market is just.', quote:'"To sell something for more than its real value is a sin, even if no law forbids it."' },
  { id:'pareto', name:'Vilfredo Pareto', era:'1848–1923', emoji:'⚖️', image:'./images/pareto.webp', subject:'economics', bio:'The Italian economist who tried to separate economics from moral questions, and formulated the concept of "Pareto efficiency" which became the foundation of modern economics.', quote:'"An economic state is optimal when it is impossible to improve the welfare of one person without reducing the welfare of another."' },
  { id:'rawls', name:'John Rawls', era:'1921–2002', emoji:'⚖️', image:'./images/rawls.webp', subject:'economics', bio:'The American philosopher who formulated "the veil of ignorance," a thought experiment that tries to define a just society without knowing what your position in it will be.', quote:'"Only behind a veil of ignorance can we choose true principles of justice."' },
  { id:'nozick', name:'Robert Nozick', era:'1938–2002', emoji:'🗽', image:'./images/nozick.webp', subject:'economics', bio:'The American libertarian philosopher who formulated "justice as entitlement" as a response to Rawls: justice is measured by process, not by outcome.', quote:'"A just situation is any situation that was achieved through just means."' },
  { id:'hayek', name:'Friedrich Hayek', era:'1899–1992', emoji:'🌬️', image:'./images/hayek.webp', subject:'economics', bio:'The Austrian-British economist who argued that the concept of "social justice" is meaningless: the outcome of a spontaneous process cannot be called "just" or "unjust."', quote:'"Justice can be a property of human behavior, but not of a state that no one intentionally created."' },
  // Economics chapter 5 — "Growth and Development"
  { id:'solow',    name:'Robert Solow',        era:'1924–2023', emoji:'📈', image:'./images/solow.webp',    subject:'economics', bio:'An American economist and Nobel laureate. Showed with U.S. data from 1909 to 1949 that most economic growth cannot be explained by the accumulation of capital, and that the unexplained remainder, later called "the Solow residual", captures technology and productivity. Received the Nobel Prize in 1987.',                                                                                                                    quote:'"I am using the phrase \'technical change\' as a shorthand expression for any kind of shift in the production function."' },
  { id:'romer',    name:'Paul Romer',          era:'1955–',     emoji:'💡', image:'./images/romer.webp',    subject:'economics', bio:'An American economist and Nobel laureate. Answered the question Solow left open, where does technology come from, by placing ideas inside the economic model. Ideas are produced by people responding to incentives, and unlike physical capital they are non-rival: a single formula can serve a million factories at once. Received the Nobel Prize in 2018.',                                                                          quote:'"Economic growth occurs whenever people take resources and rearrange them in ways that are more valuable."' },
  // North source-line note: the docx source for chapter 5 dialogue 3
  // smoothed the Nobel-lecture line (dropped "then" ×2, singularized
  // "activities" → "activity" ×4, removed the "organizations — firms —"
  // parenthetical). The card + dialogue both use the real 1993 wording.
  // Em-dashes preserved: they are North's punctuation, not our prose.
  { id:'north',    name:'Douglass North',      era:'1920–2015', emoji:'🎲', image:'./images/north.webp',    subject:'economics', bio:'An American economic historian and Nobel laureate. Defined institutions as "the rules of the game", including formal laws, unwritten norms, and their enforcement, and argued that these rules explain why some countries grow while others do not, even when the same technology is available to everyone. Received the Nobel Prize in 1993.',                                                                            quote:'"If the institutional framework rewards piracy then piratical organizations will come into existence; and if the institutional framework rewards productive activities then organizations – firms – will come into existence to engage in productive activities."' },
  // Acemoglu entry covers the joint Acemoglu-and-Robinson dialogue
  // (chapter 5 dialogue 4), Deci-and-Ryan pattern. Dialogue's thinker
  // display: "Acemoglu and Robinson"; thinkerId: 'acemoglu'.
  { id:'acemoglu', name:'Daron Acemoglu',      era:'1967–',     emoji:'🗺️', image:'./images/acemoglu.webp', subject:'economics', bio:'A Turkish-American economist and Nobel laureate. Together with the political scientist James Robinson, sharpened North\'s argument about institutions in the book "Why Nations Fail" (2012), distinguishing between inclusive institutions, which spread economic and political power widely, and extractive ones, which serve a small elite. Argued that even when inclusive institutions would produce more wealth, elites resist them because they would lose their position. Received the Nobel Prize in 2024, together with Simon Johnson.', quote:'"They live in a different world shaped by different institutions."' },
  // Easterly source-line note: docx wrote "efforts by those who do
  // care"; the real book (The White Man's Burden, 2006) uses "efforts
  // of those who do care". Real wording used on card + in dialogue.
  { id:'easterly', name:'William Easterly',    era:'1957–',     emoji:'🔍', image:'./images/easterly.webp', subject:'economics', bio:'An American economist. Worked for years at the World Bank and became one of the sharpest critics of development aid. Argued that the West spent trillions on top-down plans that missed their targets, while cheap interventions delivered by local "searchers" reached people the plans did not. Popularized the distinction between planners and searchers in "The White Man\'s Burden" (2006).',                                                            quote:'"Poor people die not only because of the world\'s indifference to their poverty, but also because of ineffective efforts of those who do care."' },
  // Economics chapter 6 — "Behavioral Economics". Kahneman already defined
  // above (dual-subject). Simon, Thaler, Shiller, Gigerenzer are new.
  // Deci-and-Ryan pattern used for both Kahneman-and-Tversky (dialogue 2)
  // and Thaler-and-Sunstein (dialogue 4) — no Tversky or Sunstein card.
  // See the matching HE entries above for the full provenance notes on
  // the four card quotes (Simon → Models of Man 1957; Thaler → Mental
  // Accounting Matters 1999; Shiller → the 1981 AER paper, with "far"
  // and "real" restored; Gigerenzer → Heuristic Decision Making 2011,
  // replacing the docx's explicitly-paraphrased "based on" line).
  { id:'simon',      name:'Herbert Simon',    era:'1916–2001', emoji:'🧩', image:'./images/simon.webp',      subject:'economics', bio:'An American economist, psychologist and AI pioneer who overturned the assumption that human beings maximize. Coined the terms "bounded rationality" and "satisficing": we search until we find something good enough, and then we stop, not as a compromise born of weakness but as an efficient procedure. Received the Nobel Prize in Economics in 1978.',                                                                                                                 quote:'"The capacity of the human mind for formulating and solving complex problems is very small compared with the size of the problems whose solution is required for objectively rational behavior in the real world."' },
  { id:'thaler',     name:'Richard Thaler',   era:'1945–',     emoji:'🪙', image:'./images/thaler.webp',     subject:'economics', bio:'The American economist who brought psychology into economics. Studied the "endowment effect", by which people demand more money to give up an object than they will pay to acquire it, and "mental accounting", in which money is divided in the head into separate pots with different rules. Together with Cass Sunstein developed the idea of the "nudge": designing the environment so that the choices that serve us are the easy ones. Received the Nobel Prize in Economics in 2017.', quote:'"Mental accounting is the set of cognitive operations used by individuals and households to organize, evaluate, and keep track of financial activities."' },
  { id:'shiller',    name:'Robert Shiller',   era:'1946–',     emoji:'🎢', image:'./images/shiller.webp',    subject:'economics', bio:'The American economist who showed that stock prices move far more than the facts justify, five to thirteen times more. Linked psychology to market economics and published "Irrational Exuberance" in 2000, just before the dot-com bubble burst, and in its 2005 edition warned about the housing market. Received the Nobel Prize in Economics in 2013.',                                                                                                                                                                                                                               quote:'"Measures of stock price volatility over the past century appear to be far too high, five to thirteen times too high, to be attributed to new information about future real dividends."' },
  { id:'gigerenzer', name:'Gerd Gigerenzer',  era:'1947–',     emoji:'🧭', image:'./images/gigerenzer.webp', subject:'economics', bio:'The German psychologist who disputed Kahneman and Tversky\'s approach. Argued that cognitive shortcuts are not flaws but tools: a heuristic that ignores most of the information can be more accurate and more efficient than complex methods, when it is matched to the environment in which it operates. Long-time director at the Max Planck Institute in Berlin and author of "Rationality for Mortals" (2008).',                                                                                                                                               quote:'"A heuristic is a strategy that ignores part of the information, with the goal of making decisions more quickly, frugally, and/or accurately than more complex methods."' },
  // Psychology thinkers
  { id:'wundt',   name:'Wilhelm Wundt',    era:'1832–1920', emoji:'🧪', image:'./images/wundt.webp',   subject:'psychology', bio:'The German psychologist who founded the world\'s first psychological laboratory, in Leipzig in 1879. Declared that the mind is a subject for scientific inquiry - not for philosophical speculation. His method was abandoned; his idea still rules.',                                                                                                                                                                            quote:'"The book which I here present to the public is an attempt to mark out a new domain of science."' },
  { id:'james',   name:'William James',    era:'1842–1910', emoji:'🌊', image:'./images/james.webp',   subject:'psychology', bio:'An American philosopher-psychologist at Harvard. Argued against Wundt that consciousness is not a chain of discrete moments - it is a river. Coined the term "stream of consciousness" and founded functional psychology: not what consciousness is made of, but what it does.',                                                                                                                                    quote:'"Consciousness does not appear to itself chopped up in bits. It is nothing jointed - it flows."' },
  { id:'freud',   name:'Sigmund Freud',    era:'1856–1939', emoji:'🛋', image:'./images/freud.webp',   subject:'psychology', bio:'An Austrian physician from Vienna who invented psychoanalysis in the late 19th century. Discovered that most mental activity happens beneath the surface, in the unconscious, shaping every conscious act. Overturned the Western picture of the self.',                                                                                                                                                             quote:'"The division of the psychical into what is conscious and what is unconscious is the fundamental premise of psycho-analysis."' },
  { id:'jung',    name:'Carl Gustav Jung', era:'1875–1961', emoji:'🌀', image:'./images/jung.webp',    subject:'psychology', bio:'A Swiss psychologist, Freud\'s senior student and later his rival. Argued that beneath the personal unconscious lies a collective unconscious - a layer shared by all humans, holding archetypes that recur across myths, dreams, and stories in every culture.',                                                                                                                                                    quote:'"In addition to our immediate consciousness, there exists a second psychic system of a collective, universal, and impersonal nature which is identical in all individuals."' },
  { id:'skinner', name:'B. F. Skinner',    era:'1904–1990', emoji:'🐦', image:'./images/skinner.webp', subject:'psychology', bio:'An American psychologist at Harvard who led the radical-behaviorist revolution. Argued that all talk of an inner "mind" is empty speculation - psychology can only be a science if it measures observable behavior and its consequences: reinforcements and punishments.',                                                                                                                                                quote:'"A person does not act upon the world, the world acts upon him."' },
  { id:'rogers',  name:'Carl Rogers',      era:'1902–1987', emoji:'🌱', image:'./images/rogers.webp',  subject:'psychology', bio:'An American psychologist, founder of humanistic psychology. Rejected both Freud (who saw the person as a victim of repressed drives) and Skinner (who saw a biological machine) - and argued that the person is the subject of their own life, with an inner tendency to grow when given the right conditions.',                                                                                                     quote:'"It is perhaps best conceptualized as a tendency toward fulfillment, toward actualization, involving not only the maintenance but also the enhancement of the organism."' },
  // Psychology chapter 6 — "Can a person really change?" Rogers, Winnicott,
  // Beck and Frankl already defined elsewhere in this array. Breuer and
  // Miller are new.
  //
  // Breuer quote is from the 1893 Preliminary Communication he co-wrote
  // with Freud — verified direct line, the most-cited sentence in the
  // history of psychoanalysis. See CLAUDE.md § Source attributions.
  { id:'breuer',  name:'Josef Breuer',     era:'1842–1925', emoji:'💬', image:'./images/breuer.webp',   subject:'psychology', bio:'Austrian physician whose treatment of a patient he called Anna O., between 1880 and 1882, produced what she herself named "the talking cure" — the earliest form of psychoanalysis. Freud, who learned the method from Breuer, later developed it into his own theory. Breuer stepped back from psychoanalysis as it moved toward sexuality as its central explanation; his insight that symptoms yield when their origin is spoken survived.', quote:'"Hysterics suffer mainly from reminiscences."' },
  // Miller quote is from Miller/Hubble/Duncan, "Supershrinks: What Is the
  // Secret of Their Success?", Psychotherapy Networker, 2007 — verified
  // direct line, matches the dialogue source block attribution.
  { id:'miller',  name:'Scott D. Miller',  era:'1960–',     emoji:'📊', image:'./images/miller.webp',   subject:'psychology', bio:'American psychotherapist and researcher who moved the question "what works in therapy?" out of theory and into measurement. Co-founder of the International Center for Clinical Excellence; his work on feedback-informed treatment, outcome measurement, and the "Supershrinks" finding — that the best therapists are the ones who most consistently ask for and act on client feedback — reshaped how therapy quality is thought about outside any single school.', quote:'"The best therapists spend more time asking for feedback — and more importantly, acting on it — than less effective therapists."' },
  // Psychology chapter 2 — "What drives us?"
  { id:'adler',   name:'Alfred Adler',     era:'1870–1937', emoji:'⬆️', image:'./images/adler.webp',    subject:'psychology', bio:'An Austrian psychologist, once close to Freud and later his rival. Headed the Vienna Psychoanalytic Society until his stormy departure in 1911. Argued that the hidden engine of a person is not sexual but the wish to stop feeling small - what he called "the striving for superiority".',                                                                                                                              quote:'"To be human means to feel inferior, which presses ceaselessly toward its own conquest."' },
  { id:'maslow',  name:'Abraham Maslow',   era:'1908–1970', emoji:'🔺', image:'./images/maslow.webp',   subject:'psychology', bio:'An American psychologist who sought to explain why the same person wants different things at different stages of life. Ordered human needs into an ascending pyramid, from what is necessary for life up to self-actualization, and argued that a need that is satisfied ceases to motivate.',                                                                                                                            quote:'"What a man can be, he must be."' },
  { id:'frankl',  name:'Viktor Frankl',    era:'1905–1997', emoji:'✡️', image:'./images/frankl.webp',   subject:'psychology', bio:'A Viennese psychiatrist who survived the Nazi death camps. Developed logotherapy, "the third Viennese school," and argued that the deepest engine of a person is not drive-satisfaction or the wish for power - but the search for meaning.',                                                                                                                                                                             quote:'"Everything can be taken from a man but one thing: the last of the human freedoms, to choose one\'s attitude in any given set of circumstances."' },
  { id:'fromm',   name:'Erich Fromm',      era:'1900–1980', emoji:'🕊️', image:'./images/fromm.webp',    subject:'psychology', bio:'A German-Jewish psychoanalyst who fled Nazi Germany for the United States. Turned the question upside down: if freedom is so precious, why do people give it up willingly? Showed that freedom can be a burden, and that the modern person buys relief at the price of autonomy.',                                                                                                                                          quote:'"Freedom, though it has brought him independence and rationality, has made him isolated and, thereby, anxious and powerless."' },
  { id:'deci',    name:'Edward Deci',      era:'1942–',     emoji:'🎯', image:'./images/deci.webp',     subject:'psychology', bio:'An American psychologist who studied motivation in the laboratory. Discovered with Ryan that external reward for a task one loves actually pushes the reason for action from within to without, and later identified three basic needs: autonomy, competence, and relatedness.',                                                                                                                                          quote:'"Instead of asking how I can motivate people, we should ask how to create the conditions in which people will motivate themselves."' },
  // Psychology chapter 3 — "Where does who I am come from?"
  { id:'bowlby',    name:'John Bowlby',       era:'1907–1990', emoji:'🔗', image:'./images/bowlby.webp',    subject:'psychology', bio:'A British psychiatrist and psychoanalyst, founder of attachment theory. Worked with children who grew up in institutions after World War II, and discovered that a stable bond with a caregiving figure in the first two years shapes the pattern of relationships across life. Turned "the need for mother" from indulgence into biology.',                                                                             quote:'"Intimate attachments to other human beings are the hub around which a person\'s life revolves, not only when he is an infant or a toddler, but throughout his adolescence and his years of maturity as well, and on into old age."' },
  { id:'winnicott', name:'D. W. Winnicott',   era:'1896–1971', emoji:'🧸', image:'./images/winnicott.webp', subject:'psychology', bio:'A British pediatrician and psychoanalyst. Proposed the concept of the "good-enough mother," needed by the child not through perfection but through measured failure at the right time. The small failure is what enables the child to develop the capacity to cope alone.',                                                                                                                                              quote:'"The good-enough mother starts off with an almost complete adaptation to her infant\'s needs, and as time proceeds she adapts less and less completely, gradually, according to the infant\'s growing ability to deal with her failure."' },
  { id:'erikson',   name:'Erik Erikson',      era:'1902–1994', emoji:'🪜', image:'./images/erikson.webp',   subject:'psychology', bio:'A German-American developmental psychologist. Extended Freud in one decisive direction: psychological shaping does not end in childhood. Proposed eight life stages, from birth to old age, each carrying a crisis to resolve. Whoever does not resolve a crisis carries it forward.',                                                                                                                                    quote:'"Healthy children will not fear life if their elders have integrity enough not to fear death."' },
  { id:'kohut',     name:'Heinz Kohut',       era:'1913–1981', emoji:'👁️', image:'./images/kohut.webp',     subject:'psychology', bio:'An American psychoanalyst born in Vienna, founder of self psychology. Argued that the self is not built from internal validation but from being seen in another person\'s eyes. "The gleam in the parent\'s eye" is the basic condition for developing a sense of worth.',                                                                                                                                               quote:'"The gleam in the mother\'s eye, which mirrors the child\'s exhibitionistic display."' },
  { id:'bandura',   name:'Albert Bandura',    era:'1925–2021', emoji:'🎭', image:'./images/bandura.webp',   subject:'psychology', bio:'A Canadian-American psychologist at Stanford. Showed that a person learns not only through conditioning, but mainly through observing others. The 1961 Bobo doll experiment proved that children imitate the violence they saw in an adult. Proposed the third model after Freud and Skinner: not drives, not reinforcements, but social learning.',                                                                     quote:'"Learning would be exceedingly laborious, not to mention hazardous, if people had to rely solely on the effects of their own actions to inform them what to do. Fortunately, most human behavior is learned observationally through modeling."' },
  // Psychology chapter 4 — "Why are we locked into patterns?"
  { id:'klein',        name:'Melanie Klein',        era:'1882–1960', emoji:'🪆', image:'./images/klein.webp',        subject:'psychology', bio:'A Vienna-born, London-based psychoanalyst. Pioneer of child psychoanalysis through play. Developed object relations theory: we absorb inside us figures of the important people in our lives, and they continue to operate within us for decades after.',                                                                                                                                                                                     quote:'"Gratitude is closely bound up with trust in good figures. Through processes of projection and introjection, through inner wealth given out and taken back in, an enrichment and deepening of the ego takes place."' },
  { id:'anna-freud',   name:'Anna Freud',           era:'1895–1982', emoji:'🛡️', image:'./images/anna-freud.webp',   subject:'psychology', bio:'A Vienna-born psychoanalyst, Sigmund Freud\'s youngest daughter and a psychoanalyst in her own right. Turned the spotlight from the drives to the ego, and mapped an entire system of defense mechanisms, automatic strategies the mind activates in order to keep anxiety at a distance.',                                                                                                                                                     quote:'"This book is concerned with one problem only: the ways and means by which the ego wards off unpleasure and anxiety, and exercises control over impulsive behavior, affects and instinctive urges."' },
  { id:'beck',         name:'Aaron Beck',           era:'1921–2021', emoji:'💭', image:'./images/beck.webp',         subject:'psychology', bio:'An American psychiatrist trained as a psychoanalyst who discovered in the clinic a new phenomenon: between the event and the emotion passes a fast thought, almost imperceptible. Developed cognitive therapy (CBT), which became the most-researched treatment for depression and anxiety, and placed psychotherapy on an empirical footing.',                                                                                              quote:'"Cognitive therapy seeks to alleviate psychological stresses by correcting faulty conceptions and self-signals. By correcting erroneous beliefs we can lower excessive reactions."' },
  { id:'van-der-kolk', name:'Bessel van der Kolk',  era:'1943–',     emoji:'🫀', image:'./images/van-der-kolk.webp', subject:'psychology', bio:'A Dutch-American psychiatrist and trauma researcher. Showed that trauma is not only a memory of an event, but an imprint it leaves on the body and on its alarm system. His book "The Body Keeps the Score" became an enormous bestseller, and at the same time also controversial in the scientific community.',                                                                                                                             quote:'"Trauma is not just an event that took place sometime in the past; it is also the imprint left by that experience on mind, brain, and body. This imprint has ongoing consequences for how the human organism manages to survive in the present."' },
  // Psychology chapter 5 — "What is suffering and what is a symptom?"
  // Foucault quote is from the Preface to the 1961 edition of Histoire
  // de la folie, in Richard Howard's 1965 abridged English translation
  // "Madness and Civilization". See the matching Hebrew entry above for
  // the full provenance note (paraphrase-vs-verified quote correction
  // made 2026-09-29 during the chapter-5 build).
  { id:'foucault',     name:'Michel Foucault',      era:'1926–1984', emoji:'🗂️', image:'./images/foucault.webp',     subject:'psychology', bio:'A French philosopher and historian. Studied how societies decide what counts as madness, crime, or illness, and how those decisions shift over time. In his book "History of Madness" (1961) he showed that the line between normal and pathological is not a fact of nature but is set by human beings, and shifts with culture.',                                                                                                                            quote:'"The language of psychiatry, which is a monologue by reason about madness, could only have come into existence in such a silence."' },
];
