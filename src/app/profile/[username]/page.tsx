import { getApiBaseUrl } from '@/lib/apiClient';
import { normalizePost, normalizeProfile } from '@/lib/backendApi';
import { PostWithProfile, Profile } from '@/lib/types';
import ProfileTabsUI from './ProfileTabsUI';

async function backendFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export default async function ProfileByUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const lang = 'fa' as const;
  const isRtl = lang === 'fa';

  const profileData = await backendFetch<any>(`/v1/profiles/by-username/${encodeURIComponent(username)}`);

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-lg text-gray-500 dark:text-gray-300">
        کاربری با این نام کاربری پیدا نشد.
      </div>
    );
  }

  const profile = normalizeProfile(profileData) as Profile;
  const postsData = await backendFetch<{ posts?: any[] }>(
    `/v1/users/${encodeURIComponent(profile.id)}/posts?limit=50&offset=0`,
  );
  const posts = ((postsData?.posts || []) as any[]).map(normalizePost) as PostWithProfile[];
  const musicPosts = posts.filter(post => post.music_url);

  return <ProfileTabsUI profile={profile} posts={posts} musicPosts={musicPosts} isRtl={isRtl} />;
}
