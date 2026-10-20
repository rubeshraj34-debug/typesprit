import { Link } from 'react-router-dom';
import { Lock, CircleCheck, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { LESSONS, LEVELS, isUnlocked, recommendedLesson } from '../lib/lessons';

export default function Lessons() {
  const { user } = useAuth();
  const rec = recommendedLesson(user);
  const passed = LESSONS.filter((l) => user?.lessons[l.id]?.passed).length;
  const pct = (passed / LESSONS.length) * 100;
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">Learning path</div>
          <h1 className="font-display text-3xl sm:text-4xl">Lessons</h1>
          <p className="text-muted mt-1 max-w-xl">Pass each lesson’s speed and accuracy target to unlock the next. Repeat any unlocked lesson to improve your best score.</p>
        </div>
        <div className="card-b p-4 w-full lg:w-80">
          <div className="flex justify-between font-bold text-sm"><span>Course progress</span><span>{passed}/{LESSONS.length}</span></div>
          <div className="h-4 border-2 border-ink mt-2"><div className="h-full bg-go transition-all" style={{ width: `${pct}%` }} /></div>
          {rec && <Link to={`/app/lessons/${rec.id}`} className="btn bg-accent w-full mt-3 text-sm"><Sparkles className="w-4 h-4" /> Continue: Lesson {rec.num}</Link>}
        </div>
      </div>

      {LEVELS.map((lvl, li) => (
        <section key={lvl}>
          <h2 className="font-display text-xl mb-4 flex items-center gap-3">
            <span className={`tag ${li === 0 ? 'bg-go-soft' : li === 1 ? 'bg-accent-soft' : 'bg-sun'}`}>Level {li + 1}</span> {lvl}
            <span className="flex-1 h-0.5 bg-ink/15" />
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LESSONS.filter((l) => l.level === lvl).map((l) => {
              const unlocked = isUnlocked(l, user);
              const p = user?.lessons[l.id];
              const isRec = rec?.id === l.id;
              return (
                <div key={l.id} className={`card-b p-5 flex flex-col gap-3 ${!unlocked ? 'bg-cream opacity-70 shadow-none' : isRec ? 'bg-accent-soft' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-display text-3xl text-ink/25">{String(l.num).padStart(2, '0')}</span>
                    {p?.passed ? (
                      <span className="tag bg-go text-white"><CircleCheck className="w-3 h-3" /> Passed</span>
                    ) : !unlocked ? (
                      <span className="tag bg-white"><Lock className="w-3 h-3" /> Locked</span>
                    ) : isRec ? (
                      <span className="tag bg-accent">Next up</span>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-display text-lg leading-tight">{l.title}</h3>
                    <p className="text-sm text-muted mt-1">{l.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                    <span className="border-2 border-ink/20 px-1.5">{l.keys}</span>
                    <span className="border-2 border-ink/20 px-1.5">{l.targetWpm} WPM</span>
                    <span className="border-2 border-ink/20 px-1.5">{l.targetAccuracy}%</span>
                  </div>
                  {p && (
                    <div className="text-xs font-semibold text-muted">
                      Best {Math.round(p.bestWpm)} WPM · {p.bestAccuracy.toFixed(0)}% · {p.attempts} attempt{p.attempts === 1 ? '' : 's'}
                    </div>
                  )}
                  <div className="mt-auto pt-1">
                    {unlocked ? (
                      <Link to={`/app/lessons/${l.id}`} className={`btn text-sm ${p ? 'bg-white' : 'bg-ink text-white'}`}>
                        {p ? <><RotateCcw className="w-4 h-4" /> Repeat</> : <><Play className="w-4 h-4" /> Start</>}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-muted">Pass lesson {l.num - 1} to unlock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
