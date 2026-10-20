import {
  COMMON_WORDS, SHORT_WORDS, CAPITAL_WORDS, PUNCT_SENTENCES, SENTENCES, PARAGRAPHS, GOV_PASSAGES, DIFFICULT_WORDS,
  SPECIAL_TOKENS, numberGroups, keyDrill, sample, wordsFromLetters, pick,
} from './content';
import type { TestConfig } from './modes';
import type { User } from './db';

export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Lesson {
  id: string;
  num: number;
  level: Level;
  title: string;
  description: string;
  keys: string;
  targetWpm: number;
  targetAccuracy: number;
  build: () => string;
}

const L = (num: number, level: Level, title: string, description: string, keys: string, targetWpm: number, targetAccuracy: number, build: () => string): Lesson => ({
  id: `l${num}`, num, level, title, description, keys, targetWpm, targetAccuracy, build,
});

export const LESSONS: Lesson[] = [
  L(1, 'Beginner', 'Home Row · Left Hand', 'Place fingers on A S D F. Little finger on A, index on F.', 'A S D F', 8, 90,
    () => `asdf fdsa ${keyDrill('asdf', 18)} sad dad fad add`),
  L(2, 'Beginner', 'Home Row · Right Hand', 'Place fingers on J K L ;. Index finger rests on the J bump.', 'J K L ;', 8, 90,
    () => `jkl; ;lkj ${keyDrill('jkl;', 20)}`),
  L(3, 'Beginner', 'Full Home Row + G H', 'Reach G and H with your index fingers and return home.', 'A–L ; G H', 10, 90,
    () => wordsFromLetters('asdfghjkl', 26)),
  L(4, 'Beginner', 'Top Row', 'Reach up for Q W E R T Y U I O P without moving your palms.', 'Q–P', 12, 90,
    () => `qwert yuiop ${wordsFromLetters('asdfghjklqwertyuiop', 24)}`),
  L(5, 'Beginner', 'Bottom Row', 'Curl down for Z X C V B N M , . and come back to home row.', 'Z–M , .', 12, 90,
    () => `zxcvb nm,. ${keyDrill('zxcvbnm', 8)} ${wordsFromLetters('abcdefghijklmnopqrstuvwxyz', 16)}`),
  L(6, 'Beginner', 'All Letters · Short Words', 'Combine all three rows using short everyday words.', 'a–z', 15, 90,
    () => sample(SHORT_WORDS, 30).join(' ')),
  L(7, 'Intermediate', 'Capitals & Shift', 'Use the opposite hand’s Shift key for capital letters.', 'Shift', 15, 92,
    () => sample(CAPITAL_WORDS, 22).join(' ')),
  L(8, 'Intermediate', 'Punctuation Basics', 'Commas, full stops, question marks and apostrophes.', ', . ? ! \'', 18, 92,
    () => sample(PUNCT_SENTENCES, 4).join(' ')),
  L(9, 'Intermediate', 'Number Row', 'Reach the number row with the finger above each home key.', '0–9', 15, 92,
    () => numberGroups(22)),
  L(10, 'Intermediate', 'Common Words', 'The 100 most used words make up half of all text.', 'Words', 22, 93,
    () => sample(COMMON_WORDS.slice(0, 100), 40).join(' ')),
  L(11, 'Intermediate', 'Short Sentences', 'Type complete sentences with rhythm and steady pace.', 'Sentences', 24, 93,
    () => sample(SENTENCES, 4).join(' ')),
  L(12, 'Intermediate', 'Long & Tricky Words', 'Exam-style vocabulary with difficult spellings.', 'Vocabulary', 22, 93,
    () => sample(DIFFICULT_WORDS, 18).join(' ')),
  L(13, 'Advanced', 'Special Characters', 'Symbols, brackets and email-style tokens.', '@ # $ % &', 18, 93,
    () => sample(SPECIAL_TOKENS, 22).join(' ')),
  L(14, 'Advanced', 'Paragraph Practice', 'A full paragraph — keep your eyes on the screen.', 'Paragraph', 28, 94,
    () => pick(PARAGRAPHS)),
  L(15, 'Advanced', 'Speed Builder', 'Frequent words at high pace. Aim for smooth, continuous typing.', 'Speed', 32, 94,
    () => sample(COMMON_WORDS.slice(0, 120), 55).join(' ')),
  L(16, 'Advanced', 'Exam Passage', 'A real exam-style passage at SSC qualifying speed.', 'Exam', 35, 95,
    () => pick(GOV_PASSAGES)),
];

export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id);

export function isUnlocked(lesson: Lesson, user: User | null) {
  if (lesson.num === 1) return true;
  const prev = LESSONS[lesson.num - 2];
  return !!user?.lessons[prev.id]?.passed;
}

export function recommendedLesson(user: User | null) {
  return LESSONS.find((l) => isUnlocked(l, user) && !user?.lessons[l.id]?.passed) ?? null;
}

export function nextLesson(id: string) {
  const l = getLesson(id);
  return l ? LESSONS[l.num] ?? null : null;
}

export function lessonConfig(l: Lesson): TestConfig {
  return {
    modeId: 'lesson', modeName: `Lesson ${l.num} · ${l.title}`, title: `Lesson ${l.num}: ${l.title}`, subtitle: l.description,
    lang: 'en', text: l.build(), targetWpm: l.targetWpm, targetAccuracy: l.targetAccuracy, lessonId: l.id,
  };
}
