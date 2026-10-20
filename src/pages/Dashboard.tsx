import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gauge, Target, AlertCircle, Clock, Flame, ArrowRight, Keyboard, GraduationCap, Timer, Landmark, CalendarDays, ChevronRight, LineChart as LineIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useResults } from '../lib/useResults';
import { summarize, streaks, fmtDuration, fmtDate, dayKey } from '../lib/stats';
import { recommendedLesson, LESSONS } from '../lib/lessons';
import { StatTile, PageLoader, ErrorBox, EmptyState, SectionTitle } from '../components/ui';
import { LineChart } from '../components/Charts';
import { useCertData } from './MyCertificates';
import { Award, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { results, loading, error, reload } = useResults();
  const cert = useCertData();
  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const s = summarize(results);
  const st = streaks(results);
  const goal = user?.goals.dailyMinutes ?? 15;
  const todayMin = s.todaySeconds / 60;
  const goalPct = Math.min(100, (todayMin / goal) * 100);
  const chrono = results.filter((r) => r.modeId !== 'game').slice(0, 20).reverse();
  const rec = recommendedLesson(user);
  const passedCount = LESSONS.filter((l) => user?.lessons[l.id]?.passed).length;
  const dailyDone = results.some((r) => r.modeId === 'daily' && dayKey(r.createdAt) === dayKey(Date.now()));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">{greet}</div>
          <h1 className="font-display text-3xl sm:text-4xl">{user?.name.split(' ')[0]}, ready to sprint?</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/app/practice/timed" className="btn bg-accent"><Timer className="w-4 h-4" /> Quick test</Link>
          <Link to="/app/practice" className="btn bg-white"><Keyboard className="w-4 h-4" /> All modes</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatTile label="Avg speed" value={<>{Math.round(s.avgWpm)}<span className="text-base"> wpm</span></>} sub={`Best: ${Math.round(s.bestWpm)} WPM`} accent="bg-accent" icon={<Gauge className="w-4 h-4" />} />
        <StatTile label="Accuracy" value={`${Math.round(s.avgAccuracy)}%`} sub="Last 10 tests" accent="bg-go-soft" icon={<Target className="w-4 h-4" />} />
        <StatTile label="Mistakes" value={Math.round(s.avgErrors)} sub={`Avg per test · ${s.totalErrors} total`} icon={<AlertCircle className="w-4 h-4" />} />
        <StatTile label="Practice time" value={fmtDuration(s.totalSeconds)} sub={`${s.tests} tests completed`} icon={<Clock className="w-4 h-4" />} />
        <StatTile label="Streak" value={<>{st.current}<span className="text-base"> day{st.current === 1 ? '' : 's'}</span></>} sub={`Best: ${st.best} days`} accent="bg-sun" icon={<Flame className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-b p-5">
          <SectionTitle kicker="Today" title="Daily goal" action={<Link to="/app/profile#goals" className="text-xs font-bold underline">Edit</Link>} />
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl">{todayMin < 10 ? todayMin.toFixed(1) : Math.round(todayMin)}</span>
            <span className="font-semibold mb-1">/ {goal} min</span>
          </div>
          <div className="h-5 border-2 border-ink mt-3 bg-white">
            <motion.div className={`h-full ${goalPct >= 100 ? 'bg-go' : 'bg-accent'}`} initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.6 }} />
          </div>
          <p className="text-sm text-muted mt-3">
            {goalPct >= 100 ? 'Goal complete! Great consistency today.' : `${Math.max(0, goal - todayMin).toFixed(1)} min to go · ${s.todayTests} test${s.todayTests === 1 ? '' : 's'} today`}
          </p>
        </div>

        <div className="card-b p-5 bg-accent-soft">
          <SectionTitle kicker={`Lessons · ${passedCount}/${LESSONS.length} passed`} title="Recommended next" />
          {rec ? (
            <>
              <div className="tag bg-white mb-2">{rec.level} · Lesson {rec.num}</div>
              <div className="font-display text-xl">{rec.title}</div>
              <p className="text-sm text-muted mt-1">Target: {rec.targetWpm} WPM · {rec.targetAccuracy}% accuracy</p>
              <Link to={`/app/lessons/${rec.id}`} className="btn bg-ink text-white mt-4 text-sm">
                <GraduationCap className="w-4 h-4" /> {user?.lessons[rec.id] ? 'Retry lesson' : 'Start lesson'}
              </Link>
            </>
          ) : (
            <>
              <div className="font-display text-xl">All lessons passed 🎉</div>
              <p className="text-sm text-muted mt-1">Keep sharp with exam-pattern tests.</p>
              <Link to="/app/practice/gov-exam" className="btn bg-ink text-white mt-4 text-sm"><Landmark className="w-4 h-4" /> Govt. exam tests</Link>
            </>
          )}
        </div>

        <div className="card-b p-5">
          <SectionTitle kicker="Challenge" title="Daily challenge" />
          <p className="text-sm text-muted">A new passage every day. Everyone gets the same text — try to beat yesterday’s you.</p>
          <div className={`tag mt-3 ${dailyDone ? 'bg-go text-white' : 'bg-sun'}`}>{dailyDone ? 'Completed today' : 'Not attempted yet'}</div>
          <div>
            <Link to="/app/practice/daily" className="btn bg-white mt-4 text-sm">
              <CalendarDays className="w-4 h-4" /> {dailyDone ? 'Play again' : 'Take challenge'}
            </Link>
          </div>
        </div>
      </div>

      <a
        href="https://017ko3-7nhyx3g51-intelligence-agentic-models.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="group card-b bg-sun p-5 sm:p-6 flex flex-wrap items-center gap-4 hover:-translate-y-1 hover:shadow-brut-lg transition-all"
      >
        <span className="w-12 h-12 grid place-items-center bg-white border-2 border-ink shrink-0">
          <Award className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-[14rem]">
          <div className="font-mono text-xs uppercase tracking-widest font-bold">Certification</div>
          <h2 className="font-display text-xl sm:text-2xl">Typing Certification Test</h2>
          <p className="text-sm font-medium mt-0.5">Take the official typing certification test and earn your certificate. Opens in a new tab.</p>
        </div>
        <span className="btn bg-ink text-white text-sm group-hover:bg-accent group-hover:text-ink">
          Open test <ExternalLink className="w-4 h-4" />
        </span>
      </a>

      <div className="card-b p-5">
        <SectionTitle kicker="Certification" title="My Certificates" action={<Link to="/app/certificates" className="text-sm font-bold underline">View all</Link>} />
        {cert.error ? (
          <ErrorBox message={cert.error} onRetry={cert.reload} />
        ) : !cert.data ? (
          <p className="text-sm text-muted">Loading certificates…</p>
        ) : (() => {
          const earned = cert.data.attempts.filter((a) => a.passed && a.serial);
          const last = cert.data.attempts[0];
          return (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2 flex-wrap flex-1 min-w-[14rem]">
                {earned.length ? earned.slice(0, 4).map((a) => (
                  <Link key={a.id} to={`/app/certification/result/${a.id}`} className={`border-2 border-ink px-3 py-2 flex items-center gap-2 text-sm font-semibold hover:shadow-brut-sm transition-shadow ${a.revoked ? 'bg-bad-soft' : 'bg-go-soft'}`}>
                    <Award className="w-4 h-4" /> L{a.level} {a.levelName} · {Math.round(a.wpm)} WPM
                  </Link>
                )) : (
                  <p className="text-sm text-muted">{last ? `Last attempt: Level ${last.level} — ${last.passed ? 'passed' : 'not passed'} (${Math.round(last.wpm)} WPM, ${last.accuracy.toFixed(1)}%).` : 'No certificates yet. Take the certification test to earn a verifiable certificate.'}</p>
                )}
              </div>
              <Link to="/app/certification/register" className="btn bg-accent text-sm"><Award className="w-4 h-4" /> Get certified</Link>
            </div>
          );
        })()}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<LineIcon className="w-6 h-6" />}
          title="No results yet"
          text="Take your first test to see speed and accuracy charts, recent results and personalised tips here."
          action={<Link to="/app/practice/english-test" className="btn bg-accent">Take a 1-minute test <ArrowRight className="w-4 h-4" /></Link>}
        />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card-b p-5">
              <SectionTitle kicker={`Last ${chrono.length} tests`} title="Speed progress" />
              {chrono.length ? (
                <LineChart values={chrono.map((r) => r.wpm)} labels={chrono.map((r) => fmtDate(r.createdAt))} suffix=" wpm" goal={user?.goals.targetWpm} />
              ) : (
                <p className="text-sm text-muted">Play typing tests to see speed progress.</p>
              )}
            </div>
            <div className="card-b p-5">
              <SectionTitle kicker={`Last ${chrono.length} tests`} title="Accuracy progress" />
              {chrono.length ? (
                <LineChart values={chrono.map((r) => r.accuracy)} labels={chrono.map((r) => fmtDate(r.createdAt))} suffix="%" color="#0a8f4f" max={100} goal={user?.goals.targetAccuracy} />
              ) : (
                <p className="text-sm text-muted">Play typing tests to see accuracy progress.</p>
              )}
            </div>
          </div>

          <div className="card-b overflow-hidden">
            <div className="p-5 pb-0">
              <SectionTitle kicker="History" title="Recent results" action={<Link to="/app/profile#history" className="text-sm font-bold underline">View all</Link>} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-cream border-y-2 border-ink font-mono text-[0.68rem] uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-5 py-2.5">Mode</th>
                    <th className="px-3 py-2.5">WPM</th>
                    <th className="px-3 py-2.5">Accuracy</th>
                    <th className="px-3 py-2.5">Errors</th>
                    <th className="px-3 py-2.5">Time</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 6).map((r) => (
                    <tr key={r.id} className="border-b border-ink/10 last:border-0 hover:bg-accent-soft">
                      <td className="px-5 py-3 font-semibold max-w-[14rem] truncate">{r.modeName}</td>
                      <td className="px-3 py-3 font-display">{Math.round(r.wpm)}</td>
                      <td className="px-3 py-3">{r.accuracy.toFixed(1)}%</td>
                      <td className="px-3 py-3">{r.errors}</td>
                      <td className="px-3 py-3">{fmtDuration(r.duration)}</td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                      <td className="px-3 py-3">
                        <Link to={`/app/result/${r.id}`} className="inline-flex items-center font-bold text-xs hover:text-accent">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
