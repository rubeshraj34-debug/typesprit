import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Lock, Info } from 'lucide-react';
import TypingTest, { type FinishedStats } from '../components/TypingTest';
import { getMode, buildCustom, type TestConfig } from '../lib/modes';
import { getLesson, isUnlocked, lessonConfig, LESSONS } from '../lib/lessons';
import { saveResult } from '../lib/db';
import { useAuth } from '../lib/auth';
import { ErrorBox } from '../components/ui';
import NotFound from './NotFound';

function useSaver() {
  const { token, refresh } = useAuth();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ cfg: TestConfig; s: FinishedStats } | null>(null);

  const save = useCallback(
    async (cfg: TestConfig, s: FinishedStats) => {
      setSaving(true);
      setError(null);
      setPending({ cfg, s });
      try {
        const passed = cfg.targetWpm !== undefined ? s.wpm >= cfg.targetWpm && s.accuracy >= (cfg.targetAccuracy ?? 0) : undefined;
        const r = await saveResult(token, {
          ...s,
          modeId: cfg.modeId,
          modeName: cfg.modeName,
          lessonId: cfg.lessonId,
          lang: cfg.lang,
          timeLimit: cfg.duration,
          targetWpm: cfg.targetWpm,
          targetAccuracy: cfg.targetAccuracy,
          passed,
        });
        if (cfg.lessonId) await refresh();
        nav(`/app/result/${r.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save your result.');
        setSaving(false);
      }
    },
    [token, refresh, nav],
  );
  const retry = () => pending && save(pending.cfg, pending.s);
  return { save, saving, error, retry };
}

function Header({ back, backLabel, title, subtitle }: { back: string; backLabel: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <Link to={back} className="inline-flex items-center gap-1 text-sm font-bold hover:text-accent mb-2">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
      {subtitle && <p className="text-muted mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

export function ModeRunner() {
  const { modeId = '' } = useParams();
  const mode = getMode(modeId);
  const [opts, setOpts] = useState<Record<string, string>>(() => Object.fromEntries((mode?.options ?? []).map((g) => [g.key, g.choices[0].value])));
  const [phase, setPhase] = useState<'setup' | 'run'>(mode?.options || modeId === 'custom' ? 'setup' : 'run');
  const [seed, setSeed] = useState(0);
  const [customText, setCustomText] = useState('');
  const [customDur, setCustomDur] = useState('0');
  const [setupError, setSetupError] = useState<string | null>(null);
  const { save, saving, error, retry } = useSaver();

  const config = useMemo<TestConfig | null>(() => {
    if (!mode || phase !== 'run') return null;
    if (mode.id === 'custom') return buildCustom(customText, Number(customDur));
    return mode.build ? mode.build(opts) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, seed]);

  if (!mode) return <NotFound inApp />;
  if (mode.link) return <Navigate to={mode.link} replace />;

  const start = () => {
    if (mode.id === 'custom') {
      const words = customText.trim().split(/\s+/).filter(Boolean);
      if (words.length < 3) {
        setSetupError('Please enter at least 3 words of text to practise.');
        return;
      }
      if (customText.length > 20000) {
        setSetupError('Text is too long. Please keep it under 20,000 characters.');
        return;
      }
    }
    setSetupError(null);
    setSeed((s) => s + 1);
    setPhase('run');
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-3xl">
        <Header back="/app/practice" backLabel="All modes" title={mode.name} subtitle={mode.description} />
        <div className="card-b p-5 sm:p-6 space-y-6">
          {mode.id === 'custom' ? (
            <>
              <div>
                <label htmlFor="custom" className="font-bold block mb-2">Paste or type your text</label>
                <textarea id="custom" rows={8} className="input-b font-mono text-sm" value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Paste a passage from a previous year paper, notes, or any article… (English or Hindi Unicode)" />
                <div className="text-xs text-muted mt-1">{customText.trim() ? customText.trim().split(/\s+/).length : 0} words</div>
              </div>
              <OptionRow label="Time limit" value={customDur} onChange={setCustomDur} choices={[{ value: '0', label: 'No limit' }, { value: '60', label: '1 min' }, { value: '120', label: '2 min' }, { value: '300', label: '5 min' }]} />
            </>
          ) : (
            mode.options?.map((g) => (
              <OptionRow key={g.key} label={g.label} value={opts[g.key]} onChange={(v) => setOpts((o) => ({ ...o, [g.key]: v }))} choices={g.choices} />
            ))
          )}
          {setupError && <ErrorBox message={setupError} />}
          <div className="flex items-start gap-2 text-sm text-muted bg-cream border-2 border-ink/20 p-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            The timer starts with your first keystroke. Mistakes are highlighted in red. Press Esc to restart anytime.
          </div>
          <button onClick={start} className="btn bg-accent text-base px-6 py-3">
            <Play className="w-4 h-4" /> Start test
          </button>
        </div>
      </div>
    );
  }

  if (!config) return null;
  return (
    <div className="max-w-5xl">
      <Header back="/app/practice" backLabel="All modes" title={config.title} subtitle={config.subtitle} />
      {mode.options || mode.id === 'custom' ? (
        <button onClick={() => setPhase('setup')} className="text-sm font-bold underline mb-4 -mt-3 block">Change options</button>
      ) : null}
      {error && <div className="mb-4"><ErrorBox message={error} onRetry={retry} /></div>}
      <TypingTest key={seed} config={config} saving={saving} onFinish={(s) => save(config, s)} onNewText={mode.id === 'custom' || mode.id === 'daily' ? undefined : () => setSeed((x) => x + 1)} />
    </div>
  );
}

function OptionRow({ label, value, onChange, choices }: { label: string; value: string; onChange: (v: string) => void; choices: { value: string; label: string; hint?: string }[] }) {
  return (
    <fieldset>
      <legend className="font-bold mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            aria-pressed={value === c.value}
            className={`btn text-sm flex-col items-start gap-0 text-left ${value === c.value ? 'bg-accent' : 'bg-white'}`}
          >
            <span>{c.label}</span>
            {c.hint && <span className="text-[0.7rem] font-medium opacity-75">{c.hint}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function LessonRunner() {
  const { lessonId = '' } = useParams();
  const { user } = useAuth();
  const lesson = getLesson(lessonId);
  const [seed, setSeed] = useState(0);
  const { save, saving, error, retry } = useSaver();
  const config = useMemo(() => (lesson ? lessonConfig(lesson) : null), [lesson, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson || !config) return <NotFound inApp />;
  if (!isUnlocked(lesson, user)) {
    const prev = LESSONS[lesson.num - 2];
    return (
      <div className="max-w-xl card-b p-8 text-center">
        <Lock className="w-10 h-10 mx-auto mb-3" />
        <h1 className="font-display text-2xl">Lesson {lesson.num} is locked</h1>
        <p className="text-muted mt-2">Pass Lesson {prev.num} “{prev.title}” ({prev.targetWpm} WPM, {prev.targetAccuracy}% accuracy) to unlock it.</p>
        <Link to={`/app/lessons/${prev.id}`} className="btn bg-accent mt-5">Go to Lesson {prev.num}</Link>
      </div>
    );
  }
  const prog = user?.lessons[lesson.id];
  return (
    <div className="max-w-5xl">
      <Header back="/app/lessons" backLabel="All lessons" title={config.title} subtitle={config.subtitle} />
      <div className="flex flex-wrap gap-2 mb-5 -mt-2">
        <span className="tag bg-sun">{lesson.level}</span>
        <span className="tag bg-white">Keys: {lesson.keys}</span>
        <span className="tag bg-accent-soft">Pass: {lesson.targetWpm} WPM · {lesson.targetAccuracy}%</span>
        {prog && <span className="tag bg-go-soft">Best: {Math.round(prog.bestWpm)} WPM · {prog.attempts} attempt{prog.attempts === 1 ? '' : 's'}</span>}
      </div>
      {error && <div className="mb-4"><ErrorBox message={error} onRetry={retry} /></div>}
      <TypingTest key={seed} config={config} saving={saving} onFinish={(s) => save(config, s)} onNewText={() => setSeed((x) => x + 1)} />
    </div>
  );
}
