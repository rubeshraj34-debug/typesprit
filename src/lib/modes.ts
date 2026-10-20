import type { LucideIcon } from 'lucide-react';
import {
  GraduationCap, Hand, CaseSensitive, Type, Rows3, FileText, Languages, Landmark, Timer, Target, Zap, Hash,
  AtSign, Brain, CalendarDays, Gamepad2, PenLine, TrendingUp, ClipboardCheck, BookOpen,
} from 'lucide-react';
import {
  COMMON_WORDS, SHORT_WORDS, HOME_ROW_WORDS, DIFFICULT_WORDS, SENTENCES, PARAGRAPHS, GOV_PASSAGES, HINDI_PARAGRAPHS,
  HINDI_WORDS, SPECIAL_TOKENS, PHRASES, BIGRAM_DRILLS, numberGroups, keyDrill, sample, pick, shuffle, seeded, todayKey,
} from './content';

export type Lang = 'en' | 'hi';

export interface TestConfig {
  modeId: string;
  modeName: string;
  title: string;
  subtitle?: string;
  text: string;
  extend?: () => string;
  duration?: number;
  strict?: boolean;
  noBackspace?: boolean;
  lang: Lang;
  targetWpm?: number;
  targetAccuracy?: number;
  lessonId?: string;
}

export interface OptionGroup {
  key: string;
  label: string;
  choices: { value: string; label: string; hint?: string }[];
}

export type Category = 'Foundations' | 'Practice' | 'Exams & Tests' | 'Training' | 'Fun & Custom';

export interface ModeDef {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: LucideIcon;
  link?: string;
  options?: OptionGroup[];
  tag?: string;
  build?: (o: Record<string, string>) => TestConfig;
}

export const CATEGORIES: Category[] = ['Foundations', 'Practice', 'Exams & Tests', 'Training', 'Fun & Custom'];

const paragraphsEn = (n: number) => sample(PARAGRAPHS, n).join(' ');
const moreParagraph = () => pick(PARAGRAPHS);
const moreGov = () => pick(GOV_PASSAGES);
const moreHindi = () => pick(HINDI_PARAGRAPHS);

const durationGroup = (mins: number[]): OptionGroup => ({
  key: 'duration',
  label: 'Duration',
  choices: mins.map((m) => ({ value: String(m * 60), label: `${m} min` })),
});

export const GOV_EXAMS: Record<string, { label: string; lang: Lang; wpm: number; mins: number; note: string }> = {
  'ssc-en': { label: 'SSC CHSL / CGL — English', lang: 'en', wpm: 35, mins: 10, note: '35 WPM · 10 min' },
  'ssc-hi': { label: 'SSC CHSL / CGL — Hindi', lang: 'hi', wpm: 30, mins: 10, note: '30 WPM · 10 min' },
  'rrb-en': { label: 'RRB NTPC — English', lang: 'en', wpm: 30, mins: 10, note: '30 WPM · 10 min' },
  'rrb-hi': { label: 'RRB NTPC — Hindi', lang: 'hi', wpm: 25, mins: 10, note: '25 WPM · 10 min' },
  'court-en': { label: 'Court Clerk style — English', lang: 'en', wpm: 40, mins: 10, note: '40 WPM · 10 min' },
};

