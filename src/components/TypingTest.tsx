import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Square, Shuffle, Keyboard, Info } from 'lucide-react';
import type { TestConfig } from '../lib/modes';
import { Spinner } from './ui';

export interface FinishedStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  correctWords: number;
  incorrectWords: number;
  totalWords: number;
  chars: number;
  duration: number;
  missed: Record<string, number>;
}

const splitWords = (t: string) => t.trim().split(/\s+/).filter(Boolean);

function compute(words: string[], typed: string, elapsed: number, final: boolean) {
  const tw = typed.split(' ');
  let correctChars = 0;
  let correctWords = 0;
  let incorrectWords = 0;
  tw.forEach((w, j) => {
    const target = words[j] ?? '';
    const complete = j < tw.length - 1 || (final && w.length > 0);
    const n = Math.min(w.length, target.length);
    for (let k = 0; k < n; k++) if (w[k] === target[k]) correctChars++;
    if (complete) {
      if (w === target) {
        correctWords++;
        if (j < tw.length - 1) correctChars++;
      } else incorrectWords++;
    }
  });
  const mins = Math.max(elapsed, 1) / 60;
  return {
    correctChars,
    correctWords,
    incorrectWords,
    wpm: elapsed > 0 ? correctChars / 5 / mins : 0,
    rawWpm: elapsed > 0 ? typed.length / 5 / mins : 0,
  };
}

const Word = memo(function Word({ target, typed, status }: { target: string; typed?: string; status: 'done' | 'active' | 'pending' }) {
  const t = typed ?? '';
  const segs: { cls: string; text: string }[] = [];
  for (let k = 0; k < target.length; k++) {
    let cls = 'text-faint';
    if (k < t.length) cls = t[k] === target[k] ? 'text-ink' : 'text-bad bg-bad-soft';
    else if (status === 'done') cls = 'text-bad/70';
    if (status === 'active' && k === t.length) segs.push({ cls: 'caret', text: '' });
    const last = segs[segs.length - 1];
    if (last && last.cls === cls) last.text += target[k];
    else segs.push({ cls, text: target[k] });
  }
  const out = segs.map((s, i) =>
    s.cls === 'caret' ? <span key={i} className="caret" /> : <span key={i} className={s.cls}>{s.text}</span>,
  );
  if (t.length > target.length) {
    out.push(
      <span key="x" className="text-bad bg-bad-soft line-through decoration-2">
        {t.slice(target.length)}
      </span>,
    );
  }
  if (status === 'active' && t.length >= target.length) out.push(<span key="ce" className="caret" />);
  const wrong = status === 'done' && t !== target;
  return (
    <span data-active={status === 'active' ? '1' : undefined} className={`inline-block mr-[0.6em] ${wrong ? 'border-b-2 border-bad' : status === 'done' ? 'border-b-2 border-transparent' : 'border-b-2 border-transparent'}`}>
      {out}
    </span>
  );
});

interface Props {
  config: TestConfig;
  onFinish: (s: FinishedStats, raw: { typed: string; keystrokes: number }) => void;
  onNewText?: () => void;
  saving?: boolean;
}

