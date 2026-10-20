import type { TestResult, User } from './db';
import { LESSONS } from './lessons';

export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export function summarize(results: TestResult[]) {
  const sorted = [...results].sort((a, b) => b.createdAt - a.createdAt);
  const typing = sorted.filter((r) => r.modeId !== 'game');
  const recent = typing.slice(0, 10);
  const today = dayKey(Date.now());
  return {
    tests: results.length,
    bestWpm: Math.max(0, ...typing.map((r) => r.wpm)),
    bestAccuracy: Math.max(0, ...typing.map((r) => r.accuracy)),
    avgWpm: avg(recent.map((r) => r.wpm)),
    avgAccuracy: avg(recent.map((r) => r.accuracy)),
    totalErrors: results.reduce((s, r) => s + r.errors, 0),
    avgErrors: avg(recent.map((r) => r.errors)),
    totalSeconds: results.reduce((s, r) => s + r.duration, 0),
    todaySeconds: results.filter((r) => dayKey(r.createdAt) === today).reduce((s, r) => s + r.duration, 0),
    todayTests: results.filter((r) => dayKey(r.createdAt) === today).length,
  };
}

export function streaks(results: TestResult[]) {
  const days = new Set(results.map((r) => dayKey(r.createdAt)));
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let current = 0;
  while (days.has(dayKey(d.getTime()))) {
    current++;
    d.setDate(d.getDate() - 1);
  }
  const sortedDays = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sortedDays) {
    const [y, m, dd] = k.split('-').map(Number);
    const cur = new Date(y, m - 1, dd, 12);
    if (prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return { current, best: Math.max(best, current) };
}

export function dailySeries(results: TestResult[], days: number) {
  const out: { label: string; value: number; key: string }[] = [];
  const map = new Map<string, number>();
  results.forEach((r) => map.set(dayKey(r.createdAt), (map.get(dayKey(r.createdAt)) ?? 0) + r.duration));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const k = dayKey(d.getTime());
    out.push({ key: k, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: Math.round(((map.get(k) ?? 0) / 60) * 10) / 10 });
  }
  return out;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export function achievements(results: TestResult[], user: User | null): Achievement[] {
  const s = summarize(results);
  const st = streaks(results);
  const passed = LESSONS.filter((l) => user?.lessons[l.id]?.passed).length;
  const list: [string, string, string, boolean][] = [
    ['first', 'First Steps', 'Complete your first test', s.tests >= 1],
    ['wpm20', 'Warming Up', 'Reach 20 WPM', s.bestWpm >= 20],
    ['wpm35', 'Exam Ready', 'Reach 35 WPM (SSC English target)', s.bestWpm >= 35],
    ['wpm50', 'Swift Fingers', 'Reach 50 WPM', s.bestWpm >= 50],
    ['wpm70', 'Speed Demon', 'Reach 70 WPM', s.bestWpm >= 70],
    ['acc98', 'Sharpshooter', '98%+ accuracy on a test of 20+ words', results.some((r) => r.accuracy >= 98 && r.totalWords >= 20 && r.modeId !== 'game')],
    ['tests10', 'Dedicated', 'Complete 10 tests', s.tests >= 10],
    ['tests50', 'Typing Machine', 'Complete 50 tests', s.tests >= 50],
    ['streak3', 'On a Roll', '3-day practice streak', st.best >= 3],
    ['streak7', 'Week Warrior', '7-day practice streak', st.best >= 7],
    ['lessons5', 'Fast Learner', 'Pass 5 lessons', passed >= 5],
    ['lessonsAll', 'Graduate', 'Pass all 16 lessons', passed >= LESSONS.length],
    ['hour', 'One Hour Club', 'Practise for 60 minutes in total', s.totalSeconds >= 3600],
    ['hindi', 'Bilingual', 'Complete a Hindi test', results.some((r) => r.lang === 'hi')],
    ['gov', 'Aspirant', 'Complete a government exam test', results.some((r) => r.modeId === 'gov-exam' || r.modeId === 'mock')],
    ['marathon', 'Marathon', 'Finish a 10+ minute timed test', results.some((r) => (r.timeLimit ?? 0) >= 600 && r.duration >= 595)],
    ['game', 'Arcade Ace', 'Score 500+ in Word Rain', results.some((r) => (r.score ?? 0) >= 500)],
  ];
  return list.map(([id, title, description, unlocked]) => ({ id, title, description, unlocked }));
}

export const keyLabel = (k: string) => (k === ' ' ? 'Space' : k);

export function topMissed(missed: Record<string, number>, n = 6) {
  return Object.entries(missed).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function tipsFor(r: TestResult): string[] {
  const tips: string[] = [];
  if (r.accuracy < 85) tips.push('Accuracy is below 85%. Slow down by about 20% — speed follows accuracy. Try Accuracy Training mode.');
  else if (r.accuracy < 95) tips.push('Good accuracy. Aim for 95%+ before pushing speed — exams deduct for mistakes.');
  else tips.push('Excellent accuracy! You can now push your pace with Speed Sprints and WPM Booster drills.');

  if (r.wpm < 20) tips.push('Keep your fingers anchored on the home row (ASDF / JKL;) and avoid looking at the keyboard. The Beginner Lessons will help.');
  else if (r.wpm < 35) tips.push('You are building momentum. SSC English needs 35 WPM — do one 5-minute timed test every day.');
  else tips.push('You are at exam-qualifying pace for most English typing tests. Build consistency with 10-minute mock tests.');

  const top = topMissed(r.missed, 4);
  if (top.length) tips.push(`Your most-missed keys: ${top.map(([k]) => keyLabel(k)).join(', ')}. Practise words containing them slowly in Custom Text mode.`);
  if (r.incorrectWords > Math.max(2, r.correctWords * 0.15)) tips.push('Many words had errors. Finish each word cleanly before pressing space — fix mistakes immediately.');
  if (r.lang === 'hi') tips.push('For Hindi, stick to one Unicode layout (Inscript or Remington GAIL) and practise matras separately.');
  return tips.slice(0, 5);
}

export function resultPath(r: TestResult) {
  if (r.lessonId) return `/app/lessons/${r.lessonId}`;
  if (r.modeId === 'game') return '/app/game';
  return `/app/practice/${r.modeId}`;
}

export const fmtDuration = (sec: number) => {
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
