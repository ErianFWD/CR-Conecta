import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useData(path, refreshTrigger = 0) {
  const [result, setResult] = useState({ key: '', data: [], state: 'loading' });
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${path}:${refreshTrigger}:${retryCount}`;

  const retry = useCallback(() => setRetryCount(count => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    api(path, { signal: controller.signal })
      .then(result => {
        setResult({
          key: requestKey,
          data: Array.isArray(result) ? result : (result ?? []),
          state: 'ready'
        });
      })
      .catch(error => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: [], state: 'error' });
      });

    return () => controller.abort();
  }, [path, refreshTrigger, retryCount, requestKey]);

  return {
    data: result.key === requestKey ? result.data : [],
    state: result.key === requestKey ? result.state : 'loading',
    retry
  };
}
