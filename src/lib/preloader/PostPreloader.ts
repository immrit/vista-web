import { supabase, Post } from '@/lib/supabase';

export class PostPreloader {
  private preloadQueue: Set<string> = new Set();
  private preloadedImages: Set<string> = new Set();

  // وقتی کاربر روی یه پست hover کرد، بعدی رو preload کن
  preloadNext(currentIndex: number, posts: Post[]) {
    const nextPost = posts[currentIndex + 1];

    if (!nextPost || this.preloadQueue.has(nextPost.id)) {
      return;
    }

    this.preloadQueue.add(nextPost.id);

    // عکس‌ها رو preload کن
    if (nextPost.image_url && !this.preloadedImages.has(nextPost.image_url)) {
      this.preloadImage(nextPost.image_url);
    }

    // ویدیو thumbnail رو preload کن
    if (nextPost.video_url && !this.preloadedImages.has(nextPost.video_url)) {
      this.preloadImage(nextPost.video_url);
    }

    // کامنت‌ها رو preload کن (در background)
    this.preloadComments(nextPost.id).catch(console.error);
  }

  private preloadImage(url: string) {
    if (this.preloadedImages.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);

    // همچنین با Image object preload کن
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.preloadedImages.add(url);
    };
  }

  private async preloadComments(postId: string) {
    try {
      await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .limit(5);
    } catch (error) {
      // Silent fail - preloading is optional
      console.debug('Failed to preload comments:', error);
    }
  }

  // Preload چند پست بعدی
  preloadBatch(posts: Post[], startIndex: number, count: number = 3) {
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


