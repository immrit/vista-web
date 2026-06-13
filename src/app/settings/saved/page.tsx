'use client'

import { SettingsPageShell } from '@/components/settings/VistaSettingsWidgets'
import { useSavedPosts } from '@/hooks/useSettingsData'
import { normalizePost } from '@/lib/backendApi'
import { PostCard } from '@/components/ui/PostCard'
import { Bookmark } from 'lucide-react'

export default function SavedPostsPage() {
  const { data, isLoading } = useSavedPosts()
  const posts = (data || []).map(p => normalizePost(p as Parameters<typeof normalizePost>[0]))

  return (
    <SettingsPageShell title="ذخیره‌شده‌ها">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 mx-auto mb-4 text-vista-text-secondary" />
          <p className="font-semibold">پست ذخیره‌شده‌ای ندارید</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} showComments />
          ))}
        </div>
      )}
    </SettingsPageShell>
  )
}
