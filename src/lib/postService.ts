import { postApi } from './backendApi';
import { PostWithProfile } from './types';

export class PostService {
    static async checkPublishedPosts(): Promise<void> {
        try {
            console.log('Checking for published posts...');

            const data = await postApi.feed(5, 0);
            
            console.log('Published posts check result:', data);

            if (data.posts.length > 0) {
                console.log('Found published posts:', data.posts);
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

            return await postApi.get(postId);
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

            try {
                // We use apiClient which automatically handles auth tokens
                return await postApi.get(cleanPostId);
            } catch (apiError) {
                console.error('API route error:', apiError);
            }

            console.error('All approaches failed to fetch post');
            return null;
        } catch (error) {
            console.error('Error in getPost:', error);
            return null;
        }
    }
}
