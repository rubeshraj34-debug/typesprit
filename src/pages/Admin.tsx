import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, Download, Search, Trash2, Ban, Undo2, Users, ClipboardList, Award, Percent } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { adminListAll, adminSetRevoked, adminDeleteRegistration, grantAdmin, type CertAttempt, type Registration } from '../lib/db';
import { adminLogin } from '../lib/cert';
import { ErrorBox, PageLoader, Spinner, StatTile } from '../components/ui';
import { fmtDate } from '../lib/stats';

function toCsv(rows: (string | number | undefined)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCsv(name: string, rows: (string | number | undefined)[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminGate() {
  const { token, setUser } = useAuth();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminLogin(key);
      setUser(await grantAdmin(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="max-w-md mx-auto mt-6">
      <form onSubmit={submit} className="card-b p-6 space-y-4">
        <div className="w-12 h-12 grid place-items-center border-2 border-ink bg-sun"><KeyRound className="w-6 h-6" /></div>
        <div>
          <h1 className="font-display text-2xl">Admin access</h1>
          <p className="text-sm text-muted mt-1">This area is restricted. Enter the administrator key to unlock the admin panel for your account. The key is checked on the server.</p>
        </div>
        {error && <ErrorBox message={error} />}
        <input type="password" className="input-b" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Administrator key" autoComplete="off" aria-label="Administrator key" />
        <button type="submit" disabled={busy || !key} className="btn bg-ink text-white w-full">{busy ? <Spinner className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />} Unlock admin panel</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { user, token } = useAuth();
  const [data, setData] = useState<{ users: number; registrations: Registration[]; attempts: CertAttempt[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'registrations' | 'certificates'>('registrations');
  const [q, setQ] = useState('');
  const [levelF, setLevelF] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user?.isAdmin) return;
    setError(null);
    adminListAll(token).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load admin data.'));
  }, [token, user?.isAdmin]);
  useEffect(load, [load]);

  const ql = q.trim().toLowerCase();
  const regs = useMemo(() => (data?.registrations ?? []).filter((r) => (levelF === 'all' || String(r.level) === levelF) && (!ql || [r.fullName, r.email, r.city, r.state, r.mobile].join(' ').toLowerCase().includes(ql))), [data, ql, levelF]);
  const certs = useMemo(() => (data?.attempts ?? []).filter((a) => a.passed && (levelF === 'all' || String(a.level) === levelF) && (!ql || [a.name, a.email, a.serial, a.location].join(' ').toLowerCase().includes(ql))), [data, ql, levelF]);

  if (!user?.isAdmin) return <AdminGate />;
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <PageLoader label="Loading admin data…" />;

  const allCerts = data.attempts.filter((a) => a.passed);
  const passRate = data.attempts.length ? (allCerts.length / data.attempts.length) * 100 : 0;

  const revoke = async (a: CertAttempt) => {
    setBusy(a.id);
    try {
      await adminSetRevoked(token, a.id, !a.revoked);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  };
  const del = async (id: string) => {
    setBusy(id);
    try {
      await adminDeleteRegistration(token, id);
      setConfirm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusy(null);
    }
  };
  const exportCsv = () => {
    if (tab === 'registrations') {
      downloadCsv('typesprint-registrations.csv', [
        ['Name', 'Email', 'Mobile', 'State', 'City', 'Address', 'Age group', 'Language', 'Level', 'Status', 'Attempts', 'Registered'],
        ...regs.map((r) => [r.fullName, r.email, r.mobile, r.state, r.city, r.address, r.ageGroup, r.lang, r.level, r.status, r.attempts, new Date(r.createdAt).toISOString()]),
      ]);
    } else {
      downloadCsv('typesprint-certificates.csv', [
        ['Serial', 'Name', 'Email', 'Location', 'Level', 'Language', 'WPM', 'Accuracy', 'Revoked', 'Issued'],
        ...certs.map((a) => [a.serial, a.name, a.email, a.location, a.level, a.lang, a.wpm, a.accuracy, a.revoked ? 'yes' : 'no', new Date(a.createdAt).toISOString()]),
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Admin</div>
        <h1 className="font-display text-3xl sm:text-4xl">Certification admin panel</h1>
        <p className="text-sm text-muted mt-1">Manage registrations and issued certificates stored in this TypeSprint database.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Accounts" value={data.users} icon={<Users className="w-4 h-4" />} />
        <StatTile label="Registrations" value={data.registrations.length} icon={<ClipboardList className="w-4 h-4" />} accent="bg-sun" />
        <StatTile label="Certificates" value={allCerts.length} sub={`${allCerts.filter((a) => a.revoked).length} revoked`} icon={<Award className="w-4 h-4" />} accent="bg-go-soft" />
        <StatTile label="Pass rate" value={`${Math.round(passRate)}%`} sub={`${data.attempts.length} attempts`} icon={<Percent className="w-4 h-4" />} accent="bg-accent-soft" />
      </div>

      {error && <ErrorBox message={error} />}

      <div className="card-b overflow-hidden">
        <div className="p-4 border-b-2 border-ink flex flex-wrap gap-2 items-center">
          {(['registrations', 'certificates'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`btn text-sm py-1.5 px-3 capitalize ${tab === t ? 'bg-ink text-white' : 'bg-white'}`}>{t}</button>
          ))}
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input-b pl-9 py-2 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, serial, city…" aria-label="Search" />
          </div>
          <select className="input-b w-auto py-2 text-sm" value={levelF} onChange={(e) => setLevelF(e.target.value)} aria-label="Filter level">
            <option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option>
          </select>
          <button onClick={exportCsv} className="btn bg-white text-sm py-1.5 px-3"><Download className="w-4 h-4" /> CSV</button>
        </div>

        <div className="overflow-x-auto">
          {tab === 'registrations' ? (
            regs.length === 0 ? <p className="p-6 text-sm text-muted">No registrations found.</p> : (
              <table className="w-full text-sm min-w-[860px]">
                <thead className="bg-cream border-b-2 border-ink font-mono text-[0.68rem] uppercase tracking-wider text-left">
                  <tr><th className="px-4 py-2.5">Candidate</th><th className="px-3">Contact</th><th className="px-3">Location</th><th className="px-3">Level</th><th className="px-3">Status</th><th className="px-3">Registered</th><th className="px-3" /></tr>
                </thead>
                <tbody>
                  {regs.map((r) => (
                    <tr key={r.id} className="border-b border-ink/10 last:border-0 align-top">
                      <td className="px-4 py-3"><div className="font-semibold">{r.fullName}</div><div className="text-xs text-muted">{r.ageGroup || '—'} · {r.lang === 'hi' ? 'Hindi' : 'English'}</div></td>
                      <td className="px-3 py-3"><div>{r.email}</div><div className="text-xs text-muted">{r.mobile || 'No mobile'}</div></td>
                      <td className="px-3 py-3"><div>{r.city}, {r.state}</div>{r.address && <div className="text-xs text-muted max-w-[14rem] truncate">{r.address}</div>}</td>
                      <td className="px-3 py-3">L{r.level}</td>
                      <td className="px-3 py-3"><span className={`tag ${r.status === 'passed' ? 'bg-go text-white' : r.status === 'failed' ? 'bg-bad-soft' : 'bg-sun'}`}>{r.status}</span><div className="text-xs text-muted mt-1">{r.attempts} attempt{r.attempts === 1 ? '' : 's'}</div></td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {confirm === r.id ? (
                          <span className="flex gap-1">
                            <button onClick={() => setConfirm(null)} className="btn bg-white text-xs py-1 px-2">Cancel</button>
                            <button onClick={() => del(r.id)} disabled={busy === r.id} className="btn bg-bad text-white text-xs py-1 px-2">{busy === r.id ? <Spinner className="w-3 h-3" /> : 'Delete'}</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirm(r.id)} className="btn bg-white text-xs py-1 px-2 text-bad" aria-label={`Delete registration of ${r.fullName}`}><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : certs.length === 0 ? <p className="p-6 text-sm text-muted">No certificates found.</p> : (
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-cream border-b-2 border-ink font-mono text-[0.68rem] uppercase tracking-wider text-left">
                <tr><th className="px-4 py-2.5">Serial</th><th className="px-3">Holder</th><th className="px-3">Level</th><th className="px-3">Score</th><th className="px-3">Status</th><th className="px-3">Issued</th><th className="px-3" /></tr>
              </thead>
              <tbody>
                {certs.map((a) => (
                  <tr key={a.id} className="border-b border-ink/10 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{a.serial}</td>
                    <td className="px-3 py-3"><div className="font-semibold">{a.name}</div><div className="text-xs text-muted">{a.email}</div></td>
                    <td className="px-3 py-3">L{a.level} · {a.levelName}</td>
                    <td className="px-3 py-3">{Math.round(a.wpm)} WPM · {a.accuracy.toFixed(1)}%</td>
                    <td className="px-3 py-3"><span className={`tag ${a.revoked ? 'bg-bad text-white' : 'bg-go-soft'}`}>{a.revoked ? 'Revoked' : 'Valid'}</span></td>
                    <td className="px-3 py-3 text-muted whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-1">
                      <Link to={`/verify/${a.code}`} className="btn bg-white text-xs py-1 px-2">Verify</Link>
                      <button onClick={() => revoke(a)} disabled={busy === a.id} className={`btn text-xs py-1 px-2 ${a.revoked ? 'bg-white' : 'bg-bad text-white'}`}>
                        {busy === a.id ? <Spinner className="w-3 h-3" /> : a.revoked ? <><Undo2 className="w-3.5 h-3.5" /> Restore</> : <><Ban className="w-3.5 h-3.5" /> Revoke</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
