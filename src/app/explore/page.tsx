'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Hash, Search, TrendingUp, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/ui/Navigation';
import { PostCard } from '@/components/ui/PostCard';
import { postApi, profileApi } from '@/lib/backendApi';
import { PostWithProfile, Profile } from '@/lib/types';

type ExploreTab = 'posts' | 'users' | 'hashtags';

export default function ExplorePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [searchResults, setSearchResults] = useState<PostWithProfile[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<ExploreTab>('posts');
  const [authChecked, setAuthChecked] = useState(false);

  const lang = 'fa';
  const isRtl = lang === 'fa';
  const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => setAuthChecked(true), 600);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!loading && !user && authChecked) {
      router.replace('/auth');
    }
  }, [authChecked, loading, router, user]);

  useEffect(() => {
    if (queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam]);

  useEffect(() => {
    if (!authChecked || !user) return;

    if (trimmedQuery) {
      performSearch(trimmedQuery);
    } else {
      fetchPopularPosts();
      fetchTrendingHashtags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, trimmedQuery, user]);

  const fetchTrendingHashtags = async () => {
    try {
      setTrendingHashtags(await postApi.trendingHashtags(20));
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      setTrendingHashtags([]);
    }
  };

  const fetchPopularPosts = async () => {
    setIsSearching(true);
    try {
      const data = await postApi.explore(20, 0);
      setSearchResults(data.posts);
      setUsers([]);
      setHashtags([]);
    } catch (error) {
      console.error('Error fetching popular posts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      if (query.startsWith('#')) {
        const tag = query.replace(/^#/, '');
        const [posts, tags] = await Promise.all([
          postApi.byHashtag(tag, 50),
          postApi.searchHashtags(tag, 20),
        ]);

        setSearchResults(posts);
        setUsers([]);
        setHashtags(tags.length ? tags : [{ tag, count: posts.length }]);
        return;
      }

      const [posts, matchedUsers, matchedTags] = await Promise.all([
        postApi.explore(50, 0),
        profileApi.search(query, 20),
        postApi.searchHashtags(query, 20),
      ]);
      const lowerQuery = query.toLowerCase();

      setSearchResults(posts.posts.filter(post => post.content.toLowerCase().includes(lowerQuery)));
      setUsers(matchedUsers);
      setHashtags(matchedTags);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setUsers([]);
      setHashtags([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (trimmedQuery) {
      router.push(`/explore?q=${encodeURIComponent(trimmedQuery)}`);
      performSearch(trimmedQuery);
    } else {
      router.push('/explore');
    }
  };

  const handleHashtagClick = (tag: string) => {
    const nextQuery = `#${tag}`;
    setSearchQuery(nextQuery);
    setActiveTab('posts');
    router.push(`/explore?q=${encodeURIComponent(nextQuery)}`);
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-gray-50 flex flex-col lg:flex-row relative" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navigation lang={lang} user={profile || undefined} />

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-center border-b border-zinc-800 dark:bg-zinc-950 bg-white shadow-sm">
        <span className="text-2xl font-bold text-white select-none font-bauhaus">جستجو</span>
      </div>

      <main className="flex-1 md:mr-[220px] pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="جستجوی کاربران، هشتگ‌ها و پست‌ها..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full h-14 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 pr-12 py-3 text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 transition-all"
              />
            </div>
          </form>

          {trimmedQuery && (
            <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700">
              {([
                ['posts', 'پست‌ها'],
                ['users', 'کاربران'],
                ['hashtags', 'هشتگ‌ها'],
              ] as [ExploreTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {!trimmedQuery && trendingHashtags.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">هشتگ‌های ترند</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => handleHashtagClick(item.tag)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Hash className="w-4 h-4 text-blue-500" />
                    <span className="text-zinc-900 dark:text-white font-medium">#{item.tag}</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {isSearching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    searchResults.map(post => <PostCard key={post.id} post={post} />)
                  ) : (
                    <EmptyState text={trimmedQuery ? 'پستی پیدا نشد.' : 'هنوز پستی برای نمایش نیست.'} />
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-3">
                  {users.length > 0 ? (
                    users.map(item => (
                      <button
                        key={item.id}
                        onClick={() => router.push(`/profile/${item.username}`)}
                        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition text-right"
                      >
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt={item.username} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white">{item.full_name || item.username}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">@{item.username}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <EmptyState text="کاربری پیدا نشد." />
                  )}
                </div>
              )}

              {activeTab === 'hashtags' && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.length > 0 ? (
                    hashtags.map(item => (
                      <button
                        key={item.tag}
                        onClick={() => handleHashtagClick(item.tag)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition"
                      >
                        <Hash className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-zinc-900 dark:text-white">#{item.tag}</span>
                        <span className="text-sm text-zinc-500">{item.count}</span>
                      </button>
                    ))
                  ) : (
                    <EmptyState text="هشتگی پیدا نشد." />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
      {text}
    </div>
  );
}
