import { postApi } from './backendApi';
import { PostWithProfile } from './types';

export class PostService {
    static async getPost(
        postId: string,
        userId?: string,
        hints?: { username?: string; userId?: string },
    ): Promise<PostWithProfile | null> {
        const cleanPostId = postId.replace(/%5B|%5D/g, '').replace(/\[|\]/g, '');
        if (!cleanPostId || cleanPostId === 'id' || cleanPostId === 'undefined' || cleanPostId === 'null') {
            return null;
        }

        if (userId) {
            try {
                return await postApi.get(cleanPostId);
            } catch {
                return null;
            }
        }

        try {
            const query = new URLSearchParams();
            if (hints?.username) query.set('username', hints.username);
            if (hints?.userId) query.set('userId', hints.userId);
            const suffix = query.toString() ? `?${query.toString()}` : '';
            const response = await fetch(`/api/public/posts/${encodeURIComponent(cleanPostId)}${suffix}`, {
                cache: 'no-store',
            });
            if (!response.ok) return null;
            return (await response.json()) as PostWithProfile;
        } catch {
            return null;
        }
    }
}
