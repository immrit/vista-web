import { supabase, Post, Profile } from '@/lib/supabase';
import ProfileTabsUI from './ProfileTabsUI';

interface PostWithProfile extends Post {
    profiles?: Profile;
}

export default async function ProfileByUsernamePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const lang = 'fa' as const;
    const isRtl = lang === 'fa';

    // Fetch profile by username
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
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

    return <ProfileTabsUI profile={profile} posts={posts} musicPosts={musicPosts} isRtl={isRtl} />;
} 