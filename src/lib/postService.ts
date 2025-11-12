import { supabase } from './supabase';
import { PostWithProfile } from './types';

export class PostService {
    static async checkPublishedPosts(): Promise<void> {
        try {
            console.log('Checking for published posts...');

            const { data, error } = await supabase
                .from('posts')
                .select('id, status, user_id')
                .eq('status', 'published')
                .limit(5);

            console.log('Published posts check result:', { data, error });

            if (data && data.length > 0) {
                console.log('Found published posts:', data);
            } else {
                console.log('No published posts found');
            }
        } catch (error) {
            console.error('Error checking published posts:', error);
        }
    }

    static async getPublicPost(postId: string): Promise<PostWithProfile | null> {
        try {
            console.log('PostService.getPublicPost called with ID:', postId);

            // Use a more permissive query for public access
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles:profiles!posts_user_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        verification_type
                    )
                `)
                .eq('id', postId)
                .eq('status', 'published')
                .single();

            console.log('Public post query result:', { data, error });

            if (error) {
                console.error('Error fetching public post:', error);
                return null;
            }

            return data as PostWithProfile;
        } catch (error) {
            console.error('Error in getPublicPost:', error);
            return null;
        }
    }

    static async getPost(postId: string, userId?: string): Promise<PostWithProfile | null> {
        try {
            console.log('PostService.getPost called with ID:', postId, 'User ID:', userId);

            // Clean up postId - handle URL encoding issues
            const cleanPostId = postId.replace(/%5B|%5D/g, '').replace(/\[|\]/g, '');
            console.log('PostService: Cleaned post ID:', cleanPostId);

            if (cleanPostId === 'id' || !cleanPostId || cleanPostId === 'undefined' || cleanPostId === 'null') {
                console.error('PostService: Invalid post ID:', cleanPostId);
                return null;
            }

            // Approach 1: Try direct Supabase query first (most reliable)
            console.log('Trying direct Supabase query...');
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles:profiles!posts_user_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        verification_type
                    )
                `)
                .eq('id', cleanPostId)
                .single();

            console.log('Direct query result:', { data, error });

            if (!error && data) {
                // If we got data, check if user can access it
                if (userId) {
                    // Authenticated users can see their own posts or published posts
                    if (data.status === 'published' || data.user_id === userId) {
                        return data as PostWithProfile;
                    }
                } else {
                    // Non-authenticated users can only see published posts
                    if (data.status === 'published') {
                        return data as PostWithProfile;
                    }
                }

                console.log('Post found but user cannot access it');
                return null;
            }

            // Approach 2: If direct query failed, try API route
            console.log('Direct query failed, trying API route...');
            try {
                const response = await fetch(`/api/posts/${cleanPostId}`);
                console.log('API response status:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    console.log('API route succeeded:', result);
                    return result.post as PostWithProfile;
                } else {
                    console.log('API route failed with status:', response.status);
                    const errorText = await response.text();
                    console.log('API error response:', errorText);
                }
            } catch (apiError) {
                console.log('API route error:', apiError);
            }

            // Approach 3: Try with status filter as last resort
            console.log('Trying with status filter...');
            const { data: statusData, error: statusError } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles:profiles!posts_user_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        verification_type
                    )
                `)
                .eq('id', cleanPostId)
                .eq('status', 'published')
                .single();

            console.log('Status filter query result:', { statusData, statusError });

            if (!statusError && statusData) {
                return statusData as PostWithProfile;
            }

            console.error('All approaches failed to fetch post');
            return null;
        } catch (error) {
            console.error('Error in getPost:', error);
            return null;
        }
    }
} 