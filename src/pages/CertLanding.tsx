import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardList, Keyboard, ServerCog, FileBadge, ShieldCheck, QrCode, Briefcase, Share2, BadgeCheck, Timer, Target, Gauge } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import CertificatePreview from '../components/CertificatePreview';
import { LEVEL_LIST } from '../lib/cert';
import { useAuth } from '../lib/auth';

const STEPS = [
  { icon: ClipboardList, title: 'Register', text: 'Fill a short form with your name, location, language and level.' },
  { icon: Keyboard, title: 'Take the test', text: 'A timed passage with live WPM, accuracy and error highlighting.' },
  { icon: ServerCog, title: 'Server validation', text: 'Your score is recalculated on our server from your typed text.' },
  { icon: FileBadge, title: 'Get certified', text: 'Pass and download a PDF certificate with a unique serial & QR.' },
];

const BENEFITS = [
  { icon: Briefcase, title: 'Strengthen job applications', text: 'Show verified typing speed for clerk, DEO, assistant and office roles.' },
  { icon: QrCode, title: 'Instantly verifiable', text: 'Employers scan the QR code or enter the serial to confirm it is genuine.' },
  { icon: ShieldCheck, title: 'Tamper-proof', text: 'Each certificate is digitally signed. Edited or forged codes fail verification.' },
  { icon: Share2, title: 'Easy to share', text: 'Download as PDF, print it, or share the verification link anywhere.' },
];

export default function CertLanding() {
  const { user } = useAuth();
  const participate = '/app/certification/register';
  return (
    <div className="bg-white">
      <PublicHeader />

      <section className="bg-grid border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:py-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="tag bg-sun">Official TypeSprint test</span>
              <span className="tag bg-white">English + हिंदी</span>
              <span className="tag bg-go-soft">Free</span>
            </div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl sm:text-6xl leading-[1.03]">
              Typing <span className="bg-accent border-2 border-ink px-2 shadow-brut inline-block -rotate-1">Certification</span> Test
            </motion.h1>
            <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
              Prove your typing skill with a timed, server-validated test. Pass any of three levels to earn a downloadable PDF certificate with a unique serial number that anyone can verify online.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={participate} className="btn bg-accent text-base px-6 py-3.5">Participate Now <ArrowRight className="w-5 h-5" /></Link>
              <Link to="/verify" className="btn bg-white text-base px-5 py-3.5"><BadgeCheck className="w-5 h-5" /> Verify a certificate</Link>
            </div>
            {!user && <p className="text-sm text-muted mt-4">You’ll be asked to log in or create a free account first, so your results are saved securely.</p>}
          </div>
          <motion.div initial={{ opacity: 0, rotate: 3, y: 16 }} animate={{ opacity: 1, rotate: 1.5, y: 0 }} transition={{ delay: 0.15 }}>
            <CertificatePreview name="Aarav Kumar" level={2} levelName="Intermediate" wpm={42} accuracy={97.4} date={Date.now()} serial="TS-L2-2026-SAMPLE" />
            <p className="text-center font-mono text-xs mt-4 text-muted">Sample certificate preview</p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">How it works</div>
        <h2 className="font-display text-3xl sm:text-4xl mt-2 mb-8">Four steps to your certificate.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card-b p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="w-11 h-11 grid place-items-center border-2 border-ink bg-accent-soft"><s.icon className="w-5 h-5" /></span>
                <span className="font-display text-3xl text-ink/20">0{i + 1}</span>
              </div>
              <h3 className="font-display text-lg">{s.title}</h3>
              <p className="text-sm text-muted mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="levels" className="bg-cream border-y-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">Levels & passing requirements</div>
          <h2 className="font-display text-3xl sm:text-4xl mt-2 mb-8">Choose your challenge.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {LEVEL_LIST.map((l) => (
              <div key={l.level} className={`card-b p-6 flex flex-col ${l.color}`}>
                <span className="tag bg-white self-start">Level {l.level}</span>
                <h3 className="font-display text-3xl mt-3">{l.name}</h3>
                <p className="text-sm text-muted mt-2 flex-1">{l.blurb}</p>
                <div className="grid grid-cols-3 gap-2 mt-5">
                  {[[Timer, `${l.duration / 60} min`, 'Duration'], [Gauge, `${l.wpm} WPM`, 'Min. speed'], [Target, `${l.acc}%`, 'Min. accuracy']].map(([Icon, v, lab]) => {
                    const I = Icon as typeof Timer;
                    return (
                      <div key={lab as string} className="bg-white border-2 border-ink p-2">
                        <I className="w-4 h-4" />
                        <div className="font-display text-base mt-1">{v as string}</div>
                        <div className="text-[0.65rem] font-mono uppercase">{lab as string}</div>
                      </div>
                    );
                  })}
                </div>
                <Link to={`${participate}?level=${l.level}`} className="btn bg-ink text-white mt-5">Register for Level {l.level}</Link>
              </div>
            ))}
          </div>
          <div className="card-b mt-8 p-5 text-sm space-y-2">
            <h3 className="font-display text-lg mb-1">Test rules</h3>
            <p>• <b>Net WPM</b> = correctly typed characters ÷ 5 ÷ full test duration in minutes. Ending early does not shorten the duration used for scoring.</p>
            <p>• <b>Accuracy</b> counts every wrong keystroke, including ones you later corrected with Backspace. Copy-paste is disabled.</p>
            <p>• You must meet <b>both</b> the speed and accuracy requirement to pass. You may retake the test any number of times.</p>
            <p>• Final scores are recalculated by the TypeSprint server; submissions that are tampered with or humanly implausible are rejected.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">Certificate benefits</div>
        <h2 className="font-display text-3xl sm:text-4xl mt-2 mb-8">A certificate that means something.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card-b p-5">
              <b.icon className="w-6 h-6 text-accent" />
              <h3 className="font-display text-lg mt-3">{b.title}</h3>
              <p className="text-sm text-muted mt-1">{b.text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-6 max-w-3xl">
          TypeSprint certificates demonstrate skill measured on this platform. They are not a substitute for the official skill tests conducted by SSC, RRB, courts or other recruiting bodies.
        </p>
      </section>

      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto card-b shadow-brut-lg bg-accent p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">Ready to get certified?</h2>
            <p className="font-medium mt-2">Registration takes under a minute.</p>
          </div>
          <Link to={participate} className="btn bg-ink text-white text-lg px-7 py-4">Participate Now <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      <footer className="border-t-2 border-ink bg-cream">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap justify-between gap-3 text-sm font-semibold">
          <span className="font-mono text-xs">© {new Date().getFullYear()} TypeSprint Certification</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-accent">Home</Link>
            <Link to="/verify" className="hover:text-accent">Verify Certificate</Link>
            <Link to="/app/certificates" className="hover:text-accent">My Certificates</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