export const MODES: ModeDef[] = [
  {
    id: 'beginner', name: 'Beginner Lessons', category: 'Foundations', icon: GraduationCap, link: '/app/lessons', tag: '16 lessons',
    description: 'Step-by-step course from home row to exam passages. Unlocks as you improve.',
  },
  {
    id: 'home-row', name: 'Home-Row Fingers', category: 'Foundations', icon: Hand,
    description: 'Anchor your fingers on A S D F — J K L ; with real home-row words and drills.',
    build: () => ({
      modeId: 'home-row', modeName: 'Home-Row Fingers', title: 'Home-Row Finger Practice', lang: 'en',
      subtitle: 'Left: A S D F · Right: J K L ; · Index fingers rest on F and J bumps',
      text: shuffle([...sample(HOME_ROW_WORDS, 26), ...keyDrill('asdfjkl;', 10).split(' ')]).join(' '),
    }),
  },
  {
    id: 'alphabet', name: 'Alphabet Practice', category: 'Foundations', icon: CaseSensitive,
    description: 'Type A to Z in order, in pairs and in random sets to learn every key position.',
    build: () => {
      const az = 'abcdefghijklmnopqrstuvwxyz';
      const pairs = az.match(/.{1,2}/g)!.join(' ');
      const rand = keyDrill(az, 12);
      return { modeId: 'alphabet', modeName: 'Alphabet Practice', title: 'Alphabet Practice', lang: 'en', text: `${az} ${pairs} ${rand}` };
    },
  },
  {
    id: 'words', name: 'Word Typing', category: 'Practice', icon: Type,
    description: 'High-frequency English words to build natural finger flow.',
    options: [{ key: 'count', label: 'Words', choices: [{ value: '25', label: '25 words' }, { value: '50', label: '50 words' }, { value: '100', label: '100 words' }] }],
    build: (o) => ({
      modeId: 'words', modeName: 'Word Typing', title: `Word Typing · ${o.count} words`, lang: 'en',
      text: sample(COMMON_WORDS, Number(o.count)).join(' '),
    }),
  },
  {
    id: 'sentences', name: 'Sentence Typing', category: 'Practice', icon: Rows3,
    description: 'Full sentences with capitals and punctuation, just like real documents.',
    build: () => ({ modeId: 'sentences', modeName: 'Sentence Typing', title: 'Sentence Typing', lang: 'en', text: sample(SENTENCES, 5).join(' ') }),
  },
  {
    id: 'paragraph', name: 'Paragraph Typing', category: 'Practice', icon: FileText,
    description: 'Complete paragraphs on Indian themes — economy, health, technology and more.',
    build: () => ({ modeId: 'paragraph', modeName: 'Paragraph Typing', title: 'Paragraph Typing', lang: 'en', text: paragraphsEn(1) }),
  },
  {
    id: 'hindi', name: 'Hindi Typing', category: 'Practice', icon: Languages, tag: 'हिंदी',
    description: 'Unicode Hindi practice (Inscript / Remington GAIL / phonetic keyboards).',
    options: [{
      key: 'content', label: 'Content', choices: [
        { value: 'words', label: 'Words', hint: '30 common words' },
        { value: 'paragraph', label: 'Paragraph', hint: 'Complete 2 passages' },
        { value: 'timed', label: 'Timed 2 min', hint: 'Continuous text' },
      ],
    }],
    build: (o) => {
      const base = { modeId: 'hindi', modeName: 'Hindi Typing', lang: 'hi' as Lang, subtitle: 'Enable a Hindi (Unicode) keyboard on your device before starting.' };
      if (o.content === 'words') return { ...base, title: 'Hindi Words', text: sample(HINDI_WORDS, 30).join(' ') };
      if (o.content === 'timed') return { ...base, title: 'Hindi Timed · 2 min', text: sample(HINDI_PARAGRAPHS, 3).join(' '), extend: moreHindi, duration: 120 };
      return { ...base, title: 'Hindi Paragraph', text: sample(HINDI_PARAGRAPHS, 2).join(' ') };
    },
  },
  {
    id: 'english-test', name: 'English Typing Test', category: 'Exams & Tests', icon: BookOpen,
    description: 'Standard English speed test on fresh passages. Pick 1, 2 or 5 minutes.',
    options: [durationGroup([1, 2, 5])],
    build: (o) => ({
      modeId: 'english-test', modeName: 'English Typing Test', title: `English Typing Test · ${Number(o.duration) / 60} min`, lang: 'en',
      text: paragraphsEn(3), extend: moreParagraph, duration: Number(o.duration),
    }),
  },
  {
    id: 'gov-exam', name: 'Govt. Exam Tests', category: 'Exams & Tests', icon: Landmark, tag: 'SSC · RRB',
    description: 'Exam-pattern passages with qualifying speed targets for SSC, RRB and court exams.',
    options: [{ key: 'exam', label: 'Exam pattern', choices: Object.entries(GOV_EXAMS).map(([value, e]) => ({ value, label: e.label, hint: e.note })) }],
    build: (o) => {
      const e = GOV_EXAMS[o.exam];
      const hi = e.lang === 'hi';
      return {
        modeId: 'gov-exam', modeName: `Govt. Exam · ${e.label}`, title: e.label, lang: e.lang,
        subtitle: `Qualifying target: ${e.wpm} WPM. Patterns vary by notification — always check the official notice.`,
        text: hi ? sample(HINDI_PARAGRAPHS, 4).join(' ') : sample(GOV_PASSAGES, 2).join(' '),
        extend: hi ? moreHindi : moreGov, duration: e.mins * 60, targetWpm: e.wpm,
      };
    },
  },
  {
    id: 'timed', name: 'Timed Tests', category: 'Exams & Tests', icon: Timer, tag: '1–15 min',
    description: 'Endurance tests of 1, 2, 5, 10 or 15 minutes. Timer starts on your first key.',
    options: [durationGroup([1, 2, 5, 10, 15])],
    build: (o) => ({
      modeId: 'timed', modeName: `Timed Test · ${Number(o.duration) / 60} min`, title: `Timed Test · ${Number(o.duration) / 60} minutes`, lang: 'en',
      text: shuffle([...PARAGRAPHS, ...GOV_PASSAGES]).slice(0, 3).join(' '), extend: () => pick([...PARAGRAPHS, ...GOV_PASSAGES]),
      duration: Number(o.duration),
    }),
  },
  {
    id: 'mock', name: 'Full Mock Test', category: 'Exams & Tests', icon: ClipboardCheck,
    description: 'Full-length exam simulation with optional backspace lock, in English or Hindi.',
    options: [
      { key: 'lang', label: 'Language', choices: [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }] },
      durationGroup([10, 15]),
      { key: 'backspace', label: 'Backspace', choices: [{ value: 'on', label: 'Allowed' }, { value: 'off', label: 'Disabled', hint: 'Strict exam mode' }] },
    ],
    build: (o) => {
      const hi = o.lang === 'hi';
      return {
        modeId: 'mock', modeName: `Full Mock · ${hi ? 'Hindi' : 'English'}`, title: `Full Mock Test · ${hi ? 'Hindi' : 'English'} · ${Number(o.duration) / 60} min`,
        lang: hi ? 'hi' : 'en', duration: Number(o.duration), noBackspace: o.backspace === 'off', targetWpm: hi ? 30 : 35,
        subtitle: o.backspace === 'off' ? 'Backspace is disabled. Type carefully.' : 'Backspace is allowed.',
        text: hi ? sample(HINDI_PARAGRAPHS, 5).join(' ') : sample(GOV_PASSAGES, 3).join(' '), extend: hi ? moreHindi : moreGov,
      };
    },
  },
  {
    id: 'accuracy', name: 'Accuracy Training', category: 'Training', icon: Target,
    description: 'Wrong keys are blocked — you must hit the correct key to move forward.',
    build: () => ({
      modeId: 'accuracy', modeName: 'Accuracy Training', title: 'Accuracy Training', lang: 'en', strict: true,
      subtitle: 'Strict mode: incorrect keystrokes are rejected and counted as errors.',
      text: sample(SENTENCES, 3).join(' '),
    }),
  },
  {
    id: 'speed', name: 'Speed Sprints', category: 'Training', icon: Zap,
    description: '30-second bursts of short words. Push your top speed in short intervals.',
    build: () => ({
      modeId: 'speed', modeName: 'Speed Sprint', title: 'Speed Sprint · 30 seconds', lang: 'en', duration: 30,
      text: sample(SHORT_WORDS, 60).join(' '), extend: () => sample(SHORT_WORDS, 30).join(' '),
    }),
  },
  {
    id: 'wpm-drills', name: 'WPM Booster', category: 'Training', icon: TrendingUp,
    description: '60-second drills of frequent words, letter pairs and phrases that raise WPM fastest.',
    options: [{
      key: 'drill', label: 'Drill', choices: [
        { value: 'top', label: 'Top words' }, { value: 'bigrams', label: 'Letter pairs' }, { value: 'phrases', label: 'Common phrases' },
      ],
    }],
    build: (o) => {
      const gen = () =>
        o.drill === 'bigrams' ? sample(BIGRAM_DRILLS, 40).map((b) => b + b).join(' ')
          : o.drill === 'phrases' ? sample(PHRASES, 20).join(' ')
            : sample(COMMON_WORDS.slice(0, 60), 40).join(' ');
      return { modeId: 'wpm-drills', modeName: 'WPM Booster', title: 'WPM Booster · 60 seconds', lang: 'en', duration: 60, text: gen(), extend: gen };
    },
  },
  {
    id: 'numbers', name: 'Number Typing', category: 'Training', icon: Hash,
    description: 'Amounts, dates, phone-style and decimal numbers using the top number row.',
    build: () => ({ modeId: 'numbers', modeName: 'Number Typing', title: 'Number Typing', lang: 'en', text: numberGroups(30) }),
  },
  {
    id: 'special', name: 'Special Characters', category: 'Training', icon: AtSign,
    description: 'Emails, symbols, brackets and operators — master the Shift key.',
    build: () => ({ modeId: 'special', modeName: 'Special Characters', title: 'Special Character Practice', lang: 'en', text: sample(SPECIAL_TOKENS, 30).join(' ') }),
  },
  {
    id: 'difficult', name: 'Difficult Words', category: 'Training', icon: Brain,
    description: 'Tricky spellings often seen in exam passages: bureaucracy, jurisdiction, liaison…',
    build: () => ({ modeId: 'difficult', modeName: 'Difficult Words', title: 'Difficult Word Practice', lang: 'en', text: sample(DIFFICULT_WORDS, 25).join(' ') }),
  },
  {
    id: 'daily', name: 'Daily Challenge', category: 'Fun & Custom', icon: CalendarDays, tag: 'New daily',
    description: 'One fresh challenge every day. Same text all day — beat your own score.',
    build: () => {
      const rng = seeded('daily-' + todayKey());
      const text = [pick(PARAGRAPHS, rng), ...sample(SENTENCES, 2, rng), sample(DIFFICULT_WORDS, 5, rng).join(' ')].join(' ');
      return { modeId: 'daily', modeName: 'Daily Challenge', title: `Daily Challenge · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, lang: 'en', text };
    },
  },
  {
    id: 'game', name: 'Word Rain Game', category: 'Fun & Custom', icon: Gamepad2, link: '/app/game',
    description: 'Type falling words before they hit the ground. Gets faster as you score.',
  },
  {
    id: 'custom', name: 'Custom Text', category: 'Fun & Custom', icon: PenLine,
    description: 'Paste any passage — notes, previous year papers, articles — and practise it.',
  },
];

export const getMode = (id: string) => MODES.find((m) => m.id === id);

export function buildCustom(text: string, duration: number): TestConfig {
  return {
    modeId: 'custom', modeName: 'Custom Text', title: 'Custom Text Practice',
    lang: /[\u0900-\u097F]/.test(text) ? 'hi' : 'en',
    text: text.replace(/\s+/g, ' ').trim(),
    duration: duration > 0 ? duration : undefined,
  };
}