export default function TypingTest({ config, onFinish, onNewText, saving }: Props) {
  const [words, setWords] = useState(() => splitWords(config.text));
  const wordsRef = useRef(words);
  const [typed, setTyped] = useState('');
  const typedRef = useRef('');
  const [startAt, setStartAt] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const ks = useRef(0);
  const errs = useRef(0);
  const [errCount, setErrCount] = useState(0);
  const [ksCount, setKsCount] = useState(0);
  const missed = useRef<Record<string, number>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);

  const duration = config.duration;
  const elapsed = startAt ? Math.min((now - startAt) / 1000, duration ?? Infinity) : 0;
  const remaining = duration ? Math.max(0, duration - elapsed) : null;

  const reset = useCallback(() => {
    const w = splitWords(config.text);
    wordsRef.current = w;
    setWords(w);
    typedRef.current = '';
    setTyped('');
    startRef.current = null;
    setStartAt(null);
    doneRef.current = false;
    setDone(false);
    ks.current = 0;
    errs.current = 0;
    missed.current = {};
    setErrCount(0);
    setKsCount(0);
    if (boxRef.current) boxRef.current.scrollTop = 0;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [config.text]);

  const finish = useCallback(() => {
    if (doneRef.current || !startRef.current) return;
    doneRef.current = true;
    setDone(true);
    const realElapsed = (Date.now() - startRef.current) / 1000;
    const el = duration ? Math.min(realElapsed, duration) : realElapsed;
    const t = typedRef.current.replace(/ $/, '');
    const c = compute(wordsRef.current, t, el, true);
    const accuracy = ks.current ? ((ks.current - errs.current) / ks.current) * 100 : 0;
    onFinish({
      wpm: Math.round(c.wpm * 10) / 10,
      rawWpm: Math.round(c.rawWpm * 10) / 10,
      accuracy: Math.round(Math.max(0, accuracy) * 10) / 10,
      errors: errs.current,
      correctWords: c.correctWords,
      incorrectWords: c.incorrectWords,
      totalWords: c.correctWords + c.incorrectWords,
      chars: t.length,
      duration: Math.round(el * 10) / 10,
      missed: { ...missed.current },
    }, { typed: t, keystrokes: ks.current });
  }, [duration, onFinish]);

  useEffect(() => {
    if (!startAt || done) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [startAt, done]);

  useEffect(() => {
    if (duration && startAt && !done && elapsed >= duration) finish();
  }, [elapsed, duration, startAt, done, finish]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const typedWords = typed.split(' ');
  const active = typedWords.length - 1;

  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = box?.querySelector<HTMLElement>('[data-active="1"]');
    if (!box || !el) return;
    const lineH = el.offsetHeight || 40;
    const target = Math.max(0, el.offsetTop - lineH * 0.9);
    if (Math.abs(box.scrollTop - target) > 4) box.scrollTo({ top: target, behavior: 'smooth' });
  }, [active]);

  const live = useMemo(() => compute(words, typed, elapsed, false), [words, typed, elapsed]);
  const accuracy = ksCount ? Math.max(0, ((ksCount - errCount) / ksCount) * 100) : 100;

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (doneRef.current) return;
    const v = e.target.value.replace(/\r?\n/g, '');
    const prev = typedRef.current;
    if (v.length < prev.length && prev.startsWith(v)) {
      if (config.noBackspace) return;
      typedRef.current = v;
      setTyped(v);
      return;
    }
    let i = 0;
    while (i < prev.length && i < v.length && prev[i] === v[i]) i++;
    if (i < prev.length && config.noBackspace) return;
    let out = prev.slice(0, i);
    let addKs = 0;
    let addErr = 0;
    const W = wordsRef.current;
    for (const c of v.slice(i)) {
      const parts = out.split(' ');
      const wi = parts.length - 1;
      const pos = parts[wi].length;
      const target = W[wi] ?? '';
      if (c === ' ' && (pos === 0 || wi >= W.length - 1)) continue;
      const expected = pos < target.length ? target[pos] : ' ';
      addKs++;
      if (c !== expected) {
        addErr++;
        missed.current[expected] = (missed.current[expected] ?? 0) + 1;
        if (config.strict) continue;
      }
      out += c;
    }
    if (addErr && config.strict) {
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
    }
    ks.current += addKs;
    errs.current += addErr;
    setKsCount(ks.current);
    setErrCount(errs.current);
    if (!startRef.current && out.length > 0) {
      const t = Date.now();
      startRef.current = t;
      setStartAt(t);
      setNow(t);
    }
    typedRef.current = out;
    setTyped(out);

    const parts = out.split(' ');
    const wi = parts.length - 1;
    if (config.extend && wi > W.length - 40) {
      const more = splitWords(config.extend());
      wordsRef.current = [...W, ...more];
      setWords(wordsRef.current);
    }
    if (!duration && wi === W.length - 1 && parts[wi].length >= W[wi].length) {
      setTimeout(finish, 0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.preventDefault();
    if (e.key === 'Escape') {
      e.preventDefault();
      reset();
    }
    if (e.key === 'Backspace' && config.noBackspace) e.preventDefault();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const progress = duration ? elapsed / duration : Math.min(1, active / Math.max(1, words.length));
  const hi = config.lang === 'hi';
  const lowTime = remaining !== null && remaining <= 10 && startAt;

  const stats: { label: string; value: string; cls?: string }[] = [
    { label: duration ? 'Time left' : 'Elapsed', value: duration ? fmt(remaining ?? duration) : fmt(elapsed), cls: lowTime ? 'bg-bad text-white' : 'bg-sun' },
    { label: 'WPM', value: String(Math.round(live.wpm)), cls: 'bg-accent' },
    { label: 'Accuracy', value: `${Math.round(accuracy)}%`, cls: accuracy >= 95 ? 'bg-go-soft' : accuracy >= 85 ? 'bg-white' : 'bg-bad-soft' },
    { label: 'Correct', value: String(live.correctWords), cls: 'bg-white' },
    { label: 'Wrong', value: String(live.incorrectWords), cls: 'bg-white' },
    { label: 'Errors', value: String(errCount), cls: 'bg-white' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`border-2 border-ink shadow-brut-sm px-3 py-2 ${s.cls}`}>
            <div className="font-mono text-[0.62rem] uppercase tracking-wider font-bold opacity-80">{s.label}</div>
            <div className="font-display text-xl sm:text-2xl leading-tight tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="h-3 border-2 border-ink bg-white overflow-hidden" aria-label="Progress">
        <div className="h-full bg-go transition-[width] duration-200" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>

      <div
        className={`card-b relative p-4 sm:p-6 cursor-text transition-colors ${flash ? 'bg-bad-soft' : 'bg-white'}`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center gap-2 mb-3 font-mono text-[0.68rem] uppercase tracking-wider text-muted font-bold">
          <Keyboard className="w-3.5 h-3.5" /> Text to type
          {!startAt && !done && <span className="ml-auto text-accent">Timer starts on your first key</span>}
        </div>
        <div
          ref={boxRef}
          className={`relative overflow-hidden select-none ${hi ? 'font-hindi text-xl sm:text-2xl leading-[2.4]' : 'font-mono text-lg sm:text-[1.35rem] leading-[2.1]'} h-[10.2rem] sm:h-[11rem]`}
          aria-live="off"
        >
          {words.map((w, j) => (
            <Word key={j} target={w} typed={j <= active ? typedWords[j] : undefined} status={j < active ? 'done' : j === active ? 'active' : 'pending'} />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="typing-input" className="font-mono text-[0.68rem] uppercase tracking-wider font-bold text-muted flex items-center justify-between mb-1.5">
          <span>Your typing</span>
          <span className="normal-case tracking-normal font-sans text-xs">
            {config.noBackspace ? 'Backspace disabled' : 'Esc to restart'}
          </span>
        </label>
        <textarea
          id="typing-input"
          ref={inputRef}
          value={typed}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          disabled={done}
          rows={3}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          lang={hi ? 'hi' : 'en'}
          placeholder={hi ? 'यहाँ टाइप करें…' : 'Start typing here…'}
          className={`input-b resize-none ${hi ? 'font-hindi text-lg' : 'font-mono'} disabled:bg-cream`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={reset} disabled={saving} className="btn bg-white text-sm">
          <RotateCcw className="w-4 h-4" /> Restart
        </button>
        {onNewText && (
          <button onClick={onNewText} disabled={saving} className="btn bg-white text-sm">
            <Shuffle className="w-4 h-4" /> New text
          </button>
        )}
        <button onClick={finish} disabled={!startAt || done} className="btn bg-ink text-white text-sm">
          <Square className="w-4 h-4" /> End &amp; see result
        </button>
        {saving && (
          <span className="flex items-center gap-2 text-sm font-semibold ml-auto">
            <Spinner className="w-4 h-4 text-accent" /> Saving your result…
          </span>
        )}
      </div>
      {hi && (
        <p className="flex items-start gap-2 text-xs text-muted">
          <Info className="w-4 h-4 shrink-0" /> Hindi uses Unicode. Switch your keyboard to Hindi (Inscript, Remington GAIL or phonetic). Legacy Kruti Dev fonts are not supported.
        </p>
      )}
    </div>
  );
}
