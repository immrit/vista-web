import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        if (!postId) {
            console.error('API: No post ID provided');
            return NextResponse.json(
                { error: 'Post ID is required' },
                { status: 400 }
            );
        }

        console.log('API: Fetching post with ID:', postId);

        // Try to get the full post with profile data directly
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
            .single();

        console.log('API: Query result:', { data, error });

        if (error) {
            console.error('API: Error fetching post:', error);

            // Check if it's a "not found" error
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Post not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: 'Post not accessible', details: error.message },
                { status: 403 }
            );
        }

        if (!data) {
            console.error('API: No data returned');
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        console.log('API: Post found:', {
            id: data.id,
            status: data.status,
            hasProfile: !!data.profiles
        });

        // Check if post is accessible (published or has no status)
        if (data.status && data.status !== 'published') {
            console.log('API: Post is not published, status:', data.status);
            return NextResponse.json(
                { error: 'Post not published', status: data.status },
                { status: 403 }
            );
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('API: Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 