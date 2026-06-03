import { commentApi } from '@/lib/backendApi';
import { PostWithProfile } from '@/lib/types';

export class PostPreloader {
  private preloadQueue: Set<string> = new Set();
  private preloadedImages: Set<string> = new Set();

  preloadNext(currentIndex: number, posts: PostWithProfile[]) {
    const nextPost = posts[currentIndex + 1];
    if (!nextPost || this.preloadQueue.has(nextPost.id)) return;

    this.preloadQueue.add(nextPost.id);

    if (nextPost.image_url && !this.preloadedImages.has(nextPost.image_url)) {
      this.preloadImage(nextPost.image_url);
    }

    if (nextPost.video_url && !this.preloadedImages.has(nextPost.video_url)) {
      this.preloadImage(nextPost.video_url);
    }

    this.preloadComments(nextPost.id).catch(console.error);
  }

  private preloadImage(url: string) {
    if (this.preloadedImages.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.preloadedImages.add(url);
    };
  }

  private async preloadComments(postId: string) {
    try {
      await commentApi.list(postId);
    } catch (error) {
      console.debug('Failed to preload comments:', error);
    }
  }

  preloadBatch(posts: PostWithProfile[], startIndex: number, count: number = 3) {
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      if (index < posts.length) {
        this.preloadNext(index, posts);
      }
    }
  }

  clear() {
    this.preloadQueue.clear();
    this.preloadedImages.clear();
  }
}

export const postPreloader = new PostPreloader();
