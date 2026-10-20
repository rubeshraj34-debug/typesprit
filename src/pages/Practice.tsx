import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { MODES, CATEGORIES, type Category } from '../lib/modes';

export default function Practice() {
  const [cat, setCat] = useState<Category | 'All'>('All');
  const list = cat === 'All' ? MODES : MODES.filter((m) => m.category === cat);
  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">{MODES.length} modes</div>
        <h1 className="font-display text-3xl sm:text-4xl">Practice modes</h1>
        <p className="text-muted mt-1">Pick a mode. Every completed test is saved to your progress.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`btn text-sm py-1.5 px-3 ${cat === c ? 'bg-ink text-white' : 'bg-white'}`}
            aria-pressed={cat === c}
          >
            {c}
          </button>
        ))}
      </div>
      {(cat === 'All' ? CATEGORIES : [cat]).map((c) => {
        const items = list.filter((m) => m.category === c);
        if (!items.length) return null;
        return (
          <section key={c}>
            <h2 className="font-display text-lg mb-3 flex items-center gap-3">
              {c} <span className="flex-1 h-0.5 bg-ink/15" />
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((m) => (
                <Link key={m.id} to={m.link ?? `/app/practice/${m.id}`} className="group card-b p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-brut-lg transition-all">
                  <div className="flex items-start justify-between">
                    <span className="w-11 h-11 grid place-items-center border-2 border-ink bg-accent-soft group-hover:bg-accent transition-colors">
                      <m.icon className="w-5 h-5" />
                    </span>
                    {m.tag ? <span className="tag bg-sun">{m.tag}</span> : <ArrowUpRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />}
                  </div>
                  <div>
                    <h3 className="font-display text-lg leading-tight">{m.name}</h3>
                    <p className="text-sm text-muted mt-1 leading-snug">{m.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
