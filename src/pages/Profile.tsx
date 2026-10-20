import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Lock, Save, ChevronRight, History, Trash2, CircleCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useResults } from '../lib/useResults';
import { updateProfile, deleteAllResults } from '../lib/db';
import { summarize, streaks, achievements, dailySeries, fmtDuration, fmtDate } from '../lib/stats';
import { LESSONS } from '../lib/lessons';
import { PageLoader, ErrorBox, EmptyState, StatTile, SectionTitle, Spinner } from '../components/ui';
import { LineChart, BarChart } from '../components/Charts';

export default function Profile() {
  const { user, token, setUser } = useAuth();
  const { results, loading, error, reload, setResults } = useResults();
  const loc = useLocation();
  const [name, setName] = useState(user?.name ?? '');
  const [daily, setDaily] = useState(String(user?.goals.dailyMinutes ?? 15));
  const [twpm, setTwpm] = useState(String(user?.goals.targetWpm ?? 35));
  const [tacc, setTacc] = useState(String(user?.goals.targetAccuracy ?? 95));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState('all');
  const [shown, setShown] = useState(15);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && loc.hash) {
      setTimeout(() => document.querySelector(loc.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [loading, loc.hash]);

  const modeNames = useMemo(() => {
    const m = new Map<string, string>();
    results.forEach((r) => m.set(r.lessonId ? 'lesson' : r.modeId, r.lessonId ? 'Lessons' : r.modeName.split(' · ')[0]));
    return [...m.entries()];
  }, [results]);

  if (loading) return <PageLoader label="Loading your profile…" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const s = summarize(results);
  const st = streaks(results);
  const ach = achievements(results, user);
  const unlocked = ach.filter((a) => a.unlocked).length;
  const chrono = results.filter((r) => r.modeId !== 'game').slice(0, 40).reverse();
  const series = dailySeries(results, 14);
  const passedLessons = LESSONS.filter((l) => user?.lessons[l.id]?.passed);
  const filtered = results.filter((r) => filter === 'all' || (filter === 'lesson' ? !!r.lessonId : r.modeId === filter && !r.lessonId));

  const saveGoals = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const u = await updateProfile(token, {
        name,
        goals: { dailyMinutes: Number(daily), targetWpm: Number(twpm), targetAccuracy: Number(tacc) },
      });
      setUser(u);
      setMsg({ ok: true, text: 'Profile and goals saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    setDeleting(true);
    try {
      const u = await deleteAllResults(token);
      setUser(u);
      setResults([]);
      setConfirmDel(false);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not delete history.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-16 h-16 grid place-items-center bg-go text-white font-display text-3xl border-2 border-ink shadow-brut">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl">{user?.name}</h1>
          <p className="text-sm text-muted">{user?.email} · Member since {user && new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatTile label="Best WPM" value={Math.round(s.bestWpm)} accent="bg-accent" />
        <StatTile label="Best accuracy" value={`${s.bestAccuracy.toFixed(1)}%`} accent="bg-go-soft" />
        <StatTile label="Tests" value={s.tests} sub={fmtDuration(s.totalSeconds) + ' total'} />
        <StatTile label="Lessons passed" value={`${passedLessons.length}/${LESSONS.length}`} />
        <StatTile label="Streak" value={`${st.current}d`} sub={`Best ${st.best} days`} accent="bg-sun" />
      </div>

      {results.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card-b p-5">
            <SectionTitle kicker="Up to 40 tests" title="WPM history" />
            {chrono.length ? <LineChart values={chrono.map((r) => r.wpm)} labels={chrono.map((r) => fmtDate(r.createdAt))} suffix=" wpm" goal={user?.goals.targetWpm} /> : <p className="text-sm text-muted">No typing tests yet.</p>}
          </div>
          <div className="card-b p-5">
            <SectionTitle kicker="Up to 40 tests" title="Accuracy history" />
            {chrono.length ? <LineChart values={chrono.map((r) => r.accuracy)} labels={chrono.map((r) => fmtDate(r.createdAt))} suffix="%" color="#0a8f4f" max={100} goal={user?.goals.targetAccuracy} /> : <p className="text-sm text-muted">No typing tests yet.</p>}
          </div>
          <div className="card-b p-5 lg:col-span-2">
            <SectionTitle kicker="Last 14 days · minutes" title="Practice time" action={<span className="text-xs font-mono font-bold flex items-center gap-1"><span className="w-4 h-0.5 bg-accent inline-block" /> daily goal</span>} />
            <BarChart data={series} suffix=" min" goal={user?.goals.dailyMinutes} />
          </div>
        </div>
      ) : (
        <EmptyState icon={<History className="w-6 h-6" />} title="Your charts will appear here" text="Complete a test and your WPM, accuracy and practice time will be charted automatically." action={<Link to="/app/practice" className="btn bg-accent">Start practising</Link>} />
      )}

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-4">
        <form id="goals" onSubmit={saveGoals} className="card-b p-5 space-y-4 scroll-mt-24">
          <SectionTitle kicker="Settings" title="Profile & goals" />
          <div>
            <label htmlFor="pname" className="text-sm font-bold block mb-1">Display name</label>
            <input id="pname" className="input-b" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="gd" className="text-xs font-bold block mb-1">Daily min</label>
              <input id="gd" type="number" min={1} max={240} className="input-b" value={daily} onChange={(e) => setDaily(e.target.value)} />
            </div>
            <div>
              <label htmlFor="gw" className="text-xs font-bold block mb-1">Target WPM</label>
              <input id="gw" type="number" min={5} max={200} className="input-b" value={twpm} onChange={(e) => setTwpm(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ga" className="text-xs font-bold block mb-1">Target acc %</label>
              <input id="ga" type="number" min={50} max={100} className="input-b" value={tacc} onChange={(e) => setTacc(e.target.value)} />
            </div>
          </div>
          {user && s.bestWpm > 0 && (
            <div>
              <div className="flex justify-between text-xs font-bold"><span>Best vs target WPM</span><span>{Math.round(s.bestWpm)} / {user.goals.targetWpm}</span></div>
              <div className="h-3 border-2 border-ink mt-1"><div className="h-full bg-accent" style={{ width: `${Math.min(100, (s.bestWpm / user.goals.targetWpm) * 100)}%` }} /></div>
            </div>
          )}
          {msg && (msg.ok ? <div className="border-2 border-ink bg-go-soft p-3 text-sm font-semibold flex items-center gap-2"><CircleCheck className="w-4 h-4 text-go" /> {msg.text}</div> : <ErrorBox message={msg.text} />)}
          <button type="submit" disabled={saving} className="btn bg-ink text-white">{saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />} Save changes</button>
        </form>

        <div className="card-b p-5">
          <SectionTitle kicker={`${unlocked}/${ach.length} unlocked`} title="Achievements" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ach.map((a) => (
              <div key={a.id} className={`border-2 p-3 ${a.unlocked ? 'border-ink bg-sun shadow-brut-sm' : 'border-ink/20 bg-cream text-ink/50'}`} title={a.description}>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {a.unlocked ? <Trophy className="w-4 h-4 shrink-0" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{a.title}</span>
                </div>
                <div className="text-[0.7rem] mt-1 leading-snug">{a.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-b p-5">
        <SectionTitle kicker="Learning" title="Completed lessons" action={<Link to="/app/lessons" className="text-sm font-bold underline">All lessons</Link>} />
        {passedLessons.length ? (
          <div className="flex flex-wrap gap-2">
            {passedLessons.map((l) => (
              <Link key={l.id} to={`/app/lessons/${l.id}`} className="border-2 border-ink bg-go-soft px-3 py-2 text-sm font-semibold hover:bg-go hover:text-white transition-colors">
                {l.num}. {l.title} · {Math.round(user?.lessons[l.id]?.bestWpm ?? 0)} WPM
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No lessons passed yet. <Link to="/app/lessons/l1" className="font-bold underline">Start Lesson 1</Link>.</p>
        )}
      </div>

      <div id="history" className="card-b overflow-hidden scroll-mt-24">
        <div className="p-5 pb-3 flex flex-wrap items-end justify-between gap-3">
          <SectionTitle kicker={`${filtered.length} results`} title="Test history" />
          {results.length > 0 && (
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setShown(15); }} className="input-b w-auto py-2 text-sm mb-4" aria-label="Filter by mode">
              <option value="all">All modes</option>
              {modeNames.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
            </select>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 pb-5"><p className="text-sm text-muted">No results to show.</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-cream border-y-2 border-ink font-mono text-[0.68rem] uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-5 py-2.5">Mode</th><th className="px-3">WPM</th><th className="px-3">Acc.</th><th className="px-3">Errors</th><th className="px-3">Words ✓/✗</th><th className="px-3">Time</th><th className="px-3">Date</th><th className="px-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, shown).map((r) => (
                    <tr key={r.id} className="border-b border-ink/10 last:border-0 hover:bg-accent-soft">
                      <td className="px-5 py-3 font-semibold max-w-[15rem] truncate">{r.modeName}{r.passed !== undefined && <span className={`ml-2 tag ${r.passed ? 'bg-go text-white' : 'bg-white'}`}>{r.passed ? 'Pass' : 'Fail'}</span>}</td>
                      <td className="px-3 font-display">{Math.round(r.wpm)}</td>
                      <td className="px-3">{r.accuracy.toFixed(1)}%</td>
                      <td className="px-3">{r.errors}</td>
                      <td className="px-3">{r.correctWords}/{r.incorrectWords}</td>
                      <td className="px-3">{fmtDuration(r.duration)}</td>
                      <td className="px-3 text-muted whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                      <td className="px-3"><Link to={`/app/result/${r.id}`} className="inline-flex items-center text-xs font-bold hover:text-accent">View <ChevronRight className="w-3.5 h-3.5" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > shown && (
              <div className="p-4 border-t-2 border-ink/10 text-center">
                <button onClick={() => setShown((n) => n + 20)} className="btn bg-white text-sm">Show more</button>
              </div>
            )}
          </>
        )}
      </div>

      {results.length > 0 && (
        <div className="border-2 border-bad p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Reset progress</div>
            <div className="text-sm text-muted">Permanently delete all results and lesson progress for this account.</div>
          </div>
          {confirmDel ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)} className="btn bg-white text-sm">Cancel</button>
              <button onClick={clearAll} disabled={deleting} className="btn bg-bad text-white text-sm">{deleting ? <Spinner className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />} Yes, delete all</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="btn bg-white text-sm text-bad"><Trash2 className="w-4 h-4" /> Delete history</button>
          )}
        </div>
      )}
    </div>
  );
}
