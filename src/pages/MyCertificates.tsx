import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, BadgeCheck, Play, ChevronRight, ClipboardList } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { listMyCertData, type CertAttempt, type Registration } from '../lib/db';
import { CERT_LEVELS } from '../lib/cert';
import { useDownload } from './CertResult';
import { ErrorBox, PageLoader, EmptyState, SectionTitle, Spinner } from '../components/ui';
import { fmtDate } from '../lib/stats';

export function useCertData() {
  const { token } = useAuth();
  const [data, setData] = useState<{ registrations: Registration[]; attempts: CertAttempt[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    listMyCertData(token).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load certificates.'));
  }, [token]);
  useEffect(load, [load]);
  return { data, error, reload: load };
}

export default function MyCertificates() {
  const { data, error, reload } = useCertData();
  const dl = useDownload();
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <PageLoader label="Loading certificates…" />;
  const earned = data.attempts.filter((a) => a.passed && a.serial);
  const pending = data.registrations.filter((r) => r.status !== 'passed');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">Certification</div>
          <h1 className="font-display text-3xl sm:text-4xl">My Certificates</h1>
          <p className="text-muted mt-1">Your certification registrations, test history and earned certificates.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/certification" className="btn bg-white">About the test</Link>
          <Link to="/app/certification/register" className="btn bg-accent"><Award className="w-4 h-4" /> Participate Now</Link>
        </div>
      </div>

      {dl.err && <ErrorBox message={dl.err} />}

      <section>
        <SectionTitle kicker={`${earned.length} earned`} title="Earned certificates" />
        {earned.length === 0 ? (
          <EmptyState icon={<Award className="w-6 h-6" />} title="No certificates yet" text="Register for a certification level and pass the test to earn a verifiable PDF certificate." action={<Link to="/app/certification/register" className="btn bg-accent">Register for a test</Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map((a) => (
              <div key={a.id} className={`card-b p-5 flex flex-col gap-3 ${a.revoked ? 'bg-bad-soft' : CERT_LEVELS[a.level].color}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="w-11 h-11 grid place-items-center bg-go text-white border-2 border-ink rounded-full"><Award className="w-5 h-5" /></span>
                  {a.revoked ? <span className="tag bg-bad text-white">Revoked</span> : <span className="tag bg-white">Level {a.level}</span>}
                </div>
                <div>
                  <h3 className="font-display text-xl">{a.levelName}</h3>
                  <div className="font-mono text-xs font-bold break-all">{a.serial}</div>
                </div>
                <div className="text-sm font-semibold">{Math.round(a.wpm)} WPM · {a.accuracy.toFixed(1)}% · {a.lang === 'hi' ? 'Hindi' : 'English'}</div>
                <div className="text-xs text-muted">Issued {fmtDate(a.createdAt)}</div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button onClick={() => dl.run(a)} disabled={!!dl.busy || a.revoked} className="btn bg-ink text-white text-xs py-1.5 px-3">
                    {dl.busy === a.id ? <Spinner className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                  <Link to={`/verify/${a.code}`} className="btn bg-white text-xs py-1.5 px-3"><BadgeCheck className="w-3.5 h-3.5" /> Verify</Link>
                  <Link to={`/app/certification/result/${a.id}`} className="btn bg-white text-xs py-1.5 px-3">Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pending.length > 0 && (
        <section>
          <SectionTitle kicker="Registered" title="Tests waiting for you" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((r) => (
              <div key={r.id} className="card-b p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="tag bg-sun">Level {r.level} — {CERT_LEVELS[r.level].name}</div>
                    <div className="font-bold mt-2">{r.fullName}</div>
                    <div className="text-xs text-muted">{r.lang === 'hi' ? 'Hindi' : 'English'} · Registered {fmtDate(r.createdAt)}</div>
                  </div>
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="text-sm mt-2">{r.attempts ? `${r.attempts} attempt${r.attempts > 1 ? 's' : ''} · not passed yet` : 'Not attempted yet'}</div>
                <Link to={`/app/certification/test/${r.id}`} className="btn bg-accent text-sm mt-3"><Play className="w-4 h-4" /> {r.attempts ? 'Retake test' : 'Start test'}</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card-b overflow-hidden">
        <div className="p-5 pb-0"><SectionTitle kicker={`${data.attempts.length} attempts`} title="Test history" /></div>
        {data.attempts.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted">No certification attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="bg-cream border-y-2 border-ink font-mono text-[0.68rem] uppercase tracking-wider text-left">
                <tr><th className="px-5 py-2.5">Level</th><th className="px-3">Result</th><th className="px-3">WPM</th><th className="px-3">Accuracy</th><th className="px-3">Errors</th><th className="px-3">Date</th><th className="px-3" /></tr>
              </thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr key={a.id} className="border-b border-ink/10 last:border-0 hover:bg-accent-soft">
                    <td className="px-5 py-3 font-semibold">L{a.level} · {a.levelName} <span className="text-muted font-normal">({a.lang === 'hi' ? 'HI' : 'EN'})</span></td>
                    <td className="px-3"><span className={`tag ${a.passed ? 'bg-go text-white' : 'bg-bad-soft'}`}>{a.passed ? 'Pass' : 'Fail'}</span></td>
                    <td className="px-3 font-display">{Math.round(a.wpm)}</td>
                    <td className="px-3">{a.accuracy.toFixed(1)}%</td>
                    <td className="px-3">{a.errors}</td>
                    <td className="px-3 text-muted whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                    <td className="px-3"><Link to={`/app/certification/result/${a.id}`} className="inline-flex items-center text-xs font-bold hover:text-accent">View <ChevronRight className="w-3.5 h-3.5" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
