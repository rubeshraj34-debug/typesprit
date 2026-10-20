import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Menu, X, Gauge, Highlighter, Landmark, Languages, LineChart, Flame, Check, Lock, Target, Timer,
  Keyboard, Trophy, CalendarCheck, AlertCircle, Clock, Heart,
} from 'lucide-react';
import { Logo } from '../components/ui';
import { MODES } from '../lib/modes';
import { LESSONS, LEVELS } from '../lib/lessons';
import { GOV_EXAMS } from '../lib/modes';
import { useAuth } from '../lib/auth';

const DEMO = 'Practice daily and your typing speed will improve steadily.';

function DemoTyper() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x >= DEMO.length + 12 ? 0 : x + 1)), 110);
    return () => clearInterval(id);
  }, []);
  const pos = Math.min(i, DEMO.length);
  const errAt = 23;
  return (
    <div className="card-b shadow-brut-lg bg-white p-5 sm:p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 bg-bad border-2 border-ink" />
          <span className="w-3 h-3 bg-sun border-2 border-ink" />
          <span className="w-3 h-3 bg-go border-2 border-ink" />
        </div>
        <span className="tag bg-accent-soft">Live preview</span>
      </div>
      <div className="font-mono text-lg sm:text-xl leading-relaxed min-h-[5.5rem]">
        {DEMO.split('').map((c, k) => (
          <span key={k}>
            {k === pos && <span className="caret" />}
            <span className={k < pos ? (k === errAt ? 'text-bad bg-bad-soft' : 'text-ink') : 'text-faint'}>{c}</span>
          </span>
        ))}
        {pos === DEMO.length && <span className="caret" />}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-5">
        {[
          ['WPM', String(Math.round((pos / 5) / Math.max(0.05, (pos * 0.11) / 60)) || 0), 'bg-accent'],
          ['Accuracy', pos > errAt ? '98%' : '100%', 'bg-go-soft'],
          ['Time', `0:${String(Math.floor(pos * 0.11)).padStart(2, '0')}`, 'bg-sun'],
        ].map(([l, v, c]) => (
          <div key={l} className={`border-2 border-ink px-3 py-2 ${c}`}>
            <div className="font-mono text-[0.6rem] uppercase font-bold tracking-wider">{l}</div>
            <div className="font-display text-xl tabular-nums">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Gauge, title: 'Live WPM & accuracy', text: 'Speed, accuracy, correct and wrong words update with every keystroke.', color: 'bg-accent' },
  { icon: Highlighter, title: 'Clear mistake highlighting', text: 'Wrong letters turn red instantly, extra letters are struck through.', color: 'bg-bad-soft' },
  { icon: Landmark, title: 'Govt. exam patterns', text: 'SSC CHSL/CGL, RRB NTPC and court-style tests with qualifying targets.', color: 'bg-go-soft' },
  { icon: Languages, title: 'English + हिंदी', text: 'Practise Unicode Hindi with Inscript, Remington GAIL or phonetic layouts.', color: 'bg-sun' },
  { icon: LineChart, title: 'Real progress charts', text: 'Every test is saved. Watch your WPM and accuracy trend upwards.', color: 'bg-white' },
  { icon: Flame, title: 'Streaks & goals', text: 'Daily practice goals, streak counter and 17 achievements to unlock.', color: 'bg-accent-soft' },
];

const TRACKED = [
  { icon: Gauge, label: 'Typing speed (WPM)' },
  { icon: Target, label: 'Accuracy %' },
  { icon: AlertCircle, label: 'Mistakes & weak keys' },
  { icon: Clock, label: 'Practice time' },
  { icon: CalendarCheck, label: 'Daily goals' },
  { icon: Flame, label: 'Streaks' },
  { icon: Trophy, label: 'Achievements' },
  { icon: Timer, label: 'Full test history' },
];

export default function Landing() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const startTo = user ? '/app/practice' : '/signup';
  const links = [
    ['Features', '#features'],
    ['Modes', '#modes'],
    ['Learning', '#learning'],
    ['Exams', '#exams'],
  ];
  const routeLinks = [
    ['Certification', '/certification'],
    ['Verify', '/verify'],
  ];

  return (
    <div className="bg-white text-ink">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex gap-1 ml-6">
            {links.map(([l, h]) => (
              <a key={h} href={h} className="px-3 py-2 text-sm font-bold border-2 border-transparent hover:border-ink transition-colors">
                {l}
              </a>
            ))}
            {routeLinks.map(([l, h]) => (
              <Link key={h} to={h} className="px-3 py-2 text-sm font-bold border-2 border-transparent hover:border-ink transition-colors">
                {l}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden md:flex items-center gap-2">
            {user ? (
              <Link to="/app" className="btn bg-accent text-sm">Go to dashboard <ArrowRight className="w-4 h-4" /></Link>
            ) : (
              <>
                <Link to="/login" className="btn bg-white text-sm">Log in</Link>
                <Link to="/signup" className="btn bg-ink text-white text-sm">Sign up</Link>
              </>
            )}
          </div>
          <button className="md:hidden ml-auto btn bg-white p-2" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t-2 border-ink bg-white px-4 py-4 space-y-2">
            {links.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="block px-3 py-2.5 font-bold border-2 border-ink">
                {l}
              </a>
            ))}
            {routeLinks.map(([l, h]) => (
              <Link key={h} to={h} className="block px-3 py-2.5 font-bold border-2 border-ink">
                {l}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {user ? (
                <Link to="/app" className="btn bg-accent col-span-2">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn bg-white">Log in</Link>
                  <Link to="/signup" className="btn bg-ink text-white">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative bg-grid border-b-2 border-ink overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-wrap gap-2 mb-6">
              <span className="tag bg-sun">For SSC · RRB · Court aspirants</span>
              <span className="tag bg-white">English + हिंदी</span>
            </motion.div>
            <h1 className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem] tracking-tight">
              {['Master Typing.', 'Improve Speed.', 'Build Your Future.'].map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.12, duration: 0.45, ease: 'easeOut' }}
                >
                  {i === 1 ? (
                    <span className="inline-block bg-accent border-2 border-ink px-2 -rotate-1 shadow-brut my-1">{line}</span>
                  ) : i === 2 ? (
                    <span className="relative inline-block">
                      {line}
                      <span className="absolute left-0 right-0 -bottom-1 h-3 bg-go/80 -z-10" />
                    </span>
                  ) : (
                    line
                  )}
                </motion.span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
              TypeSprint is a focused typing trainer for Indian students and government-job aspirants. Learn touch typing from the home row up, practise real exam-style passages, and track every test — speed, accuracy and mistakes.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className="btn bg-accent text-base px-6 py-3.5">
                Start Practicing <ArrowRight className="w-5 h-5" />
              </Link>
              {!user && (
                <>
                  <Link to="/login" className="btn bg-white text-base px-5 py-3.5">Login</Link>
                  <Link to="/signup" className="btn bg-ink text-white text-base px-5 py-3.5">Sign Up</Link>
                </>
              )}
            </motion.div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              {['Free to use', '20 practice modes', 'Progress saved to your account'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-go" strokeWidth={3} /> {t}</span>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="relative">
            <div className="absolute -top-5 -left-4 z-10 tag bg-go text-white border-ink shadow-brut-sm rotate-[-4deg]">Mistakes in red</div>
            <DemoTyper />
            <div className="hidden sm:flex absolute -bottom-6 -right-3 card-b bg-sun px-4 py-2 items-center gap-2 rotate-[3deg]">
              <Keyboard className="w-4 h-4" /> <span className="font-mono text-sm font-bold">asdf · jkl;</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-ink text-white border-b-2 border-ink overflow-hidden py-3">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0">
              {['HOME ROW', 'SSC CHSL', 'RRB NTPC', 'हिंदी टाइपिंग', '15-MIN TESTS', 'ACCURACY', 'SPEED SPRINTS', 'MOCK TESTS', 'DAILY CHALLENGE', 'WORD RAIN'].map((w) => (
                <span key={w + k} className="font-display text-lg px-6 flex items-center gap-6">
                  {w} <span className="text-accent">✱</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20 scroll-mt-16">
        <div className="max-w-2xl mb-12">
          <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">01 / Features</div>
          <h2 className="font-display text-4xl sm:text-5xl mt-2">Everything you need. Nothing you don’t.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.05 }}
              className="card-b p-6 hover:-translate-y-1 hover:shadow-brut-lg transition-all"
            >
              <div className={`w-12 h-12 grid place-items-center border-2 border-ink ${f.color} mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="text-muted mt-2 leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODES */}
      <section id="modes" className="bg-cream border-y-2 border-ink scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">02 / Practice modes</div>
              <h2 className="font-display text-4xl sm:text-5xl mt-2">{MODES.length} ways to practise.</h2>
            </div>
            <Link to={startTo} className="btn bg-ink text-white">Try them all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MODES.map((m) => (
              <Link key={m.id} to={user ? (m.link ?? `/app/practice/${m.id}`) : '/signup'} className="group bg-white border-2 border-ink p-4 flex items-start gap-3 hover:bg-accent transition-colors">
                <m.icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-bold">{m.name}</div>
                  <div className="text-xs text-muted group-hover:text-ink line-clamp-2">{m.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LEARNING */}
      <section id="learning" className="max-w-7xl mx-auto px-4 py-20 scroll-mt-16">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12">
          <div>
            <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">03 / Learning method</div>
            <h2 className="font-display text-4xl sm:text-5xl mt-2">From home row to exam-ready.</h2>
            <p className="text-muted mt-4 text-lg leading-relaxed">
              {LESSONS.length} structured lessons in three levels. Each lesson has a speed and accuracy target — pass it to unlock the next. Repeat any lesson anytime and we’ll track your best.
            </p>
            <ol className="mt-8 space-y-3">
              {[
                ['Learn', 'Finger placement and one new key group at a time.'],
                ['Practise', 'Drills, words and sentences in 20 modes.'],
                ['Test', 'Timed and exam-pattern tests with real targets.'],
                ['Track', 'Charts, streaks and personalised tips after every test.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4 items-start">
                  <span className="w-10 h-10 shrink-0 grid place-items-center border-2 border-ink bg-sun font-display">{i + 1}</span>
                  <div>
                    <div className="font-bold">{t}</div>
                    <div className="text-sm text-muted">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {LEVELS.map((lvl, li) => (
              <div key={lvl} className={`card-b p-5 ${li === 0 ? 'bg-go-soft' : li === 1 ? 'bg-accent-soft' : 'bg-white'}`}>
                <div className="tag bg-white mb-3">Level {li + 1}</div>
                <h3 className="font-display text-2xl mb-4">{lvl}</h3>
                <ul className="space-y-2">
                  {LESSONS.filter((l) => l.level === lvl).map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-sm font-medium">
                      {l.num === 1 ? <Check className="w-4 h-4 text-go shrink-0" strokeWidth={3} /> : <Lock className="w-3.5 h-3.5 text-ink/40 shrink-0" />}
                      <span className="truncate">{l.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKING */}
      <section className="bg-ink text-white border-y-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">04 / Progress tracking</div>
            <h2 className="font-display text-4xl sm:text-5xl mt-2">Every keystroke counts. Literally.</h2>
            <p className="text-white/70 mt-4 text-lg leading-relaxed">
              Your dashboard turns each test into insight: WPM trends, accuracy history, the exact keys you miss most, and how close you are to today’s goal.
            </p>
            <Link to={user ? '/app' : '/signup'} className="btn bg-accent text-ink mt-8 border-white">
              {user ? 'Open dashboard' : 'Create free account'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TRACKED.map((t, i) => (
              <div key={t.label} className={`border-2 border-white p-4 flex items-center gap-3 ${i % 3 === 0 ? 'bg-accent text-ink border-ink' : ''}`}>
                <t.icon className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMS */}
      <section id="exams" className="max-w-7xl mx-auto px-4 py-20 scroll-mt-16">
        <div className="max-w-2xl mb-10">
          <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">05 / Exam preparation</div>
          <h2 className="font-display text-4xl sm:text-5xl mt-2">Practise against real targets.</h2>
          <p className="text-muted mt-3">Pattern-style tests with common qualifying speeds. Requirements can change by notification — always confirm with the official notice.</p>
        </div>
        <div className="card-b overflow-x-auto">
          <table className="w-full text-left min-w-[520px]">
            <thead className="bg-sun border-b-2 border-ink font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Exam pattern</th>
                <th className="p-4">Language</th>
                <th className="p-4">Target</th>
                <th className="p-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(GOV_EXAMS).map(([k, e]) => (
                <tr key={k} className="border-b-2 border-ink/10 last:border-0">
                  <td className="p-4 font-bold">{e.label.split(' — ')[0]}</td>
                  <td className="p-4">{e.lang === 'hi' ? 'Hindi' : 'English'}</td>
                  <td className="p-4 font-display">{e.wpm} WPM</td>
                  <td className="p-4">{e.mins} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CERTIFICATION */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto card-b bg-sun p-8 sm:p-12 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="font-mono text-sm font-bold uppercase tracking-widest">06 / Certification</div>
            <h2 className="font-display text-3xl sm:text-5xl mt-2 leading-tight">Get a verifiable typing certificate.</h2>
            <p className="mt-3 font-medium max-w-xl">Three levels — Beginner, Intermediate and Professional. Server-validated scores, a PDF certificate with a unique serial number and QR code, and public online verification.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/certification" className="btn bg-ink text-white">Typing Certification Test <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/verify" className="btn bg-white">Verify Certificate</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['L1', '20 WPM', '90%'], ['L2', '30 WPM', '95%'], ['L3', '40 WPM', '97%']].map(([l, w, a]) => (
              <div key={l} className="bg-white border-2 border-ink p-3 text-center shadow-brut-sm">
                <div className="font-display text-2xl">{l}</div>
                <div className="text-sm font-bold">{w}</div>
                <div className="text-xs font-mono">{a} acc.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto card-b shadow-brut-lg bg-accent p-8 sm:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl sm:text-5xl leading-tight">Your next 10 minutes<br />could add 5 WPM.</h2>
            <p className="mt-3 font-medium max-w-lg">Start with a quick test, see your baseline, and follow the lesson path from there.</p>
          </div>
          <Link to={startTo} className="btn bg-ink text-white text-lg px-7 py-4">
            Start Practicing <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-ink bg-cream">
        <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="text-sm text-muted mt-3 max-w-xs">A modern typing trainer built for Indian students and government-job aspirants.</p>
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest mb-3">Product</div>
            <ul className="space-y-2 text-sm font-semibold">
              <li><a href="#features" className="hover:text-accent">Features</a></li>
              <li><a href="#modes" className="hover:text-accent">Practice modes</a></li>
              <li><a href="#learning" className="hover:text-accent">Lessons</a></li>
              <li><a href="#exams" className="hover:text-accent">Exam tests</a></li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest mb-3">Account</div>
            <ul className="space-y-2 text-sm font-semibold">
              <li><Link to="/login" className="hover:text-accent">Log in</Link></li>
              <li><Link to="/signup" className="hover:text-accent">Sign up</Link></li>
              <li><Link to="/app" className="hover:text-accent">Dashboard</Link></li>
              <li><Link to="/app/profile" className="hover:text-accent">Profile & progress</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest mb-3">Practice</div>
            <ul className="space-y-2 text-sm font-semibold">
              <li><Link to="/app/practice/timed" className="hover:text-accent">Timed tests</Link></li>
              <li><Link to="/app/practice/gov-exam" className="hover:text-accent">Govt. exam tests</Link></li>
              <li><Link to="/app/practice/hindi" className="hover:text-accent">Hindi typing</Link></li>
              <li><Link to="/app/game" className="hover:text-accent">Word Rain game</Link></li>
              <li><Link to="/certification" className="hover:text-accent">Typing Certification</Link></li>
              <li><Link to="/verify" className="hover:text-accent">Verify Certificate</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t-2 border-ink">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap gap-3 justify-between text-xs font-mono">
            <span>© {new Date().getFullYear()} TypeSprint. Made in India for typists everywhere.</span>
            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Practice daily. Type faster.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
