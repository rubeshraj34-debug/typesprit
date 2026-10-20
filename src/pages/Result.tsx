import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, LayoutDashboard, Keyboard, Lightbulb, CircleCheck, CircleX, ArrowRight, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { getResults, type TestResult } from '../lib/db';
import { useAuth } from '../lib/auth';
import { tipsFor, topMissed, keyLabel, resultPath, fmtDuration, fmtDate } from '../lib/stats';
import { getLesson, nextLesson } from '../lib/lessons';
import { PageLoader, ErrorBox, StatTile } from '../components/ui';

export default function ResultPage() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const [result, setResult] = useState<TestResult | null>(null);
  const [all, setAll] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getResults(token)
      .then((list) => {
        if (!alive) return;
        const r = list.find((x) => x.id === id);
        if (!r) setError('Result not found. It may belong to another account or has been deleted.');
        setResult(r ?? null);
        setAll(list);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not load result.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, token]);

  if (loading) return <PageLoader label="Loading result…" />;
  if (error || !result)
    return (
      <div className="max-w-xl space-y-4">
        <ErrorBox message={error ?? 'Result not found.'} />
        <Link to="/app" className="btn bg-white">Back to dashboard</Link>
      </div>
    );

  const r = result;
  const sameMode = all.filter((x) => x.id !== r.id && (r.lessonId ? x.lessonId === r.lessonId : x.modeId === r.modeId) && x.createdAt < r.createdAt);
  const prev = sameMode[0];
  const prevBest = Math.max(0, ...sameMode.map((x) => x.wpm));
  const isPB = sameMode.length > 0 && r.wpm > prevBest;
  const delta = prev ? r.wpm - prev.wpm : null;
  const lesson = r.lessonId ? getLesson(r.lessonId) : null;
  const next = r.lessonId ? nextLesson(r.lessonId) : null;
  const missed = topMissed(r.missed, 8);
  const tips = tipsFor(r);
  const hasTarget = r.targetWpm !== undefined;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">Result · {fmtDate(r.createdAt)}</div>
          <h1 className="font-display text-2xl sm:text-3xl">{r.modeName}</h1>
        </div>
        {isPB && (
          <span className="tag bg-sun text-sm py-1 px-3"><Trophy className="w-4 h-4" /> New personal best!</span>
        )}
      </div>

      {hasTarget && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-2 border-ink shadow-brut p-4 sm:p-5 flex flex-wrap items-center gap-4 ${r.passed ? 'bg-go text-white' : 'bg-bad-soft'}`}
        >
          {r.passed ? <CircleCheck className="w-8 h-8 shrink-0" /> : <CircleX className="w-8 h-8 text-bad shrink-0" />}
          <div className="flex-1 min-w-[12rem]">
            <div className="font-display text-xl">{r.passed ? (lesson ? 'Lesson passed!' : 'Qualified!') : lesson ? 'Not passed yet' : 'Below qualifying speed'}</div>
            <div className="text-sm font-medium opacity-90">
              Target: {r.targetWpm} WPM{r.targetAccuracy ? ` and ${r.targetAccuracy}% accuracy` : ''}. You scored {Math.round(r.wpm)} WPM at {r.accuracy.toFixed(1)}%.
            </div>
          </div>
          {lesson && r.passed && next && (
            <Link to={`/app/lessons/${next.id}`} className="btn bg-white text-ink text-sm">Next: Lesson {next.num} <ArrowRight className="w-4 h-4" /></Link>
          )}
          {lesson && !r.passed && (
            <Link to={`/app/lessons/${lesson.id}`} className="btn bg-white text-sm"><RotateCcw className="w-4 h-4" /> Repeat lesson</Link>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="col-span-2 md:col-span-1 md:row-span-2 card-b bg-accent p-5 flex flex-col justify-between">
          <div className="font-mono text-xs uppercase tracking-wider font-bold">Net speed</div>
          <div>
            <div className="font-display text-7xl leading-none">{Math.round(r.wpm)}</div>
            <div className="font-bold">words per minute</div>
          </div>
          {delta !== null && (
            <div className="flex items-center gap-1 text-sm font-bold mt-2">
              {delta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs last attempt
            </div>
          )}
        </motion.div>
        <StatTile label="Accuracy" value={`${r.accuracy.toFixed(1)}%`} accent={r.accuracy >= 95 ? 'bg-go-soft' : r.accuracy >= 85 ? 'bg-white' : 'bg-bad-soft'} />
        <StatTile label="Errors" value={r.errors} sub="Wrong keystrokes" />
        <StatTile label="Time" value={fmtDuration(r.duration)} sub={r.timeLimit ? `of ${fmtDuration(r.timeLimit)}` : 'Untimed'} />
        <StatTile label="Correct words" value={r.correctWords} accent="bg-go-soft" />
        <StatTile label="Wrong words" value={r.incorrectWords} accent={r.incorrectWords ? 'bg-bad-soft' : 'bg-white'} />
        <StatTile label={r.score !== undefined ? 'Game score' : 'Raw speed'} value={r.score !== undefined ? r.score : `${Math.round(r.rawWpm)}`} sub={r.score !== undefined ? undefined : 'Gross WPM incl. errors'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-b p-5">
          <h2 className="font-display text-lg mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-accent" /> Improvement tips</h2>
          <ul className="space-y-3">
            {tips.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="w-6 h-6 shrink-0 grid place-items-center border-2 border-ink bg-sun font-bold text-xs">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-b p-5">
          <h2 className="font-display text-lg mb-3">Most-missed keys</h2>
          {missed.length ? (
            <div className="flex flex-wrap gap-2">
              {missed.map(([k, n]) => (
                <div key={k} className="border-2 border-ink shadow-brut-sm bg-bad-soft px-3 py-2 text-center min-w-[3.5rem]">
                  <div className={`font-mono font-bold text-xl ${r.lang === 'hi' ? 'font-hindi' : ''}`}>{keyLabel(k)}</div>
                  <div className="text-[0.65rem] font-mono uppercase">{n}×</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No mistakes recorded — flawless typing! 🎯</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="border-2 border-ink/15 p-2"><span className="text-muted">Characters:</span> <b>{r.chars}</b></div>
            <div className="border-2 border-ink/15 p-2"><span className="text-muted">Words judged:</span> <b>{r.totalWords}</b></div>
            <div className="border-2 border-ink/15 p-2"><span className="text-muted">Prev. best:</span> <b>{sameMode.length ? `${Math.round(prevBest)} WPM` : '—'}</b></div>
            <div className="border-2 border-ink/15 p-2"><span className="text-muted">Attempts:</span> <b>{sameMode.length + 1}</b></div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to={resultPath(r)} className="btn bg-accent"><RotateCcw className="w-4 h-4" /> Try again</Link>
        <Link to="/app/practice" className="btn bg-white"><Keyboard className="w-4 h-4" /> All modes</Link>
        <Link to="/app" className="btn bg-white"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
      </div>
    </div>
  );
}
