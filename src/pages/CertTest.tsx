import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Timer, Gauge, Target, AlertTriangle } from 'lucide-react';
import TypingTest, { type FinishedStats } from '../components/TypingTest';
import { useAuth } from '../lib/auth';
import { getRegistration, saveCertAttempt, type Registration } from '../lib/db';
import { CERT_LEVELS, startCertTest, submitCertTest } from '../lib/cert';
import type { TestConfig } from '../lib/modes';
import { ErrorBox, PageLoader, Spinner } from '../components/ui';

interface Pending {
  stats: FinishedStats;
  typed: string;
  keystrokes: number;
}

export default function CertTest() {
  const { regId = '' } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();
  const [reg, setReg] = useState<Registration | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'starting' | 'run' | 'submitting'>('intro');
  const [session, setSession] = useState<{ token: string; config: TestConfig } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    getRegistration(token, regId).then(setReg).catch((e) => setLoadErr(e instanceof Error ? e.message : 'Could not load registration.'));
  }, [token, regId]);

  if (loadErr) return <div className="max-w-xl space-y-4"><ErrorBox message={loadErr} /><Link to="/app/certificates" className="btn bg-white">My Certificates</Link></div>;
  if (!reg) return <PageLoader label="Loading your registration…" />;
  const lv = CERT_LEVELS[reg.level];

  const begin = async () => {
    setError(null);
    setPhase('starting');
    try {
      const s = await startCertTest(reg.level, reg.lang, reg.fullName, `${reg.city}, ${reg.state}`);
      setSession({
        token: s.token,
        config: {
          modeId: 'cert', modeName: `Certification L${reg.level}`, title: `Level ${reg.level} — ${lv.name}`, lang: reg.lang, text: s.text, duration: s.duration,
          targetWpm: lv.wpm, targetAccuracy: lv.acc,
        },
      });
      setPhase('run');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the test.');
      setPhase('intro');
    }
  };

  const submit = async (p: Pending) => {
    if (!session) return;
    setPending(p);
    setPhase('submitting');
    setError(null);
    try {
      const r = await submitCertTest(session.token, p.typed, p.keystrokes, p.stats.errors);
      const att = await saveCertAttempt(token, {
        registrationId: reg.id, name: reg.fullName, email: reg.email, location: `${reg.city}, ${reg.state}`,
        level: reg.level, levelName: lv.name, lang: reg.lang, wpm: r.wpm, rawWpm: r.rawWpm, accuracy: r.accuracy, errors: r.errors,
        correctWords: r.correctWords, incorrectWords: r.incorrectWords, chars: r.chars, duration: r.duration,
        requiredWpm: r.required.wpm, requiredAccuracy: r.required.accuracy, passed: r.passed,
        serial: r.certificate?.serial, code: r.certificate?.code,
      });
      nav(`/app/certification/result/${att.id}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your test.');
      setPhase('run');
    }
  };

  if (phase === 'intro' || phase === 'starting') {
    return (
      <div className="max-w-3xl">
        <Link to="/app/certificates" className="inline-flex items-center gap-1 text-sm font-bold hover:text-accent mb-2"><ArrowLeft className="w-4 h-4" /> My Certificates</Link>
        <h1 className="font-display text-3xl sm:text-4xl">Typing Certification Test</h1>
        <p className="text-muted mt-1">Candidate: <b className="text-ink">{reg.fullName}</b> · {reg.city}, {reg.state} · {reg.lang === 'hi' ? 'Hindi' : 'English'}</p>
        <div className={`card-b p-6 mt-6 ${lv.color}`}>
          <span className="tag bg-white">Level {lv.level}</span>
          <h2 className="font-display text-3xl mt-2">{lv.name}</h2>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[[Timer, `${lv.duration / 60} min`, 'Duration'], [Gauge, `${lv.wpm} WPM`, 'To pass'], [Target, `${lv.acc}%`, 'Min. accuracy']].map(([I, v, l]) => {
              const Icon = I as typeof Timer;
              return (
                <div key={l as string} className="bg-white border-2 border-ink p-3">
                  <Icon className="w-4 h-4" />
                  <div className="font-display text-xl mt-1">{v as string}</div>
                  <div className="text-xs font-mono uppercase">{l as string}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card-b p-5 mt-5 text-sm space-y-2">
          <h3 className="font-display text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-accent" /> Before you begin</h3>
          <p>• The countdown starts with your <b>first keystroke</b>. The test ends automatically when time runs out.</p>
          <p>• Speed is calculated over the <b>full {lv.duration / 60} minutes</b> — ending early lowers your WPM.</p>
          <p>• Every wrong keystroke counts against accuracy, even if corrected. Paste is disabled.</p>
          <p>• Don’t refresh or leave this page during the test. You may retake the test any time.</p>
          {reg.attempts > 0 && <p className="font-semibold">Previous attempts on this registration: {reg.attempts}</p>}
        </div>
        {error && <div className="mt-4"><ErrorBox message={error} /></div>}
        <button onClick={begin} disabled={phase === 'starting'} className="btn bg-accent text-base px-6 py-3 mt-6">
          {phase === 'starting' ? <Spinner className="w-4 h-4" /> : <Play className="w-4 h-4" />} {phase === 'starting' ? 'Preparing your test…' : 'Begin test'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">Certification test · in progress</div>
        <h1 className="font-display text-2xl sm:text-3xl">{session?.config.title}</h1>
        <p className="text-sm text-muted">Pass: {lv.wpm} WPM and {lv.acc}% accuracy</p>
      </div>
      {error && (
        <div className="mb-4">
          <ErrorBox message={error} onRetry={pending ? () => submit(pending) : undefined} />
        </div>
      )}
      {phase === 'submitting' && (
        <div className="mb-4 card-b bg-sun p-4 flex items-center gap-3 font-semibold"><Spinner className="w-5 h-5" /> Validating your score on the certification server…</div>
      )}
      {session && (
        <TypingTest config={session.config} saving={phase === 'submitting'} onFinish={(stats, raw) => submit({ stats, typed: raw.typed, keystrokes: raw.keystrokes })} />
      )}
    </div>
  );
}
