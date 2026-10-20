import { Link } from 'react-router-dom';

export default function NotFound({ inApp = false }: { inApp?: boolean }) {
  return (
    <div className={`grid place-items-center ${inApp ? 'min-h-[50vh]' : 'min-h-screen bg-grid'} p-6`}>
      <div className="card-b p-8 text-center max-w-md">
        <div className="font-display text-7xl text-accent">404</div>
        <h1 className="font-display text-2xl mt-2">Page not found</h1>
        <p className="text-muted mt-2">That key doesn’t exist on our keyboard. Let’s get you back on track.</p>
        <Link to={inApp ? '/app' : '/'} className="btn bg-accent mt-5">
          {inApp ? 'Go to dashboard' : 'Go home'}
        </Link>
      </div>
    </div>
  );
}
