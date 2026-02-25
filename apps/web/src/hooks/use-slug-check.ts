import { useEffect, useState, useCallback, useRef } from 'react';

type SlugCheckStatus = 'idle' | 'checking' | 'available' | 'taken';

interface SlugCheckResult {
  status: SlugCheckStatus;
  suggestion?: string;
  error?: string;
}

export function useSlugCheck(slug: string): SlugCheckResult {
  const [status, setStatus] = useState<SlugCheckStatus>('idle');
  const [suggestion, setSuggestion] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkSlug = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setStatus('idle');
      setSuggestion(undefined);
      setError(undefined);
      return;
    }

    setStatus('checking');
    setSuggestion(undefined);
    setError(undefined);

    try {
      const response = await fetch(
        `/api/v1/org-slug/check?slug=${encodeURIComponent(slugToCheck)}`
      );
      const data = (await response.json()) as {
        available?: boolean;
        suggestion?: string;
        reason?: string;
        error?: string;
      };

      if (!response.ok) {
        setStatus('idle');
        setError(data.error || 'Failed to check slug availability');
        return;
      }

      if (data.available) {
        setStatus('available');
        setSuggestion(undefined);
        setError(undefined);
      } else {
        setStatus('taken');
        setSuggestion(data.suggestion);
        setError(data.reason);
      }
    } catch (err) {
      setStatus('idle');
      setError('Failed to check slug availability');
      console.error('Slug check error:', err);
    }
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce by 500ms
    timeoutRef.current = setTimeout(() => {
      checkSlug(slug);
    }, 500);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [slug, checkSlug]);

  return { status, suggestion, error };
}
