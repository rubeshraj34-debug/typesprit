import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo, ErrorBox, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { user, loading, login, signup } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? '/app';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Navigate to={from} replace />;
  const isSignup = mode === 'signup';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) await signup(name, email, password);
      else await login(email, password);
      nav(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12 relative overflow-hidden">
        <Logo light />
        <div className="relative z-10">
          <div className="font-mono text-sm text-accent mb-4">// {isSignup ? 'new_account' : 'welcome_back'}</div>
          <h1 className="font-display text-5xl leading-[1.05]">
            {isSignup ? 'Your typing journey starts with one key.' : 'Pick up right where you left off.'}
          </h1>
          <p className="mt-5 text-white/70 max-w-md">
            Lessons, timed tests and exam-pattern practice for SSC, RRB and court typing tests — with every result saved to your account.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap relative z-10">
          {['asdf', 'jkl;', 'WPM', '95%', 'हिंदी', 'SSC'].map((k, i) => (
            <span key={k} className={`px-4 py-3 border-2 border-white font-mono font-bold ${i % 3 === 0 ? 'bg-accent text-ink border-ink' : ''}`}>
              {k}
            </span>
          ))}
        </div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-accent/20 rotate-12" />
      </div>

      <div className="flex flex-col p-6 sm:p-12 bg-grid">
        <div className="lg:hidden mb-8">
          <Logo />
        </div>
        <div className="flex-1 grid place-items-center">
          <form onSubmit={submit} className="card-b w-full max-w-md p-6 sm:p-8 space-y-4" noValidate>
            <div>
              <h2 className="font-display text-3xl">{isSignup ? 'Create account' : 'Log in'}</h2>
              <p className="text-muted text-sm mt-1">
                {isSignup ? 'Free forever. Save your progress, streaks and results.' : 'Access your dashboard and saved results.'}
              </p>
            </div>
            {error && <ErrorBox message={error} />}
            {isSignup && (
              <div>
                <label htmlFor="name" className="text-sm font-bold block mb-1">Full name</label>
                <input id="name" className="input-b" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="e.g. Priya Sharma" required />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-bold block mb-1">Email</label>
              <input id="email" type="email" className="input-b" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-bold block mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  className="input-b pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  required
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-cream" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {isSignup && (
              <div>
                <label htmlFor="confirm" className="text-sm font-bold block mb-1">Confirm password</label>
                <input id="confirm" type={show ? 'text' : 'password'} className="input-b" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Repeat password" required />
              </div>
            )}
            <button type="submit" disabled={busy} className="btn bg-accent w-full py-3 text-base">
              {busy ? <Spinner className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              {busy ? (isSignup ? 'Creating account…' : 'Logging in…') : isSignup ? 'Create account' : 'Log in'}
            </button>
            <p className="text-sm text-center">
              {isSignup ? 'Already have an account? ' : 'New to TypeSprint? '}
              <Link to={isSignup ? '/login' : '/signup'} state={loc.state} className="font-bold underline decoration-accent decoration-2 underline-offset-4">
                {isSignup ? 'Log in' : 'Sign up free'}
              </Link>
            </p>
            <p className="flex items-start gap-2 text-xs text-muted border-t-2 border-ink/10 pt-3">
              <ShieldCheck className="w-4 h-4 shrink-0 text-go" />
              Passwords are hashed (PBKDF2-SHA256, salted). Your results are private to your account and stored in this browser's database.
            </p>
          </form>
        </div>
        <Link to="/" className="text-sm font-semibold mt-6 text-center hover:underline">← Back to home</Link>
      </div>
    </div>
  );
}
