"use client";

import React from 'react';
import { Heart, Check } from 'lucide-react';

type Props = {
  title: string;
  url?: string | null;
  store?: string | null;
  className?: string;
};

const AddToWishlistButton: React.FC<Props> = ({ title, url, store, className }) => {
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;

    async function doCheck() {
      try {
        const norm = (s?: string | null) => (s || '').toString().toLowerCase().trim();
        const titleNorm = norm(title);
        const urlNorm = norm(url);

        if (url) {
          // Prefer exact URL lookup (server checks url equality first)
          const res = await fetch(`/api/db/watchlist?q=${encodeURIComponent(String(url))}`);
          const json = await res.json();
          if (!mounted) return;
          if (json && Array.isArray(json.items) && json.items.length) {
            const matched = json.items.some((it: any) => it && it.url && norm(it.url) === urlNorm);
            if (matched) return setSaved(true);
          }
          return setSaved(false);
        }

        // No URL: fetch recent watchlist and check exact title equality client-side
        const res2 = await fetch(`/api/db/watchlist?limit=200`);
        const json2 = await res2.json();
        if (!mounted) return;
        if (json2 && Array.isArray(json2.items) && json2.items.length) {
          const matched = json2.items.some((it: any) => it && it.title && norm(it.title) === titleNorm);
          if (matched) setSaved(true);
          else setSaved(false);
        } else {
          setSaved(false);
        }
      } catch (e) {
        // ignore
      }
    }

    doCheck();

    const onAdded = () => { doCheck(); };
    window.addEventListener('watchlist:added', onAdded as EventListener);
    return () => { mounted = false; window.removeEventListener('watchlist:added', onAdded as EventListener); };
  }, [title, url]);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saved) return; // idempotent for now
    try {
      setLoading(true);
      const res = await fetch('/api/db/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, store }),
      });
      const json = await res.json();
      if (json && json.ok) {
        setSaved(true);
        window.dispatchEvent(new CustomEvent('watchlist:added', { detail: { id: json.id, title } }));
      }
    } catch (err) {
      console.error('Add to wishlist failed', err);
    } finally {
      setLoading(false);
    }
  }

  const label = saved ? 'Saved' : loading ? 'Saving...' : 'Add to wishlist';

  const baseBtnClass = className || 'inline-flex items-center justify-center rounded-full p-2';

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        aria-pressed={saved}
        title={label}
        className={`${baseBtnClass} ${saved ? 'bg-green-600 text-white' : 'bg-violet-600 text-white'} ${loading ? 'opacity-60' : ''}`}
      >
        {saved ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
      </button>
      {saved && (
        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-green-600 text-white text-xs font-semibold">Saved</span>
      )}
    </div>
  );
};

export default AddToWishlistButton;
