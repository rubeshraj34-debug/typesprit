import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Play, RotateCcw, Gamepad2, ArrowRight } from 'lucide-react';
import { COMMON_WORDS, DIFFICULT_WORDS, pick } from '../lib/content';
import { saveResult } from '../lib/db';
import { useAuth } from '../lib/auth';
import { ErrorBox, Spinner } from '../components/ui';

interface Drop {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
}

const LIVES = 3;

export default function Game() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const drops = useRef<Drop[]>([]);
  const g = useRef({ score: 0, lives: LIVES, start: 0, last: 0, spawn: 0, id: 0, ks: 0, err: 0, chars: 0, hit: 0, miss: 0, missed: {} as Record<string, number> });
  const areaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const raf = useRef(0);

  const elapsed = () => (performance.now() - g.current.start) / 1000;
  const level = () => 1 + Math.floor(elapsed() / 20);

  const end = useCallback(async () => {
    cancelAnimationFrame(raf.current);
    setPhase('over');
    const s = g.current;
    const dur = Math.max(1, (performance.now() - s.start) / 1000);
    setSaving(true);
    setError(null);
    try {
      const r = await saveResult(token, {
        modeId: 'game', modeName: 'Word Rain Game', lang: 'en',
        wpm: Math.round((s.chars / 5 / (dur / 60)) * 10) / 10,
        rawWpm: Math.round((s.ks / 5 / (dur / 60)) * 10) / 10,
        accuracy: s.ks ? Math.round(((s.ks - s.err) / s.ks) * 1000) / 10 : 0,
        errors: s.err, correctWords: s.hit, incorrectWords: s.miss, totalWords: s.hit + s.miss, chars: s.chars,
        duration: Math.round(dur * 10) / 10, score: s.score, missed: s.missed,
      });
      setSavedId(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your game.');
    } finally {
      setSaving(false);
    }
  }, [token]);

  const loop = useCallback(
    (t: number) => {
      const s = g.current;
      const dt = Math.min(0.05, (t - s.last) / 1000);
      s.last = t;
      const h = areaRef.current?.clientHeight ?? 420;
      const el = (t - s.start) / 1000;
      s.spawn -= dt;
      if (s.spawn <= 0) {
        const lvl = 1 + Math.floor(el / 20);
        const pool = lvl >= 4 ? [...COMMON_WORDS, ...DIFFICULT_WORDS.slice(0, 30)] : COMMON_WORDS.filter((w) => w.length <= 3 + lvl * 2);
        let text = pick(pool).toLowerCase();
        let guard = 0;
        while (drops.current.some((d) => d.text === text) && guard++ < 10) text = pick(pool).toLowerCase();
        drops.current.push({ id: s.id++, text, x: 4 + Math.random() * 72, y: -30, speed: 28 + el * 0.9 + Math.random() * 18 });
        s.spawn = Math.max(0.8, 2.3 - el * 0.018);
      }
      const keep: Drop[] = [];
      for (const d of drops.current) {
        d.y += d.speed * dt;
        if (d.y > h - 34) {
          s.lives--;
          s.miss++;
        } else keep.push(d);
      }
      drops.current = keep;
      force();
      if (s.lives <= 0) {
        end();
        return;
      }
      raf.current = requestAnimationFrame(loop);
    },
    [end],
  );

  const start = () => {
    cancelAnimationFrame(raf.current);
    drops.current = [];
    const now = performance.now();
    g.current = { score: 0, lives: LIVES, start: now, last: now, spawn: 0, id: 0, ks: 0, err: 0, chars: 0, hit: 0, miss: 0, missed: {} };
    setInput('');
    setSavedId(null);
    setError(null);
    setPhase('play');
    raf.current = requestAnimationFrame(loop);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onChange = (v: string) => {
    if (phase !== 'play') return;
    const s = g.current;
    const val = v.replace(/\s/g, '').toLowerCase();
    if (val.length > input.length) {
      s.ks += val.length - input.length;
      const ok = drops.current.some((d) => d.text.startsWith(val));
      if (!ok) {
        s.err++;
        const expected = drops.current.find((d) => d.text.startsWith(input))?.text[input.length];
        if (expected) s.missed[expected] = (s.missed[expected] ?? 0) + 1;
      }
    }
    const match = drops.current.filter((d) => d.text === val).sort((a, b) => b.y - a.y)[0];
    if (match) {
      drops.current = drops.current.filter((d) => d.id !== match.id);
      s.score += match.text.length * 10 * level();
      s.chars += match.text.length + 1;
      s.hit++;
      setInput('');
      return;
    }
    setInput(val);
  };

  const s = g.current;
  const el = phase === 'play' ? elapsed() : 0;
  const liveWpm = el > 2 ? Math.round(s.chars / 5 / (el / 60)) : 0;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">Typing game</div>
        <h1 className="font-display text-3xl sm:text-4xl">Word Rain</h1>
        <p className="text-muted mt-1">Type each falling word before it hits the ground. Words fall faster every 20 seconds. You have {LIVES} lives.</p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          ['Score', s.score, 'bg-accent'],
          ['Level', phase === 'ready' ? 1 : level(), 'bg-sun'],
          ['WPM', liveWpm, 'bg-white'],
        ].map(([l, v, c]) => (
          <div key={l as string} className={`border-2 border-ink shadow-brut-sm px-3 py-2 ${c}`}>
            <div className="font-mono text-[0.62rem] uppercase font-bold tracking-wider">{l}</div>
            <div className="font-display text-xl sm:text-2xl tabular-nums">{v}</div>
          </div>
        ))}
        <div className="border-2 border-ink shadow-brut-sm px-3 py-2 bg-white">
          <div className="font-mono text-[0.62rem] uppercase font-bold tracking-wider">Lives</div>
          <div className="flex gap-1 mt-1.5">
            {Array.from({ length: LIVES }).map((_, i) => (
              <Heart key={i} className={`w-5 h-5 ${i < s.lives ? 'fill-bad text-bad' : 'text-ink/20'}`} />
            ))}
          </div>
        </div>
      </div>

      <div ref={areaRef} className="relative card-b h-[360px] sm:h-[440px] overflow-hidden bg-dots" onClick={() => inputRef.current?.focus()}>
        {drops.current.map((d) => {
          const typedMatch = input && d.text.startsWith(input);
          return (
            <div key={d.id} className={`absolute font-mono font-bold text-base sm:text-lg px-2 py-0.5 border-2 border-ink whitespace-nowrap ${typedMatch ? 'bg-accent shadow-brut-sm z-10' : 'bg-white'}`} style={{ left: `${d.x}%`, top: d.y }}>
              {typedMatch ? (
                <>
                  <span className="text-ink">{d.text.slice(0, input.length)}</span>
                  <span className="text-ink/50">{d.text.slice(input.length)}</span>
                </>
              ) : (
                d.text
              )}
            </div>
          );
        })}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-bad/15 border-t-2 border-dashed border-bad" />

        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center bg-white/85 p-4">
            <div className="card-b p-6 text-center max-w-sm w-full">
              {phase === 'ready' ? (
                <>
                  <Gamepad2 className="w-10 h-10 mx-auto" />
                  <h2 className="font-display text-2xl mt-2">Ready?</h2>
                  <p className="text-sm text-muted mt-1">Type a word exactly to destroy it. No need to press space.</p>
                  <button onClick={start} className="btn bg-accent mt-4"><Play className="w-4 h-4" /> Start game</button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-3xl">Game over</h2>
                  <div className="font-display text-5xl text-accent mt-2">{s.score}</div>
                  <p className="text-sm text-muted">{s.hit} words · {Math.round(s.chars / 5 / (Math.max(1, (s.last - s.start) / 1000) / 60))} WPM</p>
                  {saving && <p className="flex items-center justify-center gap-2 text-sm mt-3"><Spinner className="w-4 h-4" /> Saving…</p>}
                  {error && <div className="mt-3 text-left"><ErrorBox message={error} /></div>}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button onClick={start} className="btn bg-accent text-sm"><RotateCcw className="w-4 h-4" /> Play again</button>
                    {savedId && <button onClick={() => nav(`/app/result/${savedId}`)} className="btn bg-white text-sm">Result <ArrowRight className="w-4 h-4" /></button>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        disabled={phase !== 'play'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={phase === 'play' ? 'Type the falling words…' : 'Press Start to play'}
        className="input-b font-mono text-lg disabled:bg-cream"
        aria-label="Type falling words"
      />
      <p className="text-sm text-muted">Want structured practice instead? <Link to="/app/practice" className="font-bold underline">Browse all modes</Link></p>
    </div>
  );
}
