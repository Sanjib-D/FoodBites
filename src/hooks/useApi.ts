import { useState, useEffect } from 'react';

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'An error occurred');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [url]);

  return { data, loading, error };
}
