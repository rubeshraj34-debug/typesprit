export type Rng = () => number;

export const pick = <T,>(arr: T[], rng: Rng = Math.random): T => arr[Math.floor(rng() * arr.length)];

export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number, rng: Rng = Math.random): T[] {
  const out: T[] = [];
  let pool = shuffle(arr, rng);
  while (out.length < n) {
    if (pool.length === 0) pool = shuffle(arr, rng);
    out.push(pool.pop() as T);
  }
  return out;
}

export function seeded(seedStr: string): Rng {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const COMMON_WORDS = (
  'the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is was are has had been more very great much where through long find here thing many still own tell world life hand place same why help house home small change number part end point state school study play water money every head line need move feel high late kind light right turn real try ask city nation team plan word open show close hard start fast speed type key test result power learn exam paper class level public order office market train river green field paper report bank rule form board voice clear early simple strong value village farmer budget court police health'
).split(/\s+/).filter(Boolean);

export const SHORT_WORDS = COMMON_WORDS.filter((w) => w.length <= 5);

export const HOME_ROW_WORDS = 'as ask sad dad fad lad all fall hall gall flask salad glass alas lass dash gash hash flash shall half jag lag sag has had gas slag flag glad add ads fads lads lags gags hags asks dahl salsa alfalfa' .split(' ');

export const DIFFICULT_WORDS = 'accommodate bureaucracy conscientious entrepreneur phenomenon rhythm surveillance questionnaire pharmaceutical parliamentary jurisdiction infrastructure acknowledgement miscellaneous privilege occurrence reconnaissance idiosyncrasy liaison maintenance millennium necessary perseverance pronunciation recommend embarrass harass guarantee hierarchy indispensable irresistible constitutional commissioner municipality administrative superintendent lieutenant colonel psychology hypothesis archipelago bourgeois connoisseur disciplinary exaggerate fluorescent gauge handkerchief mischievous occasionally playwright quarantine rhinoceros silhouette threshold vacuum Wednesday xylophone accountability unprecedented entrepreneurship rehabilitation decentralisation'.split(' ');

export const CAPITAL_WORDS = 'India Delhi Mumbai Kolkata Chennai Bengaluru Hyderabad Pune Jaipur Lucknow Patna Bhopal Ganga Yamuna Himalaya Parliament Constitution Supreme Court Reserve Bank Railways Monday Tuesday Friday January March August October Gandhi Nehru Tagore Kalam Ashoka Akbar Kerala Punjab Bihar Assam Odisha Gujarat'.split(' ');

export const SENTENCES = [
  'Practice every day and your typing speed will improve steadily.',
  'The Indian Railways is one of the largest rail networks in the world.',
  'A good typist keeps both eyes on the screen and not on the keyboard.',
  'Accuracy matters more than speed in most government typing tests.',
  'The Constitution of India came into force on 26 January 1950.',
  'Small daily efforts lead to big results over time.',
  'Keep your wrists relaxed and your fingers resting on the home row.',
  'The monsoon brings much-needed rain to farmers across the country.',
  'Digital India aims to make government services available online.',
  'Read the passage carefully before you begin typing in the exam.',
  'Every candidate must complete the skill test within the given time.',
  'Clean and correct work always creates a good impression.',
  'The Reserve Bank of India regulates the monetary policy of the country.',
  'Discipline, patience and practice are the keys to success.',
  'Our village library opens at nine in the morning on weekdays.',
  'Typing without looking at the keys is called touch typing.',
  'The quick brown fox jumps over the lazy dog near the riverbank.',
  'Public servants must work with honesty, fairness and dedication.',
  'A strong vocabulary helps you type faster and with fewer mistakes.',
  'Many students prepare for staff selection exams after graduation.',
  'Please submit your application form before the last date.',
  'Technology has changed the way offices store and share files.',
  'Clean drinking water is a basic need of every citizen.',
  'Sit up straight and keep the screen at eye level while typing.',
  'Consistency beats intensity when building any new skill.',
];

export const PUNCT_SENTENCES = [
  "Wait, are you ready? Let's begin!",
  'Yes, the exam starts at 10:30 a.m. sharp.',
  "Ravi's notebook, Priya's pen and Amit's bag are here.",
  'Stop! Check your answer; then move on.',
  'Well, that was quick, wasn\'t it?',
  'First, read. Second, type. Third, review.',
  '"Practice daily," said the teacher.',
  'Is it Monday, Tuesday or Wednesday?',
];

export const PARAGRAPHS = [
  'India is a land of great diversity. People speak many languages, follow different traditions and celebrate a wide range of festivals. Yet a common spirit binds the nation together. This unity in diversity is the true strength of our country, and it is reflected in our art, music, food and way of life.',
  'Computers have become an essential part of every office. From banks to railway stations, most records are now maintained digitally. For this reason, typing has become a basic skill for anyone who wants a career in administration. A person who can type quickly and accurately saves time and reduces errors in important documents.',
  'The habit of reading is one of the best gifts a student can develop. Books open doors to new ideas, improve vocabulary and sharpen thinking. A student who reads regularly finds it easier to write clearly and express thoughts with confidence. Even twenty minutes of reading every day can make a remarkable difference.',
  'Agriculture remains the backbone of the Indian economy. A large part of the population depends on farming for its livelihood. Modern methods such as drip irrigation, soil testing and improved seeds are helping farmers increase their yield. Timely credit and fair prices are also important for the welfare of rural families.',
  'Good health is the foundation of a happy life. Regular exercise, a balanced diet and enough sleep keep the body fit and the mind alert. Students preparing for competitive exams often ignore their health, but a short walk and simple stretching can improve concentration and reduce stress during long study hours.',
  'The growth of the internet has changed the way people communicate, learn and work. Information that once took days to reach us is now available in seconds. However, it is important to use the internet responsibly, verify facts before sharing them and protect personal data from misuse.',
  'Time management is a skill that every successful person learns. Making a daily plan, setting clear priorities and avoiding distractions help us complete tasks on time. When we respect time, we reduce last-minute pressure and find space for rest, family and hobbies as well.',
  'Clean energy is the need of the hour. Solar and wind power can reduce our dependence on coal and help fight air pollution. Many villages in India now use solar panels to light homes and run water pumps. Such efforts protect the environment and create new jobs for young people.',
];

export const GOV_PASSAGES = [
  'The Government of India has launched several schemes to promote financial inclusion among the poor and the weaker sections of society. Under these schemes, millions of bank accounts have been opened, and the benefits of various welfare programmes are now transferred directly into the accounts of beneficiaries. This has reduced leakages, improved transparency and ensured that the assistance reaches the right person at the right time. Digital payments have also grown rapidly, making transactions faster and more secure. However, awareness and digital literacy remain important challenges, particularly in remote rural areas, where many citizens still depend on cash for their daily needs.',
  'Public administration plays a vital role in the development of a nation. Efficient officers ensure that policies made by the government are implemented properly at every level. Good governance requires accountability, transparency and responsiveness to the needs of the people. The use of information technology in offices has simplified many procedures, and citizens can now apply for certificates, pay bills and track complaints online. A well-trained workforce with strong computer skills is therefore essential for delivering quality services to the public in a timely manner.',
  'The Indian judiciary is regarded as the guardian of the Constitution and the protector of fundamental rights. The Supreme Court stands at the apex of the judicial system, followed by the High Courts in the states and the subordinate courts at the district level. Courts handle a large number of cases every year, and the timely disposal of these cases is a major concern. The introduction of electronic filing, video conferencing and digital case records has helped in reducing delays and making the justice delivery system more accessible to ordinary citizens.',
  'Education is the most powerful tool for social and economic change. The government has taken many steps to improve access to quality education, including the construction of new schools, the training of teachers and the provision of free textbooks and midday meals. Skill development programmes are also being run to prepare young people for employment in a changing economy. When every child receives a good education, the nation becomes stronger, more productive and better prepared to face the challenges of the future.',
];

export const HINDI_PARAGRAPHS = [
  'भारत एक विशाल देश है। यहाँ अनेक भाषाएँ बोली जाती हैं और विभिन्न धर्मों के लोग एक साथ रहते हैं। हमारी संस्कृति बहुत प्राचीन और समृद्ध है। देश की प्रगति के लिए शिक्षा और परिश्रम दोनों आवश्यक हैं।',
  'कंप्यूटर आज के युग की सबसे महत्वपूर्ण आवश्यकता बन गया है। सरकारी कार्यालयों में अधिकांश काम अब कंप्यूटर पर किया जाता है। इसलिए टाइपिंग का ज्ञान हर विद्यार्थी के लिए उपयोगी है। नियमित अभ्यास से गति और शुद्धता दोनों बढ़ती हैं।',
  'समय का सदुपयोग जीवन में सफलता की कुंजी है। जो व्यक्ति समय का महत्व समझता है वह हर लक्ष्य प्राप्त कर सकता है। विद्यार्थियों को प्रतिदिन एक निश्चित समय पर पढ़ाई करनी चाहिए।',
  'स्वच्छ भारत अभियान का उद्देश्य देश को साफ और स्वस्थ बनाना है। हर नागरिक का कर्तव्य है कि वह अपने आसपास सफाई रखे। गंदगी से अनेक रोग फैलते हैं।',
  'पर्यावरण की रक्षा करना हम सभी की जिम्मेदारी है। पेड़ हमें शुद्ध वायु देते हैं और वर्षा लाने में सहायक होते हैं। हमें अधिक से अधिक पेड़ लगाने चाहिए और जल का संरक्षण करना चाहिए।',
];

export const HINDI_WORDS = 'भारत देश समय कार्य सरकार विद्यार्थी परीक्षा अभ्यास गति शुद्धता कंप्यूटर कार्यालय नागरिक जीवन सफलता शिक्षा भाषा संस्कृति पानी पेड़ किसान गाँव शहर विकास योजना न्याय अधिकार कर्तव्य समाज परिवार मित्र पुस्तक विद्यालय अध्यापक प्रश्न उत्तर लक्ष्य परिश्रम स्वास्थ्य सुरक्षा'.split(' ');

export const SPECIAL_TOKENS = [
  'user@mail.com', '#exam2026', '50%', 'Rs.500', '(a+b)', 'x=y*2', 'first_name', 'C++', '[1]', '{key}', '<div>', 'a/b',
  '$100', 'A&B', '!done', '2^8', '~/home', 'path\\file', 'a-b', 'q?', '"hi"', "it's", 'a:b;', 'x|y', 'v1.2.3', '@admin',
  '#', '%', '&&', '||', '->', '=>', '==', '!=', '<=', '>=', '+=', '*', '(1)', '[a]', '{}', '@#$', '%^&*', '_+_',
];

export const PHRASES = 'of the|in the|to the|and the|on the|for the|it is|to be|at the|with the|from the|this is|that the|by the|as a|is a|has been|will be|there are|one of the|as well as|in order to|at the same time|on the other hand|as soon as'.split('|');

export const BIGRAM_DRILLS = 'th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se ha as ou io le ve co me de hi ri ro ic ne ea ra ce'.split(' ');

export function numberGroups(n: number, rng: Rng = Math.random) {
  const out: string[] = [];
  const d = (len: number) => Array.from({ length: len }, () => Math.floor(rng() * 10)).join('');
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rng() * 6);
    if (k === 0) out.push(String(1 + Math.floor(rng() * 9)) + d(Math.floor(rng() * 4)));
    else if (k === 1) out.push(`${1 + Math.floor(rng() * 999)}.${d(2)}`);
    else if (k === 2) out.push(`${1 + Math.floor(rng() * 99)},${d(3)}`);
    else if (k === 3) out.push(`${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}/${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}/20${d(2)}`);
    else if (k === 4) out.push(d(3) + '-' + d(4));
    else out.push(d(2 + Math.floor(rng() * 3)));
  }
  return out.join(' ');
}

export function keyDrill(keys: string, n: number, rng: Rng = Math.random) {
  const chars = keys.replace(/\s/g, '').split('');
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const len = 2 + Math.floor(rng() * 4);
    out.push(Array.from({ length: len }, () => pick(chars, rng)).join(''));
  }
  return out.join(' ');
}

export function wordsFromLetters(letters: string, n: number) {
  const set = new Set(letters.split(''));
  const pool = [...COMMON_WORDS, ...HOME_ROW_WORDS].filter((w) => w.split('').every((c) => set.has(c)));
  const uniq = [...new Set(pool)];
  if (uniq.length < 8) return keyDrill(letters, n);
  return sample(uniq, n).join(' ');
}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
