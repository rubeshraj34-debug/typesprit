import { Award } from 'lucide-react';

interface Props {
  name: string;
  level: number;
  levelName: string;
  wpm: number;
  accuracy: number;
  date: number;
  serial: string;
  revoked?: boolean;
}

export default function CertificatePreview({ name, level, levelName, wpm, accuracy, date, serial, revoked }: Props) {
  return (
    <div className="relative bg-white border-2 border-ink shadow-brut-lg overflow-hidden">
      <div className="bg-accent border-b-2 border-ink px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 grid place-items-center bg-white border-2 border-ink font-display text-sm">T</span>
          <span className="font-display text-sm sm:text-base">TYPESPRINT</span>
        </div>
        <span className="font-mono text-[0.62rem] sm:text-xs font-bold truncate">{serial}</span>
      </div>
      <div className="px-5 sm:px-8 py-6 text-center">
        <div className="font-display text-base sm:text-xl leading-tight">CERTIFICATE OF TYPING PROFICIENCY</div>
        <div className="tag bg-sun mt-2">Level {level} — {levelName}</div>
        <div className="text-xs text-muted mt-4">This is to certify that</div>
        <div className="font-serif italic font-bold text-2xl sm:text-3xl mt-1 border-b-4 border-go inline-block px-4 pb-1" style={{ fontFamily: 'Georgia, Times, serif' }}>{name}</div>
        <div className="grid grid-cols-3 gap-2 mt-5 text-left">
          {[['Speed', `${Math.round(wpm)} WPM`, 'bg-accent'], ['Accuracy', `${accuracy.toFixed(1)}%`, 'bg-go-soft'], ['Issued', new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 'bg-white']].map(([l, v, c]) => (
            <div key={l} className={`border-2 border-ink px-2 py-1.5 ${c}`}>
              <div className="font-mono text-[0.55rem] font-bold uppercase">{l}</div>
              <div className="font-display text-xs sm:text-sm">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-5">
          <span className="w-12 h-12 rounded-full bg-go border-2 border-ink grid place-items-center text-white"><Award className="w-6 h-6" /></span>
          <span className="text-right">
            <span className="block italic text-sm" style={{ fontFamily: 'Georgia, serif' }}>TypeSprint Board</span>
            <span className="block font-mono text-[0.55rem] uppercase border-t border-ink pt-0.5">Controller of Certification</span>
          </span>
        </div>
      </div>
      {revoked && (
        <div className="absolute inset-0 grid place-items-center bg-white/70">
          <span className="font-display text-4xl text-bad border-4 border-bad px-4 -rotate-12 bg-white">REVOKED</span>
        </div>
      )}
    </div>
  );
}
