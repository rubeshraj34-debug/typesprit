import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { createRegistration, CERT_NAME_RE } from '../lib/db';
import { AGE_GROUPS, INDIAN_STATES, LEVEL_LIST, type CertLevel } from '../lib/cert';
import { ErrorBox, Spinner } from '../components/ui';

export default function CertRegister() {
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initLevel = Number(params.get('level'));
  const [f, setF] = useState({
    fullName: CERT_NAME_RE.test(user?.name ?? '') ? user!.name : '',
    email: user?.email ?? '',
    mobile: '',
    state: '',
    city: '',
    address: '',
    ageGroup: '',
    lang: 'en' as 'en' | 'hi',
    level: ([1, 2, 3].includes(initLevel) ? initLevel : 1) as CertLevel,
    consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const reg = await createRegistration(token, f);
      nav(`/app/certification/test/${reg.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  const label = (t: string, req = false) => (
    <span className="text-sm font-bold block mb-1">
      {t} {req ? <span className="text-bad">*</span> : <span className="text-muted font-medium">(optional)</span>}
    </span>
  );

  return (
    <div className="max-w-3xl">
      <Link to="/certification" className="inline-flex items-center gap-1 text-sm font-bold hover:text-accent mb-2"><ArrowLeft className="w-4 h-4" /> Certification</Link>
      <h1 className="font-display text-3xl sm:text-4xl">Register for certification</h1>
      <p className="text-muted mt-1">Fields marked <span className="text-bad">*</span> are required. Your name will be printed on the certificate exactly as entered.</p>

      <form onSubmit={submit} className="card-b p-5 sm:p-7 mt-6 space-y-6" noValidate>
        {error && <ErrorBox message={error} />}

        <fieldset className="space-y-4">
          <legend className="font-display text-lg mb-2">Personal details</legend>
          <label className="block">
            {label('Full name (as on certificate)', true)}
            <input className="input-b" value={f.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="e.g. Priya Sharma" autoComplete="name" />
            <span className="text-xs text-muted">English letters, spaces, dots and hyphens only.</span>
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              {label('Email address', true)}
              <input type="email" className="input-b" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
            </label>
            <label className="block">
              {label('Mobile number')}
              <input type="tel" className="input-b" value={f.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="98765 43210" autoComplete="tel" inputMode="tel" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              {label('State / UT', true)}
              <select className="input-b" value={f.state} onChange={(e) => set('state', e.target.value)}>
                <option value="">Select state…</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              {label('City', true)}
              <input className="input-b" value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Lucknow" autoComplete="address-level2" />
            </label>
          </div>
          <label className="block">
            {label('Address')}
            <textarea rows={2} className="input-b resize-none" value={f.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" />
          </label>
          <label className="block sm:w-1/2">
            {label('Age group')}
            <select className="input-b" value={f.ageGroup} onChange={(e) => set('ageGroup', e.target.value)}>
              <option value="">Prefer not to say</option>
              {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-display text-lg mb-2">Preferred language <span className="text-bad text-sm">*</span></legend>
          <div className="flex gap-2">
            {([['en', 'English'], ['hi', 'Hindi (हिंदी)']] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set('lang', v)} aria-pressed={f.lang === v} className={`btn text-sm ${f.lang === v ? 'bg-accent' : 'bg-white'}`}>{l}</button>
            ))}
          </div>
          {f.lang === 'hi' && <p className="text-xs text-muted mt-2">Hindi tests use Unicode text — enable a Hindi keyboard (Inscript / Remington GAIL / phonetic) on your device.</p>}
        </fieldset>

        <fieldset>
          <legend className="font-display text-lg mb-2">Test level <span className="text-bad text-sm">*</span></legend>
          <div className="grid sm:grid-cols-3 gap-3">
            {LEVEL_LIST.map((l) => (
              <button key={l.level} type="button" onClick={() => set('level', l.level)} aria-pressed={f.level === l.level} className={`text-left border-2 border-ink p-4 transition-all ${f.level === l.level ? 'bg-accent shadow-brut -translate-x-0.5 -translate-y-0.5' : 'bg-white hover:bg-cream'}`}>
                <div className="font-mono text-[0.65rem] font-bold uppercase">Level {l.level}</div>
                <div className="font-display text-lg">{l.name}</div>
                <div className="text-xs font-semibold mt-1">{l.duration / 60} min · {l.wpm} WPM · {l.acc}%</div>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="border-2 border-ink bg-cream p-4 text-sm space-y-3">
          <div className="flex items-center gap-2 font-bold"><ShieldCheck className="w-4 h-4 text-go" /> Privacy notice</div>
          <p className="text-muted leading-relaxed">
            We collect the details above only to conduct your certification test and issue your certificate. Your registration and results are stored in your TypeSprint account database and are visible only to you and TypeSprint administrators. Your <b>name, location (city, state), level, speed, accuracy and issue date</b> are embedded in your certificate and will be shown to anyone who verifies it. Your email, mobile number, address and age group are never shown publicly. You can ask an administrator to delete your registration at any time.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-1 w-4 h-4 accent-[#ff5a1f]" />
            <span className="font-semibold">I have read and agree to the privacy notice and confirm that the details provided are accurate. <span className="text-bad">*</span></span>
          </label>
        </div>

        <button type="submit" disabled={busy || !f.consent} className="btn bg-accent text-base px-6 py-3 w-full sm:w-auto">
          {busy ? <Spinner className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />} {busy ? 'Registering…' : 'Register & continue to test'}
        </button>
      </form>
    </div>
  );
}
