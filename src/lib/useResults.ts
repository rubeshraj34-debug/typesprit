import { useCallback, useEffect, useState } from 'react';
import { getResults, type TestResult } from './db';
import { useAuth } from './auth';

export function useResults() {
  const { token } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResults(await getResults(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your results.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { results, loading, error, reload: load, setResults };
}
