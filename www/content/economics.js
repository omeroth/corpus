// ─── economicsData: bilingual content for economics subject ──────────────────
const economicsData = {
  weeks: [
    {
      id: 1,
      title: 'היסודות', titleEn: 'The Foundations',
      subtitle: 'שאלות בסיסיות, תשובות מפתיעות', subtitleEn: 'Basic questions, surprising answers',
      days: [
        { id: 1, title: 'השאלות שאי אפשר לברוח מהן', titleEn: 'The Questions That Cannot Be Escaped', thinker: 'פול סמואלסון', thinkerEn: 'Paul Samuelson', thinkerId: 'samuelson', xp: 50, sections: [
          {
            type: 'idea',
            title: 'השאלות שאי אפשר לברוח מהן', titleEn: 'The Questions That Cannot Be Escaped',
            content: 'ב-1948 פרסם כלכלן בן 33 בשם פול סמואלסון ספר שישנה את האופן שבו לומדים כלכלה.</p><p>ההגדרה שלו הייתה רדיקלית בפשטותה: <strong>כלכלה היא המדע של בחירה תחת מחסור.</strong></p><p>לא כסף, לא שווקים, לא קפיטליזם. כל חברה - מהשבט הקדמון עד הציוויליזציה המודרנית - חייבת לענות על שלוש שאלות: <strong>מה לייצר? איך לייצר? עבור מי לייצר?</strong></p><p>ולמה הן בלתי נמנעות? כי המשאבים מוגבלים, והרצונות אינסופיים.',
            contentEn: 'In 1948, a 33-year-old economist named Paul Samuelson published a book that would change how economics is learned.</p><p>His definition was radical in its simplicity: <strong>economics is the science of choice under scarcity.</strong></p><p>Not money, not markets, not capitalism. Every society - from the primitive tribe to modern civilization - must answer three questions: <strong>What to produce? How to produce? For whom to produce?</strong></p><p>And why are they unavoidable? Because resources are limited, and desires are infinite.',
          },
          {
            type: 'source',
            title: 'סמואלסון על כלכלה', titleEn: 'Samuelson on Economics',
            quote: '״כלכלה היא המדע של איך בני אדם וחברות בוחרים להעסיק משאבי ייצור מוגבלים - שיש להם שימושים אלטרנטיביים - לייצר סחורות שונות ולחלק אותן לצריכה.״',
            quoteEn: '"Economics is the science of how human beings and societies choose to employ scarce productive resources - which have alternative uses - to produce various commodities and to distribute them for consumption."',
            attr: 'פול סמואלסון, *Economics: An Introductory Analysis*, 1948',
            attrEn: 'Paul Samuelson, *Economics: An Introductory Analysis*, 1948',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'המושג החזק ביותר שסמואלסון הציע הוא <strong>עלות אלטרנטיבית</strong>: לא מה שאתה משלם - אלא מה שאתה מוותר עליו.</p><p>תחשוב על אדם שמחליט ללמוד לתואר שני שנתיים. התשובה הנאיבית: שכר הלימוד עולה 80,000 שקלים. התשובה הסמואלסונית: אם היה מרוויח 200,000 שקלים בשנה - העלות האמיתית היא 480,000 שקלים.</p><p><strong>דוגמה מהחיים:</strong> חבר מציע לבוא לסרט. נראה שזה 50 שקלים על הכרטיס. אבל סמואלסון היה אומר: זה רק חלק. העלות האמיתית היא מה שלא תעשה באותן 3 שעות.</p><p><strong>כל "כן" הוא גם "לא".</strong>',
            contentEn: 'The most powerful concept Samuelson offered is <strong>opportunity cost</strong>: not what you pay - but what you give up.</p><p>Think of a person who decides to study for a Master\'s degree for two years. The naive answer: tuition costs 80,000 shekels. The Samuelsonian answer: if they would have earned 200,000 shekels a year - the true cost is 480,000 shekels.</p><p><strong>A life example:</strong> A friend offers to come to a movie. It seems the cost is 50 shekels for the ticket. But Samuelson would say: that\'s only part. The real cost is what you won\'t do in those 3 hours.</p><p><strong>Every "yes" is also a "no."</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'יש בהגדרה של סמואלסון משהו מטריד.</p><p>שלוש השאלות - מה, איך, עבור מי - קיימות בכל חברה. <strong>חברה קומוניסטית עונה עליהן (המדינה מחליטה), שבטית (המסורת מחליטה), קפיטליסטית (השוק מחליט).</strong></p><p>זה אומר שהשאלה האמיתית של הכלכלה היא לא "מה זה שוק?" אלא <strong>"איך אנחנו עונים על השאלות הללו?"</strong></p><p>וכאן סמואלסון פתח את הוויכוח שילווה את כל הפרק. <strong>חמשת ההוגים הבאים - סמית, מרקס, קיינס, פרידמן, סן - כל אחד ייתן תשובה אחרת.</strong>',
            contentEn: 'There is something disturbing in Samuelson\'s definition.</p><p>The three questions - what, how, for whom - exist in every society. <strong>A communist society answers them (the state decides), a tribal one (tradition decides), a capitalist one (the market decides).</strong></p><p>This means the real question of economics is not "what is the market?" but <strong>"how do we answer these questions?"</strong></p><p>And here Samuelson opened the debate that will accompany the whole chapter. <strong>The five thinkers to come - Smith, Marx, Keynes, Friedman, Sen - each will give a different answer.</strong>',
          },
          {
            type: 'quiz',
            question: 'סטודנט אומר: "אני לא חושב שיש לי בעיה כלכלית. אני לא רעב, יש לי בית. כלכלה לא רלוונטית לחיים שלי." איך סמואלסון היה מגיב לטענה הזו?',
            questionEn: 'A student says: "I don\'t think I have an economic problem. I\'m not hungry, I have a home. Economics is not relevant to my life." How would Samuelson respond to this claim?',
            options: [
              'אתה צודק - כלכלה רלוונטית רק לעניים',
              'גם אדם עשיר חי בתוך מחסור - של זמן, אנרגיה ואפשרויות',
              'תחכה - כשתהיה לך משפחה, תבין מה זה צרכים'
            ],
            optionsEn: [
              'You\'re right - economics is only relevant to the poor',
              'Even a rich person lives within scarcity - of time, energy, and possibilities',
              'Wait - when you have a family, you\'ll understand what needs are'
            ],
            correctIndex: 1,
            explanation: 'סמואלסון הראה שמחסור אינו רק מחסור בכסף. לכל אחד יש משאב מוגבל אחד לפחות: זמן. אדם בן 30 שיש לו עוד כ-60 שנה לחיות חייב לבחור איך לבלות אותן - וכל בחירה היא ויתור. הבעיה הכלכלית קיימת בחיים של כל אדם, גם של מיליארדר.',
            explanationEn: 'Samuelson showed that scarcity is not just scarcity of money. Everyone has at least one limited resource: time. A 30-year-old with about 60 years left to live must choose how to spend them - and every choice is a forgoing. The economic problem exists in every person\'s life, even a billionaire\'s.',
          },
          {
            type: 'quiz',
            question: 'מנכ"ל מציע לעובדת מקצועית שכר של 30,000 שקלים בחודש בעבודה תובענית מאוד. היא מסרבת. עמית שלו אומר: "היא לא הגיונית - מי מסרב ל-30,000?" איך סמואלסון היה מסביר את ההחלטה שלה?',
            questionEn: 'A CEO offers a professional woman a salary of 30,000 shekels a month in a very demanding job. She refuses. His colleague says: "She\'s not rational - who refuses 30,000?" How would Samuelson explain her decision?',
            options: [
              'היא לא הגיונית - צריך לקבל הצעות עם שכר טוב',
              'היא בטח מקבלת כסף ממקור אחר - אחרת זה לא הגיוני',
              'היא ערכה חישוב של עלות אלטרנטיבית: זמן, איכות חיים וערכים'
            ],
            optionsEn: [
              'She\'s not rational - one should accept good salary offers',
              'She must be getting money from another source - otherwise it doesn\'t make sense',
              'She made an opportunity cost calculation: time, quality of life, and values'
            ],
            correctIndex: 2,
            explanation: 'השכר הוא לא העלות היחידה - הוא הרווח. היא חשבה כמה הג\'וב הזה יעלה לה: שעות, סטרס, זמן שלא תהיה עם הילדים ופגיעה בבריאות. אם העלות האלטרנטיבית של ההזדמנות גבוהה מהרווח המוניטרי, ההחלטה הרציונלית היא לסרב.',
            explanationEn: 'The salary is not the only cost - it is the gain. She thought about what this job would cost her: hours, stress, time not with the children, and harm to her health. If the opportunity cost of the opportunity is greater than the monetary gain, the rational decision is to refuse.',
          },
          {
            type: 'quiz',
            question: 'מישהו אומר: "כלכלה היא רק על שווקים וכסף. למה זה רלוונטי למי שלא בעולם העסקים?" מה הייתה התשובה הסמואלסונית הקלאסית?',
            questionEn: 'Someone says: "Economics is only about markets and money. Why is this relevant to someone not in the business world?" What would the classical Samuelsonian response be?',
            options: [
              'אתה צודק - כלכלה רלוונטית רק לעולם העסקים',
              'כלכלה היא לימוד של בחירה תחת מחסור - וזה מקיף את כל החיים',
              'כלכלה לא רלוונטית לחיי היומיום - אלא רק לתיאוריה'
            ],
            optionsEn: [
              'You\'re right - economics is only relevant to the business world',
              'Economics is the study of choice under scarcity - and that encompasses all of life',
              'Economics is not relevant to daily life - only to theory'
            ],
            correctIndex: 1,
            explanation: 'ההגדרה של סמואלסון פתחה את הכלכלה לעולם רחב בהרבה ממסחר וכסף. כל בחירה היא כלכלית - כי כל בחירה כוללת ויתור. הזמן שלך, מערכות היחסים שלך והקריירה שלך - כולם דורשים בחירה תחת מחסור. כלכלה היא לא תחום של עסקים - היא מערכת חשיבה על החיים.',
            explanationEn: 'Samuelson\'s definition opened economics to a much broader world than commerce and money. Every choice is economic - because every choice includes a forgoing. Your time, your relationships, and your career - all require choice under scarcity. Economics is not a field of business - it is a system of thinking about life.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 2, title: 'הסדר שאף אחד לא תכנן', titleEn: 'The Order That No One Planned', thinker: 'אדם סמית', thinkerEn: 'Adam Smith', thinkerId: 'smith', xp: 50, sections: [
          {
            type: 'idea',
            title: 'הסדר שאף אחד לא תכנן', titleEn: 'The Order That No One Planned',
            content: 'לונדון, 1776. באותה שנה שאמריקה הכריזה על עצמאות, פילוסוף סקוטי בשם אדם סמית פרסם ספר באורך 900 עמודים: <em>"עושר העמים"</em>.</p><p>הרעיון המרכזי שלו פשוט כל כך שקשה להבין כמה היה רדיקלי: <strong>אדם שפועל לטובת עצמו, גם בלי לכוון לכך, גורם רווחה לחברה.</strong></p><p>עד אז, האמונה הרווחת הייתה הפוכה. אנשים חשבו שכלכלה חייבת להיות מתוכננת מלמעלה - על ידי המלך או הכנסייה. אם תיתן לאנשים לפעול חופשי, יתפתח כאוס.</p><p>סמית הסתכל סביבו וראה משהו אחר. לונדון לא הייתה מתוכננת, ובכל זאת - אנשים קיבלו לחם בכל בוקר. הכוח שיצר את הסדר הזה הוא מה שסמית קרא לו <strong>"היד הנעלמה"</strong>.',
            contentEn: 'London, 1776. The same year America declared its independence, a Scottish philosopher named Adam Smith published a 900-page book: <em>"The Wealth of Nations"</em>.</p><p>His central idea is so simple it\'s hard to grasp how radical it was: <strong>a person acting in their own interest, even without intending to, causes welfare for society.</strong></p><p>Until then, the prevailing belief was the opposite. People thought economics had to be planned from above - by the king or the church. If you let people act freely, chaos would develop.</p><p>Smith looked around and saw something else. London was not planned, and yet - people got bread every morning. The force that created this order is what Smith called <strong>"the invisible hand"</strong>.',
          },
          {
            type: 'source',
            title: 'סמית: היד הנעלמה', titleEn: 'Smith: The Invisible Hand',
            quote: '״איננו מצפים לארוחת הערב שלנו מנדיבותו של הקצב או האופה - אלא מהדאגה שלהם לאינטרס שלהם.״',
            quoteEn: '"It is not from the benevolence of the butcher or the baker that we expect our dinner - but from their regard to their own interest."',
            attr: 'אדם סמית, *עושר העמים*, 1776',
            attrEn: 'Adam Smith, *The Wealth of Nations*, 1776',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'האופה לא קם בבוקר וחושב "מה אעשה היום בשביל עירי האהובה?" הוא קם וחושב: "איך אתפרנס היום?"</p><p>ובכל זאת - הוא משרת אותך. כי אם הלחם שלו לא טוב, תעבור לאופה אחר. <strong>התחרות מאלצת אותו להיות שימושי, גם אם הוא רק חושב על עצמו.</strong></p><p><strong>דוגמה מהחיים:</strong> תחשוב על הסלולר שאתה מחזיק. אלפי אנשים - מהנדסים בסין, מעצבים בקליפורניה, נהגי משאית בגרמניה - פעלו כל אחד לטובת עצמו. איש מהם לא חשב עליך. אבל הם שירתו אותך - כי זה הדבר שהיה הכי טוב להם.',
            contentEn: 'The baker doesn\'t wake up thinking "what shall I do today for my beloved city?" He wakes up thinking: "how will I make a living today?"</p><p>And yet - he serves you. Because if his bread isn\'t good, you\'ll go to another baker. <strong>Competition forces him to be useful, even if he only thinks about himself.</strong></p><p><strong>A life example:</strong> Think of the smartphone you\'re holding. Thousands of people - engineers in China, designers in California, truck drivers in Germany - each acted in their own interest. None of them thought about you. But they served you - because that was the thing best for themselves.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'אבל סמית לא היה תמים. הוא לא טען שכל אנוכיות תורמת לחברה. הוא טען שזה קורה רק בתוך מסגרת של <strong>צדק, תחרות וחירות</strong>.</p><p>בלי צדק - חוזים לא נאכפים, השוק קורס. בלי תחרות - אופה אחד יכול לעשות מה שירצה. בלי חירות בחירה - אין שוק כלל.</p><p><strong>הוא לא היה "אבי השוק הפראי".</strong> הוא היה פילוסוף מוסרי שחשד עמוקות במונופולים וכתב: "אנשים בעלי אותו מקצוע מעולם לא נפגשים, אפילו לבילוי, מבלי שהשיחה תסתיים בקנוניה נגד הציבור."</p><p>ומכאן הוויכוח של כל הפרק. <strong>כל ההוגים הבאים - מרקס, קיינס, פרידמן, סן - מגיבים לסמית.</strong>',
            contentEn: 'But Smith was not naive. He didn\'t claim that all selfishness contributes to society. He claimed this happens only within a framework of <strong>justice, competition, and freedom</strong>.</p><p>Without justice - contracts aren\'t enforced, the market collapses. Without competition - one baker can do whatever he wants. Without freedom of choice - there is no market at all.</p><p><strong>He was not "the father of the wild market."</strong> He was a moral philosopher who was deeply suspicious of monopolies and wrote: "People of the same trade seldom meet together, even for merriment, without the conversation ending in a conspiracy against the public."</p><p>And from here, the debate of the whole chapter. <strong>All the thinkers to come - Marx, Keynes, Friedman, Sen - respond to Smith.</strong>',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "אדם סמית טען שאנוכיות זה טוב - שאם כל אחד יחשוב על עצמו, החברה תהיה טובה יותר." האם זו קריאה מדויקת של סמית?',
            questionEn: 'A friend says: "Adam Smith argued that selfishness is good - that if everyone thinks only of themselves, society will be better off." Is this an accurate reading of Smith?',
            options: [
              'כן - סמית האמין שאנוכיות היא תמיד טובה',
              'לא - אנוכיות תורמת לרווחה רק במסגרת של צדק ותחרות',
              'לא - סמית האמין שאנוכיות היא רעה ויש לדכא אותה'
            ],
            optionsEn: [
              'Yes - Smith believed selfishness is always good',
              'No - selfishness contributes to welfare only within a framework of justice and competition',
              'No - Smith believed selfishness is evil and should be suppressed'
            ],
            correctIndex: 1,
            explanation: 'סמית לא היה נאיבי. הוא כתב: "חברה לא יכולה להתקיים בלי צדק." אנוכיות תורמת לרווחה רק בתוך מסגרת של כללי משחק הוגנים, מערכת משפט שאוכפת חוזים ותחרות אמיתית. בלי אלה, אנוכיות הופכת להרסנית. סמית עצמו חשד במונופולים ודיבר על "נטיית הסוחרים להתאחד נגד הציבור".',
            explanationEn: 'Smith was not naive. He wrote: "Society cannot subsist without justice." Selfishness contributes to welfare only within a framework of fair rules, a legal system that enforces contracts, and real competition. Without these, selfishness becomes destructive. Smith himself was suspicious of monopolies and spoke of "merchants\' tendency to unite against the public".',
          },
          {
            type: 'quiz',
            question: 'ממשלה מחליטה לקבוע מחיר מקסימלי על לחם - 5 שקלים - כדי לעזור לעניים. הסוחרים אומרים שזה לא רווחי להם. איך סמית היה צופה את ההמשך?',
            questionEn: 'A government decides to set a maximum price on bread - 5 shekels - to help the poor. The merchants say it is not profitable for them. How would Smith predict what follows?',
            options: [
              'הסוחרים יקבלו את ההפסד וימשיכו לאפות',
              'הממשלה תצליח להוריד את המחיר בלי השלכות',
              'הסוחרים יקטינו את הייצור - ייווצר מחסור ושוק שחור'
            ],
            optionsEn: [
              'The merchants will accept the loss and continue baking',
              'The government will succeed in lowering the price without consequences',
              'The merchants will reduce production - a shortage and black market will form'
            ],
            correctIndex: 2,
            explanation: 'סמית היה אומר שכשמתערבים במנגנון המחיר, התוצאה לרוב הפוכה מהמתוכננת. אם אופה מפסיד על כל לחם - הוא יאפה פחות, וייווצר מחסור. אנשים יהיו מוכנים לשלם יותר בשוק השחור. במקום שלעניים יהיה לחם זול - לא יהיה להם לחם בכלל.',
            explanationEn: 'Smith would say that when one intervenes in the price mechanism, the result is usually the opposite of what was intended. If a baker loses on every loaf - he will bake less, and a shortage will form. People will be willing to pay more on the black market. Instead of the poor having cheap bread - they will have no bread at all.',
          },
          {
            type: 'quiz',
            question: 'סמית כתב שני ספרים גדולים: *תיאוריית הרגשות המוסריים* (1759) על אמפתיה וחמלה, ו*עושר העמים* (1776) על אנוכיות וכלכלה. הם נראים סותרים. מה ניתן להסיק מכך שאותו אדם כתב את שניהם?',
            questionEn: 'Smith wrote two great books: *The Theory of Moral Sentiments* (1759) on empathy and compassion, and *The Wealth of Nations* (1776) on selfishness and economics. They seem contradictory. What can be inferred from the fact that the same person wrote both?',
            options: [
              'סמית התבלבל בסוף חייו ושינה את דעתו',
              'סמית ראה את האדם כמורכב: גם אמפתיה וגם אינטרס עצמי',
              'סמית כתב את הספרים ביחד עם עוזרים שלא הסכימו'
            ],
            optionsEn: [
              'Smith got confused at the end of his life and changed his mind',
              'Smith saw man as complex: both empathy and self-interest',
              'Smith wrote the books with assistants who disagreed'
            ],
            correctIndex: 1,
            explanation: 'הסתירה היא רק לכאורה. סמית האמין שיש באדם שני כוחות: אמפתיה (שעובדת בקשרים אישיים) ואינטרס עצמי (שעובד בשוק האנונימי). שני הספרים הם שני צדדים של אותה מטבע. סמית לא היה כלכלן מנותק - הוא היה פילוסוף מוסרי. נחזור לזה בפרק על המוסר.',
            explanationEn: 'The contradiction is only apparent. Smith believed man has two forces: empathy (which works in personal relations) and self-interest (which works in the anonymous market). Both books are two sides of the same coin. Smith was not a detached economist - he was a moral philosopher. We will return to this in the chapter on morality.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 3, title: 'מה שסמית לא ראה', titleEn: 'What Smith Did Not See', thinker: 'קרל מרקס', thinkerEn: 'Karl Marx', thinkerId: 'marx', xp: 50, sections: [
          {
            type: 'idea',
            title: 'מה שסמית לא ראה', titleEn: 'What Smith Did Not See',
            content: 'לונדון, אמצע המאה ה-19. תשעים שנה אחרי שסמית פרסם את <em>"עושר העמים"</em>, גרמני בשם קרל מרקס יושב בספרייה הבריטית - ורואה משהו אחר לגמרי.</p><p>סמית ראה אופה ולקוח שמחליפים לחם בכסף לתועלת שניהם. מרקס ראה את הפועלים במפעלי הטקסטיל באנגליה: ילדים בני 8 שעובדים 14 שעות ביום, גברים שמתים בני 30 משחפת. <strong>כל זה במדינה שנחשבה הכי "מתקדמת" כלכלית בעולם.</strong></p><p>ומרקס שאל: איך זה אפשרי? סמית הבטיח שאם כל אחד יפעל לטובת עצמו, החברה תהיה טובה יותר. אבל החברה התעשרה - ובאותו זמן, מיליונים חיו בעוני נורא.</p><p>תשובת מרקס: <strong>סמית טעה בהנחת היסוד. השוק אינו מנגנון נייטרלי. הוא מערכת כוח.</strong>',
            contentEn: 'London, mid-19th century. Ninety years after Smith published <em>"The Wealth of Nations"</em>, a German named Karl Marx sits in the British Library - and sees something completely different.</p><p>Smith saw a baker and a customer exchanging bread for money to mutual benefit. Marx saw the workers in England\'s textile mills: 8-year-old children working 14 hours a day, men dying at 30 of tuberculosis. <strong>All this in the country considered the most economically "advanced" in the world.</strong></p><p>And Marx asked: how is this possible? Smith promised that if everyone acted in their own interest, society would be better off. But society grew rich - and at the same time, millions lived in terrible poverty.</p><p>Marx\'s answer: <strong>Smith was wrong in his foundational assumption. The market is not a neutral mechanism. It is a system of power.</strong>',
          },
          {
            type: 'source',
            title: 'מרקס: החופש הכפול', titleEn: 'Marx: The Double Freedom',
            quote: '״הפועל חופשי לבחור את מי לעבוד אצלו. אבל אין לו ברירה אחרת - לא יש לו דבר למכור פרט לכוח-העבודה שלו.״',
            quoteEn: '"The worker is free to choose whom to work for. But he has no other choice - he has nothing to sell other than his own labor-power."',
            attr: 'קרל מרקס, *הקפיטל*, 1867',
            attrEn: 'Karl Marx, *Das Kapital*, 1867',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'סמית אמר: בשוק החופשי, אנשים מתמקחים כשווים. שניהם חופשיים לקבל או לדחות.</p><p>מרקס אמר: זה נכון רק למראית עין. כשעובד פוגש בעל-הון, הם לא שווים. <strong>בעל-ההון יכול לחכות חודש בלי הסכם; העובד לא יכול לחכות אפילו יום. הוא רעב.</strong></p><p>החופש "לעזוב את העבודה" אינו חופש אמיתי כשהאלטרנטיבה היא רעב. <strong>העובד "מסכים" - אבל זו הסכמה של מי שאין לו אופציה אחרת.</strong></p><p><strong>דוגמה מהחיים:</strong> שליח באפליקציה. החברה אומרת לו: "אתה עצמאי, חופשי לעזוב". מבחינה חוקית - כן. בפועל - אם אין לו כסף לחודש הבא, אין לו ברירה. <strong>זה לא שוק חופשי. זה מבנה של כוח שמתחפש לשוק חופשי.</strong>',
            contentEn: 'Smith said: in the free market, people bargain as equals. Both are free to accept or refuse.</p><p>Marx said: this is only true on the surface. When a worker meets a capital-holder, they are not equals. <strong>The capital-holder can wait a month without an agreement; the worker cannot wait even a day. He is hungry.</strong></p><p>The freedom "to leave the job" is not real freedom when the alternative is starvation. <strong>The worker "agrees" - but this is the agreement of one who has no other option.</strong></p><p><strong>A life example:</strong> A delivery rider on an app. The company tells him: "You are independent, free to leave." Legally - yes. In practice - if he has no money for next month, he has no choice. <strong>This is not a free market. This is a structure of power disguised as a free market.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'מרקס לא טען שזה רק בגלל "אנשים רעים". הוא טען משהו עמוק יותר: <strong>הקפיטליזם עצמו - כמערכת - מוליד את הניצול.</strong></p><p>בעל-מפעל שמשלם לעובדיו "הוגן יותר" - יפסיד למתחרה שמשלם פחות. <strong>התחרות, שסמית ראה בה כוח חיובי, אצל מרקס היא הכוח שדוחף את כולם כלפי מטה.</strong></p><p>ויש למרקס תובנה רחבה יותר: <strong>הקפיטליזם נראה לנו "טבעי" - אבל הוא תופעה היסטורית.</strong> לפני 500 שנה היה פיאודליזם. לפני 2,000 שנה - עבדות. כל מערכת נראתה למי שחי בה כ"הסדר הטבעי", עד שהוחלפה.</p><p>זו הייתה התרומה הגדולה שלו, גם למי שלא מסכים עם המסקנות הפוליטיות. <strong>הוא הפך את הכלכלה משאלה של מנגנון טכני לשאלה של שיקול מוסרי וחברתי.</strong>',
            contentEn: 'Marx did not claim it is only because of "bad people." He claimed something deeper: <strong>capitalism itself - as a system - gives birth to exploitation.</strong></p><p>A factory owner who pays his workers "more fairly" - will lose to his competitor who pays less. <strong>Competition, which Smith saw as a positive force, for Marx is the force that pushes everyone downward.</strong></p><p>And Marx has a broader insight: <strong>capitalism seems "natural" to us - but it is a historical phenomenon.</strong> 500 years ago there was feudalism. 2,000 years ago - slavery. Every system seemed to those living in it as "the natural order," until it was replaced.</p><p>This was his great contribution, even for those who disagree with his political conclusions. <strong>He turned economics from a question of technical mechanism to a question of moral and social judgment.</strong>',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "השוק החופשי הוא הדרך הטבעית של בני אדם להתמקח. תמיד היה ככה ותמיד יהיה." איך מרקס היה מערער על הטענה הזו?',
            questionEn: 'A friend says: "The free market is the natural way for human beings to bargain. It has always been this way and always will be." How would Marx challenge this claim?',
            options: [
              'הוא צודק - קפיטליזם הוא הסדר הנצחי של הטבע',
              'קפיטליזם הוא תופעה היסטורית עם התחלה - וייתכן גם סוף',
              'אין דבר כזה "שוק" - הכל אשליה'
            ],
            optionsEn: [
              'He is right - capitalism is the eternal order of nature',
              'Capitalism is a historical phenomenon with a beginning - and possibly an end',
              'There is no such thing as "the market" - it is all an illusion'
            ],
            correctIndex: 1,
            explanation: 'מרקס היה היסטוריון. הוא ראה שלפני 500 שנה היה פיאודליזם, ולפני 2,000 שנה - עבדות. כל מערכת כלכלית נראתה למי שחי בה כ"הסדר הטבעי" - עד שהוחלפה. הקפיטליזם דומה: הוא התחיל עם המהפכה התעשייתית. לטעון שהוא נצחי זה לבלבל בין "מה שיש כרגע" ל"מה שחייב להיות תמיד".',
            explanationEn: 'Marx was a historian. He saw that 500 years ago there was feudalism, and 2,000 years ago - slavery. Every economic system seemed to those living in it as "the natural order" - until it was replaced. Capitalism is similar: it began with the Industrial Revolution. To claim it is eternal is to confuse "what exists now" with "what must always be."',
          },
          {
            type: 'quiz',
            question: 'סמית אמר שהשוק החופשי מוביל לרווחה ציבורית. מה הטיעון העיקרי של מרקס נגד זה?',
            questionEn: 'Smith said that the free market leads to public welfare. What is Marx\'s main argument against this?',
            options: [
              'סמית טעה כי השוק החופשי בכלל לא קיים',
              'סמית טעה כי כסף הוא רע - וצריך לבטל אותו',
              'השוק אינו זירת מיקוח בין שווים - בעל-ההון והפועל אינם שווים'
            ],
            optionsEn: [
              'Smith was wrong because the free market doesn\'t exist at all',
              'Smith was wrong because money is evil - and should be abolished',
              'The market is not an arena of bargaining between equals - the capital-holder and the worker are not equals'
            ],
            correctIndex: 2,
            explanation: 'מרקס לא טען שהשוק לא קיים או שכסף הוא "רע". הוא טען שסמית פספס משהו קריטי: המתמקחים אינם שווים מלכתחילה. בעל-ההון יכול לחכות; הפועל לא יכול. ולכן "ההסכמה החופשית" של הפועל לעבוד בתנאים גרועים אינה באמת חופשית. השוק לא יוצר אי-שוויון - הוא חושף ומנציח אי-שוויון שכבר קיים.',
            explanationEn: 'Marx did not claim the market doesn\'t exist or that money is "evil." He claimed Smith missed something critical: the bargainers are not equals to begin with. The capital-holder can wait; the worker cannot. Therefore the worker\'s "free agreement" to work under bad conditions is not really free. The market does not create inequality - it exposes and perpetuates inequality that already exists.',
          },
          {
            type: 'quiz',
            question: 'סטודנט אומר: "פועלים מקבלים שכר תמורת עבודתם. אם הם לא היו מרוצים, הם היו עוזבים. אין כאן ניצול." איך מרקס היה משיב?',
            questionEn: 'A student says: "Workers receive wages for their work. If they weren\'t satisfied, they would leave. There is no exploitation here." How would Marx respond?',
            options: [
              'אתה צודק - אם הם נשארים, סימן שזה הוגן',
              'החופש "לעזוב" אינו חופש אמיתי כשהאלטרנטיבה היחידה היא רעב',
              'הפועלים תמיד מנוצלים - אין שום הבדל בין עבודות'
            ],
            optionsEn: [
              'You\'re right - if they stay, it\'s a sign it\'s fair',
              'The freedom "to leave" is not a real freedom when the only alternative is starvation',
              'Workers are always exploited - there is no difference between jobs'
            ],
            correctIndex: 1,
            explanation: 'זו הביקורת המרכזית של מרקס. החופש החוקי "לעזוב את העבודה" אינו חופש אמיתי כשאין לאדם מספיק הון כדי להמתין. הוא יחזור לעבוד באותם תנאים - או יגווע ברעב. "ההסכמה" שלו אינה אישור לתנאים - היא תוצאה של כורח כלכלי. סמית הניח חופש בחירה; מרקס הראה שהחופש הזה תיאורטי בלבד עבור מי שתלוי לחלוטין בשכר העבודה שלו.',
            explanationEn: 'This is Marx\'s central critique. The legal freedom "to leave the job" is not a real freedom when a person has not enough capital to wait. He will return to work under the same conditions - or starve. His "agreement" is not approval of the conditions - it is the result of economic compulsion. Smith assumed freedom of choice; Marx showed that this freedom is only theoretical for one who is fully dependent on their wage labor.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 4, title: 'כשהשוק לא חוזר לאיזון', titleEn: 'When the Market Does Not Return to Balance', thinker: 'ג\'ון מיינרד קיינס', thinkerEn: 'John Maynard Keynes', thinkerId: 'keynes', xp: 50, sections: [
          {
            type: 'idea',
            title: 'כשהשוק לא חוזר לאיזון', titleEn: 'When the Market Does Not Return to Balance',
            content: 'אוקטובר 1929. הבורסה בניו יורק קורסת. תוך שנתיים, אדם אחד מתוך ארבעה בארה"ב מובטל. <strong>המשבר הגדול.</strong></p><p>הכלכלנים הקלאסיים - תלמידיו של סמית - אמרו: תחכו. השוק יתקן את עצמו. כשהשכר ירד מספיק, מעסיקים יחזרו לשכור.</p><p>אבל זה לא קרה. שנה, שנתיים, שלוש - והכלכלה רק החמירה.</p><p>באנגליה ישב כלכלן בן 50 בשם ג\'ון מיינרד קיינס וצפה בכישלון התיאוריה הקלאסית. ב-1936 הוא פרסם ספר שיהפוך אותו לכלכלן המשפיע ביותר של המאה.</p><p>הטענה שלו הייתה רדיקלית: <strong>השוק לא תמיד מתקן את עצמו.</strong> הוא יכול להישאר תקוע באבטלה גבוהה - אולי לנצח.',
            contentEn: 'October 1929. The New York Stock Exchange crashes. Within two years, one in four people in the US is unemployed. <strong>The Great Depression.</strong></p><p>The classical economists - Smith\'s disciples - said: wait. The market will correct itself. When wages drop enough, employers will hire again.</p><p>But it didn\'t happen. One year, two, three - and the economy only got worse.</p><p>In England, a 50-year-old economist named John Maynard Keynes sat watching the failure of classical theory. In 1936 he published a book that would make him the most influential economist of the century.</p><p>His claim was radical: <strong>the market does not always correct itself.</strong> It can remain stuck in high unemployment - perhaps forever.',
          },
          {
            type: 'source',
            title: 'קיינס: בטווח הארוך', titleEn: 'Keynes: In the Long Run',
            quote: '״בטווח הארוך, כולנו מתים. הכלכלנים מציבים לעצמם משימה קלה מדי, חסרת תועלת מדי, אם בעונת הסערה הם רק יכולים לומר לנו שכאשר הסערה תעבור, הים יהיה שוב שטוח.״',
            quoteEn: '"In the long run we are all dead. Economists set themselves too easy, too useless a task if in tempestuous seasons they can only tell us that when the storm is long past the ocean is flat again."',
            attr: 'ג\'ון מיינרד קיינס, *A Tract on Monetary Reform*, 1923',
            attrEn: 'John Maynard Keynes, *A Tract on Monetary Reform*, 1923',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'הכלכלנים הקלאסיים אמרו: אל תדאגו לאבטלה - השוק יתקן את עצמו. בעוד חמש שנים, או עשר, האיזון יחזור.</p><p>קיינס ענה: <strong>בטווח הארוך כולנו מתים.</strong> אם לשוק ייקח עשר שנים לתקן את עצמו - אנחנו לא יכולים לחכות. באותן עשר שנים, מיליונים יסבלו.</p><p>ולפי קיינס, הבעיה עוד יותר עמוקה: כשאנשים פוחדים, הם חוסכים. כשחוסכים, קונים פחות. כשקונים פחות, מפעלים מפטרים. ועובדים מובטלים קונים עוד פחות. <strong>ספירלה שמזינה את עצמה.</strong></p><p>איך יוצאים ממנה? לפי קיינס, מישהו צריך להוציא כסף. ואם הפרטים פוחדים - <strong>המדינה תוציא.</strong></p><p><strong>דוגמה מהחיים:</strong> משבר הקורונה 2020. עסקים נסגרו, אנשים פוטרו, הביקוש קרס. ממשלות הוציאו מאות מיליארדים על מענקים. החוב הציבורי קפץ - והכלכלה התחילה לזוז שוב. <strong>זה היה קיינס בפעולה.</strong>',
            contentEn: 'The classical economists said: don\'t worry about unemployment - the market will correct itself. In five years, or ten, balance will return.</p><p>Keynes answered: <strong>in the long run we are all dead.</strong> If it takes the market ten years to correct itself - we cannot wait. In those ten years, millions will suffer.</p><p>And according to Keynes, the problem is even deeper: when people fear, they save. When they save, they buy less. When they buy less, factories fire workers. And unemployed workers buy even less. <strong>A spiral that feeds itself.</strong></p><p>How do you get out of it? According to Keynes, someone has to spend money. And if individuals are afraid - <strong>the state will spend.</strong></p><p><strong>A life example:</strong> The COVID crisis of 2020. Businesses closed, people were fired, demand collapsed. Governments spent hundreds of billions on grants. Public debt jumped - and the economy started moving again. <strong>This was Keynes in action.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'קיינס לא היה אנטי-שוק. הוא היה כלכלן ליברלי שאהב את השוק - אבל ראה את גבולותיו.</p><p>ההצעה שלו הייתה דרך שלישית בין סמית למרקס: <strong>לתת לשוק לעבוד - אבל להוסיף לו מנגנון חירום.</strong> בזמנים רגילים - המדינה זזה הצידה. בזמני משבר - המדינה נכנסת ומפעילה את הכלכלה.</p><p>אחרי מלחמת העולם השנייה, רוב המדינות המערביות אימצו את הגישה הזו במשך כ-30 שנה - עד שפרידמן ערער עליה.</p><p>אבל ההישג הגדול של קיינס לא נעלם. הוא הראה <strong>שכלכלה אינה מנגנון אוטומטי. היא תוצר של החלטות אנושיות.</strong> השאלה איננה "האם להתערב?" אלא <strong>"מתי, איך, וכמה?"</strong>',
            contentEn: 'Keynes was not anti-market. He was a liberal economist who loved the market - but saw its limits.</p><p>His proposal was a third way between Smith and Marx: <strong>let the market work - but add to it an emergency mechanism.</strong> In normal times - the state steps aside. In times of crisis - the state enters and activates the economy.</p><p>After World War II, most Western countries adopted this approach for about 30 years - until Friedman challenged it.</p><p>But Keynes\'s great achievement did not vanish. He showed <strong>that economics is not an automatic mechanism. It is a product of human decisions.</strong> The question is not "should we intervene?" but <strong>"when, how, and how much?"</strong>',
          },
          {
            type: 'quiz',
            question: 'במשבר הגדול, האבטלה בארה"ב הגיעה ל-25%. כלכלן קלאסי אומר: "תחכו - השוק יתקן את עצמו." איך קיינס היה מגיב?',
            questionEn: 'In the Great Depression, unemployment in the US reached 25%. A classical economist says: "Wait - the market will correct itself." How would Keynes respond?',
            options: [
              'הוא צודק - צריך לחכות שהשוק יחזור לאיזון בעצמו',
              'אין שום דבר שאפשר לעשות במשבר כזה',
              'לפעמים השוק נתקע - והמתנה משמעותה שנים של סבל מיותר'
            ],
            optionsEn: [
              'He is right - we should wait for the market to return to balance on its own',
              'There is nothing that can be done in such a crisis',
              'Sometimes the market gets stuck - and waiting means years of unnecessary suffering'
            ],
            correctIndex: 2,
            explanation: 'קיינס הראה שאיזון של אבטלה גבוהה הוא איזון יציב - הוא לא מתפרק לבד. בלי התערבות, המשבר יכול להימשך שנים. ובמהלך השנים האלה, מיליוני אנשים חיים בעוני. הקלאסיקנים מציעים סבלנות; קיינס מציע פעולה.',
            explanationEn: 'Keynes showed that an equilibrium of high unemployment is a stable equilibrium - it does not break apart on its own. Without intervention, the crisis can last for years. And during those years, millions of people live in poverty. The classicals propose patience; Keynes proposes action.',
          },
          {
            type: 'quiz',
            question: 'ממשלה במשבר כלכלי לוקחת הלוואה גדולה ומוציאה אותה על בניית כבישים ובתי ספר. חבר אומר: "זה לא הגיוני - איך אפשר לפתור משבר על ידי לקיחת חוב?" איך קיינס היה מסביר את ההיגיון?',
            questionEn: 'A government in economic crisis takes a large loan and spends it on building roads and schools. A friend says: "It doesn\'t make sense - how can you solve a crisis by taking debt?" How would Keynes explain the logic?',
            options: [
              'הידיד צודק - חוב תמיד מחמיר את המצב',
              'ההוצאה הציבורית יוצרת ביקוש שמפעיל מחדש את הכלכלה',
              'ההוצאה נועדה רק לפרסום פוליטי'
            ],
            optionsEn: [
              'The friend is right - debt always makes things worse',
              'Public spending creates demand that re-activates the economy',
              'The spending is just for political publicity'
            ],
            correctIndex: 1,
            explanation: 'ההיגיון הקיינסיאני: כשפרטים פוחדים, הם חוסכים. כשכולם חוסכים, אף אחד לא קונה, ומפעלים מפטרים עובדים. המדינה היא הצרכן האחרון שיכול להזיז את הכלכלה. היא מוציאה - עובדים מקבלים שכר - הם קונים - מפעלים מייצרים. החוב הוא השקעה במנוע, לא ויתור.',
            explanationEn: 'The Keynesian logic: when individuals fear, they save. When everyone saves, no one buys, and factories fire workers. The state is the last consumer that can move the economy. It spends - workers receive wages - they buy - factories produce. Debt is investment in the engine, not a concession.',
          },
          {
            type: 'quiz',
            question: 'סמית טען שהשוק יוצר רווחה כשנותנים לו לפעול. מה ההתערבות הקיינסיאנית בטענה הזו?',
            questionEn: 'Smith argued that the market creates welfare when we let it operate. What is the Keynesian intervention in this claim?',
            options: [
              'השוק לא יוצר רווחה - תמיד צריך תכנון מרכזי',
              'סמית טעה לחלוטין - כלכלה זה לא על שוק כלל',
              'השוק יוצר רווחה רוב הזמן - אבל לא תמיד, ואז נדרשת התערבות'
            ],
            optionsEn: [
              'The market doesn\'t create welfare - central planning is always needed',
              'Smith was completely wrong - economics isn\'t about the market at all',
              'The market creates welfare most of the time - but not always, and then intervention is needed'
            ],
            correctIndex: 2,
            explanation: 'קיינס לא ביטל את סמית. הוא הוסיף סייג חשוב: השוק עובד טוב - בזמנים רגילים. במשברים, הוא יכול להיכשל. ההצעה שלו אינה לבטל את השוק, אלא להוסיף לו מנגנון חירום. בזמנים טובים - תנו לשוק לעבוד. בזמני משבר - תנו למדינה להפעיל את הכלכלה. זוהי "הדרך השלישית" בין סמית למרקס.',
            explanationEn: 'Keynes did not abolish Smith. He added an important caveat: the market works well - in normal times. In crises, it can fail. His proposal is not to abolish the market, but to add to it an emergency mechanism. In good times - let the market work. In times of crisis - let the state activate the economy. This is the "third way" between Smith and Marx.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 5, title: 'השוק כשומר על החירות', titleEn: 'The Market as a Guardian of Freedom', thinker: 'מילטון פרידמן', thinkerEn: 'Milton Friedman', thinkerId: 'friedman', xp: 50, sections: [
          {
            type: 'idea',
            title: 'השוק כשומר על החירות', titleEn: 'The Market as a Guardian of Freedom',
            content: 'שיקגו, אמצע המאה ה-20. שלושים שנה אחרי שקיינס לימד את העולם שהמדינה חייבת להתערב, מתחיל לעלות קול אחר. כלכלן בשם מילטון פרידמן, באוניברסיטת שיקגו, יוצא נגד הדומיננטיות הקיינסיאנית.</p><p>הוא ראה משהו שקיינס לא הדגיש: <strong>השוק החופשי אינו רק מנגנון ליעילות כלכלית - הוא יסוד של החירות האנושית.</strong></p><p>הטיעון של פרידמן: <strong>כשהמדינה שולטת בכלכלה, היא שולטת גם בחיים האישיים.</strong> אם הממשלה מחליטה מה לייצר, איך לייצר ועבור מי - היא בעצם מחליטה איך אתה תחיה.</p><p>פרידמן הסתכל על ברית המועצות וראה לא רק חוסר יעילות, אלא אובדן חירות. ואז הכריז: <strong>חופש כלכלי וחופש פוליטי אינם נפרדים. אם תאבד את האחד - תאבד את השני.</strong>',
            contentEn: 'Chicago, mid-20th century. Thirty years after Keynes taught the world that the state must intervene, another voice begins to rise. An economist named Milton Friedman, at the University of Chicago, comes out against Keynesian dominance.</p><p>He saw something Keynes did not emphasize: <strong>the free market is not just a mechanism for economic efficiency - it is a foundation of human freedom.</strong></p><p>Friedman\'s argument: <strong>when the state controls the economy, it also controls personal lives.</strong> If the government decides what to produce, how to produce, and for whom - it essentially decides how you will live.</p><p>Friedman looked at the Soviet Union and saw not just inefficiency, but loss of freedom. Then he declared: <strong>economic freedom and political freedom are inseparable. If you lose one - you\'ll lose the other.</strong>',
          },
          {
            type: 'source',
            title: 'פרידמן: כלכלה וחירות', titleEn: 'Friedman: Economy and Freedom',
            quote: '״כשהמדינה שולטת באמצעי הפרנסה של אזרחיה, היא שולטת בכל מה שהם יכולים לעשות, לומר או לחשוב.״',
            quoteEn: '"When the state controls the means of livelihood of its citizens, it controls everything they can do, say, or think."',
            attr: 'מילטון פרידמן, *Capitalism and Freedom*, 1962',
            attrEn: 'Milton Friedman, *Capitalism and Freedom*, 1962',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'הטיעון של פרידמן מבוסס על תובנה פשוטה: <strong>בשוק חופשי יש לך אפשרויות. בכלכלה מתוכננת - אין.</strong></p><p>אם אתה לא אוהב את המעסיק שלך, אתה יכול לעבור למעסיק אחר. אם אתה לא אוהב את החנות, אתה יכול לקנות במקום אחר. <strong>התחרות נותנת לך כוח</strong> - כי הספקים נאלצים להתחשב בך, אחרת תלך למתחרה.</p><p>בכלכלה מתוכננת, אין למי ללכת. המדינה היא המעסיק, המדינה היא החנות, המדינה היא הכל. <strong>אתה תלוי בה לחלוטין.</strong></p><p><strong>דוגמה מהחיים:</strong> דמיין סופר במדינה שבה הממשלה שולטת בכל ההוצאות לאור. הוא רוצה לכתוב ספר ביקורתי כלפי הממשלה. מי יפרסם אותו? ההוצאה היחידה היא של המדינה - שהיא בעצמה המבוקרת. <strong>בלי שוק חופשי - אין חופש ביטוי פומבי.</strong>',
            contentEn: 'Friedman\'s argument is based on a simple insight: <strong>in a free market, you have options. In a planned economy - there are none.</strong></p><p>If you don\'t like your employer, you can move to another. If you don\'t like the store, you can buy somewhere else. <strong>Competition gives you power</strong> - because suppliers must take you into account, otherwise you\'ll go to a competitor.</p><p>In a planned economy, there\'s no one to go to. The state is the employer, the state is the store, the state is everything. <strong>You are completely dependent on it.</strong></p><p><strong>A life example:</strong> Imagine an author in a country where the government controls all publishing houses. He wants to write a book critical of the government. Who will publish it? The only publisher is the state - which is itself the one being criticized. <strong>Without a free market - there is no public freedom of expression.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הצד החזק של פרידמן: כל המדינות הדמוקרטיות הן גם כלכלות שוק. הקשר בין חירות כלכלית לפוליטית אינו רק תיאוריה - הוא תופעה היסטורית.</p><p>אבל יש גם צד בעייתי. פרידמן הניח שחופש פירושו פשוט היעדר התערבות מצד המדינה. ומה עם מי שאין לו משאבים?</p><p>מבקריו טענו: אדם בלי כסף בשוק חופשי הוא <strong>אדם בלי חירות בפועל</strong> - הוא לא יכול לבחור איפה לגור, מה לאכול, איך לטפל בילדיו. <strong>חופש שמותנה בכסף הוא חופש לעשירים בלבד.</strong> סן ייקח את הביקורת הזו ויעמיק אותה.</p><p>אבל פרידמן היה משיב: <strong>טוב יותר חירות שאינה שלמה מאשר היעדר חירות לחלוטין.</strong> בשוק החופשי יש סיכוי לצאת מהעוני; בעריצות - אין סיכוי לצאת מאף מקום.',
            contentEn: 'Friedman\'s strong side: all democratic countries are also market economies. The connection between economic and political freedom is not just theory - it is a historical phenomenon.</p><p>But there is also a problematic side. Friedman assumed that freedom simply means absence of state intervention. And what about those who have no resources?</p><p>His critics argued: a person without money in a free market is <strong>a person without freedom in practice</strong> - he can\'t choose where to live, what to eat, how to care for his children. <strong>Freedom conditioned on money is freedom for the wealthy only.</strong> Sen will take this critique and deepen it.</p><p>But Friedman would have answered: <strong>better an incomplete freedom than no freedom at all.</strong> In a free market there is a chance to escape poverty; in tyranny - there is no chance to escape anywhere.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "כלכלה זה רק על יעילות. לא קשור לחירות." איך פרידמן היה מערער על הטענה הזו?',
            questionEn: 'A friend says: "Economics is just about efficiency. It has nothing to do with freedom." How would Friedman challenge this claim?',
            options: [
              'הוא צודק - כלכלה היא תחום נפרד מערכים פוליטיים',
              'כלכלה ופוליטיקה אינן נפרדות - מי ששולט בכלכלה שולט בחיים',
              'כלכלה היא רק על כסף, לא על שום ערך עמוק יותר'
            ],
            optionsEn: [
              'He\'s right - economics is a field separate from political values',
              'Economics and politics are not separate - whoever controls the economy controls life',
              'Economics is only about money, not about any deeper value'
            ],
            correctIndex: 1,
            explanation: 'הטענה המרכזית של פרידמן: חופש כלכלי הוא הבסיס לחופש פוליטי. כשהמדינה שולטת באמצעי הפרנסה שלך - באיזו עבודה תעבוד ובאיזו דירה תגור - היא שולטת בחיים שלך, ואז גם חופש הביטוי שלך הופך לתיאורטי בלבד.',
            explanationEn: 'Friedman\'s central claim: economic freedom is the foundation of political freedom. When the state controls your means of livelihood - what job you\'ll work in and what apartment you\'ll live in - it controls your life, and then even your freedom of expression becomes merely theoretical.',
          },
          {
            type: 'quiz',
            question: 'קיינס טען שהמדינה חייבת להתערב במשברים כלכליים. איזו תגובה אופיינית לפרידמן?',
            questionEn: 'Keynes argued that the state must intervene in economic crises. What is a typical response from Friedman?',
            options: [
              'קיינס צדק - התערבות ממשלתית תמיד עוזרת',
              'המדינה צריכה להתערב עוד יותר ממה שקיינס הציע',
              'ההתערבות הממשלתית גורמת לבעיות יותר ממה שהיא פותרת'
            ],
            optionsEn: [
              'Keynes was right - government intervention always helps',
              'The state needs to intervene even more than Keynes proposed',
              'Government intervention causes more problems than it solves'
            ],
            correctIndex: 2,
            explanation: 'פרידמן טען שגם המשבר הגדול נגרם בעיקר על ידי טעויות של הבנק המרכזי האמריקאי - ולא על ידי כשל מולד של השוק. ההתערבות הממשלתית, גם בכוונות טובות, יוצרת עיוותים שמחמירים את המצב. הפתרון אינו עוד התערבות - אלא כללים יציבים וקבועים שמאפשרים לשוק לתפקד.',
            explanationEn: 'Friedman argued that even the Great Depression was caused mainly by mistakes of the American central bank - not by an inherent failure of the market. Government intervention, even with good intentions, creates distortions that worsen the situation. The solution is not more intervention - but stable, fixed rules that allow the market to function.',
          },
          {
            type: 'quiz',
            question: 'מרקס טען שהשוק מנצל את הפועלים. פרידמן ראה את העניין אחרת. מה הוויכוח?',
            questionEn: 'Marx argued that the market exploits workers. Friedman saw the matter differently. What\'s the debate?',
            options: [
              'פרידמן הסכים עם מרקס - השוק תמיד מנצל',
              'פרידמן ראה את השוק כמשחרר - נותן בחירה גם לחלשים',
              'הם הסכימו לחלוטין - שני הוגים זהים בעמדתם'
            ],
            optionsEn: [
              'Friedman agreed with Marx - the market always exploits',
              'Friedman saw the market as liberating - giving choice even to the weak',
              'They agreed completely - both thinkers identical in their position'
            ],
            correctIndex: 1,
            explanation: 'זו המחלוקת הבסיסית ביותר. מרקס ראה את הפועל כמי שאין לו ברירה - מוכרח לעבוד או לרעוב. פרידמן ראה את הפועל כמי שיש לו אופציות הודות לתחרות בין מעסיקים, חופש לעזוב וחופש להתפתח. שני ההוגים מסתכלים על אותה מציאות בדיוק ורואים דברים הפוכים - וזהו לב הוויכוח הכלכלי-פוליטי של המאה ה-20.',
            explanationEn: 'This is the most basic dispute. Marx saw the worker as having no choice - forced to work or starve. Friedman saw the worker as having options thanks to competition between employers, freedom to leave, and freedom to develop. The two thinkers look at exactly the same reality and see opposite things - and this is the heart of the economic-political debate of the 20th century.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 6, title: 'מה הכלכלה באמת מודדת?', titleEn: 'What Does Economics Really Measure?', thinker: 'אמרטיה סן', thinkerEn: 'Amartya Sen', thinkerId: 'sen', xp: 50, sections: [
          {
            type: 'idea',
            title: 'מה הכלכלה באמת מודדת?', titleEn: 'What Does Economics Really Measure?',
            content: 'בנגל, הודו, 1943. ילד בן תשע בשם אמרטיה סן רואה משהו שלא יעזוב אותו לעולם: <strong>הרעב הגדול.</strong> בין שניים לשלושה מיליון בני אדם מתים מרעב.</p><p>אבל ההלם של הילד הוא לא רק מהמוות - אלא ממשהו אחר.</p><p><strong>לא היה מחסור באוכל.</strong> הייצור החקלאי בבנגל באותה שנה היה תקין. היה אוכל - אבל לאנשים לא היה כסף לקנותו. הצבא הבריטי אצר מזון לחיילים, ייצא כמויות לחזיתות אחרות, והחרים סירות. המחירים זינקו, ומיליונים מתו ליד אוכל שעמד באסם.</p><p>הילד גדל והפך לכלכלן. <strong>רעב, הוא הראה, אינו תוצאה של חוסר באוכל - הוא תוצאה של חוסר ביכולת לרכוש אותו.</strong></p><p>ולאחר מכן הרחיב את התובנה לטענה גדולה יותר: <strong>כל הכלכלה מודדת את הדברים הלא נכונים.</strong> GDP, צמיחה, שכר - אלה רק כלים. אבל מהי התכלית?',
            contentEn: 'Bengal, India, 1943. A nine-year-old boy named Amartya Sen sees something that will never leave him: <strong>the Great Famine.</strong> Between two and three million people die of hunger.</p><p>But the boy\'s shock is not just from the death - but from something else.</p><p><strong>There was no shortage of food.</strong> Agricultural production in Bengal that year was normal. There was food - but people had no money to buy it. The British army hoarded food for soldiers, exported quantities to other fronts, and confiscated boats. Prices skyrocketed, and millions died next to food sitting in granaries.</p><p>The boy grew up and became an economist. <strong>Hunger, he showed, is not the result of lack of food - it is the result of lack of ability to purchase it.</strong></p><p>And then he expanded the insight into a bigger claim: <strong>all of economics measures the wrong things.</strong> GDP, growth, wages - these are just tools. But what is the purpose?',
          },
          {
            type: 'source',
            title: 'סן: פיתוח כחירות', titleEn: 'Sen: Development as Freedom',
            quote: '״הפיתוח יכול להיראות כתהליך של הרחבת היכולות של אנשים לחיות חיים שיש להם סיבה לרצות בהם.״',
            quoteEn: '"Development can be seen as a process of expanding the capabilities of people to live lives they have reason to want."',
            attr: 'אמרטיה סן, *Development as Freedom*, 1999',
            attrEn: 'Amartya Sen, *Development as Freedom*, 1999',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'הרעיון המרכזי של סן הוא <strong>גישת היכולות</strong>. הוא הציע שנמדוד הצלחה כלכלית לא דרך מה שיש לאדם - אלא דרך מה שהוא יכול לעשות בפועל.</p><p>הכלכלה הקלאסית מודדת בעיקר GDP. כשהוא עולה, המדינה "מצליחה". אבל סן אומר שההסתכלות הזו מייצרת עיוורון. <strong>ה-GDP סופר כסף וייצור, אבל אינו סופר את היכולת הממשית של בני אדם לפעול.</strong></p><p><strong>דוגמה מהחיים:</strong> שני אנשים מקבלים 5,000 שקלים בחודש.</p><p>הראשון: צעיר בריא בעיר עם תחבורה ציבורית, חינוך חינם, בריאות ציבורית. הוא יכול לחיות, ללמוד, להתפתח.</p><p>השני: קשיש חולה בכפר נידח, בלי תחבורה ובלי בריאות נגישה. רוב כספו הולך על תרופות.</p><p><strong>שניהם מקבלים אותו סכום. אבל היכולות שלהם שונות לחלוטין.</strong>',
            contentEn: 'Sen\'s central idea is the <strong>capabilities approach</strong>. He proposed that we measure economic success not through what a person has - but through what they can actually do.</p><p>Classical economics mainly measures GDP. When it rises, the country "succeeds." But Sen says this view creates blindness. <strong>GDP counts money and production, but does not count the actual capabilities of human beings to act.</strong></p><p><strong>A life example:</strong> Two people receive 5,000 shekels a month.</p><p>The first: a healthy young person in a city with public transportation, free education, public healthcare. He can live, study, develop.</p><p>The second: a sick elderly man in a remote village, without transportation or accessible healthcare. Most of his money goes to medicine.</p><p><strong>Both receive the same amount. But their capabilities are completely different.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'ההישג של סן שינה את העולם. בעקבות עבודתו, האו"ם פיתח את <strong>מדד הפיתוח האנושי (HDI)</strong> - מדידה שלוקחת בחשבון לא רק GDP, אלא גם תוחלת חיים והשכלה.</p><p>אבל יש לסן עוד תובנה - שמשנה את האופן שבו חושבים על פרידמן. סן ניתח את כל המקרים של רעב המוני במאה ה-20 - וגילה שלא היה בהם אף מקרה אחד של דמוקרטיה מתפקדת. <strong>הדמוקרטיה היא מנגנון הגנה מפני רעב.</strong></p><p>ובזה סן סוגר את הפרק. סמואלסון הגדיר את השאלות, סמית הציע מנגנון, מרקס גילה את הכוח, קיינס פתר משברים, פרידמן הגן על החירות.</p><p><strong>סן שאל שאלה אחרת: לאן אנחנו רוצים שכל זה ייקח אותנו?</strong> הכלכלה אינה מטרה. <strong>היא רק כלי. המטרה היא חיים שאדם בוחר לחיות.</strong>',
            contentEn: 'Sen\'s achievement changed the world. Following his work, the UN developed the <strong>Human Development Index (HDI)</strong> - a measurement that takes into account not only GDP, but also life expectancy and education.</p><p>But Sen has another insight - one that changes how we think about Friedman. Sen analyzed all the cases of mass famine in the 20th century - and discovered that not one of them occurred in a functioning democracy. <strong>Democracy is a protection mechanism against famine.</strong></p><p>And with this Sen closes the chapter. Samuelson defined the questions, Smith proposed a mechanism, Marx discovered the power, Keynes solved crises, Friedman defended freedom.</p><p><strong>Sen asked a different question: where do we want all this to take us?</strong> Economics is not a goal. <strong>It is just a tool. The goal is lives a person chooses to live.</strong>',
          },
          {
            type: 'quiz',
            question: 'מדינה צומחת ב-7% בשנה לאורך עשור וה-GDP (התוצר המקומי הגולמי) שלה גדל, אבל אחוז הנשים שלמדו באוניברסיטה לא השתנה כלל. איך סן היה מעריך את ההצלחה הכלכלית הזו?',
            questionEn: 'A country grows at 7% a year for a decade and its GDP grows, but the percentage of women who studied at university did not change at all. How would Sen evaluate this economic success?',
            options: [
              'הצלחה גדולה - הכלכלה צומחת בקצב מהיר',
              'אי-הצלחה - אם הצמיחה לא רחבה, היא לא משמעותית כלל',
              'הצלחה חלקית בלבד - צמיחה ללא הרחבת יכולות אינה מהווה פיתוח אמיתי'
            ],
            optionsEn: [
              'A great success - the economy is growing rapidly',
              'A failure - if growth is not broad, it has no meaning at all',
              'Only partial success - growth without expanding capabilities is not real development'
            ],
            correctIndex: 2,
            explanation: 'סן היה אומר שצמיחה כלכלית (עליית ה-GDP) היא כלי, לא יעד. אם המדינה צומחת אך היכולות הבסיסיות של חצי מאזרחיה אינן מתרחבות, הצמיחה לא הגיעה אליהם. המספרים היבשים שקריים - הם מסתירים את הכישלון של הפיתוח האנושי האמיתי.',
            explanationEn: 'Sen would say that economic growth (GDP growth) is a tool, not a goal. If a country grows but the basic capabilities of half its citizens are not expanding, the growth has not reached them. The dry numbers are misleading - they hide the failure of true human development.',
          },
          {
            type: 'quiz',
            question: 'בבנגל של 1943, מיליוני אנשים מתו ברעב באזור שייצר מספיק אוכל לכל אוכלוסייתו. איך סן הסביר את הסיטואציה הזו?',
            questionEn: 'In Bengal of 1943, millions of people died of hunger in a region that produced enough food for its entire population. How did Sen explain this situation?',
            options: [
              'הייתה בעיה לוגיסטית - האוכל פשוט לא הגיע למקום הנכון',
              'הרעב נגרם מחוסר ב"זכאויות" - ולא מחוסר פיזי באוכל',
              'תמיד יש רעב בזמן מלחמות - אין כאן מה להסביר'
            ],
            optionsEn: [
              'There was a logistical problem - the food simply did not reach the right place',
              'The famine was caused by a lack of "entitlements" - not by a physical lack of food',
              'There is always famine in wartime - there\'s nothing to explain here'
            ],
            correctIndex: 1,
            explanation: 'זו התובנה המכוננת של סן: רעב אינו בעיה של ייצור, אלא בעיה של גישה ונגישות. האוכל היה קיים באסמים, אבל לאנשים לא הייתה יכולת לקנות אותו בגלל אינפלציה, אובדן מקומות עבודה והחרמה צבאית בריטית של אספקה וכלי תחבורה. זכאויות - היכולת החוקית והכלכלית לרכוש, לגדל או לקבל מזון - הן הקריטריון האמיתי, ולא נפח הייצור.',
            explanationEn: 'This is Sen\'s founding insight: famine is not a problem of production, but a problem of access. The food existed in granaries, but people had no ability to buy it because of inflation, loss of jobs, and British military confiscation of supplies and transportation. Entitlements - the legal and economic ability to purchase, grow, or receive food - are the real criterion, not the volume of production.',
          },
          {
            type: 'quiz',
            question: 'פרידמן אמר ששוק חופשי מבטיח חירות. סן הוסיף הסתייגות לטענה הזו. מהי ההסתייגות?',
            questionEn: 'Friedman said that a free market guarantees freedom. Sen added a caveat to this claim. What is the caveat?',
            options: [
              'שוק חופשי לעולם אינו מבטיח חירות בשום מצב',
              'סן הסכים לחלוטין עם פרידמן - אין ביניהם שום הסתייגות',
              'חירות פורמלית בלבד אינה מספיקה - נדרשת יכולת ממשית לפעול'
            ],
            optionsEn: [
              'A free market never guarantees freedom under any circumstances',
              'Sen completely agreed with Friedman - there is no caveat between them',
              'Formal freedom alone is not enough - actual capability to act is required'
            ],
            correctIndex: 2,
            explanation: 'זו ההסתייגות המרכזית של סן: יש הבדל בין חופש פורמלי (המצב שבו החוק והשוק לא מונעים ממך משהו באופן רשמי) לבין חופש ממשי (המצב שבו יש לך את המשאבים, הבריאות וההשכלה לפעול). אדם רעב חופשי בשוק החופשי לקנות אוכל - אך אין לו חירות ממשית לבצע זאת כי אין לו כסף. חירות אמיתית דורשת בניית יכולות בסיסיות.',
            explanationEn: 'This is Sen\'s central caveat: there is a difference between formal freedom (the situation where law and the market do not officially prevent you from something) and actual freedom (the situation where you have the resources, health, and education to act). A hungry person is free in the free market to buy food - but he has no actual freedom to do so because he has no money. True freedom requires building basic capabilities.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 7, title: 'סיכום: מה זאת בכלל כלכלה?', titleEn: 'Summary: What is Economics Anyway?', thinker: 'סיכום פרק', thinkerEn: 'Chapter Summary', thinkerId: null, xp: 50, isSummary: true, sections: [
          {
            type: 'idea',
            title: 'סיכום: מה זאת בכלל כלכלה?', titleEn: 'Summary: What is Economics Anyway?',
            content: 'התחלנו את הפרק בשאלה פשוטה: <strong>מה זאת בכלל כלכלה?</strong></p><p>עכשיו, אחרי שישה דיאלוגים, ברור שזו לא שאלה תמימה. כי <strong>הכלכלה אינה תחום טכני של מספרים וגרפים - היא שדה ויכוח על איך לארגן חברה אנושית.</strong>',
            contentEn: 'We began the chapter with a simple question: <strong>what is economics anyway?</strong></p><p>Now, after six dialogues, it\'s clear this is not an innocent question. Because <strong>economics is not a technical field of numbers and graphs - it is a field of debate about how to organize human society.</strong>',
          },
          {
            type: 'source',
            isRecap: true,
            title: 'המסע שעברנו', titleEn: 'The Journey We Traveled',
            quote: '״סמואלסון הגדיר את השאלה. סמית הציע מנגנון. מרקס גילה את הכוח. קיינס פתר משברים. פרידמן הגן על החירות. סן שאל לאן כל זה לוקח אותנו.״',
            quoteEn: '"Samuelson defined the question. Smith proposed a mechanism. Marx discovered the power. Keynes solved crises. Friedman defended freedom. Sen asked where all of this is taking us."',
            attr: 'סיכום פרק 1',
            attrEn: 'Chapter 1 Summary',
            content: '<strong>סמואלסון</strong> הגדיר את השאלה: כל חברה חייבת לענות על שלוש שאלות - מה לייצר, איך לייצר, ועבור מי לייצר.</p><p><strong>סמית</strong> הציע מנגנון: השוק. אנשים שפועלים לטובת עצמם יוצרים רווחה לכולם. <strong>מרקס</strong> ערער: השוק אינו נייטרלי - הוא מבנה של כוח. החופש "לעזוב" אינו אמיתי כשהאלטרנטיבה היא רעב.</p><p><strong>קיינס</strong> הראה שהשוק לא תמיד מתקן את עצמו, ובמשברים המדינה חייבת להתערב. <strong>פרידמן</strong> ערער: חופש כלכלי הוא יסוד החירות. כשהמדינה שולטת בכלכלה, היא שולטת בחיים.</p><p><strong>סן</strong> סגר את הפרק: GDP אינו מטרה. <strong>המטרה היא חיים שאדם בוחר לחיות.</strong>',
            contentEn: '<strong>Samuelson</strong> defined the question: every society must answer three questions - what to produce, how to produce, and for whom to produce.</p><p><strong>Smith</strong> proposed a mechanism: the market. People acting in their own interest create welfare for everyone. <strong>Marx</strong> challenged: the market is not neutral - it is a structure of power. The freedom "to leave" is not real when the alternative is starvation.</p><p><strong>Keynes</strong> showed that the market does not always correct itself, and in crises the state must intervene. <strong>Friedman</strong> challenged: economic freedom is the foundation of liberty. When the state controls the economy, it controls life.</p><p><strong>Sen</strong> closed the chapter: GDP is not a goal. <strong>The goal is lives a person chooses to live.</strong>',
          },
          {
            type: 'explanation',
            title: 'מה למדנו בעצם', titleEn: 'What We Actually Learned',
            content: 'הוויכוח על "מה זאת בכלל כלכלה?" נראה טכני. אבל הוא לא.</p><p><strong>כל הוגה ענה אחרת לא בגלל שאחד מהם טעה - אלא כי הם החזיקו בערכים אחרים.</strong> סמית הדגיש חירות. מרקס - שוויון. קיינס - יציבות. פרידמן - חירות מכפייה. סן - יכולות אנושיות.</p><p><strong>אין תשובה אחת ל"מה זאת כלכלה?"</strong> יש מסגרת ויכוח שמשתרעת מ-1776 עד היום.',
            contentEn: 'The debate over "what is economics anyway?" looks technical. But it isn\'t.</p><p><strong>Each thinker answered differently not because one of them was wrong - but because they held different values.</strong> Smith emphasized freedom. Marx - equality. Keynes - stability. Friedman - freedom from coercion. Sen - human capabilities.</p><p><strong>There is no single answer to "what is economics?"</strong> There is a framework of debate that stretches from 1776 to today.',
          },
          {
            type: 'depth',
            title: 'השאלה לפרק הבא', titleEn: 'The Question for the Next Chapter',
            content: 'אבל יש שאלה אחת שכל ההוגים שלנו דרכו עליה בלי לעצור בה: <strong>מה ערכו של דבר?</strong></p><p>למה כוס מים זולה ויהלום יקר? מה הופך משהו ליקר?</p><p>זו השאלה של פרק 2.',
            contentEn: 'But there is one question all of our thinkers stepped over without stopping at it: <strong>what is the value of a thing?</strong></p><p>Why is a glass of water cheap and a diamond expensive? What makes something expensive?</p><p>This is the question of Chapter 2.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "כלכלה היא תחום מדעי, נטול ערכים." איך הפרק כולו ערער על הטענה הזו?',
            questionEn: 'A friend says: "Economics is a scientific, value-free field." How did the entire chapter challenge this claim?',
            options: [
              'החבר צודק - כלכלה היא רק עניין טכני של מספרים',
              'הכלכלה מתעסקת בערכים כי כל מענה לשאלות "מה, איך, ועבור מי" מבוסס על ערכים',
              'רק סן ערער על זה - שאר ההוגים הסכימו'
            ],
            optionsEn: [
              'The friend is right - economics is just a technical matter of numbers',
              'Economics deals with values because every answer to the questions "what, how, and for whom" is based on values',
              'Only Sen challenged this - the other thinkers agreed'
            ],
            correctIndex: 1,
            explanation: 'זו התובנה המרכזית של הפרק. השאלות הבסיסיות של הכלכלה הן ערכיות, גם אם הן נראות טכניות. "מה לייצר?" דורש החלטה אילו צרכים חשובים יותר. "איך לייצר?" דורש החלטה על תנאי עובדים. "עבור מי?" דורש החלטה על חלוקה הוגנת. אין דרך להתחמק מערכים - רק להסתיר אותם מאחורי נוסחאות.',
            explanationEn: 'This is the central insight of the chapter. The basic questions of economics are value-based, even if they look technical. "What to produce?" requires a decision about which needs are more important. "How to produce?" requires a decision about workers\' conditions. "For whom?" requires a decision about fair distribution. There is no way to escape values - only to hide them behind formulas.',
          },
          {
            type: 'quiz',
            question: 'פוליטיקאי אומר: "אנחנו צריכים מומחים כלכליים שיגידו לנו מה לעשות - הם יודעים את התשובות." איך תגיב לפי מה שלמדנו?',
            questionEn: 'A politician says: "We need economic experts to tell us what to do - they know the answers." How would you respond based on what we learned?',
            options: [
              'הפוליטיקאי צודק - מומחים יודעים יותר טוב',
              'אין "מומחה אובייקטיבי" - לכל מומחה יש הנחות ערכיות שעומדות בבסיס המלצותיו',
              'מומחים יכולים לעזור רק במשברים, לא בהחלטות יומיומיות'
            ],
            optionsEn: [
              'The politician is right - experts know better',
              'There is no "objective expert" - every expert has value assumptions that underlie their recommendations',
              'Experts can help only in crises, not in everyday decisions'
            ],
            correctIndex: 1,
            explanation: 'כל הוגי הפרק היו "מומחים". סמית, מרקס, קיינס, פרידמן, סן - כולם הסיקו מסקנות הפוכות מאותן עובדות. למה? כי הם החזיקו בערכים שונים. כשפוליטיקאי או מומחה אומר "זו ההמלצה הכלכלית" - שווה לשאול: על איזה ערכים היא מבוססת? פרידמן ימליץ להוריד מסים. סן ימליץ להגדיל השקעה בחינוך. אותה מציאות - מסקנות הפוכות.',
            explanationEn: 'All the thinkers in the chapter were "experts." Smith, Marx, Keynes, Friedman, Sen - all reached opposite conclusions from the same facts. Why? Because they held different values. When a politician or expert says "this is the economic recommendation" - it\'s worth asking: which values is it based on? Friedman would recommend lowering taxes. Sen would recommend increasing investment in education. Same reality - opposite conclusions.',
          },
          {
            type: 'quiz',
            question: 'בכלכלן מסוים אתה רואה דגש על: יציבות, התערבות ממשלתית במשברים, וחשש משווקים שנעצרים בחוסר ביקוש. על מי מההוגים בפרק מדובר?',
            questionEn: 'In a certain economist you see an emphasis on: stability, government intervention in crises, and concern about markets that halt due to lack of demand. Which of the thinkers in the chapter is being described?',
            options: [
              'אדם סמית - האב המייסד של הליברליזם הכלכלי',
              'מילטון פרידמן - המגן הגדול של השוק החופשי',
              'ג\'ון מיינרד קיינס - שראה משברים כמתמשכים והציע פעולה ממשלתית'
            ],
            optionsEn: [
              'Adam Smith - the founding father of economic liberalism',
              'Milton Friedman - the great defender of the free market',
              'John Maynard Keynes - who saw crises as prolonged and proposed government action'
            ],
            correctIndex: 2,
            explanation: 'קיינס. הוא טען שהשוק יכול להישאר תקוע באבטלה גבוהה לאורך זמן - וההמתנה לתיקון עצמי משמעה בזבוז של חיי אדם. הפתרון שלו: כשהפרטים פוחדים והביקוש קורס, המדינה צריכה להוציא כסף ולעורר את הכלכלה. הגישה הזו שלטה ברוב המדינות המערביות אחרי מלחמת העולם השנייה - עד שפרידמן ערער עליה.',
            explanationEn: 'Keynes. He argued that the market can remain stuck in high unemployment for a long time - and waiting for self-correction means wasting human lives. His solution: when individuals fear and demand collapses, the state must spend money and stimulate the economy. This approach dominated most Western countries after World War II - until Friedman challenged it.',
          },
          { type: 'quiz_summary' },
        ] },
      ],
    },
    {
      id: 2,
      title: 'ערך ומחיר', titleEn: 'Value and Price',
      subtitle: 'מה שווה דבר - ומי קובע?', subtitleEn: 'What is something worth - and who decides?',
      days: [
        { id: 1, title: 'פרדוקס המים והיהלום', titleEn: 'The Paradox of Water and Diamonds', thinker: 'אדם סמית', thinkerEn: 'Adam Smith', thinkerId: 'smith', xp: 50, sections: [
          {
            type: 'idea',
            title: 'פרדוקס המים והיהלום', titleEn: 'The Paradox of Water and Diamonds',
            content: 'נחזור לסמית - אבל הפעם עם שאלה אחרת.</p><p>ב-1776, באותו ספר שבו הציע את "היד הנעלמה", סמית הצביע על משהו מוזר: <strong>דברים חיוניים לחיים - זולים. דברים מותרות - יקרים.</strong></p><p>מים. בלעדיהם לא חיים. ובכל זאת - כמעט חינם. יהלומים. מיותרים לחלוטין. ובכל זאת - שווים הון.</p><p><strong>איך זה אפשרי?</strong> מה שווה ערך באמת - אם לא דברים שאנחנו חייבים?</p><p>זו הייתה השאלה שפתחה את הוויכוח הגדול של הפרק: <strong>מה קובע ערך?</strong>',
            contentEn: 'We return to Smith - but this time with a different question.</p><p>In 1776, in the same book where he proposed "the invisible hand," Smith pointed to something strange: <strong>things essential for life - are cheap. Luxury items - are expensive.</strong></p><p>Water. Without it we cannot live. And yet - almost free. Diamonds. Completely unnecessary. And yet - worth a fortune.</p><p><strong>How is this possible?</strong> What truly has value - if not things we must have?</p><p>This was the question that opened the great debate of the chapter: <strong>what determines value?</strong>',
          },
          {
            type: 'source',
            title: 'סמית: ערך-שימוש וערך-חליפין', titleEn: 'Smith: Use-Value and Exchange-Value',
            quote: '״אין דבר מועיל יותר ממים, אך אין כמעט דבר שיכול להירכש תמורתם. יהלום, לעומת זאת, כמעט חסר ערך-שימוש - אך כמות עצומה של סחורות אחרות ניתן לרכוש תמורתו.״',
            quoteEn: '"Nothing is more useful than water, but it will purchase scarce anything. A diamond, on the contrary, has scarce any value in use; but a very great quantity of other goods may frequently be had in exchange for it."',
            attr: 'אדם סמית, *עושר העמים*, ספר ראשון, פרק 4, 1776',
            attrEn: 'Adam Smith, *The Wealth of Nations*, Book One, Chapter 4, 1776',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'סמית הבחין בין שני סוגי ערך:</p><p><strong>ערך-שימוש:</strong> כמה הדבר מועיל. מים שווים הרבה, יהלום שווה מעט.</p><p><strong>ערך-חליפין:</strong> באיזה מחיר ניתן להחליף אותו. מים שווים מעט, יהלום שווה הרבה.</p><p>הפרדוקס: <strong>שני הערכים סותרים זה את זה.</strong></p><p>סמית הציע תשובה: <strong>ערך-חליפין נקבע על ידי כמות העבודה שנדרשת כדי לייצר את הדבר.</strong> מים - קל להשיג, מעט עבודה, מחיר נמוך. יהלומים - צריך לחפור עמוק, לעבד, להוביל - הרבה עבודה, מחיר גבוה.</p><p><strong>דוגמה מהחיים:</strong> תחשוב על כוס קפה. היא לא חיונית. ובכל זאת - עולה 18 שקלים. למה? כי מאחוריה עומדים חקלאי שגידל את הפולים, סוחר שייבא, מפעל שקלה אותם, ועובד שהכין לך אותה בעמדה. <strong>המחיר משקף את כל העבודה הזו.</strong>',
            contentEn: 'Smith distinguished between two types of value:</p><p><strong>Use-value:</strong> how useful something is. Water is worth a lot, a diamond is worth little.</p><p><strong>Exchange-value:</strong> at what price it can be exchanged. Water is worth little, a diamond is worth a lot.</p><p>The paradox: <strong>the two values contradict each other.</strong></p><p>Smith proposed an answer: <strong>exchange-value is determined by the amount of labor required to produce the item.</strong> Water - easy to obtain, little labor, low price. Diamonds - must be dug deep, processed, transported - much labor, high price.</p><p><strong>A life example:</strong> Think of a cup of coffee. It\'s not essential. And yet - it costs 18 shekels. Why? Because behind it stand a farmer who grew the beans, a trader who imported them, a factory that roasted them, and a worker who prepared it for you at the counter. <strong>The price reflects all this labor.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'תיאוריית ערך-העבודה הייתה הרעיון הדומיננטי בכלכלה במשך 100 שנה. סמית ניסח אותה, מרקס לקח אותה לקיצון - וב-1871 היא קרסה.</p><p><strong>יש בה בעיה גדולה:</strong> לא כל מה שנדרשת לו עבודה - שווה. אם אדם יחפור 100 שנים כדי לייצר אבנים אדומות מיותרות - האם הן יהיו שוות יותר מיהלום שנמצא במקרה ברחוב?</p><p>ברור שלא. <strong>כי הערך לא מגיע רק מהעבודה - הוא מגיע גם ממה שאחרים רוצים.</strong> אבל אם זה כך, אולי העבודה היא בכלל לא המקור של הערך?</p><p>זה הוויכוח שמרקס יקח עוד צעד אחד - ושאחריו תפרוץ "המהפכה השולית" שתשנה הכל.',
            contentEn: 'The labor theory of value was the dominant idea in economics for 100 years. Smith formulated it, Marx took it to an extreme - and in 1871 it collapsed.</p><p><strong>It has a major problem:</strong> not everything that requires labor - is valuable. If a person digs for 100 years to produce useless red stones - are they worth more than a diamond found by chance on the street?</p><p>Obviously not. <strong>Because value doesn\'t come only from labor - it also comes from what others want.</strong> But if so, perhaps labor is not the source of value at all?</p><p>This is the debate Marx will take one step further - and after which "the marginal revolution" will erupt and change everything.',
          },
          {
            type: 'quiz',
            question: 'לפי סמית, למה כוס מים זולה ויהלום יקר?',
            questionEn: 'According to Smith, why is a glass of water cheap and a diamond expensive?',
            options: [
              'כי יהלומים נדירים יותר ממים',
              'כי נדרשת הרבה יותר עבודה כדי לחפור ולעבד יהלום',
              'כי אנשים אוהבים יהלומים יותר ממים'
            ],
            optionsEn: [
              'Because diamonds are rarer than water',
              'Because much more labor is required to dig and process a diamond',
              'Because people love diamonds more than water'
            ],
            correctIndex: 1,
            explanation: 'ערך-חליפין, לפי סמית, נקבע על ידי כמות העבודה שנדרשת. מים זולים כי קל להשיג אותם; יהלומים יקרים כי צריך לחפור, לעבד ולהוביל. נדירות וטעם אישי - סמית לא ראה בהם את הגורם המכריע. החליטיות היא הכמות העבודה.',
            explanationEn: 'Exchange-value, according to Smith, is determined by the amount of labor required. Water is cheap because it\'s easy to obtain; diamonds are expensive because they need to be dug, processed, and transported. Rarity and personal taste - Smith did not see them as the decisive factor. The deciding factor is the amount of labor.',
          },
          {
            type: 'quiz',
            question: 'תחשוב על אדם שמשקיע 100 שעות בעבודה לעצב פסל מחימר זול. בשוק, הפסל נמכר ב-50 שקלים. לפי תיאוריית ערך-העבודה של סמית, מה הבעיה?',
            questionEn: 'Think of a person who invests 100 hours of work designing a sculpture from cheap clay. In the market, the sculpture sells for 50 shekels. According to Smith\'s labor theory of value, what is the problem?',
            options: [
              'הפסל אמור להיות שווה הרבה יותר - לפי כמות העבודה',
              'אין בעיה - שוק חופשי קובע מה ששוק חופשי קובע',
              'הפסל אמור להיות שווה פחות - כי החימר זול'
            ],
            optionsEn: [
              'The sculpture should be worth much more - based on the amount of labor',
              'There is no problem - the free market determines what the free market determines',
              'The sculpture should be worth less - because the clay is cheap'
            ],
            correctIndex: 0,
            explanation: 'זו בדיוק החולשה בתיאוריה של סמית. אם ערך נקבע על ידי עבודה - אז 100 שעות עבודה צריכות לקבוע מחיר גבוה. אבל בשוק, אנשים פשוט לא מוכנים לשלם. זה רומז שיש משהו אחר שקובע ערך - והוא לא רק העבודה. כאן ייכנס לתמונה מרקס, ואחריו "המהפכה השולית".',
            explanationEn: 'This is precisely the weakness in Smith\'s theory. If value is determined by labor - then 100 hours of work should set a high price. But in the market, people simply aren\'t willing to pay. This hints that there is something else that determines value - and it\'s not just labor. This is where Marx will enter the picture, and after him "the marginal revolution."',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "ערך הוא דבר אובייקטיבי - תלוי בכמה משאבים וזמן הושקעו בייצור." איך תגיב לפי מה שלמדנו?',
            questionEn: 'A friend says: "Value is something objective - it depends on how many resources and time were invested in production." How would you respond based on what we learned?',
            options: [
              'החבר צודק לחלוטין - זו עמדת סמית והיא נכונה',
              'זו עמדת סמית, אבל מאז 1871 הכלכלה מבינה שזה לא מספיק',
              'החבר טועה לחלוטין - ערך הוא רק עניין סובייקטיבי'
            ],
            optionsEn: [
              'The friend is completely right - this is Smith\'s position and it is correct',
              'This is Smith\'s position, but since 1871 economics has understood that it\'s not enough',
              'The friend is completely wrong - value is purely subjective'
            ],
            correctIndex: 1,
            explanation: 'החבר מבטא את עמדת סמית - שערך טמון בחפץ עצמו, בעבודה שמושקעת בו. זו הייתה הגישה הדומיננטית במשך 100 שנה - עד "המהפכה השולית" של 1871, שהראתה שערך תלוי לא רק במה שמושקע, אלא גם בכמה אנשים רוצים את הדבר ברגע נתון. נגיע לזה בדיאלוג 3.',
            explanationEn: 'The friend expresses Smith\'s position - that value resides in the object itself, in the labor invested in it. This was the dominant approach for 100 years - until "the marginal revolution" of 1871, which showed that value depends not only on what is invested, but also on how much people want the item at a given moment. We\'ll get to this in Dialogue 3.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 2, title: 'ערך עודף', titleEn: 'Surplus Value', thinker: 'קרל מרקס', thinkerEn: 'Karl Marx', thinkerId: 'marx', xp: 50, sections: [
          {
            type: 'idea',
            title: 'ערך עודף', titleEn: 'Surplus Value',
            content: 'מרקס לקח את תיאוריית ערך-העבודה של סמית - והפנה אותה כנגד הקפיטליזם עצמו.</p><p>ההיגיון שלו פשוט ואכזרי. אם <strong>ערך נוצר רק על ידי עבודה</strong> (כפי שסמית טען), אז המקור היחיד לערך במפעל הוא העובד.</p><p>המכונה? מישהו ייצר אותה - עבודה. החומרים? מישהו כרה והוביל אותם - עבודה. הבניין? מישהו בנה אותו - עבודה.</p><p><strong>הון, לעצמו, לא יוצר שום דבר. הוא רק עבודה מוקפאת מן העבר.</strong></p><p>אז למה הפועל מקבל 100 שקלים על יום עבודה - והמפעל גורף 500? <strong>מאיפה מגיעים ה-400 הנוספים?</strong></p><p>תשובת מרקס הייתה הפצצה הגדולה של הקפיטל: <strong>הם מגיעים מהפועל. מהעבודה שלו, שלא שולמה לו.</strong> זה ה"ערך העודף".',
            contentEn: 'Marx took Smith\'s labor theory of value - and turned it against capitalism itself.</p><p>His logic is simple and ruthless. If <strong>value is created only by labor</strong> (as Smith claimed), then the only source of value in a factory is the worker.</p><p>The machine? Someone produced it - labor. The materials? Someone mined and transported them - labor. The building? Someone built it - labor.</p><p><strong>Capital, on its own, creates nothing. It is just frozen labor from the past.</strong></p><p>So why does the worker receive 100 shekels for a day\'s work - while the factory rakes in 500? <strong>Where do the additional 400 come from?</strong></p><p>Marx\'s answer was the great bombshell of Capital: <strong>they come from the worker. From his labor, which was not paid to him.</strong> This is "surplus value."',
          },
          {
            type: 'source',
            title: 'מרקס: ערך עודף', titleEn: 'Marx: Surplus Value',
            quote: '״הקפיטליסט שילם את הערך של כוח-העבודה. אבל כוח-העבודה, כשנעשה בו שימוש, יוצר ערך גדול יותר ממה ששולם עליו. ההפרש - הערך העודף - שייך לקפיטליסט.״',
            quoteEn: '"The capitalist paid the value of labor-power. But labor-power, when used, creates a value greater than what was paid for it. The difference - surplus value - belongs to the capitalist."',
            attr: 'קרל מרקס, *הקפיטל*, כרך ראשון, 1867',
            attrEn: 'Karl Marx, *Capital*, Volume One, 1867',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'הקפיטליסט שילם <strong>את הערך של כוח-העבודה</strong> - כלומר, כמה עולה לפועל לחיות יום נוסף (אוכל, דיור, וכו\'). נניח: 100 שקלים.</p><p>אבל הפועל, כשהוא עובד, <strong>לא מייצר רק 100 שקלים של ערך.</strong> ב-3 שעות עבודה הוא כבר מכסה את ה-100 שלו. ובשאר היום - 5 שעות נוספות - הוא ממשיך לייצר ערך. <strong>הערך הזה הולך לקפיטליסט.</strong></p><p>זה ה"ערך העודף". <strong>רווח אינו "פרס על השקעה" - הוא עבודה לא משולמת.</strong></p><p><strong>דוגמה מהחיים:</strong> אתה עובד 8 שעות במחסן של אמזון. בשעה הראשונה אתה כבר ייצרת ערך שמכסה את היומון שלך. בשעות 2-8 - אתה ממשיך לייצר. הערך הזה - מאות אלפי דולרים ברבעון - הופך לרווח של בעלי המניות.',
            contentEn: 'The capitalist paid <strong>the value of labor-power</strong> - meaning, how much it costs the worker to live one more day (food, housing, etc.). Let\'s say: 100 shekels.</p><p>But the worker, when working, <strong>doesn\'t produce only 100 shekels of value.</strong> In 3 hours of work he already covers his 100. And for the rest of the day - 5 additional hours - he continues to produce value. <strong>That value goes to the capitalist.</strong></p><p>This is "surplus value." <strong>Profit is not "a reward for investment" - it is unpaid labor.</strong></p><p><strong>A life example:</strong> You work 8 hours in an Amazon warehouse. In the first hour you already produced value that covers your daily wage. In hours 2-8 - you continue to produce. That value - hundreds of thousands of dollars per quarter - becomes profit for the shareholders.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'זו הפצצה האידיאולוגית של הקפיטל. <strong>רווח אינו עניין מוסרי או טכני. הוא תוצאה מתמטית של ניצול.</strong></p><p>הקפיטליסט אינו "אדם רע". הוא פועל לפי הגיון המערכת. אם לא ינצל ערך עודף - מתחרהו יעשה זאת, ויפיל אותו. <strong>המערכת כולה בנויה על שאיבת ערך עודף מעובדים.</strong></p><p>אבל יש חולשה אחת מהותית בכל הטיעון של מרקס. הוא בנוי על הנחה אחת: <strong>שערך מגיע רק מעבודה.</strong> בדיאלוג הבא נראה איך, ב-1871, שלושה כלכלנים פרצו את ההנחה הזו והקימו תיאוריה חדשה - <strong>"המהפכה השולית"</strong> - שתפיל את הבסיס של תיאוריית ערך-העבודה.</p><p>ובכל זאת, גם בלי תיאוריית ערך-העבודה, השאלה ששאל מרקס - <strong>מהיכן בא הרווח?</strong> - נשאלת עד היום.',
            contentEn: 'This is the ideological bombshell of Capital. <strong>Profit is not a moral or technical matter. It is a mathematical result of exploitation.</strong></p><p>The capitalist is not "a bad person." He acts according to the logic of the system. If he doesn\'t extract surplus value - his competitor will, and will drive him out. <strong>The entire system is built on the extraction of surplus value from workers.</strong></p><p>But there is one fundamental weakness in Marx\'s whole argument. It is built on one assumption: <strong>that value comes only from labor.</strong> In the next dialogue we\'ll see how, in 1871, three economists broke that assumption and built a new theory - <strong>"the marginal revolution"</strong> - which would topple the foundation of the labor theory of value.</p><p>And yet, even without the labor theory of value, the question Marx asked - <strong>where does profit come from?</strong> - is still being asked today.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "רווח הוא פרס על השקעה - בלי בעלי-הון שמסכנים את כספם, לא יהיו מפעלים." איך מרקס היה מערער על הטענה הזו?',
            questionEn: 'A friend says: "Profit is a reward for investment - without capital-holders who risk their money, there would be no factories." How would Marx challenge this claim?',
            options: [
              'הוא צודק - בלי השקעה אין כלכלה',
              'ההון עצמו הוא תוצר של עבודה - והרווח הוא הפער בין מה שהעובדים יצרו לבין מה ששולם להם',
              'רווח הוא תוצאה של מחירי השוק, לא של פעילות המפעל'
            ],
            optionsEn: [
              'He is right - without investment there is no economy',
              'Capital itself is a product of labor - and profit is the gap between what workers produced and what was paid to them',
              'Profit is a result of market prices, not of factory activity'
            ],
            correctIndex: 1,
            explanation: 'מרקס היה מצביע על דבר אחד: המכונות, החומרים והבניין הם גם הם תוצר של עבודה - עבודה מוקפאת מן העבר. ההון לעצמו אינו יוצר שום דבר. רק העובד החי יוצר ערך חדש. לכן הרווח אינו פרס על "סיכון" או "השקעה" - הוא הפער בין מה שהעובד יצר לבין מה ששילמו לו.',
            explanationEn: 'Marx would point to one thing: the machines, materials, and building are also a product of labor - frozen labor from the past. Capital on its own creates nothing. Only the living worker creates new value. Therefore profit is not a reward for "risk" or "investment" - it is the gap between what the worker created and what was paid to him.',
          },
          {
            type: 'quiz',
            question: 'חברה גדולה מעבירה את כל הייצור שלה מארה"ב לבנגלדש, שם השכר נמוך פי 20. הרווח שלה זינק. הבעלים מסבירים: "אנחנו פשוט מנהלים עסק יעיל." מה מרקס היה אומר?',
            questionEn: 'A large company moves all its production from the US to Bangladesh, where wages are 20 times lower. Its profit soared. The owners explain: "We are simply running an efficient business." What would Marx say?',
            options: [
              'זו תוצאה טבעית של כלכלה גלובלית',
              'הניצול לא נעלם - הוא רק עבר מקום',
              'זה לא ניצול אם הפועלים הבנגלים הסכימו מרצונם'
            ],
            optionsEn: [
              'This is a natural result of a global economy',
              'Exploitation has not disappeared - it has only changed location',
              'It is not exploitation if the Bangladeshi workers agreed freely'
            ],
            correctIndex: 1,
            explanation: 'המבנה לא השתנה - רק המיקום. ה"ערך העודף" שזורם לבעלים גדל, פשוט כי שלמים עכשיו פחות לעובדים. ו"ההסכמה החופשית" של הפועל הבנגלי? לפי מרקס, היא לא חופש אמיתי - הוא חתם כי האלטרנטיבה היא רעב.',
            explanationEn: 'The structure has not changed - only the location. The "surplus value" flowing to the owners grew, simply because workers are now paid less. And the "free agreement" of the Bangladeshi worker? According to Marx, it is not real freedom - he signed because the alternative is starvation.',
          },
          {
            type: 'quiz',
            question: 'אם תיאוריית ערך-העבודה של סמית ומרקס אינה נכונה (כפי שטענה המהפכה השולית של 1871), האם זה אומר שמרקס לא רלוונטי היום?',
            questionEn: 'If Smith and Marx\'s labor theory of value is not correct (as the 1871 marginal revolution claimed), does that mean Marx is not relevant today?',
            options: [
              'כן - אם הבסיס שלו נפל, גם המסקנות נופלות',
              'לא - השאלה ששאל "מאיפה בא הרווח?" עדיין נשאלת בכלכלה המודרנית',
              'השאלה לא רלוונטית - מרקס היה רק היסטוריון'
            ],
            optionsEn: [
              'Yes - if his foundation fell, the conclusions also fall',
              'No - the question he asked "where does profit come from?" is still being asked in modern economics',
              'The question is not relevant - Marx was only a historian'
            ],
            correctIndex: 1,
            explanation: 'הבסיס המתמטי של מרקס (תיאוריית ערך-העבודה) אכן נפל. אבל השאלה היותר עמוקה - מהיכן בא הרווח? - לא נפלה. היום כלכלנים בודקים את אותה שאלה בכלים אחרים: למה שכר העובדים בארה"ב לא עלה מ-1980 בעוד התפוקה גדלה פי 4? למה רווחי החברות הגדולות זינקו? מרקס פתח שאלה שעדיין מטרידה אותנו - גם אם התשובה שלו לא הייתה הכי מדויקת.',
            explanationEn: 'Marx\'s mathematical foundation (the labor theory of value) did fall. But the deeper question - where does profit come from? - did not fall. Today economists examine the same question with other tools: why have US wages not risen since 1980 while productivity grew fourfold? Why have profits of large companies soared? Marx opened a question that still troubles us - even if his answer was not the most accurate.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 3, title: 'המהפכה השולית', titleEn: 'The Marginal Revolution', thinker: 'ויליאם סטנלי ג\'בונס', thinkerEn: 'William Stanley Jevons', thinkerId: 'jevons', xp: 50, sections: [
          {
            type: 'idea',
            title: 'המהפכה השולית', titleEn: 'The Marginal Revolution',
            content: '1871. שלושה כלכלנים - <strong>ויליאם סטנלי ג\'בונס</strong> באנגליה, <strong>קרל מנגר</strong> באוסטריה, ו<strong>לאון וולראס</strong> בשווייץ - מפרסמים, <strong>בלי לתאם ביניהם</strong>, את אותה תובנה.</p><p>זה לא צירוף מקרים. זה היה הרעיון שהיה באוויר.</p><p>התובנה: <strong>תיאוריית ערך-העבודה של סמית ומרקס שגויה.</strong></p><p>ערך לא מגיע מעבודה. הוא לא תכונה של חפץ. הוא לא משהו אובייקטיבי שאפשר למדוד.</p><p><strong>ערך מגיע מהאדם שמסתכל על החפץ.</strong> מהרצון שלו. מהצורך שלו ברגע מסוים.</p><p>זה נשמע פשוט. אבל זו הייתה רעידת אדמה. <strong>כל הכלכלה הקלאסית קרסה ביום אחד.</strong>',
            contentEn: '1871. Three economists - <strong>William Stanley Jevons</strong> in England, <strong>Carl Menger</strong> in Austria, and <strong>Léon Walras</strong> in Switzerland - publish, <strong>without coordinating with one another</strong>, the same insight.</p><p>This is not a coincidence. It was the idea that was in the air.</p><p>The insight: <strong>the labor theory of value of Smith and Marx is wrong.</strong></p><p>Value does not come from labor. It is not a property of an object. It is not something objective that can be measured.</p><p><strong>Value comes from the person looking at the object.</strong> From their desire. From their need at a particular moment.</p><p>It sounds simple. But it was an earthquake. <strong>All of classical economics collapsed in a single day.</strong>',
          },
          {
            type: 'source',
            title: 'ג\'בונס: ערך סובייקטיבי', titleEn: 'Jevons: Subjective Value',
            quote: '״ערך הוא יחס סובייקטיבי שאדם מקנה לדבר. הוא אינו תכונה של הדבר עצמו - הוא תוצאה של החשיבות שיש לדבר עבור הסיפוק של אדם מסוים.״',
            quoteEn: '"Value is a subjective relation that a person attributes to a thing. It is not a property of the thing itself - it is the result of the importance the thing has for the satisfaction of a particular person."',
            attr: 'ויליאם סטנלי ג\'בונס, *תיאוריה של הכלכלה הפוליטית*, 1871',
            attrEn: 'William Stanley Jevons, *Theory of Political Economy*, 1871',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'ג\'בונס פתר את פרדוקס המים והיהלום של סמית בצורה גאונית. הוא הציע את המושג <strong>"תועלת שולית"</strong>.</p><p>תועלת שולית היא התועלת של היחידה <strong>הבאה</strong> - לא של היחידה הראשונה.</p><p>תחשוב על מים. במדבר, אחרי 24 שעות ללא שתייה - <strong>כוס המים הראשונה שלך שווה הון.</strong> כוס המים השנייה - עדיין שווה הרבה. הכוס העשירית - לא משנה הרבה. הכוס המאה - היית מעדיף שמישהו יקח אותה.</p><p><strong>אותה כוס מים. אותו ערך-שימוש לכאורה. ערך-חליפין שונה לחלוטין.</strong></p><p>הסיבה: <strong>ערך תלוי בכמות שיש לך כבר.</strong> מים - יש בשפע, כך שהכוס הבאה כמעט לא שווה. יהלומים - יש מעט, כך שיהלום נוסף שווה הרבה.</p><p><strong>דוגמה מהחיים:</strong> ארוחת הבוקר הראשונה ביום - חשובה. ארוחת הצהריים - נחמדה. ארוחת הערב הרביעית באותו יום - תהיה גועלית. <strong>אותו אוכל. ערך מתחלף לפי הכמות שכבר אכלת.</strong>',
            contentEn: 'Jevons solved Smith\'s paradox of water and diamonds brilliantly. He proposed the concept of <strong>"marginal utility"</strong>.</p><p>Marginal utility is the utility of the <strong>next</strong> unit - not of the first unit.</p><p>Think about water. In the desert, after 24 hours without drinking - <strong>your first glass of water is worth a fortune.</strong> The second glass - still worth a lot. The tenth glass - doesn\'t matter much. The hundredth glass - you\'d prefer someone took it away.</p><p><strong>The same glass of water. The same use-value, supposedly. Completely different exchange-value.</strong></p><p>The reason: <strong>value depends on how much you already have.</strong> Water - exists in abundance, so the next glass is hardly worth anything. Diamonds - there are few, so an additional diamond is worth a lot.</p><p><strong>A life example:</strong> Your first meal of the day - important. Lunch - nice. The fourth dinner on the same day - would be disgusting. <strong>The same food. Value shifts based on how much you\'ve already eaten.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'המהפכה השולית שינתה את הכלכלה לנצח.</p><p><strong>מסמית ומרקס:</strong> ערך הוא תכונה של חפץ. הוא נמצא בו, ונקבע על ידי העבודה שהושקעה בו.</p><p><strong>מג\'בונס ולחבריו:</strong> ערך הוא יחס בין אדם לחפץ. הוא נמצא <strong>בעיני המתבונן</strong>, ונקבע על ידי הרצון שלו ברגע נתון.</p><p>ההשלכות עצומות. אם ערך הוא סובייקטיבי - <strong>אין דבר כזה "מחיר צודק".</strong> מחיר שצרכן מוכן לשלם - זה המחיר הנכון, לרגע הזה.</p><p>זה הבסיס של הכלכלה המודרנית. <strong>כל ספר לימוד היום מתחיל מתועלת שולית.</strong> אבל גם פתח שאלות חדשות - שאלות שילוו אותנו בדיאלוגים הבאים.',
            contentEn: 'The marginal revolution changed economics forever.</p><p><strong>From Smith and Marx:</strong> value is a property of an object. It resides in it, and is determined by the labor invested in it.</p><p><strong>From Jevons and his colleagues:</strong> value is a relation between a person and an object. It resides <strong>in the eye of the beholder</strong>, and is determined by their desire at a given moment.</p><p>The implications are enormous. If value is subjective - <strong>there is no such thing as a "just price."</strong> The price a consumer is willing to pay - is the right price, for this moment.</p><p>This is the foundation of modern economics. <strong>Every textbook today begins with marginal utility.</strong> But it also opened new questions - questions that will accompany us in the coming dialogues.',
          },
          {
            type: 'quiz',
            question: 'חברה מציגה חולצה בחנות במחיר 100 שקלים. אותה חולצה בדיוק - אריג, גזרה, ייצור - נמכרת בחנות אחרת ב-500 שקלים, רק בגלל מותג יוקרה. לפי הגישה השולית, מי קובע מהו הערך האמיתי של החולצה?',
            questionEn: 'A company displays a shirt in a store at 100 shekels. The exact same shirt - fabric, cut, production - is sold in another store for 500 shekels, just because of a luxury brand. According to the marginal approach, who determines the true value of the shirt?',
            options: [
              'הצרכן - אם מישהו מוכן לשלם 500, זה הערך האמיתי לרגע הזה',
              'החולצה עצמה - לפי כמה עבודה הושקעה בייצורה',
              'הממשלה - שצריכה לפקח שמחירים לא יהיו מנופחים'
            ],
            optionsEn: [
              'The consumer - if someone is willing to pay 500, that is the true value for this moment',
              'The shirt itself - based on how much labor was invested in its production',
              'The government - which should regulate so that prices are not inflated'
            ],
            correctIndex: 0,
            explanation: 'זה ליבת המהפכה השולית. ערך אינו תכונה של החולצה - הוא יחס בין הצרכן לחפץ. אם הצרכן מוכן לשלם 500 בגלל המותג - אז 500 הוא הערך, לרגע הזה. הגישה הזו רדיקלית: אין "מחיר אובייקטיבי" של החולצה. יש רק מה שמישהו מוכן לשלם תמורתה.',
            explanationEn: 'This is the heart of the marginal revolution. Value is not a property of the shirt - it is a relation between the consumer and the object. If the consumer is willing to pay 500 because of the brand - then 500 is the value, for this moment. This approach is radical: there is no "objective price" of the shirt. There is only what someone is willing to pay for it.',
          },
          {
            type: 'quiz',
            question: 'אדם רעב נכנס למסעדה ומזמין המבורגר. את הראשון הוא טורף בהנאה גדולה. המבורגר שני - עדיין מספק. את השלישי הוא בקושי גומר. את הרביעי - הוא משאיר חצי. איזה מושג מסביר מה קרה כאן?',
            questionEn: 'A hungry person enters a restaurant and orders a hamburger. He devours the first one with great pleasure. The second hamburger - still satisfying. He barely finishes the third. He leaves half of the fourth. What concept explains what happened here?',
            options: [
              'שינוי מצב רוח - אנשים פשוט מתעייפים מאוכל',
              'תועלת שולית פוחתת - כל המבורגר נוסף שווה לו פחות',
              'בעיית האיכות - אולי ההמבורגרים האחרונים פחות טעימים'
            ],
            optionsEn: [
              'Change of mood - people just get tired of food',
              'Diminishing marginal utility - each additional hamburger is worth less to him',
              'Quality issue - perhaps the later hamburgers were less tasty'
            ],
            correctIndex: 1,
            explanation: 'זה התרחיש הקלאסי של תועלת שולית פוחתת. ההמבורגר עצמו לא השתנה - היכולת שלך ליהנות ממנו כן. התועלת של היחידה הבאה תלויה בכמה כבר יש לך. אותו עיקרון מסביר למה כוס המים העשירית שווה פחות מהראשונה, ולמה השעה השלישית של עבודה נוספת ביום מעייפת יותר מהשעה הראשונה.',
            explanationEn: 'This is the classic scenario of diminishing marginal utility. The hamburger itself did not change - your ability to enjoy it did. The utility of the next unit depends on how much you already have. The same principle explains why the tenth glass of water is worth less than the first, and why the third hour of additional work in a day is more tiring than the first hour.',
          },
          {
            type: 'quiz',
            question: 'אם ערך הוא סובייקטיבי - מה שאני מוכן לשלם - האם מרקס היה מסכים שאין יותר ניצול בקפיטליזם? איך אפשר לשלב את שתי הגישות?',
            questionEn: 'If value is subjective - what I\'m willing to pay - would Marx agree that there is no more exploitation in capitalism? How can the two approaches be combined?',
            options: [
              'המהפכה השולית הוכיחה שמרקס טעה לחלוטין - אין ניצול',
              'שתי השאלות שונות - איך נקבע מחיר היא שאלה אחת, איך מתחלק הרווח היא שאלה אחרת',
              'צריך לוותר על תועלת שולית ולחזור לתיאוריית ערך-העבודה'
            ],
            optionsEn: [
              'The marginal revolution proved Marx was completely wrong - there is no exploitation',
              'The two questions are different - how a price is determined is one question, how profit is distributed is another',
              'We need to abandon marginal utility and return to the labor theory of value'
            ],
            correctIndex: 1,
            explanation: 'זו תובנה מתוחכמת. המהפכה השולית פתרה איך נקבע מחיר - לא איך מתחלק הרווח. גם אם מחיר חולצה הוא 500 שקלים כי הצרכן מוכן לשלם - עדיין נשארת השאלה: כמה מתוך ה-500 הולך לעובד שתפר, וכמה לבעלי המניות? שתי השאלות נפרדות, ושתיהן עדיין רלוונטיות בכלכלה המודרנית.',
            explanationEn: 'This is a sophisticated insight. The marginal revolution solved how a price is determined - not how profit is distributed. Even if the price of a shirt is 500 shekels because the consumer is willing to pay - there still remains the question: how much of the 500 goes to the worker who sewed it, and how much to the shareholders? The two questions are separate, and both are still relevant in modern economics.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 4, title: 'היצע, ביקוש, והמחיר', titleEn: 'Supply, Demand, and Price', thinker: 'אלפרד מרשל', thinkerEn: 'Alfred Marshall', thinkerId: 'marshall', xp: 50, sections: [
          {
            type: 'idea',
            title: 'היצע, ביקוש, והמחיר', titleEn: 'Supply, Demand, and Price',
            content: 'בסוף המאה ה-19, הכלכלה הייתה במלחמה.</p><p>מצד אחד עמדו סמית ומרקס: <strong>ערך מגיע מעבודה.</strong> מצד שני עמדו ג\'בונס, מנגר ווולראס: <strong>ערך מגיע מתועלת שולית - מהרצון של הצרכן.</strong></p><p>מי צודק? מי קובע את המחיר - היצרן או הצרכן?</p><p>ב-1890, כלכלן בריטי בשם <strong>אלפרד מרשל</strong> פרסם את אחד הספרים החשובים בהיסטוריה של הכלכלה: <em>"עקרונות הכלכלה"</em>. וסיים את הוויכוח באלגנטיות.</p><p><strong>שני הצדדים צודקים. ושני הצדדים תופסים רק חצי מהתמונה.</strong></p><p><strong>המחיר אינו נקבע על ידי היצרן, ולא על ידי הצרכן. הוא נקבע במפגש ביניהם.</strong></p><p>מרשל שרטט שני קווים על דף - אחד עולה (היצע), אחד יורד (ביקוש). הם נפגשים בנקודה אחת. <strong>בנקודה הזו נמצא המחיר.</strong></p><p>זו הייתה דיאגרמה. אבל היא שינתה את הכלכלה לעולמים.',
            contentEn: 'At the end of the 19th century, economics was at war.</p><p>On one side stood Smith and Marx: <strong>value comes from labor.</strong> On the other side stood Jevons, Menger, and Walras: <strong>value comes from marginal utility - from the consumer\'s desire.</strong></p><p>Who is right? Who determines the price - the producer or the consumer?</p><p>In 1890, a British economist named <strong>Alfred Marshall</strong> published one of the most important books in the history of economics: <em>"Principles of Economics."</em> And ended the debate with elegance.</p><p><strong>Both sides are right. And both sides capture only half of the picture.</strong></p><p><strong>The price is not determined by the producer, nor by the consumer. It is determined in the meeting between them.</strong></p><p>Marshall drew two lines on a page - one rising (supply), one falling (demand). They meet at one point. <strong>At that point lies the price.</strong></p><p>It was a diagram. But it changed economics forever.',
          },
          {
            type: 'source',
            title: 'מרשל: שני הכוחות', titleEn: 'Marshall: The Two Forces',
            quote: '״אנחנו יכולים להתווכח אם זה הסכין העליון או התחתון של המספריים שחותך פיסת נייר. אבל ברור שיש צורך בשני הסכינים. כך גם המחיר נקבע על ידי שני כוחות - היצע וביקוש - ולא על ידי אחד מהם.״',
            quoteEn: '"We might as well dispute whether it is the upper or the under blade of a pair of scissors that cuts a piece of paper. But it is clear that both blades are needed. So too the price is determined by two forces - supply and demand - and not by one of them."',
            attr: 'אלפרד מרשל, *עקרונות הכלכלה*, 1890',
            attrEn: 'Alfred Marshall, *Principles of Economics*, 1890',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'תחשוב על שוק הירקות.</p><p><strong>ביקוש:</strong> כמה אתה מוכן לשלם על מלפפון? אם הוא עולה 1 שקל - תקנה 5. אם 10 שקלים - תקנה אחד. אם 50 שקלים - לא תקנה בכלל. <strong>ככל שהמחיר עולה - אתה רוצה פחות.</strong> זה קו יורד.</p><p><strong>היצע:</strong> כמה החקלאי מוכן לייצר? אם הוא מקבל 1 שקל - לא משתלם לו, לא ייצר. אם 10 שקלים - ייצר כמות סבירה. אם 50 שקלים - ייצר כמה שיוכל. <strong>ככל שהמחיר עולה - הוא רוצה לייצר יותר.</strong> זה קו עולה.</p><p><strong>איפה תיסגר העסקה?</strong> במחיר שבו שני הקווים נפגשים. נגיד: 7 שקלים. <strong>במחיר הזה, הכמות שאתה רוצה לקנות שווה לכמות שהחקלאי רוצה למכור.</strong> שיווי משקל.',
            contentEn: 'Think of the vegetable market.</p><p><strong>Demand:</strong> How much are you willing to pay for a cucumber? If it costs 1 shekel - you\'ll buy 5. If 10 shekels - you\'ll buy one. If 50 shekels - you won\'t buy at all. <strong>The higher the price - the less you want.</strong> This is a falling line.</p><p><strong>Supply:</strong> How much is the farmer willing to produce? If he gets 1 shekel - it\'s not worth it, he won\'t produce. If 10 shekels - he\'ll produce a reasonable amount. If 50 shekels - he\'ll produce as much as he can. <strong>The higher the price - the more he wants to produce.</strong> This is a rising line.</p><p><strong>Where will the deal close?</strong> At the price where the two lines meet. Let\'s say: 7 shekels. <strong>At this price, the quantity you want to buy equals the quantity the farmer wants to sell.</strong> Equilibrium.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הגאונות של מרשל היא בפשטות. הוא לא המציא היצע. הוא לא המציא ביקוש. הוא רק <strong>חיבר אותם בדיאגרמה אחת</strong>.</p><p>אבל הדיאגרמה הזו פתרה את הוויכוח של 150 שנה.</p><p><strong>סמית ומרקס דיברו על צד ההיצע</strong> - על העבודה שמושקעת בייצור. הם צדקו: בלי עבודה, אין סחורה.</p><p><strong>ג\'בונס וחבריו דיברו על צד הביקוש</strong> - על התועלת שהצרכן מקבל. הם צדקו: בלי רצון לקנות, אין מחיר.</p><p><strong>מרשל הראה ששניהם צודקים - ושהמחיר הוא היחס ביניהם.</strong> לא תכונה של החפץ. לא רצון של הצרכן. <strong>מפגש.</strong></p><p>זה הבסיס של כל ספר כלכלה היום. <strong>בכל מקום שאתה רואה מחיר - אתה רואה נקודת מפגש בין היצע לביקוש.</strong>',
            contentEn: 'Marshall\'s genius is in simplicity. He didn\'t invent supply. He didn\'t invent demand. He just <strong>connected them in one diagram</strong>.</p><p>But that diagram solved a 150-year debate.</p><p><strong>Smith and Marx spoke about the supply side</strong> - about the labor invested in production. They were right: without labor, there is no commodity.</p><p><strong>Jevons and his colleagues spoke about the demand side</strong> - about the utility the consumer receives. They were right: without the desire to buy, there is no price.</p><p><strong>Marshall showed that both are right - and that the price is the relation between them.</strong> Not a property of the object. Not the desire of the consumer. <strong>A meeting.</strong></p><p>This is the foundation of every economics textbook today. <strong>Everywhere you see a price - you see a meeting point between supply and demand.</strong>',
          },
          {
            type: 'quiz',
            question: 'ידיעה בעיתון: "בעקבות שריפות יער ענק, מחיר העגבניות הוכפל." איך מרשל היה מסביר את העלייה הזו?',
            questionEn: 'A newspaper headline: "Following massive forest fires, the price of tomatoes has doubled." How would Marshall explain this rise?',
            options: [
              'הביקוש לעגבניות עלה - אנשים פתאום רוצים יותר עגבניות',
              'ההיצע ירד - פחות עגבניות בשוק, אבל הביקוש זהה, אז נקודת המפגש זזה למחיר גבוה יותר',
              'החקלאים הסכימו ביניהם להעלות מחירים'
            ],
            optionsEn: [
              'Demand for tomatoes rose - people suddenly want more tomatoes',
              'Supply fell - fewer tomatoes in the market, but demand is the same, so the meeting point moves to a higher price',
              'The farmers agreed among themselves to raise prices'
            ],
            correctIndex: 1,
            explanation: 'זו דוגמה קלאסית של שינוי במחיר. השריפות פגעו בייצור - קו ההיצע נסוג שמאלה (פחות עגבניות יוצעו בכל מחיר). הביקוש לא השתנה - אנשים עדיין רוצים עגבניות. כשקו ההיצע זז ונקודת המפגש משתנה - המחיר חייב לעלות. זה אותו עיקרון שמסביר למה דלק התייקר במלחמת אוקראינה, ולמה דירות יקרות באזורי ביקוש.',
            explanationEn: 'This is a classic example of a price change. The fires damaged production - the supply curve retreated to the left (fewer tomatoes offered at every price). Demand did not change - people still want tomatoes. When the supply curve moves and the meeting point shifts - the price must rise. This is the same principle that explains why fuel became more expensive in the Ukraine war, and why apartments are expensive in high-demand areas.',
          },
          {
            type: 'quiz',
            question: 'חברה חדשה משיקה אפליקציה בחינם. עשרות אלפי משתמשים נרשמים. אחרי שנה, החברה גובה 50 שקלים לחודש. הרבה משתמשים נשארים בלי בעיה. מה זה אומר על הביקוש לאפליקציה?',
            questionEn: 'A new company launches a free app. Tens of thousands of users sign up. After a year, the company charges 50 shekels a month. Many users stay without issue. What does this say about the demand for the app?',
            options: [
              'הביקוש שלהם לא רגיש למחיר - הם רוצים אותה מאוד',
              'הביקוש שלהם רגיש מאוד למחיר - לכן הם נשארו',
              'אין קשר בין מחיר לביקוש לפי מרשל'
            ],
            optionsEn: [
              'Their demand is not sensitive to price - they really want it',
              'Their demand is very sensitive to price - that\'s why they stayed',
              'There is no connection between price and demand according to Marshall'
            ],
            correctIndex: 0,
            explanation: 'כשמשתמשים נשארים גם אחרי שמחיר עולה - סימן שהביקוש שלהם "נוקשה". הם זקוקים לאפליקציה, או שאין להם תחליף. קו הביקוש שלהם הוא תלול - שינוי במחיר לא משפיע הרבה על כמות שהם רוצים. זה ההפך מ"ביקוש גמיש" - כשאנשים זזים מהר בין מוצרים בעקבות שינויי מחיר.',
            explanationEn: 'When users stay even after the price rises - it\'s a sign that their demand is "rigid". They need the app, or have no alternative. Their demand curve is steep - a change in price doesn\'t affect much the quantity they want. This is the opposite of "elastic demand" - when people move quickly between products following price changes.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "אם הצרכנים היו מסרבים לקנות בייגלים ב-15 שקלים, המאפיות היו נאלצות להוריד מחיר." האם מרשל היה מסכים?',
            questionEn: 'A friend says: "If consumers refused to buy bagels at 15 shekels, the bakeries would be forced to lower the price." Would Marshall agree?',
            options: [
              'לא - מחיר נקבע רק על ידי היצרן',
              'כן - אם כל הצרכנים יסרבו, הביקוש קורס וכוח השוק חוזר אליהם',
              'כן - אבל רק אם הממשלה תתערב'
            ],
            optionsEn: [
              'No - price is determined only by the producer',
              'Yes - if all consumers refuse, demand collapses and market power returns to them',
              'Yes - but only if the government intervenes'
            ],
            correctIndex: 1,
            explanation: 'זה לב התיאוריה של מרשל. כוח הצרכן הוא לא ויכוח על מחיר אחד - הוא קולקטיבי. אם מספיק צרכנים מסרבים - קו הביקוש נסוג. נקודת המפגש זזה לכיוון מחיר נמוך יותר. זו הסיבה שחרמות צרכנים יכולים לעבוד, ולמה תחרות בין מאפיות מורידה מחירים.',
            explanationEn: 'This is the heart of Marshall\'s theory. Consumer power is not a debate over a single price - it is collective. If enough consumers refuse - the demand curve retreats. The meeting point moves toward a lower price. This is why consumer boycotts can work, and why competition between bakeries lowers prices.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 5, title: 'האם הכל ניתן למחיר?', titleEn: 'Can Everything Be Priced?', thinker: 'מייקל סנדל', thinkerEn: 'Michael Sandel', thinkerId: 'sandel', xp: 50, sections: [
          {
            type: 'idea',
            title: 'האם הכל ניתן למחיר?', titleEn: 'Can Everything Be Priced?',
            content: 'עד עכשיו, כל הוגי הפרק שלנו דיברו על דבר אחד: <strong>איך נקבע מחיר.</strong> סמית טען שזה העבודה. מרקס - הניצול. ג\'בונס - התועלת השולית. מרשל - נקודת המפגש.</p><p>כולם, בדרך כלשהי, האמינו שכלכלה היא ניטרלית - שיש לה כללים פנימיים שעובדים במנותק מערכים.</p><p>ב-2012, פילוסוף אמריקאי בשם <strong>מייקל סנדל</strong>, מאוניברסיטת הרווארד, פרסם ספר שערער על כל זה. <em>"מה שכסף לא יכול לקנות"</em>.</p><p>הטענה שלו פשוטה וקשה: <strong>לא כל דבר צריך להיות בשוק.</strong> ויש דברים שכשמכניסים אותם לשוק - <strong>הופכים אותם למשהו אחר.</strong></p><p>כליה. ידידות. הצבעה. שירה. אנחנו יכולים לתת להם מחיר. השאלה היא - <strong>האם צריך?</strong>',
            contentEn: 'Until now, all the thinkers in our chapter spoke about one thing: <strong>how a price is determined.</strong> Smith argued it\'s labor. Marx - exploitation. Jevons - marginal utility. Marshall - the meeting point.</p><p>All of them, in some way, believed that economics is neutral - that it has internal rules that work independently of values.</p><p>In 2012, an American philosopher named <strong>Michael Sandel</strong>, from Harvard University, published a book that challenged all of this. <em>"What Money Can\'t Buy."</em></p><p>His claim is simple and hard: <strong>not everything should be in the market.</strong> And there are things that, when brought into the market - <strong>become something else.</strong></p><p>A kidney. Friendship. A vote. Poetry. We can give them a price. The question is - <strong>should we?</strong>',
          },
          {
            type: 'source',
            title: 'סנדל: חברת שוק', titleEn: 'Sandel: Market Society',
            quote: '״אנחנו עברנו מלהיות *כלכלת שוק* - שבה השוק הוא כלי שירות שימושי - להיות *חברת שוק* - שבה הכל למכירה. ההבדל אינו כלכלי. הוא מוסרי.״',
            quoteEn: '"We have drifted from being a *market economy* - where the market is a useful tool - to being a *market society* - where everything is for sale. The difference is not economic. It is moral."',
            attr: 'מייקל סנדל, *מה שכסף לא יכול לקנות*, 2012',
            attrEn: 'Michael Sandel, *What Money Can\'t Buy*, 2012',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'סנדל מזהה שתי בעיות מרכזיות עם הכנסת כל דבר לשוק.</p><p><strong>הראשונה: השוק לא ניטרלי.</strong> הוא משפיע על מה שהוא נוגע בו. תחשוב על תרומת דם. כשאנשים תורמים בלי תמורה - זה מעשה של נדיבות. אם תתחיל לשלם 100 שקלים על תרומה - <strong>התרומה תהפוך לעבודה.</strong> המשמעות שלה תשתנה. אנשים נדיבים אולי יפסיקו לתרום, כי "זה כבר לא אותו דבר".</p><p><strong>השנייה: שוק מחריף אי-שוויון.</strong> אם הכל הופך לסחורה - אם אפשר לקנות גישה לחינוך טוב יותר, בריאות טובה יותר, או פטור משירות צבאי - <strong>כסף הופך לא רק לאמצעי, אלא לכוח שמעצב את חייך כליל.</strong> מי שיש לו כסף יכול לקנות יותר. מי שאין לו - נדחק החוצה.</p><p><strong>דוגמה מהחיים:</strong> מקום נכים בחניון. חוקי, רק לבעלי תעודה. אבל בעיר אחת בארה"ב הציעו: שלם 50 דולר וחנה במקום הזה גם בלי תעודה. <strong>חוקי. רווחי. ובכל זאת - משהו פה לא בסדר.</strong> סנדל היה אומר: כסף לא היה צריך להיכנס לכאן.',
            contentEn: 'Sandel identifies two main problems with bringing every thing into the market.</p><p><strong>First: the market is not neutral.</strong> It influences what it touches. Think of blood donation. When people donate without compensation - it is an act of generosity. If you start paying 100 shekels for a donation - <strong>the donation will turn into work.</strong> Its meaning will change. Generous people may stop donating, because "it\'s no longer the same thing."</p><p><strong>Second: the market amplifies inequality.</strong> If everything becomes a commodity - if you can buy access to better education, better healthcare, or exemption from military service - <strong>money becomes not just a means, but a force that shapes your entire life.</strong> Those who have money can buy more. Those who don\'t - get pushed out.</p><p><strong>A life example:</strong> A disabled parking spot. Legal, only for permit holders. But in one city in the US they proposed: pay $50 and park in that spot even without a permit. <strong>Legal. Profitable. And yet - something is wrong here.</strong> Sandel would say: money should not have entered here.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'סנדל לא נגד שוק. הוא כלכלן ליברלי. הוא מאמין ששוק חופשי הוא כלי טוב למזון, לבגדים, לרוב הסחורות.</p><p><strong>הביקורת שלו מצומצמת ועמוקה:</strong> יש תחומים בחיים שבהם <strong>מחיר הופך אותם למשהו אחר.</strong> קשר אנושי. אזרחות. כבוד הדדי.</p><p>זה מחזיר אותנו לכל הוויכוח של פרק 2. <strong>המחיר אינו רק "מספר".</strong> הוא משפיע על המהות של מה שהוא מתמחר. אם תיתן לכליה מחיר - היא הופכת מ"מתנת חיים" ל"מצרך". אם תיתן להצבעה מחיר - היא הופכת מ"זכות פוליטית" ל"שירות".</p><p><strong>השאלה אינה אם השוק יכול לתמחר את הכל. השאלה היא - האם הוא צריך?</strong>',
            contentEn: 'Sandel is not against the market. He is a liberal economist. He believes the free market is a good tool for food, clothing, most goods.</p><p><strong>His critique is narrow and deep:</strong> there are areas of life where <strong>a price turns them into something else.</strong> Human connection. Citizenship. Mutual respect.</p><p>This brings us back to the entire debate of Chapter 2. <strong>A price is not just a "number."</strong> It affects the essence of what it prices. If you give a kidney a price - it changes from "a gift of life" to "a commodity." If you give a vote a price - it changes from "a political right" to "a service."</p><p><strong>The question is not whether the market can price everything. The question is - should it?</strong>',
          },
          {
            type: 'quiz',
            question: 'בית חולים מציע: "תרום כליה - תקבל 50,000 שקלים." מספר התורמים יורד באופן ניכר. למה, לפי סנדל?',
            questionEn: 'A hospital offers: "Donate a kidney - receive 50,000 shekels." The number of donors drops significantly. Why, according to Sandel?',
            options: [
              'הסכום נמוך מדי - צריך להציע יותר כסף',
              'הכנסת כסף שינתה את משמעות התרומה מ"מעשה של נדיבות" ל"עסקה כלכלית"',
              'אנשים תורמים רק בלחץ חברתי - בלי לחץ אין תרומה'
            ],
            optionsEn: [
              'The amount is too low - they should offer more money',
              'Bringing in money changed the meaning of the donation from "an act of generosity" to "an economic transaction"',
              'People donate only under social pressure - without pressure, no donation'
            ],
            correctIndex: 1,
            explanation: 'זו הליבה של סנדל. השוק לא ניטרלי - הוא משנה את משמעות הדבר שהוא נוגע בו. תרומה ללא תמורה מבטאת ערכים של נדיבות וסולידריות. כשהיא הופכת לעסקה ב-50,000 שקלים, היא מאבדת את האופי המוסרי שלה. תורמים שהיו עושים את זה מתוך ערכים - מפסיקים, כי "זה כבר לא אותו דבר".',
            explanationEn: 'This is the heart of Sandel. The market is not neutral - it changes the meaning of the thing it touches. A donation without compensation expresses values of generosity and solidarity. When it becomes a 50,000-shekel transaction, it loses its moral character. Donors who would do it out of values - stop, because "it\'s no longer the same thing."',
          },
          {
            type: 'quiz',
            question: 'בעיר מסוימת מאפשרים לשלם 1,000 דולר בשנה ולקבל גישה לנתיב מהיר בכביש שלא נחסם. הכלכלן הליברלי אומר: "זה רק יעיל. מי שמעריך את הזמן יותר, ישלם." מה תהיה התגובה של סנדל?',
            questionEn: 'In a certain city, residents can pay $1,000 a year to access a fast lane on a road that is otherwise blocked. The liberal economist says: "This is just efficient. Those who value time more will pay." What would Sandel\'s response be?',
            options: [
              'הוא יסכים - זו דוגמה לשוק חופשי שעובד טוב',
              'הוא יחלוק לא על היעילות, אלא על המוסר - נתיב מהיר לעשירים בלבד מעצים אי-שוויון',
              'הוא יציע פתרון אמצע - שכל אחד יוכל לנסוע ב-30 קמ"ש בכל נתיב'
            ],
            optionsEn: [
              'He\'ll agree - this is an example of a free market working well',
              'He won\'t dispute the efficiency, but the morality - a fast lane for the wealthy only deepens inequality',
              'He\'ll propose a compromise - that everyone be allowed to drive 30 kph in any lane'
            ],
            correctIndex: 1,
            explanation: 'סנדל אינו נגד יעילות. הוא נגד מצב שבו כסף הופך לכוח שמעצב את החיים - כולל גישה לדרכים ציבוריות. כשמי שיש לו כסף מקבל גישה לנתיבים מהירים, ומי שאין לו תקוע - השוק לא רק מתחלק לפי כסף, הוא יוצר חוויית חיים שונה לחלוטין לעשירים ולעניים. וזה לא רק עניין יעילות, אלא עניין של ערכים אזרחיים.',
            explanationEn: 'Sandel is not against efficiency. He is against a situation where money becomes a force that shapes life - including access to public roads. When those with money get access to fast lanes, and those without are stuck - the market doesn\'t just divide by money, it creates a completely different life experience for the rich and the poor. And this is not just an efficiency matter, but a matter of civic values.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "אם אנשים מסכימים מרצונם לבצע עסקה - אז זה בסדר. אין כאן בעיה." איך סנדל היה מערער על הטיעון הזה?',
            questionEn: 'A friend says: "If people agree freely to a transaction - then it\'s fine. There\'s no problem here." How would Sandel challenge this argument?',
            options: [
              'הסכמה חופשית אינה תמיד הסכמה אמיתית - כפי שמרקס הראה בעבר',
              'יש דברים שעצם הכנסתם לשוק משחיתה את ערכם - גם אם שני הצדדים מסכימים',
              'שני הטיעונים נכונים - גם הסכמה לא חופשית באמת, וגם השוק משחית'
            ],
            optionsEn: [
              'Free agreement is not always true agreement - as Marx showed earlier',
              'There are things whose mere introduction into the market corrupts their value - even if both sides agree',
              'Both arguments are right - both that agreement isn\'t really free, and that the market corrupts'
            ],
            correctIndex: 2,
            explanation: 'סנדל בעצם משלב שני טיעונים. ראשית - בהמשך למרקס, "ההסכמה" של מי שאין לו ברירה אינה באמת חופשית. שנית - גם אם ההסכמה חופשית, יש דברים שעצם הכנסתם לשוק משנה את אופיים. שתי הביקורות עומדות יחד. אהבה הניתנת תמורת כסף - אולי הסכמה, אבל זה כבר לא אהבה. הצבעה הניתנת תמורת כסף - אולי הסכמה, אבל זה כבר לא דמוקרטיה.',
            explanationEn: 'Sandel essentially combines two arguments. First - following Marx, "the agreement" of one who has no choice is not really free. Second - even if the agreement is free, there are things whose mere entry into the market changes their character. Both critiques stand together. Love given for money - maybe agreement, but it\'s no longer love. A vote given for money - maybe agreement, but it\'s no longer democracy.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 6, title: 'כשהמוח מטעה אותנו', titleEn: 'When the Mind Deceives Us', thinker: 'דניאל קהנמן', thinkerEn: 'Daniel Kahneman', thinkerId: 'kahneman', xp: 50, sections: [
          {
            type: 'idea',
            title: 'כשהמוח מטעה אותנו', titleEn: 'When the Mind Deceives Us',
            content: 'עד עכשיו, כל הוגי הפרק הניחו דבר אחד: <strong>שבני אדם רציונליים.</strong> שכשאתה עומד לקנות משהו, אתה שוקל בצורה הגיונית כמה הוא שווה לך, ומשלם לפי זה. השוק עובד - כי אנחנו עובדים בצורה צפויה.</p><p>ב-1979, שני פסיכולוגים ישראלים - <strong>דניאל קהנמן ועמוס טברסקי</strong> - פרסמו מאמר אקדמי שערער על ההנחה הזו. השם שלו: <em>"תיאוריית הסיכוי"</em>. וזה הפך אותם למהפכנים של הכלכלה ההתנהגותית.</p><p>הטענה שלהם: <strong>בני אדם לא רציונליים בצורה שיטתית.</strong> המוח שלנו לא מחשב ערך כמו מחשב. הוא משתמש בקיצורים. הוא נופל באותם פחים. ובאופן צפוי.</p><p><strong>אם הערך הוא סובייקטיבי</strong> (כפי שטענה המהפכה השולית), <strong>והמוח האנושי שיוצר את הסובייקטיביות הזו עובד בצורה שיטתית לא רציונלית</strong> - אז הרבה ממה שחשבנו על הכלכלה צריך להשתנות.',
            contentEn: 'Until now, all the thinkers in the chapter assumed one thing: <strong>that human beings are rational.</strong> That when you\'re about to buy something, you logically weigh how much it\'s worth to you, and pay accordingly. The market works - because we work predictably.</p><p>In 1979, two Israeli psychologists - <strong>Daniel Kahneman and Amos Tversky</strong> - published an academic paper that challenged this assumption. Its name: <em>"Prospect Theory."</em> And it made them the revolutionaries of behavioral economics.</p><p>Their claim: <strong>human beings are systematically irrational.</strong> Our brain doesn\'t calculate value like a computer. It uses shortcuts. It falls into the same traps. And predictably.</p><p><strong>If value is subjective</strong> (as the marginal revolution claimed), <strong>and the human brain that creates this subjectivity works in a systematically irrational way</strong> - then much of what we thought about economics needs to change.',
          },
          {
            type: 'source',
            title: 'קהנמן: סלידה מהפסד', titleEn: 'Kahneman: Loss Aversion',
            quote: '״הפסד של 100 דולר מורגש בערך פי שניים יותר מרווח של 100 דולר. זו אחת התגליות החשובות שלנו: אנחנו לא סוחרים סימטריים - אנחנו שונאים הפסד הרבה יותר ממה שאנחנו אוהבים רווח.״',
            quoteEn: '"A loss of $100 is felt about twice as strongly as a gain of $100. This is one of our most important discoveries: we are not symmetrical traders - we hate loss far more than we love gain."',
            attr: 'דניאל קהנמן, *לחשוב מהר, לחשוב לאט*, 2011',
            attrEn: 'Daniel Kahneman, *Thinking, Fast and Slow*, 2011',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'קהנמן וטברסקי גילו עשרות הטיות שיטתיות במוח האנושי. נראה שתיים מהחשובות.</p><p><strong>הראשונה: סלידה מהפסד.</strong> אני מציע לך משחק: זריקת מטבע. אם תזכה - תקבל 100 שקלים. אם תפסיד - תיתן לי 100 שקלים. תשחק?</p><p>רוב האנשים - לא. <strong>אבל מבחינה מתמטית, זה משחק הוגן.</strong> התוחלת היא אפס. למה מסרבים? כי הפסד של 100 שקלים כואב יותר משהרווח של 100 שקלים משמח. <strong>הפסד נראה כפול בערכו.</strong></p><p><strong>השנייה: אפקט העיגון.</strong> המוח לא מעריך מחיר באופן מוחלט - הוא משווה למשהו. בעיקר, <strong>למחיר הראשון שהוא ראה</strong>. אם נראה לך חולצה במחיר 199 שקלים, ואחר כך חולצה זהה ב-99 - השנייה תרגיש זול. <strong>גם אם 99 שקלים זה עדיין הרבה כסף לחולצה.</strong> המחיר הראשון הופך ל"עוגן".</p><p>זו לא חולשה אישית. <strong>אלה תכונות שיטתיות של המוח האנושי.</strong>',
            contentEn: 'Kahneman and Tversky discovered dozens of systematic biases in the human brain. Let\'s look at two of the most important.</p><p><strong>First: loss aversion.</strong> I offer you a game: a coin toss. If you win - you receive 100 shekels. If you lose - you give me 100 shekels. Will you play?</p><p>Most people - won\'t. <strong>But mathematically, this is a fair game.</strong> The expected value is zero. Why do they refuse? Because losing 100 shekels hurts more than gaining 100 shekels feels good. <strong>Loss appears double its value.</strong></p><p><strong>Second: the anchoring effect.</strong> The brain doesn\'t evaluate price in absolute terms - it compares to something. Mostly, <strong>to the first price it saw.</strong> If you see a shirt priced at 199 shekels, and then the same shirt at 99 - the second will feel cheap. <strong>Even if 99 shekels is still a lot of money for a shirt.</strong> The first price becomes an "anchor."</p><p>This is not a personal weakness. <strong>These are systematic features of the human brain.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הכלכלה ההתנהגותית של קהנמן וטברסקי לא ביטלה את המהפכה השולית. <strong>היא שינתה את ההבנה שלנו לגבי איך הצרכן מחליט.</strong></p><p>ג\'בונס וחבריו: ערך הוא סובייקטיבי, אבל הצרכן רציונלי.</p><p>קהנמן וטברסקי: <strong>ערך הוא סובייקטיבי, אבל הצרכן לא רציונלי בצורה צפויה.</strong></p><p>ההשלכות עצומות. <strong>כל תעשיית השיווק והפרסום המודרנית מבוססת על ניצול ההטיות הללו</strong> - מ"מבצעים מוגבלים" שמעוררים סלידת הפסד, ועד תפריטים שמשתמשים בעיגון.</p><p>זה מחזיר אותנו לשאלה הגדולה. <strong>אם המוח שלנו לא מקבל החלטות רציונליות, ואם השוק יכול לנצל את ההטיות שלנו - האם המחיר באמת משקף את "מה שאנחנו רוצים"?</strong></p><p>או שהמחיר משקף <strong>מה ששכנעו אותנו לרצות</strong>?',
            contentEn: 'Kahneman and Tversky\'s behavioral economics did not nullify the marginal revolution. <strong>It changed our understanding of how the consumer decides.</strong></p><p>Jevons and his colleagues: value is subjective, but the consumer is rational.</p><p>Kahneman and Tversky: <strong>value is subjective, but the consumer is irrational in a predictable way.</strong></p><p>The implications are enormous. <strong>The entire modern marketing and advertising industry is built on exploiting these biases</strong> - from "limited time offers" that trigger loss aversion, to menus that use anchoring.</p><p>This brings us back to the big question. <strong>If our brain doesn\'t make rational decisions, and if the market can exploit our biases - does the price really reflect "what we want"?</strong></p><p>Or does the price reflect <strong>what we were persuaded to want</strong>?',
          },
          {
            type: 'quiz',
            question: 'מסעדה מוסיפה לתפריט מנת יוקרה ב-450 שקלים, שכמעט אף אחד לא מזמין. בעקבותיה, המנה ב-180 שקלים - שלפני כן נראתה יקרה - פתאום מרגישה "סבירה". מה קורה כאן?',
            questionEn: 'A restaurant adds a luxury dish to the menu priced at 450 shekels, that almost no one orders. Following that, the 180-shekel dish - which previously seemed expensive - suddenly feels "reasonable." What\'s happening here?',
            options: [
              'אנשים פשוט אוהבים מנות יוקרה',
              'אפקט עיגון - המנה ב-450 שקלים יצרה נקודת ייחוס שגרמה ל-180 להיראות זול',
              'המסעדה הורידה את המחיר של המנה השנייה'
            ],
            optionsEn: [
              'People just love luxury dishes',
              'The anchoring effect - the 450-shekel dish created a reference point that made 180 seem cheap',
              'The restaurant lowered the price of the second dish'
            ],
            correctIndex: 1,
            explanation: 'טכניקה קלאסית בתפריטים. המנה ב-450 שקלים לא נועדה להימכר - היא נועדה לשמש כעוגן. היא הופכת את כל שאר התפריט לזול יחסית. הצרכן חושב שהוא קונה "באמצע", אבל בעצם הוא קונה במחיר שהוגדר ככזה רק בגלל שהמסעדה הציבה עוגן גבוה במכוון. זה לא רמאות - אלה ניצול שיטתי של איך המוח האנושי עובד.',
            explanationEn: 'A classic technique in menus. The 450-shekel dish wasn\'t meant to be sold - it was meant to serve as an anchor. It makes everything else on the menu relatively cheap. The consumer thinks they\'re buying "in the middle," but actually they\'re buying at a price that was defined as such only because the restaurant deliberately set a high anchor. This isn\'t fraud - it\'s systematic exploitation of how the human brain works.',
          },
          {
            type: 'quiz',
            question: 'חבר טוען: "המהפכה השולית הוכיחה שערך הוא מה שצרכן מוכן לשלם. אז שוק חופשי הוא תמיד הוגן." איך קהנמן היה מערער על הטענה הזו?',
            questionEn: 'A friend argues: "The marginal revolution proved that value is what a consumer is willing to pay. So a free market is always fair." How would Kahneman challenge this claim?',
            options: [
              'הוא יסכים - אם הצרכן מסכים לשלם, זה הוגן',
              'הוא יחלוק - הצרכן לא רציונלי, ולכן "מה הוא מוכן לשלם" הוא לא בהכרח "מה שווה לו"',
              'הוא יציע פיקוח ממשלתי על מחירים'
            ],
            optionsEn: [
              'He\'d agree - if the consumer agrees to pay, it\'s fair',
              'He\'d disagree - the consumer is not rational, so "what he\'s willing to pay" is not necessarily "what it\'s worth to him"',
              'He\'d propose government regulation of prices'
            ],
            correctIndex: 1,
            explanation: 'זו הביקורת המרכזית של הכלכלה ההתנהגותית על המהפכה השולית. "מוכן לשלם" אינו זהה ל"שווה לי". הצרכן מושפע מסלידה מהפסד, מעוגן, מ"מבצעים" שמייצרים תחושת דחיפות. הוא יכול לשלם 500 שקלים על משהו ששווה לו באמת 100, פשוט כי המוח שלו עובד עליו. השאלה היא לא רק "האם הסכים?" אלא "האם הסכים בצורה רציונלית?"',
            explanationEn: 'This is the central critique of behavioral economics on the marginal revolution. "Willing to pay" is not the same as "worth to me." The consumer is influenced by loss aversion, by anchoring, by "deals" that create a sense of urgency. He can pay 500 shekels on something truly worth 100 to him, simply because his brain is being worked on. The question is not just "Did he agree?" but "Did he agree rationally?"',
          },
          {
            type: 'quiz',
            question: 'כתבת מאמר עיתון: "המוח לא מקבל החלטות רציונליות. אז שוק חופשי לא יכול להיות הוגן." חבר אומר: "זה מוגזם. אם המוח לא רציונלי, גם בכלכלה מתוכננת לא נקבל החלטות טובות יותר." מי צודק לפי הדיאלוג?',
            questionEn: 'A newspaper article writes: "The brain doesn\'t make rational decisions. So a free market cannot be fair." A friend says: "That\'s exaggerated. If the brain isn\'t rational, we won\'t make better decisions in a planned economy either." Who is right according to the dialogue?',
            options: [
              'החבר - אם המוח לא רציונלי, כל שיטה כלכלית תהיה לא רציונלית',
              'הכתבת - המוח האנושי הוא הבעיה רק בשוק חופשי',
              'שניהם תופסים חלק - המסקנה של קהנמן אינה "שוק לא יכול לעבוד", אלא "צריך להבין שהצרכן לא תמיד פועל לטובתו"'
            ],
            optionsEn: [
              'The friend - if the brain isn\'t rational, every economic system will be irrational',
              'The writer - the human brain is the problem only in a free market',
              'Both capture part of it - Kahneman\'s conclusion isn\'t "the market can\'t work," but "we need to understand that the consumer doesn\'t always act in their own interest"'
            ],
            correctIndex: 2,
            explanation: 'קהנמן לא טען שצריך לבטל את השוק. הוא טען שצריך להבין את הצרכן טוב יותר. המסקנה האמיתית של הכלכלה ההתנהגותית היא דקה: השוק לא "לא הוגן" - אבל הוא יכול לנצל הטיות. התשובה אינה לבטל שוק, אלא לעצב מערכות בצורה שמפצה על ההטיות - למשל, ברירות מחדל שעוזרות לאנשים להחליט טוב יותר. השוק הוא כלי, וכמו כל כלי, הוא יכול להיות שימושי או מזיק.',
            explanationEn: 'Kahneman did not claim that we should abolish the market. He claimed that we need to understand the consumer better. The real conclusion of behavioral economics is subtle: the market isn\'t "unfair" - but it can exploit biases. The answer isn\'t to abolish the market, but to design systems in a way that compensates for biases - for example, default settings that help people decide better. The market is a tool, and like any tool, it can be useful or harmful.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 7, title: 'סיכום: מהו ערך?', titleEn: 'Summary: What is Value?', thinker: 'סיכום פרק', thinkerEn: 'Chapter Summary', thinkerId: null, xp: 50, isSummary: true, sections: [
          {
            type: 'idea',
            title: 'סיכום: מהו ערך?', titleEn: 'Summary: What is Value?',
            content: 'התחלנו את הפרק בשאלה פשוטה: <strong>מה קובע ערך?</strong> למה כוס מים זולה, ויהלום יקר?</p><p>עכשיו, אחרי שישה דיאלוגים, ברור שזו לא שאלה תמימה. כי <strong>כל תשובה לשאלה הזו היא גם תשובה על איך החברה צריכה להיראות.</strong>',
            contentEn: 'We began the chapter with a simple question: <strong>what determines value?</strong> Why is a glass of water cheap, and a diamond expensive?</p><p>Now, after six dialogues, it\'s clear this is not an innocent question. Because <strong>every answer to this question is also an answer about how society should look.</strong>',
          },
          {
            type: 'source',
            isRecap: true,
            title: 'המסע שעברנו', titleEn: 'The Journey We Traveled',
            quote: '״סמית: ערך מגיע מעבודה. מרקס: ולכן הקפיטליזם הוא ניצול. ג\'בונס: ערך מגיע מתועלת - מהרצון של הצרכן. מרשל: בעצם, ערך הוא מפגש בין שניהם. סנדל: אבל יש דברים שאין להם מחיר. קהנמן: ובכלל, הצרכן לא רציונלי.״',
            quoteEn: '"Smith: value comes from labor. Marx: and therefore capitalism is exploitation. Jevons: value comes from utility - from the consumer\'s desire. Marshall: actually, value is a meeting between the two. Sandel: but there are things that have no price. Kahneman: and besides, the consumer is not rational."',
            attr: 'סיכום פרק 2',
            attrEn: 'Chapter 2 Summary',
            content: '<strong>סמית</strong> הציע שערך מגיע מהעבודה שמושקעת בייצור. <strong>מרקס</strong> לקח את התובנה לקיצון: אם זה כך, אז כל הון הוא עבודה גנובה.</p><p><strong>ג\'בונס</strong> הפך את הוויכוח על פיו ב-1871. ערך לא נמצא בחפץ - הוא נמצא <strong>בעיני המתבונן</strong>. <strong>מרשל</strong> סגר את הוויכוח ב-1890: שני הצדדים צודקים. <strong>המחיר הוא נקודת המפגש בין יצרן לצרכן.</strong></p><p>ואז הגיעו <strong>סנדל וקהנמן</strong> ושאלו שאלות אחרות. סנדל: <strong>לא הכל צריך להיות בשוק.</strong> קהנמן: <strong>אפילו כשאנחנו בשוק, אנחנו לא רציונליים.</strong>',
            contentEn: '<strong>Smith</strong> proposed that value comes from the labor invested in production. <strong>Marx</strong> took the insight to an extreme: if that\'s the case, then all capital is stolen labor.</p><p><strong>Jevons</strong> turned the debate on its head in 1871. Value isn\'t in the object - it\'s <strong>in the eye of the beholder</strong>. <strong>Marshall</strong> closed the debate in 1890: both sides are right. <strong>The price is the meeting point between producer and consumer.</strong></p><p>Then came <strong>Sandel and Kahneman</strong> and asked different questions. Sandel: <strong>not everything should be in the market.</strong> Kahneman: <strong>even when we\'re in the market, we\'re not rational.</strong>',
          },
          {
            type: 'explanation',
            title: 'מה למדנו בעצם', titleEn: 'What We Actually Learned',
            content: 'הוויכוח על "מה זה ערך?" נראה טכני. אבל הוא לא.</p><p><strong>כל תשובה לשאלה הזו טוענת משהו על איך החברה צריכה להיראות.</strong> סמית ומרקס מיקמו את מקור הערך בעבודה - וזה הוביל לוויכוח על קפיטליזם וניצול. ג\'בונס וחבריו מיקמו אותו בצרכן - וזה הוביל לכלכלה הניאו-קלאסית של ימינו. סנדל הזכיר שיש דברים שלא צריכים להיות בשוק בכלל. קהנמן הזכיר שהצרכן עצמו אינו רציונלי.</p><p><strong>אין תשובה אחת ל"מה זה ערך?"</strong> יש מסגרת ויכוח שמשתרעת מ-1776 עד היום.',
            contentEn: 'The debate over "what is value?" looks technical. But it isn\'t.</p><p><strong>Every answer to this question claims something about how society should look.</strong> Smith and Marx located the source of value in labor - which led to the debate over capitalism and exploitation. Jevons and his colleagues located it in the consumer - which led to the neo-classical economics of our days. Sandel reminded us that there are things that shouldn\'t be in the market at all. Kahneman reminded us that the consumer himself is not rational.</p><p><strong>There is no single answer to "what is value?"</strong> There is a framework of debate that stretches from 1776 to today.',
          },
          {
            type: 'depth',
            title: 'השאלה לפרק הבא', titleEn: 'The Question for the Next Chapter',
            content: 'אבל יש שאלה אחת שמלווה אותנו מתחת לפני השטח של כל הוויכוח. <strong>מהיכן באמת בא הרווח?</strong></p><p>ראינו את מרקס טוען שהוא בא מעבודה לא משולמת של הפועל. ראינו את ג\'בונס טוען שהוא בא מהפער בין מחיר לעלות. אבל לא ענינו על השאלה הגדולה יותר: <strong>מי באמת יוצר את הערך - בעל ההון או הפועל? איך אנחנו אמורים לחלק את העושר ביניהם?</strong></p><p>זו השאלה של פרק 3: <strong>הון ועבודה.</strong>',
            contentEn: 'But there is one question that accompanies us beneath the surface of the entire debate. <strong>Where does profit really come from?</strong></p><p>We saw Marx claim it comes from the worker\'s unpaid labor. We saw Jevons claim it comes from the gap between price and cost. But we didn\'t answer the bigger question: <strong>who truly creates value - the capital-holder or the worker? How should we divide wealth between them?</strong></p><p>This is the question of Chapter 3: <strong>Capital and Labor.</strong>',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "כלכלה היא תחום מדעי, ניטרלי. לכן \'מה זה ערך\' היא שאלה טכנית בלבד." איך פרק 2 כולו ערער על הטענה הזו?',
            questionEn: 'A friend says: "Economics is a scientific, neutral field. Therefore \'what is value\' is just a technical question." How did all of Chapter 2 challenge this claim?',
            options: [
              'החבר צודק - כלכלה היא רק עניין טכני',
              'כל תשובה ל"מה זה ערך" טוענת גם משהו על איך החברה צריכה להיראות',
              'רק קהנמן ערער על זה - שאר ההוגים הסכימו'
            ],
            optionsEn: [
              'The friend is right - economics is just a technical matter',
              'Every answer to "what is value" also claims something about how society should look',
              'Only Kahneman challenged this - the other thinkers agreed'
            ],
            correctIndex: 1,
            explanation: 'זו התובנה המרכזית של הפרק. כשסמית אמר "ערך מגיע מעבודה" - הוא לא רק תיאר. הוא הצדיק את הקפיטליזם כשיטה ראויה. כשמרקס לקח את אותו רעיון לקיצון, הוא הוקיע את אותה שיטה. שאלות "טכניות" של ערך הן בעצם שאלות פוליטיות בתחפושת. אין דרך לדבר על כלכלה בלי לדבר על ערכים.',
            explanationEn: 'This is the central insight of the chapter. When Smith said "value comes from labor" - he didn\'t just describe. He justified capitalism as a worthy system. When Marx took the same idea to an extreme, he condemned the same system. "Technical" questions of value are actually political questions in disguise. There is no way to talk about economics without talking about values.',
          },
          {
            type: 'quiz',
            question: 'חבר טוען: "תיאוריית ערך-העבודה של סמית ומרקס נפלה ב-1871, אז אין סיבה להמשיך לדבר עליה." האם זה נכון?',
            questionEn: 'A friend argues: "Smith and Marx\'s labor theory of value fell in 1871, so there\'s no reason to keep talking about it." Is this correct?',
            options: [
              'כן - מה שנפל מדעית, צריך לזרוק',
              'לא - השאלות שהם פתחו ("מהיכן בא הרווח?", "האם השוק הוגן?") עדיין נשאלות',
              'אין דרך לדעת - צריך לחכות לעוד מחקרים'
            ],
            optionsEn: [
              'Yes - what fell scientifically should be discarded',
              'No - the questions they opened ("where does profit come from?", "is the market fair?") are still being asked',
              'There\'s no way to know - we need more research'
            ],
            correctIndex: 1,
            explanation: 'הבסיס המתמטי של תיאוריית ערך-העבודה אכן נפל. אבל השאלות העמוקות שמרקס פתח - לא נפלו עם זה. למה שכר העובדים לא עולה כשהתפוקה גדלה? למה רווחי החברות הגדולות זינקו? למה אי-שוויון מתרחב? את השאלות האלה אנחנו עדיין שואלים היום - גם בלי לקבל את התיאוריה הספציפית של מרקס. לפעמים שאלה טובה שורדת תשובה רעה.',
            explanationEn: 'The mathematical foundation of the labor theory of value did fall. But the deep questions Marx opened did not fall with it. Why don\'t workers\' wages rise when productivity grows? Why have the profits of large companies soared? Why is inequality expanding? These are the questions we still ask today - even without accepting Marx\'s specific theory. Sometimes a good question survives a bad answer.',
          },
          {
            type: 'quiz',
            question: 'באיזה מובן סנדל וקהנמן, למרות ההבדלים ביניהם, מצביעים על אותה בעיה בכלכלה הניאו-קלאסית?',
            questionEn: 'In what sense do Sandel and Kahneman, despite their differences, point to the same problem in neo-classical economics?',
            options: [
              'שניהם טוענים שצריך לבטל את השוק החופשי',
              'שניהם טוענים שהמהפכה השולית הייתה טעות מוחלטת',
              'שניהם מערערים על ההנחה ש"מה שצרכן מוכן לשלם" משקף את "מה ששווה לו באמת"'
            ],
            optionsEn: [
              'Both argue that the free market should be abolished',
              'Both argue that the marginal revolution was a complete mistake',
              'Both challenge the assumption that "what a consumer is willing to pay" reflects "what it\'s really worth to him"'
            ],
            correctIndex: 2,
            explanation: 'זו תובנה חשובה. שניהם מתחילים מאותה נקודה - מה שצרכן מוכן לשלם הוא לא בהכרח מה ששווה לו. סנדל מסיבה מוסרית: יש דברים שעצם הכנסתם לשוק משחיתה אותם (אהבה, הצבעה, כליה). קהנמן מסיבה פסיכולוגית: הצרכן מושפע מהטיות שיטתיות (סלידה מהפסד, עיגון). שני הוגים מאוד שונים - אבל שניהם חולקים על הלב של הכלכלה הניאו-קלאסית: שהמחיר משקף תועלת אמיתית.',
            explanationEn: 'This is an important insight. Both start from the same point - what a consumer is willing to pay is not necessarily what it\'s worth to him. Sandel for a moral reason: there are things whose mere entry into the market corrupts them (love, voting, kidney). Kahneman for a psychological reason: the consumer is influenced by systematic biases (loss aversion, anchoring). Two very different thinkers - but both disagree with the heart of neo-classical economics: that the price reflects real utility.',
          },
          { type: 'quiz_summary' },
        ] },
      ],
    },
    {
      "id": "bonusEcon1",
      "title": "משבר הנפט",
      "titleEn": "The Oil Crisis",
      "subtitle": "מה זינוק מחיר הנפט ב-2026 מלמד על כל הכלכלה",
      "subtitleEn": "What the 2026 oil price spike teaches about all of economics",
      "isBonus": true,
      "subject": "economics",
      "xp": 100,
      "days": [
        {
          "id": 0,
          "title": "מאחורי הכותרת",
          "titleEn": "Behind the Headline",
          "thinker": "",
          "thinkerEn": "",
          "thinkerId": null,
          "xp": 0,
          "sections": [
            {
              "type": "idea",
              "title": "מאחורי הכותרת",
              "titleEn": "Behind the headline",
              "content": "בסוף פברואר 2026 פרצה מלחמת ארה\"ב-ישראל מול איראן, ותוך ימים מחיר הנפט בעולם זינק בכמעט 50 אחוז, מכ-72 דולר לחבית אל מעל 100, מחשש שמיצרי הורמוז, שדרכם עובר כחמישית מהנפט העולמי, ייחסמו. כעבור שבועות המחיר ירד בחזרה. אבל מתחת לכותרת הזו מסתתר כמעט כל מה שיש בכלכלה: למה מחירים קופצים, מי מרוויח, מי משלם, ומה בכלל הופך מחיר ל\"צודק\". בפרק הזה ניקח אירוע אמיתי אחד ונפרק אותו דרך עיניהם של חמישה כלכלנים, כל אחד ושאלה אחרת על אותו מחיר. הכלכלה היא העדשה, לא הפוליטיקה.",
              "contentEn": "In late February 2026, the US-Israel war against Iran broke out, and within days the price of oil worldwide jumped by nearly 50 percent, from around 72 dollars a barrel to over 100, on fears that the Strait of Hormuz, through which about a fifth of the world's oil passes, would be blocked. Weeks later, the price came back down. But beneath that headline lies almost everything there is in economics: why prices jump, who profits, who pays, and what even makes a price \"just.\" In this chapter we take one real event and break it down through the eyes of five economists, each with a different question about the same price. Economics is the lens here, not politics."
            },
            {
              "type": "idea",
              "title": "מה נחקור בפרק?",
              "titleEn": "What will we explore in this chapter?",
              "content": "<strong>דיאלוג 1 | סמית והפחד:</strong> למה מחיר הנפט זינק בכמעט 50 אחוז, עוד לפני שטיפת נפט אחת הפסיקה לזרום? נראה איך השוק מתמחר פחד וציפיות.\n\n<strong>דיאלוג 2 | ג'בונס והשוליים:</strong> רק חמישית מהנפט הייתה בסיכון, אז למה כל הנפט בעולם התייקר? נגלה למה הערך נקבע בשוליים.\n\n<strong>דיאלוג 3 | אקווינס והצדק:</strong> כשמחיר הדלק מזנק במלחמה, זה מחיר צודק או ניצול של מצוקה? נבחן אם בכלל קיים \"מחיר צודק\".\n\n<strong>דיאלוג 4 | ריקרדו והרֵנטה:</strong> כל הכסף הנוסף הלך לאנשהו. מי התעשר מהמשבר בלי להרים אצבע?\n\n<strong>דיאלוג 5 | סן והיכולות:</strong> הנפט אף פעם לא נעלם, אז מי באמת שילם את המחיר? נסיים בשאלה האנושית מכולן.",
              "contentEn": "<strong>Dialogue 1 | Smith and fear:</strong> Why did the price of oil jump by nearly 50 percent, before a single drop of oil had even stopped flowing? We will see how the market prices in fear and expectations.\n\n<strong>Dialogue 2 | Jevons and the margin:</strong> Only a fifth of the oil was at risk, so why did all the world's oil grow more expensive? We will discover why value is set at the margin.\n\n<strong>Dialogue 3 | Aquinas and justice:</strong> When fuel prices spike in war, is it a just price or exploitation of distress? We will examine whether a \"just price\" exists at all.\n\n<strong>Dialogue 4 | Ricardo and rent:</strong> All the extra money went somewhere. Who got rich from the crisis without lifting a finger?\n\n<strong>Dialogue 5 | Sen and capabilities:</strong> The oil never actually vanished, so who really paid the price? We close with the most human question of all."
            }
          ]
        },
        {
          "id": 1,
          "title": "הפחד שמזיז מחירים",
          "titleEn": "The Fear That Moves Prices",
          "thinker": "אדם סמית",
          "thinkerEn": "Adam Smith",
          "thinkerId": "smith",
          "xp": 50,
          "sections": [
            {
              "type": "idea",
              "title": "הרעיון של היום",
              "titleEn": "Today's idea",
              "content": "בסוף פברואר 2026 פרצה מלחמת ארה\"ב-ישראל מול איראן. תוך ימים ספורים מחיר חבית נפט (ברנט) זינק מכ-72 דולר אל מעל 100 דולר, עלייה של כ-49 אחוז, ובשיא טיפס לכיוון 120 דולר.\n\nאבל שים לב לפרט אחד: באותם ימים, אף בור נפט לא נסגר. אף מיכלית לא טבעה. כמות הנפט שזרמה בעולם בפועל כמעט לא השתנתה. אז למה המחיר קפץ כל כך מהר?\n\nהתשובה נמצאת אצל אדם סמית, שב-1776 ניסח את הרעיון המפורסם של <strong>\"</strong><strong>היד הנעלמה</strong><strong>\"</strong>: שוק שבו כל אדם פועל מתוך האינטרס שלו, ובכל זאת התוצאה הכוללת מתאמת היצע וביקוש מעצמה, בלי שאף אחד מכוון אותה.\n\nסמית הבחין בין שני מחירים. יש <strong>\"</strong><strong>מחיר טבעי</strong><strong>\"</strong>, המחיר שמכסה את עלות הייצור האמיתית. ויש <strong>\"</strong><strong>מחיר שוק</strong><strong>\"</strong>, המחיר בפועל היום. וכשהקונים חוששים שלא יהיה מספיק מהמצרך, מחיר השוק יכול לטפס הרבה מעל המחיר הטבעי, גם לפני שנוצר מחסור אמיתי. <strong>המחיר לא משקר. הוא פשוט מתמחר את החשש</strong><strong>.</strong>",
              "contentEn": "In late February 2026, the US-Israel war against Iran broke out. Within a few days, the price of a barrel of oil (Brent) jumped from around 72 dollars to over 100 dollars, a rise of about 49 percent, and at its peak it climbed toward 120 dollars.\n\nBut notice one detail: during those days, not a single oil well shut down. No tanker sank. The amount of oil actually flowing through the world barely changed. So why did the price jump so fast?\n\nThe answer lies with Adam Smith, who in 1776 formulated the famous idea of the <strong>\"invisible hand\"</strong>: a market in which every person acts out of their own self-interest, and yet the collective outcome coordinates supply and demand on its own, without anyone steering it.\n\nSmith distinguished between two prices. There is a <strong>\"natural price,\"</strong> the price that covers the true cost of production. And there is a <strong>\"market price,\"</strong> the actual price today. When buyers worry that there will not be enough of a good, the market price can climb far above the natural price, even before a real shortage exists. <strong>The price is not lying. It is simply pricing in the concern.</strong>",
              "image": "images/bonus/economics/dialog1-idea.webp"
            },
            {
              "type": "source",
              "title": "קטע מקור",
              "titleEn": "Source text",
              "quote": "\"כאשר הכמות של מצרך כלשהו המובא לשוק נופלת מן הביקוש האפקטיבי, חלק מן הקונים, ובלבד שלא יישארו בלעדיו, יהיו מוכנים לשלם יותר. תחרות תתחיל מיד ביניהם, ומחיר השוק יעלה מעל המחיר הטבעי, בהתאם לגודל המחסור או לעוצמת הלהיטות של המתחרים.\"",
              "quoteEn": "\"When the quantity of any commodity which is brought to market falls short of the effectual demand... a competition will immediately begin among them, and the market price will rise more or less above the natural price, according as either the greatness of the deficiency, or the wealth and wanton luxury of the competitors, happen to animate more or less the eagerness of the competition.\"",
              "attr": "- אדם סמית, \"עושר העמים\", ספר ראשון, פרק 7 (על המחיר הטבעי ומחיר השוק), 1776",
              "attrEn": "- Adam Smith, \"The Wealth of Nations,\" Book I, Chapter 7 (Of the Natural and Market Price of Commodities), 1776"
            },
            {
              "type": "explanation",
              "title": "הסבר",
              "titleEn": "Explanation",
              "content": "סמית כתב על מחסור אמיתי: כשמגיע לשוק פחות ממה שאנשים רוצים, הקונים מתחרים זה בזה ומציעים יותר, והמחיר עולה. ככל שהמצרך חיוני יותר, כך הלהיטות גדולה יותר, וכך המחיר מזנק חזק יותר.\n\n<strong>דוגמה מהחיים</strong><strong>:</strong> חשוב על תחילת מגפת הקורונה ב-2020. ברגע שעלה חשש ממחסור עתידי, אנשים מיהרו לאגור מסכות, ג'ל אלכוהול ונייר טואלט, והמדפים התרוקנו. אף אחד לא ידע בוודאות מה יקרה, אבל כל אחד מתוך הדאגה שלו רצה להבטיח לעצמו מלאי עכשיו. במוצרים שלא היו מפוקחים, כמו מסכות וג'ל, המחיר זינק. <strong>לא בגלל שכבר היה מחסור, אלא בגלל שכולם חששו שיהיה</strong><strong>.</strong>\n\nזה בדיוק מה שקרה לנפט. כ-20 אחוז מהנפט בעולם עובר דרך מיצרי הורמוז, מעבר ימי צר ליד איראן. ברגע שעלה חשש שהמיצרים ייחסמו, סוחרים, חברות תעופה ומדינות מיהרו להבטיח לעצמם דלק עכשיו, מחשש שמחר יהיה יקר יותר או לא יהיה בכלל. כל אחד פעל מתוך האינטרס שלו, והיד הנעלמה תרגמה את מיליוני הפעולות האלה למחיר אחד שקפץ מעלה. המחיר הגבוה לא שיקף נפט שנעלם. הוא שיקף נפט שאנשים חששו שייעלם.\n\nההפרש הזה, בין המחיר הטבעי למחיר שמשקף סיכון עתידי, נקרא בכלכלה המודרנית <strong>פרמיית סיכון</strong>. זו התוספת שאנשים מוכנים לשלם כדי לא להיתקע בלי המצרך אם התרחיש הגרוע יקרה.",
              "contentEn": "Smith wrote about real scarcity: when less reaches the market than people want, buyers compete with one another and offer more, and the price rises. The more essential the good, the greater the eagerness, and the harder the price jumps.\n\n<strong>A real-life example:</strong> Think about the start of the COVID pandemic in 2020. The moment a fear of future shortage appeared, people rushed to stock up on masks, hand sanitizer and toilet paper, and the shelves emptied. No one knew for certain what would happen, but each person, out of their own worry, wanted to secure a supply now. For goods that were not price-regulated, like masks and sanitizer, the price soared. <strong>Not because there was already a shortage, but because everyone was worried there would be.</strong>\n\nThis is exactly what happened with oil. About 20 percent of the world's oil passes through the Strait of Hormuz, a narrow sea passage next to Iran. The moment a concern arose that the strait might be blocked, traders, airlines and governments rushed to secure fuel for themselves now, worried that tomorrow it would be more expensive or unavailable altogether. Each one acted out of self-interest, and the invisible hand translated those millions of actions into a single price that jumped upward. The high price did not reflect oil that had vanished. It reflected oil that people were worried would vanish.\n\nThis gap, between the natural price and a price that reflects future risk, is called in modern economics a <strong>risk premium</strong>. It is the extra amount people are willing to pay so as not to be left without the good if the worst-case scenario occurs.",
              "image": "images/bonus/economics/dialog1-explanation.webp"
            },
            {
              "type": "depth",
              "title": "העומק שמאחורי הרעיון",
              "titleEn": "The depth behind the idea",
              "content": "כאן מתחבא הרעיון העמוק באמת. אם בסוף הורמוז לא נחסם, והנפט המשיך לזרום, האם המחיר הגבוה היה \"טעות\"?\n\nלפי סמית, לא. המחיר עשה בדיוק את העבודה שלו. מחיר גבוה הוא אות. הוא אומר לצרכנים לחסוך בדלק, ואומר ליצרנים בעולם לשאוב יותר. ואכן, מדינות אופ\"ק הגדילו תפוקה בתגובה. המחיר תיאם את התנהגות כל השחקנים בלי שאף ועדה מרכזית ציוותה עליהם דבר. הוא היה ההערכה הטובה ביותר של השוק בהינתן המידע שהיה קיים באותו רגע, גם אם בדיעבד התרחיש הגרוע לא התממש.\n\nזה הקו שמחבר את סמית להייק. הייק יוסיף מאוחר יותר טענה חדה: <strong>המחיר הוא לא רק תוצאה של היצע וביקוש, אלא מנגנון להעברת מידע</strong><strong>.</strong> אף אדם בודד לא יודע הכל על מצב הנפט בעולם. אבל כשכל אחד פועל לפי הידיעה הקטנה שלו, המחיר אוסף את כל פיסות המידע והציפיות הפזורות, ומגלם אותן במספר אחד שכולם יכולים לקרוא. בזמן משבר, זו אחת הסיבות שמחירים זזים כל כך מהר: הם לא מחכים שהאירוע יקרה, הם מתמחרים את ההסתברות שהוא יקרה.",
              "contentEn": "Here is where the truly deep idea hides. If in the end Hormuz was not blocked, and the oil kept flowing, was the high price a \"mistake\"?\n\nAccording to Smith, no. The price did exactly its job. A high price is a signal. It tells consumers to conserve fuel, and tells producers around the world to pump more. And indeed, OPEC countries increased output in response. The price coordinated the behavior of all the players without any central committee ordering them to do anything. It was the market's best estimate given the information that existed at that moment, even if in hindsight the worst-case scenario never materialized.\n\nThis is the line that connects Smith to Hayek. Hayek would later add a sharp claim: <strong>the price is not only a result of supply and demand, but a mechanism for transmitting information.</strong> No single person knows everything about the state of oil in the world. But when each person acts on their own small piece of knowledge, the price gathers all the scattered fragments of information and expectations, and embeds them into a single number that everyone can read. In times of crisis, this is one of the reasons prices move so fast: they do not wait for the event to happen, they price the probability that it will.",
              "image": "images/bonus/economics/dialog1-depth.webp"
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "בשבוע הראשון של המלחמה מחיר הנפט זינק בעשרות אחוזים, למרות שכמות הנפט שזרמה בפועל כמעט לא השתנתה. כיצד אדם סמית היה מסביר את הקפיצה?",
              "questionEn": "In the first week of the war, the price of oil jumped by tens of percent, even though the amount of oil actually flowing barely changed. How would Adam Smith explain the jump?",
              "options": [
                "השוק טעה, ומכיוון שלא היה מחסור אמיתי, המחיר היה מנותק מהמציאות",
                "הקונים חששו ממחסור עתידי והתחרו זה בזה על הדלק, וכך מחיר השוק טיפס מעל המחיר הטבעי עוד לפני מחסור בפועל",
                "רק התערבות ממשלתית יכלה להעלות את המחיר כל כך מהר"
              ],
              "optionsEn": [
                "The market was wrong, and since there was no real shortage, the price was disconnected from reality",
                "Buyers worried about a future shortage and competed with one another over the fuel, so the market price climbed above the natural price even before an actual shortage",
                "Only government intervention could have raised the price so fast"
              ],
              "correctIndex": 1,
              "explanation": "זה לב הרעיון של סמית. מחיר השוק לא נקבע רק לפי הכמות הקיימת היום, אלא לפי הלהיטות של הקונים. כשמצרך חיוני כמו נפט נמצא בסיכון, החשש מהמחסור מספיק כדי להצית תחרות בין קונים ולהקפיץ את המחיר. המחיר גילם את הציפייה, לא את המחסור עצמו.",
              "explanationEn": "This is the heart of Smith's idea. The market price is set not only by the quantity available today, but by the eagerness of the buyers. When an essential good like oil is at risk, the concern about a shortage is enough to ignite competition among buyers and send the price up. The price embodied the expectation, not the shortage itself."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חבר טוען: \"אם בסוף מיצרי הורמוז לא נחסמו, אז כל ההתייקרות הייתה בלון מנופח, פאניקה מיותרת שלא שיקפה כלום.\" כיצד תגיב לו לפי הגישה של סמית?",
              "questionEn": "A friend argues: \"If in the end the Strait of Hormuz was not blocked, then the whole price increase was an inflated bubble, pointless panic that reflected nothing.\" How would you respond, based on Smith's approach?",
              "options": [
                "הוא צודק, מחיר שעולה בלי מחסור אמיתי הוא תמיד עיוות שיש לתקן",
                "הוא טועה, המחיר היה ההערכה הטובה ביותר של השוק בהינתן המידע באותו רגע, והוא מילא תפקיד אמיתי: לעודד חיסכון ולתמרץ יצרנים לשאוב יותר",
                "הוא צודק, כי רק אירוע שקרה בפועל יכול להצדיק שינוי מחיר"
              ],
              "optionsEn": [
                "He is right, a price that rises without a real shortage is always a distortion that should be corrected",
                "He is wrong, the price was the market's best estimate given the information at that moment, and it played a real role: encouraging conservation and incentivizing producers to pump more",
                "He is right, because only an event that actually happened can justify a change in price"
              ],
              "correctIndex": 1,
              "explanation": "מחיר אינו נבואה, הוא הערכת הסתברות. גם אם התרחיש הגרוע לא התממש, המחיר הגבוה עשה עבודה ממשית בזמן אמת: הוא תיאם את התנהגות הצרכנים והיצרנים מול סיכון אמיתי. לשפוט אותו בדיעבד, אחרי שכבר ידוע שהכל הסתדר, זו הטיה. ברגע ההחלטה, המידע היה חלקי, והפרמיה על הסיכון הייתה רציונלית.",
              "explanationEn": "A price is not a prophecy, it is a probability estimate. Even if the worst-case scenario did not materialize, the high price did real work in real time: it coordinated the behavior of consumers and producers against a genuine risk. To judge it in hindsight, after it is already known that everything worked out, is a bias. At the moment of decision, the information was partial, and the premium on the risk was rational."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "מהי הדרך המדויקת ביותר לתאר מה \"עושה\" מחיר הנפט בזמן משבר, לפי הקו שמחבר את סמית להייק?",
              "questionEn": "What is the most precise way to describe what the price of oil \"does\" during a crisis, according to the line that connects Smith to Hayek?",
              "options": [
                "המחיר הוא פקודה שקובע מנהל השוק כדי לשמור על יציבות",
                "המחיר הוא מספר אקראי שמשתנה לפי מצב הרוח של הסוחרים",
                "המחיר הוא מנגנון שאוסף פיסות מידע וציפיות הפזורות בין מיליוני אנשים, ומגלם אותן במספר אחד שמתאם את כולם"
              ],
              "optionsEn": [
                "The price is a command set by a market manager in order to maintain stability",
                "The price is a random number that changes according to the mood of the traders",
                "The price is a mechanism that gathers fragments of information and expectations scattered among millions of people, and embeds them into a single number that coordinates everyone"
              ],
              "correctIndex": 2,
              "explanation": "זו התרומה שמחברת את שני ההוגים. סמית הראה שהמחיר נע לפי להיטות הקונים. הייק הוסיף שהמחיר הוא בעצם אמצעי תקשורת: אף אחד לא מחזיק בתמונה המלאה, אבל המחיר מסכם את כל הידע המבוזר ומשדר אותו לכולם. לכן בזמן משבר מחירים זזים כל כך מהר, הם מתמחרים מידע וציפיות, לא רק את ההווה.",
              "explanationEn": "This is the contribution that connects the two thinkers. Smith showed that the price moves according to the eagerness of buyers. Hayek added that the price is essentially a means of communication: no one holds the full picture, but the price sums up all the distributed knowledge and broadcasts it to everyone. That is why prices move so fast during a crisis, they price in information and expectations, not just the present."
            },
            {
              "type": "quiz_summary"
            }
          ]
        },
        {
          "id": 2,
          "title": "כשהשוליים קובעים הכל",
          "titleEn": "When the Margin Rules",
          "thinker": "ויליאם סטנלי ג'בונס",
          "thinkerEn": "William Stanley Jevons",
          "thinkerId": "jevons",
          "xp": 50,
          "sections": [
            {
              "type": "idea",
              "title": "הרעיון של היום",
              "titleEn": "Today's idea",
              "content": "בדיאלוג הקודם סמית הסביר שמחיר הנפט קפץ כי השוק מתמחר פחד וציפיות. אבל יש מספר אחד שראוי לעצור עליו: רק כ-20 אחוז מהנפט בעולם עובר דרך הורמוז, כלומר רק חמישית הייתה בכלל בסיכון. אז למה מחיר כל הנפט בעולם זינק בכמעט 50 אחוז? איך איום על חמישית מקפיץ את המחיר של השלם?\n\nאת התשובה נתן ויליאם סטנלי ג'בונס, שב-1871, יחד עם עוד שני כלכלנים בלי שתיאמו ביניהם, חולל את מה שנקרא המהפכה השולית. הרעיון: הערך של דבר אינו תכונה שלו עצמו, הוא סובייקטיבי. הוא שווה לכמה ששווה היחידה הבאה, וזה תלוי בכמה כבר יש.\n\nג'בונס פתר בזה חידה עתיקה, פרדוקס המים והיהלום: מים חיוניים לחיים אבל זולים, יהלומים חסרי תועלת אבל יקרים. למה? כי מים יש בשפע, אז הכוס הבאה כמעט לא שווה. יהלומים יש מעט, אז היהלום הבא שווה הון. את הערך של היחידה הבאה הוא כינה תועלת שולית. והנקודה החשובה: התועלת השולית רגישה מאוד לנדירות.",
              "contentEn": "In the previous dialogue, Smith explained that the oil price jumped because the market prices in fear and expectations. But there is one number worth pausing on: only about 20 percent of the world's oil passes through Hormuz, meaning only a fifth was ever at risk. So why did the price of all the world's oil jump by nearly 50 percent? How does a threat to a fifth send the price of the whole soaring?\n\nThe answer came from William Stanley Jevons, who in 1871, together with two other economists who never coordinated with one another, launched what became known as the marginal revolution. The idea: the value of a thing is not a property of the thing itself, it is subjective. It is worth whatever the <strong>next unit</strong> is worth, and that depends on how much you already have.\n\nWith this, Jevons solved an ancient puzzle, the water-diamond paradox: water is essential to life yet cheap, diamonds are useless yet expensive. Why? Because water is abundant, so the next glass is worth almost nothing. Diamonds are scarce, so the next one is worth a fortune. The value of that next unit he called <strong>marginal utility</strong>. <strong>And here is the key point: marginal utility is extremely sensitive to scarcity.</strong>",
              "image": "images/bonus/economics/dialog2-idea.webp"
            },
            {
              "type": "source",
              "title": "קטע מקור",
              "titleEn": "Source text",
              "quote": "\"ערך הוא יחס סובייקטיבי שאדם מקנה לדבר. הוא אינו תכונה של הדבר עצמו, הוא תוצאה של החשיבות שיש לדבר עבור הסיפוק של אדם מסוים.\"",
              "quoteEn": "\"Value is a subjective relation that a person assigns to a thing. It is not a property of the thing itself, it is the result of the importance the thing has for the satisfaction of a particular person.\"",
              "attr": "- ויליאם סטנלי ג'בונס, \"תיאוריה של הכלכלה הפוליטית\", 1871",
              "attrEn": "- William Stanley Jevons, \"The Theory of Political Economy,\" 1871"
            },
            {
              "type": "explanation",
              "title": "הסבר",
              "titleEn": "Explanation",
              "content": "כשיש שפע ממשהו, היחידה הבאה זולה. כשהוא הולך ואוזל, אותה יחידה בדיוק הופכת יקרה. הדבר לא השתנה, מצב הנדירות השתנה.\n\nדוגמה מהחיים: חשוב על סוללת הטלפון. כשהיא ב-100 אחוז, אין שום מחשבה לפני שמשתמשים בה, האחוז הבא לא שווה כלום. אבל כשהיא ב-8 אחוז ואין מטען באופק, אותו אחוז בדיוק נעשה יקר מפז: מעמעמים מסך, סוגרים אפליקציות, שומרים על כל טיפה. ה\"ערך לאחוז\" לא השתנה פיזית, רק הנדירות. זו תועלת שולית בפעולה.\n\nעכשיו החל את זה על הנפט. בדרך כלל לעולם יש כרית נוחה של נפט, אז החבית הבאה זולה יחסית, אנחנו בחלק ה\"שפע\" של העקומה. אבל ברגע שהורמוז, הברז שמספק חמישית מהנפט, אוים בסגירה, הכרית פתאום נראתה דקה. אף חבית לא אבדה בפועל, אבל העולם זז מ\"שפע\" לכיוון \"נדירות\". וקרוב לנדירות, הערך של כל חבית שנשארה, החבית השולית, מזנק. איום על חמישית לא הוריד את הערך בחמישית, הוא דחף את הנפט במעלה מצוק התועלת השולית.\n\nולמה זה מייקר את כל הנפט ולא רק את החלק שבסיכון? כי כל הנפט הוא תחליף זה לזה, והמחיר בשוק נקבע לפי החבית השולית. כשהחבית השולית מתייקרת, כל החביות מתייקרות איתה.",
              "contentEn": "When there is plenty of something, the next unit is cheap. When it starts running low, that very same unit becomes expensive. The thing did not change, the state of scarcity changed.\n\n<strong>A real-life example:</strong> Think about a phone battery. At 100 percent, there is no second thought before using it, the next percent is worth nothing. But at 8 percent with no charger in sight, that same percent becomes precious: you dim the screen, close apps, guard every drop. The \"value per percent\" did not change physically, only the scarcity did. That is marginal utility in action.\n\nNow apply this to oil. Normally the world has a comfortable cushion of oil, so the next barrel is relatively cheap, we are on the \"abundant\" part of the curve. But the moment Hormuz, the tap supplying a fifth of the oil, was threatened with closure, the cushion suddenly looked thin. Not a single barrel was actually lost, but the world moved from \"abundance\" toward \"scarcity.\" And near scarcity, the value of every remaining barrel, the marginal barrel, soars. <strong>A threat to a fifth did not lower the value by a fifth, it pushed oil up the cliff of marginal utility.</strong>\n\nAnd why does this raise the price of all the oil, not only the part at risk? Because all oil is a substitute for the rest, and the market price is set by the marginal barrel. When the marginal barrel gets more expensive, every barrel gets more expensive with it.",
              "image": "images/bonus/economics/dialog2-explanation.webp"
            },
            {
              "type": "depth",
              "title": "העומק שמאחורי הרעיון",
              "titleEn": "The depth behind the idea",
              "content": "כאן מסתתר ההסבר העמוק לאלימות של מחירי סחורות. הביקוש לנפט קשיח, אי אפשר פשוט להפסיק לנסוע לעבודה או לחמם את הבית. אז כשההיצע מתהדק ולו במעט סביב השוליים, המחיר חייב לזוז הרבה כדי לאזן את השוק. איום קטן בכמות, תזוזה ענקית במחיר. זו לא הגזמה של השוק, זו המתמטיקה של השוליים.\n\nוזה משלים את סמית מדיאלוג 1. סמית הסביר שהמחיר גילם את הפחד. ג'בונס מסביר למה הפחד תורגם למספר כל כך גדול: כי קרוב לנדירות, התועלת השולית יושבת על צוק. הפחד דחף את הנפט אל שפת הצוק, והשוליות עשתה את השאר.\n\nויש כאן זרע לשאלה הבאה. אם הערך הוא סובייקטיבי, רק מה שמישהו מוכן לשלם, האם בכלל קיים מחיר \"יקר מדי\" או \"לא הוגן\"? ג'בונס היה אומר לא, אין מחיר אובייקטיבי, יש רק מה שמשלמים. אקווינס, בדיאלוג הבא, יחלוק על כך נחרצות.",
              "contentEn": "Here lies the deep explanation for the violence of commodity prices. Demand for oil is rigid, you cannot simply stop driving to work or heating your home. So when supply tightens even slightly around the margin, the price has to move a great deal to balance the market. A small threat to quantity, a huge move in price. <strong>This is not the market overreacting, it is the mathematics of the margin.</strong>\n\nAnd this completes Smith from Dialogue 1. Smith explained that the price embodied the fear. Jevons explains why the fear translated into such a large number: because near scarcity, marginal utility sits on a cliff. The fear pushed oil to the edge of the cliff, and marginality did the rest.\n\nAnd here is a seed for the next question. If value is subjective, only what someone is willing to pay, is there even such a thing as a price that is \"too high\" or \"unfair\"? Jevons would say no, there is no objective price, there is only what people pay. Aquinas, in the next dialogue, will firmly disagree.",
              "image": "images/bonus/economics/dialog2-depth.webp"
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "שני חברים מתווכחים. האחד אומר: \"הגיוני שמחיר הנפט יעלה בערך בחמישית, כי חמישית ממנו אוימה.\" לפי ג'בונס, היכן הוא טועה?",
              "questionEn": "Two friends are arguing. One says: \"It makes sense that the oil price would rise by about a fifth, since a fifth of it was threatened.\" According to Jevons, where is he wrong?",
              "options": [
                "הוא צודק לגמרי, איום על חמישית מהנפט מעלה את המחיר בדיוק בחמישית",
                "הערך נקבע בשוליים, ולכן איום קטן מקפיץ את המחיר הרבה מעבר לחלקו",
                "הוא טועה, כי בפועל אבדה הרבה יותר מחמישית מהנפט במשבר"
              ],
              "optionsEn": [
                "He is entirely right, a threat to a fifth of the oil raises the price by exactly a fifth",
                "Value is set at the margin, so a small threat sends the price far beyond its share",
                "He is wrong, because in practice far more than a fifth of the oil was lost in the crisis"
              ],
              "correctIndex": 1,
              "explanation": "האינטואיציה הליניארית (חמישית סיכון, חמישית עלייה) מפספסת את כל הרעיון. הערך נקבע אצל היחידה השולית, ושם הוא רגיש לנדירות. איום קטן דוחף את הנפט במעלה המצוק, והמחיר זז הרבה מעבר לגודל האיום.",
              "explanationEn": "The linear intuition (a fifth at risk, a fifth rise) misses the whole idea. Value is set at the marginal unit, and there it is sensitive to scarcity. A small threat pushes oil up the cliff, and the price moves far beyond the size of the threat."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "אדם נתקע במדבר עם עשר כוסות מים. את הראשונה ישתה מיד, ובעשירית כנראה ירחץ פנים. אם תיוותר לו רק כוס אחת, מה יקרה לערך שהוא מייחס לה?",
              "questionEn": "A person is stranded in the desert with ten cups of water. The first they drink at once, and with the tenth they would probably wash their face. If only one cup remained, what would happen to the value they place on it?",
              "options": [
                "הוא יישאר זהה, כי מים הם מים בכל כמות שנותרה",
                "הוא יירד, כי נשאר לו פחות מים ליהנות מהם",
                "הוא יזנק, כי היחידה האחרונה היקרה ביותר בשיא הנדירות"
              ],
              "optionsEn": [
                "It would stay the same, since water is water in any remaining amount",
                "It would drop, since there is less water left for them to enjoy",
                "It would soar, as the last unit is the most precious at peak scarcity"
              ],
              "correctIndex": 2,
              "explanation": "זה בדיוק העיקרון. ערך אינו תכונה קבועה של המים, אלא יחס שתלוי בכמה נשאר. ככל שמתקרבים לאפס, היחידה הבאה נעשית יקרה יותר. אותו היגיון בדיוק הניע את מחיר הנפט.",
              "explanationEn": "This is exactly the principle. Value is not a fixed property of the water, but a relation that depends on how much is left. The closer to zero, the more precious the next unit becomes. That very logic drove the price of oil."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חברה מתמחרת תיק יד זהה בדיוק לזה של מתחרתה פי עשרה, רק בזכות שם המותג, ואנשים קונים. כיצד היה ג'בונס מסביר זאת?",
              "questionEn": "A company prices a handbag identical to its competitor's at ten times the price, purely on the strength of the brand name, and people buy it. How would Jevons explain this?",
              "options": [
                "המחיר שגוי ומנופח, שהרי הערך האמיתי הוא עלות הייצור",
                "הערך הוא יחס בין הקונה לחפץ, וזה מה שמוכנים לשלם עכשיו",
                "רק פיקוח ממשלתי יכול לקבוע את הערך הנכון של התיק"
              ],
              "optionsEn": [
                "The price is wrong and inflated, since the true value is the cost of production",
                "Value is a relation between buyer and thing, and this is what they will pay now",
                "Only government oversight can set the correct value of the bag"
              ],
              "correctIndex": 1,
              "explanation": "אין \"ערך אמיתי\" נסתר בתוך החפץ. הערך הוא מה שמישהו מקנה לו. אם הקונה מוכן לשלם פי עשרה בזכות המותג, זה הערך עבורו עכשיו. בדיוק התובנה שאקווינס יתנגד לה בדיאלוג הבא.",
              "explanationEn": "There is no hidden \"true value\" inside the object. Value is what someone assigns to it. If the buyer is willing to pay ten times more for the brand, that is its value to them now. Exactly the insight Aquinas will resist in the next dialogue."
            },
            {
              "type": "quiz_summary"
            }
          ]
        },
        {
          "id": 3,
          "title": "מחיר צודק או ניצול",
          "titleEn": "Just Price or Exploitation",
          "thinker": "תומאס אקווינס",
          "thinkerEn": "Thomas Aquinas",
          "thinkerId": "aquinas",
          "xp": 50,
          "sections": [
            {
              "type": "idea",
              "title": "הרעיון של היום",
              "titleEn": "Today's idea",
              "content": "בדיאלוגים הקודמים ראינו מה השפיע על מחיר הנפט. סמית הסביר למה הוא קפץ, וג'בונס למה כל הנפט התייקר כשרק חלק ממנו אוים. בשני המקרים המחיר יצא רציונלי ויעיל, עשה בדיוק את עבודתו. אבל יש מילה אחת שאיש מהם לא נגע בה: צדק.\n\nבמרץ 2026, נהג שעמד בתחנת דלק שילם הרבה יותר על אותו ליטר בנזין. הדלק לא השתנה. רק המלחמה השתנתה. האם זה מחיר הוגן, או ניצול של מצוקה?\n\n700  שנה לפני שבכלל היה שוק נפט, תומאס אקווינס שאל בדיוק את השאלה הזאת. אקווינס היה נזיר דומיניקני איטלקי במאה ה-13, פילוסוף ותאולוג. הוא לא היה כלכלן, כי הכלכלה כתחום עוד לא נולדה. אבל הוא הניח על השולחן את אחת מהשאלות החדות בכל הכלכלה: האם קיים <strong>\"</strong><strong>מחיר צודק</strong><strong>\"</strong>?\n\nהרעיון שלו: לכל מצרך יש <strong>מחיר טבעי</strong>, מחיר שמשקף את העלות האמיתית של הייצור פלוס רווח סביר. מחיר שמזנק הרבה מעבר לזה רק מפני שלקונה אין ברירה הוא, לדעת אקווינס, חטא. <strong>לא כל מה שחוקי בשוק הוא צודק</strong><strong>.</strong>",
              "contentEn": "In the previous dialogues we saw what shaped the price of oil. Smith explained why it jumped, and Jevons explained why all the oil grew more expensive when only part of it was threatened. Both described a rational price doing its job, and Jevons even declared that there is no such thing as a \"just price,\" only what people are willing to pay. But there is one word they both left out: justice.\n\nIn March 2026, a driver standing at a gas station paid far more for the same liter of fuel. The fuel did not change. Only the war changed. Is that a just price, or exploitation of distress?\n\n700 years before there was even an oil market, Thomas Aquinas asked exactly this question. Aquinas was an Italian Dominican friar in the 13th century, a philosopher and theologian. He was not an economist, because economics as a field had not yet been born. But he put on the table one of the sharpest questions in all of economics: is there such a thing as a <strong>\"just price\"</strong>?\n\nHis idea: every good has a <strong>natural price</strong>, a price that reflects the true cost of production plus a reasonable profit. A price that jumps far beyond that only because the buyer has no choice is, in Aquinas's view, a sin. <strong>Not everything that is legal in the market is just.</strong>",
              "image": "images/bonus/economics/dialog3-idea.webp"
            },
            {
              "type": "source",
              "title": "קטע מקור",
              "titleEn": "Source text",
              "quote": "\"למכור דבר ביותר מערכו, או לקנותו בפחות מערכו, הוא כשלעצמו עוול ובלתי מוסרי.\"",
              "quoteEn": "\"To sell a thing for more than its worth, or to buy it for less than its worth, is in itself unjust and unlawful.\"",
              "attr": "- תומאס אקווינס, \"סומה תאולוגיקה\", חלק שני, שאלה 77, המאה ה-13",
              "attrEn": "- Thomas Aquinas, \"Summa Theologica,\" Second Part of the Second Part, Question 77, 13th century"
            },
            {
              "type": "explanation",
              "title": "הסבר",
              "titleEn": "Explanation",
              "content": "אקווינס לא חשב שמחיר הוא רק עניין של היצע וביקוש. הוא חשב שיש למחיר גם ממד מוסרי. והוא הבחין בין שני מצבים שחשוב לא לבלבל ביניהם.\n\nמצב ראשון, <strong>גלגול עלות לגיטימי</strong><strong>:</strong> אם תחנת הדלק עצמה משלמת יותר לספק, כי מחיר הנפט הסיטונאי עלה, אז המחיר הטבעי באמת עלה. להעביר את העלייה הזו ללקוח זה הוגן. הסוחר לא מרוויח יותר, הוא רק מכסה עלות אמיתית שגדלה.\n\nמצב שני, <strong>ניצול מצוקה</strong><strong>:</strong> אם הסוחר מוסיף עוד ועוד למחיר, לא כי העלות שלו עלתה, אלא כי הוא יודע שבמלחמה אנשים ישלמו כל מחיר על דלק, זה כבר משהו אחר. כאן הוא לא מכסה עלות, הוא גובה פרמיה על הייאוש של הקונה.\n\n<strong>דוגמה מהחיים</strong><strong>:</strong> בזמן חירום, כשהחשמל נופל, מוכר מציע פתאום גנרטור בפי שלושה מהמחיר הרגיל. לא מפני שהגנרטור התייקר אצלו, אלא מפני שהוא יודע שאנשים מבוהלים ישלמו. בארה\"ב יש חוקים נגד \"הפקעת מחירים\" (price gouging) בדיוק בשביל המצב הזה. <strong>אקווינס היה קורא לזה בשמו: חטא</strong><strong>.</strong>\n\nוכאן אקווינס מציב אתגר ישיר לסמית ולג'בונס. הם תיארו מחיר שמתאם היצע וביקוש, וקבעו שאין \"מחיר צודק\", יש רק מה שמשלמים. אקווינס שואל: יפה, אבל כשמשפחה משלמת על דלק כדי להגיע לעבודה ולבית חולים סכום שכמעט אינה יכולה לעמוד בו, האם זה \"תיאום\", או שמישהו פשוט מתעשר על חשבון מצוקה?",
              "contentEn": "Aquinas did not think a price was only a matter of supply and demand. He thought a price also has a moral dimension. And he distinguished between two situations that are important not to confuse.\n\nThe first, <strong>legitimate cost pass-through:</strong> if the gas station itself pays more to its supplier, because the wholesale price of oil rose, then the natural price really did rise. Passing that increase on to the customer is just. The seller does not earn more, he only covers a real cost that grew.\n\nThe second, <strong>exploitation of distress:</strong> if the seller keeps adding more and more to the price, not because his cost rose, but because he knows that in wartime people will pay any price for fuel, that is something else. Here he is not covering a cost, he is charging a premium on the buyer's desperation.\n\n<strong>A real-life example:</strong> during an emergency, when the power goes out, a seller suddenly offers a generator at three times the usual price. Not because the generator got more expensive for him, but because he knows frightened people will pay. In the US there are laws against \"price gouging\" for exactly this situation. <strong>Aquinas would call it by its name: a sin.</strong>\n\nAnd here Aquinas poses a direct challenge to Smith and Jevons. They described a price that coordinates supply and demand, and declared there is no \"just price,\" only what people pay. Aquinas asks: fine, but when a family pays a sum they can barely afford for fuel just to get to work and to the hospital, is that \"coordination,\" or is someone simply growing rich off distress?",
              "image": "images/bonus/economics/dialog3-explanation.webp"
            },
            {
              "type": "depth",
              "title": "העומק שמאחורי הרעיון",
              "titleEn": "The depth behind the idea",
              "content": "כאן מתחבא הוויכוח הגדול. מי שממשיך את הקו של סמית וג'בונס יגן דווקא על המחיר הגבוה. הטענה: מחיר גבוה הוא שמרסן את הצריכה, מפנה את הדלק המועט למי שהכי זקוק לו, ומתמרץ ספקים להזרים עוד. כלומר המחיר הגבוה לא רק \"יקר\", הוא מחלק משאב נדיר בצורה יעילה.\n\nאקווינס היה מקשיב, ועונה במשפט אחד: יעילות אינה צדק. נכון שהמחיר הגבוה יעיל ומסדר את השוק. אבל יעיל וצודק הם לא אותו דבר. אדם שמשלם הון על דלק כי אחרת לא יגיע לעבודה לא באמת \"מסכים\" מרצון חופשי. הסכמה מתוך מצוקה אינה הסכמה אמיתית.\n\nזו בדיוק נקודת המחלוקת שתלווה את שאר הפרק. סמית וג'בונס מסתכלים על המחיר ושואלים \"האם הוא יעיל, נכון לשוק?\". אקווינס מסתכל על אותו מחיר בדיוק ושואל \"האם הוא צודק?\" שתי השאלות לגיטימיות, והן לא תמיד נותנות את אותה תשובה.",
              "contentEn": "Here lies the great debate. Whoever follows the line of Smith and Jevons would actually defend the high price. The claim: a high price restrains consumption, channels the scarce fuel to those who need it most, and incentivizes suppliers to bring more. In other words, the high price is not merely \"expensive,\" it distributes a scarce resource efficiently.\n\nAquinas would listen, and answer in a single sentence: <strong>efficiency is not justice.</strong> True, the high price is efficient and orders the market. But efficient and just are not the same thing. A person who pays a fortune for fuel because otherwise he cannot get to work does not truly \"agree\" out of free will. Agreement out of distress is not real agreement.\n\nThis is exactly the point of contention that will accompany the rest of the chapter. Smith and Jevons look at the price and ask \"is it efficient, is it right for the market?\". Aquinas looks at the very same price and asks \"is it just?\". Both questions are legitimate, and they do not always give the same answer.",
              "image": "images/bonus/economics/dialog3-depth.webp"
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "בזמן המלחמה, שתי תחנות דלק העלו מחירים. תחנה א' העלתה בדיוק בגובה העלייה במחיר הסיטונאי ששילמה לספק. תחנה ב' העלתה הרבה מעבר לכך, כי ידעה שנהגים נואשים ישלמו. כיצד אקווינס היה מבחין בין השתיים?",
              "questionEn": "During the war, two gas stations raised prices. Station A raised it exactly by the increase in the wholesale price it paid its supplier. Station B raised it far beyond that, because it knew desperate drivers would pay. How would Aquinas distinguish between the two?",
              "options": [
                "שתיהן חטאו, כי כל העלאת מחיר בעת מצוקה היא ניצול אסור",
                "תחנה א' רק גלגלה עלות אמיתית שגדלה, ותחנה ב' גבתה פרמיה על הייאוש",
                "שתיהן הוגנות, כי בשוק חופשי כל מחיר מוסכם הוא צודק"
              ],
              "optionsEn": [
                "Both sinned, since any price increase in a time of distress is forbidden exploitation",
                "Station A only passed on a real cost that grew, while Station B charged a premium on desperation",
                "Both are just, since in a free market any agreed price is just"
              ],
              "correctIndex": 1,
              "explanation": "אקווינס לא נגד כל עליית מחיר. גלגול עלות אמיתית הוגן, ניצול הייאוש של הקונה הוא החטא. זה הגבול.",
              "explanationEn": "Aquinas is not against every price increase. Passing on a real cost is just, exploiting the buyer's desperation is the sin. That is the line."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חבר אומר: \"אם המחיר הגבוה גרם לאנשים לחסוך בדלק והביא ספקים להזרים עוד, סימן שהוא צודק.\" כיצד אקווינס היה עונה?",
              "questionEn": "A friend says: \"If the high price made people conserve fuel and brought suppliers to deliver more, that is a sign it is just.\" How would Aquinas respond?",
              "options": [
                "נכון, מחיר שמסדר את השוק ביעילות הוא בהגדרה גם צודק",
                "נכון, אבל רק אם הממשלה אישרה את גובה המחיר מראש",
                "מחיר יכול להיות יעיל ועדיין לא צודק, כי יעילות לא שואלת מי משלם ובאיזה כאב"
              ],
              "optionsEn": [
                "Correct, a price that organizes the market efficiently is by definition also just",
                "Correct, but only if the government approved the price level in advance",
                "A price can be efficient and still not be just, because efficiency does not ask who pays and at what pain"
              ],
              "correctIndex": 2,
              "explanation": "סמית מודד יעילות, אקווינס מודד צדק. מחיר יכול לתאם שוק בצורה מושלמת ובו זמנית למוטט את מי שהכי זקוק לו. אלה שתי שאלות שונות.",
              "explanationEn": "Smith measures efficiency, Aquinas measures justice. A price can coordinate a market perfectly and at the same time crush the one who needs it most. These are two different questions."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חבר טוען: \"אם נהג הסכים מרצונו לשלם את המחיר הגבוה על הדלק, אז המחיר צודק, נקודה.\" מה היה אקווינס עונה?",
              "questionEn": "A friend argues: \"If a driver agreed of his own free will to pay the high price for fuel, then the price is just, period.\" What would Aquinas answer?",
              "options": [
                "נכון, עצם ההסכמה מרצון פותרת את שאלת הצדק",
                "הסכמה מתוך מצוקה אינה בחירה חופשית, אלא כניעה למצב",
                "צדק נקבע רק לפי החוק, לא לפי הסכמת הצדדים"
              ],
              "optionsEn": [
                "Correct, the act of agreeing freely settles the question of justice",
                "Agreement out of distress is not a free choice, but submission to circumstance",
                "Justice is determined only by law, not by the agreement of the parties"
              ],
              "correctIndex": 1,
              "explanation": "אדם שחייב דלק כדי להגיע לבית חולים לא באמת מתמקח. הסכמה תחת לחץ קיומי אינה הסכמה אמיתית, ולכן התשלום עצמו לא הופך את המחיר להוגן.",
              "explanationEn": "A person who needs fuel to get to a hospital is not really bargaining. Agreement under existential pressure is not real agreement, so the payment itself does not make the price just."
            },
            {
              "type": "quiz_summary"
            }
          ]
        },
        {
          "id": 4,
          "title": "מי מתעשר מהמשבר",
          "titleEn": "Who Profits From Crisis",
          "thinker": "דייוויד ריקרדו",
          "thinkerEn": "David Ricardo",
          "thinkerId": "ricardo",
          "xp": 50,
          "sections": [
            {
              "type": "idea",
              "title": "הרעיון של היום",
              "titleEn": "Today's idea",
              "content": "סמית הסביר למה המחיר קפץ. אקווינס שאל אם הוא צודק. עכשיו דייוויד ריקרדו שואל שאלה אחרת לגמרי: כשמחיר הנפט זינק בעשרות אחוזים, כל הכסף הנוסף הזה הלך לאנשהו. מישהו קיבל אותו. מי?\n\nריקרדו, כלכלן בריטי מתחילת המאה ה-19, לימד שכל כלכלה מחלקת את העוגה שלה בין שלושה: מי שבבעלותו קרקע ומשאבים, מי שבבעלותו הון, ומי שעובד. והתובנה החדה ביותר שלו: בעל משאב נדיר יכול להתעשר בלי להרים אצבע, רק מעצם זה שהוא הבעלים ברגע שהמשאב מתייקר. את הרווח הזה הוא כינה רֵנטה.\n\nקרקע הייתה המשאב הנדיר של ימי ריקרדו. הנפט הוא הקרקע של זמננו. כשהמלחמה דחפה את מחיר החבית מכ-72 דולר אל מעל 100, כל מי שכבר היו בבעלותו בארות נפט פעילות הרוויח הון, לא כי שאב יותר או עבד קשה יותר, אלא פשוט כי המחיר עלה. זו רֵנטה ריקרדיאנית טהורה: רווח שנוצר מבעלות, לא ממאמץ.",
              "contentEn": "Smith explained why the price jumped. Aquinas asked whether it was just. Now David Ricardo asks an entirely different question: when the price of oil soared by tens of percent, all that extra money went somewhere. Someone received it. Who?\n\nRicardo, a British economist of the early 19th century, taught that every economy divides its pie among three groups: those who own land and resources, those who own capital, and those who work. And his sharpest insight: the owner of a scarce resource can grow rich <strong>without lifting a finger</strong>, simply by being the owner the moment the resource becomes more valuable. This gain he called <strong>rent</strong>.\n\nLand was the scarce resource of Ricardo's day. Oil is the land of our era. When the war pushed the price of a barrel from around 72 dollars to over 100, anyone who already owned producing oil wells made a fortune, not because they pumped more or worked harder, but simply because the price rose. <strong>This is pure Ricardian rent: profit created by ownership, not by effort.</strong>",
              "image": "images/bonus/economics/dialog4-idea.webp"
            },
            {
              "type": "source",
              "title": "קטע מקור",
              "titleEn": "Source text",
              "quote": "\"תוצרת האדמה, כל מה שנוצר על ידי שילוב של עבודה, מכונות והון, מתחלקת בין שלוש מעמדות בחברה: בעלי האדמה, בעלי ההון, והעובדים. לקבוע את החוקים השולטים בחלוקה הזו היא המשימה העיקרית של הכלכלה הפוליטית.\"",
              "quoteEn": "\"The produce of the earth, all that is derived from its surface by the united application of labour, machinery, and capital, is divided among three classes of the community: the proprietors of land, the owners of capital, and the labourers. To determine the laws which regulate this distribution is the principal problem in Political Economy.\"",
              "attr": "- דייוויד ריקרדו, \"עקרונות הכלכלה הפוליטית והמיסוי\", 1817",
              "attrEn": "- David Ricardo, \"On the Principles of Political Economy and Taxation,\" 1817"
            },
            {
              "type": "explanation",
              "title": "הסבר",
              "titleEn": "Explanation",
              "content": "ריקרדו שם לב לדבר מטריד: בעל הקרקע מתעשר בלי לתרום דבר. ככל שהביקוש למשאב נדיר עולה, מחירו עולה, והבעלים גורף את ההפרש, בלי להוסיף עבודה, סיכון או תוצרת.\n\nדוגמה מהחיים: קח שדה נפט שעולה לו כ-30 דולר להפיק חבית. לפני המלחמה הוא מכר אותה ב-72, רווח של 42 דולר לחבית. בזמן המלחמה אותה חבית בדיוק נמכרה ב-110, רווח של 80 דולר. הבעלים לא עשה שום דבר אחרת: אותן בארות, אותם עובדים, אותו נפט. אבל המלחמה כמעט הכפילה את הרווח שלו על כל חבית. אותם 38 דולר נוספים לא נוצרו ממאמץ, הם נוצרו מהפחד בשוק, ונפלו בחיקו של מי שבמקרה החזיק בנפט באותו רגע.\n\nוזה מחדד את מה שאקווינס הרגיש בדיאלוג 3. המחיר הגבוה לא תגמל עבודה קשה יותר או סיכון גדול יותר, הוא תגמל בעלות בתזמון הנכון. לכן \"רווח בלתי צפוי\" מרגיש שונה מרווח רגיל: הוא לא הורווח, הוא נחת.",
              "contentEn": "Ricardo noticed something troubling: the landowner grows rich without contributing a thing. As demand for a scarce resource rises, its price rises, and the owner pockets the difference, without adding any labor, risk, or output.\n\n<strong>A real-life example:</strong> Take an oil field that costs about 30 dollars to produce a barrel. Before the war it sold that barrel for 72, a profit of 42 dollars per barrel. During the war the very same barrel sold for 110, a profit of 80 dollars. The owner did nothing different: the same wells, the same workers, the same oil. But the war nearly doubled the profit on every barrel. Those extra 38 dollars were not created by effort, they were created by the fear in the market, and they fell to whoever happened to be holding oil at that moment.\n\nAnd this sharpens what Aquinas sensed in Dialogue 3. The high price did not reward harder work or greater risk, it rewarded ownership at the right moment. <strong>That is why a \"windfall\" feels different from ordinary profit: it was not earned through work, it fell into the owner's lap at the right moment.</strong>",
              "image": "images/bonus/economics/dialog4-explanation.webp"
            },
            {
              "type": "depth",
              "title": "העומק שמאחורי הרעיון",
              "titleEn": "The depth behind the idea",
              "content": "כאן התובנה המבנית של ריקרדו. ברגע נתון העוגה קבועה. אז כשבעלי המשאב גורפים פרוסה גדולה יותר (רֵנטה), נשאר פחות לכל השאר. משבר נפט הוא בעצם העברה: הכסף עובר מהצרכנים, ששילמו יותר, אל בעלי הנפט, שגרפו את הרֵנטה. לא נוצר ערך חדש בעולם, הוא רק זז ממקום למקום.\n\nונקודה אחרונה חשובה. הרֵנטה הזו הייתה זמנית, כי הנדירות עצמה הייתה מבוססת פחד, בדיוק כפי שראינו בדיאלוג 1. ברגע שהחשש מהורמוז דעך והמחיר ירד, הרֵנטה התאדתה. כלומר הזינוק יצר גל עתק של עושר לא מורווח, שהופיע ונעלם יחד עם הפאניקה.\n\nריקרדו ענה על חצי מהשאלה: מי הרוויח. החצי השני, מי שילם על הרווח הזה, מחכה לנו בדיאלוג של סן.",
              "contentEn": "Here is Ricardo's structural insight. At any given moment the pie is fixed. So when the resource owners take a larger slice (rent), less remains for everyone else. An oil crisis is essentially a <strong>transfer</strong>: the money moves from consumers, who paid more, to the oil owners, who reaped the rent. No new value was created in the world, it merely moved from one place to another.\n\nAnd one last important point. This rent was temporary, because the scarcity itself was based on fear, exactly as we saw in Dialogue 1. The moment the worry over Hormuz faded and the price fell, the rent evaporated. In other words, the spike created an enormous wave of unearned wealth that appeared and vanished together with the panic.\n\nRicardo answered half the question: who profited. The other half, who paid for that profit, awaits us in the dialogue on Sen.",
              "image": "images/bonus/economics/dialog4-depth.webp"
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חבר אומר: \"יצרני הנפט הרוויחו הון במשבר, סימן שהם עבדו קשה והשקיעו יותר מכולם.\" לפי ריקרדו, היכן הוא טועה?",
              "questionEn": "A friend says: \"The oil producers made a fortune in the crisis, that is a sign they worked hard and invested more than anyone.\" According to Ricardo, where is he wrong?",
              "options": [
                "הוא צודק, רווחי השיא הם פרי המאמץ וההשקעה שלהם",
                "הרווח בא מעצם הבעלות על משאב שהתייקר, לא ממאמץ או השקעה",
                "הוא טועה, כי בפועל הם דווקא ייצרו פחות נפט מהרגיל"
              ],
              "optionsEn": [
                "He is right, the record profits are the fruit of their effort and investment",
                "The profit came from owning a resource that grew dearer, not from effort or investment",
                "He is wrong, because in practice they actually produced less oil than usual"
              ],
              "correctIndex": 1,
              "explanation": "זו הרֵנטה. אותן בארות, אותו נפט, רק מחיר גבוה יותר. הרווח לא בא מעבודה או מסיכון, אלא מעצם ההחזקה במשאב כשהוא התייקר.",
              "explanationEn": "This is rent. The same wells, the same oil, only a higher price. The profit came not from labor or risk, but from merely holding the resource as it grew more expensive."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "בעל מאפייה מעלה מחיר כי הקמח והחשמל התייקרו לו. בעל באר נפט מרוויח יותר כי מחיר הנפט קפץ. במה שונה הרווח של השני מהראשון?",
              "questionEn": "A bakery owner raises prices because his flour and electricity got more expensive. An oil-well owner earns more because the price of oil jumped. How is the second one's profit different from the first?",
              "options": [
                "אין הבדל, שניהם פשוט הגיבו לעליית מחירים בשוק",
                "המאפייה כיסתה עלות שגדלה, ובעל הבאר גרף הפרש בלי שעלותו השתנתה",
                "דווקא הרווח של המאפייה הוא הבעייתי, לא של בעל הבאר"
              ],
              "optionsEn": [
                "There is no difference, both simply responded to rising market prices",
                "The bakery covered a cost that grew, while the well owner reaped a margin without any change in his costs",
                "It is actually the bakery's profit that is the problem, not the well owner's"
              ],
              "correctIndex": 1,
              "explanation": "ההבדל הוא בין כיסוי עלות לבין רֵנטה. אצל המאפייה העלות באמת גדלה. אצל בעל הבאר העלות לא זזה, רק המחיר, וכל ההפרש נפל בחיקו בלי מאמץ.",
              "explanationEn": "The difference is between covering a cost and rent. For the bakery, the cost truly rose. For the well owner, the cost did not move, only the price, so the entire difference fell into his lap without effort."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "שנה אחרי המשבר, מחיר הנפט חזר לרמתו, ורווחי העתק של היצרנים נעלמו. מה זה מלמד על הרֵנטה שגרפו?",
              "questionEn": "A year after the crisis, the price of oil returned to its old level, and the producers' record profits vanished. What does this teach about the rent they reaped?",
              "options": [
                "שהיא הייתה קבועה ובטוחה, כי רֵנטה תמיד נשארת",
                "שהיא נבעה מהפחד הזמני, ולכן דעכה יחד איתו",
                "שהיא עברה אל העובדים בשדות במקום אל הבעלים"
              ],
              "optionsEn": [
                "That it was stable and secure, since rent always remains",
                "That it stemmed from the temporary fear, and so faded along with it",
                "That it passed to the field workers instead of the owners"
              ],
              "correctIndex": 1,
              "explanation": "הרֵנטה כאן נשענה כולה על החשש מהורמוז, לא על מחסור אמיתי. ברגע שהפחד דעך, ההפרש שגרפו הבעלים נעלם איתו. עושר שהופיע ונמוג עם הפאניקה.",
              "explanationEn": "This rent rested entirely on the worry over Hormuz, not on a real shortage. The moment the fear faded, the margin the owners reaped vanished with it. Wealth that appeared and dissolved with the panic."
            },
            {
              "type": "quiz_summary"
            }
          ]
        },
        {
          "id": 5,
          "title": "מי באמת שילם",
          "titleEn": "Who Really Paid",
          "thinker": "אמרטיה סן",
          "thinkerEn": "Amartya Sen",
          "thinkerId": "sen",
          "xp": 50,
          "sections": [
            {
              "type": "idea",
              "title": "הרעיון של היום",
              "titleEn": "Today's idea",
              "content": "ראינו למה המחיר עלה (סמית), למה כל הנפט התייקר (ג'בונס), אם זה צודק (אקווינס), ומי התעשר (ריקרדו). נשארה שאלה אחת, והיא האנושית מכולן: מי באמת שילם?\n\nבנגל, הודו, 1943. ילד בן תשע בשם אמרטיה סן רואה משהו שלא יעזוב אותו לעולם, הרעב הגדול. בין שניים לשלושה מיליון בני אדם מתים מרעב. אבל ההלם של הילד הוא לא רק מהמוות, אלא ממשהו אחר: לא היה מחסור באוכל. הייצור החקלאי באותה שנה היה תקין. היה אוכל, אבל לאנשים לא היה כסף לקנותו. המחירים זינקו, ומיליונים מתו ליד אוכל שעמד באסם.\n\nהילד גדל והפך לכלכלן, וניסח תובנה ששינתה את הכלכלה: רעב אינו תוצאה של חוסר באוכל, אלא של חוסר ביכולת לרכוש אותו.\n\nעכשיו חזור לדיאלוג 1. הנפט מעולם לא נעלם, אף באר לא נסגרה. בדיוק כמו האוכל בבנגל. משבר הנפט של 2026 לא היה מחסור בנפט, הוא היה קריסה ביכולת של חלק מהאנשים להרשות אותו לעצמם. אותו היגיון אכזרי בדיוק.",
              "contentEn": "We saw why the price rose (Smith), why all the oil grew more expensive (Jevons), whether it was just (Aquinas), and who got rich (Ricardo). One question remains, and it is the most human of all: who actually paid?\n\nBengal, India, 1943. A nine-year-old boy named Amartya Sen sees something that will never leave him, the Great Famine. Between two and three million people die of hunger. But the boy's shock is not only from the death, it is from something else: <strong>there was no food shortage.</strong> Agricultural output that year was normal. There was food, but people had no money to buy it. Prices soared, and millions died beside food that sat in storehouses.\n\nThe boy grew up to become an economist, and formulated an insight that changed economics: famine is not the result of a lack of food, but of a lack of the ability to acquire it.\n\nNow go back to Dialogue 1. The oil never vanished, not a single well shut down. Exactly like the food in Bengal. The 2026 oil crisis was not a shortage of oil, <strong>it was a collapse in some people's ability to afford it.</strong> The very same brutal logic.",
              "image": "images/bonus/economics/dialog5-idea.webp"
            },
            {
              "type": "source",
              "title": "קטע מקור",
              "titleEn": "Source text",
              "quote": "\"הפיתוח יכול להיראות כתהליך של הרחבת היכולות של אנשים לחיות חיים שיש להם סיבה לרצות בהם.\"",
              "quoteEn": "\"Development can be seen as a process of expanding the capabilities of people to live lives they have reason to want.\"",
              "attr": "- אמרטיה סן, Development as Freedom, 1999",
              "attrEn": "- Amartya Sen, Development as Freedom, 1999"
            },
            {
              "type": "explanation",
              "title": "הסבר",
              "titleEn": "Explanation",
              "content": "הרעיון המרכזי של סן הוא גישת היכולות: למדוד הצלחה כלכלית לא לפי מה שיש לאדם, אלא לפי מה שהוא יכול לעשות בפועל. הכותרת \"הנפט התייקר ב-49 אחוז\" היא מספר ממוצע אחד, אבל אותה התייקרות עצמה משפיעה אחרת לגמרי על אנשים שונים, והממוצע מסתיר את ההבדל.\n\nדוגמה מהחיים: שתי משפחות משלמות בדיוק את אותו מחיר חדש על דלק. הראשונה, בעלת הכנסה נוחה, סופגת את העלייה, אולי מוותרת על טיול אחד. השנייה, משפחה שחיה ממילא על הקצה, ותלויה ברכב כדי להגיע לעבודה ולמרפאה. אותה התייקרות בדיוק היא \"מטרד קטן\" עבור האחת, ו\"לא מצליחה לסגור את החודש, לא מגיעה לעבודה, מוותרת על התור לרופא\" עבור השנייה. המחיר זהה לשתיהן, אבל הפגיעה ביכולת לחיות שונה לחלוטין.\n\nזה מה שהמספר הכותרתי מחביא. ולכן סן אומר: אל תמדוד את המשבר לפי המחיר הממוצע או לפי ה-GDP. מדוד אותו לפי מה שקרה ליכולת הממשית של אנשים לחיות: להגיע לעבודה, לחמם את הבית, להגיע לטיפול.",
              "contentEn": "Sen's central idea is the <strong>capabilities approach</strong>: to measure economic success not by what a person has, but by what they can actually do. The headline \"oil rose 49 percent\" is a single average number, but that very same increase affects different people completely differently, and the average hides the difference.\n\n<strong>A real-life example:</strong> Two families pay exactly the same new price for fuel. The first, with a comfortable income, absorbs the rise, perhaps gives up one trip. The second, a family already living on the edge, depends on its car to get to work and to the clinic. The same increase is a \"minor annoyance\" for one, and \"can't make the month, can't get to work, gives up the doctor's appointment\" for the other. The price is identical for both, but the harm to their ability to live is completely different.\n\nThis is what the headline number hides. And so Sen says: do not measure the crisis by the average price or by GDP. <strong>Measure it by what happened to people's real ability to live:</strong> to get to work, to heat the home, to reach care.",
              "image": "images/bonus/economics/dialog5-explanation.webp"
            },
            {
              "type": "depth",
              "title": "העומק שמאחורי הרעיון",
              "titleEn": "The depth behind the idea",
              "content": "כאן סן סוגר את כל הפרק. כל ההוגים לפניו הסתכלו על המחיר: סמית למה זז, ג'בונס למה כל כך הרבה, אקווינס אם הוא צודק, ריקרדו מי הרוויח ממנו. סן מסיט את המבט לגמרי: הפסיקו לבהות במחיר, הביטו באנשים. המדד האמיתי של משבר אינו המספר על המסך, אלא האם אנשים עדיין יכולים לחיות חיים שיש להם סיבה לרצות בהם.\n\nויש כאן גם תקווה. סן בדק את מקרי הרעב ההמוני במאה ה-20, וגילה שאף אחד מהם לא קרה במדינה דמוקרטית מתפקדת. במקום שבו אנשים יכולים להשמיע קול ולדרוש מענה, החברה רואה את הנפגעים ופועלת לפני האסון. ההגנה העמוקה ביותר על החלש בזמן משבר אינה מנגנון המחיר, אלא חברה שמסתכלת עליו.\n\nהנפט חזר, המחיר ירד, הרֵנטה התאדתה. אבל עבור המשפחה שבקושי עברה את אותם חודשים, המשבר מעולם לא היה על חבית נפט. הוא היה על השאלה אם היא יכולה להמשיך לחיות את חייה. וזה, אומר סן, המספר היחיד שאי פעם באמת נספר.",
              "contentEn": "Here Sen closes the entire chapter. Every thinker before him looked at the price: Smith at why it moved, Jevons at why so much, Aquinas at whether it was just, Ricardo at who profited from it. Sen shifts the gaze entirely: stop staring at the price, look at the people. <strong>The true measure of a crisis is not the number on the screen, but whether people can still live lives they have reason to want.</strong>\n\nAnd there is hope here too. Sen examined the cases of mass famine in the 20th century, and found that none of them happened in a functioning democracy. Where people can raise their voice and demand a response, society sees those who are harmed and acts before catastrophe. The deepest protection for the vulnerable in a crisis is not the price mechanism, but a society that looks at them.\n\nThe oil returned, the price fell, the rent evaporated. But for the family that barely made it through those months, the crisis was never about a barrel of oil. It was about whether it could go on living its life. And that, Sen says, is the only number that ever truly counted.",
              "image": "images/bonus/economics/dialog5-depth.webp"
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חבר אומר: \"בעצם לא היה משבר נפט אמיתי, כי הנפט המשיך לזרום ואף באר לא נסגרה.\" כיצד היה סן מגיב, על סמך מה שראה בבנגל?",
              "questionEn": "A friend says: \"There was no real oil crisis, because the oil kept flowing and not a single well shut down.\" How would Sen respond, based on what he saw in Bengal?",
              "options": [
                "הוא צודק, אם הנפט לא נעלם אז לא היה משבר אמיתי",
                "משבר אינו רק היעדר המשאב, אלא קריסה ביכולת של אנשים להרשות אותו",
                "הוא צודק, כי משבר נמדד רק לפי כמות המשאב שאבדה"
              ],
              "optionsEn": [
                "He is right, if the oil did not vanish then there was no real crisis",
                "A crisis is not only the absence of the resource, but a collapse in people's ability to afford it",
                "He is right, because a crisis is measured only by how much of the resource was lost"
              ],
              "correctIndex": 1,
              "explanation": "זו תובנת בנגל. שם היה אוכל, ובכל זאת מיליונים מתו כי לא יכלו לקנותו. הנפט ב-2026 לא נעלם, אבל היכולת של חלק מהאנשים להרשות אותו כן קרסה. זה המשבר.",
              "explanationEn": "This is the Bengal insight. There, food existed, yet millions died because they could not buy it. The oil in 2026 did not vanish, but some people's ability to afford it did collapse. That is the crisis."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "שתי משפחות ספגו בדיוק את אותה התייקרות בדלק. אחת בקושי הרגישה, השנייה לא הצליחה לסגור את החודש. מה, לפי סן, צריך למדוד כדי להבין את המשבר?",
              "questionEn": "Two families absorbed exactly the same rise in fuel prices. One barely felt it, the other could not make the month. What, according to Sen, should be measured to understand the crisis?",
              "options": [
                "את המחיר הממוצע, שהיה זהה לשתיהן",
                "את ה-GDP, שמסכם את כל הכלכלה במספר אחד",
                "את היכולת הממשית של כל משפחה לחיות, שנפגעה בצורה שונה"
              ],
              "optionsEn": [
                "The average price, which was identical for both",
                "The GDP, which sums up the whole economy in a single number",
                "Each family's real ability to live, which was harmed differently"
              ],
              "correctIndex": 2,
              "explanation": "זו גישת היכולות. אותו מחיר עצמו משפיע אחרת על אנשים שונים. המספר הממוצע מחביא את הפער, ורק מבט על מה שאנשים יכולים לעשות בפועל חושף מי באמת נפגע.",
              "explanationEn": "This is the capabilities approach. The same price itself affects different people differently. The average number hides the gap, and only looking at what people can actually do reveals who was truly harmed."
            },
            {
              "type": "quiz",
              "intro": "",
              "introEn": "",
              "question": "חבר אומר: \"המחיר ירד בחזרה, אז המשבר נגמר וזהו.\" כיצד היה סן מערער על כך?",
              "questionEn": "A friend says: \"The price came back down, so the crisis is over, end of story.\" How would Sen challenge this?",
              "options": [
                "הוא צודק, ברגע שהמחיר חוזר לקדמותו המשבר נגמר לגמרי",
                "מי שנדחף לחוב או ויתר על צרכים בזמן המשבר נשא נזק שלא נמחק כשהמחיר ירד",
                "הוא צודק, כי כלכלה נמדדת רק לפי מחירים בשוק"
              ],
              "optionsEn": [
                "He is right, the moment the price returns to normal the crisis is completely over",
                "Whoever was pushed into debt or gave up necessities during the crisis bore a harm that was not erased when the price fell",
                "He is right, because an economy is measured only by market prices"
              ],
              "correctIndex": 1,
              "explanation": "בשביל סן המחיר אינו התכלית. משפחה שנכנסה לחוב או ויתרה על טיפול כדי לעבור את החודשים האלה ספגה פגיעה ביכולת לחיות, ופגיעה כזו אינה מתאדה ברגע שהמחיר יורד. המדד האמיתי הוא האנשים, לא המספר.",
              "explanationEn": "For Sen, the price is not the goal. A family that went into debt or gave up care to get through those months suffered harm to its ability to live, and such harm does not evaporate the moment the price drops. The real measure is the people, not the number."
            },
            {
              "type": "quiz_summary"
            }
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'הון ועבודה',
      titleEn: 'Capital and Labor',
      subtitle: 'מי באמת יוצר את הערך?',
      subtitleEn: 'Who really creates value?',
      days: [
        { id: 1, title: 'מהו הון?', titleEn: 'What is Capital?', thinker: 'אדם סמית', thinkerEn: 'Adam Smith', thinkerId: 'smith', xp: 50, sections: [
          {
            type: 'idea',
            title: 'מהו הון?', titleEn: 'What is Capital?',
            content: 'עד עכשיו דיברנו על כלכלה. אבל לא הגדרנו דבר אחד שהוא מרכזי בה: <strong>מהו הון?</strong></p><p>המילה הזו מוטחת בכל מקום. הון פוליטי. הון אנושי. הון עצמי. בנק להון השקעות. ובכל זאת - מה היא בעצם אומרת?</p><p>ב-1776, אדם סמית הציע הגדרה ברורה: <strong>הון הוא כל דבר שאדם משתמש בו כדי לייצר עוד דברים.</strong></p><p>תחשוב על אופה. הקמח שלו - לא הון, הוא חומר גלם. הלחם שלו - לא הון, הוא תוצר. אבל <strong>התנור שלו, החנות שלו, השם הטוב של המאפייה</strong> - אלה הון. הם דברים שהוא משתמש בהם פעם אחר פעם כדי לייצר עוד לחם.</p><p>סמית הגדיר שלושה גורמי ייצור: <strong>קרקע, עבודה, והון.</strong> האדמה שעליה האופה בנה את החנות. העבודה שלו ושל עוזריו. וההון - הכלים שמאפשרים את כל זה.</p><p>זו ההגדרה הקלאסית. <strong>וזה הבסיס לכל הוויכוח שיבוא אחר כך.</strong>',
            contentEn: 'Until now we\'ve been talking about economics. But we haven\'t defined one thing that is central to it: <strong>what is capital?</strong></p><p>The word is thrown around everywhere. Political capital. Human capital. Equity capital. Investment bank. And yet - what does it actually mean?</p><p>In 1776, Adam Smith offered a clear definition: <strong>capital is anything a person uses to produce more things.</strong></p><p>Think of a baker. His flour - not capital, it\'s raw material. His bread - not capital, it\'s the product. But <strong>his oven, his shop, the good reputation of the bakery</strong> - these are capital. They are things he uses again and again to produce more bread.</p><p>Smith defined three factors of production: <strong>land, labor, and capital.</strong> The land on which the baker built his shop. The labor of him and his assistants. And capital - the tools that enable all of it.</p><p>This is the classical definition. <strong>And this is the foundation for every debate that follows.</strong>',
          },
          {
            type: 'source',
            title: 'סמית: ההון', titleEn: 'Smith: Capital',
            quote: '״החלק של מלאי האדם שממנו הוא מצפה לקבל הכנסה - הוא ההון שלו. ההון הוא חלק מן המלאי, אבל המלאי כולל גם דברים שאדם שומר לצריכה ישירה.״',
            quoteEn: '"That part of a man\'s stock from which he expects to derive an income - is his capital. Capital is part of his stock, but stock also includes things a person keeps for direct consumption."',
            attr: 'אדם סמית, *עושר העמים*, ספר שני, פרק 1, 1776',
            attrEn: 'Adam Smith, *The Wealth of Nations*, Book Two, Chapter 1, 1776',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'סמית הבחין בין שני סוגי הון.</p><p><strong>הון קבוע (Fixed Capital):</strong> דברים שנשארים לאורך זמן ומשמשים לייצור. תנור. מכונה. בניין. הם לא נצרכים - הם <strong>מאפשרים צריכה</strong>.</p><p><strong>הון חוזר (Circulating Capital):</strong> דברים שעוברים דרך תהליך הייצור ויוצאים ממנו. חומרי גלם, כסף ששווה לקנות חומרי גלם, סחורות בתהליך. הם <strong>מתחלפים בכל סבב</strong>.</p><p>ההבחנה הזו חשובה כי <strong>הון קבוע דורש השקעה ראשונית גבוהה אבל מחזיר ערך לאורך שנים</strong>. הון חוזר הוא תזרים - נכנס, יוצא, נכנס שוב.</p><p><strong>דוגמה מהחיים:</strong> מסעדה קטנה. <strong>הון קבוע:</strong> המטבח, התנורים, הכיסאות, הציוד. <strong>הון חוזר:</strong> המוצרים שמהם מבשלים, התשלום לעובדים, השכירות החודשית. הראשון יורד בערכו אט-אט. השני מתחלף בכל יום.',
            contentEn: 'Smith distinguished between two types of capital.</p><p><strong>Fixed Capital:</strong> things that remain over time and are used for production. An oven. A machine. A building. They are not consumed - they <strong>enable consumption</strong>.</p><p><strong>Circulating Capital:</strong> things that pass through the production process and exit from it. Raw materials, money used to buy raw materials, goods in process. They <strong>change over with each cycle</strong>.</p><p>This distinction is important because <strong>fixed capital requires high initial investment but returns value over years</strong>. Circulating capital is a flow - in, out, in again.</p><p><strong>A life example:</strong> A small restaurant. <strong>Fixed capital:</strong> the kitchen, the ovens, the chairs, the equipment. <strong>Circulating capital:</strong> the products from which they cook, the wages to workers, the monthly rent. The first depreciates slowly. The second turns over every day.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הגדרה כל כך פשוטה הציבה את כל היסוד שבעקבותיו כתבו ריקרדו, מרקס, ופיקטי. אבל היא גם הסתירה משהו.</p><p><strong>אם הון הוא "דברים שמייצרים עוד דברים" - מאיפה הם באו?</strong></p><p>ריקרדו ענה: הם <strong>באו מעבודה קודמת</strong>. מישהו פעם חפר, ייצר, בנה. <strong>הון הוא בעצם עבודה מוקפאת.</strong></p><p>מרקס לקח את התובנה לקיצון: אם הון הוא רק "עבודה מוקפאת" - <strong>למה בעלי ההון מקבלים רווח על מה שעובדים יצרו?</strong></p><p>זה ויכוח שלא נסגר עד היום.',
            contentEn: 'Such a simple definition laid the foundation for all that Ricardo, Marx, and Piketty would later write. But it also hid something.</p><p><strong>If capital is "things that produce more things" - where did they come from?</strong></p><p>Ricardo answered: they <strong>came from prior labor</strong>. Someone once dug, produced, built. <strong>Capital is in essence frozen labor.</strong></p><p>Marx took the insight to an extreme: if capital is just "frozen labor" - <strong>why do capital owners receive profit on what workers created?</strong></p><p>This is a debate that has not been settled to this day.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "קניתי דירה - עכשיו יש לי הון." האם הוא צודק לפי סמית?',
            questionEn: 'A friend says: "I bought an apartment - now I have capital." Is he right according to Smith?',
            options: [
              'כן - כל נכס שאדם רוכש הוא הון',
              'תלוי - אם הוא גר בה, היא לא הון. אם הוא משכיר אותה, היא כן',
              'לא - דירות לעולם אינן הון, רק כלים תעשייתיים'
            ],
            optionsEn: [
              'Yes - every asset a person acquires is capital',
              'It depends - if he lives in it, it\'s not capital. If he rents it out, it is',
              'No - apartments are never capital, only industrial tools'
            ],
            correctIndex: 1,
            explanation: 'סמית הגדיר הון כדבר שאדם משתמש בו כדי לייצר הכנסה. דירה שאדם גר בה - היא חלק מהמלאי שלו, אבל היא נצרכת (הוא משתמש בה לעצמו). דירה שמושכרת - היא הון, כי היא מייצרת זרם הכנסה. אותו נכס פיזית, אבל סטטוס כלכלי שונה לחלוטין לפי השימוש.',
            explanationEn: 'Smith defined capital as a thing a person uses to produce income. An apartment a person lives in - is part of his stock, but it\'s consumed (he uses it for himself). An apartment that is rented out - is capital, because it produces a stream of income. The same asset physically, but a completely different economic status based on its use.',
          },
          {
            type: 'quiz',
            question: 'בית קפה רוכש מכונת אספרסו ב-50,000 שקלים, וקופסה של פולי קפה ב-200 שקלים. שני הפריטים נדרשים לעסק. איך סמית היה מסווג כל אחד מהם?',
            questionEn: 'A café acquires an espresso machine for 50,000 shekels, and a box of coffee beans for 200 shekels. Both items are required for the business. How would Smith classify each?',
            options: [
              'שניהם הון חוזר - הם משתתפים בייצור',
              'שניהם הון קבוע - הם נדרשים לעסק',
              'המכונה הון קבוע (משמשת לאורך שנים), הפולים הון חוזר (מתחלפים בכל סבב ייצור)'
            ],
            optionsEn: [
              'Both are circulating capital - they participate in production',
              'Both are fixed capital - they are required for the business',
              'The machine is fixed capital (serves for years), the beans are circulating capital (turn over with each production cycle)'
            ],
            correctIndex: 2,
            explanation: 'זו ההבחנה המרכזית של סמית. הון קבוע נשאר במקום - הוא משמש פעם אחר פעם. הון חוזר עובר דרך התהליך ויוצא ממנו. המכונה תעבוד עוד עשור. הפולים ייגמרו השבוע. שני סוגי הון, שני זמני חיים שונים, שני אופני התנהגות פיננסי שונים.',
            explanationEn: 'This is Smith\'s central distinction. Fixed capital stays in place - it serves again and again. Circulating capital passes through the process and exits from it. The machine will work for another decade. The beans will be gone this week. Two types of capital, two different lifespans, two different financial behaviors.',
          },
          {
            type: 'quiz',
            question: 'בעל עסק קטן מתפאר: "השקעתי 200,000 שקלים ועכשיו אני מרוויח 30,000 בחודש." חבר אומר: "מאיפה בא הרווח הזה - מההון שלך או מהעבודה שלך?" איך סמית היה מתחיל לענות?',
            questionEn: 'A small business owner boasts: "I invested 200,000 shekels and now I\'m earning 30,000 a month." A friend asks: "Where does that profit come from - from your capital or from your labor?" How would Smith begin to answer?',
            options: [
              'הרווח כולו מההון - מי שהשקיע מקבל פרס על ההשקעה',
              'הרווח כולו מהעבודה - ההון רק "ישב" שם',
              'ההון מעצמו לא יוצר רווח - הוא רק כלי. השאלה היא איך הון ועבודה משתלבים ליצור ערך'
            ],
            optionsEn: [
              'The profit is all from capital - whoever invested receives a reward for the investment',
              'The profit is all from labor - capital just "sat there"',
              'Capital by itself doesn\'t produce profit - it\'s only a tool. The question is how capital and labor combine to create value'
            ],
            correctIndex: 2,
            explanation: 'סמית פתח את השאלה הזו, אבל לא ענה עליה במלואה. ההון מעצמו לא יוצר רווח - הוא רק כלי, "עבודה מוקפאת" מהעבר. אבל לעובד גם נדרש הון כדי לעבוד. השאלה היא איך לחלק את הערך החדש שנוצר כשהשניים נפגשים. זו השאלה שריקרדו, מרקס ופיקטי יענו עליה בדרכים שונות - ושאנחנו נחקור בדיאלוגים הבאים.',
            explanationEn: 'Smith opened this question, but did not fully answer it. Capital by itself doesn\'t produce profit - it\'s only a tool, "frozen labor" from the past. But a worker also needs capital to work. The question is how to divide the new value created when the two meet. This is the question Ricardo, Marx, and Piketty will answer in different ways - and that we will explore in the coming dialogues.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 2, title: 'חוק התפוקה הפוחתת', titleEn: 'The Law of Diminishing Returns', thinker: 'דייוויד ריקרדו', thinkerEn: 'David Ricardo', thinkerId: 'ricardo', xp: 50, sections: [
          {
            type: 'idea',
            title: 'חוק התפוקה הפוחתת', titleEn: 'The Law of Diminishing Returns',
            content: 'תחשוב על שדה. חקלאי אחד עובד עליו, ומגדל 100 קילו חיטה.</p><p>הוא רוצה להגדיל את התפוקה. הוא מצרף עובד שני. <strong>בלי לשנות את גודל השדה.</strong> התפוקה עולה - אבל לא ל-200 קילו. נגיד, ל-180.</p><p>הוא מוסיף עובד שלישי. עכשיו הם מגדלים 240 קילו. הוא מוסיף רביעי - מגיעים ל-280. חמישי - 300.</p><p><strong>מה קורה כאן?</strong> כל עובד נוסף מוסיף <strong>פחות תפוקה</strong> מהקודם.</p><p>זה לא בגלל שהעובד החמישי "פחות חרוץ". זה בגלל שהשדה לא גמיש. <strong>אותו שדה. יותר אנשים. פחות מקום לעבוד.</strong></p><p>ב-1817, <strong>דייוויד ריקרדו</strong> ניסח את העיקרון הזה: <strong>חוק התפוקה השולית הפוחתת.</strong> הוא הראה שזה לא רק חוק חקלאי - זה חוק כלכלי אוניברסלי.',
            contentEn: 'Think of a field. One farmer works it, and grows 100 kilos of wheat.</p><p>He wants to increase production. He adds a second worker. <strong>Without changing the size of the field.</strong> Production rises - but not to 200 kilos. Let\'s say, to 180.</p><p>He adds a third worker. Now they grow 240 kilos. He adds a fourth - they reach 280. A fifth - 300.</p><p><strong>What\'s happening here?</strong> Each additional worker adds <strong>less production</strong> than the previous one.</p><p>It\'s not because the fifth worker is "less diligent." It\'s because the field isn\'t flexible. <strong>The same field. More people. Less room to work.</strong></p><p>In 1817, <strong>David Ricardo</strong> formulated this principle: <strong>the law of diminishing marginal returns.</strong> He showed that this is not just an agricultural law - it\'s a universal economic law.',
          },
          {
            type: 'source',
            title: 'ריקרדו: חוק התפוקה הפוחתת', titleEn: 'Ricardo: The Law of Diminishing Returns',
            quote: '״כשמוסיפים יותר ויותר עבודה לאותה כמות של אדמה - היחידה הנוספת של עבודה תוסיף פחות תפוקה מהקודמת. זה החוק הבלתי נמנע של הייצור.״',
            quoteEn: '"As more and more labor is added to the same quantity of land - the additional unit of labor will add less production than the previous one. This is the inevitable law of production."',
            attr: 'דייוויד ריקרדו, *עקרונות הכלכלה הפוליטית והמיסוי*, 1817',
            attrEn: 'David Ricardo, *Principles of Political Economy and Taxation*, 1817',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'ריקרדו זיהה שהחוק הזה פועל בכל מקום שבו <strong>גורם ייצור אחד קבוע</strong> ואחרים גדלים.</p><p><strong>בחקלאות:</strong> השדה קבוע, אבל מוסיפים עובדים → תפוקה שולית פוחתת.</p><p><strong>במפעל:</strong> המכונה קבועה, אבל מוסיפים עובדים → תפוקה שולית פוחתת.</p><p><strong>במשרד:</strong> המשרד קבוע, אבל מוסיפים עובדים → תפוקה שולית פוחתת (פקקים אצל המדפסת, ישיבות שבאות זו אחר זו).</p><p><strong>דוגמה מהחיים:</strong> מסעדה עם 10 שולחנות. עובד אחד - יעיל מאוד, מטפל בכולם. שני עובדים - עוד יותר טוב. שלושה - מצוין. עשרה - הם פשוט מסתבכים אחד עם השני. <strong>התפוקה השולית של העובד העשירי קרובה לאפס, אולי שלילית.</strong></p><p>זה חוק שמסביר למה אי אפשר "פשוט להוסיף עוד עובדים" כדי להגדיל ייצור. <strong>בלי להגדיל גם את ההון או את הקרקע - הוספת עובדים מגיעה לתקרה.</strong>',
            contentEn: 'Ricardo identified that this law operates anywhere that <strong>one factor of production is fixed</strong> and the others grow.</p><p><strong>In agriculture:</strong> the field is fixed, but workers are added → diminishing marginal returns.</p><p><strong>In a factory:</strong> the machine is fixed, but workers are added → diminishing marginal returns.</p><p><strong>In an office:</strong> the office is fixed, but workers are added → diminishing marginal returns (queues at the printer, back-to-back meetings).</p><p><strong>A life example:</strong> A restaurant with 10 tables. One worker - very efficient, handles them all. Two workers - even better. Three - excellent. Ten - they just get in each other\'s way. <strong>The marginal productivity of the tenth worker is close to zero, perhaps negative.</strong></p><p>This is a law that explains why you can\'t "just add more workers" to increase production. <strong>Without also increasing capital or land - adding workers hits a ceiling.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'ריקרדו הוציא את התובנה הזו מתחום החקלאות והפך אותה לעיקרון אוניברסלי. ומכאן הוא הסיק מסקנה דרמטית: <strong>לכלכלות יש גבול טבעי לצמיחה.</strong></p><p>האדמה הפורייה ביותר תתפס ראשונה. אחר כך יעבדו את האדמה הפחות פורייה. אחר כך את הירודה ביותר. <strong>כל יחידה נוספת תפיק פחות.</strong></p><p>לכן, טען ריקרדו, <strong>שכר העובדים יישאר נמוך לנצח.</strong> ככל שהאוכלוסייה גדלה ויותר עובדים נכנסים לשוק, הם יידרשו לעבוד באדמות פחות פוריות, ובסופו של דבר ירוויחו רק מספיק לחיות.</p><p>זה היה חזון פסימי שעיצב את הכלכלה במשך 100 שנה. המהפכה התעשייתית, ובהמשך החקלאית, הפריכה את התחזית הקודרת. אבל החוק עצמו - <strong>התפוקה השולית הפוחתת</strong> - נשאר תקף עד היום.',
            contentEn: 'Ricardo took this insight out of the agricultural domain and turned it into a universal principle. From this he drew a dramatic conclusion: <strong>economies have a natural limit to growth.</strong></p><p>The most fertile land will be claimed first. Then the less fertile land will be worked. Then the most inferior. <strong>Each additional unit will produce less.</strong></p><p>Therefore, Ricardo argued, <strong>workers\' wages will remain low forever.</strong> As the population grows and more workers enter the market, they will be required to work on less fertile lands, and ultimately will earn just enough to live.</p><p>This was a pessimistic vision that shaped economics for 100 years. The industrial revolution, and later the agricultural revolution, refuted the gloomy forecast. But the law itself - <strong>diminishing marginal returns</strong> - remained valid to this day.',
          },
          {
            type: 'quiz',
            question: 'מסעדה צריכה להגדיל את הייצור שלה. הבעלים שוקלים: להוסיף עוד מלצרים או להגדיל את גודל המסעדה. לפי ריקרדו, מתי הוספת עוד מלצרים בלי הגדלת המסעדה תפסיק להיות יעילה?',
            questionEn: 'A restaurant needs to increase its production. The owners consider: add more waiters or expand the size of the restaurant. According to Ricardo, when will adding more waiters without expanding the restaurant stop being efficient?',
            options: [
              'אף פעם - תמיד יותר עובדים = יותר ייצור',
              'כשהמלצרים מתחילים להפריע אחד לשני ולא מצליחים לטפל ביותר שולחנות',
              'רק כשהמלצרים נהיים עייפים'
            ],
            optionsEn: [
              'Never - more workers always = more production',
              'When the waiters start getting in each other\'s way and fail to handle more tables',
              'Only when the waiters get tired'
            ],
            correctIndex: 1,
            explanation: 'זו ההמחשה של חוק התפוקה הפוחתת. כל גורם ייצור קבוע (כאן: גודל המסעדה ומספר השולחנות) יוצר גבול עליון לתפוקה. המלצר העשירי לא פחות חרוץ מהראשון - אבל אין לו מקום פיזי לעבוד. הוא חוסם מסדרון, מחכה למטבח, מתחרה על אותו לקוח. התפוקה השולית שלו נמוכה כי השדה שלו "מלא".',
            explanationEn: 'This is the illustration of the law of diminishing returns. Every fixed factor of production (here: the size of the restaurant and the number of tables) creates an upper ceiling on production. The tenth waiter isn\'t less diligent than the first - but he has no physical space to work. He blocks a corridor, waits at the kitchen, competes for the same customer. His marginal productivity is low because his "field" is full.',
          },
          {
            type: 'quiz',
            question: 'חברת היי-טק רוצה להכפיל את התפוקה שלה. היא מחליטה להכפיל את מספר המהנדסים - אבל לא להגדיל את המשרד, להוסיף מחשבים, או לעדכן ציוד. לפי ריקרדו, מה יקרה?',
            questionEn: 'A tech company wants to double its production. It decides to double the number of engineers - but not to expand the office, add computers, or update equipment. According to Ricardo, what will happen?',
            options: [
              'התפוקה לא תוכפל - בלי להגדיל גם את שאר גורמי הייצור, הוספת עובדים מגיעה לתקרה',
              'התפוקה תוכפל - יותר מהנדסים = יותר עבודה',
              'התפוקה תרד - מהנדסים נוספים רק מבלבלים אחד את השני'
            ],
            optionsEn: [
              'Production won\'t double - without also increasing the other factors of production, adding workers hits a ceiling',
              'Production will double - more engineers = more work',
              'Production will fall - additional engineers just confuse each other'
            ],
            correctIndex: 0,
            explanation: 'זו ההשלכה המרכזית של החוק. כדי להגדיל באמת את התפוקה, צריך להגדיל את כל גורמי הייצור - לא רק את העבודה. אם החברה רק מוסיפה מהנדסים בלי להגדיל את התשתית, הם יידחקו בחללים קטנים, יחכו למחשבים, יתחרו על אותם המשאבים. התפוקה תעלה - אבל פחות ממה שמצופה. זו תובנה שמסבירה למה חברות שמכפילות צוות לא מכפילות תוצאות.',
            explanationEn: 'This is the central implication of the law. To really increase production, you need to increase all factors of production - not just labor. If the company only adds engineers without expanding infrastructure, they\'ll be crammed into small spaces, wait for computers, compete over the same resources. Production will rise - but less than expected. This is an insight that explains why companies that double their team don\'t double their results.',
          },
          {
            type: 'quiz',
            question: 'ריקרדו האמין ששכר העובדים יישאר נמוך לנצח. במאה ה-20, השכר הריאלי עלה פי כמה. איך נסביר את ההפרכה הזו?',
            questionEn: 'Ricardo believed that workers\' wages would remain low forever. In the 20th century, real wages rose several times over. How do we explain this refutation?',
            options: [
              'ריקרדו פשוט טעה - חוק התפוקה הפוחתת לא נכון',
              'החוק עצמו נכון, אבל הוא הניח שגורמי הייצור (הון וטכנולוגיה) קבועים - והם לא נשארו קבועים',
              'השכר עלה למרות החוק - בגלל איגודי עובדים בלבד'
            ],
            optionsEn: [
              'Ricardo was simply wrong - the law of diminishing returns isn\'t true',
              'The law itself is correct, but he assumed that the factors of production (capital and technology) were fixed - and they didn\'t stay fixed',
              'Wages rose despite the law - only because of labor unions'
            ],
            correctIndex: 1,
            explanation: 'ריקרדו הניח שהקרקע וההון לא ישתנו. הוא לא יכול היה לחזות שהמהפכה התעשייתית תכפיל ותשלש את התפוקה לעובד. הטכנולוגיה החליפה גורמי ייצור קודמים - טרקטור החליף עשרה אנשים בשדה, מכונה החליפה תופרת. התפוקה השולית הפוחתת עדיין פועלת, אבל היא פועלת ביחס לגורמים החדשים. כשטכנולוגיה משתפרת, כל החוק "מתחדש" עם בסיס גבוה יותר.',
            explanationEn: 'Ricardo assumed that land and capital wouldn\'t change. He couldn\'t have predicted that the industrial revolution would double and triple production per worker. Technology replaced previous factors of production - a tractor replaced ten people in the field, a machine replaced a seamstress. Diminishing marginal returns still operates, but it operates relative to the new factors. When technology improves, the entire law "renews itself" with a higher base.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 3, title: 'חלוקת ההכנסות', titleEn: 'The Distribution of Income', thinker: 'דייוויד ריקרדו', thinkerEn: 'David Ricardo', thinkerId: 'ricardo', xp: 50, sections: [
          {
            type: 'idea',
            title: 'חלוקת ההכנסות', titleEn: 'The Distribution of Income',
            content: 'בדיאלוג הקודם ראינו את ריקרדו מסביר איך הייצור עובד. עכשיו נראה את התובנה השנייה והנוקבת שלו: <strong>מה קורה לערך שנוצר.</strong></p><p>ריקרדו זיהה שכל כלכלה נחלקת ל<strong>שלוש קבוצות</strong> שמקבלות חלק מהעוגה:</p><p><strong>בעלי קרקעות</strong> - מקבלים שכר דירה (Rent).</p><p><strong>בעלי הון</strong> - מקבלים רווח (Profit).</p><p><strong>עובדים</strong> - מקבלים שכר (Wages).</p><p>הוויכוח הכלכלי כולו - מאז ריקרדו ועד היום - הוא על <strong>איך העוגה הזו מתחלקת</strong>.</p><p>ריקרדו ראה משהו מטריד: <strong>שלוש הקבוצות בסתירה מובנית.</strong> כשבעלי הקרקע מקבלים יותר - נשאר פחות לבעלי ההון ולעובדים. כשבעלי ההון מקבלים יותר - נשאר פחות לעובדים.</p><p><strong>זה לא ויכוח על "מי טוב יותר".</strong> זה ויכוח מבני, מתמטי. <strong>כשמישהו מקבל יותר, מישהו אחר מקבל פחות.</strong>',
            contentEn: 'In the previous dialogue we saw Ricardo explain how production works. Now we\'ll see his second and sharper insight: <strong>what happens to the value that is created.</strong></p><p>Ricardo identified that every economy is divided into <strong>three groups</strong> that receive a share of the pie:</p><p><strong>Landowners</strong> - receive rent.</p><p><strong>Capital owners</strong> - receive profit.</p><p><strong>Workers</strong> - receive wages.</p><p>The entire economic debate - from Ricardo until today - is about <strong>how this pie is divided</strong>.</p><p>Ricardo saw something disturbing: <strong>the three groups are in inherent contradiction.</strong> When landowners receive more - less remains for capital owners and workers. When capital owners receive more - less remains for workers.</p><p><strong>This isn\'t a debate about "who is better."</strong> It\'s a structural, mathematical debate. <strong>When someone gets more, someone else gets less.</strong>',
          },
          {
            type: 'source',
            title: 'ריקרדו: בעיית החלוקה', titleEn: 'Ricardo: The Distribution Problem',
            quote: '״תוצרת האדמה - כל מה שנוצר על ידי שילוב של עבודה, מכונות והון - מתחלקת בין שלוש מעמדות בחברה: בעלי האדמה, בעלי ההון, והעובדים. לקבוע את החוקים השולטים בחלוקה הזו - היא המשימה העיקרית של הכלכלה הפוליטית.״',
            quoteEn: '"The produce of the earth - all that is created by the combined application of labor, machinery, and capital - is divided among three classes of the community: the proprietors of the land, the owners of capital, and the laborers. To determine the laws which regulate this distribution - is the principal problem of Political Economy."',
            attr: 'דייוויד ריקרדו, *עקרונות הכלכלה הפוליטית והמיסוי*, 1817',
            attrEn: 'David Ricardo, *Principles of Political Economy and Taxation*, 1817',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'ריקרדו זיהה שלכל קבוצה יש מנגנון משלה לקביעת ההכנסה:</p><p><strong>שכר דירה (לבעלי קרקע):</strong> ככל שהאדמה הטובה ביותר נתפסת, החקלאים חייבים לעבוד באדמה גרועה יותר. הם משלמים יותר ויותר על האדמה הטובה. <strong>בעלי הקרקע מתעשרים בלי לעשות דבר.</strong></p><p><strong>שכר (לעובדים):</strong> ככל שהאוכלוסייה גדלה, יש יותר עובדים שמתחרים על אותן משרות. השכר נוטה לרדת לרמה מינימלית - <strong>רק מה שצריך כדי לחיות.</strong></p><p><strong>רווח (לבעלי הון):</strong> מה שנשאר. וזה הולך וקטן.</p><p><strong>דוגמה מהחיים:</strong> בעיר היום. הדירות יקרות (שכר דירה גבוה לבעלי נדל"ן). השכר של עובדים שכירים לא עולה כמו שצריך. ובעלי עסקים מתלוננים על "שולי רווח מצומצמים". <strong>שלוש הקבוצות באמת בסתירה - בדיוק כפי שריקרדו אמר.</strong>',
            contentEn: 'Ricardo identified that each group has its own mechanism for determining income:</p><p><strong>Rent (for landowners):</strong> As the best land is taken, farmers must work on worse land. They pay more and more for the good land. <strong>Landowners get rich without doing anything.</strong></p><p><strong>Wages (for workers):</strong> As the population grows, there are more workers competing for the same jobs. Wages tend to fall to a minimal level - <strong>only what is needed to live.</strong></p><p><strong>Profit (for capital owners):</strong> What\'s left. And it keeps shrinking.</p><p><strong>A life example:</strong> In a city today. Apartments are expensive (high rent for property owners). The wages of salaried workers don\'t rise as they should. And business owners complain about "narrow profit margins." <strong>The three groups really are in contradiction - exactly as Ricardo said.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'זו הייתה הפעם הראשונה שכלכלן ניסח את <strong>בעיית החלוקה</strong> באופן מפורש: לא רק "איך מייצרים?", אלא <strong>"מי מקבל מה?"</strong></p><p>המסקנה של ריקרדו הייתה דרמטית. <strong>הקפיטליזם, אם משאירים אותו לבד, יסיים בכך שבעלי הקרקעות יקבלו את כל העוגה.</strong> הרווח של בעלי ההון ילך וייעלם. הצמיחה תיעצר.</p><p>הפתרון שלו: <strong>סחר חופשי בינלאומי.</strong> ייבוא דגנים זולים יוריד את מחיר המזון, וכך את השכר, וכך יחזיר את הרווח לבעלי ההון.</p><p><strong>הוויכוח על חלוקה - מי מקבל כמה, ולמה - לא נסגר.</strong> הוא רק התעדכן בכל דור.',
            contentEn: 'This was the first time an economist explicitly formulated the <strong>problem of distribution</strong>: not just "how do we produce?", but <strong>"who gets what?"</strong></p><p>Ricardo\'s conclusion was dramatic. <strong>Capitalism, if left alone, will end up with landowners taking the entire pie.</strong> The profit of capital owners will diminish and disappear. Growth will halt.</p><p>His solution: <strong>free international trade.</strong> Importing cheap grains will lower the price of food, and thus wages, and thus return profit to capital owners.</p><p><strong>The debate over distribution - who gets how much, and why - has not been settled.</strong> It has only been updated in every generation.',
          },
          {
            type: 'quiz',
            question: 'באזור מרכז תל אביב, מחירי הנדל"ן עולים מדי שנה. מי, לפי ריקרדו, מרוויח הכי הרבה מהמצב הזה?',
            questionEn: 'In central Manhattan, real estate prices rise every year. Who, according to Ricardo, profits most from this situation?',
            options: [
              'בעלי העסקים שפועלים באזור - כי המקום פופולרי',
              'העובדים שגרים שם - כי שכרם עולה עם המחירים',
              'בעלי הקרקעות - שמתעשרים בלי לעשות דבר'
            ],
            optionsEn: [
              'The business owners operating in the area - because the place is popular',
              'The workers who live there - because their wages rise with the prices',
              'The landowners - who get rich without doing anything'
            ],
            correctIndex: 2,
            explanation: 'זו ההמחשה הטהורה של הרעיון של ריקרדו. בעלי קרקעות מרוויחים מעצם הבעלות שלהם - לא מעבודה, לא מהשקעה, לא מסיכון. ככל שהאזור מתפתח, הקרקע שלהם עולה בערכה. הם לא הוסיפו דבר - אבל הם מקבלים את החלק הגדול ביותר מההצלחה הכלכלית של האזור. זו הסתירה המבנית שריקרדו זיהה: מי שיש לו קרקע, מרוויח מהפיתוח של אחרים.',
            explanationEn: 'This is the pure illustration of Ricardo\'s idea. Landowners profit from their very ownership - not from labor, not from investment, not from risk. As the area develops, their land rises in value. They added nothing - but they receive the largest share of the area\'s economic success. This is the structural contradiction Ricardo identified: those who own land profit from the development of others.',
          },
          {
            type: 'quiz',
            question: 'מדינה מנסה לפתור את משבר הדיור על ידי בנייה מסיבית של דירות במחיר נמוך. בעלי דירות קיימים מתנגדים בתוקף. למה, לפי הניתוח של ריקרדו?',
            questionEn: 'A country tries to solve the housing crisis by mass-building apartments at low prices. Existing apartment owners strongly oppose. Why, according to Ricardo\'s analysis?',
            options: [
              'כי בעלי הדירות הם אנשים רעים שרוצים שיהיה חוסר',
              'כי הצעת דיור גדולה תוריד את שכר הדירה - וכך תקטין את הרווח של בעלי הנדל"ן הקיימים',
              'כי הם מודאגים מהאיכות של הדירות החדשות'
            ],
            optionsEn: [
              'Because apartment owners are bad people who want there to be shortage',
              'Because a large supply of housing will lower rent - and thus reduce the profit of existing real estate owners',
              'Because they are concerned about the quality of the new apartments'
            ],
            correctIndex: 1,
            explanation: 'ריקרדו הסביר שבעלי קרקעות מרוויחים בדיוק כי יש מחסור באדמה טובה. אם המחסור נעלם - הם מאבדים את הכוח שלהם. זו הסיבה האמיתית לקרבות פוליטיים סביב נדל"ן. זה לא "אנשים רעים" - זו לוגיקה כלכלית טהורה. בעלי נכסים קיימים נהנים מעלייה במחירים. הם יתנגדו לכל מהלך שיוריד אותם.',
            explanationEn: 'Ricardo explained that landowners profit precisely because there is shortage of good land. If the shortage disappears - they lose their power. This is the real reason for political battles around real estate. It\'s not "bad people" - it\'s pure economic logic. Existing property owners benefit from rising prices. They will oppose any move that lowers them.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "ריקרדו תיאר את הכלכלה של 1817 - חקלאית, אנגלית, מוקדמת. זה לא רלוונטי היום." האם הוא צודק?',
            questionEn: 'A friend says: "Ricardo described the economy of 1817 - agricultural, English, early. It\'s not relevant today." Is he right?',
            options: [
              'כן - ריקרדו תיאר עולם שלא קיים יותר',
              'לא - הסתירה שזיהה (בין בעלי קרקע, בעלי הון ועובדים) מתחדשת בכל דור עם שחקנים שונים',
              'חצי-חצי - חלק מהרעיונות שלו עדיין נכונים, חלק לא'
            ],
            optionsEn: [
              'Yes - Ricardo described a world that no longer exists',
              'No - the contradiction he identified (between landowners, capital owners and workers) renews itself in every generation with different players',
              'Half and half - some of his ideas are still correct, some are not'
            ],
            correctIndex: 1,
            explanation: 'השמות השתנו, אבל הסתירה נשארה. בעלי קרקעות של 1817 = בעלי נדל"ן ופלטפורמות דיגיטליות של היום. בעלי הון של 1817 = בעלי מניות וקרנות הון של היום. עובדים של 1817 = עובדים שכירים של היום. המאבק על חלוקת העוגה לא נעצר - הוא רק עבר לזירות חדשות. סטרטאפים נאבקים בענקיות טק. מי שיש לו דירה נאבק במי שאין לו. זה ריקרדו, חי ב-2025.',
            explanationEn: 'The names changed, but the contradiction remained. Landowners of 1817 = real estate and digital platform owners of today. Capital owners of 1817 = shareholders and capital funds of today. Workers of 1817 = salaried workers of today. The struggle over the division of the pie hasn\'t stopped - it has only moved to new arenas. Startups battle tech giants. Those who own an apartment battle those who don\'t. This is Ricardo, alive in 2025.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 4, title: 'מבנה ההון', titleEn: 'The Structure of Capital', thinker: 'קרל מרקס', thinkerEn: 'Karl Marx', thinkerId: 'marx', xp: 50, sections: [
          {
            type: 'idea',
            title: 'מבנה ההון', titleEn: 'The Structure of Capital',
            content: 'ראינו את ריקרדו מציג את שלוש המעמדות ואת הסתירה ביניהם. מרקס לקח את הניתוח הזה והעמיק אותו: <strong>הוא הסיר את "בעלי הקרקעות" מהסיפור.</strong></p><p>מרקס טען שב-1860, הסיפור האמיתי כבר אינו על קרקע. הוא על <strong>הון תעשייתי</strong>. ובמלחמה החדשה, יש רק <strong>שני שחקנים</strong>:</p><p><strong>בעלי ההון</strong> (בורגנות) - בעלי המפעלים, המכונות, ההון.</p><p><strong>פועלים</strong> (פרולטריון) - בעלי כוח-עבודה בלבד.</p><p>זה לא ויכוח על "כמה כל אחד מקבל". זה ויכוח על <strong>המבנה כולו</strong>.</p><p><strong>מה זה אומר שמישהו הוא "בעל הון"?</strong> זה אומר שיש לו אמצעי ייצור - מפעל, מכונה, אדמה. <strong>מה זה אומר שמישהו "פועל"?</strong> שאין לו אמצעי ייצור - רק הזמן והמרץ של גופו.</p><p><strong>ההון לא רק "מצטבר".</strong> הוא <strong>משכפל את עצמו.</strong> מי שיש לו - הולך ויש לו יותר. מי שאין לו - הולך ואין לו כלל.',
            contentEn: 'We saw Ricardo present the three classes and the contradiction between them. Marx took this analysis and deepened it: <strong>he removed "landowners" from the story.</strong></p><p>Marx argued that by 1860, the real story was no longer about land. It was about <strong>industrial capital</strong>. And in the new war, there are only <strong>two players</strong>:</p><p><strong>Capital owners</strong> (bourgeoisie) - owners of factories, machines, capital.</p><p><strong>Workers</strong> (proletariat) - owners of labor-power alone.</p><p>This isn\'t a debate about "how much each gets." It\'s a debate about <strong>the entire structure</strong>.</p><p><strong>What does it mean to be a "capital owner"?</strong> It means you have means of production - a factory, a machine, land. <strong>What does it mean to be a "worker"?</strong> That you have no means of production - only the time and energy of your body.</p><p><strong>Capital doesn\'t just "accumulate."</strong> It <strong>reproduces itself.</strong> Those who have - keep getting more. Those who don\'t - keep having less.',
          },
          {
            type: 'source',
            title: 'מרקס: ההון כיחס חברתי', titleEn: 'Marx: Capital as Social Relation',
            quote: '״ההון אינו אדם, ואינו חפץ. הוא יחס חברתי בין אנשים, יחס הנקבע באמצעות חפצים. ההון יכול להתקיים רק במצב שבו רוב האנשים אינם מחזיקים באמצעי הייצור, ומוכרחים למכור את כוח-עבודתם.״',
            quoteEn: '"Capital is not a person, nor a thing. It is a social relation between people, a relation established through things. Capital can exist only in a state where most people do not hold means of production, and are compelled to sell their labor-power."',
            attr: 'קרל מרקס, *הקפיטל*, כרך ראשון, 1867',
            attrEn: 'Karl Marx, *Capital*, Volume One, 1867',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'מרקס זיהה שלושה מאפיינים של מבנה ההון:</p><p><strong>ראשון - ריכוזיות.</strong> ההון נוטה להצטבר אצל מעטים. מפעל גדול בולע מפעלים קטנים. בנק גדול בולע בנקים קטנים. <strong>התחרות עצמה גורמת לרכוז.</strong> מי שמייצר זול יותר - מנצח. וגדל. ובולע את הקטנים.</p><p><strong>שני - שעתוק.</strong> ההון משכפל את עצמו לאורך דורות. בעל הון מוריש לילדיו. הם מתחילים את החיים עם נכסים. הם משקיעים, מקבלים תשואה, ומורישים לילדיהם. <strong>המעמד נשמר על פני דורות.</strong> מי שנולד פועל - סביר שגם ילדיו יהיו פועלים.</p><p><strong>שלישי - תלות.</strong> הפועל "חופשי" לעזוב את העבודה. אבל לאן ילך? <strong>כדי לחיות, הוא חייב למכור את עבודתו למישהו שיש לו הון.</strong> "החופש" שלו הוא חופש לבחור איזה בעל-הון יעסיק אותו.</p><p><strong>דוגמה מהחיים:</strong> עובד בשכר מינימום באמזון. הוא "חופשי לעזוב" - אבל אם יעזוב, הוא יחפש עבודה ב-Walmart, ב-FedEx, או בחברה אחרת. <strong>בכל מקום, הוא יעמוד באותו מצב מבני.</strong> אין לו אופציה אמיתית להיות "לא-פועל".',
            contentEn: 'Marx identified three characteristics of the structure of capital:</p><p><strong>First - concentration.</strong> Capital tends to accumulate in the hands of the few. A large factory swallows small factories. A large bank swallows small banks. <strong>Competition itself causes concentration.</strong> Whoever produces more cheaply - wins. And grows. And swallows the small ones.</p><p><strong>Second - reproduction.</strong> Capital reproduces itself across generations. A capital owner bequeaths to his children. They start life with assets. They invest, receive returns, and bequeath to their children. <strong>The class is preserved across generations.</strong> Whoever is born a worker - likely their children will be workers too.</p><p><strong>Third - dependence.</strong> The worker is "free" to leave the job. But where will he go? <strong>To live, he must sell his labor to someone who has capital.</strong> His "freedom" is the freedom to choose which capital owner will employ him.</p><p><strong>A life example:</strong> A minimum-wage worker at Amazon. He is "free to leave" - but if he leaves, he\'ll look for work at Walmart, FedEx, or another company. <strong>Everywhere, he\'ll be in the same structural situation.</strong> He has no real option to be "not-a-worker."',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'מרקס לא תיאר אנשים - הוא תיאר <strong>מערכת</strong>.</p><p><strong>הקפיטליסט אינו "אדם רע".</strong> הוא פועל בלוגיקה של המערכת - אם לא יבלע מתחרים, יבלעו אותו. <strong>הפועל אינו "טיפש".</strong> הוא נולד בלי הון, ולכן ימות בלי הון.</p><p>זו הייתה הביקורת הגדולה של מרקס: <strong>המערכת אינה תוצאה של בחירות אישיות.</strong> היא תוצאה של מבנה. ולכן אי אפשר לפתור את הבעיה ברמת היחיד - רק ברמת המבנה.</p><p>גם אם רוב הכלכלנים היום דוחים את הפתרון של מרקס, <strong>הניתוח המבני שלו עדיין מטריד.</strong> למה אי-שוויון לא נסגר עם הקפיטליזם? למה מי שנולד עני, נשאר עני? <strong>פיקטי, בדיאלוג הבא, ייתן לנו תשובה אמפירית.</strong>',
            contentEn: 'Marx didn\'t describe people - he described a <strong>system</strong>.</p><p><strong>The capitalist isn\'t a "bad person."</strong> He acts within the logic of the system - if he doesn\'t swallow competitors, they will swallow him. <strong>The worker isn\'t "stupid."</strong> He was born without capital, and so he will die without capital.</p><p>This was Marx\'s great critique: <strong>the system isn\'t the result of individual choices.</strong> It\'s the result of structure. And therefore the problem can\'t be solved at the individual level - only at the structural level.</p><p>Even if most economists today reject Marx\'s solution, <strong>his structural analysis is still troubling.</strong> Why hasn\'t inequality been resolved with capitalism? Why does someone born poor stay poor? <strong>Piketty, in the next dialogue, will give us an empirical answer.</strong>',
          },
          {
            type: 'quiz',
            question: 'אדם נולד למשפחה ענייה, מנסה כל חייו להתקדם, אבל בקושי מצליח להחזיק את עצמו. החברה אומרת: "הוא לא ניסה מספיק. אם רק היה עובד קשה יותר, היה מצליח." איך מרקס היה מגיב?',
            questionEn: 'A person is born to a poor family, tries his whole life to advance, but barely manages to support himself. Society says: "He didn\'t try hard enough. If only he had worked harder, he would have succeeded." How would Marx respond?',
            options: [
              'החברה צודקת - בקפיטליזם, כל אחד יכול לעלות במעמד',
              'הסיפור האישי לא רלוונטי - המבנה הוא שמכתיב את התוצאה, לא הבחירות',
              'הוא היה מסכים - אם האדם היה משקיע יותר, היה מצליח'
            ],
            optionsEn: [
              'Society is right - in capitalism, anyone can rise in class',
              'The personal story isn\'t relevant - structure dictates the outcome, not choices',
              'He would agree - if the person had invested more, he would have succeeded'
            ],
            correctIndex: 1,
            explanation: 'זו ליבת הניתוח של מרקס. המערכת אינה תוצאה של בחירות אישיות. מי שנולד בלי הון מתחיל את חייו במצב מבני שונה לחלוטין ממי שנולד עם הון. הוא חייב למכור את עבודתו, הוא לא יכול להשקיע, ילדיו יירשו את אותו מצב. "לעבוד קשה" לא משנה את המבנה - זה רק ממקסם בתוך גבולותיו.',
            explanationEn: 'This is the heart of Marx\'s analysis. The system isn\'t the result of individual choices. Whoever is born without capital begins life in a completely different structural situation than someone born with capital. He must sell his labor, he cannot invest, his children will inherit the same situation. "Working hard" doesn\'t change the structure - it only maximizes within its boundaries.',
          },
          {
            type: 'quiz',
            question: 'חברת ענק רוכשת סטרטאפ קטן ומבטיחה: "אנחנו תומכים בעסקים קטנים, אנחנו רק רוצים לעזור להם לגדול." איך מרקס היה מסביר את התופעה?',
            questionEn: 'A mega-corporation acquires a small startup and promises: "We support small businesses, we just want to help them grow." How would Marx explain the phenomenon?',
            options: [
              'החברה אכן רוצה לעזור - זה עוזר לכל הכלכלה',
              'זה ניצול אישי של בעלי החברה הגדולה',
              'זה ביטוי של חוק הריכוזיות - ההון נוטה להתרכז במעטים, גם בלי "כוונות רעות"'
            ],
            optionsEn: [
              'The company really wants to help - it helps the whole economy',
              'It\'s personal exploitation by the owners of the large company',
              'It\'s an expression of the law of concentration - capital tends to concentrate in the few, even without "bad intentions"'
            ],
            correctIndex: 2,
            explanation: 'מרקס היה אומר: לא משנה מה כוונות בעלי החברה. המערכת בנויה כך שמי שגדול יבלע את הקטנים. התחרות עצמה דוחפת לכך - חברה גדולה יכולה לקנות זול יותר, להעסיק יותר, להשפיע יותר על השוק. התוצאה זהה גם אם הכוונות טהורות. זו לוגיקה מבנית, לא בחירה מוסרית.',
            explanationEn: 'Marx would say: It doesn\'t matter what the intentions of the company\'s owners are. The system is built so that the big swallow the small. Competition itself pushes toward this - a large company can buy more cheaply, employ more, influence the market more. The result is the same even if intentions are pure. This is structural logic, not a moral choice.',
          },
          {
            type: 'quiz',
            question: 'חבר טוען: "מרקס צדק לגבי הקפיטליזם במאה ה-19, אבל היום בעולם הסטרטאפים, כל אחד יכול לפתוח חברה ולהתעשר." איך מרקס היה עונה?',
            questionEn: 'A friend argues: "Marx was right about 19th-century capitalism, but today in the world of startups, anyone can open a company and get rich." How would Marx respond?',
            options: [
              'הוא היה מסכים - הקפיטליזם המודרני שונה לגמרי',
              'הוא היה שואל: כמה אנשים באמת מתעשרים? וכמה נשארים לעבוד שכר מינימום?',
              'הוא היה מבטל את הטענה - לא ניתן לפתוח חברה בלי הון מראש'
            ],
            optionsEn: [
              'He would agree - modern capitalism is completely different',
              'He would ask: how many people really get rich? And how many remain working minimum wage?',
              'He would dismiss the claim - you cannot open a company without capital in advance'
            ],
            correctIndex: 1,
            explanation: 'מרקס לא היה מכחיש שיש "סיפורי הצלחה". אבל הוא היה מתעקש על המבנה, לא על החריגים. אכן, מעטים יוצאי דופן מצליחים לעלות. אבל הרוב נשאר במקום. עולם הסטרטאפים יוצר כמה מיליארדרים - והרבה פועלים. אמזון יצרה את ג\'ף בזוס. אבל היא יצרה מיליון עובדי מחסן בשכר מינימום. הסיפור של המעטים לא מבטל את המבנה.',
            explanationEn: 'Marx wouldn\'t deny that there are "success stories." But he would insist on the structure, not the exceptions. Indeed, few exceptional individuals manage to rise. But the majority remains in place. The startup world creates a few billionaires - and many workers. Amazon created Jeff Bezos. But it created a million minimum-wage warehouse workers. The story of the few doesn\'t negate the structure.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 5, title: 'r > g', titleEn: 'r > g', thinker: 'תומאס פיקטי', thinkerEn: 'Thomas Piketty', thinkerId: 'piketty', xp: 50, sections: [
          {
            type: 'idea',
            title: 'r > g', titleEn: 'r > g',
            content: 'ב-2013, כלכלן צרפתי בשם <strong>תומאס פיקטי</strong> פרסם ספר של 700 עמודים בשם <em>"ההון במאה ה-21"</em>. הוא הפך לרב-מכר עולמי. למה?</p><p>כי הוא עשה משהו שאף כלכלן לא עשה לפניו: <strong>הוא מדד את ההון.</strong> במשך 15 שנה אסף נתוני מיסים ועושר מ-30 מדינות, על פני 300 שנה.</p><p>ומצא תבנית אחת, שמופיעה שוב ושוב, כמעט בכל מקום: <strong>r > g.</strong></p><p><strong>r</strong> = שיעור התשואה על הון. כמה הון מרוויח לבעליו (השכרת דירות, השקעה במניות, ריביות).</p><p><strong>g</strong> = שיעור הצמיחה של הכלכלה כולה - כמה הכלכלה גדלה משנה לשנה.</p><p>ובמשך 300 שנה, <strong>r תמיד היה גדול מ-g.</strong> ההון תמיד צמח מהר יותר מהכלכלה.</p><p>המסקנה: <strong>אם יש לך הון - אתה מתעשר. אם אתה רק עובד - אתה נשאר מאחור.</strong> וזה לא במקרה - זו הלוגיקה המתמטית של הקפיטליזם.',
            contentEn: 'In 2013, a French economist named <strong>Thomas Piketty</strong> published a 700-page book titled <em>"Capital in the Twenty-First Century."</em> It became a global bestseller. Why?</p><p>Because he did something no economist had done before: <strong>he measured capital.</strong> Over 15 years he collected tax and wealth data from 30 countries, over 300 years.</p><p>And found one pattern, appearing again and again, almost everywhere: <strong>r > g.</strong></p><p><strong>r</strong> = the rate of return on capital. How much capital earns for its owner (rental income, stock investments, interest).</p><p><strong>g</strong> = the growth rate of the entire economy - how much the economy grows year to year.</p><p>And for 300 years, <strong>r was always greater than g.</strong> Capital always grew faster than the economy.</p><p>The conclusion: <strong>if you have capital - you get richer. If you only work - you stay behind.</strong> And this isn\'t by chance - it\'s the mathematical logic of capitalism.',
          },
          {
            type: 'source',
            title: 'פיקטי: r > g', titleEn: 'Piketty: r > g',
            quote: '״כאשר תשואת ההון חורגת באופן מתמשך משיעור הצמיחה של הכלכלה - עושר תורשתי גדל מהר יותר מהתפוקה וההכנסה של החברה. די לבעלי הון לחסוך חלק קטן מתשואותיהם, כדי שההון שלהם יגדל מהר יותר מהכלכלה כולה.״',
            quoteEn: '"When the rate of return on capital significantly exceeds the growth rate of the economy - inherited wealth grows faster than the output and income of society. It suffices for capital holders to save a small portion of their returns for their capital to grow more quickly than the entire economy."',
            attr: 'תומאס פיקטי, *ההון במאה ה-21*, 2013',
            attrEn: 'Thomas Piketty, *Capital in the Twenty-First Century*, 2013',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'הרעיון של פיקטי פשוט, אבל יש לו השלכה דרמטית: <strong>אם יש לך הון, ההון עובד בשבילך. אם אין לך, אתה חייב לעבוד כדי לבנות הון.</strong></p><p>זה לא פילוסופיה - זו מתמטיקה.</p><p><strong>יוסי</strong> הוא עובד שכיר. הוא חוסך 50,000 שקלים בשנה. אחרי 20 שנה - מיליון שקלים. <strong>המיליון הזה הגיע מ-20 שנות עבודה.</strong></p><p><strong>דנה</strong> ירשה מיליון שקלים והשקיעה אותם בנדל"ן ומניות. <strong>המיליון של דנה - הון שמייצר עוד הון.</strong></p><p>עוברות 20 שנה. <strong>יוסי</strong> ממשיך לעבוד, ומגיע ל-2 מיליון. <strong>דנה</strong> לא עבדה - אבל ההון שלה גדל ב-7% בשנה, והיא עומדת על 4 מיליון.</p><p><strong>שניהם התחילו עם מיליון. אבל יוסי עבד 20 שנה כדי להכפיל. דנה לא עשתה כלום - והכפילה פי 4.</strong></p><p>זה לא בגלל ש"דנה חכמה יותר". זו פשוט המתמטיקה של <strong>r > g</strong>: <strong>תשואת ההון (7%) גבוהה מקצב הצמיחה של השכר (3%).</strong>',
            contentEn: 'Piketty\'s idea is simple, but it has a dramatic implication: <strong>if you have capital, capital works for you. If you don\'t, you must work to build capital.</strong></p><p>This isn\'t philosophy - it\'s mathematics.</p><p><strong>Yossi</strong> is a salaried employee. He saves 50,000 shekels a year. After 20 years - one million shekels. <strong>That million came from 20 years of work.</strong></p><p><strong>Dana</strong> inherited one million shekels and invested them in real estate and stocks. <strong>Dana\'s million - capital that produces more capital.</strong></p><p>Twenty years pass. <strong>Yossi</strong> keeps working, reaches 2 million. <strong>Dana</strong> didn\'t work - but her capital grew at 7% per year, and she stands at 4 million.</p><p><strong>Both started with a million. But Yossi worked 20 years to double it. Dana did nothing - and quadrupled it.</strong></p><p>This isn\'t because "Dana is smarter." It\'s simply the mathematics of <strong>r > g</strong>: <strong>the rate of return on capital (7%) is higher than the rate of wage growth (3%).</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'פיקטי הציג משהו שמרקס רק חזה: <strong>אי-שוויון אינו מקרי. הוא מבני.</strong></p><p>אבל פיקטי הוסיף שתי תובנות חדשות.</p><p><strong>ראשית, הוא הראה שזה לא תמיד היה כך.</strong> במאה ה-20, בין שתי מלחמות העולם, אי-שוויון ירד דרמטית. למה? <strong>כי שתי מלחמות עולם, מהפכה, ומיסים גבוהים על עשירים הרסו את ההון של העשירים.</strong> המאה ה-20 הייתה חריגה - לא הנורמה ההיסטורית.</p><p><strong>שנית, הוא הראה שזה לא חייב להישאר ככה.</strong> אם חברה מטילה מיסים גבוהים על העשירים, או משקיעה יותר בחינוך כללי, היא יכולה לעכב את r. <strong>r > g אינו גזירת גורל - הוא תוצאה של בחירות פוליטיות.</strong></p><p>הספר של פיקטי שינה את השיח. <strong>כל אחד שמדבר היום על "אי-שוויון" או על "פער שכר" - מצטט אותו, גם אם לא יודע זאת.</strong>',
            contentEn: 'Piketty presented something that Marx only foresaw: <strong>inequality isn\'t accidental. It\'s structural.</strong></p><p>But Piketty added two new insights.</p><p><strong>First, he showed it wasn\'t always like this.</strong> In the 20th century, between the two world wars, inequality dropped dramatically. Why? <strong>Because two world wars, revolution, and high taxes on the rich destroyed the capital of the wealthy.</strong> The 20th century was the exception - not the historical norm.</p><p><strong>Second, he showed it doesn\'t have to stay this way.</strong> If a society imposes high taxes on the wealthy, or invests more in general education, it can slow r. <strong>r > g isn\'t an act of fate - it\'s the result of political choices.</strong></p><p>Piketty\'s book changed the conversation. <strong>Anyone today who talks about "inequality" or "the wage gap" - quotes him, even if they don\'t know it.</strong>',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "אם אתה רוצה להתעשר, פשוט תעבוד קשה יותר ותחסוך יותר." איך פיקטי היה מערער על זה?',
            questionEn: 'A friend says: "If you want to get rich, just work harder and save more." How would Piketty challenge this?',
            options: [
              'הוא היה מסכים - חסכון הוא הדרך היחידה',
              'הוא היה מראה שלאורך זמן, מי שיש לו הון מתחיל לייצר הון מעצמו - לעובד אין דרך לדבוק בקצב הזה',
              'הוא היה אומר שעבודה היא חסרת תועלת לחלוטין'
            ],
            optionsEn: [
              'He would agree - saving is the only way',
              'He would show that over time, those who have capital begin to produce capital on their own - a worker has no way to keep up with that pace',
              'He would say that work is completely useless'
            ],
            correctIndex: 1,
            explanation: 'זו הליבה של r > g. חסכון יוצר הון - אבל בקצב איטי. העובד חוסך מהשכר, ולכן ההון שלו צומח בקצב של g. אבל מי שכבר יש לו הון - צובר אותו בקצב של r, גבוה יותר. התוצאה: גם אם העובד חוסך 30% מהכנסתו, הוא לא יצליח לעקוף את מי שכבר יש לו הון. זה לא עניין של חריצות - זה מתמטי.',
            explanationEn: 'This is the core of r > g. Saving creates capital - but at a slow pace. The worker saves from his wage, so his capital grows at the rate of g. But those who already have capital - accumulate it at the rate of r, which is higher. The result: even if the worker saves 30% of his income, he won\'t manage to overtake those who already have capital. This isn\'t a matter of diligence - it\'s mathematical.',
          },
          {
            type: 'quiz',
            question: 'באיזו תקופה היסטורית, לפי פיקטי, אי-שוויון ירד באופן חריג?',
            questionEn: 'In which historical period, according to Piketty, did inequality drop exceptionally?',
            options: [
              'בעידן הקפיטליזם המוקדם - המאה ה-18',
              'במאה ה-19 - בזכות המהפכה התעשייתית',
              'במאה ה-20 - בין שתי מלחמות העולם'
            ],
            optionsEn: [
              'In early capitalism - the 18th century',
              'In the 19th century - thanks to the industrial revolution',
              'In the 20th century - between the two world wars'
            ],
            correctIndex: 2,
            explanation: 'זו אחת התובנות הכי חשובות של פיקטי - המאה ה-20 הייתה חריגה, לא הכלל. שתי מלחמות עולם הרסו הון פיזית. מהפכות (סובייטית, סינית) הלאימו הון. מיסים שהגיעו ל-90% על העשירים מימנו את שיקום אירופה. אחרי המלחמות, אי-שוויון התחיל לעלות שוב - וכיום הוא חוזר לרמות של 1900. מה שאנחנו תופסים כ"נורמלי" (שכר ביניים, מעמד ביניים יציב), היה תקופה חריגה ולא הכלל ההיסטורי.',
            explanationEn: 'This is one of Piketty\'s most important insights - the 20th century was an exception, not the rule. Two world wars destroyed capital physically. Revolutions (Soviet, Chinese) nationalized capital. Taxes that reached 90% on the wealthy financed Europe\'s reconstruction. After the wars, inequality began to rise again - and today it\'s returning to 1900 levels. What we perceive as "normal" (middle-class wages, a stable middle class), was an exceptional period, not the historical rule.',
          },
          {
            type: 'quiz',
            question: 'חבר טוען: "אי-שוויון הוא טבעי. תמיד יהיה - אין מה לעשות נגד זה." איך פיקטי היה מערער על זה?',
            questionEn: 'A friend argues: "Inequality is natural. It will always exist - there\'s nothing to do about it." How would Piketty challenge this?',
            options: [
              'הוא היה מסכים - באמת אי אפשר לעשות שום דבר',
              'הוא היה מראה שהמאה ה-20 הוכיחה שאי-שוויון יכול לרדת - דרך מיסים, חינוך, ובחירות פוליטיות',
              'הוא היה אומר שאי-שוויון הוא בעיה רק אם הוא רוצה להיות בעיה'
            ],
            optionsEn: [
              'He would agree - really nothing can be done',
              'He would show that the 20th century proved inequality can decline - through taxes, education, and political choices',
              'He would say that inequality is only a problem if it wants to be a problem'
            ],
            correctIndex: 1,
            explanation: 'זו הליבה של פיקטי. r > g אינו חוק טבע - הוא תוצאה של מבנה כלכלי שניתן לשנות. במאה ה-20, אי-שוויון ירד בזכות מיסים גבוהים על העשירים, השקעה מסיבית בחינוך ציבורי, ומדיניות רווחה. פיקטי לא טוען שאי-שוויון נעלם לבד - הוא טוען שצריך בחירות פוליטיות פעילות כדי לעכב אותו. האדישות היא הבחירה שמאפשרת לאי-שוויון לצמוח.',
            explanationEn: 'This is the heart of Piketty. r > g isn\'t a law of nature - it\'s the result of an economic structure that can be changed. In the 20th century, inequality declined thanks to high taxes on the wealthy, massive investment in public education, and welfare policy. Piketty doesn\'t claim that inequality disappears on its own - he claims that active political choices are needed to slow it down. Indifference is the choice that allows inequality to grow.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 6, title: 'סיכום: הון ועבודה', titleEn: 'Summary: Capital and Labor', thinker: 'סיכום פרק', thinkerEn: 'Chapter Summary', thinkerId: null, xp: 50, isSummary: true, sections: [
          {
            type: 'idea',
            title: 'סיכום: הון ועבודה', titleEn: 'Summary: Capital and Labor',
            content: 'התחלנו את הפרק בשאלה: <strong>מי באמת יוצר את הערך - בעל ההון או העובד?</strong></p><p>עכשיו, אחרי חמישה דיאלוגים, אנחנו רואים שזו לא רק שאלה כלכלית. <strong>זו שאלה על איך החברה מתפקדת - ועל מי באמת מרוויח מהמערכת.</strong>',
            contentEn: 'We began the chapter with a question: <strong>who really creates value - the capital owner or the worker?</strong></p><p>Now, after five dialogues, we see that this isn\'t just an economic question. <strong>It\'s a question about how society functions - and about who really profits from the system.</strong>',
          },
          {
            type: 'source',
            isRecap: true,
            title: 'המסע שעברנו', titleEn: 'The Journey We Traveled',
            quote: '״סמית: הון הוא כלי. ריקרדו: התפוקה השולית פוחתת - ולכן יש סתירה בין הקבוצות. מרקס: ההון משכפל את עצמו, וזו לוגיקה מבנית. פיקטי: r > g - הנתונים מוכיחים.״',
            quoteEn: '"Smith: capital is a tool. Ricardo: marginal productivity diminishes - therefore there is contradiction between groups. Marx: capital reproduces itself, and this is structural logic. Piketty: r > g - the data proves it."',
            attr: 'סיכום פרק 3',
            attrEn: 'Chapter 3 Summary',
            content: '<strong>סמית</strong> הגדיר: הון הוא דברים שאנשים משתמשים בהם כדי לייצר עוד דברים. הוא הון קבוע (מכונות, בניינים) או הון חוזר (חומרי גלם). <strong>הוא בעצם עבודה מוקפאת מן העבר.</strong></p><p><strong>ריקרדו</strong> הראה שני דברים: <strong>חוק התפוקה השולית הפוחתת</strong> (כל עובד נוסף מוסיף פחות), ו<strong>הסתירה המבנית</strong> בין בעלי קרקעות, בעלי הון ועובדים. <strong>כשמישהו מקבל יותר, מישהו אחר מקבל פחות.</strong></p><p><strong>מרקס</strong> העמיק את הניתוח: ההון אינו רק "דבר" - הוא <strong>יחס חברתי</strong>. מי שיש לו אמצעי ייצור, מקבל רווח. מי שאין לו, חייב למכור את עבודתו. <strong>המבנה משכפל את עצמו לאורך דורות.</strong></p><p><strong>פיקטי</strong>, 150 שנה אחרי מרקס, נתן הוכחה אמפירית: על פני 300 שנה, <strong>r > g.</strong> ההון תמיד צמח מהר יותר מהכלכלה. <strong>אי-שוויון אינו מקרי - הוא מבני.</strong>',
            contentEn: '<strong>Smith</strong> defined: capital is things people use to produce more things. It is fixed capital (machines, buildings) or circulating capital (raw materials). <strong>It is essentially frozen labor from the past.</strong></p><p><strong>Ricardo</strong> showed two things: <strong>the law of diminishing marginal returns</strong> (each additional worker adds less), and <strong>the structural contradiction</strong> between landowners, capital owners, and workers. <strong>When someone gets more, someone else gets less.</strong></p><p><strong>Marx</strong> deepened the analysis: capital is not just a "thing" - it is a <strong>social relation</strong>. Those who own means of production receive profit. Those who don\'t, must sell their labor. <strong>The structure reproduces itself across generations.</strong></p><p><strong>Piketty</strong>, 150 years after Marx, provided empirical proof: over 300 years, <strong>r > g.</strong> Capital always grew faster than the economy. <strong>Inequality isn\'t accidental - it\'s structural.</strong>',
          },
          {
            type: 'explanation',
            title: 'מה למדנו בעצם', titleEn: 'What We Actually Learned',
            content: 'הוויכוח על "מי מקבל מה" נראה טכני. אבל הוא לא.</p><p><strong>כל הוגה הציג שלב של אותה בעיה.</strong> סמית הציג את גורמי הייצור. ריקרדו זיהה את הסתירה. מרקס תיאר את המבנה. פיקטי הוכיח את התוצאה.</p><p><strong>יש להם תזה משותפת אחת:</strong> הקפיטליזם, אם משאירים אותו ללא התערבות, מוביל לריכוז הון אצל מעטים. <strong>לא בגלל "אנשים רעים" - בגלל המבנה.</strong></p><p>אבל הם נחלקו על השאלה: <strong>האם זה בסדר?</strong>',
            contentEn: 'The debate over "who gets what" looks technical. But it isn\'t.</p><p><strong>Each thinker presented a stage of the same problem.</strong> Smith presented the factors of production. Ricardo identified the contradiction. Marx described the structure. Piketty proved the outcome.</p><p><strong>They share one common thesis:</strong> capitalism, if left without intervention, leads to the concentration of capital in the hands of the few. <strong>Not because of "bad people" - because of structure.</strong></p><p>But they disagreed on the question: <strong>is this okay?</strong>',
          },
          {
            type: 'depth',
            title: 'השאלה לפרק הבא', titleEn: 'The Question for the Next Chapter',
            content: 'ראינו איך הון ועבודה מתחלקים. ראינו שהחלוקה אינה שווה. <strong>השאלה הבאה היא: האם זה צודק?</strong></p><p>האם אדם שעובד 40 שנה צריך להרוויח פחות מאדם שירש מיליון בגיל 20? האם זו הוגנות? איזו חלוקה תהיה צודקת?</p><p>זו השאלה של פרק 4: <strong>צדק כלכלי.</strong> מאקווינס דרך פארטו ועד רולס - מה הופך חברה לצודקת?',
            contentEn: 'We saw how capital and labor are distributed. We saw that the distribution isn\'t equal. <strong>The next question is: is it just?</strong></p><p>Should a person who works for 40 years earn less than someone who inherited a million at age 20? Is that fair? What distribution would be just?</p><p>This is the question of Chapter 4: <strong>economic justice.</strong> From Aquinas through Pareto to Rawls - what makes a society just?',
          },
          {
            type: 'quiz',
            question: 'מה ראו גם סמית וגם מרקס שערערו עליו השוליסטים בפרק 2?',
            questionEn: 'What did both Smith and Marx believe that the marginalists challenged in Chapter 2?',
            options: [
              'ששלוש קבוצות (קרקע, הון, עבודה) מתחלקות בהכנסה',
              'שערך מגיע מעבודה',
              'שהון מצטבר אצל מעטים'
            ],
            optionsEn: [
              'That three groups (land, capital, labor) divide the income',
              'That value comes from labor',
              'That capital accumulates in the hands of the few'
            ],
            correctIndex: 1,
            explanation: 'גם סמית וגם מרקס האמינו שערך מגיע מעבודה - הם רק נחלקו על מי מקבל אותו. השוליסטים, ב-1871, הראו שערך מגיע מתועלת של הצרכן, לא מעבודה. אבל בפרק 3 ראינו שגם אם תיאוריית ערך-העבודה נפלה - השאלה על חלוקה מבנית עדיין רלוונטית, כפי שפיקטי הוכיח 200 שנה אחרי.',
            explanationEn: 'Both Smith and Marx believed that value comes from labor - they only disagreed about who receives it. The marginalists, in 1871, showed that value comes from the utility of the consumer, not from labor. But in Chapter 3 we saw that even though the labor theory of value fell - the question about structural distribution is still relevant, as Piketty proved 200 years later.',
          },
          {
            type: 'quiz',
            question: 'מרקס ופיקטי הגיעו למסקנה דומה - שההון מתרכז אצל מעטים - אבל בכלים שונים. במה הם נבדלים?',
            questionEn: 'Marx and Piketty reached a similar conclusion - that capital concentrates in the hands of the few - but with different tools. How are they different?',
            options: [
              'מרקס דיבר על מבנה תיאורטי, פיקטי הציג נתונים אמפיריים',
              'הם הגיעו לאותה מסקנה בדיוק אותם כלים',
              'פיקטי הפריך את מרקס לחלוטין'
            ],
            optionsEn: [
              'Marx spoke about a theoretical structure, Piketty presented empirical data',
              'They reached the same conclusion with exactly the same tools',
              'Piketty completely refuted Marx'
            ],
            correctIndex: 0,
            explanation: 'מרקס פיתח תיאוריה מתוך ניתוח לוגי של הקפיטליזם. פיקטי, 150 שנה אחריו, אסף נתונים אמיתיים מ-30 מדינות על פני 300 שנה. הוא לא רק טען - הוא הראה. בגלל זה הספר של פיקטי הצליח לעורר ויכוח גם בקרב מי שדחה את מרקס. קל לדחות תיאוריה. קשה לדחות נתונים.',
            explanationEn: 'Marx developed a theory from a logical analysis of capitalism. Piketty, 150 years later, collected real data from 30 countries over 300 years. He didn\'t just argue - he showed. That\'s why Piketty\'s book managed to spark debate even among those who rejected Marx. It\'s easy to reject a theory. It\'s hard to reject data.',
          },
          {
            type: 'quiz',
            question: 'ריקרדו זיהה סתירה בין שלוש קבוצות - בעלי קרקע, בעלי הון, ועובדים. מרקס פישט את זה לשתי קבוצות בלבד. למה?',
            questionEn: 'Ricardo identified a contradiction between three groups - landowners, capital owners, and workers. Marx simplified it to just two groups. Why?',
            options: [
              'כי מרקס לא הבין את ריקרדו',
              'כי במאה ה-19, ההון התעשייתי הפך משמעותי יותר מהקרקע - והקרקע איבדה את מרכזיותה',
              'כי שתי קבוצות פשוט נשמע יותר טוב'
            ],
            optionsEn: [
              'Because Marx didn\'t understand Ricardo',
              'Because in the 19th century, industrial capital became more significant than land - and land lost its centrality',
              'Because two groups simply sounds better'
            ],
            correctIndex: 1,
            explanation: 'בזמנו של ריקרדו (1817), הקרקע עדיין הייתה גורם ייצור מרכזי - הכלכלה האנגלית הייתה חקלאית בעיקרה. כשמרקס כתב ב-1867, המהפכה התעשייתית כבר שינתה הכל. מפעלים החליפו שדות. הסיפור האמיתי עבר מבעלי קרקעות לבעלי מפעלים.',
            explanationEn: 'In Ricardo\'s time (1817), land was still a central factor of production - the English economy was primarily agricultural. When Marx wrote in 1867, the industrial revolution had already changed everything. Factories replaced fields. The real story moved from landowners to factory owners.',
          },
          { type: 'quiz_summary' },
        ] },
      ],
    },
    {
      id: 4,
      title: 'צדק כלכלי',
      titleEn: 'Economic Justice',
      subtitle: 'מתי חלוקה כלכלית היא צודקת?',
      subtitleEn: 'When is an economic distribution just?',
      days: [
        { id: 1, title: 'המחיר הצודק', titleEn: 'The Just Price', thinker: 'תומאס אקווינס', thinkerEn: 'Thomas Aquinas', thinkerId: 'aquinas', xp: 50, sections: [
          {
            type: 'idea',
            title: 'המחיר הצודק', titleEn: 'The Just Price',
            content: 'נחזור אחורה, הרבה לפני סמית ומרקס, אל <strong>המאה ה-13.</strong></p><p>תומאס אקווינס היה נזיר דומיניקני באיטליה, פילוסוף ותאולוג. הוא לא היה כלכלן, כי הכלכלה כתחום עוד לא הומצאה. אבל הוא שאל את אחת השאלות החשובות ביותר על כלכלה: <strong>האם יש "מחיר צודק"?</strong></p><p>ב-1265 הוא כתב כך. בעולם שהאמין שיש סדר מוסרי לכל דבר, לחיים, למוות, לחתונה, <strong>מדוע נחשוב שלמחיר אין צדק משלו?</strong></p><p>הרעיון שלו: <strong>לכל מוצר יש "מחיר טבעי", מחיר שמשקף את העלות האמיתית של הייצור</strong> (חומרים, עבודה, רווח סביר). מחיר שגבוה מזה הוא <strong>חטא</strong>, ולא בגלל שזה לא חוקי, אלא <strong>כי זה ניצול של אדם שצריך משהו.</strong></p><p>זו הייתה אחת הפעמים הראשונות בהיסטוריה שמישהו אמר: <strong>לא כל מה שחוקי בשוק הוא צודק.</strong>',
            contentEn: 'Let\'s go back, long before Smith and Marx, to the <strong>13th century.</strong></p><p>Thomas Aquinas was a Dominican friar in Italy, a philosopher and theologian. He wasn\'t an economist, because economics as a field hadn\'t yet been invented. But he asked one of the most important questions about economics: <strong>is there a "just price"?</strong></p><p>In 1265 he wrote: in a world that believed there was a moral order to everything, to life, to death, to marriage, <strong>why would we think that price has no justice of its own?</strong></p><p>His idea: <strong>every product has a "natural price," a price that reflects the true cost of production</strong> (materials, labor, reasonable profit). A price higher than that is <strong>a sin</strong>, not because it\'s illegal, but <strong>because it\'s exploitation of a person who needs something.</strong></p><p>This was one of the first times in history that someone said: <strong>not everything legal in the market is just.</strong>',
          },
          {
            type: 'source',
            title: 'אקווינס: המחיר הצודק', titleEn: 'Aquinas: The Just Price',
            quote: '״למכור דבר ביותר מערכו האמיתי הוא חטא, אפילו אם אין חוק שאוסר זאת. שכן הרצון לנצל את צרכיו של חברך אינו ראוי לאדם המוסרי.״',
            quoteEn: '"To sell something for more than its real value is a sin, even if no law forbids it. For the desire to exploit your fellow\'s needs is unworthy of a moral person."',
            attr: 'תומאס אקווינס, *סומה תאולוגיקה*, שאלה 77, 1265',
            attrEn: 'Thomas Aquinas, *Summa Theologica*, Question 77, 1265',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'אקווינס לא חשב שמחיר הוא רק עניין של היצע וביקוש. <strong>הוא חשב שמחיר הוא עניין של מוסר.</strong></p><p>הוא הבחין בין <strong>מחיר רגיל</strong> ל<strong>מחיר שמנצל מצוקה</strong>.</p><p><strong>מחיר רגיל:</strong> אופה במשך שלוש שעות מכין לחם. הוא קונה קמח, חשמל, ומקדיש זמן. הוא מבקש 10 שקלים, סכום שיכסה את העלויות וייתן לו רווח סביר. <strong>זה צודק.</strong></p><p><strong>מחיר שמנצל מצוקה:</strong> באותה שכונה, אחרי מלחמה, אין לחם בשום מקום. אופה אחד שורד. הוא מבקש 50 שקלים על אותו לחם. <strong>הוא יכול. אנשים ישלמו, כי אין ברירה.</strong> אבל לפי אקווינס, <strong>זה חטא.</strong> הוא מנצל את הצורך של החלשים.',
            contentEn: 'Aquinas didn\'t think price was just a matter of supply and demand. <strong>He thought price was a matter of morality.</strong></p><p>He distinguished between <strong>a regular price</strong> and <strong>a price that exploits distress.</strong></p><p><strong>A regular price:</strong> A baker spends three hours making bread. He buys flour, electricity, and dedicates time. He asks for 10 shekels, a sum that covers costs and gives him reasonable profit. <strong>This is just.</strong></p><p><strong>A price that exploits distress:</strong> In that same neighborhood, after a war, there is no bread anywhere. One baker survives. He asks 50 shekels for the same bread. <strong>He can. People will pay, because they have no choice.</strong> But according to Aquinas, <strong>this is a sin.</strong> He is exploiting the need of the weak.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הרעיון של אקווינס נראה מיושן. בעולם של היום, מחיר הוא פשוט מה שצרכן מוכן לשלם וייצרן מוכן לקבל. סמית הראה זאת ב-1776, ג\'בונס ב-1871, מרשל ב-1890.</p><p>אבל אקווינס פתח שאלה שלא נסגרה. <strong>כשהשוק "צודק" טכנית, האם הוא צודק מוסרית?</strong></p><p>חברה שאיפשרה למחירי דירות לזנק פי שלוש בעשור היא חברה צודקת? תרופות שמצילות חיים ועולות מאות אלפי שקלים, צודק? מים שמופרטים במדבר באפריקה ונמכרים במחיר שהמקומיים לא יכולים לשלם, צודק?</p><p>זו השאלה שתלווה אותנו לכל הפרק. <strong>אקווינס פתח אותה לפני 750 שנה, והיא עדיין נשארה פתוחה.</strong>',
            contentEn: 'Aquinas\'s idea seems outdated. In today\'s world, price is simply what a consumer is willing to pay and a producer is willing to receive. Smith showed this in 1776, Jevons in 1871, Marshall in 1890.</p><p>But Aquinas opened a question that has not been closed. <strong>When the market is "just" technically, is it just morally?</strong></p><p>A society that allowed housing prices to triple in a decade is a just society? Life-saving drugs that cost hundreds of thousands of shekels, just? Water that is privatized in the African desert and sold at a price the locals cannot pay, just?</p><p>This is the question that will accompany us throughout the chapter. <strong>Aquinas opened it 750 years ago, and it has remained open.</strong>',
          },
          {
            type: 'quiz',
            question: 'חברת תרופות פיתחה תרופה חיונית להצלת חיים. עלות הייצור היא 100 שקלים לכדור. החברה מוכרת אותו ב-50,000 שקלים, כי חולים שצריכים אותו ישלמו כל מחיר. איך אקווינס היה מגיב?',
            questionEn: 'A pharmaceutical company developed a life-saving drug. The production cost is 100 shekels per pill. The company sells it for 50,000 shekels, because patients who need it will pay any price. How would Aquinas respond?',
            options: [
              'זה צודק, החברה השקיעה בפיתוח ומגיע לה רווח',
              'זה לא צודק, כי החברה מנצלת מצוקה רפואית, גם אם זה חוקי',
              'זה תלוי במחיר המתחרים בשוק'
            ],
            optionsEn: [
              'It\'s just, the company invested in development and deserves profit',
              'It\'s not just, because the company is exploiting medical distress, even if it\'s legal',
              'It depends on the price of competitors in the market'
            ],
            correctIndex: 1,
            explanation: 'זה בדיוק התרחיש שאקווינס דיבר עליו. חברה שדורשת מחיר גבוה רק בגלל שצרכן חייב לקנות מנצלת מצוקה. השאלה אינה אם זה חוקי או רווחי, אלא אם זה הוגן.',
            explanationEn: 'This is exactly the scenario Aquinas spoke about. A company that demands a high price just because the consumer must buy is exploiting distress. The question is not whether it\'s legal or profitable, but whether it\'s fair.',
          },
          {
            type: 'quiz',
            question: 'באיזה משני המצבים אקווינס היה רואה "מחיר צודק"?',
            questionEn: 'In which of the following would Aquinas see "a just price"?',
            options: [
              'אופה שמוכר לחם במחיר שמכסה עלויות פלוס רווח סביר, בלי לנצל מצב מצוקה',
              'שתי דירות זהות באותה שכונה, אחת ב-2 מיליון ואחת ב-4 מיליון',
              'סוחר ששואל "כמה אתה מוכן לשלם?" ומתאים את המחיר לכל לקוח לפי יכולתו'
            ],
            optionsEn: [
              'A baker who sells bread at a price covering costs plus reasonable profit, without exploiting distress',
              'Two identical apartments in the same neighborhood, one at 2 million and one at 4 million',
              'A merchant who asks "how much are you willing to pay?" and adjusts the price for each customer according to their ability'
            ],
            correctIndex: 0,
            explanation: 'המחיר הצודק הוא זה שמשקף את העלות האמיתית של הייצור, ולא את מצב המצוקה של הקונה. אצל אקווינס, ניצול לקוח אינדיבידואלי הוא חמור במיוחד, כי הוא מבוסס על אסימטריית כוח.',
            explanationEn: 'The just price is one that reflects the true cost of production, and not the state of distress of the buyer. For Aquinas, exploitation of an individual customer is especially severe, because it is based on power asymmetry.',
          },
          {
            type: 'quiz',
            question: 'חבר טוען: "אם שני אנשים הסכימו על מחיר מרצונם, אז זה צודק, נקודה." מה היה אקווינס עונה?',
            questionEn: 'A friend argues: "If two people agreed on a price of their own free will, then it\'s just, period." What would Aquinas answer?',
            options: [
              'נכון, הסכמה מרצון פותרת את שאלת הצדק',
              'הסכמה מרצון אינה מספיקה, כי לעיתים אנשים מסכימים רק כי אין להם בחירה',
              'צדק הוא רק עניין של חוק, לא של הסכמה'
            ],
            optionsEn: [
              'Correct, voluntary agreement resolves the question of justice',
              'Voluntary agreement is not enough, because sometimes people agree only because they have no choice',
              'Justice is only a matter of law, not of agreement'
            ],
            correctIndex: 1,
            explanation: 'זו הביקורת המרכזית של אקווינס. אדם שגוסס לא באמת "מסכים" בחופשיות לשלם אלפי שקלים על תרופה. הסכמה במצב של מצוקה אינה הסכמה אמיתית. הוויכוח הזה ילווה את הפרק כולו, ובמיוחד את המחלוקת בין רולס לנוזיק.',
            explanationEn: 'This is the central critique of Aquinas. A dying person doesn\'t really "agree" freely to pay thousands of shekels for a medicine. Agreement under conditions of distress is not real agreement. This debate will accompany the entire chapter, especially the disagreement between Rawls and Nozick.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 2, title: 'יעילות פארטו', titleEn: 'Pareto Efficiency', thinker: 'וילפרדו פארטו', thinkerEn: 'Vilfredo Pareto', thinkerId: 'pareto', xp: 50, sections: [
          {
            type: 'idea',
            title: 'יעילות פארטו', titleEn: 'Pareto Efficiency',
            content: 'אקווינס שאל אם השוק צודק מוסרית. <strong>פארטו ניסה לחמוק מהשאלה הזו לגמרי.</strong></p><p>ב-1906, הכלכלן האיטלקי <strong>וילפרדו פארטו</strong> הציע רעיון מהפכני. כלכלנים לא צריכים להתעסק במוסר, אמר. <strong>הם צריכים להתעסק רק ביעילות.</strong></p><p>מה זה אומר? לפי פארטו, חלוקה היא "יעילה" אם <strong>אי אפשר לשפר את מצבו של מישהו בלי להרע למישהו אחר.</strong></p><p>זו הגדרה גאונית, כי היא לא דורשת שום שיפוט ערכי. <strong>לא צריך להחליט מה צודק. רק לבדוק אם אפשר לעשות שיפור.</strong></p><p>נשמע פשוט. אבל הרעיון הזה הפך לבסיס של הכלכלה המודרנית כולה.',
            contentEn: 'Aquinas asked whether the market is morally just. <strong>Pareto tried to escape this question entirely.</strong></p><p>In 1906, the Italian economist <strong>Vilfredo Pareto</strong> proposed a revolutionary idea. Economists shouldn\'t deal with morality, he said. <strong>They should deal only with efficiency.</strong></p><p>What does this mean? According to Pareto, a distribution is "efficient" if <strong>you can\'t improve someone\'s situation without harming someone else.</strong></p><p>This is a brilliant definition because it doesn\'t require any value judgment. <strong>No need to decide what\'s just. Just check whether an improvement is possible.</strong></p><p>It sounds simple. But this idea became the foundation of all modern economics.',
          },
          {
            type: 'source',
            title: 'פארטו: יעילות פארטו', titleEn: 'Pareto: Pareto Efficiency',
            quote: '״מצב כלכלי הוא אופטימלי כאשר אי אפשר לשפר את רווחתו של אדם אחד בלי להפחית את רווחתו של אדם אחר. זו הגדרה אובייקטיבית, שאינה דורשת שיפוט מוסרי על מי ראוי לקבל יותר.״',
            quoteEn: '"An economic state is optimal when it is impossible to improve the welfare of one person without reducing the welfare of another. This is an objective definition, requiring no moral judgment about who deserves more."',
            attr: 'וילפרדו פארטו, *מדריך לכלכלה פוליטית*, 1906',
            attrEn: 'Vilfredo Pareto, *Manual of Political Economy*, 1906',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'הרעיון של פארטו נשמע פשוט, אבל יש לו השלכה מהותית.</p><p>נחשוב על חברה עם שני אנשים. <strong>לאסף יש 100,000 שקלים. לרון יש 100 שקלים.</strong> האם החלוקה הזו "יעילה" לפי פארטו?</p><p>התשובה המפתיעה: <strong>כן.</strong> היא יעילה. כי כדי לתת לרון יותר, נצטרך לקחת מאסף. <strong>זה ייטיב עם רון, אבל יזיק לאסף.</strong> ולכן, לפי פארטו, החלוקה הנוכחית אופטימלית.</p><p>מצד שני, מצב שבו לאסף יש 100,000 ולרון יש 50 שקלים, אבל יש 50 שקלים נוספים שיושבים בקופה ולא הולכים לאף אחד, <strong>זה לא יעיל.</strong> אפשר לתת את ה-50 לרון בלי להזיק לאסף.</p><p>ועכשיו אנחנו רואים את המגבלה של הרעיון. חלוקה שבה אדם אחד מחזיק בכל ההון, וכל האחרים עניים, היא "יעילה" לפי פארטו. אי אפשר לשפר אותה בלי שמישהו יפסיד.</p><p>זה גרם לפארטו להגיד דבר מהפכני: <strong>השאלה "האם זה צודק?" שונה מהשאלה "האם זה יעיל?". הכלכלן יכול לענות על השנייה. הראשונה היא לא העניין שלו.</strong>',
            contentEn: 'Pareto\'s idea sounds simple, but it has a substantial implication.</p><p>Let\'s think about a society with two people. <strong>Asaf has 100,000 shekels. Ron has 100 shekels.</strong> Is this distribution "efficient" according to Pareto?</p><p>The surprising answer: <strong>yes.</strong> It\'s efficient. Because to give Ron more, we\'d have to take from Asaf. <strong>That would benefit Ron, but harm Asaf.</strong> Therefore, according to Pareto, the current distribution is optimal.</p><p>On the other hand, a situation where Asaf has 100,000 and Ron has 50 shekels, but there are an additional 50 shekels sitting in a fund and going to no one, <strong>this is not efficient.</strong> The 50 can be given to Ron without harming Asaf.</p><p>And now we see the limitation of the idea. A distribution where one person holds all the wealth, and everyone else is poor, is "efficient" according to Pareto. You can\'t improve it without someone losing.</p><p>This led Pareto to say something revolutionary: <strong>the question "is this just?" is different from the question "is this efficient?". The economist can answer the second. The first is not his concern.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'יעילות פארטו הפכה לכלי הבסיסי של הכלכלה המודרנית. בכל ספר כלכלה בסיסי היום, היא מופיעה כאידיאל. <strong>חלוקה אופטימלית.</strong></p><p>אבל באותו זמן, היא ספגה ביקורות חריפות. <strong>כי היא מאפשרת לכלכלנים להגיד "השוק יעיל" בלי לדבר על אי שוויון, ניצול, או צדק.</strong></p><p>אם 99 אחוז מהעושר מרוכז בידי 1 אחוז של האנשים, הכלכלן הפארטיאני יכול להגיד "המצב יעיל" וללכת הביתה. <strong>כי לקחת מהעשירים יזיק להם.</strong> שאלת הצדק לא מעניינת אותו.</p><p>הוויכוח הזה הולך להיות מרכזי בפרק. <strong>רולס, נוזיק, סן, כל אחד מהם יגיב באופן אחר</strong> לטענה של פארטו שהכלכלן יכול להתחמק משאלת הצדק.</p><p>פארטו עצמו? הוא היה ברור. כלכלה היא מדע. <strong>שאלות מוסר הן לפילוסופים.</strong>',
            contentEn: 'Pareto efficiency became the foundational tool of modern economics. In every basic economics textbook today, it appears as the ideal. <strong>An optimal distribution.</strong></p><p>But at the same time, it absorbed harsh criticism. <strong>Because it allows economists to say "the market is efficient" without talking about inequality, exploitation, or justice.</strong></p><p>If 99 percent of wealth is concentrated in the hands of 1 percent of people, the Paretian economist can say "the situation is efficient" and go home. <strong>Because taking from the rich would harm them.</strong> The question of justice doesn\'t interest him.</p><p>This debate is going to be central to the chapter. <strong>Rawls, Nozick, Sen, each of them will respond differently</strong> to Pareto\'s claim that the economist can escape the question of justice.</p><p>Pareto himself? He was clear. Economics is a science. <strong>Questions of morality are for philosophers.</strong>',
          },
          {
            type: 'quiz',
            question: 'במדינה מסוימת, 95 אחוז מהעושר הלאומי מוחזק בידי אוליגרך בודד, בעוד שאר האזרחים חיים בעוני קיצוני. הממשלה שוקלת להטיל מס על האוליגרך כדי לחלק את הכסף לעניים. כיצד יגדיר כלכלן הפועל לפי הגישה המקורית של פארטו את המצב הנוכחי (לפני המס)?',
            questionEn: 'In a certain country, 95 percent of the national wealth is held by a single oligarch, while the rest of the citizens live in extreme poverty. The government considers imposing a tax on the oligarch to distribute the money to the poor. How would an economist working according to Pareto\'s original approach define the current situation (before the tax)?',
            options: [
              'המצב הנוכחי הוא יעיל, מכיוון שאי אפשר לשפר את מצבם של העניים בלי לפגוע ברווחת האוליגרך',
              'המצב הנוכחי אינו יעיל, מכיוון שחלוקה קיצונית כזו פוגעת בצמיחת השוק',
              'המצב הנוכחי אינו יעיל, מכיוון שכסף בידי אדם אחד לא מייצר תועלת שולית'
            ],
            optionsEn: [
              'The current situation is efficient, because it is impossible to improve the situation of the poor without harming the welfare of the oligarch',
              'The current situation is not efficient, because such an extreme distribution harms market growth',
              'The current situation is not efficient, because money in the hands of one person doesn\'t produce marginal utility'
            ],
            correctIndex: 0,
            explanation: 'זו המורכבות של יעילות פארטו. הגישה אינה בוחנת הוגנות או אי שוויון. מכיוון שמס יפחית את רווחת האוליגרך, המהלך לא נחשב "שיפור פארטו", והמצב הקיים מוגדר ככלכלית "אופטימלי".',
            explanationEn: 'This is the complexity of Pareto efficiency. The approach does not examine fairness or inequality. Since a tax would reduce the oligarch\'s welfare, the move is not considered a "Pareto improvement," and the existing situation is defined as economically "optimal."',
          },
          {
            type: 'quiz',
            question: 'חברה מייצרת אלפי זוגות נעליים שיושבים במחסן, מעלים אבק ולא נמכרים. מנהל המחסן מציע: "בואו נחלק את הנעליים בחינם לאנשים חסרי בית". כיצד תוגדר חלוקת הנעליים לפי פארטו?',
            questionEn: 'A company manufactures thousands of pairs of shoes that sit in a warehouse, gathering dust and not selling. The warehouse manager suggests: "Let\'s distribute the shoes for free to homeless people." How would the distribution of shoes be defined according to Pareto?',
            options: [
              'המהלך לא יעיל, כי הוא נעשה ללא תמורה ופוגע בהיגיון של השוק',
              'המהלך הוא "שיפור פארטו", כי הוא משפר את מצבם של חסרי הבית בלי לפגוע ברווחתו של אף אדם אחר',
              'המהלך הוא חטא מוסרי לפי דוקטרינת "המחיר הצודק" של אקווינס'
            ],
            optionsEn: [
              'The move is not efficient, because it is done without compensation and harms the logic of the market',
              'The move is a "Pareto improvement," because it improves the situation of the homeless without harming the welfare of anyone else',
              'The move is a moral sin according to Aquinas\'s "just price" doctrine'
            ],
            correctIndex: 1,
            explanation: 'מוצרים שיושבים במחסן בלי שימוש הם חוסר יעילות. חלוקתם לאנשים שזקוקים להם משפרת את מצבם, בלי לפגוע באף אחד. זהו שיפור פארטו קלאסי.',
            explanationEn: 'Goods that sit in a warehouse without use are inefficiency. Distributing them to people who need them improves their situation, without harming anyone. This is a classic Pareto improvement.',
          },
          {
            type: 'quiz',
            question: 'ידיד הלומד כלכלה אומר: "כשאני קובע שהשוק הגיע ליעילות פארטו, הוכחתי מדעית שהגענו לחלוקה הצודקת והמוסרית ביותר." כיצד תגיב?',
            questionEn: 'A friend studying economics says: "When I determine that the market has reached Pareto efficiency, I have scientifically proven that we have reached the most just and moral distribution." How would you respond?',
            options: [
              'הידיד צודק, יעילות פארטו היא הכלי האובייקטיבי שהוכיח ששוק חופשי פותר את שאלת המוסר',
              'הידיד טועה חלקית, פארטו האמין שהשוק צודק רק אם הממשלה מחלקת הון מראש בצורה שווה',
              'הידיד טועה, פארטו הפריד בין מדע הכלכלה (יעילות) לפילוסופיה (צדק); מצב יעיל יכול להיות בלתי צודק בעליל'
            ],
            optionsEn: [
              'The friend is right, Pareto efficiency is the objective tool that proves a free market solves the question of morality',
              'The friend is partly wrong, Pareto believed that the market is just only if the government distributes capital equally in advance',
              'The friend is wrong, Pareto separated economic science (efficiency) from philosophy (justice); a Pareto-efficient situation can be obviously unjust'
            ],
            correctIndex: 2,
            explanation: 'פארטו עשה מהלך מודע כדי לנתק את הכלכלה מהדיון המוסרי. תפקיד הכלכלן הוא לבדוק יעילות, לא הוגנות. השאלה אם חלוקה צודקת היא ערכית, לא כלכלית.',
            explanationEn: 'Pareto made a conscious move to detach economics from the moral discussion. The economist\'s role is to examine efficiency, not fairness. The question of whether a distribution is just is a value question, not an economic one.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 3, title: 'מסך הבערות', titleEn: 'The Veil of Ignorance', thinker: 'ג\'ון רולס', thinkerEn: 'John Rawls', thinkerId: 'rawls', xp: 50, sections: [
          {
            type: 'idea',
            title: 'מסך הבערות', titleEn: 'The Veil of Ignorance',
            content: 'פארטו אמר שכלכלה לא מתעסקת בצדק. רולס אמר את ההיפך הגמור: <strong>צדק הוא השאלה הראשונה במעלה.</strong></p><p>ב-1971, הפילוסוף האמריקאי <strong>ג\'ון רולס</strong> פרסם את הספר <em>"תיאוריית הצדק"</em>. הוא ניסה לענות על השאלה: <strong>איזו חלוקה כלכלית היא צודקת?</strong></p><p>הבעיה המרכזית, אמר רולס, היא שכל אדם שואל את השאלה הזו מהמיקום שלו. <strong>עשיר יחשוב שעשירים ראויים לעושר שלהם. עני יחשוב שצריך לחלק מחדש.</strong> אי אפשר להגיע לשיפוט אובייקטיבי.</p><p>אז רולס הציע ניסוי מחשבתי. <strong>דמיינו שאתם צריכים לעצב חברה, בלי לדעת מי אתם תהיו בה.</strong> אתם לא יודעים אם תהיו גברים או נשים, עשירים או עניים, חכמים או רגילים, חולים או בריאים. אתם מאחורי <strong>"מסך הבערות"</strong>.</p><p>עכשיו, איזה כללי חלוקה תבחרו?',
            contentEn: 'Pareto said that economics doesn\'t deal with justice. Rawls said the opposite: <strong>justice is the first question.</strong></p><p>In 1971, the American philosopher <strong>John Rawls</strong> published the book <em>"A Theory of Justice."</em> He tried to answer the question: <strong>which economic distribution is just?</strong></p><p>The main problem, Rawls said, is that every person asks this question from their own position. <strong>A rich person thinks the rich deserve their wealth. A poor person thinks there should be redistribution.</strong> It\'s impossible to reach an objective judgment.</p><p>So Rawls proposed a thought experiment. <strong>Imagine you have to design a society, without knowing who you will be in it.</strong> You don\'t know if you\'ll be a man or a woman, rich or poor, brilliant or average, healthy or sick. You\'re behind <strong>"the veil of ignorance."</strong></p><p>Now, what rules of distribution would you choose?',
          },
          {
            type: 'source',
            title: 'רולס: מסך הבערות', titleEn: 'Rawls: The Veil of Ignorance',
            quote: '״כדי לחשוב על צדק באובייקטיביות, עלינו לדמיין את עצמנו במצב התחלתי, שבו אנו לא יודעים מה יהיו כישורינו, מעמדנו, או רכושנו. רק מאחורי מסך כזה של בערות, נוכל לבחור עקרונות צדק אמיתיים.״',
            quoteEn: '"To think about justice objectively, we must imagine ourselves in an initial state, where we don\'t know what our abilities, status, or property will be. Only behind such a veil of ignorance can we choose true principles of justice."',
            attr: 'ג\'ון רולס, *תיאוריית הצדק*, 1971',
            attrEn: 'John Rawls, *A Theory of Justice*, 1971',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'נחשוב על המשחק שרולס הציע. <strong>דמיין שאני שואל אותך לעצב חוקים לחברה.</strong> יש לך כוח לבחור איך לחלק את העושר, מי יקבל חינוך, מי יקבל בריאות.</p><p>אבל לפני שאתה בוחר, אני שואל אותך: <strong>מי אתה תהיה בחברה הזו?</strong> האם אתה תהיה בעל הון או עובד שכיר? יליד תל אביב או מהגר מאתיופיה? בריא או עם מוגבלות? <strong>אתה לא יודע.</strong></p><p>לפי רולס, רוב האנשים יבחרו עיקרון מרכזי: <strong>חברה צודקת היא חברה שגם החלש בה יכול לחיות בכבוד.</strong> לא כי אנחנו אלטרואיסטים, אלא כי כל אחד מאתנו עלול להיות החלש.</p><p>מכאן רולס פיתח <strong>שני עקרונות צדק:</strong> ראשית, לכל אדם יש זכויות יסוד שוות (חופש, ביטחון, השכלה). שנית, <strong>אי-שוויון כלכלי מותר רק אם הוא משפר את מצבם של החלשים ביותר.</strong></p><p>זה לא דורש שוויון מוחלט. <strong>הוא דורש שאי-שוויון יצדיק את עצמו על ידי תרומה לחלשים.</strong>',
            contentEn: 'Let\'s think about the game Rawls proposed. <strong>Imagine I ask you to design rules for a society.</strong> You have the power to choose how to distribute wealth, who gets education, who gets healthcare.</p><p>But before you choose, I ask you: <strong>who will you be in this society?</strong> Will you be a capital owner or a salaried worker? Born in New York or an immigrant from Ethiopia? Healthy or disabled? <strong>You don\'t know.</strong></p><p>According to Rawls, most people would choose a central principle: <strong>a just society is one in which even the weakest can live with dignity.</strong> Not because we are altruistic, but because each of us might be the weakest.</p><p>From this Rawls developed <strong>two principles of justice:</strong> first, every person has equal basic rights (freedom, security, education). Second, <strong>economic inequality is permitted only if it improves the situation of the weakest.</strong></p><p>This doesn\'t require absolute equality. <strong>It requires that inequality justify itself by contributing to the weakest.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הניסוי המחשבתי של רולס שינה את הפילוסופיה הפוליטית של המאה ה-20. <strong>לפניו, הוגים דיברו על "צדק" באופן מופשט. רולס נתן כלי קונקרטי לחשיבה.</strong></p><p>הניסוח שלו הפך לבסיס של רוב מדינות הרווחה המודרניות. הרעיון שעשירים יכולים להיות עשירים, אבל המדינה צריכה להגן על מי שנופל.</p><p>אבל היו הוגים שחלקו על זה. <strong>למה צריך להגן על החלשים? למה חופש לבחור איך לחיות לא מספיק?</strong> בדיאלוג הבא נפגוש את נוזיק, שיציג את הקריאה ההפוכה.',
            contentEn: 'Rawls\'s thought experiment changed the political philosophy of the 20th century. <strong>Before him, thinkers spoke of "justice" abstractly. Rawls gave a concrete tool for thinking.</strong></p><p>His formulation became the basis of most modern welfare states. The idea that the rich can be rich, but the state must protect those who fall.</p><p>But there were thinkers who disagreed. <strong>Why must we protect the weakest? Why isn\'t the freedom to choose how to live enough?</strong> In the next dialogue we will meet Nozick, who will present the opposite reading.',
          },
          {
            type: 'quiz',
            question: 'לפי ג\'ון רולס, מדוע בני אדם אינם מסוגלים להסכים על חוקי חלוקה צודקים והוגנים כאשר הם דנים בכך בחיי היומיום שלהם?',
            questionEn: 'According to John Rawls, why are humans unable to agree on just and fair distribution rules when they discuss them in their daily lives?',
            options: [
              'כי בני האדם הם מטבעם יצורים לא רציונליים לחלוטין, כפי שהוכיחה הכלכלה ההתנהגותית',
              'כי כל אדם שופט את המערכת מתוך המעמד, הרכוש והאינטרס האישי שלו בהווה',
              'כי הכלכלנים הוכיחו שכל חלוקה קיימת בשוק היא כבר יעילה לפי פארטו'
            ],
            optionsEn: [
              'Because humans are inherently irrational beings, as behavioral economics has proven',
              'Because every person judges the system from their current class, property, and personal interest',
              'Because economists have proven that every existing market distribution is already Pareto-efficient'
            ],
            correctIndex: 1,
            explanation: 'זו הבעיה שרולס זיהה. עשיר נוטה להאמין שהשוק חופשי וצודק, בעוד שאדם שנולד למצוקה רואה את המערכת כלא הוגנת. כדי לפתור את ההטיה הזו, רולס פיתח את "מסך הבערות".',
            explanationEn: 'This is the problem Rawls identified. A rich person tends to believe the market is free and just, while someone born into hardship sees the system as unfair. To solve this bias, Rawls developed the "veil of ignorance."',
          },
          {
            type: 'quiz',
            question: 'מדינה מסוימת מאפשרת ליזמי הייטק להרוויח מיליארדי שקלים ולשלם מיסי חברה נמוכים, אך ורק בתנאי שהטכנולוגיה שלהם מייצרת אלפי מקומות עבודה חדשים ומממנת מערכת בריאות ציבורית מעולה לכלל האזרחים. כיצד רולס היה בוחן את אי-השוויון הכלכלי הזה?',
            questionEn: 'A certain country allows tech entrepreneurs to earn billions of shekels and pay low corporate taxes, but only on the condition that their technology creates thousands of new jobs and finances an excellent public healthcare system for all citizens. How would Rawls examine this economic inequality?',
            options: [
              'המצב צודק, מכיוון שאי-השוויון הכלכלי מוצדק בכך שהוא משפר את מצבם של החלשים ביותר בחברה',
              'המצב אינו צודק, כיוון שרולס דרש שוויון מוחלט וקצבאות שוות לכל האזרחים ללא קשר לתרומתם',
              'המצב אינו צודק, כיוון שאקווינס הוכיח שרווח של מיליארדים הוא תמיד חטא מוסרי'
            ],
            optionsEn: [
              'The situation is just, because the economic inequality is justified by improving the situation of the weakest in society',
              'The situation is not just, because Rawls demanded absolute equality and equal allowances for all citizens regardless of their contribution',
              'The situation is not just, because Aquinas proved that earning billions is always a moral sin'
            ],
            correctIndex: 0,
            explanation: 'זהו "עיקרון ההפרשיות" המפורסם של רולס. הוא אינו דורש שוויון מוחלט, אלא שאי-שוויון יצדיק את עצמו על ידי תרומה לחלשים. תמריצים כלכליים מותרים, כל עוד הם משרתים את החלשים ביותר במערכת.',
            explanationEn: 'This is Rawls\'s famous "difference principle." He doesn\'t demand absolute equality, but that inequality justify itself through contribution to the weakest. Economic incentives are permitted, as long as they serve the weakest in the system.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "אם נשווה בין פארטו לרולס, רולס בעצם מציע לנו כלי פילוסופי שמאפשר לזהות אילו מצבים מתוך כלל המצבים שיעילים-לפי-פארטו הם גם צודקים ומוסריים". האם החבר צודק?',
            questionEn: 'A friend says: "If we compare Pareto and Rawls, Rawls is essentially offering us a philosophical tool that allows us to identify which states, out of all the Pareto-efficient states, are also just and moral." Is the friend correct?',
            options: [
              'לא, כיוון שרולס טען שמצב יעיל-פארטו הוא בהכרח מצב לא צודק',
              'לא, כיוון שרולס האמין שהכלכלנים צריכים לקבוע את המוסר ולא הפילוסופים',
              'כן, רולס נותן לנו קריטריון לבחירה: מתוך כל החלופות היעילות בשוק, החלופה הצודקת היא זו שמטיבה ביותר עם השכבה החלשה'
            ],
            optionsEn: [
              'No, because Rawls claimed that a Pareto-efficient state is necessarily unjust',
              'No, because Rawls believed that economists should determine morality, not philosophers',
              'Yes, Rawls gives us a criterion for choosing: out of all the efficient alternatives in the market, the just alternative is the one that benefits the weakest stratum the most'
            ],
            correctIndex: 2,
            explanation: 'זו נקודת החיבור בין השניים. פארטו הראה שיש אינסוף מצבים יעילים, כולל כאלה לא הוגנים. רולס מגיע ואומר: יעילות אינה הכל. "מסך הבערות" עוזר לנו לבחור את המצב היעיל שהוא גם מוסרי, ושהיינו מסכימים לחיות בו גם אם היינו נופלים לתחתית.',
            explanationEn: 'This is the point of connection between the two. Pareto showed there are infinite efficient states, including unfair ones. Rawls comes and says: efficiency isn\'t everything. The "veil of ignorance" helps us choose the efficient state that is also moral, the one we would agree to live in even if we fell to the bottom.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 4, title: 'זכויות פרט', titleEn: 'Individual Rights', thinker: 'רוברט נוזיק', thinkerEn: 'Robert Nozick', thinkerId: 'nozick', xp: 50, sections: [
          {
            type: 'idea',
            title: 'זכויות פרט', titleEn: 'Individual Rights',
            content: 'רולס אמר שצדק הוא חלוקה הוגנת. <strong>נוזיק אמר שצדק הוא משהו אחר לגמרי.</strong></p><p>ב-1974, הפילוסוף האמריקאי <strong>רוברט נוזיק</strong>, עמית של רולס בהארוורד, פרסם את הספר <em>"אנרכיה, מדינה ואוטופיה"</em>. הוא היה תגובה ישירה לתיאוריית הצדק של רולס.</p><p>נוזיק טען: <strong>השאלה "מה החלוקה הצודקת?" היא השאלה הלא נכונה.</strong> השאלה הנכונה היא: <strong>איך החלוקה התרחשה?</strong></p><p>תחשוב על זה כך. אם תפסיק תהליך כלכלי בכל רגע ותסתכל על החלוקה, היא תיראה לא הוגנת. <strong>אבל אם כל פעולה בתהליך הייתה חופשית והוגנת, איך התוצאה יכולה להיות לא צודקת?</strong></p><p>נוזיק קרא לזה <strong>"צדק כזכאות"</strong>. אם השגת רכוש על ידי עבודה, על ידי הסכמה חופשית, או על ידי ירושה, <strong>הרכוש הוא שלך באופן צודק</strong>, בלי קשר לכמה הוא גדול וגם אם לאחרים יש הרבה פחות.</p><p>זו עמדה רדיקלית. <strong>היא אומרת שאין דבר כזה "חלוקה צודקת". יש רק היסטוריה צודקת.</strong>',
            contentEn: 'Rawls said that justice is a fair distribution. <strong>Nozick said that justice is something else entirely.</strong></p><p>In 1974, the American philosopher <strong>Robert Nozick</strong>, a colleague of Rawls at Harvard, published the book <em>"Anarchy, State, and Utopia."</em> It was a direct response to Rawls\'s theory of justice.</p><p>Nozick argued: <strong>the question "what is the just distribution?" is the wrong question.</strong> The right question is: <strong>how did the distribution come about?</strong></p><p>Think about it this way. If you stop an economic process at any moment and look at the distribution, it will look unfair. <strong>But if every action in the process was free and fair, how can the result be unjust?</strong></p><p>Nozick called this <strong>"justice as entitlement."</strong> If you acquired property through labor, through voluntary agreement, or through inheritance, <strong>the property is justly yours</strong>, regardless of how much it is and even if others have much less.</p><p>This is a radical position. <strong>It says that there is no such thing as a "just distribution." There is only a just history.</strong>',
          },
          {
            type: 'source',
            title: 'נוזיק: צדק כזכאות', titleEn: 'Nozick: Justice as Entitlement',
            quote: '״מצב צודק הוא כל מצב שהושג בדרכים צודקות. אם אנשים השיגו את רכושם על ידי עבודה, סחר חופשי, או מתנה, הרכוש הוא שלהם, גם אם החלוקה נראית לא שווה. אין \'חלוקה צודקת\' שאליה צריך לכפות את הכלכלה.״',
            quoteEn: '"A just situation is any situation that was achieved through just means. If people acquired their property through labor, free trade, or gift, the property is theirs, even if the distribution looks unequal. There is no \'just distribution\' to which the economy must be forced."',
            attr: 'רוברט נוזיק, *אנרכיה, מדינה ואוטופיה*, 1974',
            attrEn: 'Robert Nozick, *Anarchy, State, and Utopia*, 1974',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'נוזיק הציג ניסוי מחשבתי מפורסם בשם <strong>"וילט צ\'יימברליין"</strong>.</p><p>נדמיין: שחקן כדורסל מפורסם, וילט צ\'יימברליין, חתום על חוזה. <strong>בכל משחק, כל אחד מהצופים יכול לבחור לשלם לו 25 סנט נוסף.</strong> מיליון אנשים בוחרים לשלם.</p><p>תוך עונה, צ\'יימברליין מגיע ל-250,000 דולר נוספים, <strong>בעוד שאר השחקנים מקבלים שכר רגיל.</strong> התוצאה: אי-שוויון כלכלי גדול.</p><p>עכשיו השאלה: <strong>האם המצב הזה צודק?</strong></p><p>לפי רולס: לא, כי האי-שוויון לא משרת את החלשים.</p><p>לפי נוזיק: <strong>כן.</strong> כל אחד מהאנשים בחר בחופשיות לשלם 25 סנט. אף אחד לא כפה עליהם. <strong>התוצאה היא פשוט סך כל הבחירות החופשיות שלהם.</strong> איך זה יכול להיות לא צודק?</p><p>נוזיק טען שזו הביקורת הקטלנית על רולס. <strong>אם נחלק מחדש את הכסף של צ\'יימברליין, אנחנו בעצם מבטלים את הבחירות החופשיות של מיליון אנשים.</strong> והבחירה החופשית, לא החלוקה, היא הצדק האמיתי.',
            contentEn: 'Nozick presented a famous thought experiment called <strong>"Wilt Chamberlain."</strong></p><p>Imagine: a famous basketball player, Wilt Chamberlain, signed to a contract. <strong>In each game, each viewer can choose to pay him an additional 25 cents.</strong> A million people choose to pay.</p><p>Within a season, Chamberlain reaches an additional $250,000, <strong>while the other players receive a regular salary.</strong> The result: great economic inequality.</p><p>Now the question: <strong>is this situation just?</strong></p><p>According to Rawls: no, because the inequality doesn\'t serve the weakest.</p><p>According to Nozick: <strong>yes.</strong> Each of the people chose freely to pay 25 cents. No one forced them. <strong>The result is simply the sum of all their free choices.</strong> How could it be unjust?</p><p>Nozick argued that this is the lethal critique of Rawls. <strong>If we redistribute Chamberlain\'s money, we are essentially canceling the free choices of a million people.</strong> And free choice, not distribution, is true justice.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'נוזיק לא היה אדיש לעוני. הוא פשוט חשב שצדק לא מודד תוצאות, אלא תהליכים. <strong>מיסים שמטרתם חלוקה מחדש הם, מבחינתו, סוג של ניצול: לקיחת פרי עבודתו של אדם, גם אם זה לטובת אחרים.</strong></p><p>הוויכוח בין רולס לנוזיק הוא הוויכוח הפילוסופי המרכזי של המאה ה-20 על צדק כלכלי. <strong>הוא לא נסגר עד היום.</strong></p><p>אבל יש דרך שלישית. <strong>בדיאלוג הבא נפגוש את הייק, שיציע ביקורת שונה לחלוטין על שני המחנות.</strong>',
            contentEn: 'Nozick wasn\'t indifferent to poverty. He simply thought that justice doesn\'t measure outcomes, but processes. <strong>Taxes intended for redistribution are, from his perspective, a form of exploitation: taking a person\'s fruits of labor, even if for the benefit of others.</strong></p><p>The debate between Rawls and Nozick is the central philosophical debate of the 20th century on economic justice. <strong>It hasn\'t been settled to this day.</strong></p><p>But there is a third way. <strong>In the next dialogue, we will meet Hayek, who will offer a completely different critique of both camps.</strong>',
          },
          {
            type: 'quiz',
            question: 'יזם צעיר פיתח אפליקציה מצליחה, ובתוך שנה צבר הון של מיליוני שקלים לאחר שמיליוני משתמשים בחרו מרצונם החופשי לשלם חמישה שקלים כדי להוריד אותה. כיצד רוברט נוזיק היה מגדיר את העושר של היזם לעומת שאר האוכלוסייה?',
            questionEn: 'A young entrepreneur developed a successful app, and within a year accumulated wealth of millions of shekels after millions of users freely chose to pay five shekels to download it. How would Robert Nozick define the entrepreneur\'s wealth compared to the rest of the population?',
            options: [
              'המצב צודק לחלוטין, כיוון שההון הושג בדרך היסטורית של בחירות חופשיות ומרצון של הצרכנים',
              'המצב אינו צודק, כיוון שהאי-שוויון שנוצר אינו תורם לשכבות החלשות בחברה',
              'המצב אינו צודק, כיוון שאקווינס הוכיח שרווח מהיר כזה משנה את מהות המוצר לסחורה משוחדת'
            ],
            optionsEn: [
              'The situation is completely just, because the wealth was acquired through a historical path of free and voluntary choices by consumers',
              'The situation is not just, because the inequality created does not contribute to the weakest strata of society',
              'The situation is not just, because Aquinas proved that such rapid profit changes the nature of the product into corrupted goods'
            ],
            correctIndex: 0,
            explanation: 'זהו לב "הצדק כזכאות" של נוזיק. אם היזם השיג את רכושו באמצעות העברה צודקת (סחר חופשי ומרצון), הרכוש הוא שלו בזכות מלאה. רמת האי-שוויון הסופית אינה רלוונטית, רק התהליך שהוביל אליה.',
            explanationEn: 'This is the heart of Nozick\'s "justice as entitlement." If the entrepreneur acquired his property through just transfer (free and voluntary trade), the property is fully his by right. The final level of inequality is not relevant, only the process that led to it.',
          },
          {
            type: 'quiz',
            question: 'בניסוי "וילט צ\'יימברליין", נוזיק ניסה להראות:',
            questionEn: 'In the "Wilt Chamberlain" experiment, Nozick tried to show:',
            options: [
              'שלא ניתן לחלק עושר בשוק חופשי בלי לכפות כפייה',
              'שגם אם נתחיל מחברה שוויונית לחלוטין, בחירות חופשיות של אנשים יובילו תמיד לאי-שוויון, ולכן אי-שוויון אינו עדות לחוסר צדק',
              'שכוכבי ספורט תורמים תרומה ייחודית שמצדיקה את שכרם'
            ],
            optionsEn: [
              'That it is impossible to distribute wealth in a free market without coercion',
              'That even if we begin with a completely egalitarian society, free choices of people will always lead to inequality, and therefore inequality is not evidence of a lack of justice',
              'That sports stars contribute a unique contribution that justifies their salary'
            ],
            correctIndex: 1,
            explanation: 'זו הביקורת החדה של נוזיק על רולס. גם אם רולס מצליח לעצב חברה שוויונית מאחורי מסך הבערות, אנשים יפעלו בה בחופשיות ויובילו לאי-שוויון. לכן, לטענת נוזיק, לתבוע "חלוקה צודקת" משמעה לבטל ללא הרף את הבחירות החופשיות של אנשים.',
            explanationEn: 'This is Nozick\'s sharp critique of Rawls. Even if Rawls succeeds in designing an egalitarian society behind the veil of ignorance, people will act in it freely and lead to inequality. Therefore, according to Nozick, demanding a "just distribution" means constantly canceling people\'s free choices.',
          },
          {
            type: 'quiz',
            question: 'אם נשווה בין אדם סמית (מפרק 1) לבין רוברט נוזיק, מהו המכנה המשותף הפילוסופי המובהק ביותר ביניהם בהקשר של השוק החופשי?',
            questionEn: 'If we compare Adam Smith (from Chapter 1) with Robert Nozick, what is the most distinct philosophical common denominator between them in the context of the free market?',
            options: [
              'שניהם האמינו שהשוק החופשי צריך להיות מנוהל על ידי ועדות מומחים כדי להבטיח את מוסר המחירים',
              'שניהם קיבלו את הניתוח של מרקס לגבי הערך העודף אך חיפשו פתרון פוליטי מתון יותר',
              'שניהם רואים בחופש הפרט ובחילופין מרצון את הבסיס למערכת הכלכלית, ומסתייגים מהתערבות ממשלתית בחלוקת העושר'
            ],
            optionsEn: [
              'Both believed that the free market should be managed by expert committees to ensure the morality of prices',
              'Both accepted Marx\'s analysis of surplus value but sought a more moderate political solution',
              'Both see individual freedom and voluntary exchange as the basis for the economic system, and resist government intervention in the distribution of wealth'
            ],
            correctIndex: 2,
            explanation: 'נוזיק מעניק גיבוי פילוסופי לחופש הכלכלי שסמית תיאר. עבור סמית, השוק החופשי מייצר יעילות ועושר ("היד הנעלמה"). עבור נוזיק, אותם חילופין מרצון הם התנאי היחיד לצדק מוסרי. שניהם שוללים את זכותה של המדינה לכפות חלוקה.',
            explanationEn: 'Nozick gives philosophical backing to the economic freedom that Smith described. For Smith, the free market produces efficiency and wealth ("the invisible hand"). For Nozick, those same voluntary exchanges are the only condition for moral justice. Both deny the state\'s right to enforce distribution.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 5, title: 'הייק וצדק חברתי', titleEn: 'Hayek and Social Justice', thinker: 'פרידריך הייק', thinkerEn: 'Friedrich Hayek', thinkerId: 'hayek', xp: 50, sections: [
          {
            type: 'idea',
            title: 'הייק וצדק חברתי', titleEn: 'Hayek and Social Justice',
            content: 'נוזיק אמר שרולס טועה. <strong>הייק אמר שכל השאלה מוטעית.</strong></p><p>ב-1976, הכלכלן האוסטרי-בריטי <strong>פרידריך הייק</strong>, זוכה נובל בכלכלה, פרסם את הספר <em>"חוק, חקיקה וחירות"</em>. הוא טען טענה רדיקלית: <strong>המושג "צדק חברתי" הוא טעות לוגית.</strong></p><p>הסיבה? <strong>צדק הוא תכונה של פעולות, לא של מצבים.</strong> אדם יכול לפעול בצדק או בעוול. גשם שמרטיב אדם אחד ולא אחר, לא יכול להיות "לא צודק". הוא פשוט קרה.</p><p>לפי הייק, <strong>השוק הוא כמו מזג האוויר.</strong> הוא לא פועל. הוא תהליך ספונטני, תוצאה של מיליוני פעולות נפרדות של מיליוני אנשים. <strong>אי אפשר לקרוא לתוצאה של השוק "צודקת" או "לא צודקת", כי השוק לא מחליט כלום.</strong></p><p>זה הופך את כל השאלה של רולס לחסרת משמעות. <strong>"איזו חלוקה צודקת?" זה כמו לשאול "איזו עוצמת רוח צודקת?".</strong> השאלה לא נכונה.',
            contentEn: 'Nozick said that Rawls was wrong. <strong>Hayek said that the whole question is misguided.</strong></p><p>In 1976, the Austrian-British economist <strong>Friedrich Hayek</strong>, Nobel laureate in economics, published the book <em>"Law, Legislation and Liberty."</em> He made a radical claim: <strong>the concept of "social justice" is a logical error.</strong></p><p>Why? <strong>Justice is a property of actions, not of states.</strong> A person can act justly or unjustly. Rain that wets one person and not another cannot be "unjust." It simply happened.</p><p>According to Hayek, <strong>the market is like the weather.</strong> It doesn\'t act. It is a spontaneous process, the result of millions of separate actions by millions of people. <strong>You can\'t call the outcome of the market "just" or "unjust," because the market doesn\'t decide anything.</strong></p><p>This makes the whole question of Rawls meaningless. <strong>"Which distribution is just?" is like asking "which wind strength is just?".</strong> The question is wrong.',
          },
          {
            type: 'source',
            title: 'הייק: צדק חברתי', titleEn: 'Hayek: Social Justice',
            quote: '״אי-שוויון של תוצאות בשוק החופשי אינו לא צודק, כי איש לא תיכנן אותו. צדק יכול להיות תכונה של התנהגות אנושית, אך לא של מצב שאיש לא יצר במכוון. כשאנו דורשים \'צדק חברתי\', אנו דורשים שמישהו ינסה לחקות את התוצאה של מיליוני בחירות חופשיות, וזה בלתי אפשרי.״',
            quoteEn: '"Inequality of outcomes in the free market is not unjust, because no one planned it. Justice can be a property of human behavior, but not of a state that no one intentionally created. When we demand \'social justice,\' we are demanding that someone try to mimic the outcome of millions of free choices, and this is impossible."',
            attr: 'פרידריך הייק, *חוק, חקיקה וחירות*, כרך שני, 1976',
            attrEn: 'Friedrich Hayek, *Law, Legislation and Liberty*, Volume Two, 1976',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'נחשוב על משחק שח. שני שחקנים מומחים. אחד מנצח, השני מפסיד. <strong>האם זה צודק שאחד הפסיד?</strong></p><p>לפי הייק, השאלה מוטעית. <strong>המשחק היה הוגן</strong> (אותם חוקים, אותו זמן לחשיבה). אבל <strong>התוצאה אינה "צודקת" או "לא צודקת"</strong>, היא פשוט תוצאה.</p><p>עכשיו דמיין שאמא של המפסיד תובעת: "חלקו מחדש את הניצחון! זה לא צודק שבני הפסיד!". <strong>זה נשמע מגוחך, נכון?</strong> כי אנחנו מבינים שתוצאת המשחק אינה משהו שמישהו "החליט", אלא תהליך.</p><p>לפי הייק, <strong>השוק עובד באותה צורה.</strong> עובד אחד מצליח, אחר נכשל, לא כי "השוק החליט" שאחד עדיף, אלא כי <strong>מיליוני בחירות של מיליוני אנשים יצרו את התוצאה הזו.</strong></p><p>אבל יש בעיה עמוקה יותר. <strong>אם המדינה מנסה לחלק מחדש בשם "צדק חברתי", היא חייבת להחליט מי "ראוי".</strong> והחלטה הזו תמיד תהיה שרירותית, <strong>כי אין דרך אובייקטיבית להעריך תרומה.</strong> הניסיון לכפות "צדק חברתי" דורש מהמדינה לקבל החלטות שרירותיות על מי ראוי, ולאכוף אותן בכוח על אנשים שלא בהכרח מסכימים.',
            contentEn: 'Let\'s think about a chess game. Two expert players. One wins, the other loses. <strong>Is it just that one lost?</strong></p><p>According to Hayek, the question is misguided. <strong>The game was fair</strong> (same rules, same time to think). But <strong>the outcome is not "just" or "unjust,"</strong> it is simply a result.</p><p>Now imagine that the mother of the loser demands: "Redistribute the victory! It\'s not just that my son lost!" <strong>It sounds ridiculous, right?</strong> Because we understand that the game\'s outcome is not something someone "decided," but a process.</p><p>According to Hayek, <strong>the market works the same way.</strong> One worker succeeds, another fails, not because "the market decided" that one is better, but because <strong>millions of choices by millions of people created this outcome.</strong></p><p>But there\'s a deeper problem. <strong>If the state tries to redistribute in the name of "social justice," it must decide who is "worthy."</strong> And that decision will always be arbitrary, <strong>because there\'s no objective way to evaluate contribution.</strong> The attempt to enforce "social justice" requires the state to make arbitrary decisions about who deserves what, and to enforce them by force on people who don\'t necessarily agree.',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'הביקורת של הייק היא לא מוסרית. <strong>היא נוגעת לגבולות הידע.</strong></p><p>נוזיק טען: "לחלוקה הזו אין הצדקה מוסרית". הייק טען: <strong>"אי אפשר בכלל לדעת איזו חלוקה צודקת".</strong> ההבדל מהותי. נוזיק מאמין שיש תשובה (תהליך הוגן), הייק חושב שאין דרך לדעת.</p><p>הסיבה: <strong>השוק קיים בדיוק כדי לתאם פעולות בלי שמישהו יידע הכל.</strong> ברגע שמישהו ינסה להחליט "מי ראוי לכמה", הוא בעצם דורש ידע שלא קיים.</p><p>הוויכוח הזה לא נסגר. <strong>אבל הייק הצליח לשנות איך אנשים חושבים על המילה "צדק".</strong>',
            contentEn: 'Hayek\'s critique isn\'t moral. <strong>It relates to the limits of knowledge.</strong></p><p>Nozick claimed: "This distribution has no moral justification." Hayek claimed: <strong>"It\'s not even possible to know which distribution is just."</strong> The difference is fundamental. Nozick believes there is an answer (a fair process). Hayek thinks there is no way to know.</p><p>The reason: <strong>the market exists precisely to coordinate actions without anyone knowing everything.</strong> The moment someone tries to decide "who deserves how much," they are demanding knowledge that doesn\'t exist.</p><p>This debate isn\'t settled. <strong>But Hayek succeeded in changing how people think about the word "justice."</strong>',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "שוק שמייצר מיליארדים לבעלי הון ומשאיר עובדים בעוני, הוא לא צודק". איך הייק היה מערער על הטענה הזו?',
            questionEn: 'A friend says: "A market that produces billions for capital owners and leaves workers in poverty is not just." How would Hayek challenge this claim?',
            options: [
              'השוק לא מחליט, ולכן אי אפשר לכנותו "צודק" או "לא צודק"',
              'הייק היה מסכים, אי שוויון תמיד מעיד על חוסר צדק',
              'הייק היה מציע מס גבוה על בעלי ההון'
            ],
            optionsEn: [
              'The market doesn\'t decide, so it can\'t be called "just" or "unjust"',
              'Hayek would agree, inequality always indicates a lack of justice',
              'Hayek would propose a high tax on capital owners'
            ],
            correctIndex: 0,
            explanation: 'זו הביקורת המהותית של הייק. השוק אינו "סוכן" שיכול לפעול בצדק או בעוול. הוא תוצאה של מיליוני פעולות נפרדות. לקרוא לתוצאה שלו "לא צודקת" זו טעות בשפה, בדיוק כמו לקרוא לרוח "לא צודקת".',
            explanationEn: 'This is Hayek\'s substantive critique. The market is not an "agent" that can act justly or unjustly. It is the result of millions of separate actions. Calling its outcome "unjust" is a linguistic error, just like calling the wind "unjust."',
          },
          {
            type: 'quiz',
            question: 'מה ההבדל המהותי בין הביקורת של נוזיק לזו של הייק על "צדק חברתי"?',
            questionEn: 'What is the fundamental difference between Nozick\'s and Hayek\'s critiques of "social justice"?',
            options: [
              'אין ביניהם הבדל, שניהם ליברטריאנים',
              'נוזיק נתן הצדקה מוסרית, הייק טען שהמושג חסר משמעות',
              'נוזיק התנגד לבחירה חופשית, הייק תמך בה'
            ],
            optionsEn: [
              'There is no difference between them, both are libertarians',
              'Nozick gave a moral justification, Hayek claimed the concept is meaningless',
              'Nozick opposed free choice, Hayek supported it'
            ],
            correctIndex: 1,
            explanation: 'זה ההבדל החשוב בין השניים. נוזיק נותן הצדקה חיובית לתוצאות השוק (אם התהליך היה הוגן, התוצאה צודקת). הייק נותן ביקורת שלילית על הכלי המוסרי (אנחנו פשוט לא יודעים מספיק כדי להחליט מהי חלוקה צודקת).',
            explanationEn: 'This is the important difference between the two. Nozick gives a positive justification for market outcomes (if the process was fair, the result is just). Hayek gives a negative critique of the moral tool (we simply don\'t know enough to decide what a just distribution is).',
          },
          {
            type: 'quiz',
            question: 'מדינה רוצה להגדיל מסים על מיליונרים כדי לממן מערכת חינוך טובה יותר. בהתבסס על הייק, מהי הביקורת הצפויה ביותר על המהלך?',
            questionEn: 'A country wants to increase taxes on millionaires to fund a better education system. Based on Hayek, what is the most expected critique of this move?',
            options: [
              'המהלך לא צודק כי הוא לוקח כסף מאנשים',
              'המהלך הוא בחירה פוליטית, לא "צדק חברתי"',
              'המהלך מצוין, יש לבצע אותו'
            ],
            optionsEn: [
              'The move is unjust because it takes money from people',
              'The move is a political choice, not "social justice"',
              'The move is excellent, it should be implemented'
            ],
            correctIndex: 1,
            explanation: 'הייק לא היה אומר שאסור למסות. הוא היה אומר שהשפה משנה. ניתן לטעון שמערכת חינוך טובה מועילה לחברה. אבל לקרוא לזה "צדק חברתי" זה להעמיד פנים שיש תשובה אובייקטיבית, כשבעצם זו בחירה ערכית.',
            explanationEn: 'Hayek wouldn\'t say that taxation is forbidden. He would say that the language matters. One can argue that a good education system benefits society. But calling it "social justice" is pretending there is an objective answer, when in fact it\'s a value choice.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 6, title: 'יכולות אנושיות', titleEn: 'Human Capabilities', thinker: 'אמרטיה סן', thinkerEn: 'Amartya Sen', thinkerId: 'sen', xp: 50, sections: [
          {
            type: 'idea',
            title: 'יכולות אנושיות', titleEn: 'Human Capabilities',
            content: 'ראינו את רולס, נוזיק והייק חולקים על השאלה: <strong>איזו חלוקה צודקת?</strong></p><p><strong>אמרטיה סן הציע לשנות את השאלה לגמרי.</strong></p><p>סן, הכלכלן ההודי שזכה בנובל ב-1998, טען שכל הוויכוח הקודם פספס משהו מרכזי. <strong>הוא דיבר על מה אנשים מקבלים. אבל לא על מה הם יכולים לעשות.</strong></p><p>תחשוב על שני אנשים שקיבלו אותה משכורת, 10,000 שקלים. <strong>הראשון בריא, בעל השכלה, חי בעיר עם תחבורה ציבורית.</strong> השני סובל ממחלה כרונית, בלי השכלה, גר בכפר נידח. <strong>האם החלוקה ביניהם שווה?</strong></p><p>טכנית כן. <strong>בפועל לא.</strong> הראשון יכול לעבוד, ללמוד, להתחתן, לטייל. השני בקושי משלם את הוצאות הרפואה שלו.</p><p>מכאן הרעיון של סן: <strong>צדק נמדד לא במה שיש לך, אלא במה שאתה מסוגל לעשות.</strong> הוא קרא לזה <strong>"גישת היכולות"</strong>. השאלה החשובה היא: <strong>איזה חיים אדם יכול לחיות?</strong> לא: כמה כסף הוא מחזיק.</p><p>זה משנה הכל. כי <strong>הון הוא רק אמצעי, לא מטרה.</strong> המטרה היא חיים שאדם בוחר לחיות.',
            contentEn: 'We saw Rawls, Nozick, and Hayek disagree on the question: <strong>which distribution is just?</strong></p><p><strong>Amartya Sen proposed to change the question entirely.</strong></p><p>Sen, the Indian economist who won the Nobel Prize in 1998, argued that the previous debate missed something central. <strong>It spoke about what people receive. But not about what they can do.</strong></p><p>Think about two people who received the same salary, 10,000 shekels. <strong>The first is healthy, educated, lives in a city with public transportation.</strong> The second suffers from a chronic illness, has no education, lives in a remote village. <strong>Is the distribution between them equal?</strong></p><p>Technically yes. <strong>In practice no.</strong> The first can work, study, marry, travel. The second barely pays his medical expenses.</p><p>From this comes Sen\'s idea: <strong>justice is measured not by what you have, but by what you are able to do.</strong> He called it <strong>"the capability approach."</strong> The important question is: <strong>what kind of life can a person live?</strong> Not: how much money does he hold.</p><p>This changes everything. Because <strong>wealth is just a means, not an end.</strong> The end is the life a person chooses to live.',
          },
          {
            type: 'source',
            title: 'סן: גישת היכולות', titleEn: 'Sen: The Capability Approach',
            quote: '״השאלה החשובה ביותר אינה כמה משאבים יש לאדם, אלא איזה חיים הוא מסוגל לחיות. אדם עם אותה הכנסה אך בריאות לקויה, נכות, או חוסר השכלה, אינו במצב שווה לאדם בריא ומשכיל. צדק חברתי דורש לבחון את היכולות, לא רק את האמצעים.״',
            quoteEn: '"The most important question is not how many resources a person has, but what kind of life he is able to live. A person with the same income but poor health, disability, or lack of education, is not in an equal state to a healthy and educated person. Social justice requires examining capabilities, not just means."',
            attr: 'אמרטיה סן, *פיתוח כחירות*, 1999',
            attrEn: 'Amartya Sen, *Development as Freedom*, 1999',
            content: '',
            contentEn: '',
          },
          {
            type: 'explanation',
            title: 'הסבר', titleEn: 'Explanation',
            content: 'נחשוב על אדם בכיסא גלגלים שגר במדינה עשירה. <strong>יש לו 10,000 דולר בחודש.</strong> טכנית, הוא לא עני.</p><p>אבל אם המדינה לא בנתה רמפות, מעליות, או תחבורה נגישה, <strong>הכסף שלו לא יכול לקנות לו את היכולת לצאת מהבית.</strong> אם המעסיקים לא מקבלים אנשים עם מוגבלויות, <strong>הכסף לא יכול לקנות לו עבודה.</strong></p><p>לפי כל ההוגים הקודמים, האיש הזה בסדר. <strong>הוא קיבל את חלקו ההוגן.</strong> לפי סן, <strong>לא.</strong> סן היה אומר: "אתם מתייחסים לכסף כאל מטרה. הוא רק אמצעי. <strong>השאלה היא מה אנשים יכולים לעשות עם הכסף, ולא כמה כסף יש להם.</strong>"</p><p>סן זיהה שיש יכולות בסיסיות שכל אדם צריך להיות מסוגל לממש: <strong>בריאות, חינוך, השתתפות בקהילה, חופש בחירה אמיתי.</strong> חברה צודקת, לפי סן, <strong>לא חייבת לדאוג שלכל אחד יהיה אותו דבר. אבל היא כן חייבת לדאוג שלכל אחד תהיה אותה רמה בסיסית של יכולות.</strong>',
            contentEn: 'Let\'s think about a person in a wheelchair living in a wealthy country. <strong>He has $10,000 a month.</strong> Technically, he is not poor.</p><p>But if the country didn\'t build ramps, elevators, or accessible transportation, <strong>his money cannot buy him the capability to leave his home.</strong> If employers don\'t hire people with disabilities, <strong>the money cannot buy him a job.</strong></p><p>According to all the previous thinkers, this man is fine. <strong>He received his fair share.</strong> According to Sen, <strong>no.</strong> Sen would say: "You\'re treating money as the end. It\'s just a means. <strong>The question is what people can do with the money, not how much money they have.</strong>"</p><p>Sen identified that there are basic capabilities every person should be able to realize: <strong>health, education, participation in community, real freedom of choice.</strong> A just society, according to Sen, <strong>doesn\'t have to ensure that everyone has the same thing. But it does have to ensure that everyone has the same basic level of capabilities.</strong>',
          },
          {
            type: 'depth',
            title: 'העומק שמאחורי הרעיון', titleEn: 'The Depth Behind the Idea',
            content: 'סן הציע פתרון שמשלב חלקים משלוש העמדות הקודמות.</p><p><strong>מרולס</strong> הוא לקח: יש זכויות יסוד שצריכות להיות שוות. אבל סן הגדיר אותן באופן ספציפי, כיכולות, לא כמשאבים.</p><p><strong>מנוזיק</strong> הוא לקח: חופש בחירה הוא קריטי. אבל סן הוסיף, <strong>חופש בלי יכולת הוא ריק.</strong> מה הטעם בחירות חופשית של אדם שלא יכול לקרוא?</p><p><strong>מהייק</strong> הוא לקח: אי אפשר להחליט מראש איזה חיים אנשים יבחרו. <strong>לכן ההתערבות לא צריכה להיות בחלוקת תוצאות, אלא בבניית יכולות.</strong></p><p>זו תרומה ייחודית. <strong>סן לא הציע עוד עמדה מתחרה, אלא דרך לחבר בין העמדות הקיימות.</strong>',
            contentEn: 'Sen offered a solution that combines parts from the three previous positions.</p><p><strong>From Rawls</strong> he took: there are basic rights that should be equal. But Sen defined them specifically, as capabilities, not as resources.</p><p><strong>From Nozick</strong> he took: free choice is critical. But Sen added, <strong>freedom without capability is empty.</strong> What\'s the point of free choice for a person who cannot read?</p><p><strong>From Hayek</strong> he took: it\'s impossible to decide in advance what kind of lives people will choose. <strong>Therefore intervention shouldn\'t be in distribution of outcomes, but in building capabilities.</strong></p><p>This is a unique contribution. <strong>Sen didn\'t propose another competing position, but a way to connect existing positions.</strong>',
          },
          {
            type: 'quiz',
            question: 'שני אזרחים במדינה מסוימת מקבלים מהממשלה קצבה חודשית זהה לחלוטין של 8,000 שקלים. האזרח הראשון הוא צעיר בריא ומשכיל, ואילו האזרח השני הוא קשיש סיעודי הזקוק לטיפול רפואי יקר סביב השעון. כיצד אמרטיה סן היה בוחן את מצבם הכלכלי?',
            questionEn: 'Two citizens in a certain country receive an identical monthly allowance of 8,000 shekels from the government. The first citizen is a young, healthy and educated person, while the second citizen is an elderly bedridden person requiring expensive 24-hour medical care. How would Amartya Sen examine their economic situation?',
            options: [
              'החלוקה אינה שוויונית או צודקת, כיוון שעל אף שהאמצעים הכספיים שווים, היכולת הממשית של השני לתרגם את הכסף לחיים בכבוד נמוכה בהרבה',
              'החלוקה צודקת לחלוטין, כיוון שברגע שהכסף שחולק הוא שווה, השוק החופשי יביא את שניהם לאותה נקודת יעילות',
              'החלוקה אינה צודקת, כיוון שלפי הייק המדינה לעולם אינה רשאית להעניק קצבאות שוות לאנשים בעלי כישורים שונים'
            ],
            optionsEn: [
              'The distribution is not equal or just, because although the financial means are equal, the actual ability of the second to translate the money into a life of dignity is much lower',
              'The distribution is completely just, because once the money distributed is equal, the free market will bring both to the same point of efficiency',
              'The distribution is not just, because according to Hayek the state is never entitled to provide equal allowances to people with different abilities'
            ],
            correctIndex: 0,
            explanation: 'זהו לב הטיעון של סן. כסף הוא רק אמצעי. אדם חולה זקוק להרבה יותר משאבים כדי להגיע לאותה רמת יכולת בסיסית שאדם בריא משיג בקלות. שוויון בהכנסה אינו שוויון אמיתי בחירות.',
            explanationEn: 'This is the heart of Sen\'s argument. Money is only a means. A sick person needs much more resources to reach the same basic level of capability that a healthy person achieves easily. Equality in income is not real equality in freedoms.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "הגישה של סן היא פשוט גרסה חזרתית של הסוציאליזם של מרקס. הוא רק רוצה שהמדינה תחלק את כל התוצאות הכלכליות בצורה שווה בין כולם". כיצד תערער על טענתו?',
            questionEn: 'A friend says: "Sen\'s approach is just a recycled version of Marx\'s socialism. He only wants the state to distribute all economic outcomes equally among everyone." How would you challenge his claim?',
            options: [
              'החבר צודק, סן אכן דרש לבטל את מנגנון השוק החופשי ולפקח על כל המחירים כמו אקווינס',
              'החבר טועה, כיוון שסן האמין שהמדינה לא צריכה להתערב בכלל, בהתאמה מוחלטת לעמדת נוזיק',
              'החבר טועה, סן הושפע מהייק ומנוזיק והדגיש שחופש בחירה הוא קריטי. המדינה לא צריכה להנדס את תוצאות החיים, אלא להבטיח את היכולות הבסיסיות לבחור'
            ],
            optionsEn: [
              'The friend is right, Sen did demand to abolish the free market mechanism and supervise all prices like Aquinas',
              'The friend is wrong, because Sen believed the state shouldn\'t intervene at all, in complete alignment with Nozick\'s position',
              'The friend is wrong. Sen was influenced by Hayek and Nozick and emphasized that free choice is critical. The state shouldn\'t engineer the outcomes of life, but ensure the basic capabilities to choose'
            ],
            correctIndex: 2,
            explanation: 'סן אינו סוציאליסט שמבקש שוויון בתוצאות. הוא מקבל מהייק ומנוזיק את החשיבות של חופש הבחירה. סן לא רוצה שהמדינה תחליט עבור האדם איזה חיים לחיות. הוא טוען שכדי שלחופש הזה יהיה ערך, המדינה חייבת לצייד את האדם ביכולות יסוד.',
            explanationEn: 'Sen isn\'t a socialist seeking equality of outcomes. He accepts from Hayek and Nozick the importance of free choice. Sen doesn\'t want the state to decide for the person what kind of life to live. He claims that for this freedom to have value, the state must equip the person with basic capabilities.',
          },
          {
            type: 'quiz',
            question: 'נמל תעופה מודרני מציע מערכת שלטונית מתקדמת, חנויות פטורות ממס, ומסלולים מהירים למי שמשלם כסף רב, אך אין בו אף מעלית, רמפה או שילוט נגיש לאנשים עם מוגבלויות. כיצד הגישות של פארטו וסן היו שופטות את המצב בנמל התעופה?',
            questionEn: 'A modern airport offers an advanced signage system, duty-free shops, and fast tracks for those who pay a lot of money, but it has no elevators, ramps, or accessible signage for people with disabilities. How would the approaches of Pareto and Sen judge the situation at the airport?',
            options: [
              'שניהם היו מסכימים שהמצב אינו יעיל ואינו צודק, ויש להרוס את נמל התעופה ולבנותו מחדש',
              'פארטו עשוי להגדיר את המצב כ"יעיל" (כי שינוי יפגע ברווחי החברות), בעוד שסן יגדיר אותו כ"לא צודק" כי הוא מונע מאנשים יכולת תנועה בסיסית',
              'פארטו יגדיר את המצב כלא יעיל, בעוד שסן יסכים איתו שהמצב צודק לחלוטין כל עוד העסקאות נעשו מרצון'
            ],
            optionsEn: [
              'Both would agree that the situation is neither efficient nor just, and the airport should be demolished and rebuilt',
              'Pareto might define the situation as "efficient" (because change would harm the profits of companies), while Sen would define it as "unjust" because it denies people basic capability of movement',
              'Pareto would define the situation as inefficient, while Sen would agree with him that the situation is completely just as long as transactions were made voluntarily'
            ],
            correctIndex: 1,
            explanation: 'עבור הכלכלן הפארטיאני, אם חנויות הנמל מרוויחות והנוסעים העשירים מרוצים, המערכת יכולה להיחשב יעילה. עבור סן, זהו עיוות מוסרי חריף. המערכת שוללת מקבוצה שלמה של בני אדם יכולת אנושית בסיסית של חופש תנועה והשתתפות במרחב הציבורי.',
            explanationEn: 'For the Paretian economist, if the airport shops are profitable and the wealthy passengers are satisfied, the system can be considered efficient. For Sen, this is a sharp moral distortion. The system denies an entire group of human beings the basic human capability of freedom of movement and participation in public space.',
          },
          { type: 'quiz_summary' },
        ] },
        { id: 7, title: 'סיכום: צדק כלכלי', titleEn: 'Summary: Economic Justice', thinker: 'סיכום פרק', thinkerEn: 'Chapter Summary', thinkerId: null, xp: 50, isSummary: true, sections: [
          {
            type: 'idea',
            title: 'סיכום: צדק כלכלי', titleEn: 'Summary: Economic Justice',
            content: 'התחלנו את הפרק בשאלה: <strong>האם החלוקה הכלכלית הנוכחית היא צודקת?</strong></p><p>עכשיו, אחרי שישה דיאלוגים, אנחנו רואים שזו לא שאלה אחת. <strong>זו שאלה שמתפצלת לשאלות רבות.</strong> איך מודדים צדק? לפי תהליך או תוצאה? לפי משאבים או יכולות? והאם יש בכלל תשובה אובייקטיבית?',
            contentEn: 'We began the chapter with a question: <strong>is the current economic distribution just?</strong></p><p>Now, after six dialogues, we see that this isn\'t one question. <strong>It\'s a question that splits into many.</strong> How do we measure justice? By process or outcome? By resources or capabilities? And is there even an objective answer?',
          },
          {
            type: 'source',
            isRecap: true,
            title: 'המסע שעברנו', titleEn: 'The Journey We Traveled',
            quote: '״אקווינס: יש מחיר צודק. פארטו: יעילות אינה צדק. רולס: צדק נמדד מאחורי מסך הבערות. נוזיק: צדק הוא תהליך, לא תוצאה. הייק: \'צדק חברתי\' חסר משמעות. סן: צדק הוא יכולות אנושיות.״',
            quoteEn: '"Aquinas: there is a just price. Pareto: efficiency is not justice. Rawls: justice is measured behind the veil of ignorance. Nozick: justice is process, not outcome. Hayek: \'social justice\' is meaningless. Sen: justice is human capabilities."',
            attr: 'סיכום פרק 4',
            attrEn: 'Chapter 4 Summary',
            content: '<strong>אקווינס</strong> פתח את השאלה לפני 750 שנה. הוא טען שיש "מחיר צודק" שמשקף את העלות האמיתית של ייצור, ומחיר שמנצל מצוקה הוא חטא, גם אם הוא חוקי. <strong>לא כל מה שחוקי בשוק הוא צודק.</strong></p><p><strong>פארטו</strong> ניסה להתחמק מהשאלה. הוא הציע "יעילות" כקריטריון אובייקטיבי במקום צדק. <strong>אבל יעילות יכולה לעמוד בכל חלוקה, אפילו הקיצונית ביותר.</strong></p><p><strong>רולס</strong> החזיר את שאלת הצדק למרכז. הוא הציע ניסוי מחשבתי, "מסך הבערות", שיאפשר לחשוב על צדק בלי הטיות אישיות. <strong>חברה צודקת היא חברה שגם החלש בה יכול לחיות בכבוד.</strong></p><p><strong>נוזיק</strong> הציע מסגרת הפוכה: צדק הוא בתהליך, לא בתוצאה. <strong>אם כל פעולה הייתה חופשית והוגנת, התוצאה צודקת, גם אם היא בלתי שוויונית.</strong></p><p><strong>הייק</strong> ערער על כל המסגרת. <strong>המושג "צדק חברתי" עצמו חסר משמעות,</strong> טען. השוק הוא תהליך ספונטני, ולא ניתן לכנות את תוצאתו "צודקת" או "לא צודקת".</p><p><strong>סן</strong> הציע ניסוח חדש. <strong>צדק אינו עניין של חלוקת משאבים, אלא של יכולות אנושיות.</strong> השאלה הנכונה היא לא "כמה יש לך", אלא "מה אתה יכול לעשות".',
            contentEn: '<strong>Aquinas</strong> opened the question 750 years ago. He argued that there is a "just price" reflecting the true cost of production, and that a price that exploits distress is a sin, even if it\'s legal. <strong>Not everything legal in the market is just.</strong></p><p><strong>Pareto</strong> tried to escape the question. He proposed "efficiency" as an objective criterion instead of justice. <strong>But efficiency can stand in any distribution, even the most extreme.</strong></p><p><strong>Rawls</strong> brought the question of justice back to the center. He proposed a thought experiment, "the veil of ignorance," that would allow thinking about justice without personal biases. <strong>A just society is one in which even the weakest can live with dignity.</strong></p><p><strong>Nozick</strong> proposed an opposite framework: justice is in the process, not in the outcome. <strong>If every action was free and fair, the result is just, even if it\'s unequal.</strong></p><p><strong>Hayek</strong> challenged the entire framework. <strong>The concept of "social justice" itself is meaningless,</strong> he argued. The market is a spontaneous process, and its outcome cannot be called "just" or "unjust."</p><p><strong>Sen</strong> proposed a new formulation. <strong>Justice is not about distribution of resources, but about human capabilities.</strong> The right question is not "how much do you have," but "what can you do."',
          },
          {
            type: 'explanation',
            title: 'מה למדנו בעצם', titleEn: 'What We Actually Learned',
            content: 'הוויכוח הזה לא נסגר. <strong>ואולי לא יכול להיסגר.</strong> כי כל הוגה הציג קריטריון אחר לבחינת צדק, וכל הקריטריונים לגיטימיים.</p><p><strong>מה כן השתנה</strong> הוא איך אנחנו מדברים על צדק. אחרי הפרק הזה, אי אפשר להגיד "השוק צודק" או "השוק לא צודק" באופן סתמי. <strong>חייבים לציין: לפי איזה קריטריון?</strong></p><p>זו תרומה משמעותית. הפרק הזה לא נתן לנו תשובה אחת לשאלת הצדק. <strong>הוא נתן לנו את הכלים לחשוב עליה ביושר.</strong>',
            contentEn: 'This debate is not closed. <strong>And perhaps it cannot be closed.</strong> Because each thinker presented a different criterion for examining justice, and all the criteria are legitimate.</p><p><strong>What did change</strong> is how we talk about justice. After this chapter, you cannot say "the market is just" or "the market is unjust" in a vague way. <strong>You must specify: according to which criterion?</strong></p><p>This is a significant contribution. This chapter didn\'t give us one answer to the question of justice. <strong>It gave us the tools to think about it honestly.</strong>',
          },
          {
            type: 'depth',
            title: 'השאלה לפרק הבא', titleEn: 'The Question for the Next Chapter',
            content: 'עד עכשיו, כל ההוגים בפרק הניחו דבר אחד: <strong>אנשים שוקלים את הבחירות שלהם באופן רציונלי.</strong> רולס מאחורי מסך הבערות. נוזיק במשחק וילט צ\'יימברליין. סן בבחירת חיים שראויים.</p><p>אבל מה אם זו הנחה שגויה? <strong>מה אם בני אדם לא רציונליים בכלל?</strong></p><p>זו השאלה של פרק 5: <strong>כלכלה התנהגותית.</strong> מקהנמן ועד תיילר, איך הטיות קוגניטיביות משנות את הבסיס של הכלכלה כולה.',
            contentEn: 'Until now, all the thinkers in the chapter assumed one thing: <strong>people weigh their choices rationally.</strong> Rawls behind the veil of ignorance. Nozick in the Wilt Chamberlain game. Sen in choosing lives worth living.</p><p>But what if this assumption is wrong? <strong>What if humans aren\'t rational at all?</strong></p><p>This is the question of Chapter 5: <strong>behavioral economics.</strong> From Kahneman to Thaler, how cognitive biases change the foundation of all economics.',
          },
          {
            type: 'quiz',
            question: 'אם נסכם את קווי המתאר של הפרק, איזה היגד מגדיר נכון את נקודת המחלוקת המרכזית בין ג\'ון רולס לבין רוברט נוזיק לגבי צדק כלכלי?',
            questionEn: 'If we summarize the contours of the chapter, which statement correctly defines the central point of disagreement between John Rawls and Robert Nozick regarding economic justice?',
            options: [
              'רולס טען שהשוק החופשי תמיד מגיע ליעילות מושלמת, בעוד שנוזיק דרש פיקוח על כל המחירים כמו אקווינס',
              'רולס התמקד באפיסטמולוגיה וחוסר ידע, בעוד שנוזיק ניסה לחשב את תשואת ההון ההיסטורית (r > g)',
              'רולס האמין שצדק נמדד בתוצאה הסופית וברשת הביטחון לחלש, בעוד שנוזיק האמין שצדק נמדד אך ורק בהיסטוריה של התהליך ובחופש הבחירה'
            ],
            optionsEn: [
              'Rawls argued that the free market always reaches perfect efficiency, while Nozick demanded supervision of all prices like Aquinas',
              'Rawls focused on epistemology and lack of knowledge, while Nozick tried to calculate historical capital return (r > g)',
              'Rawls believed that justice is measured by the final outcome and the safety net for the weak, while Nozick believed that justice is measured solely by the history of the process and freedom of choice'
            ],
            correctIndex: 2,
            explanation: 'זה ציר הוויכוח המרכזי של הפרק. עבור רולס, חברה אינה יכולה להיחשב צודקת אם התוצאה שלה מפקירה את החלשים ביותר. עבור נוזיק, אם המצב הושג ללא כפייה ובחירות חופשיות, התוצאה צודקת לחלוטין, וכל ניסיון לתקן אותה הוא עיוות מוסרי.',
            explanationEn: 'This is the central axis of the chapter\'s debate. For Rawls, a society cannot be considered just if its outcome abandons the weakest. For Nozick, if the situation was achieved without coercion and through free choices, the outcome is completely just, and any attempt to correct it is a moral distortion.',
          },
          {
            type: 'quiz',
            question: 'חבר אומר: "אני לא מבין את פרידריך הייק. המציאות מראה שיש פערים עצומים בשוק, אז איך הוא יכול להגיד שזה לא עוול חברתי?". כיצד תסביר לו את עמדתו של הייק על פי הסיכום?',
            questionEn: 'A friend says: "I don\'t understand Friedrich Hayek. Reality shows there are enormous gaps in the market, so how can he say it\'s not a social injustice?". How would you explain Hayek\'s position according to the summary?',
            options: [
              'הייק טען שצדק או עוול הם תכונות של התנהגות אנושית מכוונת. השוק הוא סדר ספונטני ללא מתכנן מרכזי, ולכן לייחס לו "צדק" או "רשעות" זו טעות לוגית, בדיוק כמו לגבי מזג האוויר',
              'הייק האמין שהשוק הוא אכן רשע ולא צודק, ולכן הוא קרא למדינה להלאים את כל הנכסים',
              'הייק טען שהפערים קיימים רק בגלל שהצרכנים אינם פועלים ברציונליות מושלמת'
            ],
            optionsEn: [
              'Hayek argued that justice or injustice are properties of intentional human behavior. The market is a spontaneous order without a central planner, so attributing "justice" or "evil" to it is a logical error, just like with the weather',
              'Hayek believed the market is indeed evil and unjust, so he called for the state to nationalize all assets',
              'Hayek argued that the gaps exist only because consumers don\'t act with perfect rationality'
            ],
            correctIndex: 0,
            explanation: 'זו האבחנה הייחודית של הייק. הוא אינו מכחיש את קיומם של פערים, אלא טוען שהמושג "צדק חברתי" הוא שיבוש מושגי. כיוון שאף אחד לא "החליט" את תוצאות השוק המבוזרות, אין טעם להגדיר אותן כעוול.',
            explanationEn: 'This is Hayek\'s unique distinction. He doesn\'t deny the existence of gaps, but argues that the concept of "social justice" is a conceptual distortion. Since no one "decided" the decentralized outcomes of the market, there\'s no point in defining them as injustice.',
          },
          {
            type: 'quiz',
            question: 'במאמר דעה בעיתון נכתב: "שוויון אמיתי אינו נמדד בחלוקה יבשה של קצבאות כספיות שוות לכולם, אלא ביצירת תנאי רקע המאפשרים לכל אדם, בריא או בעל מוגבלות, משכיל או חסר השכלה, לפתח את חייו וליצור לעצמו עתיד". איזה הוגה מהפרק מייצג בצורה המובהקת ביותר את השקפה זו?',
            questionEn: 'A newspaper op-ed states: "True equality is not measured by a dry distribution of equal monetary allowances to all, but by creating background conditions that enable every person, healthy or disabled, educated or uneducated, to develop their lives and create a future for themselves." Which thinker from the chapter most clearly represents this view?',
            options: [
              'וילפרדו פארטו, כיוון שהוא הגדיר את חלוקת הקצבאות כמצב שאינו אופטימלי בשוק',
              'תומאס אקווינס, כיוון שהוא קבע שקצבאות כספיות קבועות מהוות חטא דתי חמור',
              'אמרטיה סן, כיוון ש"גישת היכולות" שלו מדגישה שהכסף הוא רק אמצעי, והמטרה של חברה צודקת היא להבטיח את החופש הממשי של האדם לפעול ולתפקד'
            ],
            optionsEn: [
              'Vilfredo Pareto, because he defined the distribution of allowances as a state not optimal in the market',
              'Thomas Aquinas, because he ruled that fixed monetary allowances constitute a severe religious sin',
              'Amartya Sen, because his "capability approach" emphasizes that money is only a means, and the goal of a just society is to ensure the actual freedom of the person to act and function'
            ],
            correctIndex: 2,
            explanation: 'זה החידוש של סן. הוא מעתיק את הפוקוס מחלוקת משאבים אל חלוקת יכולות תפקוד ממשיות. חברה צודקת לפי סן לא מהנדסת את חיי האדם, אך מחויבת לוודא שיש לו את התשתית הבריאותית, החינוכית והנגישה כדי לממש את חופש הבחירה שלו בפועל.',
            explanationEn: 'This is Sen\'s innovation. He shifts the focus from distribution of resources to distribution of actual functioning capabilities. A just society according to Sen doesn\'t engineer the lives of people, but is obligated to ensure they have the health, educational, and accessibility infrastructure to actually realize their freedom of choice.',
          },
          { type: 'quiz_summary' },
        ] },
      ],
    },
    {
      id: 5,
      title: 'צמיחה ופיתוח',
      titleEn: 'Growth and Development',
      comingSoon: true,
      days: [],
    },
    {
      id: 6,
      title: 'כסף ומשברים',
      titleEn: 'Money and Crises',
      comingSoon: true,
      days: [],
    },
    {
      id: 7,
      title: 'כלכלה התנהגותית',
      titleEn: 'Behavioral Economics',
      comingSoon: true,
      days: [],
    },
    {
      id: 8,
      title: 'כלכלה ועתיד',
      titleEn: 'Economics and the Future',
      comingSoon: true,
      days: [],
    },
  ],
};
