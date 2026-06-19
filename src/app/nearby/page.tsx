'use client';

import { useEffect, useState } from 'react';
import { useNearbyDiscover, useNearbyLocation, useNearbyPreferences, useUpdateNearbyPreferences } from '@/hooks/useNearby';
import { SwipeCard } from '@/components/nearby/SwipeCard';
import { MatchCelebration } from '@/components/nearby/MatchCelebration';
import { NearbyPreferencesSheet } from '@/components/nearby/NearbyPreferencesSheet';
import { LocationPermissionScreen } from '@/components/nearby/LocationPermissionScreen';
import { NearbyMatchesList } from '@/components/nearby/NearbyMatchesList';
import { useAuth } from '@/hooks/useAuth';
import { SlidersHorizontal, Heart, RefreshCw, Loader2, Users } from 'lucide-react';
import { MobileTopBar } from '@/components/layout/MobileTopBar';

type Tab = 'discover' | 'matches';

export default function NearbyPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('discover');
  const [showPrefs, setShowPrefs] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  const { data: prefs, isLoading: prefsLoading } = useNearbyPreferences();
  const updatePrefs = useUpdateNearbyPreferences();
  const location = useNearbyLocation();
  const { cards, loading, error, load, swipe, matchResult, dismissMatch } = useNearbyDiscover();

  useEffect(() => {
    if (prefsLoading) return;
    if (prefs?.has_location) {
      setLocationGranted(true);
      load(true);
    } else {
      setLocationGranted(false);
    }
  }, [prefsLoading, prefs?.has_location]);

  const handleLocationRequest = async () => {
    const ok = await location.requestAndSend();
    if (ok) {
      setLocationGranted(true);
      load(true);
    }
  };

  const handleSkipLocation = () => {
    setLocationGranted(true);
    load(false);
  };

  const handleRefresh = () => {
    load(locationGranted === true && prefs?.has_location);
  };

  if (prefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-vista-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vista-bg dark:bg-vista-bg-dark">
      <MobileTopBar
        title="اطراف من"
        rightAction={
          <button
            onClick={() => setShowPrefs(true)}
            className="p-2 rounded-xl hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors"
            aria-label="تنظیمات"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        }
      />

      {/* Tab selector */}
      <div className="flex gap-1 mx-4 mt-4 p-1 bg-vista-surface-variant dark:bg-vista-surface-variant-dark rounded-2xl">
        <button
          onClick={() => setTab('discover')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'discover'
              ? 'bg-white dark:bg-vista-surface-dark shadow-sm text-vista-primary'
              : 'text-vista-text-secondary dark:text-vista-text-secondary-dark'
          }`}
        >
          <Users className="w-4 h-4" />
          کشف
        </button>
        <button
          onClick={() => setTab('matches')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'matches'
              ? 'bg-white dark:bg-vista-surface-dark shadow-sm text-vista-primary'
              : 'text-vista-text-secondary dark:text-vista-text-secondary-dark'
          }`}
        >
          <Heart className="w-4 h-4" />
          متچ‌ها
        </button>
      </div>

      {tab === 'matches' ? (
        <NearbyMatchesList />
      ) : locationGranted === false ? (
        <LocationPermissionScreen
          status={location.status}
          onRequest={handleLocationRequest}
          onSkip={handleSkipLocation}
        />
      ) : (
        <div className="relative flex flex-col items-center px-4 pt-6">
          {/* Card stack */}
          <div
            className="relative w-full max-w-sm"
            style={{ height: 'min(70vh, 520px)' }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-vista-primary" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-vista-error">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 bg-vista-primary text-white px-5 py-2.5 rounded-xl font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  تلاش مجدد
                </button>
              </div>
            ) : cards.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="text-6xl mb-2">🎭</div>
                <h2 className="text-xl font-bold">کسی پیدا نشد!</h2>
                <p className="text-vista-text-secondary dark:text-vista-text-secondary-dark text-sm">
                  فیلترها را تغییر دهید یا بعداً دوباره امتحان کنید.
                </p>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 bg-vista-gradient text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-vista-primary/25"
                >
                  <RefreshCw className="w-4 h-4" />
                  بروزرسانی
                </button>
              </div>
            ) : (
              cards.slice(0, 3).map((card, i) => (
                <SwipeCard
                  key={card.user_id}
                  candidate={card}
                  onSwipe={swipe}
                  isTop={i === 0}
                  stackIndex={i}
                />
              ))
            )}
          </div>

          {/* Refresh button when cards are low */}
          {cards.length > 0 && cards.length <= 2 && !loading && (
            <button
              onClick={handleRefresh}
              className="mt-20 flex items-center gap-2 text-vista-primary text-sm font-semibold py-2 px-4 rounded-xl hover:bg-vista-primary/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              بارگذاری بیشتر
            </button>
          )}
        </div>
      )}

      {/* Match celebration overlay */}
      {matchResult && (
        <MatchCelebration
          match={matchResult}
          myAvatarUrl={profile?.avatar_url ?? undefined}
          onDismiss={dismissMatch}
        />
      )}

      {/* Preferences sheet */}
      {showPrefs && prefs && (
        <NearbyPreferencesSheet
          preferences={prefs}
          onSave={async (p) => { await updatePrefs.mutateAsync(p); }}
          onClose={() => setShowPrefs(false)}
        />
      )}
    </div>
  );
}
