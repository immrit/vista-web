import { apiClient } from './apiClient';

type UploadKind = 'image' | 'video' | 'music' | 'avatar' | 'story';

interface PresignResponse {
  url: string;
  method: string;
  headers?: Record<string, string>;
  object_key: string;
  object_url: string;
}

const uploadRules: Record<UploadKind, { prefix: string; maxSize: number; mimeTypes: string[]; error: string }> = {
  image: {
    prefix: 'posts',
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    error: 'فقط فایل‌های تصویری (jpg, jpeg, png, gif, webp) پشتیبانی می‌شوند',
  },
  video: {
    prefix: 'videos',
    maxSize: 50 * 1024 * 1024,
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-matroska'],
    error: 'فقط فایل‌های ویدیویی (mp4, mov, mkv) پشتیبانی می‌شوند',
  },
  music: {
    prefix: 'music',
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/m4a'],
    error: 'فقط فایل‌های صوتی (mp3, m4a) پشتیبانی می‌شوند',
  },
  avatar: {
    prefix: 'avatars',
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    error: 'فقط فایل‌های تصویری (jpg, jpeg, png, gif, webp) پشتیبانی می‌شوند',
  },
  story: {
    prefix: 'stories',
    maxSize: 30 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'],
    error: 'فقط تصویر یا ویدیو برای استوری پشتیبانی می‌شود',
  },
};

function sanitizeExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return fromName || UploadService.getFileExtension(file.type);
}

function objectKeyFor(kind: UploadKind, file: File, userId: string) {
  const rule = uploadRules[kind];
  const extension = sanitizeExtension(file);
  const unique = `${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  return `${rule.prefix}/${userId}/${unique}.${extension}`;
}

async function uploadWithBackend(file: File, userId: string, kind: UploadKind) {
  const rule = uploadRules[kind];
  if (!rule.mimeTypes.includes(file.type)) {
    throw new Error(rule.error);
  }
  if (file.size > rule.maxSize) {
    throw new Error(`حجم فایل باید کمتر از ${Math.round(rule.maxSize / 1024 / 1024)} مگابایت باشد`);
  }

  const presign = await apiClient.post<PresignResponse>('/v1/uploads/presign', {
    object_key: objectKeyFor(kind, file, userId),
    content_type: file.type,
  });

  const uploadResponse = await fetch(presign.url, {
    method: presign.method || 'PUT',
    headers: presign.headers || { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('آپلود فایل با شکست مواجه شد');
  }

  return presign.object_url;
}

function objectKeyFromUrl(fileUrl: string) {
  try {
    const path = new URL(fileUrl).pathname.replace(/^\/+/, '');
    const roots = ['avatars/', 'posts/', 'stories/', 'chat/', 'music/', 'videos/'];
    for (const root of roots) {
      const index = path.indexOf(root);
      if (index >= 0) return path.slice(index);
    }
  } catch {
    return '';
  }
  return '';
}

export class UploadService {
  static uploadImage(file: File, userId: string) {
    return uploadWithBackend(file, userId, 'image');
  }

  static uploadVideo(file: File, userId: string) {
    return uploadWithBackend(file, userId, 'video');
  }

  static uploadMusic(file: File, userId: string) {
    return uploadWithBackend(file, userId, 'music');
  }

  static uploadAvatar(file: File, userId: string) {
    return uploadWithBackend(file, userId, 'avatar');
  }

  static uploadStory(file: File, userId: string) {
    return uploadWithBackend(file, userId, 'story');
  }

  static async deleteFile(fileUrl: string): Promise<boolean> {
    const objectKey = objectKeyFromUrl(fileUrl);
    if (!objectKey) return false;

    try {
      await apiClient.post('/v1/uploads/delete', { object_key: objectKey });
      return true;
    } catch (error) {
      console.error('خطا در حذف فایل:', error);
      return false;
    }
  }

  static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-matroska': 'mkv',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/m4a': 'm4a',
    };
    return extensions[mimeType] || 'bin';
  }
}
