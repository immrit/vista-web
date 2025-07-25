import { supabase, Post, Profile } from '@/lib/supabase';
import { Navigation } from '@/components/ui/Navigation';
import ProfileTabsUI from './ProfileTabsUI';
import { notFound } from 'next/navigation';

interface PostWithProfile extends Post {
    profiles?: Profile;
}

export default async function ProfileByUsernamePage({ params }: { params: { username: string } }) {
    const lang: 'fa' = 'fa';
    const isRtl = lang === 'fa';
    // Fetch profile by username
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.username)
        .single();

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-lg text-gray-500 dark:text-gray-300">
                کاربری با این نام کاربری پیدا نشد :(
            </div>
        );
    }

    // Fetch posts for this user
    const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles:profiles!posts_user_id_fkey(*)')
        .eq('user_id', profile.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    const posts = (postsData || []) as PostWithProfile[];
    const musicPosts = posts.filter(post => post.music_url);

    return <ProfileTabsUI profile={profile} posts={posts} musicPosts={musicPosts} lang={lang} isRtl={isRtl} />;
} 