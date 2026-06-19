'use client';

import { useRef, useState, useCallback, useEffect, KeyboardEvent } from 'react';
import { postApi, profileApi } from '@/lib/backendApi';
import { Hash, AtSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/theme/cn';

interface Suggestion {
  type: 'hashtag' | 'mention';
  value: string;
  label: string;
  sub?: string;
  avatar?: string;
}

interface SmartTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

function getWordAtCursor(text: string, pos: number): { word: string; start: number; end: number } | null {
  let start = pos - 1;
  while (start >= 0 && !/\s/.test(text[start])) start--;
  start++;
  const end = pos;
  const word = text.slice(start, end);
  if (!word) return null;
  return { word, start, end };
}

export function SmartTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 6,
  className,
  autoFocus,
}: SmartTextareaProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [triggerInfo, setTriggerInfo] = useState<{ start: number; end: number; type: '#' | '@' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [value]);

  const fetchSuggestions = useCallback(async (type: '#' | '@', query: string) => {
    if (query.length < 1) { setSuggestions([]); return; }
    setLoading(true);
    try {
      if (type === '#') {
        const results = await postApi.searchHashtags(query, 8);
        setSuggestions(results.map(h => ({
          type: 'hashtag',
          value: `#${h.tag}`,
          label: `#${h.tag}`,
          sub: h.count ? `${h.count} پست` : '',
        })));
      } else {
        const results = await profileApi.search(query, 8);
        setSuggestions(results.map(p => ({
          type: 'mention',
          value: `@${p.username}`,
          label: `@${p.username}`,
          sub: p.full_name || '',
          avatar: p.avatar_url || undefined,
        })));
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
    setActiveSuggestion(0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    onChange(newValue);

    const pos = e.target.selectionStart ?? newValue.length;
    const wordInfo = getWordAtCursor(newValue, pos);

    if (wordInfo && (wordInfo.word.startsWith('#') || wordInfo.word.startsWith('@'))) {
      const triggerChar = wordInfo.word[0] as '#' | '@';
      const query = wordInfo.word.slice(1);
      setTriggerInfo({ start: wordInfo.start, end: wordInfo.end, type: triggerChar });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(triggerChar, query), 250);
    } else {
      setTriggerInfo(null);
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    if (!triggerInfo) return;
    const before = value.slice(0, triggerInfo.start);
    const after = value.slice(triggerInfo.end);
    const newValue = `${before}${suggestion.value} ${after}`;
    onChange(maxLength ? newValue.slice(0, maxLength) : newValue);
    setSuggestions([]);
    setTriggerInfo(null);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        const cursorPos = triggerInfo.start + suggestion.value.length + 1;
        ta.setSelectionRange(cursorPos, cursorPos);
        ta.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[activeSuggestion]) {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestion]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setTriggerInfo(null);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={cn(
          'w-full bg-transparent resize-none outline-none leading-relaxed',
          className
        )}
      />

      {/* Autocomplete dropdown */}
      {(suggestions.length > 0 || loading) && (
        <div className="absolute right-0 left-0 top-full mt-1 bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-vista-primary" />
            </div>
          ) : (
            suggestions.map((s, i) => (
              <button
                key={s.value}
                type="button"
                onClick={() => applySuggestion(s)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 text-right transition-colors',
                  i === activeSuggestion
                    ? 'bg-vista-primary/10'
                    : 'hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark'
                )}
              >
                {s.type === 'hashtag' ? (
                  <div className="w-8 h-8 rounded-full bg-vista-primary/10 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-vista-primary" />
                  </div>
                ) : s.avatar ? (
                  <img src={s.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-vista-gradient flex items-center justify-center flex-shrink-0">
                    <AtSign className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="min-w-0 text-right">
                  <p className="text-sm font-semibold truncate">{s.label}</p>
                  {s.sub && <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark truncate">{s.sub}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
