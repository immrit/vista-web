'use client';

import { useState } from 'react';
import { NearbyPreferences } from '@/lib/nearbyApi';
import { X, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface NearbyPreferencesSheetProps {
  preferences: NearbyPreferences;
  onSave: (prefs: Omit<NearbyPreferences, 'is_enabled' | 'has_location'>) => Promise<void>;
  onClose: () => void;
}

export function NearbyPreferencesSheet({ preferences, onSave, onClose }: NearbyPreferencesSheetProps) {
  const [interestedIn, setInterestedIn] = useState(preferences.interested_in);
  const [minAge, setMinAge] = useState(preferences.min_age);
  const [maxAge, setMaxAge] = useState(preferences.max_age);
  const [maxDist, setMaxDist] = useState(preferences.max_distance_km);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (minAge >= maxAge) {
      toast.error('Ø­Ø¯Ø§Ù‚Ù„ Ø³Ù† Ø¨Ø§ÛŒØ¯ Ú©Ù…ØªØ± Ø§Ø² Ø­Ø¯Ø§Ú©Ø«Ø± Ø¨Ø§Ø´Ø¯');
      return;
    }
    setSaving(true);
    try {
      await onSave({ interested_in: interestedIn, min_age: minAge, max_age: maxAge, max_distance_km: maxDist });
      toast.success('ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯');
      onClose();
    } catch {
      toast.error('Ø®Ø·Ø§ Ø¯Ø± Ø°Ø®ÛŒØ±Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-vista-surface dark:bg-vista-surface-dark rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-in-bottom p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-vista-primary/10 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-vista-primary" />
            </div>
            <h2 className="text-lg font-bold">ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ú©Ø´Ù</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Interested in */}
          <div>
            <label className="text-sm font-semibold text-vista-text-secondary dark:text-vista-text-secondary-dark mb-3 block">
              Ø¹Ù„Ø§Ù‚Ù‡â€ŒÙ…Ù†Ø¯ Ø¨Ù‡
            </label>
            <div className="flex gap-2">
              {(['all', 'female', 'male'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setInterestedIn(opt)}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    interestedIn === opt
                      ? 'bg-vista-primary text-white shadow-lg shadow-vista-primary/25'
                      : 'bg-vista-surface-variant dark:bg-vista-surface-variant-dark text-vista-text-secondary dark:text-vista-text-secondary-dark'
                  }`}
                >
                  {opt === 'all' ? 'Ù‡Ù…Ù‡' : opt === 'female' ? 'Ø²Ù†Ø§Ù†' : 'Ù…Ø±Ø¯Ø§Ù†'}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div>
            <label className="text-sm font-semibold text-vista-text-secondary dark:text-vista-text-secondary-dark mb-1 flex justify-between">
              <span>Ù…Ø­Ø¯ÙˆØ¯Ù‡ Ø³Ù†ÛŒ</span>
              <span className="font-bold text-vista-text-primary dark:text-vista-text-primary-dark">{minAge} - {maxAge} Ø³Ø§Ù„</span>
            </label>
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-3">
                <span className="text-xs w-14 text-left">Ø­Ø¯Ø§Ù‚Ù„: {minAge}</span>
                <input
                  type="range"
                  min={18}
                  max={maxAge - 1}
                  value={minAge}
                  onChange={e => setMinAge(Number(e.target.value))}
                  className="flex-1 accent-vista-primary"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-14 text-left">Ø­Ø¯Ø§Ú©Ø«Ø±: {maxAge}</span>
                <input
                  type="range"
                  min={minAge + 1}
                  max={70}
                  value={maxAge}
                  onChange={e => setMaxAge(Number(e.target.value))}
                  className="flex-1 accent-vista-primary"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-sm font-semibold text-vista-text-secondary dark:text-vista-text-secondary-dark mb-1 flex justify-between">
              <span>Ø­Ø¯Ø§Ú©Ø«Ø± ÙØ§ØµÙ„Ù‡</span>
              <span className="font-bold text-vista-text-primary dark:text-vista-text-primary-dark">
                {maxDist >= 100 ? 'Ø¨Ø¯ÙˆÙ† Ù…Ø­Ø¯ÙˆØ¯ÛŒØª' : `${maxDist} Ú©ÛŒÙ„ÙˆÙ…ØªØ±`}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={maxDist}
              onChange={e => setMaxDist(Number(e.target.value))}
              className="w-full mt-3 accent-vista-primary"
            />
            <div className="flex justify-between text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark mt-1">
              <span>Û± Ú©ÛŒÙ„ÙˆÙ…ØªØ±</span>
              <span>Ø¨Ø¯ÙˆÙ† Ù…Ø­Ø¯ÙˆØ¯ÛŒØª</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 w-full bg-vista-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-vista-primary/25 hover:opacity-90 active:scale-98 transition-all disabled:opacity-60"
        >
          {saving ? 'Ø¯Ø± Ø­Ø§Ù„ Ø°Ø®ÛŒØ±Ù‡...' : 'Ø°Ø®ÛŒØ±Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª'}
        </button>
      </div>
    </div>
  );
}

